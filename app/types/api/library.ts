export type LibraryNodeType = 'folder' | 'file'

interface LibraryNodeBase {
  id: string
  name: string
  type: LibraryNodeType
}

export interface LibraryFileNode extends LibraryNodeBase {
  type: 'file'
  fileType?: string
  mimeType?: string
  size?: number
  extension?: string
  url?: string
}

export interface LibraryFolderNode extends LibraryNodeBase {
  type: 'folder'
  children: LibraryTreeNode[]
}

export type LibraryTreeNode = LibraryFolderNode | LibraryFileNode

export interface LibraryTreeResponse {
  children: LibraryTreeNode[]
}

export interface CreateLibraryFolderPayload {
  name: string
  parentId?: string
}

export interface CreateLibraryFolderResponse {
  id: string
  name: string
  parentId?: string
}

export interface UploadLibraryFileResponse {
  id: string
  folderId?: string
  name: string
  url: string
  mimeType?: string
  size?: number
  extension?: string
  fileType?: string
}
