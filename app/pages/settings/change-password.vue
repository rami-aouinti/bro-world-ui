<script setup lang="ts">
definePageMeta({ public: true, requiresAuth: false })
</script>

<template>
  <SettingsLayout>
    <UiCard rounded="lg">
      <h3 class="text-h5 font-weight-bold mb-6">Change Password</h3>
      <v-text-field label="Current password" type="password" variant="outlined" class="mb-4" />
      <v-text-field label="New password" type="password" variant="outlined" class="mb-4" />
      <v-text-field label="Confirm new password" type="password" variant="outlined" class="mb-8" />

      <h4 class="text-h5 font-weight-bold mb-2">Password requirements</h4>
      <p class="text-body-1 text-medium-emphasis mb-4">Please follow this guide for a strong password:</p>
      <ul class="ms-6 mb-6 text-medium-emphasis">
        <li>One special character</li>
        <li>Min 6 characters</li>
        <li>One number (2 are recommended)</li>
        <li>Change it often</li>
      </ul>

      <div class="d-flex justify-end">
        <v-btn color="primary">Update password</v-btn>
      </div>
    </UiCard>
  </SettingsLayout>
</template>
