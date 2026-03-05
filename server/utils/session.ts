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

const encodeCookieSession = (session: StoredSession) => Buffer.from(JSON.stringify(session), 'utf-8').toString('base64url')

const decodeCookieSession = (raw: string): StoredSession | null => {
  try {
    const parsed = JSON.parse(Buffer.from(raw, 'base64url').toString('utf-8')) as StoredSession

    if (!parsed || typeof parsed !== 'object' || typeof parsed.token !== 'string') {
      return null
    }

    return parsed
  }
  catch {
    return null
  }
}

const getSessionConfig = () => {
  const config = useRuntimeConfig()

  return {
    redisEnabled: Boolean(config.redisUrl),
    ttlSeconds: Math.max(900, Number(config.session.ttlSeconds || 60 * 60 * 24 * 365)),
    cookieName: config.session.cookieName,
    cookieSecure: Boolean(config.session.cookieSecure),
    cookieSameSite: config.session.cookieSameSite,
  }
}

export const createSession = async (payload: Omit<StoredSession, 'expiresAt'>) => {
  const { ttlSeconds, redisEnabled } = getSessionConfig()

  const session: StoredSession = {
    ...payload,
    expiresAt: new Date(Date.now() + ttlSeconds * 1000).toISOString(),
  }

  if (redisEnabled) {
    const redis = await getRedisClient()
    const sessionId = randomUUID()

    await redis.set(buildSessionKey(sessionId), JSON.stringify(session), {
      EX: ttlSeconds,
    })

    return { sessionId, session }
  }

  const cookieSession = encodeCookieSession(session)

  return { sessionId: cookieSession, session }
}

export const getSession = async (sessionId: string) => {
  const { redisEnabled } = getSessionConfig()

  if (!redisEnabled) {
    return decodeCookieSession(sessionId)
  }

  const redis = await getRedisClient()
  const rawSession = await redis.get(buildSessionKey(sessionId))

  if (!rawSession) {
    return null
  }

  return JSON.parse(rawSession) as StoredSession
}

export const refreshSession = async (sessionId: string, session: StoredSession) => {
  const { ttlSeconds, redisEnabled } = getSessionConfig()

  const nextSession: StoredSession = {
    ...session,
    expiresAt: new Date(Date.now() + ttlSeconds * 1000).toISOString(),
  }

  if (!redisEnabled) {
    return nextSession
  }

  const redis = await getRedisClient()

  await redis.set(buildSessionKey(sessionId), JSON.stringify(nextSession), {
    EX: ttlSeconds,
  })

  return nextSession
}

export const clearSession = async (sessionId: string) => {
  const { redisEnabled } = getSessionConfig()

  if (!redisEnabled) {
    return
  }

  const redis = await getRedisClient()
  await redis.del(buildSessionKey(sessionId))
}

export const readSessionFromEvent = async (event: H3Event) => {
  const { cookieName, redisEnabled } = getSessionConfig()
  const sessionId = getCookie(event, cookieName)

  if (!sessionId) {
    return null
  }

  const session = await getSession(sessionId)

  if (!session) {
    return null
  }

  if (!redisEnabled && new Date(session.expiresAt).getTime() <= Date.now()) {
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

export const applySessionCookie = (event: H3Event, sessionId: string, session?: StoredSession) => {
  const { cookieName, ttlSeconds, cookieSecure, cookieSameSite, redisEnabled } = getSessionConfig()

  const cookieValue = redisEnabled
    ? sessionId
    : (session ? encodeCookieSession(session) : sessionId)

  setCookie(event, cookieName, cookieValue, {
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
