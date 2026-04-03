import { createFifaRouteHandler } from '../_handler'

export default defineEventHandler(createFifaRouteHandler({
  route: '/players',
  upstreamEndpoint: '/players',
  querySchema: {
    required: ['season'],
    atLeastOneOf: ['id', 'team', 'league', 'search'],
    optional: {
      id: 'number',
      team: 'number',
      league: 'number',
      season: 'number',
      search: 'string',
      page: 'number',
    },
  },
}))
