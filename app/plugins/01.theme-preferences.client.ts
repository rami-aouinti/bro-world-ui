import { watch } from 'vue'
import { useTheme } from 'vuetify'
import {
  buildThemeName,
  defaultThemePreference,
  isThemePreference,
  parseThemeName,
  THEME_SESSION_STORAGE_KEY,
} from '~/app/utils/themePreferences'

export default defineNuxtPlugin(() => {
  const theme = useTheme()

  const persist = () => {
    const preference = parseThemeName(theme.global.name.value) ?? defaultThemePreference
    window.sessionStorage.setItem(THEME_SESSION_STORAGE_KEY, JSON.stringify(preference))
  }

  const hydrate = () => {
    const raw = window.sessionStorage.getItem(THEME_SESSION_STORAGE_KEY)
    if (!raw) {
      persist()
      return
    }

    try {
      const parsed = JSON.parse(raw)
      if (!isThemePreference(parsed)) {
        persist()
        return
      }

      theme.global.name.value = buildThemeName(parsed)
    }
    catch {
      persist()
    }
  }

  hydrate()
  watch(() => theme.global.name.value, persist)
})
