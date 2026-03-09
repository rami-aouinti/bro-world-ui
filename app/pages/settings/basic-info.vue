<script setup lang="ts">
definePageMeta({ public: false, requiresAuth: true })

const currentUser = useCurrentUserStore()
const saving = ref(false)
const isLoading = ref(true)

const form = reactive({
  firstName: '',
  lastName: '',
  email: '',
  gender: '',
  birthday: '',
  location: '',
  phone: '',
})

const loadProfile = async () => {
  isLoading.value = true
  try {
    await currentUser.fetchMe()
    form.firstName = currentUser.me?.firstName || ''
    form.lastName = currentUser.me?.lastName || ''
    form.email = currentUser.me?.email || ''
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

onMounted(loadProfile)
</script>

<template>
  <SettingsLayout>
    <h3 class="text-h5 font-weight-bold mb-6">Basic Info</h3>
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
  </SettingsLayout>
</template>
