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

type MockEditorialInsight = {
  title: string
  excerpt: string
  category: string
  readTime: string
  trend: string
}

type MockAnnouncement = {
  title: string
  date: string
  tag: string
}

const editorialInsights: MockEditorialInsight[] = [
  {
    title: 'Recrutement 2026: ce que les talents attendent vraiment des entreprises',
    excerpt: 'Flexibility, impact, and rapid growth: three strong signals reshaping HR strategy.',
    category: 'Talent & RH',
    readTime: '6 min',
    trend: '+18% engagement',
  },
  {
    title: 'Product design: 5 team rituals to reduce churn from month one',
    excerpt: 'Short onboarding-focused workshops help fix friction before it becomes costly.',
    category: 'Product Design',
    readTime: '8 min',
    trend: '-12% churn',
  },
  {
    title: 'Comment industrialiser le contenu de marque sans perdre votre voix',
    excerpt: 'A clear editorial architecture helps speed up production without sacrificing quality.',
    category: 'Brand & Content',
    readTime: '5 min',
    trend: '+2.4x production',
  },
]

const roadmapAnnouncements: MockAnnouncement[] = [
  { title: 'Launch of the “Guest Authors” module', date: 'Week 14', tag: 'Roadmap' },
  { title: 'New “Case Study video” format', date: 'Week 16', tag: 'Content' },
  { title: 'Advanced analytics connection (beta)', date: 'Week 19', tag: 'Data' },
]

const isLoading = ref(false)
const errorMessage = ref('')
const blogsStore = useBlogsStore()
const { isAuthenticated } = useAuth()

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
    await blogsStore.fetchNextGeneralPage(!isAuthenticated.value, 5)
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

const keyTopics = computed(() => {
  const extractedTopics = blog.value?.posts
    ?.flatMap(post => post.content.split(/\s+/).slice(0, 8))
    .map(token => token.toLowerCase().replace(/[^\p{L}\p{N}-]/gu, ''))
    .filter(token => token.length > 4)

  const uniqueTopics = Array.from(new Set(extractedTopics)).slice(0, 6)
  return uniqueTopics.length
    ? uniqueTopics
    : ['innovation', 'produit', 'leadership', 'culture', 'croissance', 'design']
})

const loadBlogs = async () => {
  try {
    isLoading.value = true
    errorMessage.value = ''
    await blogsStore.fetchGeneral(false, !isAuthenticated.value, { page: 1, limit: 5, append: false })
  } catch (error) {
    console.error(error)
    errorMessage.value = 'Impossible de charger le blog.'
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
      <div class="d-flex flex-column ga-4">
        <BlogSummaryCard v-if="!isLoading && blog" :blog="blog" />
      </div>
    </template>

    <template #layout-aside>
      <BlogLocalInsightsCard />
    </template>

    <main>
      <UiSkeletonCardGrid :cards="5" :columns="12" v-if="isLoading" />
      <v-alert v-else-if="errorMessage" type="error" variant="tonal" class="mb-4">{{ errorMessage }}</v-alert>
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
