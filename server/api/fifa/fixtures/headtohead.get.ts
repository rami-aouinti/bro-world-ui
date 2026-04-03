import { createFifaRouteHandler } from '../_handler'

export default defineEventHandler(createFifaRouteHandler({
  route: '/fixtures/headtohead',
  upstreamEndpoint: '/fixtures/headtohead',
  querySchema: {
    required: ['h2h'],
    optional: {
      h2h: 'string',
      league: 'number',
      season: 'number',
      date: 'string',
      timezone: 'string',
    },
  },
}))
