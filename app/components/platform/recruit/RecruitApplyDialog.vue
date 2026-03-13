<script setup lang="ts">
import { computed } from 'vue'
import type { RecruitJob } from '~/data/platform/recruit'
import type { RecruitResume } from '~/types/api/recruitResume'

const { t } = useI18n()

const modelValue = defineModel<boolean>({ required: true })
const applyForm = defineModel<{ firstName: string, lastName: string, email: string, coverLetter: string }>('applyForm', { required: true })
const resumeForm = defineModel<{ title: string, description: string, skillTitle: string, skillDescription: string }>('resumeForm', { required: true })
const resumeMode = defineModel<'existing' | 'new' | 'pdf'>('resumeMode', { required: true })
const selectedResumeId = defineModel<string>('selectedResumeId', { required: true })

const props = defineProps<{
  selectedApplyJob: RecruitJob | null
  applyError: string
  applyLoading: boolean
  canSubmitApplication: boolean
  resumesStore: ReturnType<typeof useRecruitResumesStore>
  selectedResume: RecruitResume | null
  resumeSaving: boolean
  resumeDeleting: boolean
  validationErrors: Partial<Record<'firstName' | 'lastName' | 'email' | 'coverLetter' | 'selectedResumeId' | 'resumeTitle' | 'resumeDescription' | 'resumePdf', string[]>>
  validationSummary: string[]
}>()


const selectedExperience = computed(() => props.selectedResume?.experiences[0] ?? null)
const selectedSkill = computed(() => props.selectedResume?.skills[0] ?? null)

defineEmits<{
  close: []
  submit: []
  saveResume: []
  deleteResume: []
  fileChange: [value: File | File[] | null]
}>()
</script>

<template>
  <v-dialog retain-focus v-model="modelValue" max-width="720">
    <v-card rounded="xl">
      <v-card-title class="text-h5 py-4 px-6">{{ t('platform.recruit.applyDialog.title') }}</v-card-title>
      <v-card-text class="px-6">
        <p class="text-body-1 mb-4">
          {{ t('platform.recruit.applyDialog.jobLabel') }}
          <span v-if="selectedApplyJob" class="font-weight-bold">: {{ selectedApplyJob.title }}</span>
        </p>

        <v-alert v-if="validationSummary.length" type="error" variant="tonal" class="mb-4" role="alert">
          <p class="font-weight-bold mb-1">{{ t('validation.summaryTitle') }}</p>
          <ul class="pl-4 mb-0">
            <li v-for="message in validationSummary" :key="message">{{ message }}</li>
          </ul>
        </v-alert>

        <v-alert v-if="applyError" type="error" variant="tonal" class="mb-4">{{ applyError }}</v-alert>

        <v-row>
          <v-col cols="12" md="4"><v-text-field v-model="applyForm.firstName" :label="t('platform.recruit.applyDialog.fields.firstName')" variant="outlined" density="compact" :error="Boolean(validationErrors.firstName?.length)" :error-messages="validationErrors.firstName" /></v-col>
          <v-col cols="12" md="4"><v-text-field v-model="applyForm.lastName" :label="t('platform.recruit.applyDialog.fields.lastName')" variant="outlined" density="compact" :error="Boolean(validationErrors.lastName?.length)" :error-messages="validationErrors.lastName" /></v-col>
          <v-col cols="12" md="4"><v-text-field v-model="applyForm.email" :label="t('platform.recruit.applyDialog.fields.email')" type="email" variant="outlined" density="compact" :error="Boolean(validationErrors.email?.length)" :error-messages="validationErrors.email" /></v-col>

          <v-col cols="12"><v-textarea v-model="applyForm.coverLetter" :label="t('platform.recruit.applyDialog.fields.coverLetter')" rows="5" auto-grow variant="outlined" density="compact" :error="Boolean(validationErrors.coverLetter?.length)" :error-messages="validationErrors.coverLetter" /></v-col>

          <v-col cols="12">
            <v-radio-group v-model="resumeMode" inline>
              <v-radio :label="t('platform.recruit.applyDialog.resumeModes.existing')" value="existing" />
              <v-radio :label="t('platform.recruit.applyDialog.resumeModes.new')" value="new" />
              <v-radio :label="t('platform.recruit.applyDialog.resumeModes.pdf')" value="pdf" />
            </v-radio-group>
          </v-col>

          <v-col v-if="resumeMode === 'existing'" cols="12">
            <v-select
              v-model="selectedResumeId"
              :label="t('platform.recruit.applyDialog.fields.myResumes')"
              variant="outlined"
              density="compact"
              :loading="resumesStore.isLoading"
              :items="resumesStore.items.map(item => ({ title: `${item.experiences[0]?.title ?? t('platform.recruit.applyDialog.untitledResume')} (${item.id})`, value: item.id }))"
              :error="Boolean(validationErrors.selectedResumeId?.length)"
              :error-messages="validationErrors.selectedResumeId"
            />
          </v-col>

          <template v-if="resumeMode === 'existing' && selectedResume && selectedExperience && selectedSkill">
            <v-col cols="12" md="6"><v-text-field v-model="selectedResume.experiences[0].title" :label="t('platform.recruit.applyDialog.fields.experienceTitle')" variant="outlined" density="compact" /></v-col>
            <v-col cols="12" md="6"><v-text-field v-model="selectedResume.skills[0].title" :label="t('platform.recruit.applyDialog.fields.skillTitle')" variant="outlined" density="compact" /></v-col>
            <v-col cols="12" md="6"><v-textarea v-model="selectedResume.experiences[0].description" :label="t('platform.recruit.applyDialog.fields.experienceDescription')" rows="2" auto-grow variant="outlined" density="compact" /></v-col>
            <v-col cols="12" md="6"><v-textarea v-model="selectedResume.skills[0].description" :label="t('platform.recruit.applyDialog.fields.skillDescription')" rows="2" auto-grow variant="outlined" density="compact" /></v-col>
            <v-col cols="12">
              <div class="d-flex ga-2 justify-end">
                <v-btn color="secondary" variant="tonal" :loading="resumeSaving" @click="$emit('saveResume')">{{ t('platform.recruit.applyDialog.actions.editResume') }}</v-btn>
                <v-btn color="error" variant="tonal" :loading="resumeDeleting" @click="$emit('deleteResume')">{{ t('platform.recruit.applyDialog.actions.deleteResume') }}</v-btn>
              </div>
            </v-col>
          </template>

          <template v-if="resumeMode === 'pdf'">
            <v-col cols="12">
              <v-file-input
                :label="t('platform.recruit.applyDialog.fields.resumePdf')"
                accept="application/pdf"
                prepend-icon="mdi-file-pdf-box"
                variant="outlined"
                density="compact"
                show-size
                :error="Boolean(validationErrors.resumePdf?.length)"
                :error-messages="validationErrors.resumePdf"
                @update:model-value="$emit('fileChange', $event)"
              />
            </v-col>
          </template>

          <template v-if="resumeMode === 'new'">
            <v-col cols="12" md="6"><v-text-field v-model="resumeForm.title" :label="t('platform.recruit.applyDialog.fields.experienceTitle')" variant="outlined" density="compact" :error="Boolean(validationErrors.resumeTitle?.length)" :error-messages="validationErrors.resumeTitle" /></v-col>
            <v-col cols="12" md="6"><v-text-field v-model="resumeForm.skillTitle" :label="t('platform.recruit.applyDialog.fields.skillTitleOptional')" variant="outlined" density="compact" /></v-col>
            <v-col cols="12" md="6"><v-textarea v-model="resumeForm.description" :label="t('platform.recruit.applyDialog.fields.experienceDescription')" rows="2" auto-grow variant="outlined" density="compact" :error="Boolean(validationErrors.resumeDescription?.length)" :error-messages="validationErrors.resumeDescription" /></v-col>
            <v-col cols="12" md="6"><v-textarea v-model="resumeForm.skillDescription" :label="t('platform.recruit.applyDialog.fields.skillDescriptionOptional')" rows="2" auto-grow variant="outlined" density="compact" /></v-col>
          </template>
        </v-row>
      </v-card-text>
      <v-card-actions class="px-6 pb-6 pt-2">
        <v-spacer />
        <v-btn variant="text" @click="$emit('close')">{{ t('platform.recruit.applyDialog.actions.close') }}</v-btn>
        <v-btn color="primary" :loading="applyLoading" :disabled="!canSubmitApplication" @click="$emit('submit')">{{ t('platform.recruit.applyDialog.actions.apply') }}</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
