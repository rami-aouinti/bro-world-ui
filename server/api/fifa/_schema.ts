import { getQuery } from 'h3'
import type { H3Event } from 'h3'

export type FifaQueryPrimitiveType = 'string' | 'number' | 'boolean'

export type FifaRouteQuerySchema = {
  required?: string[]
  optional?: Record<string, FifaQueryPrimitiveType>
  atLeastOneOf?: string[]
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

const matchesType = (value: unknown, type: FifaQueryPrimitiveType): boolean => {
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
  route: string,
  message: string,
  details: Record<string, unknown>,
) => createError({
  statusCode: 400,
  statusMessage: message,
  data: {
    success: false,
    error: {
      code: 'FIFA_PROXY_INVALID_QUERY',
      route,
      ...details,
    },
  },
})

export const validateFifaRouteQuery = (event: H3Event, route: string, schema: FifaRouteQuerySchema) => {
  const query = getQuery(event)
  const required = schema.required ?? []
  const missing = required.filter(key => !isProvided(query[key]))

  if (missing.length > 0) {
    throw createValidationError(
      route,
      `Missing required FIFA query parameter(s): ${missing.join(', ')}`,
      { missing, required },
    )
  }

  if (schema.atLeastOneOf?.length) {
    const hasAtLeastOne = schema.atLeastOneOf.some(key => isProvided(query[key]))

    if (!hasAtLeastOne) {
      throw createValidationError(
        route,
        `At least one FIFA query parameter is required: ${schema.atLeastOneOf.join(', ')}`,
        { atLeastOneOf: schema.atLeastOneOf },
      )
    }
  }

  if (schema.optional) {
    const invalidType = Object.entries(schema.optional).find(([key, type]) => !matchesType(query[key], type))

    if (invalidType) {
      const [key, type] = invalidType
      throw createValidationError(
        route,
        `Invalid FIFA query parameter type for "${key}". Expected ${type}.`,
        { key, expectedType: type },
      )
    }
  }
}
