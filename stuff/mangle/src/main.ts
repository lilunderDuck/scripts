import { writeFileSync } from "node:fs"
// ...
import { warnLog } from "../../logging"
import { context } from "./context"
import { getAllFiles, sortedMapFromLongestToShortest } from "./utils"
import { 
  propsEndWithDollarSignPreset 
} from "./presets"
import type { PresetHandlerFn } from "./types"
import { mustReadJsonConfig } from "../../json_config"

interface IMangleConfig {
  targetDir: string
  preset: string[]
}

const builtinPreset: Record<string, PresetHandlerFn> = {
  "propsEndWithDollarSign": propsEndWithDollarSignPreset
}

function mangle(config: IMangleConfig) {
  getAllFiles(config.targetDir)

  for (const preset of config.preset) {
    const presetHandler = builtinPreset[preset]
    if (!presetHandler) {
      warnLog(`Preset ${preset} not found, ignoring...`)
      continue
    }

    for (const [fileName, content] of context.fileContentMapping) {
      console.log("Discovering\t", fileName)
      presetHandler().discover(content)
    }
  }

  context.mangleMapping = sortedMapFromLongestToShortest(context.mangleMapping)

  for (const preset of config.preset) {
    const presetHandler = builtinPreset[preset]
    if (!presetHandler) {
      warnLog(`Preset ${preset} not found, ignoring...`)
      continue
    }

    for (const [fileName, content] of context.fileContentMapping) {
      console.log("Mangling\t", fileName)
      const newFileContent = presetHandler().mangle(content)
      writeFileSync(`${config.targetDir}/${fileName}`, newFileContent)
    }
  }

  console.log("All of the names are belong to the ducks.")
}

mangle(mustReadJsonConfig<IMangleConfig>("mangle.json"))