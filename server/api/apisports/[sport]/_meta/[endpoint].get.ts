import { readApiSportsEndpointFilters } from '../../_sports'
import { resolveCanonicalSport } from '~~/server/utils/apisportsRegistry'

export default defineEventHandler((event) => {
  const sport = getRouterParam(event, 'sport')?.toLowerCase() || ''
  const endpoint = getRouterParam(event, 'endpoint') || ''

  const canonicalSport = resolveCanonicalSport(sport)

  if (!canonicalSport) {
    throw createError({
      statusCode: 404,
      statusMessage: `Unsupported API-Sports sport: ${sport}`,
    })
  }

  const filters = readApiSportsEndpointFilters(canonicalSport, endpoint)

  if (!filters) {
    throw createError({
      statusCode: 404,
      statusMessage: `Unsupported API-Sports endpoint for ${canonicalSport}: ${endpoint}`,
    })
  }

  return {
    sport: canonicalSport,
    endpoint: endpoint.replace(/^\/+|\/+$/g, ''),
    filters,
  }
})
