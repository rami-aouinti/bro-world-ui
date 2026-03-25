import type { UUID } from './common'
import type { UserGroup } from './userGroup'

export interface UserRead {
  id: UUID
  username: string
  firstName: string
  lastName: string
  email: string
  language?: string
  locale?: string
  timezone: string
  photo?: string
}

export interface UserWrite {
  username: string
  firstName: string
  lastName: string
  email: string
  password?: string
  language?: string
  locale?: string
  timezone: string
  photo?: string
}

export interface AttachUserGroupPayload {
  user: UUID
  userGroup: UUID
}

export type UserRolesResponse = string[]

export type UserGroupsResponse = UserGroup[]

export interface UserProfile {
  id: UUID
  username: string
  firstName: string
  lastName: string
  email: string
  language?: string
  locale?: string
  timezone: string
  photo?: string
  roles: string[]
  userGroups?: string[]
}

export interface UserMeProfileDetails {
  title?: string
  information?: string
  gender?: string
  birthday?: string
  location?: string
  phone?: string
}

export interface UserSocial {
  provider: string
  providerId: string
}

export interface UserSession {
  id?: UUID
  icon?: string
  title?: string
  description?: string
  badge?: string
  city?: string
  ip?: string
  userAgent?: string
  createdAt?: string
  lastSeenAt?: string
  current?: boolean
}

export interface UserApplication {
  id: UUID
  platformId: UUID
  platformName: string
  title: string
  slug: string
  description?: string
  status: string
  private: boolean
  createdAt?: string
  updatedAt?: string
}

export interface UserMeRead {
  id: UUID
  username: string
  email: string
  firstName: string
  lastName: string
  language?: string
  locale?: string
  timezone?: string
  photo?: string
  roles?: string[]
  userGroups?: string[]
  profile?: UserMeProfileDetails
  socials: UserSocial[]
  sessions: UserSession[]
  applications?: UserApplication[]
  friends?: UserFriendRead[]
  friendRequests?: UserFriendRead[]
  blockedUsers?: UserFriendRead[]
  incomingRequests?: UserFriendRead[]
}

export interface UserFriendRead {
  id: UUID
  username: string
  firstName: string
  lastName: string
  photo: string | null
}

export interface UserMePasswordPayload {
  currentPassword: string
  newPassword: string
}

export type UserMeProfilePayload = Partial<UserMeProfileDetails & {
  firstName: string
  lastName: string
  email: string
}>

export type SessionStatus = 'healthy' | 'degraded' | 'invalid'

export interface SessionResponse {
  authenticated: boolean
  profile: UserProfile | null
  roles: string[]
  locale: string | null
  /**
   * Source d'autorité: `/api/v1/users/me`.
   * - `healthy`: validation backend confirmée et profil auth chargé depuis `/api/v1/users/me`.
   * - `degraded`: session locale conservée quand le backend est indisponible (5xx/timeout), sans logout.
   * - `invalid`: session invalide confirmée uniquement après 401/403 backend.
   *
   * Politique d'exploitation:
   * - logout uniquement sur `invalid` issu d'un 401/403 backend confirmé.
   * - ne jamais invalider la session sur erreur backend 5xx/transitoire.
   */
  sessionStatus?: SessionStatus
  expiresAt?: string
}

export type CreateUserPayload = UserWrite

export type UpdateUserPayload = UserWrite

export type PatchUserPayload = Partial<UpdateUserPayload>
