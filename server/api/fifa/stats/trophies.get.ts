import { createFifaRouteHandler } from '../_handler'

export default defineEventHandler(createFifaRouteHandler({
  route: '/trophies',
  upstreamEndpoint: '/trophies',
  querySchema: {
    atLeastOneOf: ['player', 'coach'],
    optional: {
      player: 'number',
      coach: 'number',
    },
  },
}))
