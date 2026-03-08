<script setup lang="ts">
import type { RecruitHomeFilters } from '~/composables/recruit/useRecruitHome'

const filters = defineModel<RecruitHomeFilters>({ required: true })
const { t } = useI18n()

const props = defineProps<{
  hasFilters: boolean
}>()

defineEmits<{
  reset: []
}>()

const contractTypeItems = computed(() => [
  { title: t('platform.recruit.filters.options.all'), value: '' },
  { title: t('platform.recruit.filters.options.contractType.CDI'), value: 'CDI' },
  { title: t('platform.recruit.filters.options.contractType.CDD'), value: 'CDD' },
  { title: t('platform.recruit.filters.options.contractType.Freelance'), value: 'Freelance' },
  { title: t('platform.recruit.filters.options.contractType.Internship'), value: 'Internship' },
])

const workModeItems = computed(() => [
  { title: t('platform.recruit.filters.options.all'), value: '' },
  { title: t('platform.recruit.filters.options.workMode.Onsite'), value: 'Onsite' },
  { title: t('platform.recruit.filters.options.workMode.Hybrid'), value: 'Hybrid' },
  { title: t('platform.recruit.filters.options.workMode.Remote'), value: 'Remote' },
])

const activeFilters = computed(() => {
  const currentFilters = filters.value
  const chips: string[] = []

  if (currentFilters.q.trim()) chips.push(`${t('platform.recruit.filters.fields.search')}: ${currentFilters.q.trim()}`)
  if (currentFilters.company.trim()) chips.push(`${t('platform.recruit.filters.fields.company')}: ${currentFilters.company.trim()}`)
  if (currentFilters.location.trim()) chips.push(`${t('platform.recruit.filters.fields.location')}: ${currentFilters.location.trim()}`)
  if (currentFilters.schedule.trim()) chips.push(`${t('platform.recruit.filters.fields.schedule')}: ${currentFilters.schedule.trim()}`)
  if (currentFilters.postedAtLabel.trim()) chips.push(`${t('platform.recruit.filters.fields.posted')}: ${currentFilters.postedAtLabel.trim()}`)
  if (currentFilters.contractType) chips.push(`${t('platform.recruit.filters.fields.contractType')}: ${t(`platform.recruit.filters.options.contractType.${currentFilters.contractType}`)}`)
  if (currentFilters.workMode) chips.push(`${t('platform.recruit.filters.fields.workMode')}: ${t(`platform.recruit.filters.options.workMode.${currentFilters.workMode}`)}`)
  if (currentFilters.salaryMin > 0) chips.push(`${t('platform.recruit.filters.fields.salaryMin')}: ${currentFilters.salaryMin}`)
  if (currentFilters.salaryMax > 0) chips.push(`${t('platform.recruit.filters.fields.salaryMax')}: ${currentFilters.salaryMax}`)

  return chips
})
</script>

<template>
  <v-divider class="my-4" />
  <div class="d-flex align-center justify-space-between mb-2">
    <p class="text-subtitle-2 mb-0">{{ $t('platform.recruit.filters.title') }}</p>
    <v-btn
      size="small"
      :variant="props.hasFilters ? 'flat' : 'text'"
      :color="props.hasFilters ? 'warning' : undefined"
      :disabled="!props.hasFilters"
      @click="$emit('reset')"
    >
      {{ $t('platform.recruit.filters.actions.reset') }}
    </v-btn>
  </div>

  <v-sheet rounded="lg" border class="pa-3 mb-3">
    <p class="text-caption text-medium-emphasis mb-3">{{ $t('platform.recruit.filters.sections.text') }}</p>
    <v-text-field v-model="filters.q" density="comfortable" variant="outlined" :label="$t('platform.recruit.filters.fields.search')" hide-details clearable class="mb-3" />
    <v-text-field v-model="filters.company" density="comfortable" variant="outlined" :label="$t('platform.recruit.filters.fields.company')" hide-details clearable class="mb-3" />
    <v-text-field v-model="filters.location" density="comfortable" variant="outlined" :label="$t('platform.recruit.filters.fields.location')" hide-details clearable class="mb-3" />
    <v-text-field v-model="filters.schedule" density="comfortable" variant="outlined" :label="$t('platform.recruit.filters.fields.schedule')" hide-details clearable class="mb-3" />
    <v-text-field v-model="filters.postedAtLabel" density="comfortable" variant="outlined" :label="$t('platform.recruit.filters.fields.posted')" hide-details clearable />
  </v-sheet>

  <v-sheet rounded="lg" border class="pa-3 mb-3">
    <p class="text-caption text-medium-emphasis mb-3">{{ $t('platform.recruit.filters.sections.contractAndMode') }}</p>
    <v-select
      v-model="filters.contractType"
      :items="contractTypeItems"
      density="comfortable"
      variant="outlined"
      :label="$t('platform.recruit.filters.fields.contractType')"
      hide-details
      class="mb-3"
    />

    <v-select
      v-model="filters.workMode"
      :items="workModeItems"
      density="comfortable"
      variant="outlined"
      :label="$t('platform.recruit.filters.fields.workMode')"
      hide-details
    />
  </v-sheet>

  <v-sheet rounded="lg" border class="pa-3 mb-3">
    <p class="text-caption text-medium-emphasis mb-3">{{ $t('platform.recruit.filters.sections.salary') }}</p>
    <div class="d-flex ga-2">
      <v-text-field v-model.number="filters.salaryMin" type="number" min="0" density="comfortable" variant="outlined" :label="$t('platform.recruit.filters.fields.salaryMin')" hide-details class="mb-3" />
      <v-text-field v-model.number="filters.salaryMax" type="number" min="0" density="comfortable" variant="outlined" :label="$t('platform.recruit.filters.fields.salaryMax')" hide-details class="mb-3" />
    </div>
  </v-sheet>

  <div v-if="activeFilters.length" class="d-flex flex-wrap ga-2">
    <v-chip
      v-for="filter in activeFilters"
      :key="filter"
      color="primary"
      variant="tonal"
      size="small"
    >
      {{ filter }}
    </v-chip>
  </div>
</template>
