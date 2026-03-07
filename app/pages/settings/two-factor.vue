<script setup lang="ts">
definePageMeta({ public: true, requiresAuth: false })
</script>

<template>
  <SettingsLayout>
    <UiCard rounded="lg">
      <div class="d-flex align-center mb-8">
        <h3 class="text-h5 font-weight-bold">Two-factor authentication</h3>
        <v-chip class="ms-auto" color="success" variant="tonal">Enabled</v-chip>
      </div>
      <v-list>
        <v-list-item title="Security keys" subtitle="No Security Keys">
          <template #append><v-btn variant="outlined">Add</v-btn></template>
        </v-list-item>
        <v-divider class="my-2" />
        <v-list-item title="SMS Number" subtitle="+4012374423">
          <template #append><v-btn variant="outlined">Edit</v-btn></template>
        </v-list-item>
        <v-divider class="my-2" />
        <v-list-item title="Authenticator app" subtitle="Not Configured">
          <template #append><v-btn variant="outlined">Set up</v-btn></template>
        </v-list-item>
      </v-list>
    </UiCard>
  </SettingsLayout>
</template>
