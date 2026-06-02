import { defineMacro, type Macro } from "vite-plugin-macro"

const ERR_INVALID_ARGS = (macroName: string) => `${macroName}() requires at least 1 argument, like this
1  | ${macroName}("This is a message!")

Since this macro is mirrored *almost the same* as console.log(), you can pass in as many arguments as you like.
1  | ${macroName}("This is a message!", someVariable, {}, true, ...)

Notes: do not pass any important logic inside this macro, as it will be removed in production.

Avoid code that more or less like this:
1  | ${macroName}("The status is: ", createSomethingVeryImportant())
.. | this will be entirely removed   ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

Instead, do it like this:
1  | const status = createSomethingVeryImportant()
2  | ${macroName}("The status is: ", status)
.. | ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ only removes the debug log
` as const

type ConsoleType = "console.log" | "console.warn" | "console.error" | "console.debug"

function debugLogMacroHandler(
  macroName: string,
  description: string,
  console: ConsoleType,
  labelName: string,
  labelColor: string,
): (debugMode: boolean) => Macro {
  const LOG_LABEL_STYLE = `background-color:${labelColor}; color: black; padding-inline: 5px; border-radius: 6px; font-weight: bold;` as const

  return (debugMode: boolean) => defineMacro(macroName)
    .withSignature("(...something: any[]): void", description)
    .withHandler(({ path }, { template }) => {
      if (debugMode) {
        path.remove()
        return
      }

      const [messageArgs] = path.node.arguments

      if (!messageArgs) {
        throw new SyntaxError(ERR_INVALID_ARGS(macroName))
      }

      path.replaceWith(
        template.statement.ast`
          ${console}(\`%c${labelName}%c \`, "${LOG_LABEL_STYLE}", "", ${{ type: "ArrayExpression", elements: messageArgs }})
        `
      )
    })
  // ...
}

export const infoLog = debugLogMacroHandler(
  'DEBUG_INFO',
  "",
  "console.log",
  "info",
  "#2fbdfa"
)

export const warnLog = debugLogMacroHandler(
  'DEBUG_WARN',
  "",
  "console.warn",
  "warn",
  "#faea3e"
)

export const errorLog = debugLogMacroHandler(
  'DEBUG_ERR',
  "",
  "console.error",
  "error",
  "#ff5a3d"
)