<script setup lang="ts">
import PlatformSplitLayout from '~/components/platform/PlatformSplitLayout.vue'

withDefaults(defineProps<{
  showFilters: boolean
  shouldShowPagination?: boolean
  pageLength?: number
  totalVisible?: number
}>(), {
  shouldShowPagination: false,
  pageLength: 1,
  totalVisible: 5,
})

const pageModel = defineModel<number>('page', { default: 1 })
</script>

<template>
  <PlatformSplitLayout>
    <client-only>
      <teleport to="#app-bar-teleport-target">
        <slot name="app-bar-left" />
      </teleport>
      <teleport to="#app-bar-teleport-target-right">
        <slot name="app-bar-right" />
      </teleport>
    </client-only>

    <template #sidebar>
      <slot name="sidebar" />
    </template>

    <template #aside>
      <div class="d-flex flex-column ga-4">
        <template v-if="showFilters">
          <slot name="filters" />
        </template>
        <template v-else>
          <slot name="selected" />
        </template>
      </div>
    </template>

    <section class="crm-listing-shell">
      <div class="crm-listing-shell__content">
        <slot name="cards" />
      </div>

      <div v-if="shouldShowPagination" class="crm-listing-shell__footer d-flex justify-center">
        <v-pagination v-model="pageModel" :length="pageLength" :total-visible="totalVisible" />
      </div>

      <slot name="dialogs" />
    </section>
  </PlatformSplitLayout>
</template>

<style scoped>
.crm-listing-shell {
  min-height: 75vh;
  display: flex;
  flex-direction: column;
}

.crm-listing-shell__content {
  flex: 1;
}

.crm-listing-shell__footer {
  margin-top: auto;
  padding-bottom: 0;
}
</style>
