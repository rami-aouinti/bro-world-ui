import type { ApiSportsRouteQuerySchema } from '~~/server/api/apisports/_schema'
import type { ApiSportsEndpointFilterMatrix } from '~~/lib/apisportsFilters'
import { toApiSportsRouteQuerySchema } from '~~/lib/apisportsFilters'

export type ApiSportsRegistryEndpoint = {
  upstreamEndpoint: string
  filters: ApiSportsEndpointFilterMatrix
  querySchema: ApiSportsRouteQuerySchema
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

export type ApiSportsCanonicalSport =
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

export const API_SPORTS_DEFAULT_BASE_URLS: Record<ApiSportsCanonicalSport, string> = {
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
  soccer: 'football',
  'football-soccer': 'football',
  nba: 'basketball',
  nfl: 'american-football',
  americanfootball: 'american-football',
  mlb: 'baseball',
  f1: 'formula-1',
  motogp: 'moto-gp',
}

export const normalizeApiSportsSlug = (sport: string): string => sport.trim().toLowerCase().replace(/[\s_]+/g, '-')

export const listSupportedApiSports = (): ApiSportsCanonicalSport[] => Object.keys(API_SPORTS_DEFAULT_BASE_URLS) as ApiSportsCanonicalSport[]

export const resolveCanonicalSport = (sport: string): ApiSportsCanonicalSport | null => {
  const normalizedSport = normalizeApiSportsSlug(sport)

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
        filters: {
          optional: {
            name: 'string',
            code: 'string',
            search: 'string',
          },
        },
        querySchema: toApiSportsRouteQuerySchema({
          optional: {
            name: 'string',
            code: 'string',
            search: 'string',
          },
        }),
      },
      fixtures: {
        upstreamEndpoint: '/fixtures',
        filters: {
          atLeastOneGroup: [
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
        querySchema: toApiSportsRouteQuerySchema({
          atLeastOneGroup: [
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
        }),
      },
      teams: {
        upstreamEndpoint: '/teams',
        filters: {
          atLeastOneGroup: [['id'], ['name'], ['league', 'season'], ['country'], ['code'], ['venue'], ['search']],
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
        querySchema: toApiSportsRouteQuerySchema({
          atLeastOneGroup: [['id'], ['name'], ['league', 'season'], ['country'], ['code'], ['venue'], ['search']],
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
        }),
      },
      players: {
        upstreamEndpoint: '/players',
        filters: {
          optional: {
            id: 'number',
            team: 'number',
            league: 'number',
            season: 'number',
            search: 'string',
            page: 'number',
          },
        },
        querySchema: toApiSportsRouteQuerySchema({
          optional: {
            id: 'number',
            team: 'number',
            league: 'number',
            season: 'number',
            search: 'string',
            page: 'number',
          },
        }),
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
    baseball: buildSportRegistryEntry(runtimeConfig, 'baseball', 'baseball', {
      games: {
        upstreamEndpoint: '/games',
        filters: {
          atLeastOneGroup: [['date'], ['league', 'season'], ['team']],
          optional: {
            date: 'string',
            league: 'number',
            season: 'number',
            team: 'number',
          },
        },
        querySchema: toApiSportsRouteQuerySchema({
          atLeastOneGroup: [['date'], ['league', 'season'], ['team']],
          optional: {
            date: 'string',
            league: 'number',
            season: 'number',
            team: 'number',
          },
        }),
      },
      teams: {
        upstreamEndpoint: '/teams',
        filters: {
          atLeastOneGroup: [['league', 'season'], ['id'], ['name']],
          optional: {
            league: 'number',
            season: 'number',
            id: 'number',
            name: 'string',
          },
        },
        querySchema: toApiSportsRouteQuerySchema({
          atLeastOneGroup: [['league', 'season'], ['id'], ['name']],
          optional: {
            league: 'number',
            season: 'number',
            id: 'number',
            name: 'string',
          },
        }),
      },
      leagues: {
        upstreamEndpoint: '/leagues',
        filters: {
          optional: {
            id: 'number',
            name: 'string',
            country: 'string',
          },
        },
        querySchema: toApiSportsRouteQuerySchema({
          optional: {
            id: 'number',
            name: 'string',
            country: 'string',
          },
        }),
      },
    }),
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
