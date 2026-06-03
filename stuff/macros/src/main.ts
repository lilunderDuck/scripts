import mTraverse from "@babel/traverse"
import { defineMacroProvider, vitePluginMacro } from "vite-plugin-macro"
// ...
import { infoLog, errorLog, warnLog, randomString, randomNumber } from "./core"

// Nasty hack: bundling and using the plugin causes this error
// import_traverse.default is not a function. (In 'import_traverse.default(ast, {
//   ImportDeclaration(path2) {
//     handler(path2);
//   }
// })', 'import_traverse.default' is an instance of Object)
if (mTraverse && typeof mTraverse === "object" && "default" in mTraverse) {
  // @ts-ignore
  globalThis.import_traverse = { default: mTraverse.default };
}

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