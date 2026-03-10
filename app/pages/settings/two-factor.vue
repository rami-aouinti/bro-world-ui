<script setup lang="ts">
import { backupCodes, twoFactorMethods } from '~/data/settings-demo'

definePageMeta({ public: false, requiresAuth: true })
</script>

<template>
  <SettingsLayout>
    <v-card rounded="xl" variant="outlined">
      <v-card-text>
        <div class="d-flex align-center mb-5">
          <h3 class="text-h5 font-weight-bold">Two-factor authentication</h3>
          <v-chip class="ms-auto" color="success" variant="tonal">Enabled</v-chip>
        </div>

        <v-list class="mb-4" rounded="lg" border>
          <v-list-item
            v-for="method in twoFactorMethods"
            :key="method.name"
            :title="method.name"
            :subtitle="method.status"
            :prepend-icon="method.icon"
          >
            <template #append><v-btn variant="outlined" size="small">{{ method.action }}</v-btn></template>
          </v-list-item>
        </v-list>

        <v-sheet rounded="lg" color="surface-variant" class="pa-4">
          <div class="d-flex align-center mb-2">
            <p class="text-subtitle-2 mb-0">Backup codes (fake data)</p>
            <v-spacer />
            <v-btn size="small" variant="text" prepend-icon="mdi-refresh">Regenerate</v-btn>
          </div>
          <div class="d-flex flex-wrap ga-2">
            <v-chip v-for="code in backupCodes" :key="code" variant="flat" color="primary">{{ code }}</v-chip>
          </div>
        </v-sheet>
      </v-card-text>
    </v-card>
  </SettingsLayout>
</template>
