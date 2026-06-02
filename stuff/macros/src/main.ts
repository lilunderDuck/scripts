import { defineMacroProvider, vitePluginMacro } from "vite-plugin-macro"
// ...
import { infoLog, errorLog, warnLog, randomString, randomNumber } from "./core"

export function macroPlugin(generatedTypeFilePath: string, debugMode: boolean) {
  const MACRO_EXPORTS = {
    'macro-def': {
      macros: [
        randomString,
        randomNumber,
        infoLog(debugMode),
        warnLog(debugMode),
        errorLog(debugMode),
      ],
    }
  }

  const macroProvider = defineMacroProvider({
    id: 'idk man',
    exports: MACRO_EXPORTS,
  })

  return vitePluginMacro({
    typesPath: generatedTypeFilePath,
  })
    .use(macroProvider)
    .toPlugin()
  // ...
}