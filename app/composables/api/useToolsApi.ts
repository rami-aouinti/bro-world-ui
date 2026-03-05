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
import type { CreateToolPayload, PatchToolPayload, Tool, UpdateToolPayload } from '~/types/api/tool'

export const useToolsApi = () => {
  const { apiFetch } = useApiClient()
  const basePath = '/api/v1/tools'

  return {
    list(query: ListQueryParams = {}, extraQuery: QueryParams = {}) {
      return apiFetch<PaginatedResponse<Tool>>(basePath, {
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
      return apiFetch<Tool>(`${basePath}/${id}`, { method: 'GET' })
    },
    create(payload: CreateToolPayload) {
      return apiFetch<Tool>(basePath, {
        method: 'POST',
        body: payload,
      })
    },
    update(id: UUID, payload: UpdateToolPayload) {
      return apiFetch<Tool>(`${basePath}/${id}`, {
        method: 'PUT',
        body: payload,
      })
    },
    patch(id: UUID, payload: PatchToolPayload) {
      return apiFetch<Tool>(`${basePath}/${id}`, {
        method: 'PATCH',
        body: payload,
      })
    },
    delete(id: UUID) {
      return apiFetch<void>(`${basePath}/${id}`, { method: 'DELETE' })
    },
  }
}
