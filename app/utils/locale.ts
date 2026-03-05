import type { UserProfile } from '~/stores/authSession'

export const FALLBACK_LOCALE = 'en'

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

export const getProfilePreferredLocale = (profile: UserProfile | null) => {
  if (!profile) {
    return FALLBACK_LOCALE
  }

  return profile.locale || profile.language || FALLBACK_LOCALE
}
