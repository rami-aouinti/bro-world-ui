export type UUID = string

export interface CountResponse {
  count: number
}

export type IdsResponse = UUID[]

export interface PaginatedResponse<T> {
  count: number
  results: T[]
  next: string | null
  previous: string | null
}

export interface LoginPayload {
  username: string
  password: string
}

export interface TokenResponse {
  token: string
}
