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
  <div class="d-flex align-center justify-space-between mb-2">
    <v-text-field v-model="filters.q" density="compact" variant="outlined" :label="$t('platform.recruit.filters.fields.search')" hide-details clearable class="mb-3 mx-1" />
    <v-text-field v-model="filters.company" density="compact" variant="outlined" :label="$t('platform.recruit.filters.fields.company')" hide-details clearable class="mb-3 mx-1" />
    <v-btn
        size="small"
        :variant="props.hasFilters ? 'flat' : 'text'"
        :color="props.hasFilters ? 'warning' : undefined"
        :disabled="!props.hasFilters"
        @click="$emit('reset')"
    >
      {{ $t('platform.recruit.filters.actions.reset') }}
    </v-btn>
    <div v-if="activeFilters.length" class="d-flex flex-wrap ga-2">
      <v-chip
          v-for="filter in activeFilters"
          :key="filter"
          color="primary"
          variant="tonal"
          size="small"
          class="mx-1"
      >
        {{ filter }}
      </v-chip>
    </div>
  </div>
  <div class="d-flex align-center justify-space-between mb-2">
    <v-text-field v-model="filters.location" density="compact" width="100%" variant="outlined" :label="$t('platform.recruit.filters.fields.location')" hide-details clearable class="mb-3 mx-1" />
    <v-text-field v-model="filters.schedule" density="compact" width="100%" variant="outlined" :label="$t('platform.recruit.filters.fields.schedule')" hide-details clearable class="mb-3 mx-1" />
    <v-text-field v-model="filters.postedAtLabel" density="compact" width="100%" variant="outlined" :label="$t('platform.recruit.filters.fields.posted')" hide-details clearable class="mb-3 mx-1"  />
  </div>
  <div class="d-flex align-center justify-space-between mb-2">
    <v-select
        v-model="filters.contractType"
        :items="contractTypeItems"
        density="compact"
        variant="outlined"
        :label="$t('platform.recruit.filters.fields.contractType')"
        hide-details
        width="100%"
        class="mb-3 mx-1"
    />

    <v-select
        v-model="filters.workMode"
        :items="workModeItems"
        density="compact"
        variant="outlined"
        :label="$t('platform.recruit.filters.fields.workMode')"
        hide-details
        width="100%"
        class="mb-3 mx-1"
    />
    <div class="d-flex ga-2">
      <v-text-field v-model.number="filters.salaryMin" width="100%" type="number" min="0" density="compact" variant="outlined" :label="$t('platform.recruit.filters.fields.salaryMin')" hide-details class="mb-3 mx-1" />
      <v-text-field v-model.number="filters.salaryMax" width="100%" type="number" min="0" density="compact" variant="outlined" :label="$t('platform.recruit.filters.fields.salaryMax')" hide-details class="mb-3 mx-1" />
    </div>
  </div>
</template>
