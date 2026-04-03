import { createFifaRouteHandler } from '../_handler'

export default defineEventHandler(createFifaRouteHandler({
  route: '/sidelined',
  upstreamEndpoint: '/sidelined',
  querySchema: {
    atLeastOneOf: ['player', 'coach'],
    optional: {
      player: 'number',
      coach: 'number',
    },
  },
}))
