<script setup lang="ts">
import QuizBoard from '~/components/plugins/QuizBoard.vue'
import { useQuizApi } from '~/composables/api/useQuizApi'
import { usePlatformPluginPage } from '~/composables/platform/usePlatformPluginPage'
import type { CreateQuizQuestionPayload } from '~/types/api/quiz'

definePageMeta({ public: true, requiresAuth: false })

const { slug, navItems, isOwner } = usePlatformPluginPage()
const { t } = useI18n()
const quizApi = useQuizApi()

const { data: quiz, pending, error, execute: loadQuiz } = useAsyncData(
  () => `application-quiz-${slug.value}`,
  () => quizApi.getApplicationQuiz(slug.value),
  {
    watch: [slug],
    server: false,
    immediate: false,
  },
)

const { data: stats, pending: pendingStats, execute: loadStats } = useAsyncData(
  () => `application-quiz-stats-${slug.value}`,
  () => quizApi.getApplicationQuizStats(slug.value),
  {
    watch: [slug],
    server: false,
    immediate: false,
  },
)

const addQuestionDialog = ref(false)
const addQuestionTrigger = ref<HTMLElement | null>(null)
const submitting = ref(false)
const submitError = ref('')

const form = ref<CreateQuizQuestionPayload>({
  title: '',
  level: 'easy',
  category: 'general',
  answers: [
    { label: '', correct: true },
    { label: '', correct: false },
  ],
  points: 1,
  explanation: '',
})

const resetForm = () => {
  form.value = {
    title: '',
    level: 'easy',
    category: 'general',
    answers: [
      { label: '', correct: true },
      { label: '', correct: false },
    ],
    points: 1,
    explanation: '',
  }
}

const setCorrectAnswer = (index: number) => {
  form.value.answers = form.value.answers.map((answer, answerIndex) => ({
    ...answer,
    correct: answerIndex === index,
  }))
}

const canSubmit = computed(() => {
  const hasTitle = form.value.title.trim().length > 0
  const hasEnoughAnswers = form.value.answers.length >= 2
  const hasValidAnswers = form.value.answers.every(answer => answer.label.trim().length > 0)
  const hasCorrectAnswer = form.value.answers.some(answer => answer.correct)

  return hasTitle && hasEnoughAnswers && hasValidAnswers && hasCorrectAnswer
})

const onOpenAddQuestionDialog = (event: MouseEvent) => {
  addQuestionTrigger.value = event.currentTarget instanceof HTMLElement ? event.currentTarget : null
  addQuestionDialog.value = true
}

watch(addQuestionDialog, (isOpen, wasOpen) => {
  if (!isOpen && wasOpen) {
    nextTick(() => addQuestionTrigger.value?.focus())
  }
})

const submitQuestion = async () => {
  if (!canSubmit.value) {
    return
  }

  submitError.value = ''
  submitting.value = true

  try {
    const payload: CreateQuizQuestionPayload = {
      title: form.value.title.trim(),
      level: form.value.level ?? 'easy',
      category: form.value.category ?? 'general',
      answers: form.value.answers.map(answer => ({
        label: answer.label.trim(),
        correct: answer.correct,
      })),
      points: form.value.points ?? 1,
      explanation: form.value.explanation?.trim() || null,
    }

    await quizApi.createApplicationQuizQuestion(slug.value, payload)
    addQuestionDialog.value = false
    resetForm()
    await Promise.all([loadQuiz(), loadStats()])
  }
  catch (submitErr: unknown) {
    submitError.value = submitErr instanceof Error ? submitErr.message : 'Unable to create the question.'
  }
  finally {
    submitting.value = false
  }
}

onMounted(() => {
  void Promise.all([loadQuiz(), loadStats()])
})
</script>

<template>
  <PlatformPluginPageShell title="Quiz" :slug="slug" :nav-items="navItems">
    <v-alert v-if="error" type="error" variant="tonal" class="mb-4">{{ t('platform.errors.quizLoad') }}</v-alert>
    <template v-else>
      <v-card rounded="xl" variant="tonal" class="mb-4">
        <v-card-text class="d-flex flex-wrap align-center ga-3 justify-space-between">
          <div>
            <p class="text-body-2 text-medium-emphasis mb-1">Statistiques du quiz</p>
            <p class="text-body-2 mb-0" v-if="pendingStats">Chargement des statistiques…</p>
            <p class="text-body-2 mb-0" v-else>
              {{ stats?.questionCount ?? 0 }} questions · {{ stats?.answerCount ?? 0 }} answers · {{ stats?.totalPoints ?? 0 }} points
            </p>
          </div>

          <v-btn v-if="isOwner" color="primary" prepend-icon="mdi-plus" @click="onOpenAddQuestionDialog">
            Add question
          </v-btn>
        </v-card-text>
      </v-card>

      <v-skeleton-loader v-if="pending" type="card, list-item-two-line@4" class="mb-4" />
      <QuizBoard v-else-if="quiz" :quiz="quiz" />
    </template>

    <v-dialog v-model="addQuestionDialog" max-width="720" retain-focus>
      <v-card>
        <v-card-title class="text-h6">Add a question</v-card-title>
        <v-card-text>
          <v-alert v-if="submitError" type="error" variant="tonal" class="mb-4">{{ submitError }}</v-alert>

          <v-text-field v-model="form.title" label="Question" class="mb-3" />

          <div class="d-grid" style="grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px;">
            <v-text-field v-model="form.level" label="Level" />
            <v-text-field v-model="form.category" label="Category" />
          </div>

          <v-textarea v-model="form.explanation" label="Explication (optionnel)" class="mb-3" rows="2" />
          <v-text-field v-model.number="form.points" type="number" min="1" label="Points" class="mb-4" />

          <p class="text-body-2 font-weight-medium mb-2">Answers</p>
          <div v-for="(answer, index) in form.answers" :key="index" class="d-flex align-center ga-2 mb-2">
            <v-radio :model-value="answer.correct" @click="setCorrectAnswer(index)" />
            <v-text-field
              v-model="answer.label"
              :label="`Answer ${index + 1}`"
              hide-details
              density="comfortable"
            />
            <v-btn
              icon="mdi-delete"
              variant="text"
              color="error"
              :disabled="form.answers.length <= 2"
              :aria-label="`Delete answer ${index + 1}`"
              @click="form.answers.splice(index, 1)"
            />
          </div>

          <v-btn variant="text" prepend-icon="mdi-plus" @click="form.answers.push({ label: '', correct: false })">
            Add an answer
          </v-btn>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="addQuestionDialog = false">Cancel</v-btn>
          <v-btn color="primary" :loading="submitting" :disabled="!canSubmit" @click="submitQuestion">Create the question</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </PlatformPluginPageShell>
</template>
