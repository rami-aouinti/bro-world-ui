<script setup lang="ts">
import UiStateEmptyState from '~/components/ui/state/UiEmptyState.vue'
import UiSkeletonCardGrid from '~/components/ui/state/UiSkeletonCardGrid.vue'
import UiSkeletonDataTable from '~/components/ui/state/UiSkeletonDataTable.vue'
import UiSkeletonForm from '~/components/ui/state/UiSkeletonForm.vue'

interface Props {
  title: string
  subtitle?: string
  eyebrow?: string
  icon?: string
  maxWidth?: string | number
  empty?: boolean
  loading?: boolean
  skeleton?: string
  emptyTitle?: string
  emptyDescription?: string
  emptyIcon?: string
  spacing?: 'compact' | 'comfortable' | 'spacious'
  surface?: 'default' | 'glass' | 'interactive' | 'metric' | 'hero'
  elevationPreset?: 'none' | 'soft' | 'raised'
}

const props = withDefaults(defineProps<Props>(), {
  subtitle: '',
  eyebrow: '',
  icon: '',
  maxWidth: 1200,
  empty: false,
  loading: false,
  skeleton: '',
  emptyTitle: '',
  emptyDescription: '',
  emptyIcon: 'mdi-information-outline',
  spacing: 'comfortable',
  surface: 'default',
  elevationPreset: 'soft',
})

const route = useRoute()

const skeletonComponents: Record<string, unknown> = {
  'card-grid': UiSkeletonCardGrid,
  'data-table': UiSkeletonDataTable,
  form: UiSkeletonForm,
}

const resolvedSkeleton = computed(() => {
  const skeletonKey = props.skeleton || (typeof route.meta?.skeleton === 'string' ? route.meta.skeleton : '')
  return skeletonComponents[skeletonKey] ?? UiSkeletonForm
})
</script>

<template>
  <UiPageSection
    :max-width="props.maxWidth"
    :spacing="props.spacing"
    :surface="props.surface"
    :elevation-preset="props.elevationPreset"
  >
    <component :is="resolvedSkeleton" v-if="props.loading" class="ui-page-shell__loading" />

    <UiStateEmptyState
      v-else-if="props.empty"
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
      <slot name="header-inline">
        <div class="ui-page-shell__header d-flex align-start justify-space-between ga-4 flex-wrap">
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
      </slot>

      <slot />
    </div>
  </UiPageSection>
</template>

<style scoped>
.ui-page-shell__header {
  margin-bottom: 0.25rem;
}

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

.ui-page-shell__loading {
  border: 1px dashed rgba(var(--v-theme-on-surface), 0.12);
  border-radius: 16px;
  padding: 1rem;
}

@media (min-width: 960px) {
  .ui-page-shell__actions {
    width: auto;
  }
}
</style>
