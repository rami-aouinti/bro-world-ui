import { createFifaRouteHandler } from '../_handler'

export default defineEventHandler(createFifaRouteHandler({
  route: '/teams/statistics',
  upstreamEndpoint: '/teams/statistics',
  querySchema: {
    required: ['league', 'season', 'team'],
    optional: {
      league: 'number',
      season: 'number',
      team: 'number',
      date: 'string',
    },
  },
}))
