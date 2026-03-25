import assert from 'node:assert/strict'
import { beforeEach, describe, it, mock } from 'node:test'
import {
  AUTH_ERROR_CODES,
  buildProfileSnapshot,
  createAuthSessionBuilder,
  fetchProfileWithAuthorization,
  mapToSessionResponse,
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

  it('appelle /users/me et mappe la réponse vers UserProfile', async () => {
    ;(globalThis as any).useRuntimeConfig = () => ({ public: { apiBase: 'http://api.example.test' } })
    const fetchMock = mock.fn(async () => ({
      id: 'u1',
      username: 'john',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      roles: ['user'],
      locale: 'fr',
    }))
    ;(globalThis as any).$fetch = fetchMock

    const profile = await fetchProfileWithAuthorization('valid-token')

    assert.deepEqual(profile, {
      id: 'u1',
      username: 'john',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      language: undefined,
      locale: 'fr',
      timezone: 'UTC',
      photo: undefined,
      roles: ['user'],
      userGroups: undefined,
    })
    assert.deepEqual(fetchMock.mock.calls[0]?.arguments[0], '/api/v1/users/me')
  })

  it('retourne une erreur auth si le profile backend répond 401/403', async () => {
    ;(globalThis as any).useRuntimeConfig = () => ({ public: { apiBase: 'http://api.example.test' } })
    ;(globalThis as any).$fetch = mock.fn(async () => {
      throw {
        response: {
          status: 401,
        },
      }
    })

    await assert.rejects(fetchProfileWithAuthorization('expired-token'), {
      statusCode: 401,
      statusMessage: 'Unauthorized profile access',
      data: {
        code: AUTH_ERROR_CODES.PROFILE_UNAUTHORIZED,
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
      sessionVersion: 1,
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
    assert.deepEqual(persistCookie.mock.calls[0]?.arguments[1], {
      token: 'valid-token',
      sessionVersion: 1,
      userSnapshot: {
        id: 'u1',
        username: 'john',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        photo: undefined,
      },
    })
    assert.deepEqual(response, {
      authenticated: true,
      profile: {
        id: 'u1',
        username: 'john',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        roles: ['user'],
        language: 'fr',
        timezone: 'Europe/Paris',
      },
      roles: ['user'],
      locale: 'fr',
      expiresAt: '2030-01-01T00:00:00.000Z',
    })
  })

  it('construit un snapshot minimal du profil', () => {
    const snapshot = buildProfileSnapshot({
      id: 'u1',
      username: 'john',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      roles: ['user'],
      timezone: 'UTC',
      language: 'fr',
      locale: 'fr-FR',
      photo: 'https://cdn.example.test/avatar.jpg',
      userGroups: ['g1'],
    })

    assert.deepEqual(snapshot, {
      id: 'u1',
      username: 'john',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      photo: 'https://cdn.example.test/avatar.jpg',
    })
  })

  it('mapToSessionResponse conserve roles, locale et expiresAt', () => {
    const response = mapToSessionResponse({
      id: 'u1',
      username: 'john',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      roles: ['admin'],
      language: 'fr',
      locale: 'fr-CA',
      timezone: 'America/Toronto',
    }, {
      token: 'valid-token',
      sessionVersion: 1,
      expiresAt: '2030-01-01T00:00:00.000Z',
    })

    assert.equal(response.roles[0], 'admin')
    assert.equal(response.locale, 'fr-CA')
    assert.equal(response.expiresAt, '2030-01-01T00:00:00.000Z')
  })
})
