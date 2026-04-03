import { createFifaRouteHandler } from '../_handler'

export default defineEventHandler(createFifaRouteHandler({
  route: '/odds/bookmakers',
  upstreamEndpoint: '/odds/bookmakers',
  querySchema: {
    optional: {
      id: 'number',
      search: 'string',
    },
  },
}))
