import type { H3Event } from 'h3'

export interface StoredAuthCookie {
  token: string
  expiresAt: string
  sessionVersion?: number
}

interface LegacyStoredAuthCookie {
  token: string
  expiresAt?: string
  profile?: Record<string, unknown> | null
  roles?: string[]
  locale?: string | null
  sessionVersion?: number
}

export type AuthCookiePayload = Omit<StoredAuthCookie, 'expiresAt'>

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

const normalizeStoredAuthCookie = (parsed: LegacyStoredAuthCookie, ttlSeconds: number): { cookie: StoredAuthCookie, migrated: boolean } | null => {
  if (!parsed.token.trim()) {
    return null
  }

  const hasValidExpiresAt = typeof parsed.expiresAt === 'string' && !Number.isNaN(new Date(parsed.expiresAt).getTime())

  const cookie: StoredAuthCookie = {
    token: parsed.token,
    expiresAt: hasValidExpiresAt ? parsed.expiresAt as string : new Date(Date.now() + ttlSeconds * 1000).toISOString(),
    sessionVersion: typeof parsed.sessionVersion === 'number' ? parsed.sessionVersion : 1,
  }

  const migrated = !hasValidExpiresAt
    || parsed.profile !== undefined
    || parsed.roles !== undefined
    || parsed.locale !== undefined
    || typeof parsed.sessionVersion !== 'number'

  return { cookie, migrated }
}

const encodeAuthCookie = (payload: StoredAuthCookie) => Buffer
  .from(JSON.stringify(payload), 'utf-8')
  .toString('base64url')

const decodeAuthCookie = (raw: string, ttlSeconds: number): { cookie: StoredAuthCookie, migrated: boolean } | null => {
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
  }
}

const getSessionStorage = () => useStorage('data')

const AUTH_SESSION_STORAGE_BASE_KEY = 'auth:session:'
const buildSessionStorageKey = (sessionId: string) => `${AUTH_SESSION_STORAGE_BASE_KEY}${sessionId}`

const parseSessionIdFromCookie = (rawCookie: string) => {
  const normalized = rawCookie.trim().replace(/^"|"$/g, '')

  if (!normalized.startsWith('sid:')) {
    return null
  }

  return normalized.slice(4).trim() || null
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
  const { ttlSeconds, cookieName, cookieSecure, cookieSameSite } = getAuthConfig()
  const secure = shouldUseSecureCookie(event, cookieSecure)

  const nextCookiePayload: StoredAuthCookie = {
    token: payload.token,
    sessionVersion: payload.sessionVersion ?? 1,
    expiresAt: new Date(Date.now() + ttlSeconds * 1000).toISOString(),
  }

  setCookie(event, cookieName, encodeAuthCookie(nextCookiePayload), {
    path: '/',
    maxAge: ttlSeconds,
    httpOnly: true,
    secure,
    sameSite: cookieSameSite,
  })

  return nextCookiePayload
}

export const readAuthCookie = async (event: H3Event): Promise<StoredAuthCookie | null> => {
  const { cookieName, ttlSeconds } = getAuthConfig()
  const rawCookie = getCookie(event, cookieName)

  if (!rawCookie) {
    return null
  }

  const decodedCookie = decodeURIComponent(rawCookie)
  const sessionId = parseSessionIdFromCookie(decodedCookie)

  if (sessionId) {
    const storage = getSessionStorage()
    const storedSession = await storage.getItem<LegacyStoredAuthCookie>(buildSessionStorageKey(sessionId))

    if (!storedSession) {
      await storage.removeItem(buildSessionStorageKey(sessionId))
      return null
    }

    const normalizedStoredSession = normalizeStoredAuthCookie(storedSession, ttlSeconds)

    if (!normalizedStoredSession || isExpired(normalizedStoredSession.cookie.expiresAt)) {
      await storage.removeItem(buildSessionStorageKey(sessionId))
      return null
    }

    if (normalizedStoredSession.migrated) {
      await storage.setItem(buildSessionStorageKey(sessionId), normalizedStoredSession.cookie)
    }

    return normalizedStoredSession.cookie
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
    return null
  }

  if (payload.migrated) {
    return setAuthCookie(event, {
      token: payload.cookie.token,
      sessionVersion: payload.cookie.sessionVersion,
    })
  }

  return payload.cookie
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
  const { cookieName, cookieSecure, cookieSameSite } = getAuthConfig()
  const secure = shouldUseSecureCookie(event, cookieSecure)
  const rawCookie = getCookie(event, cookieName)

  if (rawCookie) {
    const decodedCookie = decodeURIComponent(rawCookie)
    const sessionId = parseSessionIdFromCookie(decodedCookie)

    if (sessionId) {
      const storage = getSessionStorage()
      await storage.removeItem(buildSessionStorageKey(sessionId))
    }
  }

  setCookie(event, cookieName, '', {
    path: '/',
    maxAge: 0,
    httpOnly: true,
    secure,
    sameSite: cookieSameSite,
  })
}
