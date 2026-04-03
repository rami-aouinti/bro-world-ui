import {
  worldCupGroups,
  worldCupStandings,
  worldCupUpcomingMatches,
} from '~/data/world-cup'

export type FifaWorldCupTeam = {
  code: string
  name: string
  group: string
}

export type FifaWorldCupStanding = {
  group: string
  teamCode: string
  points: number
  diff: number
  matches: number
}

export type FifaWorldCupMatch = {
  datetime: string
  teamA: string
  teamB: string
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
  teams: '/api/v1/public/fifa/world-cup/teams',
  stadiums: '/api/v1/public/fifa/world-cup/stadiums',
  standings: '/api/v1/public/fifa/world-cup/standings',
  matches: '/api/v1/public/fifa/world-cup/matches',
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

  return value.trim().toUpperCase()
}

const normalizeTeams = (payload: unknown): FifaWorldCupTeam[] => {
  return extractArrayPayload<Record<string, unknown>>(payload)
    .map((entry) => {
      const code = normalizeCountryCode(entry.code ?? entry.teamCode ?? entry.fifaCode ?? entry.countryCode)
      const name = typeof (entry.name ?? entry.teamName ?? entry.countryName) === 'string'
        ? String(entry.name ?? entry.teamName ?? entry.countryName).trim()
        : ''
      const group = normalizeGroupId(entry.group ?? entry.groupId ?? entry.pool)

      return { code, name, group }
    })
    .filter(entry => Boolean(entry.code) && Boolean(entry.name) && Boolean(entry.group))
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

const normalizeStandings = (payload: unknown): Record<string, FifaWorldCupStanding[]> => {
  if (payload && typeof payload === 'object' && !Array.isArray(payload)) {
    const data = payload as Record<string, unknown>
    const groups = Object.entries(data)
      .filter(([key, value]) => key !== 'data' && key !== 'items' && Array.isArray(value))

    if (groups.length) {
      return groups.reduce<Record<string, FifaWorldCupStanding[]>>((acc, [group, rows]) => {
        const groupId = normalizeGroupId(group)
        acc[groupId] = normalizeStandingsRows(rows, groupId)
        return acc
      }, {})
    }
  }

  const entries = extractArrayPayload<Record<string, unknown>>(payload)
  return entries.reduce<Record<string, FifaWorldCupStanding[]>>((acc, row) => {
    const group = normalizeGroupId(row.group ?? row.groupId ?? row.pool)

    if (!group) {
      return acc
    }

    const normalizedRow = normalizeStandingRow(row, group)

    if (!normalizedRow) {
      return acc
    }

    acc[group] = [...(acc[group] ?? []), normalizedRow]
    return acc
  }, {})
}

const normalizeStandingsRows = (rows: unknown, group: string): FifaWorldCupStanding[] => {
  return extractArrayPayload<Record<string, unknown>>(rows)
    .map(row => normalizeStandingRow(row, group))
    .filter((row): row is FifaWorldCupStanding => row !== null)
}

const normalizeStandingRow = (row: Record<string, unknown>, group: string): FifaWorldCupStanding | null => {
  const teamCode = normalizeCountryCode(row.teamCode ?? row.code ?? row.team)

  if (!teamCode) {
    return null
  }

  const points = Number(row.points ?? row.pts ?? 0)
  const diff = Number(row.diff ?? row.goalDiff ?? row.goalDifference ?? 0)
  const matches = Number(row.matches ?? row.played ?? row.games ?? 0)

  return {
    group,
    teamCode,
    points: Number.isFinite(points) ? points : 0,
    diff: Number.isFinite(diff) ? diff : 0,
    matches: Number.isFinite(matches) ? matches : 0,
  }
}

const normalizeMatches = (payload: unknown): FifaWorldCupMatch[] => {
  return extractArrayPayload<Record<string, unknown>>(payload)
    .map((entry) => {
      const datetime = typeof (entry.datetime ?? entry.date ?? entry.kickoffAt) === 'string'
        ? String(entry.datetime ?? entry.date ?? entry.kickoffAt)
        : ''
      const teamA = normalizeCountryCode(entry.teamA ?? entry.homeTeam ?? entry.homeTeamCode)
      const teamB = normalizeCountryCode(entry.teamB ?? entry.awayTeam ?? entry.awayTeamCode)
      const group = normalizeGroupId(entry.group ?? entry.groupId ?? entry.pool)

      return { datetime, teamA, teamB, group }
    })
    .filter(entry => Boolean(entry.datetime) && Boolean(entry.teamA) && Boolean(entry.teamB) && Boolean(entry.group))
    .sort((a, b) => a.datetime.localeCompare(b.datetime))
}

const fallbackTeams = (): FifaWorldCupTeam[] => {
  return Object.entries(worldCupGroups).flatMap(([group, teams]) => teams.map(team => ({ ...team, group })))
}

const fallbackStandings = (): Record<string, FifaWorldCupStanding[]> => {
  return Object.entries(worldCupStandings).reduce<Record<string, FifaWorldCupStanding[]>>((acc, [group, rows]) => {
    acc[group] = rows.map(row => ({ group, ...row }))
    return acc
  }, {})
}

const fallbackMatches = (): FifaWorldCupMatch[] => {
  return worldCupUpcomingMatches.map(match => ({ ...match }))
}

const fallbackStadiums = (): FifaWorldCupStadium[] => []

const shouldUseFallbackOnly = (): boolean => {
  const runtimeConfig = useRuntimeConfig()
  const publicConfig = runtimeConfig.public as Record<string, unknown>

  return publicConfig.useMockData === true || publicConfig.worldCupUseLocalFallback === true
}

const fetchAndNormalize = async <T>(
  endpoint: string,
  normalize: (payload: unknown) => T,
  fallback: () => T,
): Promise<T> => {
  if (shouldUseFallbackOnly()) {
    return fallback()
  }

  try {
    const payload = await $fetch<unknown>(endpoint)
    const normalized = normalize(payload)
    return normalized
  }
  catch {
    return fallback()
  }
}

export const useFifaWorldCup = () => {
  const getTeams = () => fetchAndNormalize(WORLD_CUP_ENDPOINTS.teams, normalizeTeams, fallbackTeams)
  const getStadiums = () => fetchAndNormalize(WORLD_CUP_ENDPOINTS.stadiums, normalizeStadiums, fallbackStadiums)
  const getGroupStandings = () => fetchAndNormalize(WORLD_CUP_ENDPOINTS.standings, normalizeStandings, fallbackStandings)
  const getMatches = () => fetchAndNormalize(WORLD_CUP_ENDPOINTS.matches, normalizeMatches, fallbackMatches)

  return {
    getTeams,
    getStadiums,
    getGroupStandings,
    getMatches,
  }
}
