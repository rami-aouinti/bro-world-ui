import type { UUID } from './common'

export interface BlogReaction {
  id: UUID
  authorId: UUID
  isAuthor: boolean
  author?: BlogAuthor
  type: string
}

export interface BlogAuthor {
  firstName: string
  lastName: string
  photo: string | null
}

export interface BlogComment {
  id: UUID
  authorId: UUID
  isAuthor: boolean
  author?: BlogAuthor
  content: string
  filePath: string | null
  reactions: BlogReaction[]
  children: BlogComment[]
}

export interface BlogPost {
  id: UUID
  authorId: UUID
  isAuthor: boolean
  author?: BlogAuthor
  content: string
  filePath: string | null
  comments: BlogComment[]
}

export interface BlogRead {
  id: UUID
  title: string
  type: 'general' | 'application' | string
  postStatus: string
  commentStatus: string
  applicationSlug: string | null
  posts: BlogPost[]
}
