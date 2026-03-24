import type { H3Event } from 'h3'
import type { SessionResponse, UserProfile } from '../../app/types/api/user'
import { setAuthCookie } from './authCookie.ts'

export const AUTH_ERROR_CODES = {
  TOKEN_INVALID: 'AUTH_TOKEN_INVALID',
  PROFILE_FETCH_FAILED: 'AUTH_PROFILE_FETCH_FAILED',
  PROFILE_INVALID: 'AUTH_PROFILE_INVALID',
} as const

export const createAuthError = (statusCode: number, statusMessage: string, code: string) => createError({
  statusCode,
  statusMessage,
  data: {
    code,
  },
})

export function normalizeBearerToken(rawToken: string | undefined) {
  if (!rawToken) {
    return undefined
  }

  const trimmed = rawToken.trim()
  if (!trimmed) {
    return undefined
  }

  return trimmed.replace(/^Bearer\s+/i, '')
}

const validateProfile = (profile: UserProfile) => {
  if (!profile?.id || !profile?.username || !profile?.email || !profile?.firstName || !profile?.lastName) {
    throw createAuthError(502, 'Incomplete user profile', AUTH_ERROR_CODES.PROFILE_INVALID)
  }
}

export const mapToSessionResponse = (profile: UserProfile, authCookie: Awaited<ReturnType<typeof setAuthCookie>>): SessionResponse => ({
  authenticated: true,
  profile,
  roles: profile.roles ?? [],
  locale: profile.locale || profile.language || 'en',
  expiresAt: authCookie.expiresAt,
})

interface SessionBuilderDeps {
  fetchProfile: (token: string) => Promise<UserProfile>
  persistCookie: typeof setAuthCookie
}

export const createAuthSessionBuilder = (deps: SessionBuilderDeps) => async (event: H3Event, rawToken: string | undefined): Promise<SessionResponse> => {
  const token = normalizeBearerToken(rawToken)

  if (!token) {
    throw createAuthError(401, 'Invalid authentication token', AUTH_ERROR_CODES.TOKEN_INVALID)
  }

  const profile = await deps.fetchProfile(token)
  validateProfile(profile)

  const authCookie = await deps.persistCookie(event, {
    token,
    sessionVersion: 1,
  })

  return mapToSessionResponse(profile, authCookie)
}

export const fetchProfileWithAuthorization = async (token: string): Promise<UserProfile> => {
  try {
    const config = useRuntimeConfig()

    return await $fetch<UserProfile>('/api/v1/profile', {
      method: 'GET',
      baseURL: config.public.apiBase,
      headers: {
        accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
    })
  }
  catch {
    throw createAuthError(502, 'Unable to retrieve user profile', AUTH_ERROR_CODES.PROFILE_FETCH_FAILED)
  }
}

export const buildAuthSession = createAuthSessionBuilder({
  fetchProfile: fetchProfileWithAuthorization,
  persistCookie: setAuthCookie,
})
