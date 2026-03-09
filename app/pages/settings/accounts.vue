<script setup lang="ts">
definePageMeta({ public: false, requiresAuth: true })

const currentUser = useCurrentUserStore()

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
onMounted(async () => {
  await loadProfile()

  await nextTick()
})

</script>

<template>
  <SettingsLayout>
    <h3 class="text-h5 font-weight-bold mb-1">Accounts</h3>
    <p class="text-body-1 text-medium-emphasis mb-6">Social providers linked to your account.</p>

    <v-list>
      <template v-for="(provider, index) in currentUser.me?.socials || []" :key="provider.provider">
        <v-list-item :title="provider.provider" :subtitle="provider.providerId" />
        <v-divider v-if="index < (currentUser.me?.socials?.length || 0) - 1" class="my-2" />
      </template>
    </v-list>
  </SettingsLayout>
</template>
