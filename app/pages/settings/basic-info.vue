<script setup lang="ts">
definePageMeta({ public: false, requiresAuth: true })

const currentUser = useCurrentUserStore()
const saving = ref(false)
const isLoading = ref(true)
const uploading = ref(false)
const photoInput = ref<HTMLInputElement | null>(null)

const form = reactive({
  firstName: '',
  lastName: '',
  email: '',
  title: '',
  information: '',
  gender: '',
  birthday: '',
  location: '',
  phone: '',
})

const infoDialog = ref(false)
const infoForm = reactive({
  title: '',
  information: '',
})

const fullName = computed(() => currentUser.displayName || '—')
const headline = computed(() => form.title || 'Member')
const bio = computed(() => form.information || 'No bio yet.')

const loadProfile = async () => {
  isLoading.value = true
  try {
    await currentUser.fetchMe()
    form.firstName = currentUser.me?.firstName || ''
    form.lastName = currentUser.me?.lastName || ''
    form.email = currentUser.me?.email || ''
    form.title = currentUser.me?.profile?.title || ''
    form.information = currentUser.me?.profile?.information || ''
    form.gender = currentUser.me?.profile?.gender || ''
    form.birthday = currentUser.me?.profile?.birthday || ''
    form.location = currentUser.me?.profile?.location || ''
    form.phone = currentUser.me?.profile?.phone || ''
  }
  finally {
    isLoading.value = false
  }
}

const onSubmit = async () => {
  saving.value = true
  try {
    await currentUser.updateProfile({ ...form })
  }
  finally {
    saving.value = false
  }
}

const onUploadPhoto = async (event: Event) => {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  uploading.value = true
  try {
    await currentUser.uploadPhoto(file)
  }
  finally {
    uploading.value = false
    input.value = ''
  }
}

const onOpenInfoDialog = () => {
  infoForm.title = form.title
  infoForm.information = form.information
  infoDialog.value = true
}

const onSaveInfoDialog = async () => {
  form.title = infoForm.title
  form.information = infoForm.information
  await onSubmit()
  infoDialog.value = false
}

onMounted(loadProfile)
</script>

<template>
  <SettingsLayout>
    <v-row class="ga-4 mb-3">
      <v-col cols="6">
        <div class="d-flex align-center ga-2 mb-3">
          <div class="profile-photo-wrap">
            <UiAvatar :src="currentUser.me?.photo || '/images/placeholders/platform-media-fallback.svg'" :name="fullName" size="lg" />
            <v-btn
                class="profile-photo-upload-btn"
                :loading="uploading"
                size="sm"
                icon="mdi-camera"
                @click="photoInput?.click()"
            />
            <input ref="photoInput" type="file" class="d-none" accept="image/*" @change="onUploadPhoto" />
          </div>
          <div>
            <h2 class="text-h5 font-weight-bold mb-0">{{ fullName }}</h2>
            <h4 class="text-body-1 text-medium-emphasis mb-0">{{ headline }}</h4>
          </div>
        </div>
      </v-col>
      <v-col cols="6">
        <div class="d-flex align-center mb-1">
          <h3 class="text-h6 font-weight-bold mb-0">Profile information</h3>
          <v-btn icon variant="text" size="small" class="mx-2" @click="onOpenInfoDialog">
            <v-icon>mdi-pencil</v-icon>
          </v-btn>
        </div>

        <p class="text-body-1 text-medium-emphasis mb-4">{{ bio }}</p>
      </v-col>
    </v-row>
    <v-progress-linear v-if="isLoading" color="primary" indeterminate class="mb-4" />
    <v-form v-else @submit.prevent="onSubmit">
      <v-row>
        <v-col cols="12" md="6"><v-text-field v-model="form.firstName" label="First Name" variant="underlined" /></v-col>
        <v-col cols="12" md="6"><v-text-field v-model="form.lastName" label="Last Name" variant="underlined" /></v-col>
        <v-col cols="12" md="4"><v-text-field v-model="form.email" label="Email" variant="underlined" /></v-col>
        <v-col cols="12" md="4"><v-select v-model="form.gender" :items="['Female', 'Male']" label="I'm" variant="underlined" /></v-col>
        <v-col cols="12" md="4"><v-text-field v-model="form.birthday" label="Birth Date" variant="underlined" placeholder="1987-05-18" /></v-col>
        <v-col cols="12" md="6"><v-text-field v-model="form.location" label="Your Location" variant="underlined" /></v-col>
        <v-col cols="12" md="6"><v-text-field v-model="form.phone" label="Phone Number" variant="underlined" /></v-col>
      </v-row>
      <div class="d-flex justify-end mt-4">
        <v-btn color="primary" type="submit" :loading="saving">Save changes</v-btn>
      </div>
    </v-form>

    <v-dialog v-model="infoDialog" max-width="560">
      <v-card>
        <v-card-title>Edit profile information</v-card-title>
        <v-card-text>
          <v-text-field
            v-model="infoForm.title"
            label="Title"
            variant="outlined"
          />
          <v-textarea
            v-model="infoForm.information"
            label="Information"
            variant="outlined"
            rows="4"
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="infoDialog = false">Cancel</v-btn>
          <v-btn color="primary" :loading="saving" @click="onSaveInfoDialog">Save</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </SettingsLayout>
</template>

<style scoped>
.profile-photo-wrap {
  position: relative;
  display: inline-flex;
}

.profile-photo-upload-btn {
  position: absolute;
  right: -4px;
  bottom: -4px;
}
</style>
