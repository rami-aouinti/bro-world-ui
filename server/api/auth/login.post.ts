import type { LoginPayload, TokenResponse } from '../../../app/types/api/common'
import type { SessionResponse, UserProfile } from '../../../app/types/api/user'
import { applySessionCookie, createSession } from '../../../server/utils/session'


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

  const { sessionId, session } = await createSession({
    token: authResponse.token,
    profile,
    roles: profile.roles ?? [],
    locale: profile.locale || profile.language || 'en',
  })

  applySessionCookie(event, sessionId)

  return {
    authenticated: true,
    profile,
    roles: session.roles,
    locale: session.locale,
    expiresAt: session.expiresAt,
  }
})
