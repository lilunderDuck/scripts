import type { PluginOption } from "vite"
// ...
import { 
  InlineConstEnum,
  PropsWithDollarSign
} from "./presets"
import type { IManglePreset, MangleConfig } from "./types"

export function jsMesser5000Plugin(config: MangleConfig): PluginOption {
  const ALL_PRESET = [
    ["props-end-with-dollar-sign", new PropsWithDollarSign()],
    ["inline-const-enum", new InlineConstEnum()]
  ] satisfies [string, IManglePreset][]

  // function name is a soft-reference to fabric-lifecycle-events-v1 module
  const dispatchPresetEventLifecycleHook = async <T extends keyof IManglePreset>(name: T, ...args: Parameters<IManglePreset[T]>) => {
    for (const [presetName, preset] of ALL_PRESET) {
      // @ts-ignore
      await preset[name](...args)
    }
  }

  dispatchPresetEventLifecycleHook('settingUpConfig', config)

  return {
    name: 'vite-plugin-js-messer-5000',
    apply: "build",
    async buildStart() {
      await dispatchPresetEventLifecycleHook('onBuildStart')
    },
    async transform(code, id) {
      const SHOULD_MESS = id.includes(config.srcDir) && (
        id.endsWith('.js') || 
        id.endsWith('.ts') || 
        id.endsWith('.jsx') || 
        id.endsWith('.tsx')
      )

      if (SHOULD_MESS) {
        const fileDataRef = { fileId: id, fileContent: code }
        await dispatchPresetEventLifecycleHook('onDiscover', fileDataRef)
        await dispatchPresetEventLifecycleHook('onTransform', fileDataRef)
        return {
          code: fileDataRef.fileContent,
          map: null // don't wanna deal with source maps, for now
        }
      }
    }
  }
}