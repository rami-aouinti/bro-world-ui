<script setup lang="ts">
definePageMeta({ public: true, requiresAuth: false })

const currentUser = useCurrentUserStore()
await currentUser.fetchMe()
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
