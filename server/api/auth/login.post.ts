import type { LoginPayload, TokenResponse } from '../../../app/types/api/common'
import type { SessionResponse, UserProfile } from '../../../app/types/api/user'
import { setAuthCookie } from '../../../server/utils/authCookie'


function normalizeBearerToken(rawToken: string | undefined) {
  if (!rawToken) {
    return undefined
  }

  const trimmed = rawToken.trim()
  if (!trimmed) {
    return undefined
  }

  return trimmed.replace(/^Bearer\s+/i, '')
}


const buildSessionProfile = (profile: UserProfile): Pick<UserProfile, 'id' | 'username' | 'firstName' | 'lastName' | 'email' | 'photo'> => ({
  id: profile.id,
  username: profile.username,
  firstName: profile.firstName,
  lastName: profile.lastName,
  email: profile.email,
  photo: profile.photo,
})

export default defineEventHandler(async (event): Promise<SessionResponse> => {
  const config = useRuntimeConfig()
  const payload = await readBody<LoginPayload>(event)

  const authResponse = await $fetch<TokenResponse>('/api/v1/auth/get_token', {
    method: 'POST',
    baseURL: config.public.apiBase,
    body: payload,
  })

  const token = normalizeBearerToken(authResponse?.token)
  if (!token) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Invalid authentication token',
    })
  }

  const profile = await $fetch<UserProfile>('/api/v1/profile', {
    method: 'GET',
    baseURL: config.public.apiBase,
    headers: {
      accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
  })

  const sessionProfile = buildSessionProfile(profile)

  const authCookie = setAuthCookie(event, {
    token,
    profile: sessionProfile,
    roles: profile.roles ?? [],
    locale: profile.locale || profile.language || 'en',
  })

  return {
    authenticated: true,
    profile: authCookie.profile as UserProfile,
    roles: authCookie.roles,
    locale: authCookie.locale,
    expiresAt: authCookie.expiresAt,
  }
})
