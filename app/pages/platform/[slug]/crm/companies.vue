<script setup lang="ts">
import PlatformSidebarNav from '~/components/platform/PlatformSidebarNav.vue'
import CrmListingShell from '~/components/platform/crm/CrmListingShell.vue'
import { getCrmNav } from '~/data/platform-nav'
import { useCrmStore } from '~/stores/crm'
import type { CrmCompany, CreateCrmCompanyPayload } from '~/types/api/crm'
import {useListingPagination} from '~/composables/useListingPagination'

definePageMeta({ public: true, requiresAuth: false })

const route = useRoute()
const slug = computed(() => String(route.params.slug ?? ''))
const { isOwner } = usePlatformPermissions(slug)
const crmNav = computed(() => getCrmNav(slug.value, isOwner.value))
const crmStore = useCrmStore()
const { normalizeError } = useApiError()
const { $errorLogger } = useNuxtApp()
const errorMessage = ref('')
const isMutating = ref(false)
const isPageLoading = ref(true)
const showCreateDialog = ref(false)
const form = reactive<CreateCrmCompanyPayload>({
  name: '',
  industry: '',
  website: '',
  contactEmail: '',
  phone: '',
})

const companies = computed(() => crmStore.getCompanies(slug.value))
const selectedItem = ref<CrmCompany | null>(null)
const showFilters = ref(true)
const searchQuery = ref('')
const industryFilter = ref('')
const filteredCompanies = computed(() => companies.value.filter((company) => {
  const query = searchQuery.value.trim().toLowerCase()
  const industry = industryFilter.value.trim().toLowerCase()
  const matchesSearch = !query
    || company.name.toLowerCase().includes(query)
    || (company.contactEmail || '').toLowerCase().includes(query)
    || (company.phone || '').toLowerCase().includes(query)
  const matchesIndustry = !industry || (company.industry || '').toLowerCase().includes(industry)

  return matchesSearch && matchesIndustry
}))
const {
  page,
  paginatedItems: paginatedCompanies,
  pageLength,
  shouldShowPagination,
} = useListingPagination(filteredCompanies, [searchQuery, industryFilter])

const goToCompany = (id: string) => navigateTo(`/platform/${slug.value}/crm/company/${id}`)
const selectCompany = (company: CrmCompany) => {
  selectedItem.value = company
  showFilters.value = false
}
const showFiltersPanel = () => {
  showFilters.value = true
}

const resetCreateForm = () => {
  Object.assign(form, { name: '', industry: '', website: '', contactEmail: '', phone: '' })
}

const loadCompanies = async (force = false) => {
  if (!slug.value) {
    return
  }

  errorMessage.value = ''

  try {
    await crmStore.fetchCompanies(slug.value, force)
    if (selectedItem.value) {
      selectedItem.value = companies.value.find(company => company.id === selectedItem.value?.id) ?? null
    }
  }
  catch (error) {
    const normalized = normalizeError(error, {
      domain: 'platform.crm.companies',
      action: 'load',
      fallbackKey: 'platform.crm.companies.errors.load',
    })
    $errorLogger(error, { area: 'platform.crm.companies', action: 'load', status: normalized.status })
    errorMessage.value = normalized.message
  }
}

const createCompany = async () => {
  if (!slug.value || !form.name.trim()) {
    return
  }

  isMutating.value = true
  try {
    await crmStore.createCompany(slug.value, { ...form, name: form.name.trim() })
    showCreateDialog.value = false
    resetCreateForm()
  }
  finally {
    isMutating.value = false
  }
}

const removeCompany = async (id: string) => {
  if (!slug.value) {
    return
  }

  await crmStore.deleteCompany(slug.value, id)
}

onMounted(async () => {
  try {
    await loadCompanies()
  }
  finally {
    isPageLoading.value = false
  }
})
</script>

<template>
  <CrmListingShell
    v-model:page="page"
    :show-filters="showFilters"
    :should-show-pagination="shouldShowPagination"
    :page-length="pageLength"
  >
    <template #app-bar-left>
      <v-btn
        size="large"
        variant="text"
        class="text-none app-bar__link-btn"
        :loading="isPageLoading"
        @click="loadCompanies(true)"
        icon="mdi-refresh"
        aria-label="Icon action"
       />
    </template>

    <template #app-bar-right>
      <v-btn rounded="xl" variant="outlined" @click="showCreateDialog = true">New Company</v-btn>
    </template>

    <template #sidebar>
      <PlatformSidebarNav title="platform.crm.sidebar.title" subtitle="platform.common.sidebar.application" :subtitle-values="{ slug }" :items="crmNav" />
    </template>

    <template #filters>
      <v-card rounded="xl" variant="text">
        <v-card-title class="text-subtitle-2">Filters</v-card-title>
        <v-card-text class="d-flex flex-column ga-3">
          <v-text-field v-model="searchQuery" rounded="xl" density="comfortable" variant="outlined" label="Search" prepend-inner-icon="mdi-magnify" hide-details />
          <v-text-field v-model="industryFilter" rounded="xl" density="comfortable" variant="outlined" label="Industry" prepend-inner-icon="mdi-magnify" hide-details />
        </v-card-text>
      </v-card>
    </template>

    <template #selected>
      <v-card v-if="selectedItem" rounded="xl" variant="text">
        <v-btn size="small" variant="tonal" prepend-icon="mdi-filter-outline" @click="showFiltersPanel">Filter</v-btn>
        <NuxtLink :to="selectedItem?.website" class="text-decoration-none">
          <h4 class="text-truncate">{{ selectedItem?.name }}</h4>
        </NuxtLink>
        <v-card-text>
          <p class="text-body-2 mb-1"><strong>Industry:</strong> {{ selectedItem?.industry || 'N/A' }}</p>
          <p class="text-body-2 mb-1"><strong>Email:</strong> {{ selectedItem?.contactEmail || 'N/A' }}</p>
          <p class="text-body-2 mb-0"><strong>Phone:</strong> {{ selectedItem?.phone || 'N/A' }}</p>
        </v-card-text>
      </v-card>
    </template>

    <template #cards>
      <v-alert v-if="errorMessage" type="error" variant="tonal" class="mb-4">
        {{ errorMessage }}
      </v-alert>

      <v-row v-if="isPageLoading">
        <v-col v-for="i in 6" :key="`company-skeleton-${i}`" cols="12" md="6" lg="6">
          <v-skeleton-loader type="card, article" class="h-100" />
        </v-col>
      </v-row>

      <v-row v-else>
        <v-col v-for="company in paginatedCompanies" :key="company.id" cols="12" md="6" lg="6">
          <v-card rounded="xl" variant="outlined" hover class="h-100 cursor-pointer" @click="selectCompany(company)">
            <v-card-text>
              <div class="d-flex justify-space-between align-start mb-2 ga-2">
                <p class="text-subtitle-1 font-weight-bold">{{ company?.name }}</p>
              </div>
              <div class="d-flex justify-between ga-2">
                <v-btn variant="outlined" rounded="xl" class="text-body-2" @click.stop="goToCompany(company.id)">Open</v-btn>
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
                    <v-list-item prepend-icon="mdi-pencil" title="Edit" @click.stop="goToCompany(company.id)" />
                    <v-list-item prepend-icon="mdi-delete" title="Delete" @click.stop="removeCompany(company.id)" />
                  </v-list>
                </v-menu>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </template>

    <template #dialogs>
      <v-dialog v-model="showCreateDialog" max-width="560" retain-focus>
        <v-card>
          <v-card-title>New Company</v-card-title>
          <v-card-text>
            <v-row>
              <v-col cols="12"><v-text-field v-model="form.name" rounded="xl" variant="outlined" label="Name" required /></v-col>
              <v-col cols="12"><v-text-field v-model="form.industry" rounded="xl" variant="outlined" label="Industry" /></v-col>
              <v-col cols="12"><v-text-field v-model="form.website" rounded="xl" variant="outlined" label="Website" /></v-col>
              <v-col cols="12"><v-text-field v-model="form.contactEmail" rounded="xl" variant="outlined" label="Contact email" type="email" /></v-col>
              <v-col cols="12"><v-text-field v-model="form.phone" rounded="xl" variant="outlined" label="Phone" /></v-col>
            </v-row>
          </v-card-text>
          <v-card-actions>
            <v-spacer />
            <v-btn variant="text" @click="showCreateDialog = false">Cancel</v-btn>
            <v-btn color="primary" :loading="isMutating" @click="createCompany">Save company</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </template>
  </CrmListingShell>
</template>
