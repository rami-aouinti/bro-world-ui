import { createFifaRouteHandler } from '../_handler'

export default defineEventHandler(createFifaRouteHandler({
  route: '/fixtures',
  upstreamEndpoint: '/fixtures',
  querySchema: {
    optional: {
      id: 'number',
      ids: 'string',
      live: 'string',
      date: 'string',
      league: 'number',
      season: 'number',
      team: 'number',
      last: 'number',
      next: 'number',
      from: 'string',
      to: 'string',
      round: 'string',
      status: 'string',
      venue: 'number',
      timezone: 'string',
    },
  },
}))
