import { useApiClient } from '../useApiClient'
import type {
  CalendarEventCancelResponse,
  CalendarEventMutationResponse,
  CalendarEventRead,
  CreateCalendarEventPayload,
  PatchCalendarEventPayload,
} from '~/types/api/calendar'
import type { UUID } from '~/types/api/common'

export const useCalendarEventsApi = () => {
  const { apiFetch } = useApiClient()
  const basePath = '/api/v1/calendar/private/events'

  return {
    list() {
      return apiFetch<CalendarEventRead[]>(basePath, { method: 'GET' })
    },
    create(payload: CreateCalendarEventPayload) {
      return apiFetch<CalendarEventMutationResponse>(basePath, {
        method: 'POST',
        body: payload,
      })
    },
    patch(id: UUID, payload: PatchCalendarEventPayload) {
      return apiFetch<CalendarEventMutationResponse>(`${basePath}/${id}`, {
        method: 'PATCH',
        body: payload,
      })
    },
    delete(id: UUID) {
      return apiFetch<void>(`${basePath}/${id}`, { method: 'DELETE' })
    },
    cancel(id: UUID) {
      return apiFetch<CalendarEventCancelResponse>(`${basePath}/${id}/cancel`, {
        method: 'POST',
      })
    },
  }
}
