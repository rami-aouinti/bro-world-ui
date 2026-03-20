import { computed } from 'vue'
import { useTheme } from 'vuetify'
import {
  buildThemeName,
  defaultThemePreference,
  parseThemeName,
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

  return {
    preference,
    primaryOptions: themePrimaryOptions,
    isDark: computed(() => preference.value.mode === 'dark'),
    toggleThemeMode,
    setThemeMode,
    setPrimaryTheme,
  }
}
