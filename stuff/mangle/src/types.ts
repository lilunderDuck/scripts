export type Preset = {
  discover(fileContent: string): void
  mangle(fileContent: string): string
}

export type PresetHandlerFn = () => Preset