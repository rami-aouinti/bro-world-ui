import { createFifaRouteHandler } from '../_handler'

export default defineEventHandler(createFifaRouteHandler({
  route: '/fixtures/events',
  upstreamEndpoint: '/fixtures/events',
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
