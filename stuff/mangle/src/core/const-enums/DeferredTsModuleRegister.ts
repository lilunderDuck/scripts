import { babelParse, getLang, isTs } from "ast-kit"
import { type Expression, type PrivateName, type Program, type TSEnumDeclaration } from "@babel/types"
import fg from "fast-glob"
import path from "node:path"
import { readFile } from "node:fs/promises"
// ...
import type { IConstEnumCommonDeclaration, IConstEnumMemberValue, IInlineConstEnumOptions, IModuleSpecifier } from "./types"
import { makeEnumSpecifier, removeExtension } from "./utils"
import type { EnumCollection } from "./EnumCollection"

interface ITsModule {
  moduleSpecifier: IModuleSpecifier
  ast: Program
}

type DeferredTask = Map<string, () => void>

export class DeferredTsModuleRegister {
  private tsModules: ITsModule[] = []
  private readonly deferredTasks: DeferredTask = new Map()
  private readonly toBeDeterminedSpecifiers = new Set<string>()

  constructor(
    protected readonly config: IInlineConstEnumOptions,
    protected readonly enumCollection: EnumCollection
  ) {}

  public async loadTsModulesAsync(): Promise<void> {
    const files = await fg.async(this.config.sourcePattern!, { cwd: this.config.sourceDir })
    const tsFiles = files.filter((f) => isTs(getLang(f)))

    this.tsModules = await Promise.all(
      tsFiles.map(async (file) => {
        const fullPath = path.resolve(this.config.sourceDir!, file)
        const code = await readFile(fullPath, "utf-8")
        return {
          moduleSpecifier: removeExtension(fullPath),
          ast: babelParse(code, getLang(file)),
        }
      })
    )
  }

  public scanForConstEnums(): void {
    let prevPendingSize: number
    do {
      prevPendingSize = this.toBeDeterminedSpecifiers.size
      this.buildConstEnumDeclarations()

      // Execute deferred tasks
      const tasks = Array.from(this.deferredTasks.values())
      this.deferredTasks.clear()
      tasks.forEach((task) => task())
    } while (this.deferredTasks.size > 0 || this.toBeDeterminedSpecifiers.size !== prevPendingSize)

    if (this.config.debug) this.enumCollection.printMapping()
  }

  private buildConstEnumDeclarations(): void {
    for (const { moduleSpecifier, ast } of this.tsModules) {
      for (const node of ast.body) {
        // const enum CE_XXX { ... }
        if (node.type === "TSEnumDeclaration" && node.const) {
          this.registerEnum(node, moduleSpecifier)
        }
        // export const enum CE_XXX { ... }
        else if (
          node.type === "ExportNamedDeclaration" &&
          node.declaration?.type === "TSEnumDeclaration" &&
          node.declaration.const
        ) {
          this.registerEnum(node.declaration, moduleSpecifier)
          this.registerExport(node.declaration.id.name, node.declaration.id.name, moduleSpecifier)
        }
        // export { ... } / import ...
        else if (node.type === "ExportNamedDeclaration" && node.specifiers) {
          for (const spec of node.specifiers) {
            if (spec.type === "ExportSpecifier" && spec.exportKind === "value") {
              const localName = spec.local.name
              const exportedName = spec.exported.type === "Identifier" ? spec.exported.name : spec.exported.value
              if (node.source) {
                const targetMod = this.resolveModule(node.source.value, moduleSpecifier)
                this.registerImport(localName, localName, moduleSpecifier, targetMod)
              }
              this.registerExport(localName, exportedName, moduleSpecifier)
            }
          }
        } else if (node.type === "ImportDeclaration" && node.importKind === "value") {
          const targetMod = this.resolveModule(node.source.value, moduleSpecifier)
          for (const spec of node.specifiers) {
            const localName = spec.local.name
            const importedName =
              spec.type === "ImportDefaultSpecifier"
                ? "default"
                : spec.imported.type === "Identifier"
                ? spec.imported.name
                : spec.imported.value
            this.registerImport(localName, importedName, moduleSpecifier, targetMod)
          }
        }
      }
    }
  }

  private registerEnum(node: TSEnumDeclaration, moduleSpecifier: IModuleSpecifier): void {
    const enumName = node.id.name
    if (this.enumCollection.hasEnumDeclaration(moduleSpecifier, enumName)) return

    const taskKey = makeEnumSpecifier(moduleSpecifier, enumName)
    const declaration: IConstEnumCommonDeclaration = { definition: new Map() }
    let itemIndex = 0

    for (const member of node.members) {
      const memberName = member.id.type === "Identifier" ? member.id.name : member.id.value
      let value: IConstEnumMemberValue | null = null

      if (member.initializer) {
        value = this.evaluateExpression(member.initializer, moduleSpecifier, enumName, memberName, declaration.definition)
        if (value === null) {
          this.deferredTasks.set(taskKey, () => this.registerEnum(node, moduleSpecifier))
          return
        }
        if (typeof value === "number") itemIndex = value
      } else {
        value = itemIndex
      }

      declaration.definition.set(memberName, value)
      itemIndex++
    }

    this.enumCollection.setEnumDeclaration(moduleSpecifier, enumName, declaration)
  }

  private registerImport(
    localName: string,
    importedName: string,
    mod: string,
    fromMod: string
  ): void {
    if (this.enumCollection.hasEnumDeclaration(mod, localName)) return
    const specifier = makeEnumSpecifier(mod, localName)

    if (this.enumCollection.hasEnumDeclaration(fromMod, importedName)) {
      this.toBeDeterminedSpecifiers.delete(specifier)
      this.enumCollection.setEnumDeclaration(mod, localName, { from: fromMod, name: importedName })
    } else {
      this.toBeDeterminedSpecifiers.add(specifier)
    }
  }

  private registerExport(localName: string, exportedName: string, mod: string): void {
    if (this.enumCollection.hasEnumDeclaration(mod, exportedName)) return
    const specifier = makeEnumSpecifier(mod, localName)

    if (this.enumCollection.hasEnumDeclaration(mod, localName)) {
      this.toBeDeterminedSpecifiers.delete(specifier)
      this.enumCollection.setExportedEnum(mod, localName, exportedName)
    } else {
      this.toBeDeterminedSpecifiers.add(specifier)
    }
  }

  private resolveModule(source: string, currentMod: string): string {
    const cleanSource = isTs(getLang(source)) ? removeExtension(source) : source
    return cleanSource.startsWith(".")
      ? path.resolve(path.dirname(currentMod), cleanSource)
      : cleanSource
  }

  private evaluateExpression(
    node: Expression | PrivateName,
    mod: string,
    enumName: string,
    memberName: string,
    definition: Map<string, IConstEnumMemberValue>
  ): IConstEnumMemberValue | null {
    if (node.type === "NumericLiteral" || node.type === "StringLiteral") return node.value

    // intentional totally controlled arbitrary code execution inside a vite plugin
    if (node.type === "UnaryExpression") {
      const arg = this.evaluateExpression(node.argument, mod, enumName, memberName, definition)
      return arg !== null ? new Function(`return ${node.operator} ${JSON.stringify(arg)}`)() : null
    }

    if (node.type === "BinaryExpression") {
      const left = this.evaluateExpression(node.left, mod, enumName, memberName, definition)
      const right = this.evaluateExpression(node.right, mod, enumName, memberName, definition)
      return left !== null && right !== null
        ? new Function(`return ${JSON.stringify(left)} ${node.operator} ${JSON.stringify(right)}`)()
        : null
    }

    if (node.type === "MemberExpression" && node.object.type === "Identifier" && node.property.type === "Identifier") {
      return node.object.name === enumName
        ? definition.get(node.property.name) ?? null
        : this.enumCollection.getEnumValues(mod, node.object.name, node.property.name)
    }

    if (node.type === "Identifier") return definition.get(node.name) ?? null

    throw new TypeError(`Unsupported const enum member "${enumName}.${memberName}" in ${mod}`)
  }
}