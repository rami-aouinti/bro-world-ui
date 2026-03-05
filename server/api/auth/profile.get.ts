import type { SessionResponse, UserProfile } from '../../../app/types/api/user'
import { applySessionCookie, refreshSession, requireSession } from '../../../server/utils/session'

export default defineEventHandler(async (event): Promise<SessionResponse> => {
  const { sessionId, session } = await requireSession(event)
  const nextSession = await refreshSession(sessionId, session)

  applySessionCookie(event, sessionId)

  return {
    authenticated: true,
    profile: nextSession.profile as UserProfile | null,
    roles: nextSession.roles,
    locale: nextSession.locale,
    expiresAt: nextSession.expiresAt,
  }
})
