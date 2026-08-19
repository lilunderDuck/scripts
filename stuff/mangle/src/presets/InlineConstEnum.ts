import MagicString from "magic-string"
import { babelParse, getLang } from "ast-kit"
import { traverseFast } from "@babel/types"
// ...
import type { IMangleFileData, IManglePreset, MangleConfig } from "../types"
import { DeferredTsModuleRegister, EnumCollection, isValidConstEnumMemberValue, printLog, removeExtension, resolveOptions, type IInlineConstEnumOptions } from "../core/const-enums"

export class InlineConstEnum implements IManglePreset {
  private config!: IInlineConstEnumOptions
  private enumCollection!: EnumCollection
  private deferredEnumRegister!: DeferredTsModuleRegister

  constructor() {}

  public settingUpConfig(config: MangleConfig): void {
    const resolvedConfig = resolveOptions(config.constEnum!)
    this.enumCollection = new EnumCollection(resolvedConfig)
    this.deferredEnumRegister = new DeferredTsModuleRegister(resolvedConfig, this.enumCollection)
    this.config = resolvedConfig
  }

  public async onBuildStart(): Promise<void> {
    await this.deferredEnumRegister.loadTsModulesAsync()
    this.deferredEnumRegister.scanForConstEnums()
  }

  public onDiscover(thisData: IMangleFileData): void {
    // nothing
  }

  public onTransform(file: IMangleFileData): string {
    const strCode = new MagicString(file.fileContent);
    const ast = babelParse(file.fileContent, getLang(file.fileId));
    const moduleSpecifier = removeExtension(file.fileId);

    traverseFast(ast, (node) => {
      if (
        node.type === "MemberExpression" &&
        node.object.type === "Identifier" &&
        node.property.type === "Identifier"
      ) {
        const enumName = node.object.name;
        const memberName = node.property.name;
        const enumValue = this.enumCollection.getEnumValues(moduleSpecifier, enumName, memberName);

        if (isValidConstEnumMemberValue(enumValue)) {
          if (this.config.debug) {
            printLog(`Inlining: ${enumName}.${memberName} => ${JSON.stringify(enumValue)} in ${moduleSpecifier}`);
          }
          strCode.overwrite(node.start!, node.end!, JSON.stringify(enumValue));
        }
      }
    });

    return strCode.toString();
  }
}