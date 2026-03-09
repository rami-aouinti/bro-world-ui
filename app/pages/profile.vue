<script setup lang="ts">
import PlatformSplitLayout from '~/components/platform/PlatformSplitLayout.vue'

definePageMeta({
  public: false,
  requiresAuth: true,
})
const currentUser = useCurrentUserStore()

const profile = ref<any>(null)
const fullName = ref<any>(null)
const email = ref<any>(null)
const username = ref<any>(null)
const locationLabel = ref<any>(null)
const phone = ref<any>(null)
const profileDescription = ref<any>(null)

const loadProfile = async () => {
  profile.value = await currentUser.fetchMe();
   fullName.value = await currentUser.displayName;
   email.value = await currentUser.me?.email || '—';
   username.value = await currentUser.me?.username || '—';
   locationLabel.value = await currentUser.me?.profile?.location || '—';
   phone.value = await currentUser.me?.profile?.phone || '—';
   profileDescription.value = await currentUser.me?.profile?.information || 'No profile information yet.';
}

onMounted(async () => {
  await loadProfile()

  await nextTick()
})

</script>

<template>
  <PlatformSplitLayout>
    <template #sidebar>
      <h6 class="mb-4 text-h6 font-weight-bold">Profile Information</h6>
      <p class="text-body-1 mb-4 text-medium-emphasis">{{ profileDescription }}</p>
      <v-divider class="mb-4" />
      <v-list class="pa-0 bg-transparent">
        <v-list-item class="px-0"><strong>Full Name:</strong>&nbsp; {{ fullName }}</v-list-item>
        <v-list-item class="px-0"><strong>Username:</strong>&nbsp; {{ username }}</v-list-item>
        <v-list-item class="px-0"><strong>Email:</strong>&nbsp; {{ email }}</v-list-item>
        <v-list-item class="px-0"><strong>Phone:</strong>&nbsp; {{ phone }}</v-list-item>
        <v-list-item class="px-0"><strong>Location:</strong>&nbsp; {{ locationLabel }}</v-list-item>
      </v-list>
    </template>

    <section>
      <v-row>
        <v-col cols="12" md="6">
          <v-card class="h-100 pa-5" elevation="2" rounded="xl">
            <h6 class="mb-4 text-h6 font-weight-bold">Social Accounts</h6>
            <v-list class="pa-0 bg-transparent">
              <v-list-item v-for="social in profile?.me?.socials || []" :key="`${social?.provider}-${social?.providerId}`" class="px-0">
                <v-list-item-title class="text-capitalize">{{ social?.provider }}</v-list-item-title>
                <template #append>
                  <span class="text-body-2 text-medium-emphasis">{{ social?.providerId }}</span>
                </template>
              </v-list-item>
            </v-list>
          </v-card>
        </v-col>

        <v-col cols="12" md="6">
          <v-card class="h-100 pa-5" elevation="2" rounded="xl">
            <h6 class="mb-4 text-h6 font-weight-bold">Sessions</h6>
            <v-list class="pa-0 bg-transparent">
              <v-list-item v-for="(session, index) in profile?.me?.sessions || []" :key="session?.id || index" class="px-0 mb-2">
                <v-list-item-title>{{ session?.userAgent || 'Unknown device' }}</v-list-item-title>
                <v-list-item-subtitle>{{ session?.ip || 'Unknown IP' }}</v-list-item-subtitle>
                <template #append>
                  <v-chip v-if="session?.current" size="small" color="success" variant="tonal">Current</v-chip>
                </template>
              </v-list-item>
              <v-list-item v-if="!(profile?.me?.sessions || []).length" class="px-0">
                <v-list-item-title>No active sessions returned by API.</v-list-item-title>
              </v-list-item>
            </v-list>
          </v-card>
        </v-col>
      </v-row>
    </section>
  </PlatformSplitLayout>
</template>
