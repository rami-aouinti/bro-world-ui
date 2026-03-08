<script setup lang="ts">
definePageMeta({
  public: false,
  requiresAuth: true,
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

const { t, te } = useI18n()

const collectIndexedEntries = (basePath: string, leafKey: string, max = 24) => {
  const entries: number[] = []
  for (let index = 0; index < max; index += 1) {
    if (!te(`${basePath}.${index}.${leafKey}`)) {
      break
    }

    entries.push(index)
  }

  return entries
}

const collectIndexedStrings = (basePath: string, max = 24) => {
  const entries: string[] = []
  for (let index = 0; index < max; index += 1) {
    if (!te(`${basePath}.${index}`)) {
      break
    }

    entries.push(t(`${basePath}.${index}`))
  }

  return entries
}

const hero = computed<HomeHero>(() => {
  const bulletPath = te('home.hero.bullets.0') ? 'home.hero.bullets' : 'home.hero.benefits'

  return {
    badge: t('home.hero.badge'),
    title: t('home.hero.title'),
    subtitle: t('home.hero.subtitle'),
    primaryCta: t('home.hero.primaryCta'),
    secondaryCta: t('home.hero.secondaryCta'),
    benefits: collectIndexedStrings(bulletPath),
  }
})

const featureCards = computed<HomeFeatureCard[]>(() => {
  const basePath = te('home.featureCards.0.title') ? 'home.featureCards' : 'home.features'
  const indices = collectIndexedEntries(basePath, 'title')

  return indices.map(index => ({
    icon: t(`${basePath}.${index}.icon`),
    title: t(`${basePath}.${index}.title`),
    description: t(`${basePath}.${index}.description`),
  }))
})

const metrics = computed<HomeMetric[]>(() => {
  const indices = collectIndexedEntries('home.metrics', 'value')

  return indices.map(index => ({
    value: t(`home.metrics.${index}.value`),
    label: t(`home.metrics.${index}.label`),
  }))
})

const steps = computed<HomeStep[]>(() => {
  const indices = collectIndexedEntries('home.steps', 'title')

  return indices.map(index => ({
    icon: t(`home.steps.${index}.icon`),
    title: t(`home.steps.${index}.title`),
    description: t(`home.steps.${index}.description`),
  }))
})

const cta = computed<HomeCta>(() => {
  return {
    title: t('home.cta.title'),
    description: t('home.cta.description'),
    primaryAction: t('home.cta.primaryAction'),
    secondaryAction: t('home.cta.secondaryAction'),
  }
})
</script>

<template>
  <main class="home-page">
    <v-fade-transition appear>
      <v-card class="home-hero mb-6" rounded="xl" elevation="4" hover>
        <v-chip class="home-hero__badge mb-4" color="primary" variant="tonal">
          {{ hero.badge }}
        </v-chip>

        <h1 class="text-h4 text-md-h3 font-weight-bold mb-2">{{ hero.title }}</h1>
        <p class="text-body-1 text-medium-emphasis mb-5">{{ hero.subtitle }}</p>

        <div class="home-hero__actions mb-5">
          <v-btn class="home-hero__btn" color="primary" size="large">{{ hero.primaryCta }}</v-btn>
          <v-btn class="home-hero__btn" variant="outlined" size="large">{{ hero.secondaryCta }}</v-btn>
        </div>

        <ul class="home-hero__benefits text-body-2 ps-5 mb-0">
          <li v-for="benefit in hero.benefits" :key="benefit" class="mb-1">{{ benefit }}</li>
        </ul>
      </v-card>
    </v-fade-transition>

    <v-card class="home-section mb-6" rounded="xl">
      <h2 class="text-h6 mb-4">{{ t('home.featuresTitle') }}</h2>
      <v-row density="compact">
        <v-col v-for="card in featureCards" :key="card.title" cols="12" md="4">
          <v-card class="home-feature-card h-100" rounded="lg" hover variant="outlined">
            <v-icon :icon="card.icon" class="home-feature-card__icon mb-3" />
            <h3 class="text-subtitle-1 font-weight-medium mb-2">{{ card.title }}</h3>
            <p class="text-body-2 text-medium-emphasis mb-0">{{ card.description }}</p>
          </v-card>
        </v-col>
      </v-row>
    </v-card>

    <v-expand-transition>
      <v-card class="home-section mb-6" rounded="xl" variant="tonal">
        <h2 class="text-h6 mb-4">{{ t('home.metricsTitle') }}</h2>
        <v-row density="compact">
          <v-col v-for="metric in metrics" :key="metric.label" cols="12" md="4">
            <v-card class="home-metric-card h-100" rounded="lg" variant="flat">
              <p class="home-metric-card__value text-h5 font-weight-bold mb-1">{{ metric.value }}</p>
              <p class="home-metric-card__label text-body-2 text-medium-emphasis mb-0">{{ metric.label }}</p>
            </v-card>
          </v-col>
        </v-row>
      </v-card>
    </v-expand-transition>

    <v-expand-transition>
      <v-card class="home-section mb-6" rounded="xl" variant="outlined">
        <h2 class="text-h6 mb-4">{{ t('home.stepsTitle') }}</h2>
        <v-row density="compact">
          <v-col v-for="(step, index) in steps" :key="step.title" cols="12" md="4">
            <v-card class="home-step-card h-100" rounded="lg">
              <div class="d-flex align-center ga-2 mb-2">
                <v-icon :icon="step.icon" class="home-step-card__icon" />
                <p class="text-caption text-medium-emphasis mb-0">{{ t('home.stepLabel', { index: index + 1 }) }}</p>
              </div>
              <h3 class="text-subtitle-1 font-weight-medium mb-2">{{ step.title }}</h3>
              <p class="text-body-2 text-medium-emphasis mb-0">{{ step.description }}</p>
            </v-card>
          </v-col>
        </v-row>
      </v-card>
    </v-expand-transition>

    <v-fade-transition>
      <v-card class="home-final-cta" rounded="xl" elevation="2">
        <h2 class="text-h6 mb-2">{{ cta.title }}</h2>
        <p class="text-body-2 text-medium-emphasis mb-4">{{ cta.description }}</p>
        <div class="home-final-cta__actions">
          <v-btn class="home-final-cta__btn" color="primary">{{ cta.primaryAction }}</v-btn>
          <v-btn class="home-final-cta__btn" variant="outlined">{{ cta.secondaryAction }}</v-btn>
        </div>
      </v-card>
    </v-fade-transition>
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
