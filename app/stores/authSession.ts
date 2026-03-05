import { defineStore } from 'pinia'
import { getProfilePreferredLocale } from '~/utils/locale'

export interface UserProfile {
  id: string
  username: string
  firstName: string
  lastName: string
  email: string
  language?: string
  locale?: string
  timezone: string
  roles: string[]
}

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
    roles.value = nextProfile?.roles ?? []
    locale.value = nextProfile ? getProfilePreferredLocale(nextProfile) : null
  }

  const setSession = (payload: { token: string | null, profile: UserProfile | null }) => {
    setToken(payload.token)
    setProfile(payload.profile)
  }

  const clearSession = () => {
    setSession({ token: null, profile: null })
  }

  return {
    token,
    profile,
    roles,
    locale,
    setToken,
    setProfile,
    setSession,
    clearSession,
  }
})
