export interface NotificationFrom {
  firstName: string
  lastName: string
  photo: string | null
}

export interface NotificationRead {
  id: string
  title: string
  description: string
  type: string
  createdAt: string
  from: NotificationFrom | null
}
