import { createFifaRouteHandler } from '../_handler'

export default defineEventHandler(createFifaRouteHandler({
  route: '/timezone',
  upstreamEndpoint: '/timezone',
}))
