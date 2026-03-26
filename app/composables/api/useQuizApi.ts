import { useApiClient } from '../useApiClient'
import type {
  CreateQuizQuestionPayload,
  QuizCategoryRead,
  QuizLeaderboardEntry,
  QuizLevelRead,
  QuizRead,
  QuizStatsRead,
  SubmitQuizPayload,
  SubmitQuizResult,
} from '~/types/api/quiz'

export const useQuizApi = () => {
  const { apiFetch } = useApiClient()

  const buildGeneralQuizUrl = (isPrivate: boolean, filters?: { level?: string | null, category?: string | null }) => {
    const scope = isPrivate ? 'private' : 'public'
    const params = new URLSearchParams()

    if (filters?.level) {
      params.set('level', filters.level)
    }

    if (filters?.category) {
      params.set('category', filters.category)
    }

    const query = params.toString()
    return query ? `/api/v1/${scope}/quiz/general?${query}` : `/api/v1/${scope}/quiz/general`
  }

  return {
    getApplicationQuiz(applicationSlug: string, options?: { signal?: AbortSignal }) {
      return apiFetch<QuizRead>(`/api/v1/quiz/applications/${applicationSlug}`, {
        method: 'GET',
        signal: options?.signal,
      })
    },
    getApplicationQuizStats(applicationSlug: string, options?: { signal?: AbortSignal }) {
      return apiFetch<QuizStatsRead>(`/api/v1/quiz/applications/${applicationSlug}/stats`, {
        method: 'GET',
        signal: options?.signal,
      })
    },
    createApplicationQuizQuestion(applicationSlug: string, payload: CreateQuizQuestionPayload) {
      return apiFetch<{ status: string }>(`/api/v1/quiz/applications/${applicationSlug}/questions`, {
        method: 'POST',
        body: payload,
      })
    },
    getGeneralQuiz(isPrivate: boolean, filters?: { level?: string | null, category?: string | null }) {
      return apiFetch<QuizRead>(buildGeneralQuizUrl(isPrivate, filters), { method: 'GET' })
    },
    getGeneralQuizCategories() {
      return apiFetch<{ items: QuizCategoryRead[] }>(`/api/v1/public/quiz/general/categories`, {
        method: 'GET',
        skipAuthHeader: true,
      })
    },
    getGeneralQuizLevels() {
      return apiFetch<{ items: QuizLevelRead[] }>(`/api/v1/public/quiz/general/levels`, {
        method: 'GET',
        skipAuthHeader: true,
      })
    },
    getGeneralQuizLeaderboard() {
      return apiFetch<{ items: QuizLeaderboardEntry[] }>(`/api/v1/public/quiz/general/leaderboard`, { method: 'GET' })
    },
    submitGeneralQuiz(payload: SubmitQuizPayload) {
      return apiFetch<SubmitQuizResult>(`/api/v1/quiz/general/submit`, {
        method: 'POST',
        body: payload,
      })
    },
  }
}
