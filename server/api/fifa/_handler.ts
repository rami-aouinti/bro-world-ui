import type { H3Event } from 'h3'
import { proxyFifaRequest } from '~~/server/utils/fifaProxy'
import type { FifaRouteQuerySchema } from './_schema'
import { validateFifaRouteQuery } from './_schema'

export type FifaRouteDefinition = {
  route: string
  upstreamEndpoint: string
  querySchema?: FifaRouteQuerySchema
}

export const createFifaRouteHandler = <T>(definition: FifaRouteDefinition) => {
  return async (event: H3Event): Promise<T> => {
    if (definition.querySchema) {
      validateFifaRouteQuery(event, definition.route, definition.querySchema)
    }

    return proxyFifaRequest<T>(event, definition.upstreamEndpoint)
  }
}
