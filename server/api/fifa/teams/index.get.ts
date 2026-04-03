import { createFifaRouteHandler } from '../_handler'

export default defineEventHandler(createFifaRouteHandler({
  route: '/teams',
  upstreamEndpoint: '/teams',
  querySchema: {
    optional: {
      id: 'number',
      name: 'string',
      league: 'number',
      season: 'number',
      country: 'string',
      code: 'string',
      venue: 'number',
      search: 'string',
    },
  },
}))
