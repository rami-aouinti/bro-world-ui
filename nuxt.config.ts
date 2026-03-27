import { buildThemeName, buildVuetifyThemes, defaultThemePreference } from './app/utils/themePreferences'
const SEVEN_DAYS_IN_SECONDS = 60 * 60 * 24 * 7
const DEV_SESSION_PASSWORD = 'dev-session-password-change-me-please-32chars'
const STRONG_PASSWORD_MIN_LENGTH = 32
const SESSION_COOKIE_NAME_REGEX = /^[A-Za-z0-9_-]+$/
const ALLOWED_SAME_SITE_VALUES = ['lax', 'strict', 'none'] as const

type SameSiteValue = (typeof ALLOWED_SAME_SITE_VALUES)[number]

const isDev = process.env.NODE_ENV === 'development'

function isStrongSessionPassword(password: string): boolean {
  return password.length >= STRONG_PASSWORD_MIN_LENGTH && password !== DEV_SESSION_PASSWORD
}

function parseBooleanEnv(name: string, defaultValue: boolean): boolean {
  const raw = process.env[name]

  if (raw === undefined || raw === '') {
    return defaultValue
  }

  if (raw === 'true') {
    return true
  }

  if (raw === 'false') {
    return false
  }

  throw new Error(`[session-config] ${name} must be either "true" or "false".`)
}

function resolveSessionPassword(): string {
  const envPassword = process.env.NUXT_SESSION_PASSWORD

  if (envPassword && !isStrongSessionPassword(envPassword)) {
    throw new Error(
      `[session-config] NUXT_SESSION_PASSWORD is too weak. Use at least ${STRONG_PASSWORD_MIN_LENGTH} characters and avoid known defaults.`,
    )
  }

  if (envPassword) {
    return envPassword
  }

  if (isDev) {
    return DEV_SESSION_PASSWORD
  }

  throw new Error(
    '[session-config] NUXT_SESSION_PASSWORD is required outside development. Refusing to start without a strong session secret.',
  )
}

function resolveSessionTtlSeconds(): number {
  const rawTtl = process.env.SESSION_TTL_SECONDS
  const ttl = Number(rawTtl || SEVEN_DAYS_IN_SECONDS)

  if (!Number.isInteger(ttl) || ttl <= 0) {
    throw new Error('[session-config] SESSION_TTL_SECONDS must be a positive integer.')
  }

  return ttl
}

function resolveSessionCookieName(): string {
  const cookieName = process.env.SESSION_COOKIE_NAME || 'bro_world_auth_session'

  if (!SESSION_COOKIE_NAME_REGEX.test(cookieName)) {
    throw new Error('[session-config] SESSION_COOKIE_NAME must contain only letters, numbers, underscores, or hyphens.')
  }

  return cookieName
}

function resolveSessionCookieSameSite(): SameSiteValue {
  const raw = process.env.SESSION_COOKIE_SAME_SITE || 'strict'

  if (!ALLOWED_SAME_SITE_VALUES.includes(raw as SameSiteValue)) {
    throw new Error(
      `[session-config] SESSION_COOKIE_SAME_SITE must be one of: ${ALLOWED_SAME_SITE_VALUES.join(', ')}.`,
    )
  }

  return raw as SameSiteValue
}

const sessionPassword = resolveSessionPassword()
const sessionTtlSeconds = resolveSessionTtlSeconds()
const sessionCookieName = resolveSessionCookieName()
const sessionCookieSameSite = resolveSessionCookieSameSite()
const sessionCookieSecure = parseBooleanEnv('SESSION_COOKIE_SECURE', !isDev)
const useMockData = parseBooleanEnv('NUXT_PUBLIC_USE_MOCK_DATA', isDev)

if (!isDev && !sessionCookieSecure) {
  throw new Error('[session-config] SESSION_COOKIE_SECURE must be "true" outside development.')
}

if (sessionCookieSameSite === 'none' && !sessionCookieSecure) {
  throw new Error('[session-config] SESSION_COOKIE_SAME_SITE="none" requires SESSION_COOKIE_SECURE="true".')
}

export default defineNuxtConfig({
  app: {
    head: {
      title: 'Bro World',
      titleTemplate: '%s · Bro World',
      htmlAttrs: {
        lang: 'en',
      },
      meta: [
        {
          name: 'description',
          content: 'Bro World platform',
        },
      ],
    },
  },
  modules: [
    'vuetify-nuxt-module',
    '@nuxtjs/i18n',
    '@pinia/nuxt',
    'nuxt-auth-utils',
  ],
  vuetify: {
    vuetifyOptions: {
      defaults: {
        VDialog: {
          retainFocus: false,
        },
        VMenu: {
          retainFocus: false,
        },
      },
      icons: {
        defaultSet: 'mdi',
        aliases: {
          homeNavAbout: 'mdi-information-outline',
          homeNavContact: 'mdi-email-outline',
          homeNavFaq: 'mdi-frequently-asked-questions',
          homeNavPlatform: 'mdi-view-grid-outline',
          homeNavLogin: 'mdi-login',
          homeNavRegister: 'mdi-account-plus-outline',
          homeBrand: 'mdi-earth',
          homeMenu: 'mdi-menu',
        },
      },
      ssr: true,
      locale: {
        locale: 'en',
        fallback: 'en',
        rtl: {
          ar: true,
        },
      },
      theme: {
        defaultTheme: buildThemeName(defaultThemePreference),
        themes: buildVuetifyThemes(),
      },
    },
  },
  css: [
    'vuetify/styles',
    '~/assets/styles/material-dashboard.scss',
    '~/assets/styles/index.css',
    '~/assets/styles/critical-home.css',
  ],
  vite: {
    build: {
      cssCodeSplit: false,
    },
  },
  i18n: {
    defaultLocale: 'en',
    fallbackLocale: 'en',
    strategy: 'no_prefix',
    detectBrowserLanguage: false,
    locales: [
      { code: 'en', file: 'en.json', name: 'English' },
      { code: 'fr', file: 'fr.json', name: 'Français' },
      { code: 'es', file: 'es.json', name: 'Español' },
      { code: 'de', file: 'de.json', name: 'Deutsch' },
      { code: 'ar', file: 'ar.json', name: 'العربية' },
      { code: 'pt', file: 'pt.json', name: 'Português' },
    ],
    lazy: true,
    langDir: 'locales',
  },
  runtimeConfig: {
    github: {
      clientId: process.env.NUXT_GITHUB_CLIENT_ID || '',
      clientSecret: process.env.NUXT_GITHUB_CLIENT_SECRET || '',
    },
    oauth: {
      github: {
        clientId: process.env.NUXT_GITHUB_CLIENT_ID || '',
        clientSecret: process.env.NUXT_GITHUB_CLIENT_SECRET || '',
      },
    },
    redisUrl: process.env.REDIS_URL || process.env.NUXT_REDIS_URL || '',
    cacheEnv: process.env.CACHE_ENV || process.env.NODE_ENV || 'dev',
    cacheApp: process.env.CACHE_APP || 'bro-ui',
    cacheVersion: process.env.CACHE_VERSION || 'v1',
    aiGatewayApiKey: process.env.AI_GATEWAY_API_KEY || '',
    aiGatewayModel: process.env.AI_GATEWAY_MODEL || 'openai/gpt-4o-mini',
    session: {
      name: 'nuxt-session',
      password: sessionPassword,
      // Default reduced from 1 year to 7 days to limit exposure window for stolen session tokens.
      ttlSeconds: sessionTtlSeconds,
      // Avoid collision with nuxt-auth-utils default cookie (`session_id` / `sid:*`).
      // Our auth flow stores the whole auth payload in this cookie.
      cookieName: sessionCookieName,
      cookieSecure: sessionCookieSecure,
      cookieSameSite: sessionCookieSameSite,
    },
    public: {
      apiBase: process.env.NUXT_PUBLIC_API_BASE || 'https://bro-world.org',
      mercurePublicUrl: process.env.NUXT_PUBLIC_MERCURE_PUBLIC_URL || 'http://bro-world.org:3000/.well-known/mercure',
      useMockData,
    },
  },
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
})
