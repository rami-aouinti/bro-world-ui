import { proxyMappedFifaRoute } from './_mapping'

export default defineEventHandler(event => proxyMappedFifaRoute(event, 'players'))
