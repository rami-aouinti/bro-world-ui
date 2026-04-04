import type { ApiSportsRouteQuerySchema } from '~~/server/api/apisports/_schema'

export type ApiSportsRegistryEndpoint = {
  upstreamEndpoint: string
  querySchema?: ApiSportsRouteQuerySchema
}

export type ApiSportsRegistrySport = {
  upstream: {
    baseUrl: string
    apiKey: string
    host?: string
  }
  cacheRules: {
    reference: number | undefined
    schedule: number | undefined
    live: number | undefined
  }
  cacheResource: string
  referenceEndpoints: string[]
  endpoints: Record<string, ApiSportsRegistryEndpoint>
}

export type ApiSportsRegistry = {
  version: string
  sports: Record<string, ApiSportsRegistrySport>
}

const REGISTRY_VERSION = '2026-04-04'

export const buildApiSportsRegistry = (): ApiSportsRegistry => {
  const runtimeConfig = useRuntimeConfig()
  const footballBaseUrl = runtimeConfig.footballApi?.baseUrl?.trim() || ''

  const footballHost = footballBaseUrl.includes('rapidapi.com')
    ? 'v3.football.api-sports.io'
    : undefined

  return {
    version: REGISTRY_VERSION,
    sports: {
      football: {
        upstream: {
          baseUrl: footballBaseUrl,
          apiKey: runtimeConfig.footballApi?.apiKey?.trim() || '',
          host: footballHost,
        },
        cacheRules: {
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
    },
  }
}

export const readApiSportsRegistrySport = (sport: string): ApiSportsRegistrySport | null => {
  const registry = buildApiSportsRegistry()
  return registry.sports[sport.toLowerCase()] ?? null
}
