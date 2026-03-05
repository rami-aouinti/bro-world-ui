import type { UUID } from './common'

export interface ApiKey {
  id: UUID
  token: string
  description: string
}

export interface CreateApiKeyPayload {
  token: string
  description: string
}

export type UpdateApiKeyPayload = CreateApiKeyPayload

export type PatchApiKeyPayload = Partial<UpdateApiKeyPayload>
