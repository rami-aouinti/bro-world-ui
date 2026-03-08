import type { UUID } from './common'

export interface BlogReaction {
  id: UUID
  authorId: UUID
  type: string
}

export interface BlogComment {
  id: UUID
  authorId: UUID
  content: string
  filePath: string | null
  reactions: BlogReaction[]
  children: BlogComment[]
}

export interface BlogPost {
  id: UUID
  authorId: UUID
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
