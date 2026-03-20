import { describe, expect, it } from 'vitest'
import { buildVuetifyThemes, isThemePreference, parseThemeName } from '~/app/utils/themePreferences'

describe('theme preferences', () => {
  it('expose toujours les alias light et dark attendus par Vuetify', () => {
    const themes = buildVuetifyThemes()

    expect(themes.light).toBeDefined()
    expect(themes.dark).toBeDefined()
    expect(themes.light.dark).toBe(false)
    expect(themes.dark.dark).toBe(true)
    expect(themes.light.colors.primary).toBeTruthy()
    expect(themes.dark.colors.primary).toBeTruthy()
  })

  it('hydrate radius and shadow defaults when parsing a theme name', () => {
    expect(parseThemeName('dark-blue')).toEqual({
      mode: 'dark',
      primary: 'blue',
      radius: 'comfortable',
      shadow: 'medium',
    })
  })

  it('accept only complete preference payloads for persistence guards', () => {
    expect(isThemePreference({
      mode: 'dark',
      primary: 'green',
      radius: 'compact',
      shadow: 'soft',
    })).toBe(true)
    expect(isThemePreference({
      mode: 'dark',
      primary: 'green',
    })).toBe(false)
  })
})
