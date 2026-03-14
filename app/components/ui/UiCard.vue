<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  title?: string
  subtitle?: string
  loading?: boolean
  variant?: 'elevated' | 'flat' | 'tonal' | 'outlined' | 'text' | 'plain'
  rounded?: string | number | boolean
  radius?: string | number | boolean
  elevation?: string | number
  compact?: boolean
  kind?: 'default' | 'glass' | 'interactive' | 'metric' | 'hero'
  selected?: boolean
  error?: boolean
  success?: boolean
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  title: undefined,
  subtitle: undefined,
  loading: false,
  variant: undefined,
  rounded: undefined,
  radius: undefined,
  elevation: undefined,
  compact: false,
  kind: 'default',
  selected: false,
  error: false,
  success: false,
  disabled: false,
})

const kindPresets: Record<NonNullable<Props['kind']>, { variant: NonNullable<Props['variant']>, rounded: string | number | boolean, elevation: string | number }> = {
  default: { variant: 'elevated', rounded: '2xl', elevation: 2 },
  glass: { variant: 'flat', rounded: '2xl', elevation: 0 },
  interactive: { variant: 'outlined', rounded: 'xl', elevation: 0 },
  metric: { variant: 'tonal', rounded: 'xl', elevation: 0 },
  hero: { variant: 'elevated', rounded: 'xl', elevation: 4 },
}

const resolvedVariant = computed(() => props.variant ?? kindPresets[props.kind].variant)
const resolvedRounded = computed(() => props.rounded ?? props.radius ?? kindPresets[props.kind].rounded)
const resolvedElevation = computed(() => props.elevation ?? kindPresets[props.kind].elevation)

const stateClasses = computed(() => ({
  'ui-card--compact': props.compact,
  'ui-card--loading': props.loading,
  'ui-card--selected': props.selected,
  'ui-card--error': props.error,
  'ui-card--success': props.success,
  'ui-card--disabled': props.disabled,
  [`ui-card--kind-${props.kind}`]: true,
}))
</script>

<template>
  <v-card
    class="ui-card"
    :class="stateClasses"
    :variant="resolvedVariant"
    :rounded="resolvedRounded"
    :elevation="resolvedElevation"
    :loading="props.loading"
    :disabled="props.disabled"
    density="compact"
  >
    <slot name="header">
      <v-card-item
        v-if="props.title || props.subtitle"
        class="ui-card__header"
      >
        <v-card-title v-if="props.title" class="text-h6 font-weight-bold">
          {{ props.title }}
        </v-card-title>

        <v-card-subtitle v-if="props.subtitle">
          {{ props.subtitle }}
        </v-card-subtitle>
      </v-card-item>
    </slot>

    <v-card-text class="ui-card__content">
      <slot />
    </v-card-text>

    <v-card-actions v-if="$slots.actions" class="ui-card__actions">
      <slot name="actions" />
    </v-card-actions>

    <div v-if="$slots.footer" class="ui-card__footer">
      <slot name="footer" />
    </div>
  </v-card>
</template>

<style scoped>
.ui-card {
  transition:
    border-color var(--motion-fast) var(--easing-standard),
    box-shadow var(--motion-base) var(--easing-standard),
    transform var(--motion-base) var(--easing-emphasized),
    opacity var(--motion-fast) var(--easing-standard);
}

.ui-card__header,
.ui-card__content,
.ui-card__actions,
.ui-card__footer {
  padding-inline: 24px;
}

.ui-card__header,
.ui-card__content,
.ui-card__footer {
  padding-block: 16px;
}

.ui-card__actions {
  padding-block: 12px 16px;
}

.ui-card--kind-glass {
  backdrop-filter: blur(12px);
  background: color-mix(in srgb, rgb(var(--v-theme-surface)) 82%, transparent);
  border: 1px solid rgba(var(--v-theme-on-surface), 0.1);
}

.ui-card--kind-interactive:hover,
.ui-card--kind-interactive:focus-within {
  transform: translateY(-2px);
  border-color: rgba(var(--v-theme-primary), 0.35);
  box-shadow: 0 10px 20px rgba(var(--v-theme-primary), 0.1);
}

.ui-card--kind-metric {
  border: 1px solid rgba(var(--v-theme-primary), 0.18);
}

.ui-card--kind-hero {
  background: linear-gradient(135deg, rgba(var(--v-theme-primary), 0.14), rgba(var(--v-theme-surface), 0.95));
}

.ui-card--loading {
  pointer-events: none;
}

.ui-card--selected {
  border: 1px solid rgba(var(--v-theme-primary), 0.45);
  box-shadow: 0 0 0 2px rgba(var(--v-theme-primary), 0.18);
}

.ui-card--error {
  border: 1px solid rgba(var(--v-theme-error), 0.5);
  box-shadow: 0 0 0 2px rgba(var(--v-theme-error), 0.14);
}

.ui-card--success {
  border: 1px solid rgba(var(--v-theme-success), 0.45);
  box-shadow: 0 0 0 2px rgba(var(--v-theme-success), 0.14);
}

.ui-card--disabled {
  opacity: 0.62;
  filter: grayscale(0.1);
}

.ui-card--compact .ui-card__header,
.ui-card--compact .ui-card__content,
.ui-card--compact .ui-card__actions,
.ui-card--compact .ui-card__footer {
  padding-inline: 16px;
}

.ui-card--compact .ui-card__header,
.ui-card--compact .ui-card__content,
.ui-card--compact .ui-card__footer {
  padding-block: 10px;
}

.ui-card--compact .ui-card__actions {
  padding-block: 8px 12px;
}
</style>
