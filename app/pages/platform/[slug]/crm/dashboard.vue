<script setup lang="ts">
import PlatformSidebarNav from '~/components/platform/PlatformSidebarNav.vue'
import PlatformSplitLayout from '~/components/platform/PlatformSplitLayout.vue'
import { getCrmNav } from '~/data/platform-nav'
import { useCrmStore } from '~/stores/crm'

definePageMeta({ public: true, requiresAuth: false })

const route = useRoute()
const slug = computed(() => String(route.params.slug ?? ''))
const { isOwner } = usePlatformPermissions(slug)
const crmNav = computed(() => getCrmNav(slug.value, isOwner.value))

const crmStore = useCrmStore()
const dashboard = computed(() => crmStore.getDashboard(slug.value))

if (slug.value) {
  await crmStore.fetchDashboard(slug.value)
}

const kpis = computed(() => {
  if (!dashboard.value) {
    return []
  }

  return [
    { label: 'Companies', value: dashboard.value.companies },
    { label: 'Projects', value: dashboard.value.projects },
    { label: 'Tasks', value: dashboard.value.tasks },
    { label: 'Pending requests', value: dashboard.value.taskRequests.pending },
  ]
})
</script>

<template>
  <PlatformSplitLayout>
    <template #sidebar>
      <PlatformSidebarNav title="platform.crm.sidebar.title" subtitle="platform.common.sidebar.application" :subtitle-values="{ slug }" :items="crmNav" />
    </template>

    <section>
      <h1 class="text-h5 font-weight-bold mb-1">Dashboard CRM</h1>
      <p class="text-body-2 text-medium-emphasis mb-6">Consolidated indicators from the dashboard endpoint.</p>

      <v-row class="mb-4">
        <v-col v-for="item in kpis" :key="item.label" cols="12" md="6" lg="3">
          <v-card rounded="xl">
            <v-card-text>
              <p class="text-overline mb-1">{{ item.label }}</p>
              <p class="text-h5 font-weight-bold mb-0">{{ item.value }}</p>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <v-card v-if="dashboard" rounded="xl">
        <v-card-text>
          <p class="text-subtitle-1 font-weight-bold mb-2">Task requests</p>
          <v-chip size="small" color="warning" class="mr-2">Pending: {{ dashboard.taskRequests.pending }}</v-chip>
          <v-chip size="small" color="success" class="mr-2">Approved: {{ dashboard.taskRequests.approved }}</v-chip>
          <v-chip size="small" color="error">Rejected: {{ dashboard.taskRequests.rejected }}</v-chip>
        </v-card-text>
      </v-card>
    </section>
  </PlatformSplitLayout>
</template>
