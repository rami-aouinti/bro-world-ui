import type { UUID } from './common'

export interface Localization {
  id: UUID
  code: string
  name: string
  nativeName?: string
  enabled?: boolean
}

export interface CreateLocalizationPayload {
  code: string
  name: string
  nativeName?: string
  enabled?: boolean
}

export type UpdateLocalizationPayload = CreateLocalizationPayload

export type PatchLocalizationPayload = Partial<UpdateLocalizationPayload>
