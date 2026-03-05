import { clearSession, clearSessionCookie, readSessionFromEvent } from '../../../server/utils/session'

export default defineEventHandler(async (event) => {
  const sessionContext = await readSessionFromEvent(event)

  if (sessionContext) {
    await clearSession(sessionContext.sessionId)
  }

  clearSessionCookie(event)

  return {
    success: true,
  }
})
