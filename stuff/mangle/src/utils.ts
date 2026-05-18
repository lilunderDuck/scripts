import { readdirSync, readFileSync } from "node:fs"
import { context } from "./context"

function generateCombinations(chars: string, length: number, startIndex: number): string[] {
  if (length === 0) return ['']
  const combinations = []
  const smallerCombinations = generateCombinations(chars, length - 1, 0)
  for (let i = startIndex; i < chars.length; i++) {
    for (const smallerCombination of smallerCombinations) {
      combinations.push(chars[i] + smallerCombination)
    }
  }
  return combinations
}

export function* randomCharGenerator(length: number) {
  for (const char of generateCombinations("_qwertyuiopasdfghjklzxcvbnm", length, 0)) {
    yield char
  }
}

export type FileData = {
  name: string
  content: string
  newContent?: string
}

export function getAllFiles(targetDir: string) {
  for (const fileName of readdirSync(targetDir)) {
    if (!(fileName.endsWith(".css") || fileName.endsWith(".js"))) {
      console.log("Skip: \t", `${targetDir}/${fileName}`)
      continue
    }

    try {
      const filePathToRead = `${targetDir}/${fileName}`
      console.log("Read: \t", filePathToRead)
      context.fileContentMapping.set(
        fileName, 
        readFileSync(filePathToRead, { encoding: 'utf-8' })
      )
    } catch(error) {
      console.error(error)
    }
  }
}

export function sortedMapFromLongestToShortest<T extends Map<string, any>>(map: T): T {
  const sortedArray = Array.from(map).sort((a, b) => {
    return b[0].length - a[0].length
  });

  return new Map(sortedArray) as T
}