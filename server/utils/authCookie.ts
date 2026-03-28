import type { H3Event } from 'h3'
import { createHmac, randomUUID, timingSafeEqual } from 'node:crypto'
import { getRedisClient } from './redis.ts'

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

interface StoredAuthFallbackRecord extends StoredAuthCookie {
  expiresAt: string
}

interface LegacyStoredAuthCookie {
  token: string
  expiresAt?: string
  sessionVersion?: number
  userSnapshot?: SessionProfileSnapshot
  profileSnapshot?: SessionProfileSnapshot
}

interface ParsedSessionCookie {
  sessionId: string
  signature: string
  keyId: string
}

export interface AuthCookiePayload extends StoredAuthCookie {
  // backward-compatible payload shape accepted by legacy callers
  profileSnapshot?: SessionProfileSnapshot
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

const normalizeStoredSession = (parsed: LegacyStoredAuthCookie, ttlSeconds: number): StoredAuthSessionRecord | null => {
  if (!parsed.token || !parsed.token.trim()) {
    return null
  }

  const hasValidExpiresAt = typeof parsed.expiresAt === 'string' && !Number.isNaN(new Date(parsed.expiresAt).getTime())
  const normalizedUserSnapshot = isValidSnapshot(parsed.userSnapshot)
    ? parsed.userSnapshot
    : isValidSnapshot(parsed.profileSnapshot)
      ? parsed.profileSnapshot
      : undefined

  return {
    token: parsed.token,
    expiresAt: hasValidExpiresAt ? parsed.expiresAt as string : new Date(Date.now() + ttlSeconds * 1000).toISOString(),
    sessionVersion: typeof parsed.sessionVersion === 'number' ? parsed.sessionVersion : 1,
    userSnapshot: normalizedUserSnapshot,
  }
}


const parseRuntimeBoolean = (value: unknown, fallback: boolean, fieldName: string): boolean => {
  if (typeof value === 'boolean') {
    return value
  }

  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase()

    if (normalized === 'true') {
      return true
    }

    if (normalized === 'false') {
      return false
    }
  }

  if (value === undefined || value === null || value === '') {
    return fallback
  }

  throw createError({
    statusCode: 500,
    statusMessage: `[session-config] ${fieldName} must be either "true" or "false".`,
  })
}

const resolveRuntimeSameSite = (value: unknown): 'lax' | 'strict' | 'none' => {
  const fallback = 'lax'

  if (value === undefined || value === null || value === '') {
    return fallback
  }

  if (typeof value !== 'string') {
    throw createError({
      statusCode: 500,
      statusMessage: '[session-config] session.cookieSameSite must be one of: lax, strict, none.',
    })
  }

  const normalized = value.trim().toLowerCase()

  if (normalized === 'lax' || normalized === 'strict' || normalized === 'none') {
    return normalized
  }

  throw createError({
    statusCode: 500,
    statusMessage: '[session-config] session.cookieSameSite must be one of: lax, strict, none.',
  })
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
  const secretChain = String(config.session.password || '')
    .split(',')
    .map(secret => secret.trim())
    .filter(Boolean)

  if (!secretChain.length) {
    throw createError({
      statusCode: 500,
      statusMessage: 'SESSION_PASSWORD (or NUXT_SESSION_PASSWORD) must be configured',
    })
  }

  const cookieSecure = parseRuntimeBoolean(config.session.cookieSecure, true, 'session.cookieSecure')
  const cookieSameSite = resolveRuntimeSameSite(config.session.cookieSameSite)

  if (cookieSameSite === 'none' && !cookieSecure) {
    throw createError({
      statusCode: 500,
      statusMessage: '[session-config] SESSION_COOKIE_SAME_SITE="none" requires SESSION_COOKIE_SECURE="true".',
    })
  }

  return {
    ttlSeconds: Math.max(900, Number(config.session.ttlSeconds || 60 * 60 * 8)),
    cookieName: config.session.cookieName,
    cookieSecure,
    cookieSameSite,
    sessionSecrets: secretChain,
  }
}

const AUTH_SESSION_STORAGE_BASE_KEY = 'auth:session:'
const buildSessionStorageKey = (sessionId: string) => `${AUTH_SESSION_STORAGE_BASE_KEY}${sessionId}`
const AUTH_FALLBACK_STORAGE_BASE_KEY = 'auth:fallback:'
const AUTH_FALLBACK_TTL_SECONDS = 60 * 60 * 24 * 30
const buildFallbackStorageKey = (fallbackId: string) => `${AUTH_FALLBACK_STORAGE_BASE_KEY}${fallbackId}`

const createSessionCookieSignature = (sessionId: string, secret: string) => createHmac('sha256', secret)
  .update(sessionId)
  .digest('base64url')

const encodeSessionIdCookie = (sessionId: string, keyId: string, secret: string) => {
  const signature = createSessionCookieSignature(sessionId, secret)
  return `sid:v1:${keyId}:${sessionId}.${signature}`
}

const parseSessionIdFromCookie = (rawCookie: string): ParsedSessionCookie | null => {
  const normalized = rawCookie.trim().replace(/^"|"$/g, '')

  if (!normalized.startsWith('sid:v1:')) {
    return null
  }

  const payload = normalized.slice('sid:v1:'.length)
  const keySeparator = payload.indexOf(':')

  if (keySeparator <= 0 || keySeparator === payload.length - 1) {
    return null
  }

  const keyId = payload.slice(0, keySeparator)
  const signedValue = payload.slice(keySeparator + 1)
  const signatureSeparator = signedValue.lastIndexOf('.')

  if (signatureSeparator <= 0 || signatureSeparator === signedValue.length - 1) {
    return null
  }

  return {
    keyId,
    sessionId: signedValue.slice(0, signatureSeparator),
    signature: signedValue.slice(signatureSeparator + 1),
  }
}

const verifySessionCookieSignature = (sessionId: string, signature: string, secret: string) => {
  const expectedSignature = createSessionCookieSignature(sessionId, secret)
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

const setClientCookie = (event: H3Event, cookieValue: string, ttlSeconds: number) => {
  const { cookieName, cookieSecure, cookieSameSite } = getAuthConfig()
  const secure = shouldUseSecureCookie(event, cookieSecure)

  setCookie(event, cookieName, cookieValue, {
    path: '/',
    maxAge: ttlSeconds,
    httpOnly: true,
    secure,
    sameSite: cookieSameSite,
  })
}

const buildFallbackCookieName = () => `${getAuthConfig().cookieName}_fallback`

const setFallbackCookie = (event: H3Event, fallbackId: string, ttlSeconds: number) => {
  const { cookieSecure, cookieSameSite } = getAuthConfig()
  const secure = shouldUseSecureCookie(event, cookieSecure)

  setCookie(event, buildFallbackCookieName(), fallbackId, {
    path: '/',
    maxAge: ttlSeconds,
    httpOnly: true,
    secure,
    sameSite: cookieSameSite,
  })
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

const clearFallbackCookieClientValue = (event: H3Event) => {
  const { cookieSecure, cookieSameSite } = getAuthConfig()
  const secure = shouldUseSecureCookie(event, cookieSecure)

  setCookie(event, buildFallbackCookieName(), '', {
    path: '/',
    maxAge: 0,
    httpOnly: true,
    secure,
    sameSite: cookieSameSite,
  })
}

const getSessionStorage = async () => {
  try {
    const redis = await getRedisClient()

    return {
      async getItem<T>(key: string): Promise<T | null> {
        const raw = await redis.get(key)
        if (!raw) {
          return null
        }

        return JSON.parse(raw) as T
      },
      async setItem(key: string, value: unknown, ttlSeconds: number) {
        await redis.setEx(key, ttlSeconds, JSON.stringify(value))
      },
      async removeItem(key: string) {
        await redis.del(key)
      },
    }
  }
  catch (error) {
    const isProduction = process.env.NODE_ENV === 'production'

    if (isProduction) {
      console.error('[auth-session-storage] Redis is required in production for stable auth sessions.', error)
      throw createError({
        statusCode: 503,
        statusMessage: 'AUTH_SESSION_STORAGE_UNAVAILABLE',
        data: {
          code: 'AUTH_SESSION_STORAGE_UNAVAILABLE',
          source: 'auth_cookie_storage',
        },
      })
    }

    console.warn('[auth-session-storage] Redis unavailable; using local Nitro storage fallback (non-production only).')
    const fallbackStorage = useStorage('data')

    return {
      getItem: <T>(key: string) => fallbackStorage.getItem<T>(key),
      setItem: (key: string, value: unknown, ttlSeconds: number) => fallbackStorage.setItem(key, value, { ttl: ttlSeconds }),
      removeItem: (key: string) => fallbackStorage.removeItem(key),
    }
  }
}

const persistSession = async (
  event: H3Event,
  payload: AuthCookiePayload,
  oldSessionId?: string,
): Promise<StoredAuthSessionRecord> => {
  const { ttlSeconds, sessionSecrets } = getAuthConfig()
  const storage = await getSessionStorage()
  const sessionId = randomUUID()

  const sessionRecord: StoredAuthSessionRecord = {
    token: payload.token,
    sessionVersion: payload.sessionVersion ?? 1,
    userSnapshot: payload.userSnapshot ?? payload.profileSnapshot,
    expiresAt: new Date(Date.now() + ttlSeconds * 1000).toISOString(),
  }

  await storage.setItem(buildSessionStorageKey(sessionId), sessionRecord, ttlSeconds)

  if (oldSessionId) {
    await storage.removeItem(buildSessionStorageKey(oldSessionId))
  }

  setClientCookie(event, encodeSessionIdCookie(sessionId, 'k0', sessionSecrets[0]), ttlSeconds)

  return sessionRecord
}

const persistFallbackSession = async (event: H3Event, payload: AuthCookiePayload): Promise<StoredAuthFallbackRecord> => {
  const storage = await getSessionStorage()
  const existingFallbackId = getCookie(event, buildFallbackCookieName())
  const fallbackId = existingFallbackId || randomUUID()
  const fallbackRecord: StoredAuthFallbackRecord = {
    token: payload.token,
    sessionVersion: payload.sessionVersion ?? 1,
    userSnapshot: payload.userSnapshot ?? payload.profileSnapshot,
    expiresAt: new Date(Date.now() + AUTH_FALLBACK_TTL_SECONDS * 1000).toISOString(),
  }

  await storage.setItem(buildFallbackStorageKey(fallbackId), fallbackRecord, AUTH_FALLBACK_TTL_SECONDS)
  setFallbackCookie(event, fallbackId, AUTH_FALLBACK_TTL_SECONDS)

  return fallbackRecord
}

const readAuthCookieFallback = async (event: H3Event): Promise<StoredAuthCookie | null> => {
  const fallbackId = getCookie(event, buildFallbackCookieName())

  if (!fallbackId) {
    return null
  }

  const storage = await getSessionStorage()
  const fallbackStorageKey = buildFallbackStorageKey(fallbackId)
  const storedFallback = await storage.getItem<StoredAuthFallbackRecord>(fallbackStorageKey)

  if (!storedFallback || !storedFallback.token || !storedFallback.token.trim()) {
    await storage.removeItem(fallbackStorageKey)
    clearFallbackCookieClientValue(event)
    return null
  }

  if (isExpired(storedFallback.expiresAt)) {
    await storage.removeItem(fallbackStorageKey)
    clearFallbackCookieClientValue(event)
    return null
  }

  await storage.setItem(fallbackStorageKey, {
    ...storedFallback,
    expiresAt: new Date(Date.now() + AUTH_FALLBACK_TTL_SECONDS * 1000).toISOString(),
  }, AUTH_FALLBACK_TTL_SECONDS)
  setFallbackCookie(event, fallbackId, AUTH_FALLBACK_TTL_SECONDS)

  return {
    token: storedFallback.token,
    sessionVersion: storedFallback.sessionVersion,
    userSnapshot: storedFallback.userSnapshot,
  }
}

const restoreFromFallbackSession = async (event: H3Event): Promise<StoredAuthCookie | null> => {
  const fallbackCookie = await readAuthCookieFallback(event)

  if (!fallbackCookie) {
    return null
  }

  const restoredSession = await setAuthCookie(event, {
    token: fallbackCookie.token,
    sessionVersion: fallbackCookie.sessionVersion,
    userSnapshot: fallbackCookie.userSnapshot,
  })

  return {
    token: restoredSession.token,
    sessionVersion: restoredSession.sessionVersion,
    userSnapshot: restoredSession.userSnapshot,
  }
}

export const getFallbackAuthCookie = async (event: H3Event) => readAuthCookieFallback(event)

export const setAuthCookie = async (event: H3Event, payload: AuthCookiePayload) => {
  const session = await persistSession(event, payload)
  await persistFallbackSession(event, payload)
  return session
}

export const readAuthCookie = async (event: H3Event): Promise<StoredAuthCookie | null> => {
  const { cookieName, ttlSeconds, sessionSecrets } = getAuthConfig()
  const rawCookie = getCookie(event, cookieName)

  if (!rawCookie) {
    return restoreFromFallbackSession(event)
  }

  const parsedSessionCookie = parseSessionIdFromCookie(decodeURIComponent(rawCookie))

  if (!parsedSessionCookie) {
    clearAuthCookieClientValue(event)
    return restoreFromFallbackSession(event)
  }

  const keyIndex = Number.parseInt(parsedSessionCookie.keyId.replace(/^k/, ''), 10)
  const secretForVerification = Number.isInteger(keyIndex) ? sessionSecrets[keyIndex] : undefined

  if (!secretForVerification || !verifySessionCookieSignature(parsedSessionCookie.sessionId, parsedSessionCookie.signature, secretForVerification)) {
    clearAuthCookieClientValue(event)
    return restoreFromFallbackSession(event)
  }

  const storage = await getSessionStorage()
  const storageKey = buildSessionStorageKey(parsedSessionCookie.sessionId)
  const storedSession = await storage.getItem<LegacyStoredAuthCookie>(storageKey)

  if (!storedSession) {
    await storage.removeItem(storageKey)
    clearAuthCookieClientValue(event)
    return restoreFromFallbackSession(event)
  }

  const normalizedSession = normalizeStoredSession(storedSession, ttlSeconds)

  if (!normalizedSession || isExpired(normalizedSession.expiresAt)) {
    await storage.removeItem(storageKey)
    clearAuthCookieClientValue(event)
    return restoreFromFallbackSession(event)
  }

  const refreshedSession: StoredAuthSessionRecord = {
    token: normalizedSession.token,
    sessionVersion: normalizedSession.sessionVersion,
    userSnapshot: normalizedSession.userSnapshot,
    expiresAt: new Date(Date.now() + ttlSeconds * 1000).toISOString(),
  }

  await storage.setItem(storageKey, refreshedSession, ttlSeconds)
  setClientCookie(
    event,
    encodeSessionIdCookie(parsedSessionCookie.sessionId, parsedSessionCookie.keyId, secretForVerification),
    ttlSeconds,
  )

  return {
    token: refreshedSession.token,
    sessionVersion: refreshedSession.sessionVersion,
    userSnapshot: refreshedSession.userSnapshot,
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
  const { cookieName } = getAuthConfig()
  const rawCookie = getCookie(event, cookieName)
  const rawFallbackCookie = getCookie(event, buildFallbackCookieName())

  if (rawCookie) {
    const parsedSessionCookie = parseSessionIdFromCookie(decodeURIComponent(rawCookie))

    if (parsedSessionCookie) {
      const storage = await getSessionStorage()
      await storage.removeItem(buildSessionStorageKey(parsedSessionCookie.sessionId))
    }
  }

  if (rawFallbackCookie) {
    const storage = await getSessionStorage()
    await storage.removeItem(buildFallbackStorageKey(rawFallbackCookie))
  }

  clearAuthCookieClientValue(event)
  clearFallbackCookieClientValue(event)
}
