import { proxyFifaRequest } from '~~/server/utils/fifaProxy'

export default defineEventHandler(event => proxyFifaRequest(event, '/group_standings'))
