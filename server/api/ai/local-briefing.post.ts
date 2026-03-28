type LocalBriefingBody = {
  latitude?: number
  longitude?: number
  timezone?: string
  locale?: string
}

type Coordinates = {
  latitude: number
  longitude: number
}

type LocalContext = {
  city: string
  region: string
  country: string
  latitude: number | null
  longitude: number | null
}

type WeatherContext = {
  temperatureC: number | null
  apparentTemperatureC: number | null
  windSpeedKmh: number | null
  weatherCode: number | null
  weatherLabel: string
}

type AiResult = {
  headline: string
  summary: string
  events: Array<{ title: string, whyItMatters: string }>
  tips: Array<{ title: string, action: string }>
}

const normalizeLanguage = (locale: string) => locale.toLowerCase().startsWith('fr') ? 'fr' : 'en'

const WEATHER_CODE_MAP: Record<'fr' | 'en', Record<number, string>> = {
  fr: {
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
  },
  en: {
    0: 'Clear sky',
    1: 'Mostly sunny',
    2: 'Partly cloudy',
    3: 'Overcast',
    45: 'Fog',
    48: 'Rime fog',
    51: 'Light drizzle',
    53: 'Moderate drizzle',
    55: 'Dense drizzle',
    56: 'Light freezing drizzle',
    57: 'Dense freezing drizzle',
    61: 'Light rain',
    63: 'Moderate rain',
    65: 'Heavy rain',
    66: 'Light freezing rain',
    67: 'Heavy freezing rain',
    71: 'Light snow',
    73: 'Moderate snow',
    75: 'Heavy snow',
    77: 'Snow grains',
    80: 'Light showers',
    81: 'Moderate showers',
    82: 'Violent showers',
    85: 'Light snow showers',
    86: 'Heavy snow showers',
    95: 'Thunderstorm',
    96: 'Thunderstorm with light hail',
    99: 'Thunderstorm with heavy hail',
  },
}

const DEFAULT_WEATHER: WeatherContext = {
  temperatureC: null,
  apparentTemperatureC: null,
  windSpeedKmh: null,
  weatherCode: null,
  weatherLabel: 'Weather not available',
}

const fallbackByWeather = (weatherLabel: string, hasWeather: boolean, language: 'fr' | 'en') => {
  const isRainy = /rain|drizzle|shower|thunderstorm|pluie|averse|orage|bruine/i.test(weatherLabel)
  const isCold = /snow|freezing|rime|neige|givre/i.test(weatherLabel)

  if (language === 'en') {
    return {
      headline: hasWeather ? `Local snapshot: ${weatherLabel.toLowerCase()}` : 'Local snapshot: partial data',
      summary: hasWeather
        ? (isRainy
            ? 'Weather may affect mobility and traffic around outdoor areas.'
            : 'Conditions are generally favorable for outdoor activities.')
        : 'Exact location could not be detected, so this briefing is less precise.',
      events: [
        {
          title: 'Mobility flow to monitor',
          whyItMatters: isRainy
            ? 'Traffic may be denser around major roads and public transit.'
            : 'Local peak-hour windows remain important to plan around.',
        },
        {
          title: isCold ? 'Potential cold-weather alert' : 'Local weekend agenda',
          whyItMatters: isCold
            ? 'Check local safety guidance and weather-ready equipment.'
            : 'Local cultural and sports events may increase foot traffic.',
        },
        {
          title: 'Public places activity',
          whyItMatters: 'Crowd levels vary based on weather and time of day.',
        },
      ],
      tips: [
        {
          title: 'Plan your trip',
          action: isRainy ? 'Allow extra travel time and bring rain protection.' : 'Use off-peak windows when possible.',
        },
        {
          title: 'Check official updates',
          action: 'Confirm schedules and disruptions before heading out.',
        },
      ],
    }
  }

  return {
    headline: hasWeather ? `Point local: ${weatherLabel.toLowerCase()}` : 'Point local: informations partielles',
    summary: hasWeather
      ? (isRainy
          ? 'La météo peut impacter les déplacements et la fréquentation des lieux extérieurs.'
          : 'Conditions globalement favorables, idéale pour des activités extérieures si besoin.')
      : 'La position précise n’a pas pu être détectée, le briefing reste utile mais moins précis.',
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

const readHeader = (event: Parameters<typeof defineEventHandler>[0], name: string) => (getHeader(event, name) || '').trim()

const extractHeaderLocation = (event: Parameters<typeof defineEventHandler>[0]) => ({
  city: readHeader(event, 'x-vercel-ip-city') || 'Your zone',
  region: readHeader(event, 'x-vercel-ip-country-region') || '',
  country: readHeader(event, 'x-vercel-ip-country') || '',
})

const resolveCoordinatesFromCity = async (city: string, country: string, locale: string): Promise<Coordinates | null> => {
  if (!city) {
    return null
  }

  try {
    const query = [city, country].filter(Boolean).join(', ')
    const geocoding = await $fetch<{
      results?: Array<{ latitude?: number, longitude?: number }>
    }>('https://geocoding-api.open-meteo.com/v1/search', {
      query: {
        name: query,
        count: 1,
        language: normalizeLanguage(locale),
      },
    })

    const result = geocoding.results?.[0]

    if (typeof result?.latitude === 'number' && typeof result?.longitude === 'number') {
      return { latitude: result.latitude, longitude: result.longitude }
    }
  }
  catch (error) {
    console.warn('[local-briefing] could not resolve coordinates from city', error)
  }

  return null
}

const resolveCoordinates = async (
  event: Parameters<typeof defineEventHandler>[0],
  body: LocalBriefingBody,
  headerLocation: { city: string, country: string },
  locale: string,
): Promise<Coordinates | null> => {
  const latitude = body.latitude ?? parseMaybeNumber(getHeader(event, 'x-vercel-ip-latitude') || undefined)
  const longitude = body.longitude ?? parseMaybeNumber(getHeader(event, 'x-vercel-ip-longitude') || undefined)

  if (latitude !== null && longitude !== null && latitude !== undefined && longitude !== undefined) {
    return { latitude, longitude }
  }

  return resolveCoordinatesFromCity(headerLocation.city, headerLocation.country, locale)
}

const fetchLocationFromCoordinates = async (
  coordinates: Coordinates,
  locale: string,
  headerLocation: { city: string, region: string, country: string },
): Promise<LocalContext> => {
  try {
    const reverse = await $fetch<{
      address?: {
        city?: string
        town?: string
        village?: string
        state?: string
        country?: string
      }
    }>('https://nominatim.openstreetmap.org/reverse', {
      query: {
        format: 'jsonv2',
        lat: coordinates.latitude,
        lon: coordinates.longitude,
        'accept-language': normalizeLanguage(locale),
      },
      headers: {
        'User-Agent': 'bro-world-ui/1.0 (local-briefing)',
      },
    })

    const address = reverse.address

    return {
      city: address?.city || address?.town || address?.village || headerLocation.city || 'Your zone',
      region: address?.state || headerLocation.region || '',
      country: address?.country || headerLocation.country || '',
      latitude: coordinates.latitude,
      longitude: coordinates.longitude,
    }
  }
  catch (error) {
    console.warn('[local-briefing] reverse geocoding failed', error)

    return {
      city: headerLocation.city || 'Your zone',
      region: headerLocation.region,
      country: headerLocation.country,
      latitude: coordinates.latitude,
      longitude: coordinates.longitude,
    }
  }
}

const fetchWeatherContext = async (coordinates: Coordinates, locale: string, timezone?: string): Promise<WeatherContext> => {
  try {
    const weather = await $fetch<{
      current?: {
        temperature_2m?: number
        apparent_temperature?: number
        wind_speed_10m?: number
        weather_code?: number
      }
    }>('https://api.open-meteo.com/v1/forecast', {
      query: {
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
        current: ['temperature_2m', 'apparent_temperature', 'weather_code', 'wind_speed_10m'],
        timezone: timezone || 'auto',
      },
    })

    const current = weather.current

    if (!current || typeof current.temperature_2m !== 'number' || typeof current.weather_code !== 'number') {
      return DEFAULT_WEATHER
    }

    const language = normalizeLanguage(locale)
    const weatherLabel = WEATHER_CODE_MAP[language][current.weather_code] || (language === 'fr' ? 'Conditions variables' : 'Variable conditions')

    return {
      temperatureC: current.temperature_2m,
      apparentTemperatureC: current.apparent_temperature ?? current.temperature_2m,
      weatherCode: current.weather_code,
      windSpeedKmh: current.wind_speed_10m ?? 0,
      weatherLabel,
    }
  }
  catch (error) {
    console.warn('[local-briefing] weather service failed', error)
    return DEFAULT_WEATHER
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

  const language = normalizeLanguage(locale)
  const today = new Date().toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US', {
    dateStyle: 'full',
  })

  const weatherDetails = weather.temperatureC === null
    ? 'Weather not available.'
    : `${weather.weatherLabel}, ${Math.round(weather.temperatureC)}°C, vent ${Math.round(weather.windSpeedKmh || 0)} km/h.`

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
            language === 'fr'
              ? 'Tu es un assistant local. Réponds uniquement en français et en JSON valide. Donne des infos prudentes, sans inventer de faits précis non vérifiables. Format strict: {"headline":string,"summary":string,"events":[{"title":string,"whyItMatters":string}],"tips":[{"title":string,"action":string}]}. 3 events max et 2 tips max.'
              : 'You are a local assistant. Reply only in English and valid JSON. Be cautious and do not invent specific unverifiable facts. Strict format: {"headline":string,"summary":string,"events":[{"title":string,"whyItMatters":string}],"tips":[{"title":string,"action":string}]}. Max 3 events and max 2 tips.',
        },
        {
          role: 'user',
          content: `Context local: ${location.city}, ${location.region}, ${location.country}. Date locale: ${today}. ${weatherDetails} Propose briefing for connected user.`,
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
  const locale = body.locale || 'en-US'
  const language = normalizeLanguage(locale)
  const headerLocation = extractHeaderLocation(event)
  const coordinates = await resolveCoordinates(event, body, headerLocation, locale)

  const location = coordinates
    ? await fetchLocationFromCoordinates(coordinates, locale, headerLocation)
    : {
        city: headerLocation.city || (language === 'fr' ? 'Votre zone' : 'Your zone'),
        region: headerLocation.region,
        country: headerLocation.country,
        latitude: null,
        longitude: null,
      }

  const weather = coordinates ? await fetchWeatherContext(coordinates, locale, body.timezone) : DEFAULT_WEATHER

  let source: 'ai' | 'fallback' = 'fallback'
  const hasWeather = weather.temperatureC !== null
  let generated = fallbackByWeather(weather.weatherLabel, hasWeather, language)

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
