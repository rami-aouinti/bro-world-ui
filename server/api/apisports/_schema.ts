import { getQuery } from 'h3'
import type { H3Event } from 'h3'

export type ApiSportsQueryPrimitiveType = 'string' | 'number' | 'boolean'

export type ApiSportsRouteQuerySchema = {
  required?: string[]
  optional?: Record<string, ApiSportsQueryPrimitiveType>
  atLeastOneOf?: string[]
  atLeastOneOfGroups?: string[][]
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

  if (schema.atLeastOneOfGroups?.length) {
    const hasAtLeastOneGroup = schema.atLeastOneOfGroups.some(group => group.every(key => isProvided(query[key])))

    if (!hasAtLeastOneGroup) {
      const serializedGroups = schema.atLeastOneOfGroups.map(group => group.join('+'))
      throw createValidationError(
        sport,
        route,
        `At least one API-Sports query filter group is required: ${serializedGroups.join(' | ')}`,
        { atLeastOneOfGroups: schema.atLeastOneOfGroups },
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
