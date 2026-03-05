import type { SessionResponse, UserProfile } from '../../../app/types/api/user'
import { requireAuthCookie, setAuthCookie } from '../../../server/utils/authCookie'

export default defineEventHandler(async (event): Promise<SessionResponse> => {
  const authCookie = requireAuthCookie(event)
  const nextAuthCookie = setAuthCookie(event, authCookie)

  return {
    authenticated: true,
    profile: nextAuthCookie.profile as UserProfile | null,
    roles: nextAuthCookie.roles,
    locale: nextAuthCookie.locale,
    expiresAt: nextAuthCookie.expiresAt,
  }
})
