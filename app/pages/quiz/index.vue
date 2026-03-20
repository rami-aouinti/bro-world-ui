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
const questionTimers = ref<Record<string, number>>({})
const currentQuestionIndex = ref(0)
const isFinished = ref(false)
const hasStarted = ref(false)
const isSubmitting = ref(false)
const submitError = ref('')
const submitResult = ref<SubmitQuizResult | null>(null)
const selectedLevel = ref<string | null>(null)
const selectedCategory = ref<string | null>(null)
let timerInterval: ReturnType<typeof setInterval> | null = null

const { data: quiz, pending, error, execute: loadQuiz } = useAsyncData(
  'general-quiz',
  () => quizApi.getGeneralQuiz(isAuthenticated.value, {
    level: selectedLevel.value,
    category: selectedCategory.value,
  }),
  {
    watch: [isAuthenticated, selectedLevel, selectedCategory],
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

const { data: leaderboardResponse } = useAsyncData(
  'general-quiz-leaderboard',
  () => quizApi.getGeneralQuizLeaderboard(),
  { server: false, immediate: false },
)

const categories = computed(() => categoriesResponse.value?.items ?? [])
const levels = computed(() => levelsResponse.value?.items ?? [])
const topLeaderboard = computed(() => (leaderboardResponse.value?.items ?? []).slice(0, 3))
const selectedLevelLabel = computed(() => selectedLevel.value ?? null)
const selectedCategoryLabel = computed(() => categories.value.find(category => category.slug === selectedCategory.value)?.name ?? null)

const questionList = computed(() => {
  if (!quiz.value) {
    return [] as QuizQuestion[]
  }

  if (!quiz.value.configuration?.shuffleQuestions) {
    return quiz.value.questions
  }

  return [...quiz.value.questions].sort((left, right) => left.id.localeCompare(right.id))
})

const questionById = computed(() => Object.fromEntries(questionList.value.map(question => [question.id, question])))
const questionsCount = computed(() => questionList.value.length)
const timerPerQuestion = computed(() => quiz.value?.configuration?.timerSec ?? 30)
const currentQuestion = computed(() => questionList.value[currentQuestionIndex.value] ?? null)
const currentQuestionTimer = computed(() => {
  if (!currentQuestion.value) {
    return timerPerQuestion.value
  }

  return questionTimers.value[currentQuestion.value.id] ?? timerPerQuestion.value
})
const currentTimerProgress = computed(() => {
  if (timerPerQuestion.value <= 0) {
    return 0
  }

  return Math.max(0, Math.round((currentQuestionTimer.value / timerPerQuestion.value) * 100))
})
const isCurrentQuestionLocked = computed(() => hasStarted.value && !isFinished.value && currentQuestionTimer.value <= 0)

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

const resolveAnswerLabel = (questionId: string, answerId: string | null) => {
  if (!answerId) {
    return 'Aucune réponse'
  }

  const question = questionById.value[questionId]
  return question?.answers.find(answer => answer.id === answerId)?.label ?? answerId
}

const resolveRankIcon = (rank: number) => {
  if (rank === 1) {
    return 'mdi-trophy'
  }

  if (rank === 2) {
    return 'mdi-trophy-outline'
  }

  return 'mdi-medal-outline'
}

const resolveRankColor = (rank: number) => {
  if (rank === 1) {
    return 'warning'
  }

  if (rank === 2) {
    return 'grey'
  }

  return 'deep-orange'
}

const stopTimer = () => {
  if (!timerInterval) {
    return
  }

  clearInterval(timerInterval)
  timerInterval = null
}

const tickCurrentQuestion = () => {
  const question = currentQuestion.value

  if (!question) {
    return
  }

  const remaining = questionTimers.value[question.id] ?? timerPerQuestion.value

  if (remaining <= 0) {
    questionTimers.value[question.id] = 0
    return
  }

  questionTimers.value[question.id] = remaining - 1
}

const startTimer = () => {
  stopTimer()

  if (!hasStarted.value || isFinished.value || !currentQuestion.value) {
    return
  }

  timerInterval = setInterval(() => {
    if (!hasStarted.value || isFinished.value) {
      stopTimer()
      return
    }

    tickCurrentQuestion()
  }, 1000)
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

const goToNextQuestion = () => {
  if (currentQuestionIndex.value >= questionsCount.value - 1) {
    finishQuiz()
    return
  }

  currentQuestionIndex.value += 1
}

const goToPreviousQuestion = () => {
  if (currentQuestionIndex.value <= 0) {
    return
  }

  currentQuestionIndex.value -= 1
}

const setAnswer = (questionId: string, answerId: string) => {
  if (isCurrentQuestionLocked.value) {
    return
  }

  selectedAnswers.value[questionId] = answerId
}

const initializeQuestionTimers = () => {
  questionTimers.value = Object.fromEntries(questionList.value.map(question => [question.id, timerPerQuestion.value]))
}

const startQuiz = async () => {
  await loadQuiz()

  if (!quiz.value) {
    return
  }

  selectedAnswers.value = {}
  currentQuestionIndex.value = 0
  isFinished.value = false
  hasStarted.value = true
  submitResult.value = null
  submitError.value = ''
  initializeQuestionTimers()
  startTimer()
}

const toggleLevel = (levelValue: string) => {
  selectedLevel.value = selectedLevel.value === levelValue ? null : levelValue
}

const toggleCategory = (categorySlug: string) => {
  selectedCategory.value = selectedCategory.value === categorySlug ? null : categorySlug
}

const resetState = () => {
  hasStarted.value = false
  isFinished.value = false
  currentQuestionIndex.value = 0
  selectedAnswers.value = {}
  questionTimers.value = {}
  submitResult.value = null
  submitError.value = ''
}

watch(() => currentQuestionIndex.value, () => {
  if (hasStarted.value && !isFinished.value) {
    startTimer()
  }
})

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
    refreshNuxtData('general-quiz-leaderboard'),
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
        </div>

        <v-divider class="my-5" />

        <div class="d-flex flex-wrap align-center ga-4 mb-3">
          <v-chip variant="tonal" prepend-icon="mdi-help-circle-outline">{{ questionsCount }} questions</v-chip>
          <v-chip variant="tonal" prepend-icon="mdi-timer-outline">{{ timerPerQuestion }}s / question</v-chip>
          <v-chip variant="tonal" prepend-icon="mdi-flag-checkered">Pass score: {{ quiz.passScore }}%</v-chip>
        </div>

        <template v-if="selectedLevelLabel || selectedCategoryLabel">
          <div class="d-flex flex-wrap ga-2">
            <v-chip v-if="selectedLevelLabel" color="primary" size="small" variant="tonal" prepend-icon="mdi-speedometer">
              Level: {{ selectedLevelLabel }}
            </v-chip>
            <v-chip v-if="selectedCategoryLabel" color="secondary" size="small" variant="tonal" prepend-icon="mdi-shape-outline">
              Category: {{ selectedCategoryLabel }}
            </v-chip>
          </div>
        </template>
      </div>
    </template>

    <template #layout-aside>
      <template v-if="!hasStarted">
        <div class="d-flex flex-column ga-2 mb-4">
          <p class="text-subtitle-2 font-weight-bold mb-3">Level</p>
          <v-btn v-for="level in levels"
                 rounded="xl"
                  :key="level.value"
                  class="justify-center text-uppercase font-weight-medium"
                  :variant="selectedLevel === level.value ? 'flat' : 'outlined'"
                  :style="{ backgroundColor: selectedLevel === level.value ? level.color : 'transparent', color: selectedLevel === level.value ? '#fff' : level.color, borderColor: level.color }"
                  @click="toggleLevel(level.value)">
              {{ level.value }}
          </v-btn>
        </div>
      </template>

      <template v-else-if="!isFinished">
        <div class="d-flex justify-space-between align-center mb-4">
          <p class="text-subtitle-1 font-weight-bold mb-0">Timer</p>
          <v-chip size="small" color="primary" variant="tonal">Q{{ currentQuestionIndex + 1 }}/{{ questionsCount }}</v-chip>
        </div>

        <div class="d-flex justify-center mb-4">
          <v-progress-circular
              :model-value="currentTimerProgress"
              :size="128"
              :width="12"
              :color="isCurrentQuestionLocked ? 'error' : 'primary'"
          >
            <div class="text-center">
              <div class="text-h4 font-weight-bold">{{ currentQuestionTimer }}s</div>
              <div class="text-caption text-medium-emphasis">restantes</div>
            </div>
          </v-progress-circular>
        </div>

        <v-alert v-if="isCurrentQuestionLocked" type="warning" variant="tonal" density="comfortable" class="mb-4">
          Temps écoulé pour cette question. Réponse bloquée.
        </v-alert>
      </template>

      <template v-else>
        <p class="text-body-2 mb-1">Score: <strong>{{ submitResult?.score ?? scorePercent }}%</strong></p>
        <p class="text-body-2 mb-1">Points: <strong>{{ submitResult?.earnedPoints ?? score }} / {{ submitResult?.totalPoints ?? maxScore }}</strong></p>
        <p class="text-body-2 mb-1">Bonnes réponses: <strong>{{ submitResult?.correctAnswers ?? 0 }} / {{ submitResult?.totalQuestions ?? questionsCount }}</strong></p>
        <p class="text-body-2 mb-4" :class="(submitResult?.passed ?? hasPassed) ? 'text-success' : 'text-warning'">
          {{ (submitResult?.passed ?? hasPassed) ? 'Quiz is validated' : 'Quiz is not validated' }}
        </p>
      </template>

      <v-divider class="my-3" />

      <p class="text-subtitle-2 font-weight-bold mb-3">Top 3 leaderboard</p>
      <div class="d-flex flex-column ga-2">
        <v-sheet
            v-for="(entry, index) in topLeaderboard"
            :key="entry.userId"
            rounded="lg"
            class="leaderboard-item pa-2"
            variant="text"
        >
          <div class="d-flex align-center ga-2">
            <v-chip size="small" variant="flat" :color="resolveRankColor(index + 1)">
              <v-icon start :icon="resolveRankIcon(index + 1)" />
              #{{ index + 1 }}
            </v-chip>
            <v-avatar :image="entry.photo || undefined" size="24" />
            <p class="text-body-2 font-weight-medium text-truncate">{{ entry.firstName }} {{ entry.lastName }}</p>

            <p class="text-caption text-medium-emphasis text-end">{{ entry.averageWeightedScore.toFixed(2) }} pts</p>

          </div>
        </v-sheet>
        <p v-if="topLeaderboard.length === 0" class="text-caption text-medium-emphasis mb-0">
          No scores available at the moment.
        </p>
      </div>
    </template>

    <section>
      <v-alert v-if="error" type="error" variant="tonal" class="mb-6">
        Cannot load the Quiz.
      </v-alert>

      <v-skeleton-loader v-else-if="pending" type="heading, article, list-item-three-line@2, actions" />

      <div v-else-if="quiz">
        <template v-if="!hasStarted">
          <v-card variant="text" class="mb-8">
            <p class="text-subtitle-1 font-weight-medium mb-3">Categories</p>
            <div class="d-flex flex-wrap ga-2">
              <v-card
                v-for="category in categories"
                :key="category.slug"
                variant="text"
                class="font-weight-medium category-card"
                :class="{ 'category-card--selected': selectedCategory === category.slug }"
                min-width="165px"
                :style="{ backgroundColor: category.color, color: '#fff' }"
                @click="toggleCategory(category.slug)"
              >
                <v-card-text class="text-center">
                  {{ category.name }}
                </v-card-text>
              </v-card>
            </div>
          </v-card>

          <div class="d-flex justify-center align-center quiz-start-wrap">
            <v-btn color="primary" size="x-large" prepend-icon="mdi-play" @click="startQuiz">Start Quiz</v-btn>
          </div>
        </template>

        <v-card-text v-else>
          <template v-if="!isFinished && currentQuestion">
            <p class="text-overline mb-2">Question {{ currentQuestionIndex + 1 }} / {{ questionsCount }}</p>
            <h2 class="text-h5 font-weight-bold mb-2">{{ currentQuestion.title }}</h2>
            <p class="text-body-2 text-medium-emphasis mb-5">
              Level: {{ currentQuestion.level }} · Category: {{ currentQuestion.category }}
            </p>

            <v-alert v-if="isCurrentQuestionLocked" type="warning" variant="tonal" class="mb-4">
              Temps écoulé pour cette question. Vous pouvez naviguer, mais vous ne pouvez plus répondre ici.
            </v-alert>

            <v-radio-group
              :model-value="selectedAnswers[currentQuestion.id]"
              hide-details
              class="quiz-answers"
              :disabled="isCurrentQuestionLocked"
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
                    :class="{
                      'answer-card--selected': selectedAnswers[currentQuestion.id] === answer.id,
                      'answer-card--disabled': isCurrentQuestionLocked,
                    }"
                    @click="setAnswer(currentQuestion.id, answer.id)"
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
                @click="goToPreviousQuestion"
              >
                Précédent
              </v-btn>
              <v-btn color="primary" append-icon="mdi-arrow-right" @click="goToNextQuestion">
                {{ currentQuestionIndex >= questionsCount - 1 ? 'Submit' : 'Next' }}
              </v-btn>
            </div>
          </template>

          <div v-else>
            <div class="text-center py-2 mb-6">
              <v-avatar size="72" color="success" variant="tonal" class="mb-2 mx-2">
                <v-btn @click="startQuiz" size="72">Start</v-btn>
              </v-avatar>
              <v-avatar size="72" color="primary" variant="tonal" class="mb-2 mx-2">
                <v-btn @click="startQuiz" size="72">Replay</v-btn>
              </v-avatar>
            </div>
            <v-skeleton-loader v-if="isSubmitting" v-for="item in [1, 2, 3]" type="card" class="mb-4" />
            <v-alert v-else-if="submitError" type="warning" variant="tonal" class="mb-4">
              {{ submitError }}
            </v-alert>

            <div v-else-if="submitResult" class="d-flex flex-column ga-3">
              <v-card
                v-for="(item, index) in submitResult.results"
                :key="item.questionId"
                variant="outlined"
                rounded="lg"
                class="pa-3"
                :class="item.isCorrect ? 'result-card--correct' : 'result-card--wrong'"
              >
                <p class="text-overline mb-1">Question {{ index + 1 }}</p>
                <p class="text-body-1 font-weight-medium mb-2">{{ questionById[item.questionId]?.title ?? item.questionId }}</p>
                <p class="text-body-2 mb-1">
                  Votre réponse: <strong>{{ resolveAnswerLabel(item.questionId, item.selectedAnswerId) }}</strong>
                </p>
                <p class="text-body-2 mb-1">
                  Bonne réponse: <strong>{{ item.correctAnswerIds.map(answerId => resolveAnswerLabel(item.questionId, answerId)).join(', ') }}</strong>
                </p>
                <p class="text-body-2 mb-0">
                  Points: <strong>{{ item.earnedPoints }} / {{ item.points }}</strong>
                  <v-chip size="x-small" class="ml-2" :color="item.isCorrect ? 'success' : 'error'" variant="flat">
                    {{ item.isCorrect ? 'Exacte' : 'Erronée' }}
                  </v-chip>
                </p>
              </v-card>
            </div>

          </div>
        </v-card-text>
      </div>
    </section>
  </NuxtLayout>
</template>

<style scoped>
.quiz-start-wrap {
  min-height: 45vh;
}

.timer-panel {
  border: 1px solid rgba(var(--v-theme-primary), 0.24);
  background:
    radial-gradient(circle at top, rgba(var(--v-theme-primary), 0.2), transparent 55%),
    linear-gradient(180deg, rgba(var(--v-theme-surface), 1), rgba(var(--v-theme-surface), 0.96));
}

.leaderboard-item {
  border: 1px solid rgba(var(--v-theme-on-surface), 0.12);
  background: rgba(var(--v-theme-surface), 0.7);
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

.answer-card--disabled {
  cursor: not-allowed;
  opacity: 0.75;
}

.result-card--correct {
  border-color: rgba(var(--v-theme-success), 0.6);
  background: rgba(var(--v-theme-success), 0.05);
}

.result-card--wrong {
  border-color: rgba(var(--v-theme-error), 0.5);
  background: rgba(var(--v-theme-error), 0.05);
}

.category-card {
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.category-card:hover {
  transform: translateY(-1px);
}

.category-card--selected {
  box-shadow: 0 0 0 3px rgba(var(--v-theme-primary), 0.55) inset;
}
</style>
