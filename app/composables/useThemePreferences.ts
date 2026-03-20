import { computed, onMounted, watch } from 'vue'
import { useTheme } from 'vuetify'
import {
  buildThemeName,
  defaultThemePreference,
  parseThemeName,
  readThemePreferenceFromSession,
  THEME_SESSION_STORAGE_KEY,
  themePrimaryOptions,
  type ThemeMode,
  type ThemePreference,
  type ThemePrimary,
} from '~/utils/themePreferences'

export const useThemePreferences = () => {
  const theme = useTheme()

  const preference = computed<ThemePreference>(() => parseThemeName(theme.global.name.value) ?? defaultThemePreference)

  const applyThemePreference = (next: ThemePreference) => {
    theme.global.name.value = buildThemeName(next)
  }

  const toggleThemeMode = () => {
    applyThemePreference({
      mode: preference.value.mode === 'dark' ? 'light' : 'dark',
      primary: preference.value.primary,
    })
  }

  const setThemeMode = (mode: ThemeMode) => {
    applyThemePreference({
      mode,
      primary: preference.value.primary,
    })
  }

  const setPrimaryTheme = (primary: ThemePrimary) => {
    applyThemePreference({
      mode: preference.value.mode,
      primary,
    })
  }

  const persistThemePreference = (next: ThemePreference) => {
    if (!import.meta.client) {
      return
    }

    window.sessionStorage.setItem(THEME_SESSION_STORAGE_KEY, JSON.stringify(next))
  }

  onMounted(() => {
    const sessionPreference = readThemePreferenceFromSession()
    if (sessionPreference) {
      applyThemePreference(sessionPreference)
    }

    persistThemePreference(preference.value)
  })
  watch(preference, persistThemePreference, { deep: true })

  return {
    preference,
    primaryOptions: themePrimaryOptions,
    isDark: computed(() => preference.value.mode === 'dark'),
    toggleThemeMode,
    setThemeMode,
    setPrimaryTheme,
  }
}
