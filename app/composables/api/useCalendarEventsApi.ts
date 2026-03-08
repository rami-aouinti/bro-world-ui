import { useApiClient } from '../useApiClient'
import type {
  CalendarEventCancelResponse,
  CalendarEventMutationResponse,
  CalendarEventRead,
  CreateCalendarEventPayload,
  PatchCalendarEventPayload,
} from '~/types/api/calendar'
import type { UUID } from '~/types/api/common'

type CalendarEventsListResponse =
  | CalendarEventRead[]
  | {
    data?: CalendarEventRead[]
    items?: CalendarEventRead[]
    events?: CalendarEventRead[]
    'hydra:member'?: CalendarEventRead[]
  }

export const useCalendarEventsApi = () => {
  const { apiFetch } = useApiClient()

  const resolvePath = (applicationSlug?: string, isPrivate = true) => {
    if (!applicationSlug) {
      return '/api/v1/calendar/private/events'
    }

    return isPrivate
      ? `/api/v1/calendar/private/applications/${applicationSlug}/events`
      : `/api/v1/calendar/applications/${applicationSlug}/events`
  }

  return {
    list(applicationSlug?: string, isPrivate = true) {
      return apiFetch<CalendarEventsListResponse>(resolvePath(applicationSlug, isPrivate), { method: 'GET' })
        .then((response) => {
          if (Array.isArray(response)) return response
          if (Array.isArray(response.data)) return response.data
          if (Array.isArray(response.items)) return response.items
          if (Array.isArray(response.events)) return response.events
          if (Array.isArray(response['hydra:member'])) return response['hydra:member']
          return []
        })
    },
    create(payload: CreateCalendarEventPayload, applicationSlug?: string) {
      return apiFetch<CalendarEventMutationResponse>(resolvePath(applicationSlug, true), {
        method: 'POST',
        body: payload,
      })
    },
    patch(id: UUID, payload: PatchCalendarEventPayload, applicationSlug?: string) {
      return apiFetch<CalendarEventMutationResponse>(`${resolvePath(applicationSlug, true)}/${id}`, {
        method: 'PATCH',
        body: payload,
      })
    },
    delete(id: UUID, applicationSlug?: string) {
      return apiFetch<void>(`${resolvePath(applicationSlug, true)}/${id}`, { method: 'DELETE' })
    },
    cancel(id: UUID, applicationSlug?: string) {
      return apiFetch<CalendarEventCancelResponse>(`${resolvePath(applicationSlug, true)}/${id}/cancel`, {
        method: 'POST',
      })
    },
  }
}
