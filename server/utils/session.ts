import { randomUUID } from 'node:crypto'
import { getRedisClient } from '../../server/utils/redis'

export interface StoredSession {
  token: string
  profile: Record<string, unknown> | null
  roles: string[]
  locale: string | null
  expiresAt: string
}

const buildSessionKey = (sessionId: string) => `session:${sessionId}`

const getSessionConfig = () => {
  const config = useRuntimeConfig()

  return {
    ttlSeconds: Math.max(900, Number(config.session.ttlSeconds || 1800)),
    cookieName: config.session.cookieName,
    cookieSecure: Boolean(config.session.cookieSecure),
    cookieSameSite: config.session.cookieSameSite,
  }
}

export const createSession = async (payload: Omit<StoredSession, 'expiresAt'>) => {
  const redis = await getRedisClient()
  const sessionId = randomUUID()
  const { ttlSeconds } = getSessionConfig()

  const session: StoredSession = {
    ...payload,
    expiresAt: new Date(Date.now() + ttlSeconds * 1000).toISOString(),
  }

  await redis.set(buildSessionKey(sessionId), JSON.stringify(session), {
    EX: ttlSeconds,
  })

  return { sessionId, session }
}

export const getSession = async (sessionId: string) => {
  const redis = await getRedisClient()
  const rawSession = await redis.get(buildSessionKey(sessionId))

  if (!rawSession) {
    return null
  }

  return JSON.parse(rawSession) as StoredSession
}

export const refreshSession = async (sessionId: string, session: StoredSession) => {
  const redis = await getRedisClient()
  const { ttlSeconds } = getSessionConfig()

  const nextSession: StoredSession = {
    ...session,
    expiresAt: new Date(Date.now() + ttlSeconds * 1000).toISOString(),
  }

  await redis.set(buildSessionKey(sessionId), JSON.stringify(nextSession), {
    EX: ttlSeconds,
  })

  return nextSession
}

export const clearSession = async (sessionId: string) => {
  const redis = await getRedisClient()
  await redis.del(buildSessionKey(sessionId))
}

export const readSessionFromEvent = async (event: H3Event) => {
  const { cookieName } = getSessionConfig()
  const sessionId = getCookie(event, cookieName)

  if (!sessionId) {
    return null
  }

  const session = await getSession(sessionId)

  if (!session) {
    return null
  }

  return { sessionId, session }
}

export const requireSession = async (event: H3Event) => {
  const sessionContext = await readSessionFromEvent(event)

  if (!sessionContext) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized',
    })
  }

  return sessionContext
}

export const applySessionCookie = (event: H3Event, sessionId: string) => {
  const { cookieName, ttlSeconds, cookieSecure, cookieSameSite } = getSessionConfig()

  setCookie(event, cookieName, sessionId, {
    path: '/',
    maxAge: ttlSeconds,
    httpOnly: true,
    secure: cookieSecure,
    sameSite: cookieSameSite,
  })
}

export const clearSessionCookie = (event: H3Event) => {
  const { cookieName, cookieSecure, cookieSameSite } = getSessionConfig()

  setCookie(event, cookieName, '', {
    path: '/',
    maxAge: 0,
    httpOnly: true,
    secure: cookieSecure,
    sameSite: cookieSameSite,
  })
}
