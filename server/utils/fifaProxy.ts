import type { H3Event } from 'h3'

const DEFAULT_FIFA_TIMEOUT_MS = 8000

type FifaProxyErrorCode =
  | 'FIFA_PROXY_MISCONFIGURED'
  | 'FIFA_PROXY_TIMEOUT'
  | 'FIFA_PROXY_UNAUTHORIZED'
  | 'FIFA_PROXY_FORBIDDEN'
  | 'FIFA_PROXY_UPSTREAM_ERROR'

const toStatusCode = (error: unknown): number | undefined => {
  if (!error || typeof error !== 'object') {
    return undefined
  }

  const candidate = error as {
    statusCode?: number
    status?: number
    response?: { status?: number }
    cause?: { status?: number }
  }

  return candidate.statusCode ?? candidate.status ?? candidate.response?.status ?? candidate.cause?.status
}

const isTimeoutError = (error: unknown): boolean => {
  if (!error || typeof error !== 'object') {
    return false
  }

  const candidate = error as { name?: string, message?: string, code?: string }
  const name = (candidate.name || '').toLowerCase()
  const message = (candidate.message || '').toLowerCase()
  const code = (candidate.code || '').toLowerCase()

  return name.includes('timeout')
    || name.includes('abort')
    || message.includes('timeout')
    || message.includes('timed out')
    || code === 'etimedout'
}

const createFifaProxyError = (
  statusCode: number,
  code: FifaProxyErrorCode,
  message: string,
  details?: Record<string, unknown>,
) => createError({
  statusCode,
  statusMessage: message,
  data: {
    success: false,
    error: {
      code,
      message,
      statusCode,
      details,
    },
  },
})

const normalizeQuery = (query: Record<string, unknown>): Record<string, string | number | boolean | Array<string | number | boolean>> => {
  return Object.entries(query).reduce<Record<string, string | number | boolean | Array<string | number | boolean>>>((acc, [key, value]) => {
    if (value === undefined || value === null) {
      return acc
    }

    if (Array.isArray(value)) {
      const normalizedArray = value.filter(
        (item): item is string | number | boolean => typeof item === 'string' || typeof item === 'number' || typeof item === 'boolean',
      )

      if (normalizedArray.length) {
        acc[key] = normalizedArray
      }

      return acc
    }

    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      acc[key] = value
    }

    return acc
  }, {})
}

const readFifaConfig = () => {
  const config = useRuntimeConfig()
  const apiBase = config.fifa?.apiBase?.trim()
  const apiKey = config.fifa?.apiKey?.trim()

  if (!apiBase || !apiKey) {
    throw createFifaProxyError(
      500,
      'FIFA_PROXY_MISCONFIGURED',
      'FIFA proxy is not configured on the server.',
      { missingApiBase: !apiBase, missingApiKey: !apiKey },
    )
  }

  return { apiBase, apiKey }
}

export const proxyFifaRequest = async <T>(event: H3Event, endpoint: string): Promise<T> => {
  const { apiBase, apiKey } = readFifaConfig()
  const query = normalizeQuery(getQuery(event))

  try {
    return await $fetch<T>(endpoint, {
      baseURL: apiBase,
      query,
      retry: 0,
      timeout: DEFAULT_FIFA_TIMEOUT_MS,
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    })
  }
  catch (error) {
    if (isTimeoutError(error)) {
      throw createFifaProxyError(504, 'FIFA_PROXY_TIMEOUT', 'FIFA provider timeout reached.')
    }

    const statusCode = toStatusCode(error)

    if (statusCode === 401) {
      throw createFifaProxyError(502, 'FIFA_PROXY_UNAUTHORIZED', 'FIFA provider rejected the API key.')
    }

    if (statusCode === 403) {
      throw createFifaProxyError(502, 'FIFA_PROXY_FORBIDDEN', 'FIFA provider refused the request.')
    }

    throw createFifaProxyError(
      502,
      'FIFA_PROXY_UPSTREAM_ERROR',
      'FIFA provider request failed.',
      statusCode ? { upstreamStatusCode: statusCode } : undefined,
    )
  }
}
