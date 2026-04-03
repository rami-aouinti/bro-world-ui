import { createFifaRouteHandler } from '../_handler'

export default defineEventHandler(createFifaRouteHandler({
  route: '/countries',
  upstreamEndpoint: '/countries',
  querySchema: {
    optional: {
      name: 'string',
      code: 'string',
      search: 'string',
    },
  },
}))
