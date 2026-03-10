import { createHash } from 'node:crypto'

export type CacheScope = 'public' | 'private' | 'system'

interface CacheKeyInput {
  scope: CacheScope
  resource: string
  identifier: string
  query?: Record<string, any>
}

interface CacheScanPatternInput {
  scope: CacheScope
  resource: string
  identifierPattern?: string
  queryHashPattern?: string
}

const DEFAULT_CACHE_ENV = 'dev'
const DEFAULT_CACHE_APP = 'bro-ui'
const DEFAULT_CACHE_VERSION = 'v1'

const normalizeSegment = (value: string, fallback: string) => {
  const normalized = value
    .trim()
    .replace(/\//g, '.')
    .replace(/[^a-zA-Z0-9._-]/g, '-')
    .replace(/-+/g, '-')

  return normalized || fallback
}

const getCacheContext = () => {
  const runtimeConfig = useRuntimeConfig()
  const configuredEnv = runtimeConfig.cacheEnv || process.env.CACHE_ENV || process.env.APP_ENV || process.env.NODE_ENV || DEFAULT_CACHE_ENV
  const env = configuredEnv === 'production' ? 'prod' : configuredEnv

  return {
    env: normalizeSegment(env, DEFAULT_CACHE_ENV),
    app: normalizeSegment(runtimeConfig.cacheApp || DEFAULT_CACHE_APP, DEFAULT_CACHE_APP),
    version: normalizeSegment(runtimeConfig.cacheVersion || DEFAULT_CACHE_VERSION, DEFAULT_CACHE_VERSION),
  }
}

const stringifyQueryValue = (value: unknown): string => {
  if (Array.isArray(value)) {
    return `[${value.map(stringifyQueryValue).join(',')}]`
  }

  if (value && typeof value === 'object') {
    return `{${Object.entries(value as Record<string, unknown>)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, nestedValue]) => `${key}:${stringifyQueryValue(nestedValue)}`)
      .join(',')}}`
  }

  return String(value)
}

export const toPathResourceIdentifier = (path: string) => {
  const segments = path.split('/').filter(Boolean)
  const apiIndex = segments[0] === 'api' ? 2 : 0
  const domainSegments = segments.slice(apiIndex)

  const [resource = 'unknown', ...identifierSegments] = domainSegments

  return {
    resource: normalizeSegment(resource, 'unknown'),
    identifier: normalizeSegment(identifierSegments.join('.') || 'list', 'list'),
  }
}

export const buildQueryHash = (query: Record<string, any> = {}) => {
  const normalizedQueryEntries = Object.entries(query)
    .filter(([, value]) => value !== undefined && value !== null)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${stringifyQueryValue(value)}`)

  if (!normalizedQueryEntries.length) {
    return 'noquery'
  }

  return createHash('sha256').update(normalizedQueryEntries.join('&')).digest('hex').slice(0, 16)
}

export const buildCacheKey = ({ scope, resource, identifier, query = {} }: CacheKeyInput) => {
  const { env, app, version } = getCacheContext()
  const queryHash = buildQueryHash(query)

  return [
    env,
    app,
    version,
    normalizeSegment(scope, 'public'),
    normalizeSegment(resource, 'unknown'),
    normalizeSegment(identifier, 'list'),
    queryHash,
  ].join(':')
}

export const buildCacheScanPattern = ({
  scope,
  resource,
  identifierPattern = '*',
  queryHashPattern = '*',
}: CacheScanPatternInput) => {
  const { env, app, version } = getCacheContext()

  return [
    env,
    app,
    version,
    normalizeSegment(scope, 'public'),
    normalizeSegment(resource, 'unknown'),
    identifierPattern,
    queryHashPattern,
  ].join(':')
}
