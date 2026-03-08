import { useApiClient } from '../useApiClient'
import type { QuizRead } from '~/types/api/quiz'

export const useQuizApi = () => {
  const { apiFetch } = useApiClient()

  return {
    getApplicationQuiz(applicationSlug: string) {
      return apiFetch<QuizRead>(`/api/v1/quiz/application/${applicationSlug}`, { method: 'GET' })
    },
  }
}
