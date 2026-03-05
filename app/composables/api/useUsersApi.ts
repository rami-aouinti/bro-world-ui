import { buildListQuery } from './query'
import { useApiClient } from '../useApiClient'
import type {
  CountResponse,
  IdsResponse,
  ListQueryParams,
  PaginatedResponse,
  QueryParams,
  UUID,
} from '~/types/api/common'
import type { CreateUserPayload, PatchUserPayload, UpdateUserPayload, UserRead } from '~/types/api/user'

export const useUsersApi = () => {
  const { apiFetch } = useApiClient()
  const basePath = '/api/v1/users'

  return {
    list(query: ListQueryParams = {}, extraQuery: QueryParams = {}) {
      return apiFetch<PaginatedResponse<UserRead>>(basePath, {
        method: 'GET',
        query: buildListQuery(query, extraQuery),
      })
    },
    count(query: ListQueryParams = {}, extraQuery: QueryParams = {}) {
      return apiFetch<CountResponse>(`${basePath}/count`, {
        method: 'GET',
        query: buildListQuery(query, extraQuery),
      })
    },
    ids(query: ListQueryParams = {}, extraQuery: QueryParams = {}) {
      return apiFetch<IdsResponse>(`${basePath}/ids`, {
        method: 'GET',
        query: buildListQuery(query, extraQuery),
      })
    },
    getById(id: UUID) {
      return apiFetch<UserRead>(`${basePath}/${id}`, { method: 'GET' })
    },
    create(payload: CreateUserPayload) {
      return apiFetch<UserRead>(basePath, {
        method: 'POST',
        body: payload,
      })
    },
    update(id: UUID, payload: UpdateUserPayload) {
      return apiFetch<UserRead>(`${basePath}/${id}`, {
        method: 'PUT',
        body: payload,
      })
    },
    patch(id: UUID, payload: PatchUserPayload) {
      return apiFetch<UserRead>(`${basePath}/${id}`, {
        method: 'PATCH',
        body: payload,
      })
    },
    delete(id: UUID) {
      return apiFetch<void>(`${basePath}/${id}`, { method: 'DELETE' })
    },
  }
}
