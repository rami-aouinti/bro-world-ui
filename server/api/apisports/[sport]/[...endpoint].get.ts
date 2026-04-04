import { createApiSportsRouteHandler } from '../_handler'
import { readApiSportsDefinition } from '../_sports'

export default defineEventHandler(async event => {
  const sport = getRouterParam(event, 'sport')?.toLowerCase() || ''
  const endpointPath = getRouterParam(event, 'endpoint') || ''
  const normalizedEndpointKey = endpointPath.replace(/^\/+|\/+$/g, '')

  const sportDefinition = readApiSportsDefinition(sport)

  if (!sportDefinition) {
    throw createError({
      statusCode: 404,
      statusMessage: `Unsupported API-Sports sport: ${sport}`,
      data: {
        success: false,
        error: {
          code: 'API_SPORTS_PROXY_UNSUPPORTED_SPORT',
          sport,
        },
      },
    })
  }

  const endpointConfig = sportDefinition.endpoints[normalizedEndpointKey]

  if (!endpointConfig) {
    throw createError({
      statusCode: 404,
      statusMessage: `Unsupported API-Sports endpoint for ${sport}: ${normalizedEndpointKey}`,
      data: {
        success: false,
        error: {
          code: 'API_SPORTS_PROXY_UNSUPPORTED_ENDPOINT',
          sport,
          endpoint: normalizedEndpointKey,
          allowed: Object.keys(sportDefinition.endpoints),
        },
      },
    })
  }

  const handler = createApiSportsRouteHandler({
    sport,
    route: `/${normalizedEndpointKey}`,
    upstreamEndpoint: endpointConfig.upstreamEndpoint,
    querySchema: endpointConfig.querySchema,
    sportDefinition,
  })

  return handler(event)
})
