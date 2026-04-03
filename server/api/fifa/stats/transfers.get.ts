import { createFifaRouteHandler } from '../_handler'

export default defineEventHandler(createFifaRouteHandler({
  route: '/transfers',
  upstreamEndpoint: '/transfers',
  querySchema: {
    atLeastOneOf: ['player', 'team'],
    optional: {
      player: 'number',
      team: 'number',
    },
  },
}))
