<script setup lang="ts">
import PlatformSidebarNav from '~/components/platform/PlatformSidebarNav.vue'
import PlatformSplitLayout from '~/components/platform/PlatformSplitLayout.vue'
import { getCrmNav } from '~/data/platform-nav'

definePageMeta({ public: false, requiresAuth: true })
const route = useRoute()
const slug = computed(() => String(route.params.slug ?? ''))
const platformPermissions = usePlatformPermissions(slug)
const { isOwner } = platformPermissions
const accessDenied = ref(false)

const crmNav = computed(() => getCrmNav(slug.value, isOwner.value))

const adminCards = computed(() => {
  const base = `/platform/${slug.value}/crm`

  return [
    { title: 'Dashboard', description: 'Overview of KPIs and activity.', icon: 'mdi-view-dashboard-outline', to: `${base}/dashboard` },
    { title: 'Companies', description: 'Manage company accounts and details.', icon: 'mdi-office-building-outline', to: `${base}/companies` },
    { title: 'Billing', description: 'Track subscriptions and invoices.', icon: 'mdi-credit-card-outline', to: `${base}/billing` },
    { title: 'Contacts', description: 'View and organize contact records.', icon: 'mdi-account-group-outline', to: `${base}/contacts` },
    { title: 'Employee', description: 'Browse the CRM team members and roles.', icon: 'mdi-badge-account-outline', to: `${base}/employee` },
    { title: 'Reports', description: 'Analyze performance and trends.', icon: 'mdi-chart-line', to: `${base}/reports` },
  ]
})

onMounted(async () => {
  await platformPermissions.resolveApplication()

  if (!platformPermissions.canAccessAdmin.value) {
    accessDenied.value = true

    setTimeout(() => {
      navigateTo(platformPermissions.getDeniedRedirectPath('crm'))
    }, 1200)
  }
})
</script>

<template>
  <PlatformSplitLayout>
    <template #sidebar>
      <PlatformSidebarNav title="platform.crm.sidebar.title" subtitle="platform.common.sidebar.application" :subtitle-values="{ slug }" :items="crmNav" />
    </template>

    <section>
      <v-alert v-if="accessDenied" type="error" variant="tonal" class="mb-6">
        Access denied to CRM admin area. Redirecting…
      </v-alert>

      <template v-else>
        <h1 class="text-h5 font-weight-bold mb-1">Admin CRM</h1>
        <p class="text-body-2 text-medium-emphasis mb-6">Select a section to open the related CRM page.</p>

        <v-row>
          <v-col v-for="card in adminCards" :key="card.to" cols="12" sm="6" lg="4">
            <v-card :to="card.to" rounded="xl" hover class="h-100">
              <v-card-text>
                <div class="d-flex align-center mb-3 ga-2">
                  <v-icon :icon="card.icon" size="22" color="primary" />
                  <p class="text-subtitle-1 font-weight-bold mb-0">{{ card.title }}</p>
                </div>
                <p class="text-body-2 text-medium-emphasis">{{ card.description }}</p>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </template>
    </section>
  </PlatformSplitLayout>
</template>
