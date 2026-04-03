import { createFifaRouteHandler } from '../_handler'

export default defineEventHandler(createFifaRouteHandler({
  route: '/fixtures/lineups',
  upstreamEndpoint: '/fixtures/lineups',
  querySchema: {
    required: ['fixture'],
    optional: {
      fixture: 'number',
      team: 'number',
      player: 'number',
      type: 'string',
    },
  },
}))
