export type ThemeMode = 'light' | 'dark'
export type ThemePrimary = 'pink' | 'blue' | 'green' | 'purple' | 'orange' | 'yellow' | 'teal' | 'gray-dark'
export type ThemeRadius = 'standard' | 'compact' | 'comfortable' | 'rounded'
export type ThemeShadow = 'standard' | 'soft' | 'medium' | 'strong'

export interface ThemePreference {
  mode: ThemeMode
  primary: ThemePrimary
  radius: ThemeRadius
  shadow: ThemeShadow
}

export const THEME_SESSION_STORAGE_KEY = 'bro-world-theme'

export const themePrimaryOptions: Array<{ value: ThemePrimary, label: string, color: string }> = [
  { value: 'pink', label: 'Pink', color: '#e91e63' },
  { value: 'blue', label: 'Blue', color: '#1a73e8' },
  { value: 'green', label: 'Green', color: '#43a047' },
  { value: 'purple', label: 'Purple', color: '#7e57c2' },
  { value: 'orange', label: 'Orange', color: '#f57c00' },
  { value: 'yellow', label: 'Yellow', color: '#f9a825' },
  { value: 'teal', label: 'Teal', color: '#00897b' },
  { value: 'gray-dark', label: 'Gray Dark', color: '#455a64' },
]

export const themeRadiusOptions: Array<{ value: ThemeRadius, label: string, radius: string }> = [
  { value: 'standard', label: 'Standard', radius: '0px' },
  { value: 'compact', label: 'Compact', radius: '8px' },
  { value: 'comfortable', label: 'Comfort', radius: '14px' },
  { value: 'rounded', label: 'Rounded', radius: '22px' },
]

export const themeShadowOptions: Array<{ value: ThemeShadow, label: string, shadow: string }> = [
  { value: 'standard', label: 'Standard', shadow: '0 0px 0px rgba(15, 23, 42, 0.08)' },
  { value: 'soft', label: 'Soft', shadow: '0 4px 14px rgba(15, 23, 42, 0.08)' },
  { value: 'medium', label: 'Medium', shadow: '0 8px 22px rgba(15, 23, 42, 0.14)' },
  { value: 'strong', label: 'Strong', shadow: '0 14px 30px rgba(15, 23, 42, 0.2)' },
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
  radius: 'standard',
  shadow: 'standard',
}

export const buildThemeName = (preference: ThemePreference) => `${preference.mode}-${preference.primary}`

export const parseThemeName = (themeName: string): ThemePreference | null => {
  if (themeName === 'light' || themeName === 'dark') {
    return {
      mode: themeName,
      primary: defaultThemePreference.primary,
      radius: defaultThemePreference.radius,
      shadow: defaultThemePreference.shadow,
    }
  }

  const separatorIndex = themeName.indexOf('-')
  if (separatorIndex === -1) {
    return null
  }

  const mode = themeName.slice(0, separatorIndex) as ThemeMode | ''
  const primary = themeName.slice(separatorIndex + 1) as ThemePrimary | ''

  if (!mode || !primary) {
    return null
  }

  if (!['light', 'dark'].includes(mode) || !themePrimaryOptions.some(option => option.value === primary)) {
    return null
  }

  return {
    mode,
    primary,
    radius: defaultThemePreference.radius,
    shadow: defaultThemePreference.shadow,
  }
}

export const buildVuetifyThemes = () => {
  const themes = themePrimaryOptions.reduce<Record<string, { dark: boolean, colors: Record<string, string> }>>((acc, option) => {
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

  const fallbackPrimary = themePrimaryOptions.find(option => option.value === defaultThemePreference.primary)?.color
    ?? themePrimaryOptions[0]?.color
    ?? '#e91e63'

  themes.light = themes[buildThemeName({ mode: 'light', primary: defaultThemePreference.primary })] ?? {
    dark: false,
    colors: {
      ...LIGHT_BASE_COLORS,
      primary: fallbackPrimary,
    },
  }
  themes.dark = themes[buildThemeName({ mode: 'dark', primary: defaultThemePreference.primary })] ?? {
    dark: true,
    colors: {
      ...DARK_BASE_COLORS,
      primary: fallbackPrimary,
    },
  }

  return themes
}

export const isThemePreference = (value: unknown): value is ThemePreference => {
  if (!value || typeof value !== 'object') {
    return false
  }

  const candidate = value as Partial<ThemePreference>
  return (candidate.mode === 'light' || candidate.mode === 'dark')
    && themePrimaryOptions.some(option => option.value === candidate.primary)
    && themeRadiusOptions.some(option => option.value === candidate.radius)
    && themeShadowOptions.some(option => option.value === candidate.shadow)
}

const normalizeThemePreference = (value: unknown): ThemePreference | null => {
  if (!value || typeof value !== 'object') {
    return null
  }

  const candidate = value as Partial<ThemePreference>
  if ((candidate.mode !== 'light' && candidate.mode !== 'dark')
    || !themePrimaryOptions.some(option => option.value === candidate.primary)) {
    return null
  }

  return {
    mode: candidate.mode,
    primary: candidate.primary,
    radius: themeRadiusOptions.some(option => option.value === candidate.radius) ? candidate.radius : defaultThemePreference.radius,
    shadow: themeShadowOptions.some(option => option.value === candidate.shadow) ? candidate.shadow : defaultThemePreference.shadow,
  }
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
    return normalizeThemePreference(parsed)
  }
  catch {
    return null
  }
}
