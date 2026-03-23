<script setup lang="ts">
import PlatformSidebarNav from '~/components/platform/PlatformSidebarNav.vue'
import PlatformSplitLayout from '~/components/platform/PlatformSplitLayout.vue'
import { useCrmApi } from '~/composables/api/useCrmApi'
import { getCrmNav } from '~/data/platform-nav'
import type { CrmBilling, CreateCrmBillingPayload, CrmBillingStatus, UpdateCrmBillingPayload } from '~/types/api/crm'
import {useListingPagination} from '~/composables/useListingPagination'

definePageMeta({ public: true, requiresAuth: false })

const route = useRoute()
const slug = computed(() => String(route.params.slug ?? ''))
const { isOwner } = usePlatformPermissions(slug)
const crmNav = computed(() => getCrmNav(slug.value, isOwner.value))
const crmApi = useCrmApi()
const { normalizeError } = useApiError()
const { $errorLogger } = useNuxtApp()

const isPageLoading = ref(true)
const isMutating = ref(false)
const errorMessage = ref('')
const showCreateDialog = ref(false)
const showEditDialog = ref(false)
const billings = ref<Awaited<ReturnType<typeof crmApi.getBillings>>['items']>([])
const selectedItem = ref<CrmBilling | null>(null)
const showFilters = ref(true)
const searchQuery = ref('')
const statusFilter = ref<'all' | CrmBillingStatus>('all')
const filteredBillings = computed(() => billings.value.filter((billing) => {
  const query = searchQuery.value.trim().toLowerCase()
  const matchesSearch = !query
    || billing.label.toLowerCase().includes(query)
    || billing.currency.toLowerCase().includes(query)
    || billing.companyId.toLowerCase().includes(query)
  const matchesStatus = statusFilter.value === 'all' || billing.status === statusFilter.value

  return matchesSearch && matchesStatus
}))
const {
  page,
  paginatedItems: paginatedBillings,
  pageLength,
  shouldShowPagination,
} = useListingPagination(filteredBillings, [searchQuery, statusFilter])
const selectedBillingId = ref('')

const statusOptions: Array<{ title: string, value: CrmBillingStatus }> = [
  { title: 'Pending', value: 'pending' },
  { title: 'Paid', value: 'paid' },
  { title: 'Overdue', value: 'overdue' },
]

const createForm = reactive<CreateCrmBillingPayload>({
  companyId: '',
  label: '',
  amount: 0,
  currency: 'EUR',
  status: 'pending',
  dueAt: '',
  paidAt: '',
})

const editForm = reactive<UpdateCrmBillingPayload>({
  companyId: '',
  label: '',
  amount: 0,
  currency: 'EUR',
  status: 'pending',
  dueAt: '',
  paidAt: '',
})

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
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(date))
}

const selectBilling = (billing: CrmBilling) => {
  selectedItem.value = billing
  showFilters.value = false
}

const showFiltersPanel = () => {
  showFilters.value = true
}

const loadBillings = async () => {
  if (!slug.value) {
    return
  }

  errorMessage.value = ''

  try {
    const response = await crmApi.getBillings(slug.value)
    billings.value = response.items
    if (selectedItem.value) {
      selectedItem.value = billings.value.find(item => item.id === selectedItem.value?.id) ?? null
    }
  }
  catch (error) {
    const normalized = normalizeError(error, {
      domain: 'platform.crm.billing',
      action: 'load',
      fallbackKey: 'platform.crm.companies.errors.load',
    })
    $errorLogger(error, { area: 'platform.crm.billing', action: 'load', status: normalized.status })
    errorMessage.value = normalized.message
  }
}

const resetCreateForm = () => {
  Object.assign(createForm, {
    companyId: '',
    label: '',
    amount: 0,
    currency: 'EUR',
    status: 'pending',
    dueAt: '',
    paidAt: '',
  })
}

const createBilling = async () => {
  if (!slug.value || !createForm.label?.trim() || !createForm.companyId?.trim()) {
    return
  }

  isMutating.value = true

  try {
    const created = await crmApi.createBilling(slug.value, {
      ...createForm,
      label: createForm.label.trim(),
      companyId: createForm.companyId.trim(),
      dueAt: createForm.dueAt || null,
      paidAt: createForm.paidAt || null,
    })
    billings.value = [created, ...billings.value]
    showCreateDialog.value = false
    resetCreateForm()
  }
  finally {
    isMutating.value = false
  }
}

const openEditDialog = (billingId: string) => {
  const billing = billings.value.find(item => item.id === billingId)
  if (!billing) {
    return
  }

  selectedBillingId.value = billingId
  Object.assign(editForm, {
    companyId: billing.companyId,
    label: billing.label,
    amount: billing.amount,
    currency: billing.currency,
    status: billing.status,
    dueAt: billing.dueAt,
    paidAt: billing.paidAt,
  })
  showEditDialog.value = true
}

const updateBilling = async () => {
  if (!slug.value || !selectedBillingId.value || !editForm.label?.trim()) {
    return
  }

  isMutating.value = true

  try {
    const updated = await crmApi.updateBilling(slug.value, selectedBillingId.value, {
      ...editForm,
      label: editForm.label.trim(),
      companyId: editForm.companyId?.trim(),
      dueAt: editForm.dueAt || null,
      paidAt: editForm.paidAt || null,
    })

    billings.value = billings.value.map(item => item.id === selectedBillingId.value ? updated : item)
    showEditDialog.value = false
  }
  finally {
    isMutating.value = false
  }
}

const removeBilling = async (billingId: string) => {
  if (!slug.value) {
    return
  }

  isMutating.value = true
  try {
    await crmApi.deleteBilling(slug.value, billingId)
    billings.value = billings.value.filter(item => item.id !== billingId)
  }
  finally {
    isMutating.value = false
  }
}


onMounted(async () => {
  try {
    await loadBillings()
  }
  finally {
    isPageLoading.value = false
  }
})
</script>

<template>
  <PlatformSplitLayout>
    <client-only>
      <teleport to="#app-bar-teleport-target">
        <v-btn variant="text" size="sm" icon="mdi-refresh" :loading="isPageLoading" @click="loadBillings"></v-btn>
      </teleport>
      <teleport to="#app-bar-teleport-target-right">
        <v-btn variant="outlined" @click="showCreateDialog = true">Create billing</v-btn>
      </teleport>
    </client-only>
    <template #sidebar>
      <PlatformSidebarNav title="platform.crm.sidebar.title" subtitle="platform.common.sidebar.application" :subtitle-values="{ slug }" :items="crmNav" />
    </template>
    <template #aside>
      <div class="d-flex flex-column ga-4">
        <template v-if="showFilters">
          <v-card rounded="xl" variant="outlined">
            <v-card-title class="text-subtitle-2">Filters</v-card-title>
            <v-card-text class="d-flex flex-column ga-3">
              <v-text-field v-model="searchQuery" label="Search" variant="outlined" hide-details prepend-inner-icon="mdi-magnify" />
              <v-select v-model="statusFilter" label="Status" variant="outlined" hide-details :items="[{ title: 'All', value: 'all' }, ...statusOptions]" item-title="title" item-value="value" />
            </v-card-text>
          </v-card>
        </template>
        <v-card v-else-if="selectedItem" rounded="xl" variant="outlined">
          <v-card-title class="d-flex justify-space-between align-center ga-2">
            <span>{{ selectedItem.label }}</span>
            <v-btn size="small" variant="tonal" prepend-icon="mdi-filter-outline" @click="showFiltersPanel">Filter</v-btn>
          </v-card-title>
          <v-card-text>
            <p class="text-body-2 mb-1"><strong>Status:</strong> {{ selectedItem.status }}</p>
            <p class="text-body-2 mb-1"><strong>Amount:</strong> {{ formatAmount(selectedItem.amount, selectedItem.currency) }}</p>
            <p class="text-body-2 mb-0"><strong>Due:</strong> {{ formatDate(selectedItem.dueAt) }}</p>
          </v-card-text>
        </v-card>
      </div>
    </template>
    <section>
      <v-alert v-if="errorMessage" type="error" variant="tonal" class="mb-4">
        {{ errorMessage }}
      </v-alert>

      <v-row v-if="isPageLoading">
        <v-col v-for="i in 6" :key="`billing-skeleton-${i}`" cols="12" md="6" lg="6">
          <v-skeleton-loader type="card, article" class="h-100" />
        </v-col>
      </v-row>

      <v-row v-else>
        <v-col v-for="billing in paginatedBillings" :key="billing.id" cols="12" md="6" lg="6">
          <v-card variant="outlined" rounded="xl" hover class="h-100 cursor-pointer" @click="selectBilling(billing)">
            <v-card-text>
              <div class="d-flex justify-space-between align-start ga-2 mb-2">
                <p class="text-subtitle-1 font-weight-bold">{{ billing.label }}</p>
                <v-chip size="small" color="primary" variant="tonal">{{ billing.status }}</v-chip>
              </div>
              <p class="text-body-2 mb-1">{{ formatAmount(billing.amount, billing.currency) }}</p>
              <p class="text-body-2 text-medium-emphasis mb-1">Due: {{ formatDate(billing.dueAt) }}</p>
              <p class="text-body-2 text-medium-emphasis mb-3">Paid: {{ formatDate(billing.paidAt) }}</p>
              <div class="d-flex ga-2">
                <v-btn size="small" variant="tonal" @click.stop="openEditDialog(billing.id)">Edit</v-btn>
                <v-btn size="small" color="error" variant="tonal" :loading="isMutating" @click.stop="removeBilling(billing.id)">Delete</v-btn>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
      <div v-if="shouldShowPagination" class="d-flex justify-center mt-4">
        <v-pagination v-model="page" :length="pageLength" total-visible="5" />
      </div>

      <v-dialog v-model="showCreateDialog" max-width="580">
        <v-card>
          <v-card-title>Create billing</v-card-title>
          <v-card-text>
            <v-text-field v-model="createForm.label" label="Label" required />
            <v-text-field v-model="createForm.companyId" label="Company ID" required />
            <v-text-field v-model.number="createForm.amount" label="Amount" type="number" />
            <v-text-field v-model="createForm.currency" label="Currency" placeholder="EUR / USD / GBP" />
            <v-select v-model="createForm.status" label="Status" :items="statusOptions" item-title="title" item-value="value" />
            <v-text-field v-model="createForm.dueAt" label="Due at" type="datetime-local" />
            <v-text-field v-model="createForm.paidAt" label="Paid at" type="datetime-local" />
          </v-card-text>
          <v-card-actions>
            <v-spacer />
            <v-btn variant="text" @click="showCreateDialog = false">Cancel</v-btn>
            <v-btn color="primary" :loading="isMutating" @click="createBilling">Create</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <v-dialog v-model="showEditDialog" max-width="580">
        <v-card>
          <v-card-title>Edit billing</v-card-title>
          <v-card-text>
            <v-text-field v-model="editForm.label" label="Label" required />
            <v-text-field v-model="editForm.companyId" label="Company ID" required />
            <v-text-field v-model.number="editForm.amount" label="Amount" type="number" />
            <v-text-field v-model="editForm.currency" label="Currency" placeholder="EUR / USD / GBP" />
            <v-select v-model="editForm.status" label="Status" :items="statusOptions" item-title="title" item-value="value" />
            <v-text-field v-model="editForm.dueAt" label="Due at" type="datetime-local" />
            <v-text-field v-model="editForm.paidAt" label="Paid at" type="datetime-local" />
          </v-card-text>
          <v-card-actions>
            <v-spacer />
            <v-btn variant="text" @click="showEditDialog = false">Cancel</v-btn>
            <v-btn color="primary" :loading="isMutating" @click="updateBilling">Save</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </section>
  </PlatformSplitLayout>
</template>
