<script setup lang="ts">
import BlogFeed from '~/components/plugins/BlogFeed.vue'
import { useBlogsApi } from '~/composables/api/useBlogsApi'

definePageMeta({
  public: true,
  requiresAuth: false,
})

const blogsApi = useBlogsApi()
const { data: blog, pending, error } = await useAsyncData('general-blog', () => blogsApi.getGeneral())
</script>

<template>
  <main>
    <v-alert v-if="error" type="error" variant="tonal" class="mb-4">Impossible de charger le blog général.</v-alert>
    <v-progress-linear v-else-if="pending" color="primary" indeterminate class="mb-4" />
    <BlogFeed v-else-if="blog" :blog="blog" />
  </main>
</template>
