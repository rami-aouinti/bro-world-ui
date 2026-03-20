import { defineStore } from 'pinia'
import { useQuizApi } from '~/composables/api/useQuizApi'
import type { QuizCategoryRead, QuizLeaderboardEntry, QuizLevelRead } from '~/types/api/quiz'

export const useQuizCatalogStore = defineStore('quiz-catalog', () => {
  const quizApi = useQuizApi()
  const categories = ref<QuizCategoryRead[]>([])
  const levels = ref<QuizLevelRead[]>([])
  const topLeaderboard = ref<QuizLeaderboardEntry[]>([])
  const isLoadingCategories = ref(false)
  const isLoadingLevels = ref(false)
  const isLoadingLeaderboard = ref(false)

  const fetchCategories = async (force = false) => {
    if (categories.value.length > 0 && !force) {
      return categories.value
    }

    isLoadingCategories.value = true

    try {
      const response = await quizApi.getGeneralQuizCategories()
      categories.value = response.items ?? []
      return categories.value
    }
    finally {
      isLoadingCategories.value = false
    }
  }

  const fetchLevels = async (force = false) => {
    if (levels.value.length > 0 && !force) {
      return levels.value
    }

    isLoadingLevels.value = true

    try {
      const response = await quizApi.getGeneralQuizLevels()
      levels.value = response.items ?? []
      return levels.value
    }
    finally {
      isLoadingLevels.value = false
    }
  }

  const preload = async (force = false) => {
    await Promise.all([
      fetchCategories(force),
      fetchLevels(force),
      fetchLeaderboardTop(3, force),
    ])
  }

  const fetchLeaderboardTop = async (limit = 3, force = false) => {
    if (topLeaderboard.value.length >= limit && !force) {
      return topLeaderboard.value.slice(0, limit)
    }

    isLoadingLeaderboard.value = true

    try {
      const response = await quizApi.getGeneralQuizLeaderboard()
      topLeaderboard.value = (response.items ?? []).slice(0, limit)
      return topLeaderboard.value
    }
    finally {
      isLoadingLeaderboard.value = false
    }
  }

  return {
    categories,
    levels,
    topLeaderboard,
    isLoadingCategories,
    isLoadingLevels,
    isLoadingLeaderboard,
    fetchCategories,
    fetchLevels,
    fetchLeaderboardTop,
    preload,
  }
})
