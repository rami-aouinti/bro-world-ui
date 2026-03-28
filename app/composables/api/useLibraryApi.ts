import { useApiClient } from '../useApiClient'
import type {
  CreateLibraryFolderPayload,
  CreateLibraryFolderResponse,
  LibraryTreeResponse,
  UploadLibraryFileResponse,
} from '~/types/api/library'

export const useLibraryApi = () => {
  const { apiFetch } = useApiClient()

  return {
    getTree() {
      return apiFetch<LibraryTreeResponse>('/api/v1/library/tree', { method: 'GET' })
    },
    createFolder(payload: CreateLibraryFolderPayload) {
      return apiFetch<CreateLibraryFolderResponse>('/api/v1/library/folders', {
        method: 'POST',
        body: payload,
      })
    },
    uploadFile(file: File, folderId?: string) {
      const formData = new FormData()
      formData.append('file', file)

      if (folderId) {
        formData.append('folderId', folderId)
      }

      return apiFetch<UploadLibraryFileResponse>('/api/v1/library/files/upload', {
        method: 'POST',
        body: formData,
      })
    },
  }
}
