import type { ConstConfigFile, ValidEnum, ValidEnumValue } from "./consts_config"
import { mkdirSync, readFileSync, writeFileSync } from "node:fs"

// Don't ask me, but most of the funcitons here are all have side-effects
// I need coffee

type ConstsMapping = (
  { type: "constEnum", name: string, prop: ValidEnum } |
  { type: "const", name: string, value: any, valueType: string }
)[]

const GLOBAL = {
  mapping: [] as ConstsMapping,
  definedMapping: new Map<string, ValidEnumValue>(),
  fileContent: "// this file is auto-generated when on dev/build mode\n"
}

export function addToMapping<const T extends string>(name: T, value: ValidEnumValue) {
  GLOBAL.definedMapping.set(name, value)
  console.log(`Define:\t\t${name} = ${value}`)
}

export function appendContent<const T extends string>(something: T) {
  GLOBAL.fileContent += something
}

export function readConfigFile(): ConstConfigFile {
  return JSON.parse(readFileSync("./consts_config.json", {
    encoding: "utf-8"
  }))
}

export function saveTypeDef() {
  mkdirSync("./build/dist", { recursive: true })
  writeFileSync("./build/dist/consts.d.ts", `declare global {\n\t${GLOBAL.fileContent}\n}; export {}`)
}

export function getMapping() {
  if (GLOBAL.definedMapping.size == 0) {
    throw new Error("you called too early! consts haven't been generated yet")
  }

  return GLOBAL.definedMapping
}