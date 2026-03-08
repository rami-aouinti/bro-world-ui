<script setup lang="ts">
import BlogFeed from '~/components/plugins/BlogFeed.vue'
import { useBlogsStore } from '~/stores/blogs'

definePageMeta({
  public: true,
  requiresAuth: false,
})

const blogsStore = useBlogsStore()
const { data: blog, pending, error, refresh } = await useAsyncData(
  'general-blog',
  () => blogsStore.fetchGeneral(),
)
</script>

<template>
  <main>
    <v-alert v-if="error" type="error" variant="tonal" class="mb-4">
      Impossible de charger le blog général.
      <template #append>
        <v-btn color="error" variant="text" @click="refresh()">Réessayer</v-btn>
      </template>
    </v-alert>
    <v-progress-linear v-else-if="pending" color="primary" indeterminate class="mb-4" />
    <BlogFeed v-else-if="blog" :blog="blog" />
  </main>
</template>
