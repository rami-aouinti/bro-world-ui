type LocalBriefingBody = {
  latitude?: number
  longitude?: number
  timezone?: string
  locale?: string
}

type LocalContext = {
  city: string
  region: string
  country: string
  latitude: number
  longitude: number
}

type WeatherContext = {
  temperatureC: number
  apparentTemperatureC: number
  windSpeedKmh: number
  weatherCode: number
  weatherLabel: string
}

type AiResult = {
  headline: string
  summary: string
  events: Array<{ title: string, whyItMatters: string }>
  tips: Array<{ title: string, action: string }>
}

const WEATHER_CODE_MAP: Record<number, string> = {
  0: 'Ciel dégagé',
  1: 'Globalement ensoleillé',
  2: 'Partiellement nuageux',
  3: 'Couvert',
  45: 'Brume',
  48: 'Brouillard givrant',
  51: 'Bruine légère',
  53: 'Bruine modérée',
  55: 'Bruine forte',
  56: 'Bruine verglaçante légère',
  57: 'Bruine verglaçante forte',
  61: 'Pluie faible',
  63: 'Pluie modérée',
  65: 'Pluie forte',
  66: 'Pluie verglaçante légère',
  67: 'Pluie verglaçante forte',
  71: 'Neige faible',
  73: 'Neige modérée',
  75: 'Neige forte',
  77: 'Grains de neige',
  80: 'Averses légères',
  81: 'Averses modérées',
  82: 'Averses violentes',
  85: 'Averses de neige légères',
  86: 'Averses de neige fortes',
  95: 'Orage',
  96: 'Orage avec grêle légère',
  99: 'Orage avec grêle forte',
}

const fallbackByWeather = (weatherLabel: string) => {
  const isRainy = /pluie|averse|orage|bruine/i.test(weatherLabel)
  const isCold = /neige|givre/i.test(weatherLabel)

  return {
    headline: `Point local: ${weatherLabel.toLowerCase()}`,
    summary: isRainy
      ? 'La météo peut impacter les déplacements et la fréquentation des lieux extérieurs.'
      : 'Conditions globalement favorables, idéale pour des activités extérieures si besoin.',
    events: [
      {
        title: 'Flux mobilité à surveiller',
        whyItMatters: isRainy
          ? 'Le trafic peut être plus dense autour des axes majeurs et des transports.'
          : 'Les heures de pointe locales restent les meilleurs moments à anticiper.',
      },
      {
        title: isCold ? 'Alerte froid potentielle' : 'Agenda local du week-end',
        whyItMatters: isCold
          ? 'Pensez à vérifier les consignes locales et équipements adaptés.'
          : 'Les événements culturels/sportifs locaux peuvent augmenter la fréquentation.',
      },
      {
        title: 'Activité commerces et lieux publics',
        whyItMatters: 'Les pics de fréquentation varient selon la météo et l’heure.',
      },
    ],
    tips: [
      {
        title: 'Planifier votre sortie',
        action: isRainy ? 'Prévoir marge de transport et tenue imperméable.' : 'Profiter des créneaux hors pointe.',
      },
      {
        title: 'Vérifier les infos officielles',
        action: 'Confirmer les horaires et éventuelles perturbations avant de partir.',
      },
    ],
  }
}

const parseMaybeNumber = (raw: string | number | undefined) => {
  if (raw === undefined) {
    return null
  }

  const value = Number(raw)
  return Number.isFinite(value) ? value : null
}

const parseBody = (rawBody: unknown): LocalBriefingBody => {
  const body = (rawBody && typeof rawBody === 'object' ? rawBody : {}) as Record<string, unknown>

  const latitude = parseMaybeNumber(body.latitude as number | undefined)
  const longitude = parseMaybeNumber(body.longitude as number | undefined)
  const timezone = typeof body.timezone === 'string' ? body.timezone.slice(0, 60) : undefined
  const locale = typeof body.locale === 'string' ? body.locale.slice(0, 15) : undefined

  return {
    latitude: latitude ?? undefined,
    longitude: longitude ?? undefined,
    timezone,
    locale,
  }
}

const extractCoordinates = (event: Parameters<typeof defineEventHandler>[0], body: LocalBriefingBody) => {
  const latitude = body.latitude ?? parseMaybeNumber(getHeader(event, 'x-vercel-ip-latitude') || undefined)
  const longitude = body.longitude ?? parseMaybeNumber(getHeader(event, 'x-vercel-ip-longitude') || undefined)

  if (latitude === null || longitude === null || latitude === undefined || longitude === undefined) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Unable to detect user coordinates.',
    })
  }

  return { latitude, longitude }
}

const fetchLocationContext = async (latitude: number, longitude: number, locale: string): Promise<LocalContext> => {
  const reverse = await $fetch<{
    results?: Array<{
      name?: string
      admin1?: string
      country?: string
    }>
  }>('https://geocoding-api.open-meteo.com/v1/reverse', {
    query: {
      latitude,
      longitude,
      language: locale.startsWith('fr') ? 'fr' : 'en',
      count: 1,
    },
  })

  const place = reverse.results?.[0]

  return {
    city: place?.name || 'Votre zone',
    region: place?.admin1 || '',
    country: place?.country || '',
    latitude,
    longitude,
  }
}

const fetchWeatherContext = async (latitude: number, longitude: number, timezone?: string): Promise<WeatherContext> => {
  const weather = await $fetch<{
    current?: {
      temperature_2m?: number
      apparent_temperature?: number
      wind_speed_10m?: number
      weather_code?: number
    }
  }>('https://api.open-meteo.com/v1/forecast', {
    query: {
      latitude,
      longitude,
      current: ['temperature_2m', 'apparent_temperature', 'weather_code', 'wind_speed_10m'],
      timezone: timezone || 'auto',
    },
  })

  const current = weather.current

  if (!current || typeof current.temperature_2m !== 'number' || typeof current.weather_code !== 'number') {
    throw createError({ statusCode: 502, statusMessage: 'Weather service unavailable.' })
  }

  const weatherLabel = WEATHER_CODE_MAP[current.weather_code] || 'Conditions variables'

  return {
    temperatureC: current.temperature_2m,
    apparentTemperatureC: current.apparent_temperature ?? current.temperature_2m,
    weatherCode: current.weather_code,
    windSpeedKmh: current.wind_speed_10m ?? 0,
    weatherLabel,
  }
}

const sanitizeJson = (content: string) => {
  const trimmed = content.trim()

  if (!trimmed.startsWith('```')) {
    return trimmed
  }

  return trimmed
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```$/, '')
    .trim()
}

const fetchAiBriefing = async (location: LocalContext, weather: WeatherContext, locale: string) => {
  const config = useRuntimeConfig()
  const apiKey = config.aiGatewayApiKey

  if (!apiKey) {
    return null
  }

  const today = new Date().toLocaleDateString(locale.startsWith('fr') ? 'fr-FR' : 'en-US', {
    dateStyle: 'full',
  })

  const response = await $fetch<{
    choices?: Array<{ message?: { content?: string } }>
  }>('https://ai-gateway.vercel.sh/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: {
      model: config.aiGatewayModel || 'openai/gpt-4o-mini',
      temperature: 0.4,
      messages: [
        {
          role: 'system',
          content:
            'Tu es un assistant local. Réponds uniquement en JSON valide. Donne des infos prudentes, sans inventer de faits précis non vérifiables. Format strict: {"headline":string,"summary":string,"events":[{"title":string,"whyItMatters":string}],"tips":[{"title":string,"action":string}]}. 3 events max et 2 tips max.',
        },
        {
          role: 'user',
          content: `Contexte local: ${location.city}, ${location.region}, ${location.country}. Date locale: ${today}. Météo: ${weather.weatherLabel}, ${Math.round(weather.temperatureC)}°C, vent ${Math.round(weather.windSpeedKmh)} km/h. Propose un briefing utile pour un utilisateur de plateforme web.`,
        },
      ],
    },
  })

  const content = response.choices?.[0]?.message?.content

  if (!content) {
    return null
  }

  const parsed = JSON.parse(sanitizeJson(content)) as AiResult

  if (!parsed?.headline || !Array.isArray(parsed.events) || !Array.isArray(parsed.tips)) {
    return null
  }

  return {
    headline: parsed.headline,
    summary: parsed.summary,
    events: parsed.events.slice(0, 3),
    tips: parsed.tips.slice(0, 2),
  }
}

export default defineEventHandler(async (event) => {
  const body = parseBody(await readBody(event))
  const { latitude, longitude } = extractCoordinates(event, body)
  const locale = body.locale || 'fr-FR'

  const [location, weather] = await Promise.all([
    fetchLocationContext(latitude, longitude, locale),
    fetchWeatherContext(latitude, longitude, body.timezone),
  ])

  let source: 'ai' | 'fallback' = 'fallback'
  let generated = fallbackByWeather(weather.weatherLabel)

  try {
    const aiResult = await fetchAiBriefing(location, weather, locale)

    if (aiResult) {
      generated = aiResult
      source = 'ai'
    }
  }
  catch (error) {
    console.error('[local-briefing] AI generation failed, using fallback', error)
  }

  return {
    source,
    generatedAt: new Date().toISOString(),
    location,
    weather,
    ...generated,
  }
})
