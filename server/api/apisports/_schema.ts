import { getQuery } from 'h3'
import type { H3Event } from 'h3'

export type ApiSportsQueryPrimitiveType = 'string' | 'number' | 'boolean'

export type ApiSportsRouteQuerySchema = {
  required?: string[]
  optional?: Record<string, ApiSportsQueryPrimitiveType>
  atLeastOneOf?: string[]
  atLeastOneOfGroups?: string[][]
  atLeastOneGroup?: string[][]
  mutuallyExclusive?: string[][]
}

const collectAllowedKeys = (schema: ApiSportsRouteQuerySchema): Set<string> => {
  const allowed = new Set<string>()

  for (const key of schema.required ?? []) {
    allowed.add(key)
  }

  for (const key of Object.keys(schema.optional ?? {})) {
    allowed.add(key)
  }

  for (const key of schema.atLeastOneOf ?? []) {
    allowed.add(key)
  }

  for (const group of (schema.atLeastOneOfGroups ?? schema.atLeastOneGroup) ?? []) {
    for (const key of group) {
      allowed.add(key)
    }
  }

  return allowed
}

const readFirstQueryValue = (value: unknown): unknown => {
  if (Array.isArray(value)) {
    return value[0]
  }

  return value
}

const isProvided = (value: unknown): boolean => {
  const candidate = readFirstQueryValue(value)

  if (typeof candidate === 'string') {
    return candidate.trim().length > 0
  }

  return candidate !== undefined && candidate !== null
}

const matchesType = (value: unknown, type: ApiSportsQueryPrimitiveType): boolean => {
  const candidate = readFirstQueryValue(value)

  if (candidate === undefined || candidate === null || candidate === '') {
    return true
  }

  if (type === 'string') {
    return typeof candidate === 'string'
  }

  if (type === 'number') {
    return Number.isFinite(Number(candidate))
  }

  if (type === 'boolean') {
    return candidate === 'true' || candidate === 'false' || typeof candidate === 'boolean'
  }

  return false
}

const createValidationError = (
  sport: string,
  route: string,
  message: string,
  details: Record<string, unknown>,
) => createError({
  statusCode: 400,
  statusMessage: message,
  data: {
    success: false,
    error: {
      code: 'API_SPORTS_PROXY_INVALID_QUERY',
      sport,
      route,
      ...details,
    },
  },
})

export const validateApiSportsRouteQuery = (
  event: H3Event,
  sport: string,
  route: string,
  schema: ApiSportsRouteQuerySchema,
) => {
  const query = getQuery(event)
  const allowedKeys = collectAllowedKeys(schema)
  const providedEntries = Object.entries(query).filter(([, value]) => isProvided(value))
  const duplicateKeys = providedEntries
    .filter(([, value]) => Array.isArray(value) && value.length > 1)
    .map(([key]) => key)

  if (duplicateKeys.length > 0) {
    throw createValidationError(
      sport,
      route,
      `Duplicate API-Sports query parameter(s) are not allowed: ${duplicateKeys.join(', ')}`,
      { duplicate: duplicateKeys },
    )
  }

  const unknownKeys = providedEntries
    .map(([key]) => key)
    .filter(key => !allowedKeys.has(key))

  if (unknownKeys.length > 0) {
    throw createValidationError(
      sport,
      route,
      `Unsupported API-Sports query parameter(s): ${unknownKeys.join(', ')}`,
      {
        unsupported: unknownKeys,
        allowed: Array.from(allowedKeys),
      },
    )
  }

  const required = schema.required ?? []
  const missing = required.filter(key => !isProvided(query[key]))

  if (missing.length > 0) {
    throw createValidationError(
      sport,
      route,
      `Missing required API-Sports query parameter(s): ${missing.join(', ')}`,
      { missing, required },
    )
  }

  if (schema.atLeastOneOf?.length) {
    const hasAtLeastOne = schema.atLeastOneOf.some(key => isProvided(query[key]))

    if (!hasAtLeastOne) {
      throw createValidationError(
        sport,
        route,
        `At least one API-Sports query parameter is required: ${schema.atLeastOneOf.join(', ')}`,
        { atLeastOneOf: schema.atLeastOneOf },
      )
    }
  }

  const atLeastOneGroups = schema.atLeastOneOfGroups ?? schema.atLeastOneGroup

  if (atLeastOneGroups?.length) {
    const hasAtLeastOneGroup = atLeastOneGroups.some(group => group.every(key => isProvided(query[key])))

    if (!hasAtLeastOneGroup) {
      const serializedGroups = atLeastOneGroups.map(group => group.join('+'))
      throw createValidationError(
        sport,
        route,
        `At least one API-Sports query filter group is required: ${serializedGroups.join(' | ')}`,
        { atLeastOneOfGroups: atLeastOneGroups },
      )
    }
  }

  if (schema.mutuallyExclusive?.length) {
    const conflictingGroups = schema.mutuallyExclusive
      .map(group => group.filter(key => isProvided(query[key])))
      .filter(group => group.length > 1)

    if (conflictingGroups.length > 0) {
      const serializedGroups = conflictingGroups.map(group => group.join(' + '))

      throw createValidationError(
        sport,
        route,
        `Mutually exclusive API-Sports query parameter(s) provided: ${serializedGroups.join(' | ')}`,
        { mutuallyExclusive: schema.mutuallyExclusive, conflicts: conflictingGroups },
      )
    }
  }

  if (schema.optional) {
    const invalidType = Object.entries(schema.optional).find(([key, type]) => !matchesType(query[key], type))

    if (invalidType) {
      const [key, type] = invalidType
      throw createValidationError(
        sport,
        route,
        `Invalid API-Sports query parameter type for "${key}". Expected ${type}.`,
        { key, expectedType: type },
      )
    }
  }
}
