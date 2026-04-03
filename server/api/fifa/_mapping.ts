import type { H3Event } from 'h3'
import { getQuery } from 'h3'
import { proxyFifaRequest } from '~~/server/utils/fifaProxy'

export type FifaRouteKey = keyof typeof FIFA_ROUTE_MAPPING

type FifaRouteMapping = {
  upstreamEndpoint: string
  requiredQueryParams: string[]
  paginated?: boolean
}

export const FIFA_ROUTE_MAPPING: Record<string, FifaRouteMapping> = {
  teams: {
    upstreamEndpoint: '/teams',
    requiredQueryParams: [],
  },
  standings: {
    upstreamEndpoint: '/standings',
    requiredQueryParams: ['league', 'season'],
  },
  fixtures: {
    upstreamEndpoint: '/fixtures',
    requiredQueryParams: ['league', 'season'],
  },
  players: {
    upstreamEndpoint: '/players',
    requiredQueryParams: ['team', 'season'],
    paginated: true,
  },
  odds: {
    upstreamEndpoint: '/odds',
    requiredQueryParams: ['fixture'],
    paginated: true,
  },
  stadiums: {
    upstreamEndpoint: '/venues',
    requiredQueryParams: [],
  },
}

const isProvidedQueryValue = (value: unknown): boolean => {
  if (typeof value === 'string') {
    return value.trim().length > 0
  }

  if (Array.isArray(value)) {
    return value.some(item => isProvidedQueryValue(item))
  }

  return typeof value === 'number' || typeof value === 'boolean'
}

const createQueryValidationError = (routeKey: string, missingParams: string[]) => createError({
  statusCode: 400,
  statusMessage: `Missing required FIFA query parameter(s): ${missingParams.join(', ')}`,
  data: {
    success: false,
    error: {
      code: 'FIFA_PROXY_INVALID_QUERY',
      route: routeKey,
      required: FIFA_ROUTE_MAPPING[routeKey]?.requiredQueryParams ?? [],
      missing: missingParams,
    },
  },
})

export const proxyMappedFifaRoute = async <T>(event: H3Event, routeKey: FifaRouteKey): Promise<T> => {
  const mapping = FIFA_ROUTE_MAPPING[routeKey]

  if (!mapping) {
    throw createError({
      statusCode: 500,
      statusMessage: `Unknown FIFA route mapping: ${routeKey}`,
    })
  }

  const query = getQuery(event)
  const missingParams = mapping.requiredQueryParams.filter(param => !isProvidedQueryValue(query[param]))

  if (missingParams.length > 0) {
    throw createQueryValidationError(routeKey, missingParams)
  }

  return proxyFifaRequest<T>(event, mapping.upstreamEndpoint)
}
