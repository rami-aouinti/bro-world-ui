import type { MatchEvent, MatchLineup, MatchPlayersByTeam, MatchStatisticTeam } from '~/components/football/types'

export type Nullable<T> = T | null | undefined

export type FixtureTeamRef = {
  id?: Nullable<number>
  name?: Nullable<string>
  logo?: Nullable<string>
}

export type FixtureItem = {
  id?: Nullable<number>
  fixture?: {
    id?: Nullable<number>
    date?: Nullable<string>
    status?: {
      short?: Nullable<string>
    }
  }
  teams?: {
    home?: FixtureTeamRef
    away?: FixtureTeamRef
  }
  goals?: {
    home?: Nullable<number>
    away?: Nullable<number>
  }
}

export type FixtureEvent = MatchEvent
export type FixtureLineup = MatchLineup
export type FixtureStatistics = MatchStatisticTeam
export type FixturePlayersResponse = MatchPlayersByTeam

export type FixtureStandingsRow = {
  group?: Nullable<string>
  rank?: Nullable<number>
  team?: FixtureTeamRef
  points?: Nullable<number>
  all?: {
    played?: Nullable<number>
  }
}

export type FixtureStandingsBlock = {
  league?: {
    standings?: Nullable<FixtureStandingsRow[][]>
  }
}

export const asArray = <T>(value: unknown): T[] => (Array.isArray(value) ? value as T[] : [])

export const toNumber = (value: unknown, fallback = 0) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

export const toNumberOrNull = (value: unknown) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

export const normalizeStatValue = (value: string | number | null | undefined) => {
  if (value == null) {
    return null
  }

  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null
  }

  const cleaned = value.replace('%', '').trim()
  if (!cleaned) {
    return null
  }

  const parsed = Number(cleaned)
  return Number.isFinite(parsed) ? parsed : null
}

export const normalizeFixtureStatistics = (statistics: FixtureStatistics[]): FixtureStatistics[] => {
  return statistics.map(statBlock => ({
    ...statBlock,
    statistics: (statBlock.statistics || []).map(stat => ({
      ...stat,
      value: normalizeStatValue(stat.value ?? null),
    })),
  }))
}
