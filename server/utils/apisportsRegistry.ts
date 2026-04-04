import type { ApiSportsRouteQuerySchema } from '~~/server/api/apisports/_schema'

export type ApiSportsRegistryEndpoint = {
  upstreamEndpoint: string
  querySchema?: ApiSportsRouteQuerySchema
}

export type ApiSportsRegistryCacheStrategy = {
  reference: number | undefined
  schedule: number | undefined
  live: number | undefined
}

export type ApiSportsRegistrySport = {
  sport: string
  baseUrl: string
  host?: string
  apiKey: string
  configPath: {
    baseUrl: string
    apiKey: string
  }
  endpoints: Record<string, ApiSportsRegistryEndpoint>
  cacheStrategy: ApiSportsRegistryCacheStrategy
  cacheResource: string
  referenceEndpoints: string[]
}

export type ApiSportsRegistry = Record<string, ApiSportsRegistrySport>

type ApiSportsCanonicalSport =
  | 'football'
  | 'basketball'
  | 'baseball'
  | 'hockey'
  | 'rugby'
  | 'handball'
  | 'volleyball'
  | 'american-football'
  | 'cricket'
  | 'formula-1'
  | 'moto-gp'

const API_SPORTS_DEFAULT_BASE_URLS: Record<ApiSportsCanonicalSport, string> = {
  football: 'https://v3.football.api-sports.io',
  basketball: 'https://v1.basketball.api-sports.io',
  baseball: 'https://v1.baseball.api-sports.io',
  hockey: 'https://v1.hockey.api-sports.io',
  rugby: 'https://v1.rugby.api-sports.io',
  handball: 'https://v1.handball.api-sports.io',
  volleyball: 'https://v1.volleyball.api-sports.io',
  'american-football': 'https://v1.american-football.api-sports.io',
  cricket: 'https://v1.cricket.api-sports.io',
  'formula-1': 'https://v1.formula-1.api-sports.io',
  'moto-gp': 'https://v1.moto-gp.api-sports.io',
}

const API_SPORTS_ALIASES: Record<string, ApiSportsCanonicalSport> = {
  nba: 'basketball',
  nfl: 'american-football',
  mlb: 'baseball',
}

const resolveCanonicalSport = (sport: string): ApiSportsCanonicalSport | null => {
  const normalizedSport = sport.trim().toLowerCase()

  if (!normalizedSport) {
    return null
  }

  if (normalizedSport in API_SPORTS_ALIASES) {
    return API_SPORTS_ALIASES[normalizedSport]
  }

  if (normalizedSport in API_SPORTS_DEFAULT_BASE_URLS) {
    return normalizedSport as ApiSportsCanonicalSport
  }

  return null
}

const resolveSportBaseUrl = (
  runtimeConfig: ReturnType<typeof useRuntimeConfig>,
  sport: ApiSportsCanonicalSport,
): string => {
  const baseUrlFromConfig = runtimeConfig.apiSports?.baseUrls?.[sport]?.trim()
  return baseUrlFromConfig || API_SPORTS_DEFAULT_BASE_URLS[sport]
}

const resolveSportHost = (baseUrl: string): string | undefined => {
  if (!baseUrl.includes('rapidapi.com')) {
    return undefined
  }

  return baseUrl
    .replace(/^https?:\/\//, '')
    .split('/')[0]
    .trim() || undefined
}

const buildSportRegistryEntry = (
  runtimeConfig: ReturnType<typeof useRuntimeConfig>,
  sport: ApiSportsCanonicalSport,
  cacheResource: string,
  endpoints: Record<string, ApiSportsRegistryEndpoint>,
  referenceEndpoints: string[] = [],
): ApiSportsRegistrySport => {
  const baseUrl = resolveSportBaseUrl(runtimeConfig, sport)

  return {
    sport,
    baseUrl,
    host: resolveSportHost(baseUrl),
    apiKey: runtimeConfig.apiSports?.apiKey?.trim() || '',
    configPath: {
      baseUrl: `runtimeConfig.apiSports.baseUrls.${sport}`,
      apiKey: 'runtimeConfig.apiSports.apiKey',
    },
    cacheStrategy: {
      reference: runtimeConfig.apiSports?.cacheTtlSeconds,
      schedule: Number(process.env[`${sport.toUpperCase().replace(/-/g, '_')}_SCHEDULE_CACHE_TTL_SECONDS`] || '') || 600,
      live: Number(process.env[`${sport.toUpperCase().replace(/-/g, '_')}_LIVE_CACHE_TTL_SECONDS`] || '') || 60,
    },
    cacheResource,
    referenceEndpoints,
    endpoints,
  }
}

export const buildApiSportsRegistry = (): ApiSportsRegistry => {
  const runtimeConfig = useRuntimeConfig()

  return {
    football: buildSportRegistryEntry(runtimeConfig, 'football', 'fifa', {
      countries: {
        upstreamEndpoint: '/countries',
        querySchema: {
          optional: {
            name: 'string',
            code: 'string',
            search: 'string',
          },
        },
      },
      fixtures: {
        upstreamEndpoint: '/fixtures',
        querySchema: {
          atLeastOneOfGroups: [
            ['id'],
            ['ids'],
            ['date'],
            ['league', 'season'],
            ['team'],
            ['live'],
            ['last'],
            ['next'],
            ['from', 'to'],
          ],
          optional: {
            id: 'number',
            ids: 'string',
            live: 'string',
            date: 'string',
            league: 'number',
            season: 'number',
            team: 'number',
            last: 'number',
            next: 'number',
            from: 'string',
            to: 'string',
            round: 'string',
            status: 'string',
            venue: 'number',
            timezone: 'string',
          },
        },
      },
      teams: {
        upstreamEndpoint: '/teams',
        querySchema: {
          atLeastOneOf: ['id', 'name', 'league', 'season', 'country', 'code', 'venue', 'search'],
          optional: {
            id: 'number',
            name: 'string',
            league: 'number',
            season: 'number',
            country: 'string',
            code: 'string',
            venue: 'number',
            search: 'string',
          },
        },
      },
    }, [
      '/timezone',
      '/countries',
      '/leagues',
      '/leagues/seasons',
      '/teams',
      '/venues',
      '/odds/bookmakers',
      '/odds/bets',
    ]),
    basketball: buildSportRegistryEntry(runtimeConfig, 'basketball', 'basketball', {}),
    baseball: buildSportRegistryEntry(runtimeConfig, 'baseball', 'baseball', {}),
    hockey: buildSportRegistryEntry(runtimeConfig, 'hockey', 'hockey', {}),
    rugby: buildSportRegistryEntry(runtimeConfig, 'rugby', 'rugby', {}),
    handball: buildSportRegistryEntry(runtimeConfig, 'handball', 'handball', {}),
    volleyball: buildSportRegistryEntry(runtimeConfig, 'volleyball', 'volleyball', {}),
    'american-football': buildSportRegistryEntry(runtimeConfig, 'american-football', 'american-football', {}),
    cricket: buildSportRegistryEntry(runtimeConfig, 'cricket', 'cricket', {}),
    'formula-1': buildSportRegistryEntry(runtimeConfig, 'formula-1', 'formula-1', {}),
    'moto-gp': buildSportRegistryEntry(runtimeConfig, 'moto-gp', 'moto-gp', {}),
  }
}

export const readApiSportsRegistrySport = (sport: string): ApiSportsRegistrySport | null => {
  const canonicalSport = resolveCanonicalSport(sport)

  if (!canonicalSport) {
    return null
  }

  const registry = buildApiSportsRegistry()
  return registry[canonicalSport] ?? null
}
