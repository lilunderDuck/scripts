import type { Expression } from "@babel/types"
import { defineMacro, type Macro } from "vite-plugin-macro"

/**Generates a random number between 0 and the specified `bound`.
 *
 * @param bound
 * @returns A random number
 */
export function getRandomNumber(bound: number) {
  return Math.floor(Math.random() * bound)
}

/**Generate a sub-optimial random string within a specified `length`.
 * @see https://stackoverflow.com/a/1349426
 * @see https://stackoverflow.com/questions/1349404/generate-a-string-of-random-characters
*/
function makeId(length: number) {
  const CHARACTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (var i = 0; i < length; i++) {
    result += CHARACTERS.charAt(getRandomNumber(CHARACTERS.length));
  }
  return result
}

type RandomGenerateFn = (length: number) => any

function randomMacroHandler(
  macroName: string,
  signature: string,
  description: string,
  errorMessageIfFailed: string, 
  generateFn: RandomGenerateFn
): Macro {
  const macro = defineMacro(macroName)
    .withSignature(signature, description)
    .withHandler(({ path, args }, { template }) => {
      let [input] = args as Expression[]
      if (!input) {
        throw new SyntaxError(`${macroName}() required 1 argument`)
      }

      if (input.type != "NumericLiteral") {
        throw new SyntaxError(errorMessageIfFailed)
      }

      const length = input.value
      path.replaceWith(
        template.statement.ast(`${generateFn(length)}`)
      )
    })
  // ...
  return macro
}

const ERR_NOTE = `Notes:
Passing a variable or function like:
1  | const length = 10
2  | RANDOM_NUMBER(length)
3  | 
4  | const getLength = () => 10 // get the length from somewhere
5  | RANDOM_NUMBER(getLength())

will also throw an error because the macro runs at compile-time and cannot evaluate dynamic variables. 

You **must** always pass a hardcoded, literal number.
`

const ERR_RND_STRING_INVALID_ARG = `RANDOM_STRING() args[0]: Must be a number.

Make sure that you **only put numbers** inside the first argument, like this:
1  | RANDOM_STRING(10)
.. |    here ------^^

${ERR_NOTE}
`

const ERR_RND_NUMBER_INVALID_ARG = `RANDOM_NUMBER() args[0]: Must be a number.

Make sure that you **only put numbers** inside the first argument, like this:
1  | RANDOM_NUMBER(10)
.. |    here ------^^

${ERR_NOTE}
`

export const randomString = randomMacroHandler(
  'RANDOM_STRING',
  "(length: number): string",
  "Generate a random string",
  ERR_RND_STRING_INVALID_ARG,
  (length) => `"${makeId(length)}"`
)

export const randomNumber = randomMacroHandler(
  'RANDOM_NUMBER',
  "(bound: number): number",
  "Generate a random number within bound",
  ERR_RND_NUMBER_INVALID_ARG,
  (length) => `"${getRandomNumber(length)}"`
)