<script setup lang="ts">
import PlatformSidebarNav from '~/components/platform/PlatformSidebarNav.vue'
import PlatformSplitLayout from '~/components/platform/PlatformSplitLayout.vue'
import { getCrmNav } from '~/data/platform-nav'

definePageMeta({ public: false, requiresAuth: true, requiresPlatformAdmin: true, platformDomain: 'crm' })
const route = useRoute()
const router = useRouter()
const slug = computed(() => String(route.params.slug ?? ''))
const platformPermissions = usePlatformPermissions(slug)
const { isOwner } = platformPermissions
const accessDenied = ref(false)

const crmNav = computed(() => getCrmNav(slug.value, isOwner.value))

const adminCards = computed(() => {
  const base = `/platform/${slug.value}/crm`

  return [
    { title: 'Companies', description: 'Manage company accounts and details.', icon: 'mdi-office-building-outline', to: `${base}/companies` },
    { title: 'Reports', description: 'Analyze performance and trends.', icon: 'mdi-file', to: `${base}/reports` },
    { title: 'Settings', description: 'Analyze performance and trends.', icon: 'mdi-cog', to: `${base}/reports` },
    { title: 'Statistics', description: 'Analyze performance and trends.', icon: 'mdi-chart-line', to: `${base}/reports` },
    { title: 'Cron', description: 'Analyze performance and trends.', icon: 'mdi-step-forward', to: `${base}/reports` },
    { title: 'Logs', description: 'Analyze performance and trends.', icon: 'mdi-projector-screen', to: `${base}/reports` },
  ]
})

const adminRightCards = computed(() => {
  const base = `/platform/${slug.value}/crm`

  return [
    { title: 'Billing', description: 'Track subscriptions and invoices.', icon: 'mdi-credit-card-outline', to: `${base}/billing` },
    { title: 'Contacts', description: 'View and organize contact records.', icon: 'mdi-account-group-outline', to: `${base}/contacts` },
    { title: 'Employee', description: 'Browse the CRM team members and roles.', icon: 'mdi-badge-account-outline', to: `${base}/employee` },
  ]
})

onMounted(async () => {
  await platformPermissions.resolveApplication()

  if (!platformPermissions.canAccessAdmin.value) {
    accessDenied.value = true

    setTimeout(() => {
      router.push(platformPermissions.getDeniedRedirectPath('crm'))
    }, 1200)
  }
})
</script>

<template>
  <PlatformSplitLayout>
    <template #sidebar>
      <v-chip variant="outlined" class="mb-4 quiz-title-chip">
        {{ slug }}
      </v-chip>
      <PlatformSidebarNav title="platform.crm.sidebar.title" subtitle="platform.common.sidebar.application" :subtitle-values="{ slug }" :items="crmNav" />
    </template>

    <template #aside>
      <v-row>
        <v-col v-for="card in adminRightCards" :key="card.to" cols="12" sm="12" >
          <v-card :to="card.to" rounded="xl" variant="outlined" hover class="h-100">
            <v-card-text>
              <div class="d-flex align-center mb-3 ga-2">
                <v-icon :icon="card.icon" size="22" color="primary" />
                <p class="text-subtitle-1 font-weight-bold">{{ card.title }}</p>
              </div>
              <p class="text-body-2 text-medium-emphasis">{{ card.description }}</p>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </template>
    <section>
      <v-alert v-if="accessDenied" type="error" variant="tonal" class="mb-6">
        Access denied to CRM admin area. Redirecting…
      </v-alert>

      <template v-else>
        <v-row>
          <v-col v-for="card in adminCards" :key="card.to" cols="12" sm="6">
            <v-card :to="card.to" rounded="xl" variant="outlined" hover class="h-100">
              <v-card-text>
                <div class="d-flex align-center mb-3 ga-2">
                  <v-icon :icon="card.icon" size="22" color="primary" />
                  <p class="text-subtitle-1 font-weight-bold">{{ card.title }}</p>
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
