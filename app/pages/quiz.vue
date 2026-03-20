<script setup lang="ts">
import type { QuizQuestion } from '~/types/api/quiz'
import { useQuizApi } from '~/composables/api/useQuizApi'
import AppSplitShell from '~/components/layout/AppSplitShell.vue'

definePageMeta({
  public: true,
  requiresAuth: false,
  skeleton: "card-grid",
});

const { isAuthenticated } = useAuth()
const quizApi = useQuizApi()

const selectedAnswers = ref<Record<string, string>>({})
const currentQuestionIndex = ref(0)
const currentTimer = ref(0)
const isFinished = ref(false)
const hasStarted = ref(false)
const isPersisting = ref(false)
const persistMessage = ref('')
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

const resolveQuestionPoints = (question: QuizQuestion) => {
  return question.points && question.points > 0 ? question.points : 1
}

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

const finishQuiz = () => {
  stopTimer()
  isFinished.value = true
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
  persistMessage.value = ''
  startTimer()
}

const persistScore = async (save: boolean) => {
  if (isPersisting.value) {
    return
  }

  isPersisting.value = true

  try {
    if (save) {
      await quizApi.publishGeneralQuiz()
      persistMessage.value = 'Score sauvegardé avec succès.'
    }
    else {
      await quizApi.unpublishGeneralQuiz()
      persistMessage.value = 'Score non sauvegardé.'
    }
  }
  catch {
    persistMessage.value = 'Impossible de sauvegarder votre choix pour le moment.'
  }
  finally {
    isPersisting.value = false
  }
}

watch(() => quiz.value?.id, () => {
  if (quiz.value) {
    hasStarted.value = false
    isFinished.value = false
    currentQuestionIndex.value = 0
    selectedAnswers.value = {}
    persistMessage.value = ''
  }
})

onMounted(() => {
  void loadQuiz()
})

onBeforeUnmount(() => {
  stopTimer()
})
</script>

<template>
  <AppSplitShell>
    <template #left>
      <div v-if="quiz">
        <v-card rounded="xl" variant="tonal" class="quiz-sidebar-card pa-5">
          <div class="d-flex flex-wrap justify-space-between align-start ga-4">
            <div>
              <v-chip color="primary" variant="flat" class="mb-4" prepend-icon="mdi-star-four-points-outline">
                Quiz
              </v-chip>
              <h1 class="text-h4 font-weight-bold mb-2">{{ quiz.title }}</h1>
              <p class="text-body-1 text-medium-emphasis mb-0">{{ quiz.description }}</p>
            </div>
            <v-sheet rounded="pill" class="px-4 py-2 timer-pill" v-if="hasStarted && !isFinished">
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

          <div class="mt-6" v-if="!hasStarted">
            <v-btn color="primary" size="large" prepend-icon="mdi-play" @click="startQuiz">Start Quiz</v-btn>
          </div>
        </v-card>
      </div>
    </template>
    <section>
      <v-alert v-if="error" type="error" variant="tonal" class="mb-6">
        Impossible de charger le quiz général.
      </v-alert>

      <v-skeleton-loader v-else-if="pending" type="heading, article, list-item-three-line@2, actions" />

      <template v-else-if="quiz">
        <v-card v-if="hasStarted" rounded="xl" class="pa-2 pa-md-4" elevation="0">
          <v-card-text>
            <div class="d-flex justify-space-between align-center mb-3">
              <p class="text-body-2 mb-0">Progression: {{ answeredCount }}/{{ questionsCount }}</p>
              <p class="text-body-2 text-medium-emphasis mb-0">{{ progressValue }}%</p>
            </div>
            <v-progress-linear :model-value="progressValue" color="primary" rounded height="10" class="mb-6" />

            <template v-if="!isFinished && currentQuestion">
              <p class="text-overline mb-2">Question {{ currentQuestionIndex + 1 }} / {{ questionsCount }}</p>
              <h2 class="text-h5 font-weight-bold mb-2">{{ currentQuestion.title }}</h2>
              <p class="text-body-2 text-medium-emphasis mb-5">
                Niveau: {{ currentQuestion.level }} · Catégorie: {{ currentQuestion.category }}
              </p>

              <v-radio-group v-model="selectedAnswers[currentQuestion.id]" hide-details class="quiz-answers">
                <v-card
                    v-for="answer in currentQuestion.answers"
                    :key="answer.id"
                    rounded="lg"
                    variant="outlined"
                    class="mb-3 answer-card"
                    :class="{ 'answer-card--selected': selectedAnswers[currentQuestion.id] === answer.id }"
                    @click="selectedAnswers[currentQuestion.id] = answer.id"
                >
                  <v-card-text class="d-flex align-center ga-3 py-4">
                    <v-radio :value="answer.id" color="primary" class="flex-grow-0" />
                    <span class="text-body-1">{{ answer.label }}</span>
                  </v-card-text>
                </v-card>
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

            <template v-else>
              <div class="text-center py-4">
                <v-avatar size="64" color="primary" variant="tonal" class="mb-4">
                  <v-icon icon="mdi-trophy-outline" size="36" />
                </v-avatar>
                <h3 class="text-h4 font-weight-bold mb-2">{{ scorePercent }}%</h3>
                <p class="text-body-1 mb-1">Score: {{ score }} / {{ maxScore }}</p>
                <p class="text-body-1 mb-6" :class="hasPassed ? 'text-success' : 'text-warning'">
                  {{ hasPassed ? 'Bravo, vous avez validé le quiz 🎉' : 'Vous pouvez recommencer pour améliorer votre score.' }}
                </p>

                <v-card variant="tonal" rounded="lg" class="mx-auto pa-4 mb-6" max-width="520">
                  <p class="text-body-1 font-weight-medium mb-3">Souhaitez-vous sauvegarder ce score ?</p>
                  <div class="d-flex flex-wrap justify-center ga-3">
                    <v-btn color="primary" :loading="isPersisting" prepend-icon="mdi-content-save-outline" @click="persistScore(true)">
                      Sauvegarder
                    </v-btn>
                    <v-btn variant="outlined" :loading="isPersisting" prepend-icon="mdi-close-circle-outline" @click="persistScore(false)">
                      Ne pas sauvegarder
                    </v-btn>
                  </div>
                  <p v-if="persistMessage" class="text-body-2 mt-4 mb-0">{{ persistMessage }}</p>
                </v-card>

                <v-btn color="primary" variant="text" prepend-icon="mdi-refresh" @click="startQuiz">Rejouer</v-btn>
              </div>
            </template>
          </v-card-text>
        </v-card>
      </template>
    </section>
  </AppSplitShell>
</template>

<style scoped>

.quiz-header {
  border: 1px solid rgba(var(--v-theme-primary), 0.18);
  background:
    radial-gradient(circle at top right, rgba(var(--v-theme-primary), 0.2), transparent 56%),
    linear-gradient(150deg, rgba(var(--v-theme-surface), 1), rgba(var(--v-theme-surface), 0.96));
}

.timer-pill {
  border: 1px solid rgba(var(--v-theme-primary), 0.25);
  background: rgba(var(--v-theme-primary), 0.08);
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
