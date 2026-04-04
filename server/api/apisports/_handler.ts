import type { H3Event } from 'h3'
import { proxyApiSportsRequest } from '~~/server/utils/apisportsProxy'
import type { ApiSportsEndpointConfig, ApiSportsDefinition } from './_sports'
import { validateApiSportsRouteQuery } from './_schema'

export type ApiSportsRouteDefinition = {
  sport: string
  route: string
  upstreamEndpoint: string
  sportDefinition: ApiSportsDefinition
  querySchema?: ApiSportsEndpointConfig['querySchema']
}

export const createApiSportsRouteHandler = <T>(definition: ApiSportsRouteDefinition) => {
  return async (event: H3Event): Promise<T> => {
    if (definition.querySchema) {
      validateApiSportsRouteQuery(event, definition.sport, definition.route, definition.querySchema)
    }

    return proxyApiSportsRequest<T>(event, definition.sportDefinition.proxy, definition.upstreamEndpoint)
  }
}
