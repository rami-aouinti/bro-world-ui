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
  UserFriendRead,
  UserMeRead,
  UserRead,
  UserRolesResponse,
  UserApplication,
} from '~/types/api/user'

export const useUsersApi = () => {
  const { apiFetch } = useApiClient()
  const basePath = '/api/v1/user'

  const normalizeFriendListResponse = (response: unknown): UserFriendRead[] => {
    if (Array.isArray(response)) return response as UserFriendRead[]
    if (!response || typeof response !== 'object') return []

    const payload = response as Record<string, unknown>
    const candidates = [
      payload.data,
      payload.items,
      payload.results,
      payload.users,
      payload['hydra:member'],
    ]

    const list = candidates.find(Array.isArray)
    return (list ?? []) as UserFriendRead[]
  }

  return {

    getMe() {
      return apiFetch<UserMeRead>('/api/v1/users/me', { method: 'GET' })
    },
    listMyApplications() {
      return apiFetch<UserApplication[]>('/api/v1/users/me/applications', { method: 'GET' })
    },
    listMyLatestApplications() {
      return apiFetch<UserApplication[]>('/api/v1/users/me/applications/latest', { method: 'GET' })
    },
    async getByUsername(username: string) {
      const users = await apiFetch<UserRead[]>(basePath, {
        method: 'GET',
        query: buildListQuery({}, { username }),
      })

      return users.find(user => user.username.toLowerCase() === username.trim().toLowerCase()) ?? null
    },

    async listMyFriends() {
      const response = await apiFetch<unknown>('/api/v1/users/me/friends', { method: 'GET' })
      return normalizeFriendListResponse(response)
    },
    async listMyFriendRequests() {
      const response = await apiFetch<unknown>('/api/v1/users/me/friends/requests', { method: 'GET' })
      return normalizeFriendListResponse(response)
    },
    async listMySentFriendRequests() {
      const response = await apiFetch<unknown>('/api/v1/users/me/friends/requests/sent', { method: 'GET' })
      return normalizeFriendListResponse(response)
    },
    async listMyBlockedUsers() {
      const response = await apiFetch<unknown>('/api/v1/users/me/friends/blocked', { method: 'GET' })
      return normalizeFriendListResponse(response)
    },
    sendFriendRequest(userId: UUID) {
      return apiFetch<void>(`/api/v1/users/${encodeURIComponent(userId)}/friends/request`, { method: 'POST' })
    },
    cancelSentFriendRequest(userId: UUID) {
      return apiFetch<void>(`/api/v1/users/${encodeURIComponent(userId)}/friends/cancel`, { method: 'POST' })
    },
    acceptFriendRequest(userId: UUID) {
      return apiFetch<void>(`/api/v1/users/${encodeURIComponent(userId)}/friends/accept`, { method: 'POST' })
    },
    rejectFriendRequest(userId: UUID) {
      return apiFetch<void>(`/api/v1/users/${encodeURIComponent(userId)}/friends/reject`, { method: 'POST' })
    },
    blockUser(userId: UUID) {
      return apiFetch<void>(`/api/v1/users/${encodeURIComponent(userId)}/block`, { method: 'POST' })
    },
    unblockUser(userId: UUID) {
      return apiFetch<void>(`/api/v1/users/${encodeURIComponent(userId)}/block`, { method: 'DELETE' })
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
