import { createFifaRouteHandler } from '../_handler'

export default defineEventHandler(createFifaRouteHandler({
  route: '/standings',
  upstreamEndpoint: '/standings',
  querySchema: {
    required: ['league', 'season'],
    optional: {
      league: 'number',
      season: 'number',
      team: 'number',
    },
  },
}))
