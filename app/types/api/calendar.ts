import type { UUID } from './common'

export type EventStatus = 'tentative' | 'confirmed' | 'cancelled'

export interface CalendarEventReminder {
  method: string
  minutesBefore: number
}

export interface CalendarEventAttendee {
  name: string
  email: string
}

export interface CalendarEventRead {
  id: UUID
  title: string
  description: string
  startAt: string
  endAt: string
  status: EventStatus
  visibility: string
  location: string | null
  isAllDay: boolean
  timezone: string | null
  isCancelled: boolean
  attendees: CalendarEventAttendee[] | null
  reminders: CalendarEventReminder[] | null
  calendarId: UUID | null
  applicationSlug: string | null
  userId: UUID
}

export interface CreateCalendarEventPayload {
  title: string
  description?: string
  startAt: string
  endAt: string
  status?: EventStatus
  location?: string
}

export interface PatchCalendarEventPayload {
  title?: string
  description?: string
  startAt?: string
  endAt?: string
  location?: string
}

export interface CalendarEventMutationResponse {
  id: UUID
}

export interface CalendarEventCancelResponse extends CalendarEventMutationResponse {
  status: EventStatus
  isCancelled: boolean
}

export interface GoogleCalendarSyncPayload {
  accessToken: string
  calendarId?: string
}

export interface GoogleCalendarSyncResponse {
  pulledFromGoogle: number
  pushedToGoogle: number
}
