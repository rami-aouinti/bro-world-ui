<script setup lang="ts">
interface Props {
  title?: string
  subtitle?: string
  loading?: boolean
  variant?: 'elevated' | 'flat' | 'tonal' | 'outlined' | 'text' | 'plain'
  rounded?: string | number | boolean
  elevation?: string | number
  compact?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  title: undefined,
  subtitle: undefined,
  loading: false,
  variant: 'elevated',
  rounded: '2xl',
  elevation: 2,
  compact: false,
})
</script>

<template>
  <v-card
    class="ui-card"
    :class="{ 'ui-card--compact': props.compact }"
    :variant="props.variant"
    :rounded="props.rounded"
    :elevation="props.elevation"
    :loading="props.loading"
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
