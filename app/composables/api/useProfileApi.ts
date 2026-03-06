import { buildListQuery } from './query'
import { useApiClient } from '../useApiClient'
import type { ListQueryParams, QueryParams } from '~/types/api/common'
import type {
  CreateApplicationPayload,
  PatchProfilePayload,
  Profile,
  UpdateProfilePayload,
  UploadProfilePhotoResponse,
} from '~/types/api/profile'

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
    uploadPhoto(photo: File) {
      const formData = new FormData()
      formData.append('photo', photo)

      return apiFetch<UploadProfilePhotoResponse>(`${basePath}/photo`, {
        method: 'POST',
        body: formData,
      })
    },
    createApplication(payload: CreateApplicationPayload) {
      return apiFetch('/api/v1/profile/applications', {
        method: 'POST',
        body: payload,
      })
    },
  }
}
