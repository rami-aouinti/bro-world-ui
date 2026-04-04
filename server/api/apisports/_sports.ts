import type { ApiSportsRouteQuerySchema } from './_schema'
import type { ApiSportsSportConfig } from '~~/server/utils/apisportsProxy'
import { readApiSportsRegistrySport } from '~~/server/utils/apisportsRegistry'

export type ApiSportsEndpointConfig = {
  upstreamEndpoint: string
  querySchema?: ApiSportsRouteQuerySchema
}

export type ApiSportsDefinition = {
  proxy: ApiSportsSportConfig
  endpoints: Record<string, ApiSportsEndpointConfig>
}

export const readApiSportsDefinition = (sport: string): ApiSportsDefinition | null => {
  const registrySport = readApiSportsRegistrySport(sport)

  if (!registrySport) {
    return null
  }

  return {
    proxy: {
      sport: registrySport.sport,
      // Force sport-specific upstream resolution and disallow any global base URL fallback.
      baseUrl: registrySport.baseUrl,
      apiKey: registrySport.apiKey,
      host: registrySport.host,
      cacheTtlSeconds: registrySport.cacheStrategy.reference,
      scheduleCacheTtlSeconds: registrySport.cacheStrategy.schedule,
      liveCacheTtlSeconds: registrySport.cacheStrategy.live,
      cacheResource: registrySport.cacheResource,
      referenceEndpoints: registrySport.referenceEndpoints,
    },
    endpoints: registrySport.endpoints,
  }
}
