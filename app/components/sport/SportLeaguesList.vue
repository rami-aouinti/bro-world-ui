<script setup lang="ts">
const props = defineProps<{
  leagues: string[]
  selectedLeague: string
  selectedStatus: string
  selectedDate: string
  search: string
}>()

const emit = defineEmits<{
  'update:selectedLeague': [value: string]
  'update:selectedStatus': [value: string]
  'update:selectedDate': [value: string]
  'update:search': [value: string]
}>()

const { t } = useI18n()

const statusOptions = computed(() => [
  { title: t('sport.filters.statusAll'), value: 'all' },
  { title: t('sport.filters.statusScheduled'), value: 'scheduled' },
  { title: t('sport.filters.statusLive'), value: 'live' },
  { title: t('sport.filters.statusFinal'), value: 'final' },
])
</script>

<template>
  <v-card variant="tonal" class="pa-4 d-flex flex-column ga-4">
    <div>
      <p class="text-subtitle-2 mb-2">{{ t('sport.filters.leagues') }}</p>
      <v-chip-group
        :model-value="props.selectedLeague"
        column
        @update:model-value="emit('update:selectedLeague', $event || 'all')"
      >
        <v-chip value="all" filter variant="outlined">{{ t('sport.filters.allLeagues') }}</v-chip>
        <v-chip
          v-for="league in props.leagues"
          :key="league"
          :value="league"
          filter
          variant="outlined"
        >
          {{ league }}
        </v-chip>
      </v-chip-group>
    </div>

    <v-divider />

    <div class="d-flex flex-column ga-3">
      <p class="text-subtitle-2 mb-0">{{ t('sport.filters.title') }}</p>
      <v-text-field
        :label="t('sport.filters.search')"
        density="comfortable"
        variant="outlined"
        prepend-inner-icon="mdi-magnify"
        :model-value="props.search"
        @update:model-value="emit('update:search', String($event || ''))"
      />

      <v-text-field
        type="date"
        :label="t('sport.filters.date')"
        density="comfortable"
        variant="outlined"
        :model-value="props.selectedDate"
        @update:model-value="emit('update:selectedDate', String($event || ''))"
      />

      <v-select
        :label="t('sport.filters.status')"
        density="comfortable"
        variant="outlined"
        :items="statusOptions"
        item-title="title"
        item-value="value"
        :model-value="props.selectedStatus"
        @update:model-value="emit('update:selectedStatus', String($event || 'all'))"
      />
    </div>
  </v-card>
</template>
