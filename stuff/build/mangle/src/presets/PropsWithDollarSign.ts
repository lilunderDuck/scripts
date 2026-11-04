import { randomCharGenerator } from "../utils"
import type { MangleConfig, IManglePreset, IMangleFileData } from "../types"

export class PropsWithDollarSign implements IManglePreset {
  readonly RANDOM_GENERATOR = randomCharGenerator(2)
  readonly PROPS_ENDS_WITH_DOLLAR_SIGN = /[a-zA-Z0-9_]+\$/gm
  readonly CONTEXT = {
    mangleMapping: new Map<string, string>()
  }
  constructor() {}

  public settingUpConfig(config: MangleConfig): void {
    if (config.props?.manualMangle?.length == 0) return

    for (const propName of config.props!.manualMangle!) {
      const randomValue = this.RANDOM_GENERATOR.next().value!
      this.CONTEXT.mangleMapping.set(propName, randomValue)
    }
  }

  public onBuildStart(): void {
    // skip
  }

  public onDiscover(file: IMangleFileData): void {
    const result = file.fileContent.match(this.PROPS_ENDS_WITH_DOLLAR_SIGN)
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

      if (!this.CONTEXT.mangleMapping.has(prop)) {
        const randomValue = this.RANDOM_GENERATOR.next().value!
        this.CONTEXT.mangleMapping.set(prop, randomValue)
        console.log(`| Map: \t\t\t${prop} -> ${randomValue}`)
        continue
      }

      console.log(`| Already mapped: \t${prop}`)
    }
  }

  public onTransform(file: IMangleFileData) {
    for (const [originalProp, mangledProp] of this.CONTEXT.mangleMapping) {
      file.fileContent = file.fileContent.replaceAll(originalProp, mangledProp)
    }
  }
}