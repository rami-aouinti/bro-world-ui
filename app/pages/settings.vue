<script setup lang="ts">
import PlatformSplitLayout from '~/components/platform/PlatformSplitLayout.vue'
import UiSectionHeader from '~/components/ui/UiSectionHeader.vue'

definePageMeta({
  public: true,
  requiresAuth: false,
})

const { t } = useI18n()
</script>

<template>
  <PlatformSplitLayout>
    <template #sidebar>
      <UiSectionHeader :title="t('settings.title')" />

      <div class="platform-layout__sidebar-actions">
        <v-btn variant="outlined" block to="/profile">Profile</v-btn>
        <v-btn variant="outlined" block class="mt-2" to="/settings">Settings</v-btn>
      </div>
    </template>

    <template #default>
      <UiSectionHeader
        :title="t('settings.title')"
        :subtitle="t('settings.description')"
      />

      <v-alert type="info" variant="tonal">
        {{ t('settings.notice') }}
      </v-alert>
    </template>
  </PlatformSplitLayout>
</template>
