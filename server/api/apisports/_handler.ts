import type { H3Event } from 'h3'
import { proxyApiSportsRequest } from '~~/server/utils/apisportsProxy'
import { listSupportedApiSports, resolveCanonicalSport } from '~~/server/utils/apisportsRegistry'
import { readApiSportsDefinition } from './_sports'
import { validateApiSportsRouteQuery } from './_schema'

export type ApiSportsRouteDefinition = {
  sport: string
  endpoint: string
}

export const createApiSportsRouteHandler = <T>(definition: ApiSportsRouteDefinition) => {
  return async (event: H3Event): Promise<T> => {
    const requestedSport = definition.sport
    const canonicalSport = resolveCanonicalSport(requestedSport)
    const normalizedEndpoint = definition.endpoint.replace(/^\/+|\/+$/g, '')
    const route = `/${normalizedEndpoint}`

    if (!canonicalSport) {
      throw createError({
        statusCode: 404,
        statusMessage: `Unsupported API-Sports sport: ${requestedSport}`,
        data: {
          success: false,
          error: {
            code: 'API_SPORTS_PROXY_UNSUPPORTED_SPORT',
            sport: requestedSport,
            supportedSports: listSupportedApiSports(),
          },
        },
      })
    }

    const normalizedSport = canonicalSport
    const sportDefinition = readApiSportsDefinition(normalizedSport)

    if (!sportDefinition) {
      throw createError({
        statusCode: 404,
        statusMessage: `Unsupported API-Sports sport: ${requestedSport}`,
        data: {
          success: false,
          error: {
            code: 'API_SPORTS_PROXY_UNSUPPORTED_SPORT',
            sport: requestedSport,
            supportedSports: listSupportedApiSports(),
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
            sport: requestedSport,
            supportedSports: listSupportedApiSports(),
            endpoint: normalizedEndpoint,
            allowed: Object.keys(sportDefinition.endpoints),
          },
        },
      })
    }

    validateApiSportsRouteQuery(event, normalizedSport, route, endpointConfig.querySchema)

    return proxyApiSportsRequest<T>(event, sportDefinition.proxy, endpointConfig.upstreamEndpoint)
  }
}
