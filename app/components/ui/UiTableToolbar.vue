<script setup lang="ts">
interface Props {
  search: string
  searchLabel: string
  loading?: boolean
  showCreate?: boolean
  createLabel?: string
  refreshLabel?: string
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  showCreate: true,
  createLabel: 'New',
  refreshLabel: 'Refresh',
})

const emit = defineEmits<{
  (e: 'update:search', value: string): void
  (e: 'create'): void
  (e: 'refresh'): void
}>()

const searchModel = computed({
  get: () => props.search,
  set: value => emit('update:search', value),
})
</script>

<template>
  <div class="ui-table-toolbar pa-2">
    <slot name="prepend" />

    <v-text-field
      v-model="searchModel"
      :label="searchLabel"
      prepend-inner-icon="mdi-magnify"
      density="compact"
      variant="outlined"
      hide-details
      class="ui-table-toolbar__search"
    />

    <v-btn
      v-if="showCreate"
      prepend-icon="mdi-plus"
      color="primary"
      variant="outlined"
      :aria-label="createLabel"
      @click="emit('create')"
    >
      {{ createLabel }}
    </v-btn>

    <v-btn
      prepend-icon="mdi-refresh"
      color="primary"
      variant="outlined"
      :loading="loading"
      :aria-label="refreshLabel"
      @click="emit('refresh')"
    >
      {{ refreshLabel }}
    </v-btn>

    <slot name="append" />
  </div>
</template>

<style scoped>
.ui-table-toolbar {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  min-width: 0;
}

.ui-table-toolbar__search {
  min-width: 200px;
  max-width: 280px;
}
</style>
