import { createFifaRouteHandler } from '../_handler'

export default defineEventHandler(createFifaRouteHandler({
  route: '/odds',
  upstreamEndpoint: '/odds',
  querySchema: {
    optional: {
      fixture: 'number',
      league: 'number',
      season: 'number',
      date: 'string',
      bookmaker: 'number',
      bet: 'number',
      page: 'number',
    },
  },
}))
