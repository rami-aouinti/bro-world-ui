import { buildListQuery } from './query'
import { useApiClient } from '../useApiClient'
import type {
  CountResponse,
  IdsResponse,
  ListQueryParams,
  QueryParams,
  UUID,
} from '~/types/api/common'
import type {
  CreateUserPayload,
  PatchUserPayload,
  UpdateUserPayload,
  UserGroupsResponse,
  UserRead,
  UserRolesResponse,
} from '~/types/api/user'

export const useUsersApi = () => {
  const { apiFetch } = useApiClient()
  const basePath = '/api/v1/user'

  return {
    list(query: ListQueryParams = {}, extraQuery: QueryParams = {}) {
      return apiFetch<UserRead[]>(basePath, {
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
    getGroups(user: UUID) {
      return apiFetch<UserGroupsResponse>(`${basePath}/${user}/groups`, { method: 'GET' })
    },
    getRoles(user: UUID) {
      return apiFetch<UserRolesResponse>(`${basePath}/${user}/roles`, { method: 'GET' })
    },
    attachGroup(user: UUID, userGroup: UUID) {
      return apiFetch<void>(`${basePath}/${user}/group/${userGroup}`, { method: 'POST' })
    },
    detachGroup(user: UUID, userGroup: UUID) {
      return apiFetch<void>(`${basePath}/${user}/group/${userGroup}`, { method: 'DELETE' })
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
