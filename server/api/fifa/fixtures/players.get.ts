import { createFifaRouteHandler } from '../_handler'

export default defineEventHandler(createFifaRouteHandler({
  route: '/fixtures/players',
  upstreamEndpoint: '/fixtures/players',
  querySchema: {
    required: ['fixture'],
    optional: {
      fixture: 'number',
      team: 'number',
    },
  },
}))
