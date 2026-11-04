import type { IInlineConstEnumOptions } from "./core/const-enums";

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
  constEnum?: Required<IInlineConstEnumOptions>
}

export interface IManglePreset {
  settingUpConfig(config: MangleConfig): void
  onBuildStart(): void | Promise<void>
  onDiscover(thisData: IMangleFileData): void
  onTransform(thisData: IMangleFileData): void
}

export interface IMangleFileData {
  fileId: string
  fileContent: string
}

export type ManglePresetConstructor = new () => IManglePreset