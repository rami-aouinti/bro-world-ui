import type { ApiSportsRouteQuerySchema } from './_schema'
import type { ApiSportsSportConfig } from '~~/server/utils/apisportsProxy'

export type ApiSportsEndpointConfig = {
  upstreamEndpoint: string
  querySchema?: ApiSportsRouteQuerySchema
}

export type ApiSportsDefinition = {
  proxy: ApiSportsSportConfig
  endpoints: Record<string, ApiSportsEndpointConfig>
}

const buildApiSportsDefinitions = (): Record<string, ApiSportsDefinition> => {
  const runtimeConfig = useRuntimeConfig()
  const footballBaseUrl = runtimeConfig.footballApi?.baseUrl?.trim() || ''

  const footballHost = footballBaseUrl.includes('rapidapi.com')
    ? 'v3.football.api-sports.io'
    : undefined

  return {
    football: {
      proxy: {
        sport: 'football',
        baseUrl: footballBaseUrl,
        apiKey: runtimeConfig.footballApi?.apiKey?.trim() || '',
        host: footballHost,
        cacheTtlSeconds: runtimeConfig.footballApi?.cacheTtlSeconds,
        scheduleCacheTtlSeconds: Number(process.env.FOOTBALL_SCHEDULE_CACHE_TTL_SECONDS || '') || 600,
        liveCacheTtlSeconds: Number(process.env.FOOTBALL_LIVE_CACHE_TTL_SECONDS || '') || 60,
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
      },
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

export const readApiSportsDefinition = (sport: string): ApiSportsDefinition | null => {
  const definitions = buildApiSportsDefinitions()
  return definitions[sport.toLowerCase()] ?? null
}
