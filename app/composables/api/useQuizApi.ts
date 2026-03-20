import { useApiClient } from '../useApiClient'
import type {
  CreateQuizQuestionPayload,
  QuizCategoryRead,
  QuizLevelRead,
  QuizRead,
  QuizStatsRead,
  SubmitQuizPayload,
  SubmitQuizResult,
} from '~/types/api/quiz'

export const useQuizApi = () => {
  const { apiFetch } = useApiClient()

  return {
    getApplicationQuiz(applicationSlug: string) {
      return apiFetch<QuizRead>(`/api/v1/quiz/applications/${applicationSlug}`, { method: 'GET' })
    },
    getApplicationQuizStats(applicationSlug: string) {
      return apiFetch<QuizStatsRead>(`/api/v1/quiz/applications/${applicationSlug}/stats`, { method: 'GET' })
    },
    createApplicationQuizQuestion(applicationSlug: string, payload: CreateQuizQuestionPayload) {
      return apiFetch<{ status: string }>(`/api/v1/quiz/applications/${applicationSlug}/questions`, {
        method: 'POST',
        body: payload,
      })
    },
    getGeneralQuiz(isPrivate: boolean) {
      const scope = isPrivate ? 'private' : 'public'
      return apiFetch<QuizRead>(`/api/v1/${scope}/quiz/general`, { method: 'GET' })
    },
    getGeneralQuizCategories() {
      return apiFetch<{ items: QuizCategoryRead[] }>(`/api/v1/public/quiz/general/categories`, { method: 'GET' })
    },
    getGeneralQuizLevels() {
      return apiFetch<{ items: QuizLevelRead[] }>(`/api/v1/public/quiz/general/levels`, { method: 'GET' })
    },
    submitGeneralQuiz(payload: SubmitQuizPayload) {
      return apiFetch<SubmitQuizResult>(`/api/v1/quiz/general/submit`, {
        method: 'POST',
        body: payload,
      })
    },
  }
}
