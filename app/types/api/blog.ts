import type { UUID } from './common'

export interface BlogReaction {
  id: UUID
  authorId: UUID
  isAuthor: boolean
  author?: BlogAuthor
  type: string
  createdAt?: string
}

export interface BlogAuthor {
  id?: UUID
  firstName: string
  lastName: string
  username?: string
  photo: string | null
}

export interface BlogPostChildrenSummary {
  count: number
  authors: BlogAuthor[]
}

export interface BlogComment {
  id: UUID
  authorId: UUID
  isAuthor: boolean
  author?: BlogAuthor
  content: string
  filePath: string | null
  createdAt?: string
  reactions: BlogReaction[]
  children: BlogComment[]
}

export interface BlogPost {
  id: UUID
  slug?: string
  authorId: UUID
  isAuthor: boolean
  author?: BlogAuthor
  title?: string
  content: string | null
  sharedUrl?: string | null
  mediaUrls?: string[]
  parent?: BlogPost | null
  filePath: string | null
  createdAt?: string
  reactions?: BlogReaction[]
  comments: BlogComment[]
  children?: BlogPostChildrenSummary
}

export interface BlogRead {
  id: UUID
  slug?: string
  description?: string
  title: string
  visibility?: 'public' | 'private' | string
  type: 'general' | 'application' | string
  postStatus: string
  commentStatus: string
  applicationSlug: string | null
  posts: BlogPost[]
}

export interface BlogPagination {
  page: number
  limit: number
  totalItems: number
  totalPages: number
}

export interface BlogWithPagination extends BlogRead {
  pagination?: BlogPagination
}

export interface BlogMutationAcceptedResponse {
  status: 'accepted'
  id?: UUID
}
