import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'

const LOCALES_DIR = path.resolve('i18n/locales')
const REQUIRED_NAMESPACES = [
  'about',
  'contact',
  'faq',
  'home',
]

const FALLBACK_SIMULATION_KEYS = ['about.hero.title', 'home.hero.title']

function flattenKeys(value, prefix = '') {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return prefix ? [prefix] : []
  }

  return Object.entries(value).flatMap(([key, nested]) => {
    const current = prefix ? `${prefix}.${key}` : key
    return flattenKeys(nested, current)
  })
}

function getValueAtPath(object, dottedPath) {
  return dottedPath.split('.').reduce((current, segment) => {
    if (!current || typeof current !== 'object') {
      return undefined
    }

    return current[segment]
  }, object)
}

function resolveWithFallback(primary, fallback, dottedPath) {
  const primaryValue = getValueAtPath(primary, dottedPath)
  if (typeof primaryValue === 'string') {
    return primaryValue
  }

  const fallbackValue = getValueAtPath(fallback, dottedPath)
  return typeof fallbackValue === 'string' ? fallbackValue : undefined
}

async function main() {
  const localeFiles = (await readdir(LOCALES_DIR))
    .filter((file) => file.endsWith('.json'))
    .sort()

  if (!localeFiles.includes('en.json')) {
    throw new Error('Missing required fallback locale file: en.json')
  }

  const localeByCode = {}
  for (const file of localeFiles) {
    const code = file.replace('.json', '')
    const fullPath = path.join(LOCALES_DIR, file)
    localeByCode[code] = JSON.parse(await readFile(fullPath, 'utf8'))
  }

  const fallbackLocale = 'en'
  const fallbackMessages = localeByCode[fallbackLocale]
  const fallbackKeys = new Set(flattenKeys(fallbackMessages))

  const errors = []

  for (const namespace of REQUIRED_NAMESPACES) {
    if (!Object.hasOwn(fallbackMessages, namespace)) {
      errors.push(`Fallback locale "${fallbackLocale}" is missing required namespace "${namespace}".`)
    }
  }

  for (const [code, messages] of Object.entries(localeByCode)) {
    for (const namespace of REQUIRED_NAMESPACES) {
      if (!Object.hasOwn(messages, namespace)) {
        errors.push(`Locale "${code}" is missing required namespace "${namespace}".`)
      }
    }

    const localeKeys = new Set(flattenKeys(messages))

    const missing = [...fallbackKeys].filter((key) => !localeKeys.has(key))
    const extra = [...localeKeys].filter((key) => !fallbackKeys.has(key))

    if (missing.length > 0) {
      errors.push(`Locale "${code}" is missing ${missing.length} key(s), e.g. ${missing.slice(0, 10).join(', ')}`)
    }

    if (extra.length > 0) {
      errors.push(`Locale "${code}" has ${extra.length} extra key(s), e.g. ${extra.slice(0, 10).join(', ')}`)
    }
  }

  const sampleLocaleCode = Object.keys(localeByCode).find((code) => code !== fallbackLocale)
  if (sampleLocaleCode) {
    const sampleLocale = structuredClone(localeByCode[sampleLocaleCode])
    for (const samplePath of FALLBACK_SIMULATION_KEYS) {
      const pathSegments = samplePath.split('.')
      const leaf = pathSegments.pop()
      const parent = pathSegments.reduce((current, segment) => {
        if (!current[segment] || typeof current[segment] !== 'object') {
          current[segment] = {}
        }

        return current[segment]
      }, sampleLocale)

      parent[leaf] = undefined

      const resolved = resolveWithFallback(sampleLocale, fallbackMessages, samplePath)
      const fallbackValue = getValueAtPath(fallbackMessages, samplePath)

      if (resolved !== fallbackValue) {
        errors.push(`Fallback simulation failed for "${sampleLocaleCode}" and key "${samplePath}".`)
      }
      else {
        console.log(`Fallback simulation OK: missing "${samplePath}" in "${sampleLocaleCode}" resolves to EN text.`)
      }
    }
  }

  if (errors.length > 0) {
    console.error('i18n validation failed:')
    for (const error of errors) {
      console.error(`- ${error}`)
    }

    process.exit(1)
  }

  console.log(`Validated ${localeFiles.length} locale file(s). All translation keys are aligned with "${fallbackLocale}".`)
}

await main()
