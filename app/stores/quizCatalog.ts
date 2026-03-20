import { defineStore } from 'pinia'
import { useQuizApi } from '~/composables/api/useQuizApi'
import type { QuizCategoryRead, QuizLevelRead } from '~/types/api/quiz'

export const useQuizCatalogStore = defineStore('quiz-catalog', () => {
  const quizApi = useQuizApi()
  const categories = ref<QuizCategoryRead[]>([])
  const levels = ref<QuizLevelRead[]>([])
  const isLoadingCategories = ref(false)
  const isLoadingLevels = ref(false)

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
    ])
  }

  return {
    categories,
    levels,
    isLoadingCategories,
    isLoadingLevels,
    fetchCategories,
    fetchLevels,
    preload,
  }
})
