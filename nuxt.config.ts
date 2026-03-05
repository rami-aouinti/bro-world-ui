const ONE_YEAR_IN_SECONDS = 60 * 60 * 24 * 365

export default defineNuxtConfig({
  modules: ['vuetify-nuxt-module', '@nuxtjs/i18n', '@pinia/nuxt'],
  css: [
    'vuetify/styles',
    '~/assets/styles/material-dashboard.scss',
    '~/assets/styles/index.css',
  ],
  i18n: {
    defaultLocale: 'en',
    fallbackLocale: 'en',
    strategy: 'no_prefix',
    detectBrowserLanguage: false,
    locales: [
      { code: 'en', file: 'en.json', name: 'English' },
      { code: 'fr', file: 'fr.json', name: 'Français' },
    ],
    lazy: true,
    langDir: 'locales',
  },
  runtimeConfig: {
    redisUrl: process.env.REDIS_URL || '',
    session: {
      ttlSeconds: Number(process.env.SESSION_TTL_SECONDS || ONE_YEAR_IN_SECONDS),
      cookieName: process.env.SESSION_COOKIE_NAME || 'session_id',
      cookieSecure: process.env.SESSION_COOKIE_SECURE !== 'false',
      cookieSameSite: (process.env.SESSION_COOKIE_SAME_SITE || 'lax') as 'lax' | 'strict',
    },
    public: {
      apiBase: process.env.NUXT_PUBLIC_API_BASE || 'http://localhost',
    },
  },
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
})
