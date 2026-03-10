import type { RegisterPayload, TokenResponse } from '../../../app/types/api/common'
import { buildAuthSession } from '../../../server/utils/authSessionBuilder'

const createAuthProviderError = () => createError({
  statusCode: 502,
  statusMessage: 'Unable to register account',
  data: {
    code: 'AUTH_PROVIDER_FAILED',
  },
})

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const payload = await readBody<RegisterPayload>(event)

  let authResponse: TokenResponse

  try {
    authResponse = await $fetch<TokenResponse>('/api/v1/auth/register', {
      method: 'POST',
      baseURL: config.public.apiBase,
      body: payload,
    })
  }
  catch {
    throw createAuthProviderError()
  }

  return buildAuthSession(event, authResponse?.token)
})
