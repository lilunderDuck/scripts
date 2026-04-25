import { mustNotBeEmptyObject, requiresTheseProps } from "./validate"
import { warnLog } from "./logging"
import { addToMapping, appendContent, readConfigFile, saveTypeDef } from "./utils"

export type EnumOption = {
  type: "enum"
  name: string
  members: string[] | Record<string, number>[]
}

export type ConstOption = {
  type: "const"
  name: string
  value: string
}

type ConstConfigOption = EnumOption | ConstOption
export type ConstConfigFile = ConstConfigOption[]

export type ValidEnumValue = string | number
export type ValidEnum = Record<string, ValidEnumValue>

function generateConstEnums(config: EnumOption) {
  let entries: [string, ValidEnumValue][] = Object.entries(config.members)
  if (Array.isArray(config.members)) {
    const propMapping: Record<string, ValidEnumValue> = {}
    for (let i = 0; i < config.members.length; i++) {
      const propName = config.members[i] as string
      // Each properties of the enum will be assigned by the index
      propMapping[propName] = i
    }

    entries = Object.entries(propMapping)
  }

  const enumName = config.name

  // Constructs the enum from the inside first.
  //   const enum MyEnum {
  //      ... everything inside ...
  //   }
  let enumContent = ''
  for (let [enumPropName, enumPropValue] of entries) {
    // wraps it in quotes to ensure valid TypeScript code.
    if (typeof enumPropValue === "string") {
      enumPropValue = `"${enumPropValue}"`
    }

    // Good enough formatting (instead of one single line)
    enumContent += `\t${enumPropName} = ${enumPropValue},\n`
    addToMapping(`${enumName}.${enumPropName}`, enumPropValue)
  }

  appendContent(`enum ${enumName} {\n${enumContent}\n}`)
}

function generateConsts(config: ConstOption) {
  appendContent(`declare const ${config.name}: ${config.value};\n`)
  addToMapping(config.name, config.value)
}

export function generateTypeThenSave() {
  const configFile = readConfigFile()
  for (const config of configFile) {
    painfullyValidateThese(config)

    switch (config.type) {
      case "enum":
        generateConstEnums(config)
      break

      case "const":
        generateConsts(config)
      break

      default:
        // @ts-ignore - exhaustive switch case
        warnLog(`Found unsupported type: "${config.type}", its type definition will not be generated.`)
      break;
    }
  }

  saveTypeDef()
  console.log("Done")
}

function painfullyValidateThese(config: ConstConfigOption) {
  mustNotBeEmptyObject(config)

  switch (config.type) {
    case "const":
      requiresTheseProps(config, {
        "type": "string",
        "name": "string",
        "value": "any"
      })
    break;
    
    case "enum":
      requiresTheseProps(config, {
        "members": ["array", "object"],
        "name": "string",
        "type": "string"
      })
    break
  }
}

if (import.meta.main) {
  generateTypeThenSave()
}