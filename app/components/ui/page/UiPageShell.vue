<script setup lang="ts">
import UiStateEmptyState from '~/components/ui/state/UiEmptyState.vue'

interface Props {
  title: string
  subtitle?: string
  eyebrow?: string
  icon?: string
  maxWidth?: string | number
  empty?: boolean
  emptyTitle?: string
  emptyDescription?: string
  emptyIcon?: string
}

const props = withDefaults(defineProps<Props>(), {
  subtitle: '',
  eyebrow: '',
  icon: '',
  maxWidth: 1200,
  empty: false,
  emptyTitle: '',
  emptyDescription: '',
  emptyIcon: 'mdi-information-outline',
})
</script>

<template>
  <UiPageSection :max-width="props.maxWidth">
    <v-card class="ui-page-shell__header pa-5 pa-md-7 mb-5 rounded-xl" elevation="2">
      <div class="d-flex align-start justify-space-between ga-4 flex-wrap">
        <div class="ui-page-shell__heading">
          <p v-if="props.eyebrow" class="text-overline text-primary mb-2">{{ props.eyebrow }}</p>
          <h1 class="text-h5 text-md-h4 font-weight-bold mb-2 d-flex align-center ga-2">
            <v-icon v-if="props.icon" :icon="props.icon" color="primary" />
            {{ props.title }}
          </h1>
          <p v-if="props.subtitle" class="text-body-1 text-medium-emphasis mb-0">
            {{ props.subtitle }}
          </p>
        </div>

        <div v-if="$slots.actions" class="ui-page-shell__actions">
          <slot name="actions" />
        </div>
      </div>
    </v-card>

    <UiStateEmptyState
      v-if="props.empty"
      :title="props.emptyTitle || props.title"
      :description="props.emptyDescription"
      :icon="props.emptyIcon"
      class="ui-page-shell__empty"
    >
      <template v-if="$slots.emptyAction" #action>
        <slot name="emptyAction" />
      </template>
    </UiStateEmptyState>

    <div v-else class="ui-page-shell__content">
      <slot />
    </div>
  </UiPageSection>
</template>

<style scoped>
.ui-page-shell__actions {
  width: 100%;
}

.ui-page-shell__content {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.ui-page-shell__empty {
  border: 1px dashed rgba(var(--v-theme-on-surface), 0.2);
  border-radius: 16px;
  background: rgba(var(--v-theme-surface-variant), 0.25);
}

@media (min-width: 960px) {
  .ui-page-shell__actions {
    width: auto;
  }
}
</style>
