import type { H3Event } from 'h3'
import type { SessionResponse, UserMeRead, UserProfile } from '../../app/types/api/user'
import { setAuthCookie } from './authCookie.ts'

export const AUTH_ERROR_CODES = {
  TOKEN_INVALID: 'AUTH_TOKEN_INVALID',
  PROFILE_UNAUTHORIZED: 'AUTH_PROFILE_UNAUTHORIZED',
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

export const buildProfileSnapshot = (profile: UserProfile) => ({
  id: profile.id,
  username: profile.username,
  firstName: profile.firstName,
  lastName: profile.lastName,
  email: profile.email,
  photo: profile.photo,
})

export const mapToSessionResponse = (profile: UserProfile, authCookie: Awaited<ReturnType<typeof setAuthCookie>>): SessionResponse => ({
  authenticated: true,
  authToken: authCookie.token,
  profile,
  userSnapshot: authCookie.userSnapshot ?? buildProfileSnapshot(profile),
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
  const userSnapshot = buildProfileSnapshot(profile)

  const authCookie = await deps.persistCookie(event, {
    token,
    sessionVersion: 1,
    userSnapshot,
  })

  return mapToSessionResponse(profile, authCookie)
}

export const fetchProfileWithAuthorization = async (token: string): Promise<UserProfile> => {
  try {
    const config = useRuntimeConfig()
    const me = await $fetch<UserMeRead>('/api/v1/users/me', {
      method: 'GET',
      baseURL: config.public.apiBase,
      headers: {
        accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
    })

    return {
      id: me.id,
      username: me.username,
      firstName: me.firstName,
      lastName: me.lastName,
      email: me.email,
      language: me.language,
      locale: me.locale,
      timezone: me.timezone ?? 'UTC',
      photo: me.photo,
      roles: me.roles ?? [],
      userGroups: me.userGroups,
    }
  }
  catch (error: unknown) {
    const statusCode =
      (error as { statusCode?: number })?.statusCode
      ?? (error as { status?: number })?.status
      ?? (error as { response?: { status?: number } })?.response?.status
      ?? (error as { cause?: { status?: number } })?.cause?.status

    if (statusCode === 401 || statusCode === 403) {
      throw createAuthError(401, 'Unauthorized profile access', AUTH_ERROR_CODES.PROFILE_UNAUTHORIZED)
    }

    throw createAuthError(502, 'Unable to retrieve user profile', AUTH_ERROR_CODES.PROFILE_FETCH_FAILED)
  }
}

export const buildAuthSession = createAuthSessionBuilder({
  fetchProfile: fetchProfileWithAuthorization,
  persistCookie: setAuthCookie,
})
