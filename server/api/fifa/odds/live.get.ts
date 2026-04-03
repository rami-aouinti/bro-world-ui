import { createFifaRouteHandler } from '../_handler'

export default defineEventHandler(createFifaRouteHandler({
  route: '/odds/live',
  upstreamEndpoint: '/odds/live',
  querySchema: {
    optional: {
      fixture: 'number',
      league: 'number',
      bet: 'number',
    },
  },
}))
