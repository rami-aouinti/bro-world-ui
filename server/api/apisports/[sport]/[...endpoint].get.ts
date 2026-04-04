import { createApiSportsRouteHandler } from '../_handler'

export default defineEventHandler(async event => {
  const sport = getRouterParam(event, 'sport')?.toLowerCase() || ''
  const endpointPath = getRouterParam(event, 'endpoint') || ''

  const handler = createApiSportsRouteHandler({
    sport,
    endpoint: endpointPath,
  })

  return handler(event)
})
