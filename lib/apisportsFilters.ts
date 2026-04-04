import type { ApiSportsRouteQuerySchema, ApiSportsQueryPrimitiveType } from '~~/server/api/apisports/_schema'

export type ApiSportsEndpointFilterMatrix = {
  required?: string[]
  optional?: Record<string, ApiSportsQueryPrimitiveType>
  mutuallyExclusive?: string[][]
  atLeastOneGroup?: string[][]
}

export type ApiSportsEndpointQueryValue = string | number | boolean | null | undefined

const hasValue = (value: ApiSportsEndpointQueryValue): boolean => {
  if (typeof value === 'string') {
    return value.trim().length > 0
  }

  return value !== null && value !== undefined
}

export const toApiSportsRouteQuerySchema = (filters: ApiSportsEndpointFilterMatrix): ApiSportsRouteQuerySchema => ({
  required: filters.required,
  optional: filters.optional,
  atLeastOneOfGroups: filters.atLeastOneGroup,
  mutuallyExclusive: filters.mutuallyExclusive,
})

export const listApiSportsFilterKeys = (filters: ApiSportsEndpointFilterMatrix): string[] => {
  const keys = new Set<string>()

  for (const key of filters.required ?? []) {
    keys.add(key)
  }

  for (const key of Object.keys(filters.optional ?? {})) {
    keys.add(key)
  }

  for (const group of filters.atLeastOneGroup ?? []) {
    for (const key of group) {
      keys.add(key)
    }
  }

  for (const group of filters.mutuallyExclusive ?? []) {
    for (const key of group) {
      keys.add(key)
    }
  }

  return Array.from(keys)
}

export const buildApiSportsQuery = (
  filters: ApiSportsEndpointFilterMatrix,
  values: Record<string, ApiSportsEndpointQueryValue>,
): Record<string, string | number | boolean> => {
  const allowedKeys = new Set(listApiSportsFilterKeys(filters))

  return Object.entries(values).reduce<Record<string, string | number | boolean>>((query, [key, value]) => {
    if (!allowedKeys.has(key) || !hasValue(value)) {
      return query
    }

    if (typeof value === 'string') {
      query[key] = value.trim()
      return query
    }

    query[key] = value
    return query
  }, {})
}
