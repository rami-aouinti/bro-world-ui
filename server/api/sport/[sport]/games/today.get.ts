import { getQuery } from 'h3'

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

const toUiModel = (item: ApiSportsFixtureResponseItem): SportGameItem | null => {
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

export default defineEventHandler(async event => {
  const sport = getRouterParam(event, 'sport')?.toLowerCase() || ''
  const query = getQuery(event)
  const timezoneInput = typeof query.timezone === 'string' ? query.timezone.trim() : ''
  const timezonePolicy = timezoneInput && isValidTimeZone(timezoneInput) ? timezoneInput : 'UTC'
  const date = resolveDateForTimeZone(timezonePolicy)

  if (sport !== 'football') {
    throw createError({
      statusCode: 400,
      statusMessage: `Sport not yet supported for daily games: ${sport}`,
      data: {
        code: 'SPORT_GAMES_UNSUPPORTED_SPORT',
        sport,
      },
    })
  }

  const payload = await $fetch<ApiSportsFixtureEnvelope>('/api/apisports/football/fixtures', {
    query: {
      date,
      timezone: timezonePolicy,
    },
  })

  const games = (payload.response || []).map(toUiModel).filter((entry): entry is SportGameItem => Boolean(entry))

  return {
    sport,
    date,
    timezonePolicy,
    games,
  }
})
