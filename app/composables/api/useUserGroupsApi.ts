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
import type {
  CreateUserGroupPayload,
  PatchUserGroupPayload,
  UpdateUserGroupPayload,
  UserGroup,
} from '~/types/api/userGroup'

export const useUserGroupsApi = () => {
  const { apiFetch } = useApiClient()
  const basePath = '/api/v1/user-groups'

  return {
    list(query: ListQueryParams = {}, extraQuery: QueryParams = {}) {
      return apiFetch<PaginatedResponse<UserGroup>>(basePath, {
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
      return apiFetch<UserGroup>(`${basePath}/${id}`, { method: 'GET' })
    },
    create(payload: CreateUserGroupPayload) {
      return apiFetch<UserGroup>(basePath, {
        method: 'POST',
        body: payload,
      })
    },
    update(id: UUID, payload: UpdateUserGroupPayload) {
      return apiFetch<UserGroup>(`${basePath}/${id}`, {
        method: 'PUT',
        body: payload,
      })
    },
    patch(id: UUID, payload: PatchUserGroupPayload) {
      return apiFetch<UserGroup>(`${basePath}/${id}`, {
        method: 'PATCH',
        body: payload,
      })
    },
    delete(id: UUID) {
      return apiFetch<void>(`${basePath}/${id}`, { method: 'DELETE' })
    },
  }
}
