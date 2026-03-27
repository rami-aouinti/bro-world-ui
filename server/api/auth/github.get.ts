import { buildAuthSession } from '../../../server/utils/authSessionBuilder'

interface GithubOAuthUser {
  id?: number | string
  email?: string | null
}

interface SocialLoginResponse {
  token?: string
}

const createSocialLoginError = () => createError({
  statusCode: 502,
  statusMessage: 'Unable to authenticate with GitHub',
  data: {
    code: 'AUTH_SOCIAL_PROVIDER_FAILED',
  },
})

export default defineOAuthGitHubEventHandler({
  async onSuccess(event, { user }) {
    const config = useRuntimeConfig()
    console.log('user', user)
    const githubUser = user as GithubOAuthUser
    const email = githubUser.email?.trim()
    const providerId = String(githubUser.id ?? '').trim()

    let socialLoginResponse: SocialLoginResponse

    try {
      socialLoginResponse = await $fetch<SocialLoginResponse>('/api/v1/auth/social_login', {
        method: 'POST',
        baseURL: config.public.apiBase,
        body: {
          email,
          provider: 'github',
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
    return sendRedirect(event, '/login?socialError=github')
  },
})
