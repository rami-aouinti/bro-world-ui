<script setup lang="ts">
import BlogFeed from '~/components/plugins/BlogFeed.vue'
import BlogSummaryCard from '~/components/plugins/BlogSummaryCard.vue'
import { useBlogsStore } from '~/stores/blogs'

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
    excerpt: 'Flexibilité, impact et progression rapide: trois signaux forts qui transforment la stratégie RH.',
    category: 'Talent & RH',
    readTime: '6 min',
    trend: '+18% engagement',
  },
  {
    title: 'Design produit: 5 rituels d’équipe pour réduire le churn dès le premier mois',
    excerpt: 'Des ateliers courts orientés onboarding permettent de corriger les frictions avant qu’elles ne coûtent cher.',
    category: 'Product Design',
    readTime: '8 min',
    trend: '-12% churn',
  },
  {
    title: 'Comment industrialiser le contenu de marque sans perdre votre voix',
    excerpt: 'Une architecture éditoriale claire aide à accélérer la production sans sacrifier la qualité.',
    category: 'Brand & Content',
    readTime: '5 min',
    trend: '+2.4x production',
  },
]

const roadmapAnnouncements: MockAnnouncement[] = [
  { title: 'Ouverture du module “Guest Authors”', date: 'Semaine 14', tag: 'Roadmap' },
  { title: 'Nouveau format “Case Study vidéo”', date: 'Semaine 16', tag: 'Contenu' },
  { title: 'Connexion analytics avancée (beta)', date: 'Semaine 19', tag: 'Data' },
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

        <v-card rounded="xl" variant="tonal" class="pa-4">
          <p class="text-overline mb-2 text-primary">Roadmap éditoriale</p>
          <div class="d-flex flex-column ga-3">
            <div v-for="announcement in roadmapAnnouncements" :key="announcement.title" class="announcement-item">
              <div class="d-flex align-center justify-space-between ga-2 mb-1">
                <span class="text-caption text-medium-emphasis">{{ announcement.date }}</span>
                <v-chip size="x-small" color="primary" variant="flat">{{ announcement.tag }}</v-chip>
              </div>
              <p class="text-body-2 mb-0">{{ announcement.title }}</p>
            </div>
          </div>
        </v-card>
      </div>
    </template>

    <main>
      <section class="blog-hero mb-6 pa-6 pa-md-8">
        <p class="text-overline text-primary mb-2">Magazine Bro World</p>
        <h1 class="text-h4 text-md-h3 font-weight-bold mb-3">Un blog plus riche pour préparer votre futur backend</h1>
        <p class="text-body-1 text-medium-emphasis mb-5 hero-description">
          Cette version intègre une structure éditoriale plus complète avec des cartes d’insights, des thèmes clés
          et une roadmap de publication pour visualiser clairement la direction produit et contenu.
        </p>

        <div class="d-flex flex-wrap ga-2 mb-3">
          <v-chip
            v-for="topic in keyTopics"
            :key="topic"
            size="small"
            variant="outlined"
            prepend-icon="mdi-pound"
          >
            {{ topic }}
          </v-chip>
        </div>
      </section>

      <v-progress-linear v-if="isLoading" color="primary" indeterminate class="mb-4" />
      <v-alert v-else-if="errorMessage" type="error" variant="tonal" class="mb-4">{{ errorMessage }}</v-alert>
      <BlogFeed v-else-if="blog" :blog="blog" :show-summary="false" :can-interact="isAuthenticated" />

      <div v-if="blog && hasMorePosts" ref="infiniteSentinel" class="infinite-sentinel py-4">
        <v-progress-circular v-if="isLoadingMore" indeterminate color="primary" size="22" />
      </div>

      <section class="mt-8">
        <div class="d-flex align-center justify-space-between mb-4 ga-3 flex-wrap">
          <h2 class="text-h6 text-md-h5 font-weight-bold mb-0">Insights complémentaires (fake data)</h2>
          <v-chip size="small" color="secondary" variant="flat">Pré-backend</v-chip>
        </div>

        <v-row>
          <v-col v-for="insight in editorialInsights" :key="insight.title" cols="12" md="4">
            <v-card rounded="xl" class="h-100 pa-4 insight-card" variant="outlined">
              <div class="d-flex align-center justify-space-between ga-2 mb-3">
                <v-chip size="x-small" color="primary" variant="flat">{{ insight.category }}</v-chip>
                <span class="text-caption text-medium-emphasis">{{ insight.readTime }}</span>
              </div>
              <h3 class="text-subtitle-1 font-weight-bold mb-2">{{ insight.title }}</h3>
              <p class="text-body-2 text-medium-emphasis mb-4">{{ insight.excerpt }}</p>
              <v-alert type="success" density="compact" variant="tonal" class="mb-0">{{ insight.trend }}</v-alert>
            </v-card>
          </v-col>
        </v-row>
      </section>
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
