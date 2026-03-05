import { buildListQuery } from './query'
import { useApiClient } from '../useApiClient'
import type { ListQueryParams, QueryParams } from '~/types/api/common'
import type { PatchProfilePayload, Profile, UpdateProfilePayload } from '~/types/api/profile'

export const useProfileApi = () => {
  const { apiFetch } = useApiClient()
  const basePath = '/api/v1/profile'

  return {
    get() {
      return apiFetch<Profile>(basePath, { method: 'GET' })
    },
    list(query: ListQueryParams = {}, extraQuery: QueryParams = {}) {
      return apiFetch<Profile[]>(`${basePath}/list`, {
        method: 'GET',
        query: buildListQuery(query, extraQuery),
      })
    },
    update(payload: UpdateProfilePayload) {
      return apiFetch<Profile>(basePath, {
        method: 'PUT',
        body: payload,
      })
    },
    patch(payload: PatchProfilePayload) {
      return apiFetch<Profile>(basePath, {
        method: 'PATCH',
        body: payload,
      })
    },
  }
}
