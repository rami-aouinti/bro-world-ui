import type { AuthCookiePayload, StoredAuthCookie } from './authCookie'
import { clearAuthCookie, readAuthCookie, requireAuthCookie, setAuthCookie } from './authCookie'

export interface StoredSession extends StoredAuthCookie {}
export type UserSessionPayload = AuthCookiePayload

const getTtlSeconds = () => {
  const config = useRuntimeConfig()
  return Math.max(900, Number(config.session.ttlSeconds || 60 * 60 * 8))
}

const withExpiry = (payload: UserSessionPayload): StoredSession => ({
  ...payload,
  expiresAt: new Date(Date.now() + getTtlSeconds() * 1000).toISOString(),
})

const encodeSession = (session: StoredSession) => Buffer.from(JSON.stringify(session), 'utf-8').toString('base64url')

const decodeSession = (raw: string): StoredSession | null => {
  try {
    const parsed = JSON.parse(Buffer.from(raw, 'base64url').toString('utf-8')) as StoredSession

    if (!parsed || typeof parsed !== 'object' || typeof parsed.token !== 'string') {
      return null
    }

    const expiresAt = new Date(parsed.expiresAt).getTime()
    if (Number.isNaN(expiresAt) || expiresAt <= Date.now()) {
      return null
    }

    return parsed
  }
  catch {
    return null
  }
}

export const createSession = async (payload: UserSessionPayload) => {
  const session = withExpiry(payload)

  return {
    sessionId: encodeSession(session),
    session,
  }
}

export const setUserSession = async (event: H3Event, payload: UserSessionPayload) => {
  return setAuthCookie(event, payload)
}

export const getSession = async (sessionId: string) => {
  return decodeSession(sessionId)
}

export const refreshSession = async (_sessionId: string, session: StoredSession) => {
  const { token, profile, roles, locale } = session
  return withExpiry({ token, profile, roles, locale })
}

export const clearSession = async (_sessionId: string) => {
}

export const readSessionFromEvent = async (event: H3Event) => {
  const session = readAuthCookie(event)

  if (!session) {
    return null
  }

  return {
    sessionId: getCookie(event, useRuntimeConfig().session.cookieName) || '',
    session,
  }
}

export const requireSession = async (event: H3Event) => {
  const session = requireAuthCookie(event)

  return {
    sessionId: getCookie(event, useRuntimeConfig().session.cookieName) || '',
    session,
  }
}

export const applySessionCookie = (event: H3Event, sessionId: string, session?: StoredSession) => {
  const payload = session || decodeSession(sessionId)

  if (!payload) {
    return
  }

  const { token, profile, roles, locale } = payload
  setAuthCookie(event, { token, profile, roles, locale })
}

export const clearSessionCookie = (event: H3Event) => {
  clearAuthCookie(event)
}
