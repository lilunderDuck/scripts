import type { PluginOption } from "vite"
import { 
  PropsWithDollarSign
} from "./presets"
import type { IMangleContext, IManglePreset, MangleConfig } from "./types"

export function jsMesser5000Plugin(config: MangleConfig): PluginOption {
  const CONTEXT = {
    mangleMapping: new Map<string, string>()
  } satisfies IMangleContext

  const PRESET = [
    ["props-end-with-dollar-sign", new PropsWithDollarSign(CONTEXT)]
  ] satisfies [string, IManglePreset][]

  const runPresetLifecycleHook = (fileContent: string) => {
    let workingFileContent = fileContent
    for (const [presetName, preset] of PRESET) {
      console.log("Running preset for:", presetName)
      preset.messWithConfig(config)
      preset.discover(workingFileContent)
      workingFileContent = preset.mangle(workingFileContent)
    }

    return workingFileContent
  }

  return {
    name: 'vite-plugin-js-messer-5000',
    apply: "build",
    transform(code, id) {
      const SHOULD_MESS = id.includes(config.srcDir) && (
        id.endsWith('.js') || 
        id.endsWith('.ts') || 
        id.endsWith('.jsx') || 
        id.endsWith('.tsx')
      )

      if (SHOULD_MESS) {
        return {
          code: runPresetLifecycleHook(code),
          map: null // Pass null if you don't want to deal with source maps for now
        }
      }
    }
  }
}