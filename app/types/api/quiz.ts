import type { UUID } from './common'

export interface QuizAnswer {
  id: UUID
  label: string
  correct?: boolean
  position?: number
}

export interface QuizQuestion {
  id: UUID
  title: string
  level: string
  category: string
  points?: number
  explanation?: string | null
  position?: number
  answers: QuizAnswer[]
}

export interface QuizRead {
  id: UUID
  title: string
  description: string | null
  passScore: number
  isPublished: boolean
  applicationSlug: string
  configuration: {
    shuffleQuestions: boolean
    timerSec: number
    showInstantCorrection?: boolean
  } | null
  questions: QuizQuestion[]
}

export interface QuizStatsRead {
  questionCount: number
  answerCount: number
  averageAnswersPerQuestion: number
  totalPoints: number
}

export interface QuizCategoryRead {
  slug: string
  name: string
  position: number
  color: string
}

export interface QuizLevelRead {
  value: string
  color: string
}

export interface SubmitQuizPayload {
  answers: Array<{
    questionId: UUID
    answerId: UUID
  }>
}

export interface SubmitQuizResultItem {
  questionId: UUID
  selectedAnswerId: UUID | null
  isCorrect: boolean
  correctAnswerIds: UUID[]
  points: number
  earnedPoints: number
}

export interface SubmitQuizResult {
  attemptId: UUID
  quizId: UUID
  applicationSlug: string
  passScore: number
  score: number
  passed: boolean
  totalQuestions: number
  answeredQuestions: number
  correctAnswers: number
  totalPoints: number
  earnedPoints: number
  results: SubmitQuizResultItem[]
}

export interface CreateQuizQuestionPayload {
  title: string
  level?: string
  category?: string
  answers: Array<{
    label: string
    correct: boolean
  }>
  points?: number
  explanation?: string | null
  configuration?: Record<string, unknown> | null
}
