import { computed, onMounted, watch } from 'vue'
import { useTheme } from 'vuetify'
import {
  buildThemeName,
  defaultThemePreference,
  parseThemeName,
  readThemePreferenceFromSession,
  THEME_SESSION_STORAGE_KEY,
  themeRadiusOptions,
  themeShadowOptions,
  themePrimaryOptions,
  type ThemeRadius,
  type ThemeMode,
  type ThemePreference,
  type ThemePrimary,
  type ThemeShadow,
} from '~/utils/themePreferences'

const THEME_CONFIGURATION_KEY = 'user.dashboard.theme'
const SERVER_SESSION_PLACEHOLDER = '__server_session__'

export const useThemePreferences = () => {
  const theme = useTheme()
  const authSession = useAuthSessionStore()
  const { apiFetch } = useApiClient()

  const ensureValidTheme = () => {
    const parsed = parseThemeName(theme.global.name.value)
    if (parsed) {
      return parsed
    }

    theme.global.name.value = buildThemeName(defaultThemePreference)
    return defaultThemePreference
  }

  ensureValidTheme()

  const preference = computed<ThemePreference>(() => parseThemeName(theme.global.name.value) ?? defaultThemePreference)

  const applyThemePreference = (next: ThemePreference) => {
    theme.global.name.value = buildThemeName(next)
    if (!import.meta.client) {
      return
    }

    const root = document.documentElement
    const radius = themeRadiusOptions.find(option => option.value === next.radius)?.radius
      ?? themeRadiusOptions[0]?.radius
      ?? '14px'
    const shadow = themeShadowOptions.find(option => option.value === next.shadow)?.shadow
      ?? themeShadowOptions[0]?.shadow
      ?? '0 8px 22px rgba(15, 23, 42, 0.14)'

    root.style.setProperty('--ui-radius', radius)
    root.style.setProperty('--ui-theme-shadow', shadow)
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

  const setThemeRadius = (radius: ThemeRadius) => {
    applyThemePreference({
      ...preference.value,
      radius,
    })
  }

  const setThemeShadow = (shadow: ThemeShadow) => {
    applyThemePreference({
      ...preference.value,
      shadow,
    })
  }

  const persistThemePreference = (next: ThemePreference) => {
    if (!import.meta.client) {
      return
    }

    window.sessionStorage.setItem(THEME_SESSION_STORAGE_KEY, JSON.stringify(next))
  }

  const canSyncTheme = computed(() => Boolean(authSession.token && authSession.token !== SERVER_SESSION_PLACEHOLDER))

  const persistThemePreferenceToApi = async (next: ThemePreference) => {
    if (!canSyncTheme.value) {
      return
    }

    await apiFetch('/api/v1/profile/configuration', {
      method: 'POST',
      body: {
        configurationKey: THEME_CONFIGURATION_KEY,
        configurationValue: next,
      },
    })
  }

  onMounted(() => {
    ;(async () => {
      const sessionPreference = readThemePreferenceFromSession()
      if (sessionPreference) {
        applyThemePreference(sessionPreference)
      }
      else {
        try {
          const remotePreference = await apiFetch<{ configurationValue?: unknown }>(`/api/v1/profile/configuration/${THEME_CONFIGURATION_KEY}`, {
            method: 'GET',
          })
          if (remotePreference.configurationValue && import.meta.client) {
            window.sessionStorage.setItem(THEME_SESSION_STORAGE_KEY, JSON.stringify(remotePreference.configurationValue))
          }
          const loadedPreference = readThemePreferenceFromSession()
          applyThemePreference(loadedPreference ?? defaultThemePreference)
        }
        catch {
          ensureValidTheme()
        }
      }

      persistThemePreference(preference.value)
    })()
  })
  watch(preference, (next) => {
    persistThemePreference(next)
    persistThemePreferenceToApi(next).catch(() => {})
  }, { deep: true })

  return {
    preference,
    primaryOptions: themePrimaryOptions,
    radiusOptions: themeRadiusOptions,
    shadowOptions: themeShadowOptions,
    isDark: computed(() => preference.value.mode === 'dark'),
    toggleThemeMode,
    setThemeMode,
    setPrimaryTheme,
    setThemeRadius,
    setThemeShadow,
  }
}
