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

export const buildApiSportsRegistry = (): ApiSportsRegistry => {
  const runtimeConfig = useRuntimeConfig()
  const footballBaseUrl = runtimeConfig.footballApi?.baseUrl?.trim() || ''
  const basketballBaseUrl = runtimeConfig.basketballApi?.baseUrl?.trim() || ''
  const baseballBaseUrl = runtimeConfig.baseballApi?.baseUrl?.trim() || ''
  const footballHost = footballBaseUrl.includes('rapidapi.com')
    ? 'v3.football.api-sports.io'
    : undefined
  const basketballHost = basketballBaseUrl.includes('rapidapi.com')
    ? 'v1.basketball.api-sports.io'
    : undefined
  const baseballHost = baseballBaseUrl.includes('rapidapi.com')
    ? 'v1.baseball.api-sports.io'
    : undefined

  return {
    football: {
      sport: 'football',
      baseUrl: footballBaseUrl,
      host: footballHost,
      apiKey: runtimeConfig.footballApi?.apiKey?.trim() || '',
      configPath: {
        baseUrl: 'runtimeConfig.footballApi.baseUrl',
        apiKey: 'runtimeConfig.footballApi.apiKey',
      },
      cacheStrategy: {
        reference: runtimeConfig.footballApi?.cacheTtlSeconds,
        schedule: Number(process.env.FOOTBALL_SCHEDULE_CACHE_TTL_SECONDS || '') || 600,
        live: Number(process.env.FOOTBALL_LIVE_CACHE_TTL_SECONDS || '') || 60,
      },
      cacheResource: 'fifa',
      referenceEndpoints: [
        '/timezone',
        '/countries',
        '/leagues',
        '/leagues/seasons',
        '/teams',
        '/venues',
        '/odds/bookmakers',
        '/odds/bets',
      ],
      endpoints: {
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
      },
    },
    basketball: {
      sport: 'basketball',
      baseUrl: basketballBaseUrl,
      host: basketballHost,
      apiKey: runtimeConfig.basketballApi?.apiKey?.trim() || '',
      configPath: {
        baseUrl: 'runtimeConfig.basketballApi.baseUrl',
        apiKey: 'runtimeConfig.basketballApi.apiKey',
      },
      cacheStrategy: {
        reference: runtimeConfig.basketballApi?.cacheTtlSeconds,
        schedule: Number(process.env.BASKETBALL_SCHEDULE_CACHE_TTL_SECONDS || '') || 600,
        live: Number(process.env.BASKETBALL_LIVE_CACHE_TTL_SECONDS || '') || 60,
      },
      cacheResource: 'basketball',
      referenceEndpoints: [],
      endpoints: {},
    },
    baseball: {
      sport: 'baseball',
      baseUrl: baseballBaseUrl,
      host: baseballHost,
      apiKey: runtimeConfig.baseballApi?.apiKey?.trim() || '',
      configPath: {
        baseUrl: 'runtimeConfig.baseballApi.baseUrl',
        apiKey: 'runtimeConfig.baseballApi.apiKey',
      },
      cacheStrategy: {
        reference: runtimeConfig.baseballApi?.cacheTtlSeconds,
        schedule: Number(process.env.BASEBALL_SCHEDULE_CACHE_TTL_SECONDS || '') || 600,
        live: Number(process.env.BASEBALL_LIVE_CACHE_TTL_SECONDS || '') || 60,
      },
      cacheResource: 'baseball',
      referenceEndpoints: [],
      endpoints: {},
    },
  }
}

export const readApiSportsRegistrySport = (sport: string): ApiSportsRegistrySport | null => {
  const normalizedSport = sport.trim().toLowerCase()
  if (!normalizedSport) {
    return null
  }

  const registry = buildApiSportsRegistry()
  return registry[normalizedSport] ?? null
}
