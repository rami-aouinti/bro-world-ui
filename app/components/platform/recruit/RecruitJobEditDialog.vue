<script setup lang="ts">
import type { RecruitUpdateJobPayload } from '~/composables/recruit/useRecruitHome'

const modelValue = defineModel<boolean>({ required: true })
const form = defineModel<RecruitUpdateJobPayload>('form', { required: true })

defineProps<{
  loading: boolean
  error: string
}>()

defineEmits<{
  close: []
  submit: []
}>()
</script>

<template>
  <v-dialog v-model="modelValue" max-width="760">
    <v-card rounded="xl">
      <v-card-title class="text-h5 py-4 px-6">Modifier l'offre</v-card-title>
      <v-card-text class="px-6 pb-0">
        <v-alert v-if="error" type="error" variant="tonal" class="mb-4">{{ error }}</v-alert>
        <v-row>
          <v-col cols="12" md="8"><v-text-field v-model="form.title" label="Titre" variant="outlined" density="comfortable" /></v-col>
          <v-col cols="12" md="4"><v-text-field v-model="form.location" label="Ville" variant="outlined" density="comfortable" /></v-col>
          <v-col cols="12" md="4"><v-select v-model="form.contractType" :items="['CDI', 'CDD', 'Freelance', 'Internship']" label="Contrat" variant="outlined" density="comfortable" /></v-col>
          <v-col cols="12" md="4"><v-select v-model="form.workMode" :items="['Onsite', 'Hybrid', 'Remote']" label="Mode" variant="outlined" density="comfortable" /></v-col>
          <v-col cols="12" md="4"><v-text-field v-model="form.schedule" label="Horaires" variant="outlined" density="comfortable" /></v-col>
          <v-col cols="12" md="4"><v-text-field v-model.number="form.matchScore" type="number" min="0" max="100" label="Match score" variant="outlined" density="comfortable" /></v-col>
          <v-col cols="12"><v-textarea v-model="form.summary" label="Résumé" rows="3" auto-grow variant="outlined" density="comfortable" /></v-col>
          <v-col cols="12" md="6"><v-text-field v-model="form.missionTitle" label="Mission title" variant="outlined" density="comfortable" /></v-col>
          <v-col cols="12" md="6"><v-textarea v-model="form.missionDescription" label="Mission description" rows="3" auto-grow variant="outlined" density="comfortable" /></v-col>
          <v-col cols="12" md="4"><v-textarea v-model="form.responsibilities" label="Responsibilities (1 ligne par item)" rows="4" auto-grow variant="outlined" density="comfortable" /></v-col>
          <v-col cols="12" md="4"><v-textarea v-model="form.profile" label="Profile (1 ligne par item)" rows="4" auto-grow variant="outlined" density="comfortable" /></v-col>
          <v-col cols="12" md="4"><v-textarea v-model="form.benefits" label="Benefits (1 ligne par item)" rows="4" auto-grow variant="outlined" density="comfortable" /></v-col>
        </v-row>
      </v-card-text>
      <v-card-actions class="px-6 pb-6 pt-2">
        <v-spacer />
        <v-btn variant="text" @click="$emit('close')">Annuler</v-btn>
        <v-btn color="primary" :loading="loading" @click="$emit('submit')">Enregistrer</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
