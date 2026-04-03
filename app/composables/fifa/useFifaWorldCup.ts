import {
  worldCupGroups,
} from '~/data/world-cup'

export type FifaWorldCupTeam = {
  code: string
  name: string
  group: string
}

export type FifaWorldCupStadium = {
  id: string
  name: string
  city: string
  country: string
  capacity: number | null
}

const WORLD_CUP_ENDPOINTS = {
  teams: '/api/fifa/teams',
  stadiums: '/api/fifa/stadiums',
} as const

const extractArrayPayload = <T>(input: unknown): T[] => {
  if (Array.isArray(input)) {
    return input as T[]
  }

  if (input && typeof input === 'object') {
    const candidate = input as Record<string, unknown>

    if (Array.isArray(candidate.data)) {
      return candidate.data as T[]
    }

    if (Array.isArray(candidate.items)) {
      return candidate.items as T[]
    }
  }

  return []
}

const normalizeCountryCode = (value: unknown): string => {
  if (typeof value !== 'string') {
    return ''
  }

  return value.trim().toLowerCase()
}

const normalizeGroupId = (value: unknown): string => {
  if (typeof value !== 'string') {
    return ''
  }

  return value.trim().toUpperCase().replace(/^GROUP\s+/, '')
}

const normalizeTeams = (payload: unknown): FifaWorldCupTeam[] => {
  return extractArrayPayload<Record<string, unknown>>(payload)
    .map((entry) => {
      const code = normalizeCountryCode(
        entry.code
        ?? entry.teamCode
        ?? entry.fifaCode
        ?? entry.countryCode
        ?? entry.country_code
        ?? entry.abbreviation,
      )
      const name = typeof (entry.name ?? entry.teamName ?? entry.countryName) === 'string'
        ? String(entry.name ?? entry.teamName ?? entry.countryName).trim()
        : ''
      const group = normalizeGroupId(entry.group ?? entry.groupId ?? entry.pool ?? '')

      return { code, name, group }
    })
    .filter(entry => Boolean(entry.code) && Boolean(entry.name))
}

const normalizeStadiums = (payload: unknown): FifaWorldCupStadium[] => {
  return extractArrayPayload<Record<string, unknown>>(payload)
    .map((entry, index) => {
      const idCandidate = entry.id ?? entry.stadiumId ?? `${entry.name ?? 'stadium'}-${index}`
      const id = typeof idCandidate === 'string' || typeof idCandidate === 'number'
        ? String(idCandidate)
        : `stadium-${index}`
      const name = typeof entry.name === 'string' ? entry.name.trim() : ''
      const city = typeof entry.city === 'string' ? entry.city.trim() : ''
      const country = typeof entry.country === 'string' ? entry.country.trim() : ''
      const capacity = typeof entry.capacity === 'number'
        ? entry.capacity
        : (typeof entry.capacity === 'string' && Number.isFinite(Number(entry.capacity)) ? Number(entry.capacity) : null)

      return { id, name, city, country, capacity }
    })
    .filter(entry => Boolean(entry.name))
}

const fallbackTeams = (): FifaWorldCupTeam[] => {
  return Object.entries(worldCupGroups).flatMap(([group, teams]) => teams.map(team => ({ ...team, group })))
}

const fallbackStadiums = (): FifaWorldCupStadium[] => []

const shouldUseFallbackOnly = (): boolean => {
  const runtimeConfig = useRuntimeConfig()
  const publicConfig = runtimeConfig.public as Record<string, unknown>
  const worldCupFallback = publicConfig.worldCupUseLocalFallback

  if (typeof worldCupFallback === 'boolean') {
    return worldCupFallback
  }

  return publicConfig.useMockData === true
}

type FetchOptions = {
  fallbackOnError?: boolean
  bypassCache?: boolean
}

const fetchAndNormalize = async <T>(
  endpoint: string,
  normalize: (payload: unknown) => T,
  fallback: () => T,
  options: FetchOptions = {},
): Promise<T> => {
  if (shouldUseFallbackOnly()) {
    return fallback()
  }

  try {
    const payload = await $fetch<unknown>(endpoint, {
      headers: options.bypassCache ? { 'x-fifa-refresh': '1' } : undefined,
    })
    const normalized = normalize(payload)
    return normalized
  }
  catch (error) {
    if (options.fallbackOnError === false) {
      throw error
    }

    return fallback()
  }
}

export const useFifaWorldCup = () => {
  const getTeams = (options?: FetchOptions) => fetchAndNormalize(WORLD_CUP_ENDPOINTS.teams, normalizeTeams, fallbackTeams, options)
  const getStadiums = (options?: FetchOptions) => fetchAndNormalize(WORLD_CUP_ENDPOINTS.stadiums, normalizeStadiums, fallbackStadiums, options)

  return {
    getTeams,
    getStadiums,
  }
}
