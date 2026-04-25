import { mkdirSync, readFileSync, writeFileSync } from "node:fs"

type EnumOption = {
  type: "enum"
  name: string
  members: string[] | Record<string, number>[]
}

type ConstOption = {
  type: "const"
  name: string
  value: string
}

type ConstConfigOption = EnumOption | ConstOption
type ConstConfigFile = ConstConfigOption[]

type ValidEnumValue = string | number
type ValidEnum = Record<string, ValidEnumValue>
type ConstsMapping = (
  { type: "constEnum", name: string, prop: ValidEnum } |
  { type: "const", name: string, value: any, valueType: string }
)[]

const GLOBAL = {
  mapping: [] as ConstsMapping,
  definedMapping: new Map<string, ValidEnumValue>(),
  fileContent: "// this file is auto-generated when on dev/build mode\n"
}

function generateConstEnums(config: EnumOption) {
  let entries: [string, ValidEnumValue][] = Object.entries(config.members)
  if (Array.isArray(config.members)) {
    const propMapping: Record<string, ValidEnumValue> = {}
    for (let i = 0; i < config.members.length; i++) {
      const propName = config.members[i] as string
      // Each properties of the enum will be assigned by the index
      propMapping[propName] = i
    }

    entries = Object.entries(config.members)
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
    appendContent(`\t${enumPropName} = ${enumPropValue},\n`)
    addToMapping(`${enumName}.${enumPropName}`, enumPropValue)
  }

  appendContent(`enum ${enumName} {\n${enumContent}\n}`)
}

function generateConsts(config: ConstOption) {
  appendContent(`declare const ${config.name}: ${config.value};\n`)
  addToMapping(config.name, config.value)
}

function addToMapping<const T extends string>(name: T, value: ValidEnumValue) {
  GLOBAL.definedMapping.set(name, value)
  console.log(`Define:\t\t${name} = ${value}`)
}

function appendContent<const T extends string>(something: T) {
  GLOBAL.fileContent += something
}

function readConfigFile(): ConstConfigFile {
  return JSON.parse(readFileSync("./consts_config.json", {
    encoding: "utf-8"
  }))
}

export function generateTypeThenSave() {
  const configFile = readConfigFile()
  for (const config of configFile) {
    switch (config.type) {
      case "enum":
        generateConstEnums(config)
      break

      case "const":
        generateConsts(config)
      break
    
      default:
        break;
    }
  }

  mkdirSync("./build/dist", { recursive: true })
  writeFileSync("./build/dist/consts.d.ts", `declare global {\n\t${GLOBAL.fileContent}\n}; export {}`)
}

export function getMapping() {
  if (GLOBAL.definedMapping.size == 0) {
    throw new Error("you called too early! consts haven't been generated yet")
  }

  return GLOBAL.definedMapping
}

if (import.meta.main) {
  generateTypeThenSave()
}