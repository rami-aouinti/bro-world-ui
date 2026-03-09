<script setup lang="ts">
import BlogFeed from '~/components/plugins/BlogFeed.vue'
import BlogSummaryCard from '~/components/plugins/BlogSummaryCard.vue'
import { useBlogsStore } from '~/stores/blogs'

definePageMeta({
  public: true,
  requiresAuth: false,
  layout: false,
})

const isLoading = ref(false)
const errorMessage = ref('')
const blogsStore = useBlogsStore()

const blog = ref<any>(null)
const loadBlogs = async () => {
  try {
    isLoading.value = true
    errorMessage.value = ''
    blog.value = await blogsStore.fetchGeneral()
  } catch (error) {
    console.error(error)
    errorMessage.value = 'Impossible de charger les événements du calendrier.'
  } finally {
    isLoading.value = false
  }
}

onMounted(async () => {
  await loadBlogs()

  await nextTick()
})
</script>

<template>
  <NuxtLayout name="default">
    <template #layout-sidebar>
      <BlogSummaryCard v-if="!isLoading && blog" :blog="blog" />
    </template>

    <main>
      <v-progress-linear v-if="isLoading" color="primary" indeterminate class="mb-4" />
      <v-alert v-else-if="errorMessage" type="error" variant="tonal" class="mb-4">{{ errorMessage }}</v-alert>
      <BlogFeed v-else-if="blog" :blog="blog" :show-summary="false" />
    </main>
  </NuxtLayout>
</template>
