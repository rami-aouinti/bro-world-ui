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
  CreatePlatformPayload,
  PatchPlatformPayload,
  PlatformRead,
  UpdatePlatformPayload,
} from '~/types/api/platform'

export const usePlatformsApi = () => {
  const { apiFetch } = useApiClient()
  const basePath = '/api/v1/platform'

  return {
    list(query: ListQueryParams = {}, extraQuery: QueryParams = {}) {
      return apiFetch<PaginatedResponse<PlatformRead> | PlatformRead[]>(basePath, {
        method: 'GET',
        query: buildListQuery(query, extraQuery),
      })
    },
    listPublic() {
      return apiFetch<PlatformRead[]>(`${basePath}/public`, {
        method: 'GET',
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
      return apiFetch<PlatformRead>(`${basePath}/${id}`, { method: 'GET' })
    },
    create(payload: CreatePlatformPayload) {
      return apiFetch<PlatformRead>(basePath, {
        method: 'POST',
        body: payload,
      })
    },
    update(id: UUID, payload: UpdatePlatformPayload) {
      return apiFetch<PlatformRead>(`${basePath}/${id}`, {
        method: 'PUT',
        body: payload,
      })
    },
    patch(id: UUID, payload: PatchPlatformPayload) {
      return apiFetch<PlatformRead>(`${basePath}/${id}`, {
        method: 'PATCH',
        body: payload,
      })
    },
    delete(id: UUID) {
      return apiFetch<void>(`${basePath}/${id}`, { method: 'DELETE' })
    },
  }
}
