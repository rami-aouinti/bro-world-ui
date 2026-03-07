<script setup lang="ts">
definePageMeta({ public: true, requiresAuth: false })

const providers = [
  { name: 'Slack', description: 'Messaging', enabled: true },
  { name: 'Spotify', description: 'Music', enabled: true },
  { name: 'Atlassian', description: 'Payment vendor', enabled: true },
  { name: 'Asana', description: 'Organize your team', enabled: false },
]
</script>

<template>
  <SettingsLayout>
    <h3 class="text-h5 font-weight-bold mb-1">Accounts</h3>
    <p class="text-body-1 text-medium-emphasis mb-6">Here you can setup and manage your integration settings.</p>

    <v-list>
      <template v-for="(provider, index) in providers" :key="provider.name">
        <v-list-item :title="provider.name" :subtitle="provider.description">
          <template #append>
            <div class="d-flex align-center ga-2">
              <span class="text-body-2 text-medium-emphasis">{{ provider.enabled ? 'Enabled' : 'Disabled' }}</span>
              <v-switch :model-value="provider.enabled" color="primary" hide-details inset />
            </div>
          </template>
        </v-list-item>
        <v-divider v-if="index < providers.length - 1" class="my-2" />
      </template>
    </v-list>
  </SettingsLayout>
</template>
