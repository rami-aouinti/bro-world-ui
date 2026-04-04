import type { H3Event } from 'h3'
import { proxyApiSportsRequest } from '~~/server/utils/apisportsProxy'
import { readApiSportsDefinition } from './_sports'
import { validateApiSportsRouteQuery } from './_schema'

export type ApiSportsRouteDefinition = {
  sport: string
  endpoint: string
}

export const createApiSportsRouteHandler = <T>(definition: ApiSportsRouteDefinition) => {
  return async (event: H3Event): Promise<T> => {
    const normalizedSport = definition.sport.trim().toLowerCase()
    const normalizedEndpoint = definition.endpoint.replace(/^\/+|\/+$/g, '')
    const route = `/${normalizedEndpoint}`

    const sportDefinition = readApiSportsDefinition(normalizedSport)

    if (!sportDefinition) {
      throw createError({
        statusCode: 404,
        statusMessage: `Unsupported API-Sports sport: ${normalizedSport}`,
        data: {
          success: false,
          error: {
            code: 'API_SPORTS_PROXY_UNSUPPORTED_SPORT',
            sport: normalizedSport,
          },
        },
      })
    }

    const endpointConfig = sportDefinition.endpoints[normalizedEndpoint]

    if (!endpointConfig) {
      throw createError({
        statusCode: 404,
        statusMessage: `Unsupported API-Sports endpoint for ${normalizedSport}: ${normalizedEndpoint}`,
        data: {
          success: false,
          error: {
            code: 'API_SPORTS_PROXY_UNSUPPORTED_ENDPOINT',
            sport: normalizedSport,
            endpoint: normalizedEndpoint,
            allowed: Object.keys(sportDefinition.endpoints),
          },
        },
      })
    }

    if (endpointConfig.querySchema) {
      validateApiSportsRouteQuery(event, normalizedSport, route, endpointConfig.querySchema)
    }

    return proxyApiSportsRequest<T>(event, sportDefinition.proxy, endpointConfig.upstreamEndpoint)
  }
}
