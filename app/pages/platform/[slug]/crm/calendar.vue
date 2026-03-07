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
        <v-btn variant="outlined" block :to="crmPath('dashboard')">Dashboard</v-btn>
        <v-btn variant="outlined" block class="mt-2" :to="crmPath('calendar')">Calendar</v-btn>
      </div>
    </template>

    <template #default>
      <UiSectionHeader title="Calendrier commercial" subtitle="Rendez-vous et revues de compte" />
      <UiCard>
        <v-timeline density="compact" align="start" side="end">
          <v-timeline-item dot-color="primary" size="small">09:00 - Revue pipeline équipe A</v-timeline-item>
          <v-timeline-item dot-color="info" size="small">11:30 - Démo client Northwind</v-timeline-item>
          <v-timeline-item dot-color="success" size="small">15:00 - Signature BlueSoft</v-timeline-item>
        </v-timeline>
      </UiCard>
    </template>
  </PlatformSplitLayout>
</template>
