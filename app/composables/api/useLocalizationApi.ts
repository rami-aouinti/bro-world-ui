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
  CreateLocalizationPayload,
  Localization,
  PatchLocalizationPayload,
  UpdateLocalizationPayload,
} from '~/types/api/localization'

export const useLocalizationApi = () => {
  const { apiFetch } = useApiClient()
  const basePath = '/api/v1/localization'

  return {
    list(query: ListQueryParams = {}, extraQuery: QueryParams = {}) {
      return apiFetch<PaginatedResponse<Localization>>(basePath, {
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
      return apiFetch<Localization>(`${basePath}/${id}`, { method: 'GET' })
    },
    create(payload: CreateLocalizationPayload) {
      return apiFetch<Localization>(basePath, {
        method: 'POST',
        body: payload,
      })
    },
    update(id: UUID, payload: UpdateLocalizationPayload) {
      return apiFetch<Localization>(`${basePath}/${id}`, {
        method: 'PUT',
        body: payload,
      })
    },
    patch(id: UUID, payload: PatchLocalizationPayload) {
      return apiFetch<Localization>(`${basePath}/${id}`, {
        method: 'PATCH',
        body: payload,
      })
    },
    delete(id: UUID) {
      return apiFetch<void>(`${basePath}/${id}`, { method: 'DELETE' })
    },
  }
}
