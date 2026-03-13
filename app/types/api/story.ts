import type { UUID } from './common'

export interface StoryUser {
  id: UUID
  username: string
  photo: string | null
}

export interface StoryItem {
  id: UUID
  imageUrl: string
  createdAt: string
  expiresAt: string
}

export interface StoryGroup {
  owner: boolean
  user: StoryUser
  stories: StoryItem[]
}

export interface StoriesResponse {
  stories: StoryGroup[]
}

export interface StoryMutationAcceptedResponse {
  id?: UUID
}
