<script setup lang="ts">
import PlatformSidebarNav from '~/components/platform/PlatformSidebarNav.vue'
import PlatformSplitLayout from '~/components/platform/PlatformSplitLayout.vue'
import { useCrmApi } from '~/composables/api/useCrmApi'
import { getCrmNav } from '~/data/platform-nav'
import type { CrmEmployee } from '~/types/api/crm'
import { useListingPagination } from '~/composables/useListingPagination'

definePageMeta({ public: false, requiresAuth: true })

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
const employees = ref<CrmEmployee[]>([])
const paginationTotal = ref(0)
const selectedItem = ref<CrmEmployee | null>(null)
const showFilters = ref(true)
const searchQuery = ref('')
const roleFilter = ref('')
const createForm = reactive({
  firstName: '',
  lastName: '',
  email: '',
  positionName: '',
  roleName: '',
})

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
const {
  page,
  paginatedItems: paginatedEmployees,
  pageLength,
  shouldShowPagination,
} = useListingPagination(filteredEmployees, [searchQuery, roleFilter])
const selectEmployee = (employee: CrmEmployee) => {
  selectedItem.value = employee
  showFilters.value = false
}
const openEmployee = (employee: CrmEmployee) => {
  selectEmployee(employee)
}
const showFiltersPanel = () => {
  showFilters.value = true
}
const resetCreateForm = () => {
  Object.assign(createForm, {
    firstName: '',
    lastName: '',
    email: '',
    positionName: '',
    roleName: '',
  })
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

const createEmployee = async () => {
  if (!slug.value || !createForm.firstName.trim() || !createForm.lastName.trim()) {
    return
  }

  isMutating.value = true
  try {
    const employeeApi = crmApi as typeof crmApi & {
      createEmployee?: (applicationSlug: string, payload: Record<string, string>) => Promise<CrmEmployee>
    }
    if (typeof employeeApi.createEmployee === 'function') {
      const created = await employeeApi.createEmployee(slug.value, {
        firstName: createForm.firstName.trim(),
        lastName: createForm.lastName.trim(),
        email: createForm.email.trim(),
        positionName: createForm.positionName.trim(),
        roleName: createForm.roleName.trim(),
      })
      employees.value = [created, ...employees.value]
      paginationTotal.value += 1
    }

    showCreateDialog.value = false
    resetCreateForm()
  }
  finally {
    isMutating.value = false
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
      <teleport to="#app-bar-teleport-target-right">
        <v-btn rounded="xl" variant="outlined" @click="showCreateDialog = true">Ajouter un employé</v-btn>
      </teleport>
    </client-only>
    <template #sidebar>
      <PlatformSidebarNav title="platform.crm.sidebar.title" subtitle="platform.common.sidebar.application" :subtitle-values="{ slug }" :items="crmNav" />
    </template>
    <template #aside>
      <div class="d-flex flex-column ga-4">
        <template v-if="showFilters">
          <v-card rounded="xl" variant="text">
            <v-card-title class="text-subtitle-2">Filters</v-card-title>
            <v-card-text class="d-flex flex-column ga-3">
              <v-text-field v-model="searchQuery" label="Search" rounded="xl" density="comfortable" variant="outlined" hide-details prepend-inner-icon="mdi-magnify" />
              <v-text-field v-model="roleFilter" label="Role" rounded="xl" density="comfortable" variant="outlined" hide-details prepend-inner-icon="mdi-magnify" />
            </v-card-text>
          </v-card>
        </template>
        <v-card v-else-if="selectedItem" rounded="xl" variant="text">
          <v-btn size="small" variant="tonal" prepend-icon="mdi-filter-outline" @click="showFiltersPanel">Filter</v-btn>
          <h4 class="text-truncate">{{ fullName(selectedItem) }}</h4>
          <v-card-text>
            <p class="text-body-2 mb-1"><strong>Email:</strong> {{ selectedItem.email || 'N/A' }}</p>
            <p class="text-body-2 mb-1"><strong>Role:</strong> {{ selectedItem.roleName || 'N/A' }}</p>
            <p class="text-body-2 mb-0"><strong>Position:</strong> {{ selectedItem.positionName || 'N/A' }}</p>
          </v-card-text>
        </v-card>
      </div>
    </template>
    <section class="employee-page">
      <div class="employee-page__content">
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
          <v-col v-for="employee in paginatedEmployees" :key="employee.id" cols="12" md="6" lg="4">
            <v-card rounded="xl" variant="outlined" class="h-100 cursor-pointer" @click="selectEmployee(employee)">
              <v-card-text>
                <div class="d-flex justify-space-between align-start ga-2 mb-2">
                  <p class="text-subtitle-1 font-weight-bold mb-0">{{ fullName(employee) }}</p>
                  <v-chip size="small" color="primary" variant="tonal">{{ employee.roleName || 'N/A' }}</v-chip>
                </div>
                <p class="text-body-2 mb-1"><strong>Email:</strong> {{ employee.email || 'N/A' }}</p>
                <p class="text-body-2 mb-1"><strong>Poste:</strong> {{ employee.positionName || 'N/A' }}</p>
                <p class="text-body-2 text-medium-emphasis mb-3"><strong>Créé le:</strong> {{ formatDate(employee.createdAt) }}</p>
                <div class="d-flex justify-between ga-2">
                  <v-btn variant="outlined" rounded="xl" class="text-body-2" @click.stop="openEmployee(employee)">Open</v-btn>
                  <v-spacer />
                  <v-menu location="bottom end">
                    <template #activator="{ props }">
                      <v-btn
                        v-bind="props"
                        variant="outlined"
                        rounded="xl"
                        class="text-body-2"
                        @click.stop
                      >
                        Manage
                      </v-btn>
                    </template>
                    <v-list density="compact">
                      <v-list-item title="View in panel" @click.stop="openEmployee(employee)" />
                    </v-list>
                  </v-menu>
                </div>
              </v-card-text>
            </v-card>
          </v-col>
          <v-col v-if="paginatedEmployees.length === 0" cols="12">
            <v-alert type="info" variant="tonal">Aucun employé trouvé.</v-alert>
          </v-col>
        </v-row>
      </div>

      <div v-if="shouldShowPagination" class="employee-page__footer d-flex justify-center">
        <v-pagination v-model="page" :length="pageLength" total-visible="5" />
      </div>

      <v-dialog v-model="showCreateDialog" max-width="560">
        <v-card>
          <v-card-title>Ajouter un employé</v-card-title>
          <v-card-text>
            <v-row>
              <v-col cols="12" md="6"><v-text-field v-model="createForm.firstName" label="Prénom" required /></v-col>
              <v-col cols="12" md="6"><v-text-field v-model="createForm.lastName" label="Nom" required /></v-col>
              <v-col cols="12"><v-text-field v-model="createForm.email" label="Email" type="email" /></v-col>
              <v-col cols="12" md="6"><v-text-field v-model="createForm.positionName" label="Poste" /></v-col>
              <v-col cols="12" md="6"><v-text-field v-model="createForm.roleName" label="Rôle" /></v-col>
            </v-row>
          </v-card-text>
          <v-card-actions>
            <v-spacer />
            <v-btn variant="text" @click="showCreateDialog = false">Annuler</v-btn>
            <v-btn color="primary" :loading="isMutating" @click="createEmployee">Créer</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </section>
  </PlatformSplitLayout>
</template>
<style scoped>
.employee-page {
  min-height: 75vh;
  display: flex;
  flex-direction: column;
}

.employee-page__content {
  flex: 1;
}

.employee-page__footer {
  margin-top: auto;
  padding-bottom: 0;
}
</style>
