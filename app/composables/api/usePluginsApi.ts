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
  CreatePluginPayload,
  PatchPluginPayload,
  PluginRead,
  UpdatePluginPayload,
} from '~/types/api/plugin'

export const usePluginsApi = () => {
  const { apiFetch } = useApiClient()
  const basePath = '/api/v1/plugin'

  return {
    list(query: ListQueryParams = {}, extraQuery: QueryParams = {}) {
      return apiFetch<PaginatedResponse<PluginRead> | PluginRead[]>(basePath, {
        method: 'GET',
        query: buildListQuery(query, extraQuery),
      })
    },
    listPublic() {
      return apiFetch<PluginRead[]>(`${basePath}/public`, {
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
      return apiFetch<PluginRead>(`${basePath}/${id}`, { method: 'GET' })
    },
    create(payload: CreatePluginPayload) {
      return apiFetch<PluginRead>(basePath, {
        method: 'POST',
        body: payload,
      })
    },
    update(id: UUID, payload: UpdatePluginPayload) {
      return apiFetch<PluginRead>(`${basePath}/${id}`, {
        method: 'PUT',
        body: payload,
      })
    },
    patch(id: UUID, payload: PatchPluginPayload) {
      return apiFetch<PluginRead>(`${basePath}/${id}`, {
        method: 'PATCH',
        body: payload,
      })
    },
    delete(id: UUID) {
      return apiFetch<void>(`${basePath}/${id}`, { method: 'DELETE' })
    },
  }
}
