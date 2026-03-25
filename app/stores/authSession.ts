import { defineStore } from 'pinia'
import type { UserProfile } from '~/types/api/user'
import { getProfilePreferredLocale } from '~/utils/locale'

export type AuthState = 'initializing' | 'authenticated' | 'unauthenticated' | 'degraded'
export type UserProfileSnapshot = Pick<UserProfile, 'id' | 'username' | 'firstName' | 'lastName' | 'email'> & {
  photo?: string
}

export const useAuthSessionStore = defineStore('auth-session', () => {
  const token = ref<string | null>(null)
  const profile = ref<UserProfile | null>(null)
  const userSnapshot = ref<UserProfileSnapshot | null>(null)
  const profilePartial = ref(false)
  const roles = ref<string[]>([])
  const locale = ref<string | null>(null)
  const profileUnavailable = ref(false)
  const sessionStatus = ref<'healthy' | 'degraded' | 'invalid'>('invalid')
  const authState = ref<AuthState>('initializing')
  const toUserSnapshot = (candidate: UserProfile | null): UserProfileSnapshot | null => {
    if (!candidate) {
      return null
    }

    return {
      id: candidate.id,
      username: candidate.username,
      firstName: candidate.firstName,
      lastName: candidate.lastName,
      email: candidate.email,
      photo: candidate.photo,
    }
  }

  const setUserSession = (payload: {
    token: string | null
    profile: UserProfile | null
    userSnapshot?: UserProfileSnapshot | null
    profilePartial?: boolean
    roles?: string[]
    locale?: string | null
    profileUnavailable?: boolean
    sessionStatus?: 'healthy' | 'degraded' | 'invalid'
    authState?: AuthState
  }) => {
    token.value = payload.token
    profile.value = payload.profile
    profilePartial.value = payload.profilePartial ?? false
    userSnapshot.value = payload.userSnapshot
      ?? (toUserSnapshot(payload.profile) ?? userSnapshot.value)
    roles.value = payload.roles ?? payload.profile?.roles ?? []
    locale.value = payload.locale ?? (payload.profile ? getProfilePreferredLocale(payload.profile) : null)
    profileUnavailable.value = payload.profileUnavailable ?? false
    sessionStatus.value = payload.sessionStatus ?? (payload.token ? 'healthy' : 'invalid')
    authState.value = payload.authState
      ?? (!payload.token
        ? 'unauthenticated'
        : (sessionStatus.value === 'degraded' || profileUnavailable.value ? 'degraded' : 'authenticated'))
  }

  return {
    token,
    profile,
    userSnapshot,
    profilePartial,
    roles,
    locale,
    profileUnavailable,
    sessionStatus,
    authState,
    setUserSession,
  }
})
