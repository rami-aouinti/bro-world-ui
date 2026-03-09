<script setup lang="ts">
import QuizBoard from '~/components/plugins/QuizBoard.vue'
import PlatformSidebarNav from '~/components/platform/PlatformSidebarNav.vue'
import PlatformSplitLayout from '~/components/platform/PlatformSplitLayout.vue'
import { useQuizApi } from '~/composables/api/useQuizApi'
import { getCrmNav, getRecruitNav, getSchoolNav, getShopNav } from '~/data/platform-nav'
import type { PlatformNavItem } from '~/data/platform-nav'

definePageMeta({ public: true, requiresAuth: false })

const route = useRoute()
const slug = computed(() => String(route.params.slug ?? ''))
const platformKey = computed(() => String(route.params.platformKey ?? '').toLowerCase())
const { isOwner } = usePlatformPermissions(slug)
const { isAuthenticated } = useAuth()
const quizApi = useQuizApi()

const navItems = computed<PlatformNavItem[]>(() => {
  if (platformKey.value === 'shop') return getShopNav(slug.value, isOwner.value)
  if (platformKey.value === 'recruit') return getRecruitNav(slug.value, isOwner.value, isAuthenticated.value)
  if (platformKey.value === 'school') return getSchoolNav(slug.value, isOwner.value)
  return getCrmNav(slug.value, isOwner.value)
})

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
  <PlatformSplitLayout>
    <template #sidebar>
      <PlatformSidebarNav
        title="Quiz"
        subtitle="platform.common.sidebar.application"
        :subtitle-values="{ slug }"
        :items="navItems"
      />
    </template>

    <section>
      <v-alert v-if="error" type="error" variant="tonal" class="mb-4">Impossible de charger le quiz de cette platform.</v-alert>
      <v-progress-linear v-else-if="pending" color="primary" indeterminate class="mb-4" />
      <QuizBoard v-else-if="quiz" :quiz="quiz" />
    </section>
  </PlatformSplitLayout>
</template>
