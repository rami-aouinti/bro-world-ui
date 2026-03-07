<script setup lang="ts">
import PlatformSplitLayout from '~/components/platform/PlatformSplitLayout.vue'
import UiCard from '~/components/ui/UiCard.vue'
import UiSectionHeader from '~/components/ui/UiSectionHeader.vue'

definePageMeta({
  public: true,
  requiresAuth: false,
})

const route = useRoute()
const slug = computed(() => String(route.params.slug ?? ''))
const crmPath = (page: string) => `/platform/${slug.value}/crm/${page}`
const { isOwner } = usePlatformApplication(slug)

const quickLinks = [
  { label: 'Dashboard', to: crmPath('dashboard') },
  { label: 'Companies', to: crmPath('companies') },
  { label: 'Projects', to: crmPath('projects') },
  { label: 'Sprint', to: crmPath('sprint') },
  { label: 'Calendar', to: crmPath('calendar') },
  { label: 'Settings', to: crmPath('settings') },
  { label: 'Billing', to: crmPath('billing') },
]
</script>

<template>
  <PlatformSplitLayout>
    <template #sidebar>
      <UiSectionHeader title="CRM" :subtitle="`Application ${slug}`" dense />
      <div class="platform-layout__sidebar-actions">
        <v-btn variant="outlined" block :to="crmPath('home')">Home</v-btn>
        <v-btn variant="outlined" block class="mt-2" :to="crmPath('dashboard')">Dashboard</v-btn>
        <v-btn v-if="isOwner" variant="outlined" block class="mt-2" :to="crmPath('admin')">Admin</v-btn>
        <v-btn variant="text" block class="mt-2" to="/platform">Retour liste</v-btn>
      </div>
    </template>

    <template #default>
      <UiSectionHeader
        title="CRM workspace"
        :subtitle="`Point d'entrée CRM pour ${slug}`"
      />

      <UiCard title="Navigation rapide" subtitle="Accédez aux sections métier CRM">
        <v-row>
          <v-col v-for="link in quickLinks" :key="link.to" cols="12" md="6" lg="4">
            <v-btn block color="primary" variant="tonal" :to="link.to">
              {{ link.label }}
            </v-btn>
          </v-col>
        </v-row>
      </UiCard>
    </template>
  </PlatformSplitLayout>
</template>
