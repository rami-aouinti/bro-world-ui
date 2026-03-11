<script setup lang="ts">
import QuizBoard from '~/components/plugins/QuizBoard.vue'
import { useQuizApi } from '~/composables/api/useQuizApi'
import { usePlatformPluginPage } from '~/composables/platform/usePlatformPluginPage'

definePageMeta({ public: true, requiresAuth: false })

const { slug, navItems } = usePlatformPluginPage()
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

onMounted(() => {
  void loadQuiz()
})
</script>

<template>
  <PlatformPluginPageShell title="Quiz" :slug="slug" :nav-items="navItems">
    <v-alert v-if="error" type="error" variant="tonal" class="mb-4">Impossible de charger le quiz de cette platform.</v-alert>
    <v-progress-linear v-else-if="pending" color="primary" indeterminate class="mb-4" />
    <QuizBoard v-else-if="quiz" :quiz="quiz" />
  </PlatformPluginPageShell>
</template>
