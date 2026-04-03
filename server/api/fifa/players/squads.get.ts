import { createFifaRouteHandler } from '../_handler'

export default defineEventHandler(createFifaRouteHandler({
  route: '/players/squads',
  upstreamEndpoint: '/players/squads',
  querySchema: {
    required: ['team'],
    optional: {
      team: 'number',
      player: 'number',
    },
  },
}))
