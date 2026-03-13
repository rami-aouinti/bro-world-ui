import { defineStore } from 'pinia'
import { useStoriesApi } from '~/composables/api/useStoriesApi'
import type { StoryGroup } from '~/types/api/story'

const STORIES_TTL_MS = 60_000

export const useStoriesStore = defineStore('stories', () => {
  const storiesApi = useStoriesApi()

  const stories = ref<StoryGroup[]>([])
  const cachedAt = ref(0)
  const loading = ref(false)
  const actionLoading = ref(false)

  const isCacheFresh = computed(() => Date.now() - cachedAt.value < STORIES_TTL_MS)

  const fetchStories = async (force = false) => {
    if (!force && isCacheFresh.value && stories.value.length) {
      return stories.value
    }

    loading.value = true
    try {
      const response = await storiesApi.getStories()
      stories.value = response.stories ?? []
      cachedAt.value = Date.now()
      return stories.value
    }
    finally {
      loading.value = false
    }
  }

  const invalidateCache = () => {
    cachedAt.value = 0
  }

  const createStory = async (imageUrl: string) => {
    actionLoading.value = true
    try {
      await storiesApi.createStory({ imageUrl })
      invalidateCache()
      await fetchStories(true)
    }
    finally {
      actionLoading.value = false
    }
  }

  const deleteStory = async (storyId: string) => {
    actionLoading.value = true
    try {
      await storiesApi.deleteStory(storyId)
      stories.value = stories.value
        .map(group => ({
          ...group,
          stories: group.stories.filter(story => story.id !== storyId),
        }))
        .filter(group => group.stories.length)
      invalidateCache()
    }
    finally {
      actionLoading.value = false
    }
  }

  return {
    stories,
    loading,
    actionLoading,
    fetchStories,
    createStory,
    deleteStory,
    invalidateCache,
  }
})
