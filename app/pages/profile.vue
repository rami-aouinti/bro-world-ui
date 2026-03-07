<script setup lang="ts">
import PlatformSplitLayout from '~/components/platform/PlatformSplitLayout.vue'
import UiAvatar from '~/components/ui/UiAvatar.vue'
import UiCard from '~/components/ui/UiCard.vue'
import UiSectionHeader from '~/components/ui/UiSectionHeader.vue'
import UiStateAlert from '~/components/ui/state/UiStateAlert.vue'
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useProfileApi } from '~/composables/api/useProfileApi'

import type { Profile } from '~/types/api/profile'

definePageMeta({
  middleware: ['role'],
  requiredPermissions: ['profile.readOwn'],
  skeleton: 'form',
})

const { t } = useI18n()
const authSession = useAuthSessionStore()
const { canPermission } = useAccessControl()
const { isAuthenticated, fetchProfile } = useAuth()
const profileApi = useProfileApi()

const loading = ref(false)
const saving = ref(false)
const uploadingPhoto = ref(false)
const errorMessage = ref('')
const successMessage = ref('')
const formRef = ref()

const form = reactive({
  firstName: '',
  lastName: '',
  photo: '',
})

const profileDisplayName = computed(() => {
  const profile = authSession.profile
  if (!profile) {
    return 'Guest User'
  }

  return `${profile.firstName} ${profile.lastName}`.trim() || profile.username
})

const profileStatus = computed<'online' | 'offline'>(() => (isAuthenticated.value ? 'online' : 'offline'))

const emptyProfileDescription = computed(() => `${t('profile.tokenHint')} ${t('profile.tokenHeader')} ${t('profile.tokenHintSuffix')}`)

const applyProfileToForm = (profile: Profile | null) => {
  form.firstName = profile?.firstName ?? ''
  form.lastName = profile?.lastName ?? ''
  form.photo = profile?.photo ?? ''
}

watch(
  () => authSession.profile,
  profile => applyProfileToForm(profile),
  { immediate: true },
)

const syncSessionProfile = (profile: Profile) => {
  if (!authSession.profile) {
    return
  }

  authSession.setUserSession({
    token: authSession.token,
    profile: {
      ...authSession.profile,
      ...profile,
      roles: authSession.profile.roles,
      userGroups: authSession.profile.userGroups,
    },
    roles: authSession.roles,
    locale: authSession.locale,
  })
}

const loadProfile = async () => {
  if (!isAuthenticated.value) {
    errorMessage.value = t('errors.profile.noToken')
    return
  }

  if (!canPermission('profile.readOwn', { userId: authSession.profile?.id })) {
    errorMessage.value = t('profile.notAuthenticated')
    return
  }

  errorMessage.value = ''
  loading.value = true

  try {
    await fetchProfile()
  }
  catch {
    errorMessage.value = t('errors.profile.loadFailed')
  }
  finally {
    loading.value = false
  }
}

const submitProfile = async () => {
  if (!authSession.profile || saving.value) {
    return
  }

  errorMessage.value = ''
  successMessage.value = ''
  saving.value = true

  try {
    const updatedProfile = await profileApi.patch({
      firstName: form.firstName,
      lastName: form.lastName,
    })

    syncSessionProfile(updatedProfile)
    successMessage.value = t('profile.updateSuccess')
  }
  catch {
    errorMessage.value = t('errors.profile.updateFailed')
  }
  finally {
    saving.value = false
  }
}

const uploadProfilePhoto = async (files: File[] | File | null) => {
  const file = Array.isArray(files) ? files[0] : files

  if (!file || !authSession.profile) {
    return
  }

  errorMessage.value = ''
  successMessage.value = ''
  uploadingPhoto.value = true

  try {
    const response = await profileApi.uploadPhoto(file)
    form.photo = response.photo

    const updatedProfile = await profileApi.patch({
      firstName: form.firstName,
      lastName: form.lastName,
    })

    syncSessionProfile({
      ...updatedProfile,
      photo: response.photo,
    })

    successMessage.value = t('profile.photoUpdateSuccess')
  }
  catch {
    errorMessage.value = t('errors.profile.photoUploadFailed')
  }
  finally {
    uploadingPhoto.value = false
  }
}

onMounted(async () => {
  if (isAuthenticated.value && !authSession.profile) {
    await loadProfile()
  }
})
</script>

<template>
  <PlatformSplitLayout>
    <template #sidebar>
      <UiSectionHeader :title="t('profile.title')" />

      <div class="profile-page__identity">
        <UiAvatar
          :src="form.photo || authSession.profile?.photo"
          :name="profileDisplayName"
          size="lg"
          :status="profileStatus"
        />
        <div>
          <p class="text-subtitle-1 font-weight-bold profile-page__identity-name">{{ profileDisplayName }}</p>
          <p class="text-body-2 text-medium-emphasis profile-page__identity-role">{{ t('profile.title') }}</p>
        </div>
      </div>

      <div class="platform-layout__sidebar-actions">
        <v-btn variant="outlined" block to="/profile">Profile</v-btn>
        <v-btn variant="outlined" block class="mt-2" to="/settings">Settings</v-btn>
      </div>
    </template>

    <template #default>
      <UiSectionHeader
        :title="t('profile.title')"
        :subtitle="t('profile.tokenHint')"
      />
        <UiStateAlert
          v-if="!isAuthenticated"
          type="warning"
          variant="tonal"
          :message="t('profile.notAuthenticated')"
        />


        <UiStateAlert
          v-if="errorMessage"
          type="error"
          variant="tonal"
          :message="errorMessage"
        />

        <UiStateAlert
          v-if="successMessage"
          type="success"
          variant="tonal"
          :message="successMessage"
        />

        <UiCard
          v-if="authSession.profile"
          variant="tonal"
          rounded="lg"
          compact
        >
          <v-form ref="formRef" @submit.prevent="submitProfile">
            <v-row>
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model="form.firstName"
                  :label="t('profile.firstName')"
                  variant="outlined"
                  density="comfortable"
                />
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model="form.lastName"
                  :label="t('profile.lastName')"
                  variant="outlined"
                  density="comfortable"
                />
              </v-col>
              <v-col cols="12" class="d-flex flex-wrap align-center ga-3">
                <v-file-input
                  accept="image/*"
                  :label="t('profile.photo')"
                  prepend-icon="mdi-camera-outline"
                  variant="outlined"
                  density="comfortable"
                  hide-details
                  :disabled="uploadingPhoto || saving"
                  @update:model-value="uploadProfilePhoto"
                />
              </v-col>
              <v-col cols="12" class="d-flex">
                <v-btn
                  type="submit"
                  color="primary"
                  prepend-icon="mdi-content-save-outline"
                  :loading="saving"
                  :disabled="saving || uploadingPhoto"
                >
                  {{ t('profile.saveChanges') }}
                </v-btn>
              </v-col>
            </v-row>
          </v-form>
        </UiCard>

        <UiCard
          v-if="authSession.profile"
          variant="tonal"
          rounded="lg"
          compact
        >
          <pre class="text-body-2">{{ authSession.profile }}</pre>
        </UiCard>
    </template>
  </PlatformSplitLayout>
</template>
