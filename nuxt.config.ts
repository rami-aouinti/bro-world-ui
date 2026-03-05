export default defineNuxtConfig({
  modules: ["vuetify-nuxt-module"],
  css: [
    "vuetify/styles",
    "~/app/assets/styles/material-dashboard.scss",
    "~/app/assets/styles/index.css",
  ],
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true }
})
