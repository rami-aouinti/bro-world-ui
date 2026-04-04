import { createFifaRouteHandler } from '../_handler'

export default defineEventHandler(createFifaRouteHandler({
  route: '/reference/venues',
  upstreamEndpoint: '/venues',
  querySchema: {
    optional: {
      id: 'number',
      name: 'string',
      city: 'string',
      country: 'string',
      search: 'string',
    },
  },
}))
