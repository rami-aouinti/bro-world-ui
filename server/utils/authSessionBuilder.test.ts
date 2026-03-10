import assert from 'node:assert/strict'
import { beforeEach, describe, it, mock } from 'node:test'
import {
  AUTH_ERROR_CODES,
  createAuthSessionBuilder,
  fetchProfileWithAuthorization,
  normalizeBearerToken,
} from './authSessionBuilder.ts'

beforeEach(() => {
  ;(globalThis as any).createError = (payload: unknown) => payload
})

describe('authSessionBuilder', () => {
  it('normalise un bearer token', () => {
    assert.equal(normalizeBearerToken('Bearer abc'), 'abc')
    assert.equal(normalizeBearerToken(' bearer xyz  '), 'xyz')
  })

  it('retourne une erreur homogène si le token est invalide', async () => {
    const builder = createAuthSessionBuilder({
      fetchProfile: async () => {
        throw new Error('must not be called')
      },
      persistCookie: async () => {
        throw new Error('must not be called')
      },
    })

    await assert.rejects(builder({} as never, '  '), {
      statusCode: 401,
      statusMessage: 'Invalid authentication token',
      data: {
        code: AUTH_ERROR_CODES.TOKEN_INVALID,
      },
    })
  })

  it('retourne une erreur homogène si le backend profile est KO', async () => {
    ;(globalThis as any).useRuntimeConfig = () => ({ public: { apiBase: 'http://api.example.test' } })
    ;(globalThis as any).$fetch = mock.fn(async () => {
      throw new Error('backend down')
    })

    await assert.rejects(fetchProfileWithAuthorization('valid-token'), {
      statusCode: 502,
      statusMessage: 'Unable to retrieve user profile',
      data: {
        code: AUTH_ERROR_CODES.PROFILE_FETCH_FAILED,
      },
    })
  })

  it('retourne une erreur homogène si le profil est incomplet', async () => {
    const builder = createAuthSessionBuilder({
      fetchProfile: async () => ({
        id: 'u1',
        username: 'john',
        firstName: 'John',
        lastName: 'Doe',
        email: '',
        roles: [],
        timezone: 'Europe/Paris',
      }),
      persistCookie: async () => {
        throw new Error('must not be called')
      },
    })

    await assert.rejects(builder({} as never, 'Bearer valid-token'), {
      statusCode: 502,
      statusMessage: 'Incomplete user profile',
      data: {
        code: AUTH_ERROR_CODES.PROFILE_INVALID,
      },
    })
  })

  it('construit la session et le cookie quand tout est valide', async () => {
    const persistCookie = mock.fn(async () => ({
      token: 'valid-token',
      profile: {
        id: 'u1',
        userId: 'u1',
        username: 'john',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
      },
      roles: ['user'],
      locale: 'fr',
      expiresAt: '2030-01-01T00:00:00.000Z',
    }))

    const builder = createAuthSessionBuilder({
      fetchProfile: async () => ({
        id: 'u1',
        username: 'john',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        roles: ['user'],
        language: 'fr',
        timezone: 'Europe/Paris',
      }),
      persistCookie: persistCookie as never,
    })

    const response = await builder({} as never, 'Bearer valid-token')

    assert.equal(persistCookie.mock.callCount(), 1)
    assert.deepEqual(response, {
      authenticated: true,
      profile: {
        id: 'u1',
        userId: 'u1',
        username: 'john',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
      },
      roles: ['user'],
      locale: 'fr',
      expiresAt: '2030-01-01T00:00:00.000Z',
    })
  })
})
