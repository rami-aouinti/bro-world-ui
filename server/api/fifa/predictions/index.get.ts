import { createFifaRouteHandler } from '../_handler'

export default defineEventHandler(createFifaRouteHandler({
  route: '/predictions',
  upstreamEndpoint: '/predictions',
  querySchema: {
    required: ['fixture'],
    optional: {
      fixture: 'number',
    },
  },
}))
