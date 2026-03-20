import { useApiClient } from '../useApiClient'
import type { CreateQuizQuestionPayload, QuizRead, QuizStatsRead } from '~/types/api/quiz'

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
    publishGeneralQuiz() {
      return apiFetch<{ status: string }>(`/api/v1/quiz/general/publish`, { method: 'PATCH' })
    },
    unpublishGeneralQuiz() {
      return apiFetch<{ status: string }>(`/api/v1/quiz/general/unpublish`, { method: 'PATCH' })
    },
  }
}
