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
    langDir: 'i18n/locales',
  },
  runtimeConfig: {
    public: {
      apiBase: process.env.NUXT_PUBLIC_API_BASE || 'http://localhost',
    },
  },
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
})
