import { createFifaRouteHandler } from '../_handler'

export default defineEventHandler(createFifaRouteHandler({
  route: '/leagues/seasons',
  upstreamEndpoint: '/leagues/seasons',
  querySchema: {
    optional: {
      current: 'boolean',
    },
  },
}))
