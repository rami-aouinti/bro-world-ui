import { getQuery } from 'h3'
import { listSupportedApiSports, readApiSportsRegistrySport, resolveCanonicalSport } from '~~/server/utils/apisportsRegistry'

type ApiSportsFixtureTeam = {
  id?: number
  name?: string
}

type ApiSportsFixtureLeague = {
  name?: string
}

type ApiSportsFixtureStatus = {
  short?: string
  long?: string
}

type ApiSportsFixtureResponseItem = {
  fixture?: {
    id?: number
    date?: string
    status?: ApiSportsFixtureStatus
    venue?: {
      name?: string
    }
  }
  league?: ApiSportsFixtureLeague
  teams?: {
    home?: ApiSportsFixtureTeam
    away?: ApiSportsFixtureTeam
  }
  goals?: {
    home?: number | null
    away?: number | null
  }
  score?: {
    fulltime?: {
      home?: number | null
      away?: number | null
    }
  }
}

type ApiSportsFixtureEnvelope = {
  response?: ApiSportsFixtureResponseItem[]
}

type SportGameItem = {
  id: string
  status: string
  home: string
  away: string
  scores: {
    home: number | null
    away: number | null
  }
  league: string
  venue: string
  time: string
}

type TodayGamesResolver = {
  endpoint: string
  query: (date: string, timezone: string) => Record<string, string>
  normalize: (payload: unknown) => SportGameItem[]
}

const isValidTimeZone = (value: string) => {
  try {
    Intl.DateTimeFormat('en-US', { timeZone: value })
    return true
  }
  catch {
    return false
  }
}

const resolveDateForTimeZone = (timeZone: string) => new Intl.DateTimeFormat('en-CA', {
  timeZone,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
}).format(new Date())

const toUiModelFromFixture = (item: ApiSportsFixtureResponseItem): SportGameItem | null => {
  const fixtureId = item.fixture?.id

  if (!fixtureId) {
    return null
  }

  return {
    id: String(fixtureId),
    status: item.fixture?.status?.short || item.fixture?.status?.long || 'TBD',
    home: item.teams?.home?.name || 'Home team',
    away: item.teams?.away?.name || 'Away team',
    scores: {
      home: item.goals?.home ?? item.score?.fulltime?.home ?? null,
      away: item.goals?.away ?? item.score?.fulltime?.away ?? null,
    },
    league: item.league?.name || 'Unknown league',
    venue: item.fixture?.venue?.name || 'Unknown venue',
    time: item.fixture?.date || '',
  }
}

const normalizeFootballGames = (payload: unknown): SportGameItem[] => {
  const envelope = payload as ApiSportsFixtureEnvelope
  return (envelope.response || [])
    .map(toUiModelFromFixture)
    .filter((entry): entry is SportGameItem => Boolean(entry))
}

const TODAY_GAMES_BY_SPORT: Record<string, TodayGamesResolver> = {
  football: {
    endpoint: 'fixtures',
    query: (date, timezone) => ({ date, timezone }),
    normalize: normalizeFootballGames,
  },
}

const createUnsupportedSportError = (sport: string) => createError({
  statusCode: 404,
  statusMessage: `Sport not declared for daily games: ${sport}`,
  data: {
    code: 'SPORT_GAMES_UNSUPPORTED_SPORT',
    sport,
    allowed: Object.keys(TODAY_GAMES_BY_SPORT),
    supportedSports: listSupportedApiSports(),
  },
})

const createUnsupportedEndpointError = (sport: string, endpoint: string, allowed: string[]) => createError({
  statusCode: 400,
  statusMessage: `Endpoint not declared for sport "${sport}": ${endpoint}`,
  data: {
    code: 'SPORT_GAMES_UNSUPPORTED_ENDPOINT',
    sport,
    endpoint,
    allowed,
  },
})

export default defineEventHandler(async event => {
  const requestedSport = getRouterParam(event, 'sport') || ''
  const canonicalSport = resolveCanonicalSport(requestedSport)
  const query = getQuery(event)
  const timezoneInput = typeof query.timezone === 'string' ? query.timezone.trim() : ''
  const timezonePolicy = timezoneInput && isValidTimeZone(timezoneInput) ? timezoneInput : 'UTC'
  const date = resolveDateForTimeZone(timezonePolicy)

  if (!canonicalSport) {
    throw createUnsupportedSportError(requestedSport)
  }

  const resolver = TODAY_GAMES_BY_SPORT[canonicalSport]

  if (!resolver) {
    throw createUnsupportedSportError(requestedSport)
  }

  const registrySport = readApiSportsRegistrySport(canonicalSport)

  if (!registrySport) {
    throw createUnsupportedSportError(requestedSport)
  }

  const isWhitelistedEndpoint = Boolean(registrySport.endpoints[resolver.endpoint])

  if (!isWhitelistedEndpoint) {
    throw createUnsupportedEndpointError(canonicalSport, resolver.endpoint, Object.keys(registrySport.endpoints))
  }

  const payload = await $fetch<unknown>(`/api/apisports/${canonicalSport}/${resolver.endpoint}`, {
    query: resolver.query(date, timezonePolicy),
  })

  return {
    sport: canonicalSport,
    date,
    timezonePolicy,
    games: resolver.normalize(payload),
  }
})
