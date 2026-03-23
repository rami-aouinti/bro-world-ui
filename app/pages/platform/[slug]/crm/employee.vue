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
const selectedItem = ref<CrmEmployee | null>(null)
const showFilters = ref(true)
const searchQuery = ref('')
const roleFilter = ref('')

const fullName = (employee: CrmEmployee) => `${employee.firstName ?? ''} ${employee.lastName ?? ''}`.trim() || 'N/A'
const filteredEmployees = computed(() => employees.value.filter((employee) => {
  const query = searchQuery.value.trim().toLowerCase()
  const role = roleFilter.value.trim().toLowerCase()
  const matchesSearch = !query
    || fullName(employee).toLowerCase().includes(query)
    || (employee.email || '').toLowerCase().includes(query)
    || (employee.positionName || '').toLowerCase().includes(query)
  const matchesRole = !role || (employee.roleName || '').toLowerCase().includes(role)

  return matchesSearch && matchesRole
}))
const selectEmployee = (employee: CrmEmployee) => {
  selectedItem.value = employee
  showFilters.value = false
}
const showFiltersPanel = () => {
  showFilters.value = true
}
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
    if (selectedItem.value) {
      selectedItem.value = employees.value.find(employee => employee.id === selectedItem.value?.id) ?? null
    }
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
    <client-only>
      <teleport to="#app-bar-teleport-target">
        <v-btn
          size="large"
          variant="text"
          class="text-none app-bar__link-btn"
          :loading="isPageLoading"
          @click="loadEmployees"
          icon="mdi-refresh"
        />
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
              <v-text-field v-model="roleFilter" label="Role" variant="outlined" hide-details />
            </v-card-text>
          </v-card>
        </template>
        <v-card v-else-if="selectedItem" rounded="xl" variant="outlined">
          <v-card-title class="d-flex justify-space-between align-center ga-2">
            <span>{{ fullName(selectedItem) }}</span>
            <v-btn size="small" variant="tonal" prepend-icon="mdi-filter-outline" @click="showFiltersPanel">Filter</v-btn>
          </v-card-title>
          <v-card-text>
            <p class="text-body-2 mb-1"><strong>Email:</strong> {{ selectedItem.email || 'N/A' }}</p>
            <p class="text-body-2 mb-1"><strong>Role:</strong> {{ selectedItem.roleName || 'N/A' }}</p>
            <p class="text-body-2 mb-0"><strong>Position:</strong> {{ selectedItem.positionName || 'N/A' }}</p>
          </v-card-text>
        </v-card>
      </div>
    </template>
    <section>
      <div class="d-flex align-center justify-space-between mb-4 flex-wrap ga-2">
        <div>
          <h1 class="text-h5 font-weight-bold mb-1">Employees</h1>
          <p class="text-body-2 text-medium-emphasis">Liste des employés du CRM Sales Hub ({{ paginationTotal }}).</p>
        </div>
      </div>

      <v-alert v-if="errorMessage" type="error" variant="tonal" class="mb-4">
        {{ errorMessage }}
      </v-alert>

      <v-row v-if="isPageLoading">
        <v-col v-for="index in 6" :key="`employee-skeleton-${index}`" cols="12" md="6" lg="4">
          <v-skeleton-loader type="card, article" class="h-100" />
        </v-col>
      </v-row>

      <v-row v-else>
        <v-col v-for="employee in filteredEmployees" :key="employee.id" cols="12" md="6" lg="4">
          <v-card rounded="xl" variant="outlined" class="h-100 cursor-pointer" @click="selectEmployee(employee)">
            <v-card-text>
              <div class="d-flex justify-space-between align-start ga-2 mb-2">
                <p class="text-subtitle-1 font-weight-bold mb-0">{{ fullName(employee) }}</p>
                <v-chip size="small" color="primary" variant="tonal">{{ employee.roleName || 'N/A' }}</v-chip>
              </div>
              <p class="text-body-2 mb-1"><strong>Email:</strong> {{ employee.email || 'N/A' }}</p>
              <p class="text-body-2 mb-1"><strong>Poste:</strong> {{ employee.positionName || 'N/A' }}</p>
              <p class="text-body-2 text-medium-emphasis mb-0"><strong>Créé le:</strong> {{ formatDate(employee.createdAt) }}</p>
            </v-card-text>
          </v-card>
        </v-col>
        <v-col v-if="filteredEmployees.length === 0" cols="12">
          <v-alert type="info" variant="tonal">Aucun employé trouvé.</v-alert>
        </v-col>
      </v-row>
    </section>
  </PlatformSplitLayout>
</template>
