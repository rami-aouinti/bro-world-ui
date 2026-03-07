<script setup lang="ts">
import PlatformSplitLayout from '~/components/platform/PlatformSplitLayout.vue'
import UiListCard from '~/components/ui/UiListCard.vue'
import UiSectionHeader from '~/components/ui/UiSectionHeader.vue'

definePageMeta({ public: true, requiresAuth: false })

const route = useRoute()
const slug = computed(() => String(route.params.slug ?? ''))
const crmPath = (page: string) => `/platform/${slug.value}/crm/${page}`

const projects = [
  { name: 'Onboarding ERP', stage: 'Kickoff', due: '18/06' },
  { name: 'Migration CRM', stage: 'En cours', due: '30/06' },
  { name: 'Campagne Q3', stage: 'Planning', due: '12/07' },
]
</script>

<template>
  <PlatformSplitLayout>
    <template #sidebar>
      <UiSectionHeader title="CRM" :subtitle="`Application ${slug}`" dense />
      <div class="platform-layout__sidebar-actions">
        <v-btn variant="outlined" block :to="crmPath('dashboard')">Dashboard</v-btn>
        <v-btn variant="outlined" block class="mt-2" :to="crmPath('projects')">Projects</v-btn>
        <v-btn variant="outlined" block class="mt-2" :to="crmPath('sprint')">Sprint</v-btn>
      </div>
    </template>

    <template #default>
      <UiSectionHeader title="Projets clients" subtitle="Vue portfolio des déploiements" />
      <v-row>
        <v-col v-for="project in projects" :key="project.name" cols="12" md="4">
          <UiListCard>
            <p class="text-subtitle-1 font-weight-medium">{{ project.name }}</p>
            <p class="text-body-2 text-medium-emphasis mb-2">Phase: {{ project.stage }}</p>
            <v-chip size="small" variant="tonal" color="primary">Échéance {{ project.due }}</v-chip>
          </UiListCard>
        </v-col>
      </v-row>
    </template>
  </PlatformSplitLayout>
</template>
