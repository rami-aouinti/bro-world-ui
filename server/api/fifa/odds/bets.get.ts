import { createFifaRouteHandler } from '../_handler'

export default defineEventHandler(createFifaRouteHandler({
  route: '/odds/bets',
  upstreamEndpoint: '/odds/bets',
  querySchema: {
    optional: {
      id: 'number',
      search: 'string',
    },
  },
}))
