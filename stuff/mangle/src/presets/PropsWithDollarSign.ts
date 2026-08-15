import { randomCharGenerator } from "../utils"
import type { MangleConfig, IMangleContext, IManglePreset } from "../types"

export class PropsWithDollarSign implements IManglePreset {
  readonly RANDOM_GENERATOR = randomCharGenerator(2)
  readonly PROPS_ENDS_WITH_DOLLAR_SIGN = /[a-zA-Z0-9_]+\$/gm
  constructor(protected context: IMangleContext) {}

  messWithConfig(config: MangleConfig): void {
    if (config.props?.manualMangle?.length == 0) return

    for (const propName of config.props!.manualMangle!) {
      const randomValue = this.RANDOM_GENERATOR.next().value!
      this.context.mangleMapping.set(propName, randomValue)
    }
  }

  discover(fileContent: string): void {
    const result = fileContent.match(this.PROPS_ENDS_WITH_DOLLAR_SIGN)
    if (!result) {
      console.log("| No prop needs to be mangled, skipping")
      return
    }
    console.log(`| Found`, result.length, "props that need to be mangled.")
    
    for (const prop of result) {
      if (prop.length <= 2) {
        console.log(`| Skip prop: \t${prop}, it's already short enough.`)
        continue
      }

      if (!this.context.mangleMapping.has(prop)) {
        const randomValue = this.RANDOM_GENERATOR.next().value!
        this.context.mangleMapping.set(prop, randomValue)
        console.log(`| Map: \t\t\t${prop} -> ${randomValue}`)
        continue
      }

      console.log(`| Already mapped: \t${prop}`)
    }
  }

  mangle(fileContent: string): string {
    let newFileContent = fileContent
    for (const [originalProp, mangledProp] of this.context.mangleMapping) {
      newFileContent = newFileContent.replaceAll(originalProp, mangledProp)
    }

    return newFileContent
  }
}