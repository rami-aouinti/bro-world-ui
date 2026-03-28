import { buildAuthSession } from '../../../server/utils/authSessionBuilder'

interface FacebookOAuthUser {
  id?: string
  email?: string | null
}

interface SocialLoginResponse {
  token?: string
}

const createSocialLoginError = () => createError({
  statusCode: 502,
  statusMessage: 'Unable to authenticate with Facebook',
  data: {
    code: 'AUTH_SOCIAL_PROVIDER_FAILED',
  },
})

export default defineOAuthFacebookEventHandler({
  async onSuccess(event, { user }) {
    const config = useRuntimeConfig()
    const facebookUser = user as FacebookOAuthUser
    const email = facebookUser.email?.trim()
    const providerId = String(facebookUser.id ?? '').trim()

    let socialLoginResponse: SocialLoginResponse

    try {
      socialLoginResponse = await $fetch<SocialLoginResponse>('/api/v1/auth/social_login', {
        method: 'POST',
        baseURL: config.public.apiBase,
        body: {
          email,
          provider: 'facebook',
          providerId,
        },
      })
    }
    catch {
      throw createSocialLoginError()
    }

    await buildAuthSession(event, socialLoginResponse?.token)

    const redirectTarget = getQuery(event).redirect
    const target = typeof redirectTarget === 'string' && redirectTarget.startsWith('/')
      ? redirectTarget
      : '/'

    return sendRedirect(event, target)
  },
  onError(event) {
    return sendRedirect(event, '/login?socialError=facebook')
  },
})
