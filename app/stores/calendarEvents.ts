import { defineStore } from 'pinia'
import { useCalendarEventsApi } from '~/composables/api/useCalendarEventsApi'
import type {
  CalendarEventRead,
  CreateCalendarEventPayload,
  PatchCalendarEventPayload,
} from '~/types/api/calendar'
import type { UUID } from '~/types/api/common'

const CACHE_TTL_MS = 60_000

const toScopeKey = (applicationSlug?: string, isPrivate = true) => `${applicationSlug ?? '__global__'}:${isPrivate ? 'private' : 'public'}`

export const useCalendarEventsStore = defineStore('calendar-events', () => {
  const calendarApi = useCalendarEventsApi()
  const cache = useState<Record<string, { items: CalendarEventRead[], cachedAt: number }>>('calendar-events-cache', () => ({}))
  const inFlight = useState<Record<string, Promise<CalendarEventRead[]>>>('calendar-events-inflight', () => ({}))

  const fetchList = async (applicationSlug?: string, isPrivate = true, force = false) => {
    const scope = toScopeKey(applicationSlug, isPrivate)
    const entry = cache.value[scope]

    if (!force && entry && Date.now() - entry.cachedAt < CACHE_TTL_MS) {
      return entry.items
    }

    if (inFlight.value[scope]) {
      return inFlight.value[scope]
    }

    inFlight.value[scope] = calendarApi.list(applicationSlug, isPrivate)
      .then((items) => {
        cache.value[scope] = {
          items,
          cachedAt: Date.now(),
        }
        return items
      })
      .finally(() => {
        delete inFlight.value[scope]
      })

    return inFlight.value[scope]
  }

  const invalidateCache = (applicationSlug?: string) => {
    const scope = toScopeKey(applicationSlug, true)
    delete cache.value[scope]
    delete inFlight.value[scope]
    clearNuxtData('calendar-events')
  }

  const create = async (payload: CreateCalendarEventPayload, applicationSlug?: string) => {
    const created = await calendarApi.create(payload, applicationSlug)
    invalidateCache(applicationSlug)
    return created
  }

  const patch = async (id: UUID, payload: PatchCalendarEventPayload, applicationSlug?: string) => {
    const updated = await calendarApi.patch(id, payload, applicationSlug)
    invalidateCache(applicationSlug)
    return updated
  }

  const cancel = async (id: UUID, applicationSlug?: string) => {
    const response = await calendarApi.cancel(id, applicationSlug)
    invalidateCache(applicationSlug)
    return response
  }

  const deleteEvent = async (id: UUID, applicationSlug?: string) => {
    await calendarApi.delete(id, applicationSlug)
    invalidateCache(applicationSlug)
  }

  return {
    cache,
    inFlight,
    fetchList,
    invalidateCache,
    create,
    patch,
    cancel,
    deleteEvent,
  }
})
