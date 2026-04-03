import { createFifaRouteHandler } from '../_handler'

export default defineEventHandler(createFifaRouteHandler({
  route: '/fixtures/statistics',
  upstreamEndpoint: '/fixtures/statistics',
  querySchema: {
    required: ['fixture'],
    optional: {
      fixture: 'number',
      team: 'number',
      type: 'string',
    },
  },
}))
