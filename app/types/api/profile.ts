import type { UUID } from './common'

export interface Profile {
  id: UUID
  username: string
  firstName: string
  lastName: string
  email: string
  language?: string
  locale?: string
  timezone: string
}

export interface UpdateProfilePayload {
  firstName: string
  lastName: string
  email: string
  language?: string
  locale?: string
  timezone: string
}

export type PatchProfilePayload = Partial<UpdateProfilePayload>
