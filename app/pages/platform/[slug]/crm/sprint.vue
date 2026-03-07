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
        <v-btn variant="outlined" block :to="crmPath('projects')">Projects</v-btn>
        <v-btn variant="outlined" block class="mt-2" :to="crmPath('sprint')">Sprint</v-btn>
      </div>
    </template>

    <template #default>
      <UiSectionHeader title="Sprint board" subtitle="Tâches CRM en cours" />
      <v-row>
        <v-col cols="12" md="4">
          <UiCard title="À faire" compact>
            <v-list density="compact"><v-list-item title="Préparer démo" /><v-list-item title="Qualifier 8 leads" /></v-list>
          </UiCard>
        </v-col>
        <v-col cols="12" md="4">
          <UiCard title="En cours" compact>
            <v-list density="compact"><v-list-item title="Refonte pipeline" /><v-list-item title="Atelier pricing" /></v-list>
          </UiCard>
        </v-col>
        <v-col cols="12" md="4">
          <UiCard title="Terminé" compact>
            <v-list density="compact"><v-list-item title="Sync équipe vente" /><v-list-item title="Import comptes" /></v-list>
          </UiCard>
        </v-col>
      </v-row>
    </template>
  </PlatformSplitLayout>
</template>
