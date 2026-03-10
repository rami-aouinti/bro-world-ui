<script setup lang="ts">
import BlogFeed from '~/components/plugins/BlogFeed.vue'
import BlogSummaryCard from '~/components/plugins/BlogSummaryCard.vue'
import { useBlogsStore } from '~/stores/blogs'

definePageMeta({
  public: true,
  requiresAuth: false,
  layout: false,
})

const route = useRoute()
const blogsStore = useBlogsStore()
const { isAuthenticated } = useAuth()

const isLoading = ref(false)
const errorMessage = ref('')

const blog = computed(() => blogsStore.general)
const postId = computed(() => String(route.params.postId ?? ''))

const blogWithSinglePost = computed(() => {
  if (!blog.value) {
    return null
  }

  const selectedPost = blog.value.posts.find(post => post.id === postId.value)
  if (!selectedPost) {
    return null
  }

  return {
    ...blog.value,
    posts: [selectedPost],
  }
})

const loadPost = async () => {
  try {
    isLoading.value = true
    errorMessage.value = ''
    await blogsStore.fetchGeneral(false, !isAuthenticated.value)

    if (!blogWithSinglePost.value) {
      errorMessage.value = 'Post introuvable.'
    }
  }
  catch (error) {
    console.error(error)
    errorMessage.value = 'Impossible de charger le post.'
  }
  finally {
    isLoading.value = false
  }
}

watch([postId, isAuthenticated], loadPost, { immediate: true })
</script>

<template>
  <NuxtLayout name="default">
    <template #layout-sidebar>
      <BlogSummaryCard v-if="!isLoading && blog" :blog="blog" />
    </template>

    <main>
      <v-progress-linear v-if="isLoading" color="primary" indeterminate class="mb-4" />
      <v-alert v-else-if="errorMessage" type="error" variant="tonal" class="mb-4">{{ errorMessage }}</v-alert>
      <BlogFeed
        v-else-if="blogWithSinglePost"
        :blog="blogWithSinglePost"
        :show-summary="false"
        :can-interact="isAuthenticated"
      />
    </main>
  </NuxtLayout>
</template>
