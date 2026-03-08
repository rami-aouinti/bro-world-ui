import type { UUID } from './common'

export interface QuizAnswer {
  id: UUID
  label: string
  correct: boolean
}

export interface QuizQuestion {
  id: UUID
  title: string
  level: string
  category: string
  answers: QuizAnswer[]
}

export interface QuizRead {
  id: UUID
  applicationSlug: string
  configuration: {
    shuffleQuestions: boolean
    timerSec: number
  }
  questions: QuizQuestion[]
}
