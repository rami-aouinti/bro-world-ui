<script setup lang="ts">
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
</script>

<template>
  <v-container class="py-10" :max-width="props.maxWidth">
    <component
      :is="props.card ? 'v-card' : 'div'"
      :class="props.padding"
      :rounded="props.card ? props.rounded : undefined"
      :elevation="props.card ? props.elevation : undefined"
    >
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
    </component>
  </v-container>
</template>
