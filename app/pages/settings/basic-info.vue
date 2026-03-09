<script setup lang="ts">
definePageMeta({ public: true, requiresAuth: false })

const currentUser = useCurrentUserStore()
const saving = ref(false)

await currentUser.fetchMe()

const form = reactive({
  firstName: currentUser.me?.firstName ?? '',
  lastName: currentUser.me?.lastName ?? '',
  email: currentUser.me?.email ?? '',
  gender: currentUser.me?.profile?.gender ?? '',
  birthday: currentUser.me?.profile?.birthday ?? '',
  location: currentUser.me?.profile?.location ?? '',
  phone: currentUser.me?.profile?.phone ?? '',
})

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
</script>

<template>
  <SettingsLayout>
    <h3 class="text-h5 font-weight-bold mb-6">Basic Info</h3>
    <v-form @submit.prevent="onSubmit">
      <v-row>
        <v-col cols="12" md="6"><v-text-field v-model="form.firstName" label="First Name" variant="underlined" /></v-col>
        <v-col cols="12" md="6"><v-text-field v-model="form.lastName" label="Last Name" variant="underlined" /></v-col>
        <v-col cols="12" md="4"><v-select v-model="form.gender" :items="['Female', 'Male']" label="I'm" variant="underlined" /></v-col>
        <v-col cols="12" md="8"><v-text-field v-model="form.birthday" label="Birth Date" variant="underlined" placeholder="1987-05-18" /></v-col>
        <v-col cols="12" md="6"><v-text-field v-model="form.email" label="Email" variant="underlined" /></v-col>
        <v-col cols="12" md="6"><v-text-field v-model="form.location" label="Your Location" variant="underlined" /></v-col>
        <v-col cols="12" md="6"><v-text-field v-model="form.phone" label="Phone Number" variant="underlined" /></v-col>
      </v-row>
      <div class="d-flex justify-end mt-4">
        <v-btn color="primary" type="submit" :loading="saving">Save changes</v-btn>
      </div>
    </v-form>
  </SettingsLayout>
</template>
