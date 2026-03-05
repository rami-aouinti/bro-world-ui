import type { UserProfile } from '~/types/api/user'

export const FALLBACK_LOCALE = 'en'

type LocaleCodeCandidate = string | { code?: unknown }

const sanitizeLocale = (value: unknown) => {
  if (typeof value !== 'string') {
    return null
  }

  const normalized = value.trim().toLowerCase()
  return normalized.length > 0 ? normalized : null
}

export const resolveLocale = (preferredLocale: unknown, availableLocales: string[] = [], fallbackLocale = FALLBACK_LOCALE) => {
  const fallback = sanitizeLocale(fallbackLocale) ?? FALLBACK_LOCALE
  const available = availableLocales
    .map(locale => sanitizeLocale(locale))
    .filter((locale): locale is string => Boolean(locale))

  const normalizedPreferred = sanitizeLocale(preferredLocale)

  if (!normalizedPreferred) {
    return fallback
  }

  if (available.length === 0 || available.includes(normalizedPreferred)) {
    return normalizedPreferred
  }

  const languageCode = normalizedPreferred.split('-')[0]

  if (available.includes(languageCode)) {
    return languageCode
  }

  return fallback
}

export const normalizeLocaleCodes = (locales: unknown): string[] => {
  const localeList = Array.isArray(locales)
    ? locales
    : (locales && typeof locales === 'object' && 'value' in locales && Array.isArray((locales as { value?: unknown }).value)
        ? (locales as { value: unknown[] }).value
        : [])

  return localeList
    .map((locale): unknown => {
      if (typeof locale === 'string') {
        return locale
      }

      if (locale && typeof locale === 'object' && 'code' in locale) {
        return (locale as LocaleCodeCandidate).code
      }

      return null
    })
    .map(locale => sanitizeLocale(locale))
    .filter((locale): locale is string => Boolean(locale))
}

export const getProfilePreferredLocale = (profile: UserProfile | null) => {
  if (!profile) {
    return FALLBACK_LOCALE
  }

  return profile.locale || profile.language || FALLBACK_LOCALE
}
