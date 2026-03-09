<script setup lang="ts">
import BlogFeed from '~/components/plugins/BlogFeed.vue'
import { useBlogsStore } from '~/stores/blogs'

definePageMeta({
  public: true,
  requiresAuth: false,
})
const isLoading = ref(false)
const errorMessage = ref('')
const blogsStore = useBlogsStore()

const blog = ref([])
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
  <main>
    <v-progress-linear v-if="isLoading" color="primary" indeterminate class="mb-4" />
    <BlogFeed v-else :blog="blog" />
  </main>
</template>
