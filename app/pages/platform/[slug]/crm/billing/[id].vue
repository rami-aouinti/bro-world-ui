<script setup lang="ts">
import PlatformSidebarNav from '~/components/platform/PlatformSidebarNav.vue'
import PlatformSplitLayout from '~/components/platform/PlatformSplitLayout.vue'
import { useCrmApi } from '~/composables/api/useCrmApi'
import { getCrmNav } from '~/data/platform-nav'

definePageMeta({ public: true, requiresAuth: false })

const route = useRoute()
const slug = computed(() => String(route.params.slug ?? ''))
const billingId = computed(() => String(route.params.id ?? ''))
const { isOwner } = usePlatformPermissions(slug)
const crmNav = computed(() => getCrmNav(slug.value, isOwner.value))
const crmApi = useCrmApi()
const { normalizeError } = useApiError()
const { $errorLogger } = useNuxtApp()

const isLoading = ref(true)
const errorMessage = ref('')
const billing = ref<Awaited<ReturnType<typeof crmApi.getBillingById>> | null>(null)

const loadBilling = async () => {
  if (!slug.value || !billingId.value) {
    return
  }

  errorMessage.value = ''

  try {
    billing.value = await crmApi.getBillingById(slug.value, billingId.value)
  }
  catch (error) {
    const normalized = normalizeError(error, {
      domain: 'platform.crm.billing',
      action: 'detail',
      fallbackKey: 'platform.crm.companies.errors.load',
    })
    $errorLogger(error, { area: 'platform.crm.billing', action: 'detail', status: normalized.status })
    errorMessage.value = normalized.message
  }
}

const formatAmount = (amount: number, currency: string) => new Intl.NumberFormat('fr-FR', {
  style: 'currency',
  currency,
  maximumFractionDigits: 2,
}).format(amount)

const formatDate = (date: string | null) => {
  if (!date) {
    return '—'
  }

  return new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'full',
    timeStyle: 'short',
  }).format(new Date(date))
}

onMounted(async () => {
  try {
    await loadBilling()
  }
  finally {
    isLoading.value = false
  }
})
</script>

<template>
  <PlatformSplitLayout>
    <template #sidebar>
      <PlatformSidebarNav title="platform.crm.sidebar.title" subtitle="platform.common.sidebar.application" :subtitle-values="{ slug }" :items="crmNav" />
    </template>

    <section>
      <div class="d-flex align-center justify-space-between mb-4 flex-wrap ga-2">
        <div>
          <h1 class="text-h5 font-weight-bold mb-1">Billing detail</h1>
          <p class="text-body-2 text-medium-emphasis">Détail d'une facture CRM.</p>
        </div>
        <v-btn variant="outlined" @click="navigateTo(`/platform/${slug}/crm/billing`)">Back to billing list</v-btn>
      </div>

      <v-alert v-if="errorMessage" type="error" variant="tonal" class="mb-4">
        {{ errorMessage }}
      </v-alert>

      <v-skeleton-loader v-if="isLoading" type="article, actions" />

      <v-card v-else-if="billing" rounded="xl">
        <v-card-text>
          <v-row>
            <v-col cols="12" md="6">
              <p class="text-caption text-medium-emphasis mb-1">ID</p>
              <p class="text-body-1 mb-4">{{ billing.id }}</p>

              <p class="text-caption text-medium-emphasis mb-1">Company ID</p>
              <p class="text-body-1 mb-4">{{ billing.companyId }}</p>

              <p class="text-caption text-medium-emphasis mb-1">Label</p>
              <p class="text-body-1 mb-4">{{ billing.label }}</p>

              <p class="text-caption text-medium-emphasis mb-1">Status</p>
              <v-chip color="primary" variant="tonal">{{ billing.status }}</v-chip>
            </v-col>

            <v-col cols="12" md="6">
              <p class="text-caption text-medium-emphasis mb-1">Amount</p>
              <p class="text-body-1 mb-4">{{ formatAmount(billing.amount, billing.currency) }}</p>

              <p class="text-caption text-medium-emphasis mb-1">Currency</p>
              <p class="text-body-1 mb-4">{{ billing.currency }}</p>

              <p class="text-caption text-medium-emphasis mb-1">Due at</p>
              <p class="text-body-1 mb-4">{{ formatDate(billing.dueAt) }}</p>

              <p class="text-caption text-medium-emphasis mb-1">Paid at</p>
              <p class="text-body-1">{{ formatDate(billing.paidAt) }}</p>
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>
    </section>
  </PlatformSplitLayout>
</template>
