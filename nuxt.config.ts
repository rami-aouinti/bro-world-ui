const ONE_YEAR_IN_SECONDS = 60 * 60 * 24 * 365
const DEV_SESSION_PASSWORD = 'dev-session-password-change-me-please-32chars'
const sessionPassword =
  process.env.NUXT_SESSION_PASSWORD
  || (process.env.NODE_ENV !== 'production' ? DEV_SESSION_PASSWORD : '')

export default defineNuxtConfig({
  app: {
    head: {
      meta: [
        {
          name: 'description',
          content: 'Bro World platform',
        },
      ],
    },
  },
  modules: ['vuetify-nuxt-module', '@nuxtjs/i18n', '@pinia/nuxt', 'nuxt-auth-utils'],
  css: [
    'vuetify/styles',
    '~/assets/styles/material-dashboard.scss',
    '~/assets/styles/index.css',
    '~/assets/styles/pages/index.scss',
    '~/assets/styles/pages/platform-layout.scss',
    '~/assets/styles/layout-split.scss',
    '~/assets/styles/recruit.scss',
  ],
  i18n: {
    defaultLocale: 'en',
    fallbackLocale: 'en',
    strategy: 'no_prefix',
    detectBrowserLanguage: false,
    locales: [
      { code: 'en', file: 'en.json', name: 'English' },
      { code: 'fr', file: 'fr.json', name: 'Français' },
      { code: 'es', file: 'es.json', name: 'Español' },
      { code: 'de', file: 'de.json', name: 'Deutsch' },
      { code: 'ar', file: 'ar.json', name: 'العربية' },
      { code: 'pt', file: 'pt.json', name: 'Português' },
    ],
    lazy: true,
    langDir: 'locales',
  },
  runtimeConfig: {
    redisUrl: process.env.REDIS_URL || '',
    cacheEnv: process.env.CACHE_ENV || process.env.NODE_ENV || 'dev',
    cacheApp: process.env.CACHE_APP || 'bro-ui',
    cacheVersion: process.env.CACHE_VERSION || 'v1',
    session: {
      name: 'nuxt-session',
      password: sessionPassword,
      ttlSeconds: Number(process.env.SESSION_TTL_SECONDS || ONE_YEAR_IN_SECONDS),
      // Avoid collision with nuxt-auth-utils default cookie (`session_id` / `sid:*`).
      // Our auth flow stores the whole auth payload in this cookie.
      cookieName: process.env.SESSION_COOKIE_NAME || 'bro_world_auth_session',
      cookieSecure: process.env.SESSION_COOKIE_SECURE
        ? process.env.SESSION_COOKIE_SECURE !== 'false'
        : process.env.NODE_ENV === 'production',
      cookieSameSite: (process.env.SESSION_COOKIE_SAME_SITE || 'lax') as 'lax' | 'strict',
    },
    public: {
      apiBase: process.env.NUXT_PUBLIC_API_BASE || 'http://localhost',
    },
  },
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
})
