<script setup lang="ts">
import PlatformSidebarNav from '~/components/platform/PlatformSidebarNav.vue'
import PlatformSplitLayout from '~/components/platform/PlatformSplitLayout.vue'
import PlatformHeroHeader from '~/components/platform/sections/PlatformHeroHeader.vue'
import PlatformTicketBoard from '~/components/platform/sections/PlatformTicketBoard.vue'
import { crmCompanies, crmStats } from '~/data/platform-demo'
import { platformProposals } from '~/data/platform-enhanced'
import { getCrmNav } from '~/data/platform-nav'

definePageMeta({ public: true, requiresAuth: false })
const route = useRoute()
const slug = computed(() => String(route.params.slug ?? ''))
const { isOwner } = usePlatformPermissions(slug)
const showAccessDenied = computed(() => route.query.accessDenied === 'admin')

const crmNav = computed(() => getCrmNav(slug.value, isOwner.value))
</script>

<template>
  <PlatformSplitLayout>
    <template #sidebar><PlatformSidebarNav title="platform.crm.sidebar.title" subtitle="platform.common.sidebar.application" :subtitle-values="{ slug }" :items="crmNav" /></template>
    <template #aside>
      <v-row class="mb-2">
        <v-col v-for="stat in crmStats" :key="stat.label" cols="12" sm="6">
          <v-card rounded="xl" variant="tonal" :color="stat.color || 'primary'" class="h-100">
            <v-card-text>
              <p class="text-caption text-uppercase mb-1">{{ stat.label }}</p>
              <p class="text-h5 font-weight-bold mb-1">{{ stat.value }}</p>
              <p class="text-caption">{{ stat.trend }}</p>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </template>
    <section>
      <v-alert v-if="showAccessDenied" type="error" variant="tonal" class="mb-4">
        Admin access denied: insufficient permissions for this application.
      </v-alert>
      <v-row>
        <v-col v-for="company in crmCompanies" :key="company.id" cols="12" md="6" xl="4">
          <v-card rounded="xl" variant="outlined" class="crm-company-card h-100" hover>
            <v-card-text>
              <div class="d-flex align-center justify-space-between mb-2">
                <p class="text-subtitle-1 font-weight-bold">{{ company.name }}</p>
                <v-chip size="small" :color="company.status === 'Active' ? 'success' : company.status === 'Prospect' ? 'info' : 'warning'" variant="tonal">{{ company.status }}</v-chip>
              </div>
              <p class="text-body-2 text-medium-emphasis">{{ company.sector }} · {{ company.size }} employees</p>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
      <PlatformTicketBoard class="mt-5" title="Tickets CRM prioritaires" :tickets="platformProposals.crm" />
    </section>
  </PlatformSplitLayout>
</template>

<style scoped>
.crm-company-card { transition: transform 180ms ease, box-shadow 180ms ease; }
.crm-company-card:hover { transform: translateY(-4px); }
</style>
