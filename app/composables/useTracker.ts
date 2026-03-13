export interface TrackingContext {
  routePath?: string
  userIdHash?: string | null
  source?: 'client' | 'server'
  [key: string]: unknown
}

export interface TrackingEvent {
  name: string
  timestamp: string
  context?: TrackingContext
  payload?: Record<string, unknown>
}

const TRACKER_STATE_KEY = 'telemetry-events'
const MAX_BUFFER_SIZE = 200

const stableHash = (value: string): string => {
  let hash = 0

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(index)
    hash |= 0
  }

  return Math.abs(hash).toString(36)
}

const anonymizeUserId = (value: unknown): string | null => {
  if (value === null || value === undefined) {
    return null
  }

  return `u_${stableHash(String(value))}`
}

export const useTracker = () => {
  const events = useState<TrackingEvent[]>(TRACKER_STATE_KEY, () => [])

  const getBaseContext = (): TrackingContext => {
    const route = useRoute()
    const authSession = useAuthSessionStore()
    const rawUserId = authSession.profile?.id ?? authSession.profile?.email ?? null

    return {
      routePath: route.path,
      userIdHash: anonymizeUserId(rawUserId),
      source: import.meta.server ? 'server' : 'client',
    }
  }

  const pushEvent = (event: TrackingEvent) => {
    events.value = [...events.value.slice(-(MAX_BUFFER_SIZE - 1)), event]

    if (import.meta.dev) {
      console.info('[tracker]', event)
    }

    if (import.meta.client && Array.isArray(window.dataLayer)) {
      window.dataLayer.push(event)
    }
  }

  const track = (name: string, payload: Record<string, unknown> = {}, context: TrackingContext = {}) => {
    pushEvent({
      name,
      timestamp: new Date().toISOString(),
      payload,
      context: {
        ...getBaseContext(),
        ...context,
      },
    })
  }

  const trackLatency = (name: string, startedAt: number, payload: Record<string, unknown> = {}, context: TrackingContext = {}) => {
    const endedAt = import.meta.client ? performance.now() : Date.now()
    const durationMs = Math.max(0, Math.round(endedAt - startedAt))

    track('api.latency', {
      name,
      durationMs,
      ...payload,
    }, context)

    return durationMs
  }

  const trackError = (name: string, error: unknown, payload: Record<string, unknown> = {}, context: TrackingContext = {}) => {
    const normalizedError = error instanceof Error
      ? { message: error.message, stack: error.stack }
      : { message: String(error) }

    track(name, {
      ...payload,
      error: normalizedError,
    }, context)
  }

  return {
    events,
    track,
    trackLatency,
    trackError,
    anonymizeUserId,
  }
}
