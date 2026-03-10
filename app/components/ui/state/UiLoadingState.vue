<script setup lang="ts">
import { computed } from 'vue'
import UiSkeletonCardGrid from '~/components/ui/state/UiSkeletonCardGrid.vue'
import UiSkeletonDashboard from '~/components/ui/state/UiSkeletonDashboard.vue'
import UiSkeletonDataTable from '~/components/ui/state/UiSkeletonDataTable.vue'
import UiSkeletonForm from '~/components/ui/state/UiSkeletonForm.vue'

type UiLoadingVariant = 'dashboard' | 'datatable' | 'cards' | 'form' | 'profile' | 'spinner'

interface Props {
  message?: string
  variant?: UiLoadingVariant
  rows?: number
  cards?: number
  sections?: number
}

const props = withDefaults(defineProps<Props>(), {
  message: '',
  variant: 'spinner',
  rows: 6,
  cards: 6,
  sections: 3,
})

const isSkeletonVariant = computed(() => props.variant !== 'spinner')
</script>

<template>
  <div class="ui-loading-state py-2">
    <div
      v-if="isSkeletonVariant"
      class="ui-loading-state__skeleton mb-3"
    >
      <UiSkeletonDashboard
        v-if="props.variant === 'dashboard'"
        :cards="props.cards"
        :sections="props.sections"
      />

      <UiSkeletonDataTable
        v-else-if="props.variant === 'datatable'"
        :rows="props.rows"
      />

      <UiSkeletonCardGrid
        v-else-if="props.variant === 'cards'"
        :cards="props.cards"
      />

      <UiSkeletonForm
        v-else
        :sections="props.sections"
      />
    </div>

    <div
      v-else
      class="d-flex align-center ga-3"
    >
      <v-progress-circular
        class="ui-loading-state__spinner"
        indeterminate
        size="20"
        width="2"
      />
    </div>

    <p
      v-if="props.message"
      class="text-body-2 text-medium-emphasis mb-0"
    >
      {{ props.message }}
    </p>
  </div>
</template>

<style scoped lang="scss">
.ui-loading-state {
  &__spinner {
    animation: ui-loading-pulse calc(var(--motion-slow) * 4) var(--easing-standard) infinite;
  }

  :deep(.ui-skeleton-layout) {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  :deep(.ui-skeleton-grid) {
    display: grid;
    gap: 12px;
  }

  :deep(.ui-skeleton-grid--cards) {
    grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  }

  :deep(.ui-skeleton-dashboard__sections),
  :deep(.ui-skeleton-datatable__rows) {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  :deep(.ui-skeleton-datatable__row) {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 12px;

    @media (max-width: 740px) {
      grid-template-columns: 1fr 1fr;
    }
  }

  :deep(.ui-skeleton-form__section) {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  :deep(.ui-skeleton-block) {
    display: block;
    border-radius: 10px;
    background: linear-gradient(
      100deg,
      rgba(var(--v-theme-surface-variant), 0.3) 0%,
      rgba(var(--v-theme-surface-variant), 0.55) 45%,
      rgba(var(--v-theme-surface-variant), 0.3) 90%
    );
    background-size: 250% 100%;
    animation: ui-loading-shimmer calc(var(--motion-slow) * 4.2) var(--easing-standard) infinite;
  }

  :deep(.ui-skeleton-block--section) {
    height: 160px;
  }

  :deep(.ui-skeleton-block--card) {
    height: 120px;
  }

  :deep(.ui-skeleton-block--table-header) {
    width: 45%;
    height: 20px;
  }

  :deep(.ui-skeleton-block--table-cell) {
    height: 16px;
  }

  :deep(.ui-skeleton-block--label) {
    width: 34%;
    height: 14px;
  }

  :deep(.ui-skeleton-block--input) {
    height: 44px;
  }

  :deep(.ui-skeleton-block--button) {
    width: 150px;
    height: 40px;
  }

  :deep(.ui-skeleton-block--w-15) { width: 15%; }
  :deep(.ui-skeleton-block--w-20) { width: 20%; }
  :deep(.ui-skeleton-block--w-25) { width: 25%; }
  :deep(.ui-skeleton-block--w-30) { width: 30%; }
}


@media (prefers-reduced-motion: reduce) {
  .ui-loading-state {
    &__spinner {
      animation: none;
    }

    :deep(.ui-skeleton-block) {
      animation: none;
      background-position: 0 0;
    }
  }
}

@keyframes ui-loading-shimmer {
  0% {
    background-position: 100% 0;
  }

  100% {
    background-position: -100% 0;
  }
}

@keyframes ui-loading-pulse {
  0%,
  100% {
    opacity: 0.9;
  }

  50% {
    opacity: 0.5;
  }
}
</style>
