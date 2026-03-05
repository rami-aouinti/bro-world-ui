export default defineNuxtConfig({
  modules: ['vuetify-nuxt-module'],
  css: [
    'vuetify/styles',
    '~/assets/styles/material-dashboard.scss',
    '~/assets/styles/index.css',
  ],
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
})
