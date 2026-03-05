import type { LoginPayload, TokenResponse } from '../../../app/types/api/common'
import type { SessionResponse, UserProfile } from '../../../app/types/api/user'
import { applySessionCookie, createSession } from '../../../server/utils/session'


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

  const profile = await $fetch<UserProfile>('/api/v1/profile', {
    method: 'GET',
    baseURL: config.public.apiBase,
    headers: {
      accept: 'application/json',
      Authorization: `Bearer ${authResponse.token}`,
    },
  })

  const sessionProfile = buildSessionProfile(profile)

  const { sessionId, session } = await createSession({
    token: authResponse.token,
    profile: sessionProfile,
    roles: profile.roles ?? [],
    locale: profile.locale || profile.language || 'en',
  })

  applySessionCookie(event, sessionId, session)

  return {
    authenticated: true,
    profile: session.profile as UserProfile,
    roles: session.roles,
    locale: session.locale,
    expiresAt: session.expiresAt,
  }
})
