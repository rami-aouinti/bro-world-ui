<script setup lang="ts">
import { computed } from 'vue'
import UiCard from '~/components/ui/UiCard.vue'

interface Props {
  maxWidth?: string | number
  title?: string
  subtitle?: string
  card?: boolean
  elevation?: string | number
  rounded?: string | number | boolean
  padding?: string
  spacing?: 'compact' | 'comfortable' | 'spacious'
  surface?: 'default' | 'glass' | 'interactive' | 'metric' | 'hero'
  elevationPreset?: 'none' | 'soft' | 'raised'
}

const props = withDefaults(defineProps<Props>(), {
  maxWidth: undefined,
  title: undefined,
  subtitle: undefined,
  card: true,
  elevation: undefined,
  rounded: undefined,
  padding: undefined,
  spacing: 'comfortable',
  surface: 'default',
  elevationPreset: 'soft',
})

const spacingClass = computed(() => `ui-page-section--spacing-${props.spacing}`)
const cardPaddingClass = computed(() => {
  if (props.padding) {
    return props.padding
  }

  const fallback: Record<NonNullable<Props['spacing']>, string> = {
    compact: 'pa-4',
    comfortable: 'pa-6',
    spacious: 'pa-8',
  }

  return fallback[props.spacing]
})

const elevationByPreset: Record<NonNullable<Props['elevationPreset']>, number> = {
  none: 0,
  soft: 2,
  raised: 6,
}
const resolvedElevation = computed(() => props.elevation ?? elevationByPreset[props.elevationPreset])
</script>

<template>
  <v-container :max-width="props.maxWidth" class="ui-page-section" :class="spacingClass">
    <UiCard
      v-if="props.card"
      class="ui-page-section__card"
      :title="props.title"
      :subtitle="props.subtitle"
      :rounded="props.rounded"
      :elevation="resolvedElevation"
      :kind="props.surface"
      :class="cardPaddingClass"
    >
      <template v-if="$slots.header" #header>
        <slot name="header" />
      </template>

      <template v-if="$slots.actions" #actions>
        <slot name="actions" />
      </template>

      <slot />
    </UiCard>

    <div v-else :class="cardPaddingClass">
      <slot name="header">
        <div
          v-if="props.title || props.subtitle || $slots.actions"
          class="d-flex align-center justify-space-between ga-3 mb-4 flex-wrap"
        >
          <div>
            <h1 v-if="props.title" class="text-h5 font-weight-bold mb-2">{{ props.title }}</h1>
            <p v-if="props.subtitle" class="text-body-2 text-medium-emphasis">
              {{ props.subtitle }}
            </p>
          </div>

          <div v-if="$slots.actions" class="d-flex ga-2">
            <slot name="actions" />
          </div>
        </div>
      </slot>

      <slot />
    </div>
  </v-container>
</template>

<style scoped>
.ui-page-section__card {
  background-color: transparent !important;
}
</style>
