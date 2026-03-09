<script setup lang="ts">
definePageMeta({ public: false, requiresAuth: true })

const saving = ref(false)
const currentUser = useCurrentUserStore()

const onSubmit = async () => {
  saving.value = true
  try {
    await currentUser.updateProfile({
      ...form,
    })
    // updated
  }
  finally {
    saving.value = false
  }
}
const isLoading = ref(true)
const profile = ref<any>(null)
const email = ref<any>(null)
const username = ref<any>(null)
const firstName = ref<any>(null)
const lastName = ref<any>(null)
const gender = ref<any>(null)
const phone = ref<any>(null)
const location = ref<any>(null)
const birthday = ref<any>(null)
const profileDescription = ref<any>(null)


const loadProfile = async () => {
  profile.value = await currentUser.fetchMe();
  firstName.value = await currentUser.me?.firstName || '—';
  lastName.value = await currentUser.me?.lastName || '—';
  email.value = await currentUser.me?.email || '—';
  gender.value = await currentUser.me?.profile?.gender || '—';
  username.value = await currentUser.me?.username || '—';
  location.value = await currentUser.me?.profile?.location || '—';
  birthday.value = await currentUser.me?.profile?.birthday || '—';
  phone.value = await currentUser.me?.profile?.phone || '—';
  profileDescription.value = await currentUser.me?.profile?.information || 'No profile information yet.';
  isLoading.value = false;

}
const form = reactive({
  firstName:  firstName ?? '',
  lastName:  lastName ?? '',
  email: email ?? '',
  gender:  gender ?? '',
  birthday:  birthday ?? '',
  location:  location ?? '',
  phone:  phone ?? '',
})
onMounted(async () => {
  await loadProfile()

  await nextTick()
})
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
