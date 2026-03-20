export type ThemeMode = 'light' | 'dark'
export type ThemePrimary = 'pink' | 'blue' | 'green' | 'purple'

export interface ThemePreference {
  mode: ThemeMode
  primary: ThemePrimary
}

export const THEME_SESSION_STORAGE_KEY = 'bro-world-theme'

export const themePrimaryOptions: Array<{ value: ThemePrimary, label: string, color: string }> = [
  { value: 'pink', label: 'Pink', color: '#e91e63' },
  { value: 'blue', label: 'Blue', color: '#1a73e8' },
  { value: 'green', label: 'Green', color: '#43a047' },
  { value: 'purple', label: 'Purple', color: '#7e57c2' },
]

const LIGHT_BASE_COLORS = {
  background: '#f8f9fa',
  surface: '#ffffff',
  'surface-bright': '#ffffff',
  'surface-light': '#f8f9fa',
  'surface-variant': '#f0f2f5',
  secondary: '#7b809a',
  info: '#1a73e8',
  success: '#4caf50',
  warning: '#fb8c00',
  error: '#f44335',
  'on-background': '#344767',
  'on-surface': '#344767',
  'on-primary': '#ffffff',
}

const DARK_BASE_COLORS = {
  background: '#111827',
  surface: '#1f2937',
  'surface-bright': '#334155',
  'surface-light': '#1f2937',
  'surface-variant': '#243044',
  secondary: '#9aa2bf',
  info: '#49a3f1',
  success: '#66bb6a',
  warning: '#ffa726',
  error: '#ef5350',
  'on-background': '#f9fafb',
  'on-surface': '#f9fafb',
  'on-primary': '#ffffff',
}

export const defaultThemePreference: ThemePreference = {
  mode: 'light',
  primary: 'pink',
}

export const buildThemeName = (preference: ThemePreference) => `${preference.mode}-${preference.primary}`

export const parseThemeName = (themeName: string): ThemePreference | null => {
  const [mode, primary] = themeName.split('-') as [ThemeMode | undefined, ThemePrimary | undefined]

  if (!mode || !primary) {
    return null
  }

  if (!['light', 'dark'].includes(mode) || !themePrimaryOptions.some(option => option.value === primary)) {
    return null
  }

  return {
    mode,
    primary,
  }
}

export const buildVuetifyThemes = () => {
  return themePrimaryOptions.reduce<Record<string, { dark: boolean, colors: Record<string, string> }>>((acc, option) => {
    acc[`light-${option.value}`] = {
      dark: false,
      colors: {
        ...LIGHT_BASE_COLORS,
        primary: option.color,
      },
    }

    acc[`dark-${option.value}`] = {
      dark: true,
      colors: {
        ...DARK_BASE_COLORS,
        primary: option.color,
      },
    }

    return acc
  }, {})
}

export const isThemePreference = (value: unknown): value is ThemePreference => {
  if (!value || typeof value !== 'object') {
    return false
  }

  const candidate = value as Partial<ThemePreference>
  return (candidate.mode === 'light' || candidate.mode === 'dark')
    && themePrimaryOptions.some(option => option.value === candidate.primary)
}

export const readThemePreferenceFromSession = (): ThemePreference | null => {
  if (!import.meta.client) {
    return null
  }

  const rawValue = window.sessionStorage.getItem(THEME_SESSION_STORAGE_KEY)
  if (!rawValue) {
    return null
  }

  try {
    const parsed = JSON.parse(rawValue)
    return isThemePreference(parsed) ? parsed : null
  }
  catch {
    return null
  }
}
