import { buildListQuery } from './query'
import { useApiClient } from '../useApiClient'
import type { ListQueryParams, QueryParams } from '~/types/api/common'
import type {
  CreateApplicationPayload,
  CreateApplicationResponse,
  PatchProfilePayload,
  Profile,
  UpdateProfilePayload,
  UploadApplicationPhotoResponse,
  UploadProfilePhotoResponse,
} from '~/types/api/profile'

const IMAGE_MIME_TYPES_BY_EXTENSION: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  gif: 'image/gif',
  webp: 'image/webp',
  bmp: 'image/bmp',
  svg: 'image/svg+xml',
  avif: 'image/avif',
  heic: 'image/heic',
  heif: 'image/heif',
}

const withImageMimeType = (photo: File) => {
  if (photo.type.startsWith('image/')) {
    return photo
  }

  const extension = photo.name.split('.').pop()?.toLowerCase()
  const mimeType = extension ? IMAGE_MIME_TYPES_BY_EXTENSION[extension] : undefined

  if (!mimeType) {
    return photo
  }

  return new File([photo], photo.name, {
    type: mimeType,
    lastModified: photo.lastModified,
  })
}

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
      formData.append('photo', withImageMimeType(photo))

      return apiFetch<UploadProfilePhotoResponse>(`${basePath}/photo`, {
        method: 'POST',
        body: formData,
      })
    },
    createApplication(payload: CreateApplicationPayload) {
      return apiFetch<CreateApplicationResponse>('/api/v1/profile/applications', {
        method: 'POST',
        body: payload,
      })
    },
    uploadApplicationPhoto(applicationId: string, photo: File) {
      const formData = new FormData()
      formData.append('photo', withImageMimeType(photo))

      return apiFetch<UploadApplicationPhotoResponse>(`${basePath}/applications/${applicationId}/photo`, {
        method: 'POST',
        body: formData,
      })
    },
  }
}
