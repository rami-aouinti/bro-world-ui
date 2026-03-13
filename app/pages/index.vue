<script setup lang="ts">
import UiCard from '~/components/ui/UiCard.vue'
import { usePublicPagesStore } from '~/stores/publicPages'

definePageMeta({
  public: true,
  requiresAuth: false,
  splitShell: false,
})

interface HomeHero {
  badge: string
  title: string
  subtitle: string
  primaryCta: string
  secondaryCta: string
  benefits: string[]
}

interface HomeFeatureCard {
  icon: string
  title: string
  description: string
}

interface HomeMetric {
  value: string
  label: string
}

interface HomeStep {
  title: string
  description: string
  icon: string
}

interface HomeCta {
  title: string
  description: string
  primaryAction: string
  secondaryAction: string
}

interface HomePagePayload {
  featuresTitle: string
  metricsTitle: string
  stepsTitle: string
  stepLabelPrefix: string
  hero: HomeHero
  featureCards: HomeFeatureCard[]
  metrics: HomeMetric[]
  steps: HomeStep[]
  cta: HomeCta
}

const publicPagesStore = usePublicPagesStore()
const { locale, t } = useI18n()

// Mock API response (GET /api/private/pages/home)
const homePagePayload = ref<HomePagePayload>({
  featuresTitle: t('home.featuresTitle'),
  metricsTitle: t('home.metricsTitle'),
  stepsTitle: t('home.stepsTitle'),
  stepLabelPrefix: t('home.stepLabel', { index: '{index}' }).replace('{index}', '').trim() || 'Step',
  hero: {
    badge: t('home.hero.badge'),
    title: t('home.hero.title'),
    subtitle: t('home.hero.subtitle'),
    primaryCta: t('home.hero.primaryCta'),
    secondaryCta: t('home.hero.secondaryCta'),
    benefits: [t('home.hero.bullets.0'), t('home.hero.bullets.1'), t('home.hero.bullets.2')],
  },
  featureCards: [
    {
      icon: 'mdi-view-dashboard-outline',
      title: t('home.features.0.title'),
      description: t('home.features.0.description'),
    },
    {
      icon: 'mdi-account-group-outline',
      title: t('home.features.1.title'),
      description: t('home.features.1.description'),
    },
    {
      icon: 'mdi-shield-check-outline',
      title: t('home.features.2.title'),
      description: t('home.features.2.description'),
    },
  ],
  metrics: [
    { value: t('home.metrics.0.value'), label: t('home.metrics.0.label') },
    { value: t('home.metrics.1.value'), label: t('home.metrics.1.label') },
    { value: t('home.metrics.2.value'), label: t('home.metrics.2.label') },
  ],
  steps: [
    {
      icon: 'mdi-account-plus-outline',
      title: t('home.steps.0.title'),
      description: t('home.steps.0.description'),
    },
    {
      icon: 'mdi-tune-variant',
      title: t('home.steps.1.title'),
      description: t('home.steps.1.description'),
    },
    {
      icon: 'mdi-chart-areaspline',
      title: t('home.steps.2.title'),
      description: t('home.steps.2.description'),
    },
  ],
  cta: {
    title: t('home.cta.title'),
    description: t('home.cta.description'),
    primaryAction: t('home.cta.primaryAction'),
    secondaryAction: t('home.cta.secondaryAction'),
  },
})

const isLoading = ref(true)

const loadPageContent = async () => {
  isLoading.value = true
  try {
    homePagePayload.value = await publicPagesStore.loadHome(locale.value)
  }
  finally {
    isLoading.value = false
  }
}

onMounted(loadPageContent)
watch(locale, loadPageContent)
</script>

<template>
  <main class="home-page">
    <template v-if="isLoading">
      <v-card class="home-hero mb-6" rounded="xl">
        <v-skeleton-loader type="chip" class="mb-4" />
        <v-skeleton-loader type="heading" class="mb-2" />
        <v-skeleton-loader type="text@2" class="mb-4" />
        <v-skeleton-loader type="button@2" class="mb-4" />
        <v-skeleton-loader type="list-item-two-line@3" />
      </v-card>

      <v-card class="home-section mb-6" rounded="xl">
        <v-skeleton-loader type="heading" class="mb-4" />
        <v-row>
          <v-col v-for="index in 3" :key="`feature-skeleton-${index}`" cols="12" md="4">
            <v-skeleton-loader type="card" />
          </v-col>
        </v-row>
      </v-card>

      <v-card class="home-section mb-6" rounded="xl">
        <v-skeleton-loader type="heading" class="mb-4" />
        <v-row>
          <v-col v-for="index in 3" :key="`metric-skeleton-${index}`" cols="12" md="4">
            <v-skeleton-loader type="list-item-two-line" />
          </v-col>
        </v-row>
      </v-card>
    </template>

    <template v-else>
    <v-fade-transition appear>
      <UiCard class="home-hero mb-6" kind="hero">
        <v-chip class="home-hero__badge mb-4" color="primary" variant="tonal">
          {{ homePagePayload.hero.badge }}
        </v-chip>

        <h1 class="text-h4 text-md-h3 font-weight-bold mb-2">{{ homePagePayload.hero.title }}</h1>
        <p class="text-body-1 text-medium-emphasis mb-5">{{ homePagePayload.hero.subtitle }}</p>

        <div class="home-hero__actions mb-5">
          <v-btn class="home-hero__btn" color="primary" size="large">{{ homePagePayload.hero.primaryCta }}</v-btn>
          <v-btn class="home-hero__btn" variant="outlined" size="large">{{ homePagePayload.hero.secondaryCta }}</v-btn>
        </div>

        <ul class="home-hero__benefits text-body-2 ps-5 mb-0">
          <li v-for="benefit in homePagePayload.hero.benefits" :key="benefit" class="mb-1">{{ benefit }}</li>
        </ul>
      </UiCard>
    </v-fade-transition>

    <UiCard class="home-section mb-6" kind="default">
      <h2 class="text-h6 mb-4">{{ homePagePayload.featuresTitle }}</h2>
      <v-row density="compact">
        <v-col v-for="card in homePagePayload.featureCards" :key="card.title" cols="12" md="4">
          <UiCard class="home-feature-card h-100" kind="interactive" rounded="lg">
            <v-icon :icon="card.icon" class="home-feature-card__icon mb-3" />
            <h3 class="text-subtitle-1 font-weight-medium mb-2">{{ card.title }}</h3>
            <p class="text-body-2 text-medium-emphasis mb-0">{{ card.description }}</p>
          </UiCard>
        </v-col>
      </v-row>
    </UiCard>

    <v-expand-transition>
      <UiCard class="home-section mb-6" kind="metric">
        <h2 class="text-h6 mb-4">{{ homePagePayload.metricsTitle }}</h2>
        <v-row density="compact">
          <v-col v-for="metric in homePagePayload.metrics" :key="metric.label" cols="12" md="4">
            <UiCard class="home-metric-card h-100" kind="metric" rounded="lg">
              <p class="home-metric-card__value text-h5 font-weight-bold mb-1">{{ metric.value }}</p>
              <p class="home-metric-card__label text-body-2 text-medium-emphasis mb-0">{{ metric.label }}</p>
            </UiCard>
          </v-col>
        </v-row>
      </UiCard>
    </v-expand-transition>

    <v-expand-transition>
      <UiCard class="home-section mb-6" kind="interactive">
        <h2 class="text-h6 mb-4">{{ homePagePayload.stepsTitle }}</h2>
        <v-row density="compact">
          <v-col v-for="(step, index) in homePagePayload.steps" :key="step.title" cols="12" md="4">
            <UiCard class="home-step-card h-100" kind="interactive" rounded="lg">
              <div class="d-flex align-center ga-2 mb-2">
                <v-icon :icon="step.icon" class="home-step-card__icon" />
                <p class="text-caption text-medium-emphasis mb-0">{{ homePagePayload.stepLabelPrefix }} {{ index + 1 }}</p>
              </div>
              <h3 class="text-subtitle-1 font-weight-medium mb-2">{{ step.title }}</h3>
              <p class="text-body-2 text-medium-emphasis mb-0">{{ step.description }}</p>
            </UiCard>
          </v-col>
        </v-row>
      </UiCard>
    </v-expand-transition>

    <v-fade-transition>
      <UiCard class="home-final-cta" kind="glass">
        <h2 class="text-h6 mb-2">{{ homePagePayload.cta.title }}</h2>
        <p class="text-body-2 text-medium-emphasis mb-4">{{ homePagePayload.cta.description }}</p>
        <div class="home-final-cta__actions">
          <v-btn class="home-final-cta__btn" color="primary">{{ homePagePayload.cta.primaryAction }}</v-btn>
          <v-btn class="home-final-cta__btn" variant="outlined">{{ homePagePayload.cta.secondaryAction }}</v-btn>
        </div>
      </UiCard>
    </v-fade-transition>
    </template>
  </main>
</template>

<style scoped>
.home-page {
  padding: 3.5rem;
}

.home-hero,
.home-section,
.home-final-cta {
  padding: 1.5rem;
}

.home-hero__actions,
.home-final-cta__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.home-hero__btn,
.home-final-cta__btn {
  min-width: 12rem;
}

.home-feature-card,
.home-metric-card,
.home-step-card {
  padding: 1rem;
}

.home-feature-card__icon,
.home-step-card__icon {
  color: rgb(var(--v-theme-primary));
}
</style>
