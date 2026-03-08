<script setup lang="ts">
import type { RecruitHomeFilters } from '~/composables/recruit/useRecruitHome'

const filters = defineModel<RecruitHomeFilters>({ required: true })

defineProps<{
  hasFilters: boolean
}>()

defineEmits<{
  reset: []
}>()
</script>

<template>
  <v-divider class="my-4" />
  <div class="d-flex align-center justify-space-between mb-2">
    <p class="text-subtitle-2 mb-0">Filtres</p>
    <v-btn size="small" variant="text" :disabled="!hasFilters" @click="$emit('reset')">Réinitialiser</v-btn>
  </div>

  <v-text-field v-model="filters.q" density="comfortable" variant="outlined" label="Recherche" hide-details clearable class="mb-3" />
  <v-text-field v-model="filters.company" density="comfortable" variant="outlined" label="Entreprise" hide-details clearable class="mb-3" />
  <v-text-field v-model="filters.location" density="comfortable" variant="outlined" label="Localisation" hide-details clearable class="mb-3" />

  <v-select
    v-model="filters.contractType"
    :items="['', 'CDI', 'CDD', 'Freelance', 'Internship']"
    density="comfortable"
    variant="outlined"
    label="Type de contrat"
    hide-details
    class="mb-3"
  />

  <v-select
    v-model="filters.workMode"
    :items="['', 'Onsite', 'Hybrid', 'Remote']"
    density="comfortable"
    variant="outlined"
    label="Mode de travail"
    hide-details
    class="mb-3"
  />

  <v-text-field v-model="filters.schedule" density="comfortable" variant="outlined" label="Horaires" hide-details clearable class="mb-3" />
  <v-text-field v-model="filters.postedAtLabel" density="comfortable" variant="outlined" label="Publié" hide-details clearable class="mb-3" />

  <div class="d-flex ga-2">
    <v-text-field v-model.number="filters.salaryMin" type="number" min="0" density="comfortable" variant="outlined" label="Salaire min" hide-details class="mb-3" />
    <v-text-field v-model.number="filters.salaryMax" type="number" min="0" density="comfortable" variant="outlined" label="Salaire max" hide-details class="mb-3" />
  </div>
</template>
