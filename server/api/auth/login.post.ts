import type { H3Event } from 'h3'
import type { LoginPayload, TokenResponse } from '../../../app/types/api/common'
import type { SessionResponse, UserProfile } from '../../../app/types/api/user'
import { setUserSession } from '../../../server/utils/session'


function clearLegacyClientCookie(event: H3Event, secure: boolean) {
  deleteCookie(event, 'auth_token', {
    path: '/',
    sameSite: 'lax',
    secure,
    maxAge: 0,
  })
}

function isSecureCookie(event: H3Event) {
  const forwardedProto = getHeader(event, 'x-forwarded-proto')

  if (forwardedProto) {
    return forwardedProto.split(',')[0]?.trim().toLowerCase() === 'https'
  }

  const host = getHeader(event, 'host') ?? ''
  return !host.includes('localhost') && !host.includes('127.0.0.1')
}

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
  const secure = isSecureCookie(event)

  if (token) {
    setCookie(event, 'auth_token', encodeURIComponent(token), {
      path: '/',
      httpOnly: true,
      secure,
      sameSite: 'lax',
      maxAge: 60 * 60 * 8,
    })

  }
  else {
    clearLegacyClientCookie(event, secure)
  }

  const profile = await $fetch<UserProfile>('/api/v1/profile', {
    method: 'GET',
    baseURL: config.public.apiBase,
    headers: {
      accept: 'application/json',
      Authorization: `Bearer ${authResponse.token}`,
    },
  })

  const sessionProfile = buildSessionProfile(profile)

  const session = await setUserSession(event, {
    token: authResponse.token,
    profile: sessionProfile,
    roles: profile.roles ?? [],
    locale: profile.locale || profile.language || 'en',
  })

  return {
    authenticated: true,
    profile: session.profile as UserProfile,
    roles: session.roles,
    locale: session.locale,
    expiresAt: session.expiresAt,
  }
})
