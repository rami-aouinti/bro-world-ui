<script setup lang="ts">
import BlogFeed from '~/components/plugins/BlogFeed.vue'
import BlogSummaryCard from '~/components/plugins/BlogSummaryCard.vue'
import BlogLocalInsightsCard from '~/components/blog/BlogLocalInsightsCard.vue'
import { useBlogsStore } from '~/stores/blogs'
import UiSkeletonCardGrid from "~/components/ui/state/UiSkeletonCardGrid.vue";

definePageMeta({
  public: true,
  requiresAuth: false,
  layout: false,
})

const isLoading = ref(false)
const errorMessage = ref('')
const errorRequestId = ref<string | null>(null)
const blogsStore = useBlogsStore()
const { initSession, isAuthenticated, authState } = useAuth()
const { resolveSensitiveError, isDebugMode } = useSensitivePageFeedback()

const blog = computed(() => blogsStore.general)
const blogPagination = computed(() => blogsStore.generalPagination)

const isLoadingMore = computed(() => blogsStore.isLoadingMore)
const hasMorePosts = computed(() => {
  if (!blogPagination.value) {
    return false
  }

  return blogPagination.value.page < blogPagination.value.totalPages
})

const loadMorePosts = async () => {
  if (!hasMorePosts.value || isLoadingMore.value || isLoading.value) {
    return
  }

  try {
    await initSession()
    const isPublicFeed = !isPrivateSessionReady()
    await blogsStore.fetchNextGeneralPage(isPublicFeed, 5)
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

const isPrivateSessionReady = () => authState.value === 'authenticated' || authState.value === 'degraded'

const loadBlogs = async () => {
  try {
    isLoading.value = true
    errorMessage.value = ''
    errorRequestId.value = null
    await initSession()

    const isPublicFeed = !isPrivateSessionReady()
    await blogsStore.fetchGeneral(false, isPublicFeed, { page: 1, limit: 5, append: false })
  } catch (error) {
    const resolved = resolveSensitiveError(error, {
      authState: authState.value,
      domain: 'blogPage',
      action: 'load',
      fallbackKey: 'errors.server',
    })
    errorMessage.value = resolved.message
    errorRequestId.value = resolved.requestId
  } finally {
    isLoading.value = false
  }
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
    <template #layout-sidebar>
      <BlogSummaryCard v-if="!isLoading && blog" :blog="blog" />
    </template>

    <template #layout-aside>
      <BlogLocalInsightsCard />
    </template>

    <main>
      <UiSkeletonCardGrid :cards="5" :columns="12" v-if="isLoading" />
      <v-alert v-else-if="errorMessage" type="error" variant="tonal" class="mb-4">
        {{ errorMessage }}
        <div v-if="isDebugMode && errorRequestId" class="text-caption mt-1">requestId: {{ errorRequestId }}</div>
      </v-alert>
      <BlogFeed v-else-if="blog" :blog="blog" :show-summary="false" :can-interact="isAuthenticated" />

      <div v-if="blog && hasMorePosts" ref="infiniteSentinel" class="infinite-sentinel py-4">
        <v-progress-circular v-if="isLoadingMore" indeterminate color="primary" size="22" />
      </div>
    </main>
  </NuxtLayout>
</template>

<style scoped>
.blog-hero {
  border-radius: 24px;
  background:
    radial-gradient(circle at 15% 20%, rgba(var(--v-theme-primary), 0.2), transparent 42%),
    radial-gradient(circle at 90% 80%, rgba(var(--v-theme-secondary), 0.18), transparent 40%),
    rgba(var(--v-theme-surface-variant), 0.26);
  border: 1px solid rgba(var(--v-theme-on-surface), 0.12);
}

.hero-description {
  max-width: 860px;
}

.announcement-item {
  border-left: 2px solid rgba(var(--v-theme-primary), 0.38);
  padding-left: 10px;
}

.infinite-sentinel {
  display: flex;
  justify-content: center;
}

.insight-card {
  border-color: rgba(var(--v-theme-on-surface), 0.14);
  background: linear-gradient(180deg, rgba(var(--v-theme-surface), 0.92), rgba(var(--v-theme-surface-variant), 0.24));
}

</style>
