import { context } from "../context";
import { randomCharGenerator } from "../utils";
import type { Preset } from "../types";

const PROPS_ENDS_WITH_DOLLAR_SIGN = /[a-zA-Z0-9_]+\$/gm
export function propsEndWithDollarSignPreset(): Preset {
  const randomGenerator = randomCharGenerator(2)
  return {
    discover(fileContent) {
      const result = fileContent.match(PROPS_ENDS_WITH_DOLLAR_SIGN)
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

        if (!context.mangleMapping.has(prop)) {
          const randomValue = randomGenerator.next().value!
          context.mangleMapping.set(prop, randomValue)
          console.log(`| Map: \t\t\t${prop} -> ${randomValue}`)
          continue
        }

        console.log(`| Already mapped: \t${prop}`)
      }
    },
    mangle(fileContent) {
      let newFileContent = fileContent
      for (const [originalProp, mangledProp] of context.mangleMapping) {
        newFileContent = newFileContent.replaceAll(originalProp, mangledProp)
      }

      return newFileContent
    },
  }
}