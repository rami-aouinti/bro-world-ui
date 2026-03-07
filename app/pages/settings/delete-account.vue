<script setup lang="ts">
definePageMeta({ public: true, requiresAuth: false })
</script>

<template>
  <SettingsLayout>
    <UiCard rounded="lg">
      <div class="d-flex flex-wrap align-center ga-4 justify-space-between">
        <div>
          <h3 class="text-h5 font-weight-bold mb-2">Delete Account</h3>
          <p class="text-body-1 text-medium-emphasis mb-0">Once you delete your account, there is no going back. Please be certain.</p>
        </div>

        <div class="d-flex ga-2">
          <v-btn variant="outlined">Deactivate</v-btn>
          <v-btn color="error">Delete account</v-btn>
        </div>
      </div>
    </UiCard>
  </SettingsLayout>
</template>
