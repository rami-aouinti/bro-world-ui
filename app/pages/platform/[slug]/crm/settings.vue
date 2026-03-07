<script setup lang="ts">
import PlatformSplitLayout from '~/components/platform/PlatformSplitLayout.vue'
import UiCard from '~/components/ui/UiCard.vue'
import UiSectionHeader from '~/components/ui/UiSectionHeader.vue'

definePageMeta({ public: true, requiresAuth: false })

const route = useRoute()
const slug = computed(() => String(route.params.slug ?? ''))
const crmPath = (page: string) => `/platform/${slug.value}/crm/${page}`
</script>

<template>
  <PlatformSplitLayout>
    <template #sidebar>
      <UiSectionHeader title="CRM" :subtitle="`Application ${slug}`" dense />
      <div class="platform-layout__sidebar-actions">
        <v-btn variant="outlined" block :to="crmPath('settings')">Settings</v-btn>
        <v-btn variant="outlined" block class="mt-2" :to="crmPath('billing')">Billing</v-btn>
      </div>
    </template>

    <template #default>
      <UiSectionHeader title="Paramètres CRM" subtitle="Préférences et automatisations" />
      <UiCard>
        <v-switch label="Activer les notifications de relance" color="primary" inset />
        <v-switch label="Synchroniser agenda partagé" color="primary" inset />
        <v-select label="Pipeline par défaut" :items="['Enterprise', 'SMB', 'Partner']" class="mt-2" />
      </UiCard>
    </template>
  </PlatformSplitLayout>
</template>
