<script setup lang="ts">
import type { QuizQuestion, SubmitQuizResult } from '~/types/api/quiz'
import { useQuizApi } from '~/composables/api/useQuizApi'

definePageMeta({
  public: true,
  requiresAuth: false,
  layout: false,
  skeleton: 'card-grid',
})

const { isAuthenticated } = useAuth()
const quizApi = useQuizApi()

const selectedAnswers = ref<Record<string, string>>({})
const currentQuestionIndex = ref(0)
const currentTimer = ref(0)
const isFinished = ref(false)
const hasStarted = ref(false)
const isSubmitting = ref(false)
const submitError = ref('')
const submitResult = ref<SubmitQuizResult | null>(null)
let timerInterval: ReturnType<typeof setInterval> | null = null

const { data: quiz, pending, error, execute: loadQuiz } = useAsyncData(
  'general-quiz',
  () => quizApi.getGeneralQuiz(isAuthenticated.value),
  {
    watch: [isAuthenticated],
    server: false,
    immediate: false,
  },
)

const { data: categoriesResponse } = useAsyncData(
  'general-quiz-categories',
  () => quizApi.getGeneralQuizCategories(),
  { server: false, immediate: false },
)

const { data: levelsResponse } = useAsyncData(
  'general-quiz-levels',
  () => quizApi.getGeneralQuizLevels(),
  { server: false, immediate: false },
)

const categories = computed(() => categoriesResponse.value?.items ?? [])
const levels = computed(() => levelsResponse.value?.items ?? [])

const questionList = computed(() => {
  if (!quiz.value) {
    return [] as QuizQuestion[]
  }

  if (!quiz.value.configuration?.shuffleQuestions) {
    return quiz.value.questions
  }

  return [...quiz.value.questions].sort((left, right) => left.id.localeCompare(right.id))
})

const questionsCount = computed(() => questionList.value.length)
const timerPerQuestion = computed(() => quiz.value?.configuration?.timerSec ?? 30)
const currentQuestion = computed(() => questionList.value[currentQuestionIndex.value] ?? null)
const answeredCount = computed(() => questionList.value.filter(question => Boolean(selectedAnswers.value[question.id])).length)
const progressValue = computed(() => {
  if (questionsCount.value === 0) {
    return 0
  }

  return Math.round((answeredCount.value / questionsCount.value) * 100)
})

const resolveQuestionPoints = (question: QuizQuestion) => question.points && question.points > 0 ? question.points : 1

const isAnswerCorrect = (question: QuizQuestion, answerId: string) => {
  const answer = question.answers.find(item => item.id === answerId)

  if (!answer) {
    return false
  }

  if (typeof answer.correct === 'boolean') {
    return answer.correct
  }

  if (typeof answer.position === 'number') {
    return answer.position === 1
  }

  return false
}

const maxScore = computed(() => questionList.value.reduce((sum, question) => sum + resolveQuestionPoints(question), 0))
const score = computed(() => questionList.value.reduce((sum, question) => {
  const selectedAnswer = selectedAnswers.value[question.id]

  if (!selectedAnswer) {
    return sum
  }

  if (isAnswerCorrect(question, selectedAnswer)) {
    return sum + resolveQuestionPoints(question)
  }

  return sum
}, 0))

const scorePercent = computed(() => {
  if (maxScore.value === 0) {
    return 0
  }

  return Math.round((score.value / maxScore.value) * 100)
})

const hasPassed = computed(() => scorePercent.value >= (quiz.value?.passScore ?? 0))

const stopTimer = () => {
  if (!timerInterval) {
    return
  }

  clearInterval(timerInterval)
  timerInterval = null
}

const submitQuiz = async () => {
  if (!quiz.value || isSubmitting.value) {
    return
  }

  isSubmitting.value = true
  submitError.value = ''

  try {
    submitResult.value = await quizApi.submitGeneralQuiz({
      answers: Object.entries(selectedAnswers.value).map(([questionId, answerId]) => ({
        questionId,
        answerId,
      })),
    })
  }
  catch {
    submitError.value = 'Impossible de soumettre le quiz pour le moment.'
  }
  finally {
    isSubmitting.value = false
  }
}

const finishQuiz = () => {
  stopTimer()
  isFinished.value = true
  void submitQuiz()
}

const startTimer = () => {
  stopTimer()

  if (!hasStarted.value || isFinished.value || !currentQuestion.value) {
    return
  }

  currentTimer.value = timerPerQuestion.value

  timerInterval = setInterval(() => {
    if (!hasStarted.value || isFinished.value) {
      stopTimer()
      return
    }

    if (currentTimer.value <= 1) {
      goToNextQuestion()
      return
    }

    currentTimer.value -= 1
  }, 1000)
}

const goToNextQuestion = () => {
  if (currentQuestionIndex.value >= questionsCount.value - 1) {
    finishQuiz()
    return
  }

  currentQuestionIndex.value += 1
  startTimer()
}

const startQuiz = () => {
  if (!quiz.value) {
    return
  }

  selectedAnswers.value = {}
  currentQuestionIndex.value = 0
  isFinished.value = false
  hasStarted.value = true
  submitResult.value = null
  submitError.value = ''
  startTimer()
}

const resetState = () => {
  hasStarted.value = false
  isFinished.value = false
  currentQuestionIndex.value = 0
  selectedAnswers.value = {}
  submitResult.value = null
  submitError.value = ''
}

watch(() => quiz.value?.id, () => {
  if (quiz.value) {
    resetState()
  }
})

onMounted(() => {
  void Promise.all([
    loadQuiz(),
    refreshNuxtData('general-quiz-categories'),
    refreshNuxtData('general-quiz-levels'),
  ])
})

onBeforeUnmount(() => {
  stopTimer()
})
</script>

<template>
  <NuxtLayout name="default">
    <template #layout-sidebar>
      <div v-if="quiz">
        <div class="d-flex flex-wrap justify-space-between align-start ga-4">
          <div>
            <v-chip color="primary" variant="flat" class="mb-4" prepend-icon="mdi-star-four-points-outline">
              Quiz
            </v-chip>
            <h1 class="text-h4 font-weight-bold mb-2">{{ quiz.title }}</h1>
            <p class="text-body-1 text-medium-emphasis mb-0">{{ quiz.description }}</p>
          </div>
          <v-sheet v-if="hasStarted && !isFinished" rounded="pill" class="px-4 py-2 timer-pill">
            <span class="text-caption text-medium-emphasis d-block">Temps restant</span>
            <strong class="text-h5">{{ currentTimer }}s</strong>
          </v-sheet>
        </div>

        <v-divider class="my-5" />

        <div class="d-flex flex-wrap align-center ga-4">
          <v-chip variant="tonal" prepend-icon="mdi-help-circle-outline">{{ questionsCount }} questions</v-chip>
          <v-chip variant="tonal" prepend-icon="mdi-timer-outline">{{ timerPerQuestion }}s / question</v-chip>
          <v-chip variant="tonal" prepend-icon="mdi-flag-checkered">Pass score: {{ quiz.passScore }}%</v-chip>
        </div>
      </div>
    </template>

    <template #layout-aside>
      <v-card variant="text" class="pa-2" v-if="!hasStarted">
        <p class="text-subtitle-1 font-weight-medium mb-3">Levels</p>
        <div class="d-flex flex-column ga-2">
          <v-chip
            v-for="level in levels"
            :key="level.value"
            variant="flat"
            class="justify-center text-uppercase font-weight-medium"
            :style="{ backgroundColor: level.color, color: '#fff' }"
          >
            {{ level.value }}
          </v-chip>
        </div>
      </v-card>
    </template>

    <section>
      <v-alert v-if="error" type="error" variant="tonal" class="mb-6">
        Impossible de charger le quiz général.
      </v-alert>

      <v-skeleton-loader v-else-if="pending" type="heading, article, list-item-three-line@2, actions" />

      <div v-else-if="quiz">
        <template v-if="!hasStarted">
          <v-card variant="text" class="mb-8">
            <p class="text-subtitle-1 font-weight-medium mb-3">Categories</p>
            <div class="d-flex flex-wrap ga-2">
              <v-chip
                v-for="category in categories"
                :key="category.slug"
                variant="flat"
                class="font-weight-medium"
                :style="{ backgroundColor: category.color, color: '#fff' }"
              >
                {{ category.name }}
              </v-chip>
            </div>
          </v-card>

          <div class="d-flex justify-center align-center quiz-start-wrap">
            <v-btn color="primary" size="x-large" prepend-icon="mdi-play" @click="startQuiz">Start Quiz</v-btn>
          </div>
        </template>

        <v-card-text v-else>
          <div class="d-flex justify-space-between align-center mb-3">
            <p class="text-body-2 mb-0">Progression: {{ answeredCount }}/{{ questionsCount }}</p>
            <p class="text-body-2 text-medium-emphasis mb-0">{{ progressValue }}%</p>
          </div>
          <v-progress-linear :model-value="progressValue" color="primary" rounded height="10" class="mb-3" />

          <template v-if="!isFinished && currentQuestion">
            <p class="text-overline mb-2">Question {{ currentQuestionIndex + 1 }} / {{ questionsCount }}</p>
            <h2 class="text-h5 font-weight-bold mb-2">{{ currentQuestion.title }}</h2>
            <p class="text-body-2 text-medium-emphasis mb-5">
              Level: {{ currentQuestion.level }} · Category: {{ currentQuestion.category }}
            </p>

            <v-radio-group
              v-model="selectedAnswers[currentQuestion.id]"
              hide-details
              class="quiz-answers"
            >
              <v-row>
                <v-col
                  v-for="answer in currentQuestion.answers"
                  :key="answer.id"
                  cols="12"
                  md="6"
                >
                  <v-card
                    rounded="lg"
                    variant="outlined"
                    class="answer-card"
                    :class="{ 'answer-card--selected': selectedAnswers[currentQuestion.id] === answer.id }"
                    @click="selectedAnswers[currentQuestion.id] = answer.id"
                  >
                    <v-card-text class="d-flex align-center ga-3 py-4">
                      <v-radio :value="answer.id" color="primary" class="flex-grow-0" />
                      <span class="text-body-1">{{ answer.label }}</span>
                    </v-card-text>
                  </v-card>
                </v-col>
              </v-row>
            </v-radio-group>

            <div class="d-flex justify-space-between mt-6">
              <v-btn
                variant="outlined"
                :disabled="currentQuestionIndex === 0"
                prepend-icon="mdi-arrow-left"
                @click="currentQuestionIndex -= 1"
              >
                Précédent
              </v-btn>
              <v-btn color="primary" append-icon="mdi-arrow-right" @click="goToNextQuestion">
                {{ currentQuestionIndex >= questionsCount - 1 ? 'Terminer' : 'Suivant' }}
              </v-btn>
            </div>
          </template>

          <div v-else>
            <div class="text-center py-2">
              <v-avatar size="64" color="primary" variant="tonal" class="mb-2">
                <v-icon icon="mdi-trophy-outline" size="36" />
              </v-avatar>
              <h3 class="text-h4 font-weight-bold mb-2">{{ scorePercent }}%</h3>
              <p class="text-body-1 mb-1">Score: {{ score }} / {{ maxScore }}</p>
              <p class="text-body-1 mb-2" :class="hasPassed ? 'text-success' : 'text-warning'">
                {{ hasPassed ? 'Bravo, vous avez validé le quiz 🎉' : 'Vous pouvez recommencer pour améliorer votre score.' }}
              </p>

              <v-progress-circular v-if="isSubmitting" indeterminate color="primary" class="mb-4" />
              <v-alert v-else-if="submitError" type="warning" variant="tonal" class="mx-auto mb-4" max-width="520">
                {{ submitError }}
              </v-alert>

              <v-card v-else-if="submitResult" variant="tonal" rounded="lg" class="mx-auto pa-4 mb-6" max-width="520">
                <p class="text-body-1 font-weight-medium mb-3">Résultat envoyé</p>
                <p class="text-body-2 mb-1">Attempt: {{ submitResult.attemptId }}</p>
                <p class="text-body-2 mb-1">Score API: {{ submitResult.score }}%</p>
                <p class="text-body-2 mb-1">Correct: {{ submitResult.correctAnswers }} / {{ submitResult.totalQuestions }}</p>
                <p class="text-body-2 mb-0">Points: {{ submitResult.earnedPoints }} / {{ submitResult.totalPoints }}</p>
              </v-card>

              <v-btn color="primary" variant="text" prepend-icon="mdi-refresh" @click="startQuiz">Rejouer</v-btn>
            </div>
          </div>
        </v-card-text>
      </div>
    </section>
  </NuxtLayout>
</template>

<style scoped>
.timer-pill {
  border: 1px solid rgba(var(--v-theme-primary), 0.25);
  background: rgba(var(--v-theme-primary), 0.08);
}

.quiz-start-wrap {
  min-height: 45vh;
}

.answer-card {
  cursor: pointer;
  transition: all 0.2s ease;
}

.answer-card:hover {
  border-color: rgba(var(--v-theme-primary), 0.4);
  transform: translateY(-1px);
}

.answer-card--selected {
  border-color: rgba(var(--v-theme-primary), 0.8);
  background: rgba(var(--v-theme-primary), 0.08);
}
</style>
