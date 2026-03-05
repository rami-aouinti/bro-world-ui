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

const decodeAuthCookie = (raw: string): StoredAuthCookie | null => {
  try {
    const parsed = JSON.parse(Buffer.from(raw, 'base64url').toString('utf-8')) as StoredAuthCookie

    if (!parsed || typeof parsed !== 'object') {
      return null
    }

    return parsed
  }
  catch {
    return null
  }
}

const decodeLegacyTokenCookie = (raw: string): string | null => {
  const token = raw.trim().replace(/^Bearer\s+/i, '')

  return token || null
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

  const payload = decodeAuthCookie(rawCookie)

  if (!payload) {
    const legacyToken = decodeLegacyTokenCookie(rawCookie)

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
