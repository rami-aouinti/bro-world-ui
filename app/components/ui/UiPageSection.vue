<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  maxWidth?: string | number
  title?: string
  subtitle?: string
  card?: boolean
  elevation?: string | number
  rounded?: string | number | boolean
  padding?: string
}

const props = withDefaults(defineProps<Props>(), {
  maxWidth: undefined,
  title: undefined,
  subtitle: undefined,
  card: true,
  elevation: 2,
  rounded: 'xl',
  padding: 'pa-6',
})

const cardPaddingClass = computed(() => (props.padding === 'pa-6' ? undefined : props.padding))
</script>

<template>
  <v-container class="py-10" :max-width="props.maxWidth">
    <UiCard
      v-if="props.card"
      :title="props.title"
      :subtitle="props.subtitle"
      :rounded="props.rounded"
      :elevation="props.elevation"
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

    <div v-else :class="props.padding">
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
