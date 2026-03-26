<script setup lang="ts">
import PlatformSidebarNav from '~/components/platform/PlatformSidebarNav.vue'
import PlatformSplitLayout from '~/components/platform/PlatformSplitLayout.vue'
import PlatformHeroHeader from '~/components/platform/sections/PlatformHeroHeader.vue'
import { getCrmNav } from '~/data/platform-nav'
import { useCrmApi } from '~/composables/api/useCrmApi'
import UiSkeletonCardGrid from "~/components/ui/state/UiSkeletonCardGrid.vue";

const crmApi = useCrmApi()

definePageMeta({ public: true, requiresAuth: false })

const route = useRoute()
const slug = computed(() => String(route.params.slug ?? ''))
const { isOwner } = usePlatformPermissions(slug)
const navItems = computed(() => getCrmNav(slug.value, isOwner.value))

const { data: reports, pending, error, refresh } = useAsyncData(
  () => `crm-reports-${slug.value}`,
  () => slug.value ? crmApi.getReports(slug.value) : Promise.resolve(null),
  { watch: [slug], default: () => null },
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
    <client-only>
      <teleport to="#app-bar-teleport-target">
        <v-btn variant="text" icon="mdi-refresh" :loading="pending" @click="refresh()"></v-btn>
      </teleport>
    </client-only>
    <template #sidebar>
      <PlatformSidebarNav title="platform.crm.sidebar.reports" subtitle="platform.common.sidebar.application" :subtitle-values="{ slug }" :items="navItems"  />
    </template>
    <template #aside>
      <v-row class="mb-2">
        <v-col v-for="stat in kpiCards" :key="stat.label" cols="12" sm="6">
          <v-card rounded="xl" variant="tonal" color="primary">
            <v-card-text>
              <div class="text-caption mb-1">{{ stat.label }}</div>
              <div class="text-h5 font-weight-bold">{{ stat.value }}</div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
      <v-row class="mb-4">
        <v-col v-for="item in countCards" :key="item.label" cols="12" sm="6">
          <v-card rounded="xl">
            <v-card-text>
              <div class="text-caption text-medium-emphasis">{{ item.label }}</div>
              <div class="text-h6 font-weight-bold">{{ item.value }}</div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </template>
    <section>
      <v-alert v-if="error" type="error" variant="tonal" class="mb-4">
        Unable to load CRM reports.
      </v-alert>

      <UiSkeletonCardGrid :cards="4" :columns="6"  v-if="pending" />

      <template v-else>
        <v-card rounded="xl" class="mb-4" variant="text">
          <v-card-title class="px-0">Top contacts</v-card-title>
          <v-card-text class="px-0">
            <v-row>
              <v-col v-for="contact in contacts" :key="contact.id" cols="12" md="6">
                <v-card rounded="xl" variant="outlined" class="h-100">
                  <v-card-text>
                    <div class="d-flex justify-space-between align-start ga-2 mb-2">
                      <p class="text-subtitle-1 font-weight-bold mb-0">{{ contact.name }}</p>
                      <v-chip size="small" color="primary" variant="tonal">Score {{ contact.score }}</v-chip>
                    </div>
                    <p class="text-body-2 mb-1"><strong>Email:</strong> {{ contact.email || 'N/A' }}</p>
                    <p class="text-body-2 mb-1"><strong>Poste:</strong> {{ contact.jobTitle || 'N/A' }}</p>
                    <p class="text-body-2 text-medium-emphasis mb-0"><strong>Ville:</strong> {{ contact.city || 'N/A' }}</p>
                  </v-card-text>
                </v-card>
              </v-col>
              <v-col v-if="contacts.length === 0" cols="12">
                <v-alert type="info" variant="tonal">Aucun contact prioritaire.</v-alert>
              </v-col>
            </v-row>
          </v-card-text>
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
