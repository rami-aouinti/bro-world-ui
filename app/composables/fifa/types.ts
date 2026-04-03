export type FifaApiEnvelope<T> = {
  response?: T[]
  results?: number
  paging?: {
    current?: number
    total?: number
  }
  errors?: Record<string, unknown>
  [key: string]: unknown
}

export type FifaNormalizedResult<T> = {
  items: T[]
  count: number
  paging: {
    current: number
    total: number
  } | null
  raw: FifaApiEnvelope<T> | null
}

export type FifaFetchOptions = {
  bypassCache?: boolean
}

export type FifaQueryParams = Record<string, string | number | boolean | undefined>
