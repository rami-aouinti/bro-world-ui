import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import {
  buildThemeName,
  buildVuetifyThemes,
  defaultThemePreference,
  readThemePreferenceFromSession,
} from '~/utils/themePreferences'

export default defineNuxtPlugin((nuxtApp) => {
  const initialPreference = readThemePreferenceFromSession() ?? defaultThemePreference

  const vuetify = createVuetify({
    components,
    directives,
    theme: {
      defaultTheme: buildThemeName(initialPreference),
      themes: buildVuetifyThemes(),
    },
    defaults: {
      global: {
        ripple: true,
      },
      VCard: {
        rounded: 'xl',
        elevation: 0,
      },
      VBtn: {
        rounded: 'pill',
        variant: 'flat',
        density: 'comfortable',
      },
      VTextField: {
        rounded: 'xl',
        variant: 'outlined',
        density: 'compact',
      },
      VChip: {
        rounded: 'pill',
        density: 'comfortable',
      },
      VMenu: {
        rounded: 'xl',
      },
      VDialog: {
        rounded: 'xl',
      },
      VSelect: {
        density: 'compact',
      },
      VAutocomplete: {
        density: 'compact',
      },
      VTextarea: {
        density: 'comfortable',
      },
      VList: {
        density: 'comfortable',
      },
      VListItem: {
        density: 'comfortable',
      },
      VDataTable: {
        density: 'comfortable',
      },
    },
  })

  nuxtApp.vueApp.use(vuetify)
})
