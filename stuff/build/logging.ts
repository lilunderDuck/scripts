export const RESET = "\x1b[0m"
export const Bright = "\x1b[1m"
export const Dim = "\x1b[2m"
export const Underscore = "\x1b[4m"
export const Blink = "\x1b[5m"
export const Reverse = "\x1b[7m"
export const Hidden = "\x1b[8m"

export const FG_BLACK = "\x1b[30m"
export const FG_RED = "\x1b[31m"
export const FG_GREEN = "\x1b[32m"
export const FG_YELLOW = "\x1b[33m"
export const FG_BLUE = "\x1b[34m"
export const FgMagenta = "\x1b[35m"
export const FG_CYAN = "\x1b[36m"
export const FgWhite = "\x1b[37m"

export const BgBlack = "\x1b[40m"
export const BgRed = "\x1b[41m"
export const BgGreen = "\x1b[42m"
export const BgYellow = "\x1b[43m"
export const BgBlue = "\x1b[44m"
export const BgMagenta = "\x1b[45m"
export const BgCyan = "\x1b[46m"
export const BgWhite = "\x1b[47m"

type ColorStr = string

export function formatLog(content: [ColorStr, string]) {
  return content.join("")
}

export function warnLog(...something: any[]) {
  console.error(`${FG_YELLOW}warn${RESET}:`, ...something)
}

export function errorLog(...something: any[]) {
  console.error(`${FG_RED}error${RESET}:`, ...something)
}

export function panic(...something: any[]) {
  console.error(`${FG_RED}panic${RESET}:`, ...something)
  process.exit(1)
}

export function panicThenShowFormatedObject(someObject: object, ...something: any[]) {
  console.error(`${FG_RED}panic${RESET}:`, ...something)
  console.log("Your config:", JSON.stringify(someObject, null, 2))
  process.exit(1)
}