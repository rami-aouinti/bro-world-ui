import {
  clearAuthCookie,
  readAuthCookie,
  requireAuthCookie,
  setAuthCookie,
  type AuthCookiePayload,
  type StoredAuthCookie,
} from './authCookie'

export type SessionPayload = AuthCookiePayload
export type StoredSession = StoredAuthCookie

export const setSession = setAuthCookie
export const readSession = readAuthCookie
export const requireSession = requireAuthCookie
export const clearAuthSession = clearAuthCookie
