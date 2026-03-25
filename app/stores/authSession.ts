import { defineStore } from 'pinia'
import type { UserProfile } from '~/types/api/user'
import { getProfilePreferredLocale } from '~/utils/locale'

export type AuthState = 'initializing' | 'authenticated' | 'unauthenticated' | 'degraded'

export const useAuthSessionStore = defineStore('auth-session', () => {
  const token = ref<string | null>(null)
  const profile = ref<UserProfile | null>(null)
  const roles = ref<string[]>([])
  const locale = ref<string | null>(null)
  const profileUnavailable = ref(false)
  const sessionStatus = ref<'healthy' | 'degraded' | 'invalid'>('invalid')
  const authState = ref<AuthState>('initializing')

  const setUserSession = (payload: {
    token: string | null
    profile: UserProfile | null
    roles?: string[]
    locale?: string | null
    profileUnavailable?: boolean
    sessionStatus?: 'healthy' | 'degraded' | 'invalid'
    authState?: AuthState
  }) => {
    token.value = payload.token
    profile.value = payload.profile
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
    roles,
    locale,
    profileUnavailable,
    sessionStatus,
    authState,
    setUserSession,
  }
})
