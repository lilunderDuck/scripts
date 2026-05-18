import { readFileSync } from "node:fs"
import { panic } from "./logging"
import path from "node:path"

export function mustReadJsonConfig<T extends any>(jsonConfigName: string): T {
  const jsonConfigLocation = process.argv[1]
  try {
    if (jsonConfigLocation && !jsonConfigLocation.includes(jsonConfigName)) {
      panic(`Your config file must be named: ${jsonConfigName}, currently your config file name is "${path.basename(jsonConfigLocation!)}" in ${jsonConfigLocation}`)
    }

    return JSON.parse(
      readFileSync(
        jsonConfigLocation ? jsonConfigLocation : jsonConfigName, 
        { encoding: "utf-8" }
      )
    )
  } catch (error) {
    return panic(`Failed to read ${jsonConfigName}: ${error}`) as T // just to trick typescript
  }
}