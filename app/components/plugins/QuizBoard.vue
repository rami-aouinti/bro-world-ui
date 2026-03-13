<script setup lang="ts">
import type { QuizRead } from '~/types/api/quiz'

const props = defineProps<{
  quiz: QuizRead
}>()

const selectedAnswers = ref<Record<string, string>>({})
const isSubmitted = ref(false)

const questionList = computed(() => {
  if (!props.quiz.configuration?.shuffleQuestions) {
    return props.quiz.questions
  }

  return [...props.quiz.questions].sort((left, right) => left.id.localeCompare(right.id))
})

const answeredCount = computed(() => questionList.value.filter(question => selectedAnswers.value[question.id]).length)
const score = computed(() => questionList.value.reduce((points, question) => {
  const selectedId = selectedAnswers.value[question.id]
  const selectedAnswer = question.answers.find(answer => answer.id === selectedId)
  return points + (selectedAnswer?.correct ? 1 : 0)
}, 0))
</script>

<template>
  <v-card rounded="xl" variant="tonal" class="mb-6">
    <v-card-text>
      <h1 class="text-h5 font-weight-bold mb-2">Quiz</h1>
      <p class="text-body-2 text-medium-emphasis mb-2">{{ quiz.questions.length }} questions · Timer: {{ quiz.configuration?.timerSec ?? 'N/A' }}s</p>
      <p class="text-body-2 mb-0">{{ answeredCount }} / {{ quiz.questions.length }} selected answers</p>
    </v-card-text>
  </v-card>

  <v-card rounded="xl">
    <v-card-text>
      <v-expansion-panels>
        <v-expansion-panel v-for="(question, index) in questionList" :key="question.id">
          <v-expansion-panel-title>
            <div>
              <p class="font-weight-bold mb-1">Q{{ index + 1 }}. {{ question.title }}</p>
              <p class="text-caption text-medium-emphasis mb-0">{{ question.level }} · {{ question.category }}</p>
            </div>
          </v-expansion-panel-title>
          <v-expansion-panel-text>
            <v-radio-group v-model="selectedAnswers[question.id]" hide-details>
              <v-radio v-for="answer in question.answers" :key="answer.id" :label="answer.label" :value="answer.id" />
            </v-radio-group>
          </v-expansion-panel-text>
        </v-expansion-panel>
      </v-expansion-panels>

      <div class="d-flex align-center ga-3 mt-6">
        <v-btn color="primary" @click="isSubmitted = true">Valider</v-btn>
        <p v-if="isSubmitted" class="text-body-2 mb-0">Score: {{ score }} / {{ quiz.questions.length }}</p>
      </div>
    </v-card-text>
  </v-card>
</template>
