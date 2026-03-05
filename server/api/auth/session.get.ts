import type { SessionResponse, UserProfile } from '../../../app/types/api/user'
import { applySessionCookie, refreshSession, readSessionFromEvent } from '../../../server/utils/session'

export default defineEventHandler(async (event): Promise<SessionResponse> => {
  const sessionContext = await readSessionFromEvent(event)

  if (!sessionContext) {
    return {
      authenticated: false,
      profile: null,
      roles: [],
      locale: null,
    }
  }

  const nextSession = await refreshSession(sessionContext.sessionId, sessionContext.session)
  applySessionCookie(event, sessionContext.sessionId)

  return {
    authenticated: true,
    profile: nextSession.profile as UserProfile | null,
    roles: nextSession.roles,
    locale: nextSession.locale,
    expiresAt: nextSession.expiresAt,
  }
})
