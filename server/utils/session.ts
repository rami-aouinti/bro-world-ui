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
const REDIS_COOKIE_PREFIX = 'r:'

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

const encodeRedisCookieValue = (sessionId: string, session?: StoredSession) => {
  if (!session) {
    return `${REDIS_COOKIE_PREFIX}${sessionId}`
  }

  return `${REDIS_COOKIE_PREFIX}${sessionId}.${encodeCookieSession(session)}`
}

const parseRedisCookieValue = (raw: string) => {
  if (!raw.startsWith(REDIS_COOKIE_PREFIX)) {
    return {
      sessionId: raw,
      fallbackSession: null as StoredSession | null,
    }
  }

  const rawPayload = raw.slice(REDIS_COOKIE_PREFIX.length)
  const separatorIndex = rawPayload.indexOf('.')

  if (separatorIndex === -1) {
    return {
      sessionId: rawPayload,
      fallbackSession: null as StoredSession | null,
    }
  }

  const sessionId = rawPayload.slice(0, separatorIndex)
  const encodedSession = rawPayload.slice(separatorIndex + 1)

  return {
    sessionId,
    fallbackSession: decodeCookieSession(encodedSession),
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

const shouldUseSecureCookie = (event: H3Event, configuredSecure: boolean) => {
  if (!configuredSecure) {
    return false
  }

  const forwardedProto = getHeader(event, 'x-forwarded-proto')
  const isHttps = event.node.req.socket.encrypted || forwardedProto?.split(',')[0]?.trim() === 'https'

  return Boolean(isHttps)
}

export const createSession = async (payload: UserSessionPayload) => {
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


export type UserSessionPayload = Omit<StoredSession, 'expiresAt'>

export const setUserSession = async (event: H3Event, payload: UserSessionPayload) => {
  const { sessionId, session } = await createSession(payload)
  applySessionCookie(event, sessionId, session)

  return session
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
  const rawCookieValue = getCookie(event, cookieName)

  if (!rawCookieValue) {
    return null
  }

  const parsedCookie = redisEnabled
    ? parseRedisCookieValue(rawCookieValue)
    : { sessionId: rawCookieValue, fallbackSession: null as StoredSession | null }

  let session = await getSession(parsedCookie.sessionId)

  if (!session && parsedCookie.fallbackSession) {
    session = parsedCookie.fallbackSession
  }

  if (!session) {
    return null
  }

  if (!redisEnabled && new Date(session.expiresAt).getTime() <= Date.now()) {
    return null
  }

  return { sessionId: parsedCookie.sessionId, session }
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
  const secure = shouldUseSecureCookie(event, cookieSecure)

  const cookieValue = redisEnabled
    ? encodeRedisCookieValue(sessionId, session)
    : (session ? encodeCookieSession(session) : sessionId)

  setCookie(event, cookieName, cookieValue, {
    path: '/',
    maxAge: ttlSeconds,
    httpOnly: true,
    secure,
    sameSite: cookieSameSite,
  })
}

export const clearSessionCookie = (event: H3Event) => {
  const { cookieName, cookieSecure, cookieSameSite } = getSessionConfig()
  const secure = shouldUseSecureCookie(event, cookieSecure)

  setCookie(event, cookieName, '', {
    path: '/',
    maxAge: 0,
    httpOnly: true,
    secure,
    sameSite: cookieSameSite,
  })
}
