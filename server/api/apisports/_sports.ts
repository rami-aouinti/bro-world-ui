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
      sport,
      baseUrl: registrySport.upstream.baseUrl,
      apiKey: registrySport.upstream.apiKey,
      host: registrySport.upstream.host,
      cacheTtlSeconds: registrySport.cacheRules.reference,
      scheduleCacheTtlSeconds: registrySport.cacheRules.schedule,
      liveCacheTtlSeconds: registrySport.cacheRules.live,
      cacheResource: registrySport.cacheResource,
      referenceEndpoints: registrySport.referenceEndpoints,
    },
    endpoints: registrySport.endpoints,
  }
}
