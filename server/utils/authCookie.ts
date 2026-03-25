import type { H3Event } from 'h3'
import { createHmac, randomUUID, timingSafeEqual } from 'node:crypto'

interface SessionProfileSnapshot {
  id: string
  username: string
  firstName: string
  lastName: string
  email: string
  photo?: string
}

export interface StoredAuthCookie {
  token: string
  sessionVersion: number
  userSnapshot?: SessionProfileSnapshot
}

interface StoredAuthSessionRecord extends StoredAuthCookie {
  expiresAt: string
}

interface LegacyStoredAuthCookie {
  token: string
  expiresAt?: string
  sessionVersion?: number
  userSnapshot?: SessionProfileSnapshot
  profileSnapshot?: SessionProfileSnapshot
  profile?: Record<string, unknown> | null
  roles?: string[]
  locale?: string | null
}

export interface AuthCookiePayload extends StoredAuthCookie {
  // backward-compatible payload shape accepted by legacy callers
  profileSnapshot?: SessionProfileSnapshot
}

const parseRawAuthCookie = (value: string): LegacyStoredAuthCookie | null => {
  try {
    const parsed = JSON.parse(value) as LegacyStoredAuthCookie

    if (!parsed || typeof parsed !== 'object' || typeof parsed.token !== 'string') {
      return null
    }

    return parsed
  }
  catch {
    return null
  }
}

const isValidSnapshot = (value: unknown): value is SessionProfileSnapshot => {
  if (!value || typeof value !== 'object') {
    return false
  }

  const snapshot = value as Partial<SessionProfileSnapshot>
  return typeof snapshot.id === 'string'
    && typeof snapshot.username === 'string'
    && typeof snapshot.firstName === 'string'
    && typeof snapshot.lastName === 'string'
    && typeof snapshot.email === 'string'
    && (snapshot.photo === undefined || typeof snapshot.photo === 'string')
}

const normalizeStoredAuthCookie = (parsed: LegacyStoredAuthCookie, ttlSeconds: number): { cookie: StoredAuthSessionRecord, migrated: boolean } | null => {
  if (!parsed.token.trim()) {
    return null
  }

  const hasValidExpiresAt = typeof parsed.expiresAt === 'string' && !Number.isNaN(new Date(parsed.expiresAt).getTime())
  const normalizedUserSnapshot = isValidSnapshot(parsed.userSnapshot)
    ? parsed.userSnapshot
    : isValidSnapshot(parsed.profileSnapshot)
      ? parsed.profileSnapshot
      : undefined

  const cookie: StoredAuthSessionRecord = {
    token: parsed.token,
    expiresAt: hasValidExpiresAt ? parsed.expiresAt as string : new Date(Date.now() + ttlSeconds * 1000).toISOString(),
    sessionVersion: typeof parsed.sessionVersion === 'number' ? parsed.sessionVersion : 1,
    userSnapshot: normalizedUserSnapshot,
  }

  const migrated = !hasValidExpiresAt
    || parsed.profileSnapshot !== undefined
    || parsed.profile !== undefined
    || parsed.roles !== undefined
    || parsed.locale !== undefined
    || (parsed.userSnapshot === undefined && parsed.profileSnapshot !== undefined)
    || typeof parsed.sessionVersion !== 'number'

  return { cookie, migrated }
}

const decodeAuthCookie = (raw: string, ttlSeconds: number): { cookie: StoredAuthSessionRecord, migrated: boolean } | null => {
  const normalized = raw.trim().replace(/^"|"$/g, '')

  if (!normalized) {
    return null
  }

  try {
    const fromBase64 = parseRawAuthCookie(Buffer.from(normalized, 'base64url').toString('utf-8'))

    if (fromBase64) {
      return normalizeStoredAuthCookie(fromBase64, ttlSeconds)
    }
  }
  catch {
    // ignore invalid base64 and try plain JSON
  }

  const fromJson = parseRawAuthCookie(normalized)

  if (!fromJson) {
    return null
  }

  return normalizeStoredAuthCookie(fromJson, ttlSeconds)
}

const decodeLegacyTokenCookie = (raw: string): string | null => {
  const normalized = raw.trim().replace(/^"|"$/g, '')
  const directToken = normalized.replace(/^Bearer\s+/i, '')

  if (directToken) {
    return directToken
  }

  try {
    const decoded = Buffer.from(normalized, 'base64url').toString('utf-8').trim()

    return decoded.replace(/^Bearer\s+/i, '') || null
  }
  catch {
    return null
  }
}

const isExpired = (expiresAt: string) => {
  const expiresAtValue = new Date(expiresAt).getTime()

  if (Number.isNaN(expiresAtValue)) {
    return true
  }

  return expiresAtValue <= Date.now()
}

const getAuthConfig = () => {
  const config = useRuntimeConfig()

  return {
    ttlSeconds: Math.max(900, Number(config.session.ttlSeconds || 60 * 60 * 8)),
    cookieName: config.session.cookieName,
    cookieSecure: Boolean(config.session.cookieSecure),
    cookieSameSite: config.session.cookieSameSite,
    sessionPassword: String(config.session.password || ''),
  }
}

const getSessionStorage = () => useStorage('data')

const AUTH_SESSION_STORAGE_BASE_KEY = 'auth:session:'
const buildSessionStorageKey = (sessionId: string) => `${AUTH_SESSION_STORAGE_BASE_KEY}${sessionId}`

const createSessionCookieSignature = (sessionId: string, password: string) => createHmac('sha256', password)
  .update(sessionId)
  .digest('base64url')

const encodeSessionIdCookie = (sessionId: string, password: string) => {
  const signature = createSessionCookieSignature(sessionId, password)
  return `sid:${sessionId}.${signature}`
}

const parseSessionIdFromCookie = (rawCookie: string) => {
  const normalized = rawCookie.trim().replace(/^"|"$/g, '')

  if (!normalized.startsWith('sid:')) {
    return null
  }

  const signedValue = normalized.slice(4).trim()
  if (!signedValue) {
    return null
  }

  const separatorIndex = signedValue.lastIndexOf('.')
  if (separatorIndex <= 0 || separatorIndex === signedValue.length - 1) {
    return null
  }

  return {
    sessionId: signedValue.slice(0, separatorIndex),
    signature: signedValue.slice(separatorIndex + 1),
  }
}

const verifySessionCookieSignature = (sessionId: string, signature: string, password: string) => {
  const expectedSignature = createSessionCookieSignature(sessionId, password)
  const expectedBuffer = Buffer.from(expectedSignature)
  const receivedBuffer = Buffer.from(signature)

  if (expectedBuffer.length !== receivedBuffer.length) {
    return false
  }

  return timingSafeEqual(expectedBuffer, receivedBuffer)
}

const shouldUseSecureCookie = (event: H3Event, configuredSecure: boolean) => {
  if (!configuredSecure) {
    return false
  }

  const forwardedProto = getHeader(event, 'x-forwarded-proto')

  if (forwardedProto) {
    return forwardedProto.split(',')[0]?.trim().toLowerCase() === 'https'
  }

  const protocol = getRequestProtocol(event, {
    xForwardedProto: false,
  })

  return protocol === 'https'
}

export const setAuthCookie = async (event: H3Event, payload: AuthCookiePayload) => {
  const { ttlSeconds, cookieName, cookieSecure, cookieSameSite, sessionPassword } = getAuthConfig()
  const secure = shouldUseSecureCookie(event, cookieSecure)
  const storage = getSessionStorage()
  const sessionId = randomUUID()

  const nextCookiePayload: StoredAuthSessionRecord = {
    token: payload.token,
    sessionVersion: payload.sessionVersion ?? 1,
    userSnapshot: payload.userSnapshot ?? payload.profileSnapshot,
    expiresAt: new Date(Date.now() + ttlSeconds * 1000).toISOString(),
  }

  await storage.setItem(buildSessionStorageKey(sessionId), nextCookiePayload, {
    ttl: ttlSeconds,
  })

  setCookie(event, cookieName, encodeSessionIdCookie(sessionId, sessionPassword), {
    path: '/',
    maxAge: ttlSeconds,
    httpOnly: true,
    secure,
    sameSite: cookieSameSite,
  })

  return nextCookiePayload
}

const clearAuthCookieClientValue = (event: H3Event) => {
  const { cookieName, cookieSecure, cookieSameSite } = getAuthConfig()
  const secure = shouldUseSecureCookie(event, cookieSecure)

  setCookie(event, cookieName, '', {
    path: '/',
    maxAge: 0,
    httpOnly: true,
    secure,
    sameSite: cookieSameSite,
  })
}

export const readAuthCookie = async (event: H3Event): Promise<StoredAuthCookie | null> => {
  const { cookieName, ttlSeconds, sessionPassword } = getAuthConfig()
  const rawCookie = getCookie(event, cookieName)

  if (!rawCookie) {
    return null
  }

  const decodedCookie = decodeURIComponent(rawCookie)
  const parsedSessionCookie = parseSessionIdFromCookie(decodedCookie)

  if (parsedSessionCookie) {
    if (!verifySessionCookieSignature(parsedSessionCookie.sessionId, parsedSessionCookie.signature, sessionPassword)) {
      clearAuthCookieClientValue(event)
      return null
    }

    const storage = getSessionStorage()
    const storageKey = buildSessionStorageKey(parsedSessionCookie.sessionId)
    const storedSession = await storage.getItem<LegacyStoredAuthCookie>(storageKey)

    if (!storedSession) {
      await storage.removeItem(storageKey)
      clearAuthCookieClientValue(event)
      return null
    }

    const normalizedStoredSession = normalizeStoredAuthCookie(storedSession, ttlSeconds)

    if (!normalizedStoredSession || isExpired(normalizedStoredSession.cookie.expiresAt)) {
      await storage.removeItem(storageKey)
      clearAuthCookieClientValue(event)
      return null
    }

    if (normalizedStoredSession.migrated) {
      await storage.setItem(storageKey, normalizedStoredSession.cookie, {
        ttl: ttlSeconds,
      })
    }

    return {
      token: normalizedStoredSession.cookie.token,
      sessionVersion: normalizedStoredSession.cookie.sessionVersion,
      userSnapshot: normalizedStoredSession.cookie.userSnapshot,
    }
  }

  const payload = decodeAuthCookie(decodedCookie, ttlSeconds)

  if (!payload) {
    const legacyToken = decodeLegacyTokenCookie(decodedCookie)

    if (!legacyToken) {
      return null
    }

    return setAuthCookie(event, {
      token: legacyToken,
      sessionVersion: 1,
    })
  }

  if (isExpired(payload.cookie.expiresAt)) {
    clearAuthCookieClientValue(event)
    return null
  }

  if (payload.migrated) {
    return setAuthCookie(event, {
      token: payload.cookie.token,
      sessionVersion: payload.cookie.sessionVersion,
      userSnapshot: payload.cookie.userSnapshot,
    })
  }

  return {
    token: payload.cookie.token,
    sessionVersion: payload.cookie.sessionVersion,
    userSnapshot: payload.cookie.userSnapshot,
  }
}

export const requireAuthCookie = async (event: H3Event) => {
  const authCookie = await readAuthCookie(event)

  if (!authCookie) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized',
    })
  }

  return authCookie
}

export const clearAuthCookie = async (event: H3Event) => {
  // GARDE AUTH: ne jamais appeler cette fonction hors logout explicite (`/api/auth/logout`).
  // Le token ne doit jamais être supprimé automatiquement.
  const { cookieName } = getAuthConfig()
  const rawCookie = getCookie(event, cookieName)

  if (rawCookie) {
    const decodedCookie = decodeURIComponent(rawCookie)
    const parsedSessionCookie = parseSessionIdFromCookie(decodedCookie)

    if (parsedSessionCookie) {
      const storage = getSessionStorage()
      await storage.removeItem(buildSessionStorageKey(parsedSessionCookie.sessionId))
    }
  }

  clearAuthCookieClientValue(event)
}
