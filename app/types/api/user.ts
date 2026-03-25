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
  photo?: string
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

export interface SessionResponse {
  authenticated: boolean
  profile: UserProfile | null
  roles: string[]
  locale: string | null
  /**
   * `healthy`: cookie + backend token validation succeeded.
   * `degraded`: local session kept while backend validation is temporarily unavailable (5xx/timeout).
   * `invalid`: no valid local session (missing cookie or backend returned 401/403).
   */
  sessionStatus?: 'healthy' | 'degraded' | 'invalid'
  expiresAt?: string
}

export type CreateUserPayload = UserWrite

export type UpdateUserPayload = UserWrite

export type PatchUserPayload = Partial<UpdateUserPayload>
