<script setup lang="ts">
import BlogFeed from '~/components/plugins/BlogFeed.vue'
import { useBlogsStore } from '~/stores/blogs'
import UiSkeletonCardGrid from '~/components/ui/state/UiSkeletonCardGrid.vue'

definePageMeta({
  public: false,
  requiresAuth: true,
  layout: false,
})

const blogsStore = useBlogsStore()

const isLoading = ref(false)
const errorMessage = ref('')

const blog = computed(() => blogsStore.myPosts)
const blogPagination = computed(() => blogsStore.myPostsPagination)
const isLoadingMore = computed(() => blogsStore.isLoadingMore)

const hasMorePosts = computed(() => {
  if (!blogPagination.value) {
    return false
  }

  return blogPagination.value.page < blogPagination.value.totalPages
})

const loadBlogs = async () => {
  try {
    isLoading.value = true
    errorMessage.value = ''
    await blogsStore.fetchMyPosts(false, { page: 1, limit: 5, append: false })
  }
  catch (error) {
    console.error(error)
    errorMessage.value = 'Impossible de charger vos posts.'
  }
  finally {
    isLoading.value = false
  }
}

const loadMorePosts = async () => {
  if (!hasMorePosts.value || isLoadingMore.value || isLoading.value) {
    return
  }

  try {
    await blogsStore.fetchNextMyPostsPage(5)
  }
  catch (error) {
    console.error(error)
  }
}

const infiniteSentinel = ref<HTMLElement | null>(null)
let infiniteObserver: IntersectionObserver | null = null

const setupInfiniteObserver = () => {
  if (infiniteObserver) {
    infiniteObserver.disconnect()
    infiniteObserver = null
  }

  if (!infiniteSentinel.value) {
    return
  }

  infiniteObserver = new IntersectionObserver((entries) => {
    if (entries.some(entry => entry.isIntersecting)) {
      void loadMorePosts()
    }
  }, {
    rootMargin: '0px 0px 320px 0px',
    threshold: 0,
  })

  infiniteObserver.observe(infiniteSentinel.value)
}

onMounted(async () => {
  await loadBlogs()

  await nextTick()
  setupInfiniteObserver()
})

onBeforeUnmount(() => {
  if (infiniteObserver) {
    infiniteObserver.disconnect()
  }
})

watch([infiniteSentinel, hasMorePosts], async () => {
  await nextTick()
  setupInfiniteObserver()
})
</script>

<template>
  <NuxtLayout name="default">
    <main>
      <h1 class="text-h5 font-weight-bold mb-4">My posts</h1>

      <UiSkeletonCardGrid v-if="isLoading" :cards="5" :columns="12" />
      <v-alert v-else-if="errorMessage" type="error" variant="tonal" class="mb-4">{{ errorMessage }}</v-alert>
      <BlogFeed v-else-if="blog" :blog="blog" :show-summary="false" :can-interact="true" />

      <div v-if="blog && hasMorePosts" ref="infiniteSentinel" class="infinite-sentinel py-4">
        <v-progress-circular v-if="isLoadingMore" indeterminate color="primary" size="22" />
      </div>
    </main>
  </NuxtLayout>
</template>

<style scoped>
.infinite-sentinel {
  display: flex;
  justify-content: center;
}
</style>
