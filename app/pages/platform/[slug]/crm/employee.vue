<script setup lang="ts">
import PlatformSidebarNav from '~/components/platform/PlatformSidebarNav.vue'
import PlatformSplitLayout from '~/components/platform/PlatformSplitLayout.vue'
import { useCrmApi } from '~/composables/api/useCrmApi'
import { getCrmNav } from '~/data/platform-nav'
import type { CrmEmployee } from '~/types/api/crm'

definePageMeta({ public: false, requiresAuth: true })

const route = useRoute()
const slug = computed(() => String(route.params.slug ?? ''))
const { isOwner } = usePlatformPermissions(slug)
const crmNav = computed(() => getCrmNav(slug.value, isOwner.value))
const crmApi = useCrmApi()
const { normalizeError } = useApiError()
const { $errorLogger } = useNuxtApp()

const isPageLoading = ref(true)
const errorMessage = ref('')
const employees = ref<CrmEmployee[]>([])
const paginationTotal = ref(0)

const tableHeaders = [
  { title: 'Nom', key: 'name' },
  { title: 'Email', key: 'email' },
  { title: 'Poste', key: 'positionName' },
  { title: 'Rôle', key: 'roleName' },
  { title: 'Créé le', key: 'createdAt' },
]

const fullName = (employee: CrmEmployee) => `${employee.firstName ?? ''} ${employee.lastName ?? ''}`.trim() || 'N/A'
const formatDate = (value: string | null) => {
  if (!value) {
    return 'N/A'
  }

  return new Date(value).toLocaleDateString('fr-FR')
}

const loadEmployees = async () => {
  if (!slug.value) {
    return
  }

  errorMessage.value = ''

  try {
    const response = await crmApi.getEmployees(slug.value)
    employees.value = response.items
    paginationTotal.value = response.pagination?.totalItems ?? response.items.length
  }
  catch (error) {
    const normalized = normalizeError(error, {
      domain: 'platform.crm.employee',
      action: 'load',
      fallbackMessage: 'Impossible de charger les employés.',
    })
    $errorLogger(error, { area: 'platform.crm.employee', action: 'load', status: normalized.status })
    errorMessage.value = normalized.message
  }
}

onMounted(async () => {
  try {
    await loadEmployees()
  }
  finally {
    isPageLoading.value = false
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
          <h1 class="text-h5 font-weight-bold mb-1">Employees</h1>
          <p class="text-body-2 text-medium-emphasis">Liste des employés du CRM Sales Hub ({{ paginationTotal }}).</p>
        </div>
        <v-btn variant="outlined" :loading="isPageLoading" @click="loadEmployees">Refresh</v-btn>
      </div>

      <v-alert v-if="errorMessage" type="error" variant="tonal" class="mb-4">
        {{ errorMessage }}
      </v-alert>

      <v-skeleton-loader v-if="isPageLoading" type="table-heading, table-thead, table-row-divider@6" />

      <v-data-table
        v-else
        :headers="tableHeaders"
        :items="employees"
        item-value="id"
        class="elevation-1 rounded-xl"
      >
        <template #item.name="{ item }">
          {{ fullName(item) }}
        </template>

        <template #item.email="{ item }">
          {{ item.email || 'N/A' }}
        </template>

        <template #item.positionName="{ item }">
          {{ item.positionName || 'N/A' }}
        </template>

        <template #item.roleName="{ item }">
          <v-chip size="small" color="primary" variant="tonal">{{ item.roleName || 'N/A' }}</v-chip>
        </template>

        <template #item.createdAt="{ item }">
          {{ formatDate(item.createdAt) }}
        </template>
      </v-data-table>
    </section>
  </PlatformSplitLayout>
</template>
