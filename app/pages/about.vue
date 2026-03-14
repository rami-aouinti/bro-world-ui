<script setup lang="ts">
import { usePublicPagesStore } from '~/stores/publicPages'

definePageMeta({
  public: true,
  requiresAuth: false,
  splitShell: false,
})

interface AboutHero {
  badge: string
  title: string
  subtitle: string
  paragraphs: string[]
  bullets: string[]
  primaryCta: string
  secondaryCta: string
}

interface AboutMissionCard {
  title: string
  description: string
  paragraphs: string[]
  bullets: string[]
  icon: string
}

interface AboutMetric {
  value: string
  label: string
  context: string
  icon: string
}

interface AboutTimelineItem {
  title: string
  period: string
  description: string
  highlights: string[]
  icon: string
}

interface AboutCta {
  title: string
  description: string
  primaryAction: string
  secondaryAction: string
}

interface AboutPagePayload {
  hero: AboutHero
  metricsTitle: string
  missionCards: AboutMissionCard[]
  metrics: AboutMetric[]
  timelineTitle: string
  timeline: AboutTimelineItem[]
  cta: AboutCta
}

// Mock API response (GET /api/public/pages/about)
const aboutPagePayload = ref<AboutPagePayload>({
  hero: {
    badge: 'About',
    title: 'We help teams launch faster',
    subtitle: 'Page driven by mocked JSON to prepare the backend contract.',
    paragraphs: [
      'This section represents the hero block the backend must return.',
      'Each visible field here is an example of dynamic data from an endpoint.',
    ],
    bullets: [
      'Positionnement produit',
      'Proposition de valeur',
      'Actions principales',
    ],
    primaryCta: 'Request a demo',
    secondaryCta: 'Voir la roadmap',
  },
  metricsTitle: 'Key figures',
  missionCards: [
    {
      title: 'Mission',
      description: 'What we want to achieve in the long term.',
      paragraphs: ['Rendre la collaboration produit plus simple.', 'Collapse le temps de mise en production.'],
      bullets: ['Quality', 'Vitesse', 'Transparence'],
      icon: 'mdi-rocket-launch-outline',
    },
    {
      title: 'Valeurs',
      description: 'Operating principles for the team and clients.',
      paragraphs: ['Data-driven decisions.', 'Continuous user feedback.'],
      bullets: ['Ownership', 'Empathy', 'Continuous improvement'],
      icon: 'mdi-hand-heart-outline',
    },
  ],
  metrics: [
    { value: '120+', label: 'Delivered projects', context: 'over the last 24 months', icon: 'mdi-briefcase-outline' },
    { value: '98%', label: 'Satisfaction client', context: 'NPS trimestriel', icon: 'mdi-thumb-up-outline' },
    { value: '35%', label: 'Productivity gain', context: 'average observed', icon: 'mdi-chart-line' },
  ],
  timelineTitle: 'Timeline',
  timeline: [
    {
      title: 'Platform launch',
      period: '2022',
      description: 'First public version with core features.',
      highlights: ['User management', 'Dashboard', 'Secure auth'],
      icon: 'mdi-flag-outline',
    },
    {
      title: 'Ouverture API',
      period: '2024',
      description: 'Public APIs made available for integrations.',
      highlights: ['Documented endpoints', 'API keys', 'Webhooks'],
      icon: 'mdi-api',
    },
  ],
  cta: {
    title: 'Construisons la suite ensemble',
    description: 'This block prepares footer information fetched from the backend.',
    primaryAction: 'Talk to an expert',
    secondaryAction: 'Download brochure',
  },
})

const publicPagesStore = usePublicPagesStore()
const { locale } = useI18n()
const isLoading = ref(true)

const loadPageContent = async () => {
  isLoading.value = true
  try {
    aboutPagePayload.value = await publicPagesStore.loadAbout(locale.value)
  }
  finally {
    isLoading.value = false
  }
}

onMounted(loadPageContent)
watch(locale, loadPageContent)
</script>

<template>
  <main class="about-page">
    <template v-if="isLoading">
      <v-card class="about-hero mb-6" rounded="xl">
        <v-skeleton-loader type="chip" class="mb-3" />
        <v-skeleton-loader type="heading" class="mb-2" />
        <v-skeleton-loader type="text@4" class="mb-4" />
        <v-skeleton-loader type="button@2" />
      </v-card>

      <v-row class="mb-4" dense>
        <v-col v-for="index in 2" :key="`mission-skeleton-${index}`" cols="12" md="6">
          <v-card rounded="xl" class="pa-4 h-100">
            <v-skeleton-loader type="heading" class="mb-2" />
            <v-skeleton-loader type="text@5" />
          </v-card>
        </v-col>
      </v-row>

      <v-card class="mb-6" rounded="xl">
        <v-skeleton-loader type="heading" class="mb-3" />
        <v-skeleton-loader type="list-item-three-line@3" />
      </v-card>
    </template>

    <template v-else>
    <v-fade-transition appear>
      <v-card class="about-hero mb-6 transition-elevation" elevation="4" rounded="xl" hover>
        <v-chip class="about-hero__badge" color="primary" variant="tonal">
          {{ aboutPagePayload.hero.badge }}
        </v-chip>

        <h1 class="text-h4 text-md-h3 font-weight-bold mb-2">{{ aboutPagePayload.hero.title }}</h1>
        <p class="text-body-1 text-medium-emphasis mb-4">{{ aboutPagePayload.hero.subtitle }}</p>

        <p v-for="paragraph in aboutPagePayload.hero.paragraphs" :key="paragraph" class="text-body-2 text-medium-emphasis mb-3">
          {{ paragraph }}
        </p>

        <ul class="text-body-2 mb-6 ps-5">
          <li v-for="bullet in aboutPagePayload.hero.bullets" :key="bullet" class="mb-1">{{ bullet }}</li>
        </ul>

        <div class="about-hero__actions">
          <v-btn class="about-hero__btn" color="primary" size="large">{{ aboutPagePayload.hero.primaryCta }}</v-btn>
          <v-btn class="about-hero__btn" variant="outlined" size="large">{{ aboutPagePayload.hero.secondaryCta }}</v-btn>
        </div>
      </v-card>
    </v-fade-transition>

    <v-row class="about-section about-section--cards mb-4" dense>
      <v-col v-for="card in aboutPagePayload.missionCards" :key="card.title" cols="12" md="6">
        <v-card class="about-mission-card h-100" rounded="xl" hover>
          <div class="d-flex align-center ga-2 mb-2">
            <v-icon :icon="card.icon" class="about-mission-card__icon" />
            <h2 class="text-h6">{{ card.title }}</h2>
          </div>
          <p class="text-body-2 mb-3">{{ card.description }}</p>
          <p v-for="paragraph in card.paragraphs" :key="`${card.title}-${paragraph}`" class="text-body-2 text-medium-emphasis mb-2">
            {{ paragraph }}
          </p>
          <ul class="text-body-2 ps-5 mb-0">
            <li v-for="bullet in card.bullets" :key="`${card.title}-${bullet}`" class="mb-1">{{ bullet }}</li>
          </ul>
        </v-card>
      </v-col>
    </v-row>

    <v-card class="about-section mb-6" rounded="xl">
      <h2 class="text-h6 mb-4">{{ aboutPagePayload.metricsTitle }}</h2>
      <v-row class="about-values-grid" dense>
        <v-col v-for="metric in aboutPagePayload.metrics" :key="metric.label" cols="12" sm="4">
          <div class="about-metric-card rounded-lg">
            <div class="d-flex align-center ga-3">
              <v-icon :icon="metric.icon" class="about-value-card__icon" />
              <div>
                <div class="about-metric-card__value">{{ metric.value }}</div>
                <div class="about-metric-card__label">{{ metric.label }}</div>
                <div class="text-caption text-medium-emphasis">{{ metric.context }}</div>
              </div>
            </div>
          </div>
        </v-col>
      </v-row>
    </v-card>

    <v-expand-transition>
      <v-card class="about-section" rounded="xl" variant="outlined">
        <h2 class="text-h6 mb-4">{{ aboutPagePayload.timelineTitle }}</h2>
        <v-timeline class="about-timeline" density="compact" side="end" truncate-line="both">
          <v-timeline-item
            v-for="entry in aboutPagePayload.timeline"
            :key="entry.title"
            :dot-icon="entry.icon"
            fill-dot
            size="small"
          >
            <v-card class="about-timeline-card" rounded="lg" hover>
              <p class="text-caption text-medium-emphasis mb-1">{{ entry.period }}</p>
              <p class="text-subtitle-1 font-weight-medium mb-2">{{ entry.title }}</p>
              <p class="text-body-2 mb-2">{{ entry.description }}</p>
              <ul class="text-body-2 ps-5 mb-0">
                <li v-for="highlight in entry.highlights" :key="`${entry.title}-${highlight}`">{{ highlight }}</li>
              </ul>
            </v-card>
          </v-timeline-item>
        </v-timeline>
      </v-card>
    </v-expand-transition>

    <v-fade-transition>
      <v-card class="about-section about-section--cta mt-6" rounded="xl" variant="tonal">
        <h2 class="text-h6 mb-2">{{ aboutPagePayload.cta.title }}</h2>
        <p class="text-body-2 text-medium-emphasis mb-4">{{ aboutPagePayload.cta.description }}</p>
        <div class="about-cta-actions">
          <v-btn class="about-cta-actions__btn" color="primary">{{ aboutPagePayload.cta.primaryAction }}</v-btn>
          <v-btn class="about-cta-actions__btn" variant="outlined">{{ aboutPagePayload.cta.secondaryAction }}</v-btn>
        </div>
      </v-card>
    </v-fade-transition>
    </template>
  </main>
</template>
<style scoped>
.about-timeline-card,
.about-section,
.about-mission-card,
.about-hero {
  padding: 1rem;
}
.about-page {
  padding: 3.5rem;
}
</style>
