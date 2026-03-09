<script setup lang="ts">
definePageMeta({ public: true, requiresAuth: false })

const currentUser = useCurrentUserStore()
await currentUser.fetchMe()
</script>

<template>
  <SettingsLayout>
    <h3 class="text-h5 font-weight-bold mb-1">Sessions</h3>
    <p class="text-body-1 text-medium-emphasis mb-6">Devices connected to your account.</p>

    <v-list>
      <template v-for="(session, index) in currentUser.me?.sessions || []" :key="session.id || index">
        <v-list-item :prepend-icon="session.current ? 'mdi-monitor' : 'mdi-cellphone'" :title="session.userAgent || 'Unknown device'" :subtitle="session.ip || 'Unknown IP'">
          <template #append>
            <v-chip v-if="session.current" size="small" color="success" variant="tonal">Active</v-chip>
          </template>
        </v-list-item>
        <v-divider v-if="index < (currentUser.me?.sessions?.length || 0) - 1" class="my-2" />
      </template>
    </v-list>
  </SettingsLayout>
</template>
