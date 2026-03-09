<script setup lang="ts">
definePageMeta({ public: false, requiresAuth: true })

const items = [
  { title: 'Mentions', description: 'Notify when another user mentions you in a comment' },
  { title: 'Comments', description: 'Notify when another user comments your item' },
  { title: 'Follows', description: 'Notify when another user follows you' },
  { title: 'Log in from a new device', description: '' },
]

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

const currentUser = useCurrentUserStore()

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
    <h3 class="text-h5 font-weight-bold mb-1">Notifications</h3>
    <p class="text-body-1 text-medium-emphasis mb-6">Choose how you receive notifications.</p>
    <v-table>
      <thead>
      <tr>
        <th>Activity</th>
        <th class="text-center">Email</th>
        <th class="text-center">Push</th>
        <th class="text-center">SMS</th>
      </tr>
      </thead>
      <tbody>
      <tr v-for="item in items" :key="item.title">
        <td>
          <div class="font-weight-medium">{{ item.title }}</div>
          <div class="text-body-2 text-medium-emphasis">{{ item.description }}</div>
        </td>
        <td class="text-center"><v-switch hide-details /></td>
        <td class="text-center"><v-switch hide-details /></td>
        <td class="text-center"><v-switch hide-details /></td>
      </tr>
      </tbody>
    </v-table>
  </SettingsLayout>
</template>
