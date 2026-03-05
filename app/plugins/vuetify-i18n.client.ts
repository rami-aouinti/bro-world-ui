export default defineNuxtPlugin((nuxtApp) => {
  const i18n = nuxtApp.$i18n

  if (!i18n) {
    return
  }

  const vuetifyLocaleMessages = {
    en: {
      badge: 'Badge',
    },
    fr: {
      badge: 'Badge',
    },
  } as const

  Object.entries(vuetifyLocaleMessages).forEach(([locale, messages]) => {
    i18n.mergeLocaleMessage(locale, {
      $vuetify: messages,
    })
  })
})
