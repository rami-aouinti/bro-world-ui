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

export interface RegisterPayload {
  email: string
  password: string
  repeatPassword: string
}

export interface ListQueryParams {
  limit?: number
  offset?: number
  page?: number
  pageSize?: number
  search?: string
  ordering?: string
}

export type QueryValue = string | number | boolean | null | undefined

export type QueryParams = Record<string, QueryValue>


export interface ListResponse<T> {
  items: T[]
}
