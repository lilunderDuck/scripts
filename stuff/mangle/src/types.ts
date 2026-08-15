type DeepPartial<T> = T extends Array<infer U>
  ? Array<DeepPartial<U>>
  : T extends object
  ? { [K in keyof T]?: DeepPartial<T[K]> }
  : T;

export type MangleConfig = {
  srcDir: string
  props?: Partial<{
    manualMangle: string[]
  }>
}

export interface IManglePreset {
  messWithConfig(config: MangleConfig): void
  discover(fileContent: string): void
  mangle(fileContent: string): string
}

export interface IMangleContext {
  mangleMapping: Map<string, string>
}

export type ManglePresetConstructor = new (context: IMangleContext) => IManglePreset