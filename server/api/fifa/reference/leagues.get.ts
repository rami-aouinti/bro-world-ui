import { createFifaRouteHandler } from '../_handler'

export default defineEventHandler(createFifaRouteHandler({
  route: '/leagues',
  upstreamEndpoint: '/leagues',
  querySchema: {
    optional: {
      id: 'number',
      name: 'string',
      country: 'string',
      code: 'string',
      season: 'number',
      team: 'number',
      type: 'string',
      current: 'boolean',
      search: 'string',
      last: 'number',
    },
  },
}))
