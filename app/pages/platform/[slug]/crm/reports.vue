<script setup lang="ts">
import PlatformSidebarNav from '~/components/platform/PlatformSidebarNav.vue'
import PlatformSplitLayout from '~/components/platform/PlatformSplitLayout.vue'
import PlatformHeroHeader from '~/components/platform/sections/PlatformHeroHeader.vue'
import { getCrmNav } from '~/data/platform-nav'
import { useCrmApi } from '~/composables/api/useCrmApi'

const crmApi = useCrmApi()

definePageMeta({ public: true, requiresAuth: false })

const route = useRoute()
const slug = computed(() => String(route.params.slug ?? ''))
const { isOwner } = usePlatformPermissions(slug)
const navItems = computed(() => getCrmNav(slug.value, isOwner.value))

const { data: reports, pending, error } = await useAsyncData(
  () => `crm-reports-${slug.value}`,
  () => crmApi.getReports(slug.value),
  { watch: [slug] },
)

const formatCurrency = (value: number) => new Intl.NumberFormat('fr-FR', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 2,
}).format(value)

const kpiCards = computed(() => {
  if (!reports.value) {
    return []
  }

  return [
    { label: 'Pipeline', value: formatCurrency(reports.value.kpis.pipeline) },
    { label: 'Deals won', value: reports.value.kpis.dealsWon },
    { label: 'Cycle (days)', value: reports.value.kpis.cycleDays },
    { label: 'NPS clients', value: reports.value.kpis.npsClients },
  ]
})

const countCards = computed(() => {
  if (!reports.value) {
    return []
  }

  return [
    { label: 'Companies', value: reports.value.counts.companies },
    { label: 'Contacts', value: reports.value.counts.contacts },
    { label: 'Employees', value: reports.value.counts.employees },
    { label: 'Billings', value: reports.value.counts.billings },
    { label: 'Tasks', value: reports.value.counts.tasks },
  ]
})

const recommendedActions = computed(() => reports.value?.recommendedActions ?? [])
const contacts = computed(() => reports.value?.contacts ?? [])
</script>

<template>
  <PlatformSplitLayout>
    <template #sidebar>
      <PlatformSidebarNav title="platform.crm.sidebar.reports" subtitle="platform.common.sidebar.application" :subtitle-values="{ slug }" :items="navItems" />
    </template>
    <section>
      <PlatformHeroHeader title="platform.crm.hero.reports.title" subtitle="platform.crm.hero.reports.subtitle" cta="platform.crm.hero.reports.cta" />

      <v-alert v-if="error" type="error" variant="tonal" class="mb-4">
        Unable to load CRM reports.
      </v-alert>

      <v-row v-if="pending" class="mb-2">
        <v-col v-for="index in 4" :key="`kpi-skeleton-${index}`" cols="12" sm="6" lg="3">
          <v-skeleton-loader type="card" />
        </v-col>
      </v-row>

      <template v-else>
        <v-row class="mb-2">
          <v-col v-for="stat in kpiCards" :key="stat.label" cols="12" sm="6" lg="3">
            <v-card rounded="xl" variant="tonal" color="primary">
              <v-card-text>
                <div class="text-caption mb-1">{{ stat.label }}</div>
                <div class="text-h5 font-weight-bold">{{ stat.value }}</div>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>

        <v-row class="mb-4">
          <v-col v-for="item in countCards" :key="item.label" cols="12" sm="6" md="4" lg="2">
            <v-card rounded="xl">
              <v-card-text>
                <div class="text-caption text-medium-emphasis">{{ item.label }}</div>
                <div class="text-h6 font-weight-bold">{{ item.value }}</div>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>

        <v-card rounded="xl" class="mb-4">
          <v-card-title>Top contacts</v-card-title>
          <v-table density="compact">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Job title</th>
                <th>City</th>
                <th class="text-right">Score</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="contact in contacts" :key="contact.id">
                <td>{{ contact.name }}</td>
                <td>{{ contact.email }}</td>
                <td>{{ contact.jobTitle }}</td>
                <td>{{ contact.city }}</td>
                <td class="text-right">{{ contact.score }}</td>
              </tr>
            </tbody>
          </v-table>
        </v-card>

        <v-card rounded="xl">
          <v-card-title>Recommended actions</v-card-title>
          <v-list>
            <v-list-item v-for="action in recommendedActions" :key="`${action.priority}-${action.title}`">
              <template #prepend>
                <v-chip size="small" :color="action.priority === 'P0' ? 'error' : 'warning'">{{ action.priority }}</v-chip>
              </template>
              <v-list-item-title>{{ action.title }}</v-list-item-title>
              <v-list-item-subtitle>{{ action.owner }} • ETA {{ action.etaDays }} days</v-list-item-subtitle>
            </v-list-item>
          </v-list>
        </v-card>
      </template>
    </section>
  </PlatformSplitLayout>
</template>
