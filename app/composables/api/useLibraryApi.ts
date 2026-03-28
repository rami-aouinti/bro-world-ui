import { useApiClient } from '../useApiClient'
import type {
  CreateLibraryFolderPayload,
  CreateLibraryFolderResponse,
  LibraryTreeResponse,
  PatchLibraryFilePayload,
  PatchLibraryFolderPayload,
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
    patchFolder(folderId: string, payload: PatchLibraryFolderPayload) {
      return apiFetch<CreateLibraryFolderResponse>(`/api/v1/library/folders/${encodeURIComponent(folderId)}`, {
        method: 'PATCH',
        body: payload,
      })
    },
    deleteFolder(folderId: string) {
      return apiFetch<void>(`/api/v1/library/folders/${encodeURIComponent(folderId)}`, {
        method: 'DELETE',
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
    patchFile(fileId: string, payload: PatchLibraryFilePayload) {
      return apiFetch<UploadLibraryFileResponse>(`/api/v1/library/files/${encodeURIComponent(fileId)}`, {
        method: 'PATCH',
        body: payload,
      })
    },
    deleteFile(fileId: string) {
      return apiFetch<void>(`/api/v1/library/files/${encodeURIComponent(fileId)}`, {
        method: 'DELETE',
      })
    },
  }
}
