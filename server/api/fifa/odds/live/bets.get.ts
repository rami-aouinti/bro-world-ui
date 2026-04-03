import { createFifaRouteHandler } from '../../_handler'

export default defineEventHandler(createFifaRouteHandler({
  route: '/odds/live/bets',
  upstreamEndpoint: '/odds/live/bets',
  querySchema: {
    optional: {
      id: 'number',
      search: 'string',
    },
  },
}))
