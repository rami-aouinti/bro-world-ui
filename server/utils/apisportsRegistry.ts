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
  endpoints: Record<string, ApiSportsRegistryEndpoint>
  cacheStrategy: ApiSportsRegistryCacheStrategy
  cacheResource: string
  referenceEndpoints: string[]
}

export type ApiSportsRegistry = Record<string, ApiSportsRegistrySport>

export const buildApiSportsRegistry = (): ApiSportsRegistry => {
  const runtimeConfig = useRuntimeConfig()
  const footballBaseUrl = runtimeConfig.footballApi?.baseUrl?.trim() || ''
  const footballHost = footballBaseUrl.includes('rapidapi.com')
    ? 'v3.football.api-sports.io'
    : undefined

  return {
    football: {
      sport: 'football',
      baseUrl: footballBaseUrl,
      host: footballHost,
      apiKey: runtimeConfig.footballApi?.apiKey?.trim() || '',
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
