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
  ApiKey,
  CreateApiKeyPayload,
  PatchApiKeyPayload,
  UpdateApiKeyPayload,
} from '~/types/api/apiKey'

const createApiKeysVersionClient = (basePath: string) => {
  const { apiFetch } = useApiClient()

  return {
    list(query: ListQueryParams = {}, extraQuery: QueryParams = {}) {
      return apiFetch<PaginatedResponse<ApiKey>>(basePath, {
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
      return apiFetch<ApiKey>(`${basePath}/${id}`, { method: 'GET' })
    },
    create(payload: CreateApiKeyPayload) {
      return apiFetch<ApiKey>(basePath, {
        method: 'POST',
        body: payload,
      })
    },
    update(id: UUID, payload: UpdateApiKeyPayload) {
      return apiFetch<ApiKey>(`${basePath}/${id}`, {
        method: 'PUT',
        body: payload,
      })
    },
    patch(id: UUID, payload: PatchApiKeyPayload) {
      return apiFetch<ApiKey>(`${basePath}/${id}`, {
        method: 'PATCH',
        body: payload,
      })
    },
    delete(id: UUID) {
      return apiFetch<void>(`${basePath}/${id}`, { method: 'DELETE' })
    },
  }
}

export const useApiKeysApi = () => {
  return {
    v1: createApiKeysVersionClient('/api/v1/api-keys'),
    v2: createApiKeysVersionClient('/api/v2/api-keys'),
  }
}
