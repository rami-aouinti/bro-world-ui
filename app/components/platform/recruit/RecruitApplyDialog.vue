<script setup lang="ts">
import type { RecruitJob } from '~/data/platform/recruit'

const modelValue = defineModel<boolean>({ required: true })
const applyForm = defineModel<{ firstName: string, lastName: string, email: string, coverLetter: string }>('applyForm', { required: true })
const resumeForm = defineModel<{ title: string, description: string, skillTitle: string, skillDescription: string }>('resumeForm', { required: true })
const resumeMode = defineModel<'existing' | 'new' | 'pdf'>('resumeMode', { required: true })
const selectedResumeId = defineModel<string>('selectedResumeId', { required: true })

defineProps<{
  selectedApplyJob: RecruitJob | null
  applyError: string
  applyLoading: boolean
  canSubmitApplication: boolean
  resumesStore: ReturnType<typeof useRecruitResumesStore>
  selectedResume: any
  resumeSaving: boolean
  resumeDeleting: boolean
}>()

defineEmits<{
  close: []
  submit: []
  saveResume: []
  deleteResume: []
  fileChange: [value: File | File[] | null]
}>()
</script>

<template>
  <v-dialog v-model="modelValue" max-width="720">
    <v-card rounded="xl">
      <v-card-title class="text-h5 py-4 px-6">Apply</v-card-title>
      <v-card-text class="px-6">
        <p class="text-body-1 mb-4">Job <span v-if="selectedApplyJob" class="font-weight-bold">: {{ selectedApplyJob.title }}</span></p>

        <v-alert v-if="applyError" type="error" variant="tonal" class="mb-4">{{ applyError }}</v-alert>

        <v-row>
          <v-col cols="12" md="4"><v-text-field v-model="applyForm.firstName" label="First Name" variant="outlined" density="compact" /></v-col>
          <v-col cols="12" md="4"><v-text-field v-model="applyForm.lastName" label="Last Name" variant="outlined" density="compact" /></v-col>
          <v-col cols="12" md="4"><v-text-field v-model="applyForm.email" label="Email" type="email" variant="outlined" density="compact" /></v-col>

          <v-col cols="12"><v-textarea v-model="applyForm.coverLetter" label="Cover Letter" rows="5" auto-grow variant="outlined" density="compact" /></v-col>

          <v-col cols="12">
            <v-radio-group v-model="resumeMode" inline>
              <v-radio label="Utiliser un CV existant" value="existing" />
              <v-radio label="Créer un nouveau CV" value="new" />
              <v-radio label="Importer un CV PDF" value="pdf" />
            </v-radio-group>
          </v-col>

          <v-col v-if="resumeMode === 'existing'" cols="12">
            <v-select
              v-model="selectedResumeId"
              label="Mes CV"
              variant="outlined"
              density="compact"
              :loading="resumesStore.isLoading"
              :items="resumesStore.items.map(item => ({ title: `${item.experiences[0]?.title ?? 'CV sans titre'} (${item.id})`, value: item.id }))"
            />
          </v-col>

          <template v-if="resumeMode === 'existing' && selectedResume">
            <v-col cols="12" md="6"><v-text-field v-model="selectedResume.experiences[0].title" label="Experience title" variant="outlined" density="compact" /></v-col>
            <v-col cols="12" md="6"><v-text-field v-model="selectedResume.skills[0].title" label="Skill title" variant="outlined" density="compact" /></v-col>
            <v-col cols="12" md="6"><v-textarea v-model="selectedResume.experiences[0].description" label="Experience description" rows="2" auto-grow variant="outlined" density="compact" /></v-col>
            <v-col cols="12" md="6"><v-textarea v-model="selectedResume.skills[0].description" label="Skill description" rows="2" auto-grow variant="outlined" density="compact" /></v-col>
            <v-col cols="12">
              <div class="d-flex ga-2 justify-end">
                <v-btn color="secondary" variant="tonal" :loading="resumeSaving" @click="$emit('saveResume')">Modifier ce CV</v-btn>
                <v-btn color="error" variant="tonal" :loading="resumeDeleting" @click="$emit('deleteResume')">Supprimer ce CV</v-btn>
              </div>
            </v-col>
          </template>

          <template v-if="resumeMode === 'pdf'">
            <v-col cols="12">
              <v-file-input
                label="CV PDF"
                accept="application/pdf"
                prepend-icon="mdi-file-pdf-box"
                variant="outlined"
                density="compact"
                show-size
                @update:model-value="$emit('fileChange', $event)"
              />
            </v-col>
          </template>

          <template v-if="resumeMode === 'new'">
            <v-col cols="12" md="6"><v-text-field v-model="resumeForm.title" label="Experience title" variant="outlined" density="compact" /></v-col>
            <v-col cols="12" md="6"><v-text-field v-model="resumeForm.skillTitle" label="Skill title (optionnel)" variant="outlined" density="compact" /></v-col>
            <v-col cols="12" md="6"><v-textarea v-model="resumeForm.description" label="Experience description" rows="2" auto-grow variant="outlined" density="compact" /></v-col>
            <v-col cols="12" md="6"><v-textarea v-model="resumeForm.skillDescription" label="Skill description (optionnel)" rows="2" auto-grow variant="outlined" density="compact" /></v-col>
          </template>
        </v-row>
      </v-card-text>
      <v-card-actions class="px-6 pb-6 pt-2">
        <v-spacer />
        <v-btn variant="text" @click="$emit('close')">Fermer</v-btn>
        <v-btn color="primary" :loading="applyLoading" :disabled="!canSubmitApplication" @click="$emit('submit')">Apply</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
