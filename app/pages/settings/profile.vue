<script setup lang="ts">
definePageMeta({ public: true, requiresAuth: false })
</script>

<template>
  <SettingsLayout>
    <UiCard rounded="lg" class="mb-6">
      <div class="d-flex align-center ga-4">
        <UiAvatar src="/images/placeholders/platform-media-fallback.svg" name="Richard Devis" size="lg" />
        <div>
          <h2 class="text-h5 font-weight-bold mb-1">Richard Devis</h2>
          <p class="text-body-1 text-medium-emphasis mb-0">CEO / Co-Founder</p>
        </div>
      </div>
    </UiCard>

    <UiCard rounded="lg">
      <h3 class="text-h6 font-weight-bold mb-4">Profile information</h3>
      <p class="text-body-1 text-medium-emphasis mb-0">
        Hi, I’m Alec Thompson. If two equally difficult paths, choose the one more painful in the short term.
      </p>
    </UiCard>
  </SettingsLayout>
</template>
