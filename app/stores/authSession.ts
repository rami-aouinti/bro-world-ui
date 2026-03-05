import { defineStore } from 'pinia'
import type { UserProfile } from '~/types/api/user'
import { getProfilePreferredLocale } from '~/utils/locale'

export const useAuthSessionStore = defineStore('auth-session', () => {
  const token = ref<string | null>(null)
  const profile = ref<UserProfile | null>(null)
  const roles = ref<string[]>([])
  const locale = ref<string | null>(null)

  const setToken = (nextToken: string | null) => {
    token.value = nextToken
  }

  const setProfile = (nextProfile: UserProfile | null) => {
    profile.value = nextProfile
  }

  const setUserSession = (payload: {
    token: string | null
    profile: UserProfile | null
    roles?: string[]
    locale?: string | null
  }) => {
    setToken(payload.token)
    setProfile(payload.profile)
    roles.value = payload.roles ?? payload.profile?.roles ?? []
    locale.value = payload.locale ?? (payload.profile ? getProfilePreferredLocale(payload.profile) : null)
  }

  const setSession = setUserSession

  const clearSession = () => {
    setUserSession({ token: null, profile: null })
  }

  return {
    token,
    profile,
    roles,
    locale,
    setToken,
    setProfile,
    setUserSession,
    setSession,
    clearSession,
  }
})
