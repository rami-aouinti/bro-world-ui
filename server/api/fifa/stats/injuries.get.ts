import { createFifaRouteHandler } from '../_handler'

export default defineEventHandler(createFifaRouteHandler({
  route: '/injuries',
  upstreamEndpoint: '/injuries',
  querySchema: {
    optional: {
      league: 'number',
      season: 'number',
      team: 'number',
      fixture: 'number',
      player: 'number',
      date: 'string',
      timezone: 'string',
    },
  },
}))
