import type { H3Event } from 'h3'

export interface StoredAuthCookie {
  token: string
  profile: Record<string, unknown> | null
  roles: string[]
  locale: string | null
  expiresAt: string
}

export type AuthCookiePayload = Omit<StoredAuthCookie, 'expiresAt'>

const encodeAuthCookie = (payload: StoredAuthCookie) => Buffer.from(JSON.stringify(payload), 'utf-8').toString('base64url')

const parseStoredAuthCookie = (value: string): StoredAuthCookie | null => {
  try {
    const parsed = JSON.parse(value) as StoredAuthCookie

    if (!parsed || typeof parsed !== 'object' || typeof parsed.token !== 'string') {
      return null
    }

    return parsed
  }
  catch {
    return null
  }
}

const decodeAuthCookie = (raw: string): StoredAuthCookie | null => {
  const normalized = raw.trim().replace(/^"|"$/g, '')

  if (!normalized) {
    return null
  }

  const fromBase64 = parseStoredAuthCookie(Buffer.from(normalized, 'base64url').toString('utf-8'))

  if (fromBase64) {
    return fromBase64
  }

  return parseStoredAuthCookie(normalized)
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

export const setAuthCookie = (event: H3Event, payload: AuthCookiePayload) => {
  const { ttlSeconds, cookieName, cookieSecure, cookieSameSite } = getAuthConfig()
  const secure = shouldUseSecureCookie(event, cookieSecure)

  const nextCookiePayload: StoredAuthCookie = {
    ...payload,
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

export const readAuthCookie = (event: H3Event): StoredAuthCookie | null => {
  const { cookieName, ttlSeconds } = getAuthConfig()
  const rawCookie = getCookie(event, cookieName)

  if (!rawCookie) {
    return null
  }

  const decodedCookie = decodeURIComponent(rawCookie)
  const payload = decodeAuthCookie(decodedCookie)

  if (!payload) {
    const legacyToken = decodeLegacyTokenCookie(decodedCookie)

    if (!legacyToken) {
      return null
    }

    return {
      token: legacyToken,
      profile: null,
      roles: [],
      locale: null,
      expiresAt: new Date(Date.now() + ttlSeconds * 1000).toISOString(),
    }
  }

  if (isExpired(payload.expiresAt)) {
    return null
  }

  return payload
}

export const requireAuthCookie = (event: H3Event) => {
  const authCookie = readAuthCookie(event)

  if (!authCookie) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized',
    })
  }

  return authCookie
}

export const clearAuthCookie = (event: H3Event) => {
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
