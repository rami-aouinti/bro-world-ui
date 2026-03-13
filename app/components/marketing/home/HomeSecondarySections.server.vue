<script setup lang="ts">
import type { HomePagePayload } from '~/types/api/page'
import UiCard from '~/components/ui/UiCard.vue'

defineProps<{
  payload: HomePagePayload
}>()
</script>

<template>
    <UiCard class="home-section mb-6" kind="default">
      <h2 class="text-h6 mb-4">{{ payload.featuresTitle }}</h2>
      <v-row density="compact">
        <v-col v-for="card in payload.featureCards" :key="card.title" cols="12" md="4">
          <UiCard class="home-feature-card h-100" kind="interactive" rounded="lg">
            <v-icon :icon="card.icon" class="home-feature-card__icon mb-3" />
            <h3 class="text-subtitle-1 font-weight-medium mb-2">{{ card.title }}</h3>
            <p class="text-body-2 text-medium-emphasis mb-0">{{ card.description }}</p>
          </UiCard>
        </v-col>
      </v-row>
    </UiCard>

    <UiCard class="home-section mb-6" kind="metric">
      <h2 class="text-h6 mb-4">{{ payload.metricsTitle }}</h2>
      <v-row density="compact">
        <v-col v-for="metric in payload.metrics" :key="metric.label" cols="12" md="4">
          <UiCard class="home-metric-card h-100" kind="metric" rounded="lg">
            <p class="home-metric-card__value text-h5 font-weight-bold mb-1">{{ metric.value }}</p>
            <p class="home-metric-card__label text-body-2 text-medium-emphasis mb-0">{{ metric.label }}</p>
          </UiCard>
        </v-col>
      </v-row>
    </UiCard>

    <UiCard class="home-section mb-6" kind="interactive">
      <h2 class="text-h6 mb-4">{{ payload.stepsTitle }}</h2>
      <v-row density="compact">
        <v-col v-for="(step, index) in payload.steps" :key="step.title" cols="12" md="4">
          <UiCard class="home-step-card h-100" kind="interactive" rounded="lg">
            <div class="d-flex align-center ga-2 mb-2">
              <v-icon :icon="step.icon" class="home-step-card__icon" />
              <p class="text-caption text-medium-emphasis mb-0">{{ payload.stepLabelPrefix }} {{ index + 1 }}</p>
            </div>
            <h3 class="text-subtitle-1 font-weight-medium mb-2">{{ step.title }}</h3>
            <p class="text-body-2 text-medium-emphasis mb-0">{{ step.description }}</p>
          </UiCard>
        </v-col>
      </v-row>
    </UiCard>

    <UiCard class="home-final-cta" kind="glass">
      <h2 class="text-h6 mb-2">{{ payload.cta.title }}</h2>
      <p class="text-body-2 text-medium-emphasis mb-4">{{ payload.cta.description }}</p>
      <div class="home-final-cta__actions">
        <v-btn class="home-final-cta__btn" color="primary">{{ payload.cta.primaryAction }}</v-btn>
        <v-btn class="home-final-cta__btn" variant="outlined">{{ payload.cta.secondaryAction }}</v-btn>
      </div>
    </UiCard>
</template>
