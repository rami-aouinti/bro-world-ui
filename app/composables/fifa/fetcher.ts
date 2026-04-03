import type { FifaApiEnvelope, FifaFetchOptions, FifaNormalizedResult } from './types'

const buildHeaders = (options?: FifaFetchOptions) => {
  if (!options?.bypassCache) {
    return undefined
  }

  return {
    'x-football-refresh': '1',
    'x-fifa-refresh': '1',
  }
}

export const normalizeFifaEnvelope = <T>(payload: unknown): FifaNormalizedResult<T> => {
  const envelope = payload && typeof payload === 'object' ? payload as FifaApiEnvelope<T> : null
  const items = Array.isArray(envelope?.response) ? envelope.response : []
  const currentPage = envelope?.paging?.current
  const totalPages = envelope?.paging?.total

  return {
    items,
    count: typeof envelope?.results === 'number' ? envelope.results : items.length,
    paging: (typeof currentPage === 'number' || typeof totalPages === 'number')
      ? {
          current: typeof currentPage === 'number' ? currentPage : 1,
          total: typeof totalPages === 'number' ? totalPages : 1,
        }
      : null,
    raw: envelope,
  }
}

export const fetchFifaFamilyEndpoint = async <T>(
  path: string,
  query?: Record<string, string | number | boolean | undefined>,
  options?: FifaFetchOptions,
): Promise<FifaNormalizedResult<T>> => {
  const payload = await $fetch<unknown>(`/api/fifa/${path}`, {
    query,
    headers: buildHeaders(options),
  })

  return normalizeFifaEnvelope<T>(payload)
}
