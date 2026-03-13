import { useApiClient } from '../useApiClient'
import type { StoriesResponse, StoryMutationAcceptedResponse } from '~/types/api/story'

export const useStoriesApi = () => {
  const { apiFetch } = useApiClient()
  const basePath = '/api/v1/private/stories'

  return {
    getStories() {
      return apiFetch<StoriesResponse>(basePath, {
        method: 'GET',
      })
    },
    createStory(payload: { imageUrl: string }) {
      return apiFetch<StoryMutationAcceptedResponse>(basePath, {
        method: 'POST',
        body: payload,
      })
    },
    deleteStory(storyId: string) {
      return apiFetch(`${basePath}/${storyId}`, {
        method: 'DELETE',
      })
    },
  }
}
