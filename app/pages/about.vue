<script setup lang="ts">
import UiPageSection from '~/components/ui/UiPageSection.vue'

definePageMeta({
  public: true,
  requiresAuth: false,
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

const { t, tm, rt } = useI18n()

const resolveText = (message: unknown) => rt(message as string)

const hero = computed<AboutHero>(() => {
  const rawHero = tm('about.hero') as AboutHero

  return {
    ...rawHero,
    badge: resolveText(rawHero.badge),
    title: resolveText(rawHero.title),
    subtitle: resolveText(rawHero.subtitle),
    paragraphs: rawHero.paragraphs.map(resolveText),
    bullets: rawHero.bullets.map(resolveText),
    primaryCta: resolveText(rawHero.primaryCta),
    secondaryCta: resolveText(rawHero.secondaryCta),
  }
})

const missionCards = computed<AboutMissionCard[]>(() => {
  const rawMissionCards = tm('about.missionCards') as AboutMissionCard[]

  return rawMissionCards.map((card) => ({
    ...card,
    title: resolveText(card.title),
    description: resolveText(card.description),
    paragraphs: card.paragraphs.map(resolveText),
    bullets: card.bullets.map(resolveText),
  }))
})

const metrics = computed<AboutMetric[]>(() => {
  const rawMetrics = tm('about.metrics') as AboutMetric[]

  return rawMetrics.map((metric) => ({
    ...metric,
    value: resolveText(metric.value),
    label: resolveText(metric.label),
    context: resolveText(metric.context),
  }))
})

const timeline = computed<AboutTimelineItem[]>(() => {
  const rawTimeline = tm('about.timeline') as AboutTimelineItem[]

  return rawTimeline.map((entry) => ({
    ...entry,
    title: resolveText(entry.title),
    period: resolveText(entry.period),
    description: resolveText(entry.description),
    highlights: entry.highlights.map(resolveText),
  }))
})

const cta = computed<AboutCta>(() => {
  const rawCta = tm('about.cta') as AboutCta

  return {
    ...rawCta,
    title: resolveText(rawCta.title),
    description: resolveText(rawCta.description),
    primaryAction: resolveText(rawCta.primaryAction),
    secondaryAction: resolveText(rawCta.secondaryAction),
  }
})
</script>

<template>
  <main class="about-page py-12 py-md-16">
    <UiPageSection class="about-container" max-width="1100">
      <v-fade-transition appear>
        <v-card class="about-hero mb-6 transition-elevation" elevation="4" rounded="xl" hover>
          <v-chip class="about-hero__badge" color="primary" variant="tonal">
            {{ hero.badge }}
          </v-chip>

          <h1 class="text-h4 text-md-h3 font-weight-bold mb-2">{{ hero.title }}</h1>
          <p class="text-body-1 text-medium-emphasis mb-4">{{ hero.subtitle }}</p>

          <p v-for="paragraph in hero.paragraphs" :key="paragraph" class="text-body-2 text-medium-emphasis mb-3">
            {{ paragraph }}
          </p>

          <ul class="text-body-2 mb-6 ps-5">
            <li v-for="bullet in hero.bullets" :key="bullet" class="mb-1">{{ bullet }}</li>
          </ul>

          <div class="about-hero__actions">
            <v-btn class="about-hero__btn" color="primary" size="large">{{ hero.primaryCta }}</v-btn>
            <v-btn class="about-hero__btn" variant="outlined" size="large">{{ hero.secondaryCta }}</v-btn>
          </div>
        </v-card>
      </v-fade-transition>

      <v-row class="about-section about-section--cards mb-4" dense>
        <v-col v-for="card in missionCards" :key="card.title" cols="12" md="6">
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
        <h2 class="text-h6 mb-4">{{ t('about.metricsTitle') }}</h2>
        <v-row class="about-values-grid" dense>
          <v-col v-for="metric in metrics" :key="metric.label" cols="12" sm="4">
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
          <h2 class="text-h6 mb-4">{{ t('about.timelineTitle') }}</h2>
          <v-timeline class="about-timeline" density="compact" side="end" truncate-line="both">
            <v-timeline-item
              v-for="entry in timeline"
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
          <h2 class="text-h6 mb-2">{{ cta.title }}</h2>
          <p class="text-body-2 text-medium-emphasis mb-4">{{ cta.description }}</p>
          <div class="about-cta-actions">
            <v-btn class="about-cta-actions__btn" color="primary">{{ cta.primaryAction }}</v-btn>
            <v-btn class="about-cta-actions__btn" variant="outlined">{{ cta.secondaryAction }}</v-btn>
          </div>
        </v-card>
      </v-fade-transition>
    </UiPageSection>
  </main>
</template>
