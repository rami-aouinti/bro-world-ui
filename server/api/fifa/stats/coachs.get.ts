import { createFifaRouteHandler } from '../_handler'

export default defineEventHandler(createFifaRouteHandler({
  route: '/coachs',
  upstreamEndpoint: '/coachs',
  querySchema: {
    atLeastOneOf: ['id', 'team', 'search'],
    optional: {
      id: 'number',
      team: 'number',
      search: 'string',
    },
  },
}))
