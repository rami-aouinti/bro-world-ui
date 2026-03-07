<script setup lang="ts">
import EntityCard from '~/components/platform/cards/EntityCard.vue'
import PlatformSplitLayout from '~/components/platform/PlatformSplitLayout.vue'
import UiSectionHeader from '~/components/ui/UiSectionHeader.vue'
import UiSkeletonCardGrid from '~/components/ui/state/UiSkeletonCardGrid.vue'
import { crmProjects } from '~/data/platform/crm'

definePageMeta({ public: true, requiresAuth: false })

const route = useRoute()
const slug = computed(() => String(route.params.slug ?? ''))
const crmPath = (page: string) => `/platform/${slug.value}/crm/${page}`
const loading = ref(true)

const projects = computed(() =>
  [...crmProjects].sort((a, b) => a.dueDate.localeCompare(b.dueDate)),
)

onMounted(() => {
  setTimeout(() => {
    loading.value = false
  }, 200)
})
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
      <UiSkeletonCardGrid v-if="loading" :cards="4" />
      <v-row v-else>
        <v-col v-for="project in projects" :key="project.id" cols="12" md="6" lg="4">
          <EntityCard
            :title="project.title"
            :subtitle="`Compte ${project.companySlug}`"
            :category="project.category"
            :status="project.status"
            :tags="project.tags"
            date-label="Échéance"
            :date-value="project.dueDate"
          />
        </v-col>
      </v-row>
    </template>
  </PlatformSplitLayout>
</template>
