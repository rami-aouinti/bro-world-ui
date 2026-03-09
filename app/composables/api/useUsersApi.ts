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
  UserMePasswordPayload,
  UserMeProfilePayload,
  UserMeRead,
  UserRead,
  UserRolesResponse,
} from '~/types/api/user'

export const useUsersApi = () => {
  const { apiFetch } = useApiClient()
  const basePath = '/api/v1/user'

  return {

    getMe() {
      return apiFetch<UserMeRead>('/api/v1/users/me', { method: 'GET' })
    },
    updateMyPassword(payload: UserMePasswordPayload) {
      return apiFetch<void>('/api/v1/users/me/password', {
        method: 'PATCH',
        body: payload,
      })
    },
    updateMyProfile(payload: UserMeProfilePayload) {
      return apiFetch<UserMeRead>('/api/v1/users/me/profile', {
        method: 'PATCH',
        body: payload,
      })
    },
    uploadMyPhoto(photo: File) {
      const formData = new FormData()
      formData.append('photo', photo)

      return apiFetch<{ photo: string }>('/api/v1/profile/photo', {
        method: 'POST',
        body: formData,
      })
    },
    deleteMe() {
      return apiFetch<void>('/api/v1/users/me', { method: 'DELETE' })
    },
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
