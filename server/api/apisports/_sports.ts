import type { ApiSportsRouteQuerySchema } from './_schema'
import type { ApiSportsSportConfig } from '~~/server/utils/apisportsProxy'
import { readApiSportsRegistrySport } from '~~/server/utils/apisportsRegistry'

export type ApiSportsEndpointConfig = {
  upstreamEndpoint: string
  querySchema: ApiSportsRouteQuerySchema
}

export type ApiSportsDefinition = {
  proxy: ApiSportsSportConfig
  endpoints: Record<string, ApiSportsEndpointConfig>
}

const assertApiSportsSportConfig = (sport: string, baseUrl: string, apiKey: string, configPath: { baseUrl: string, apiKey: string }) => {
  const missingEntries = [
    !baseUrl ? configPath.baseUrl : null,
    !apiKey ? configPath.apiKey : null,
  ].filter((entry): entry is string => Boolean(entry))

  if (missingEntries.length === 0) {
    return
  }

  throw createError({
    statusCode: 500,
    statusMessage: `Configuration API-Sports invalide pour "${sport}".`,
    data: {
      success: false,
      error: {
        code: 'API_SPORTS_PROXY_MISCONFIGURED',
        sport,
        message: `Configuration manquante pour le sport "${sport}": ${missingEntries.join(', ')}`,
        missing: missingEntries,
      },
    },
  })
}

export const readApiSportsDefinition = (sport: string): ApiSportsDefinition | null => {
  const registrySport = readApiSportsRegistrySport(sport)

  if (!registrySport) {
    return null
  }

  assertApiSportsSportConfig(
    registrySport.sport,
    registrySport.baseUrl,
    registrySport.apiKey,
    registrySport.configPath,
  )

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
