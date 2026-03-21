<script setup lang="ts">
import PlatformSidebarNav from '~/components/platform/PlatformSidebarNav.vue'
import PlatformSplitLayout from '~/components/platform/PlatformSplitLayout.vue'
import { getCrmNav } from '~/data/platform-nav'
import { useCrmStore } from '~/stores/crm'
import type { CreateCrmCompanyPayload } from '~/types/api/crm'

definePageMeta({ public: true, requiresAuth: false })

const route = useRoute()
const slug = computed(() => String(route.params.slug ?? ''))
const { isOwner } = usePlatformPermissions(slug)
const crmNav = computed(() => getCrmNav(slug.value, isOwner.value))
const crmStore = useCrmStore()
const { normalizeError } = useApiError()
const { $errorLogger } = useNuxtApp()
const errorMessage = ref('')
const showCreateDialog = ref(false)
const isMutating = ref(false)
const isPageLoading = ref(true)
const form = reactive<CreateCrmCompanyPayload>({
  name: '',
  industry: '',
  website: '',
  contactEmail: '',
  phone: '',
})

const companies = computed(() => crmStore.getCompanies(slug.value))

const goToCompany = (id: string) => navigateTo(`/platform/${slug.value}/crm/company/${id}`)
const editCompany = (id: string) => navigateTo(`/platform/${slug.value}/crm/company/${id}`)

const loadCompanies = async (force = false) => {
  if (!slug.value) {
    return
  }

  errorMessage.value = ''

  try {
    await crmStore.fetchCompanies(slug.value, force)
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
    Object.assign(form, { name: '', industry: '', website: '', contactEmail: '', phone: '' })
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
  <PlatformSplitLayout>
    <template #sidebar>
      <PlatformSidebarNav title="platform.crm.sidebar.title" subtitle="platform.common.sidebar.application" :subtitle-values="{ slug }" :items="crmNav" />
    </template>

    <section>
      <div class="d-flex align-center justify-space-between mb-4 flex-wrap ga-2">
        <div>
          <h2 class="text-h5 font-weight-bold mb-1">Companies</h2>
        </div>
        <div class="d-flex ga-2">
          <v-btn color="primary" @click="showCreateDialog = true">Add company</v-btn>
          <v-btn variant="outlined" :loading="crmStore.isLoading" @click="loadCompanies(true)">Refresh</v-btn>
        </div>
      </div>

      <v-alert v-if="errorMessage" type="error" variant="tonal" class="mb-4">
        {{ errorMessage }}
      </v-alert>

      <v-row v-if="isPageLoading">
        <v-col v-for="i in 6" :key="`company-skeleton-${i}`" cols="12" md="6" lg="6">
          <v-skeleton-loader type="card, article" class="h-100" />
        </v-col>
      </v-row>

      <v-row v-else>
        <v-col v-for="company in companies" :key="company.id" cols="12" md="6" lg="6">
          <v-card rounded="xl" hover class="h-100 cursor-pointer" @click="goToCompany(company.id)">
            <v-card-text>
              <div class="d-flex justify-space-between align-start mb-2 ga-2">
                <p class="text-subtitle-1 font-weight-bold">{{ company.name }}</p>
                <v-menu location="bottom end">
                  <template #activator="{ props }">
                    <v-btn
                      v-bind="props"
                      size="x-small"
                      icon="mdi-cog"
                      variant="text"
                      @click.stop
                    />
                  </template>
                  <v-list density="compact">
                    <v-list-item prepend-icon="mdi-pencil" title="Edit" @click.stop="editCompany(company.id)" />
                    <v-list-item prepend-icon="mdi-delete" title="Delete" @click.stop="removeCompany(company.id)" />
                  </v-list>
                </v-menu>
              </div>
              <p class="text-body-2 text-medium-emphasis mb-2">{{ company.industry || 'N/A' }}</p>
              <p class="text-body-2 mb-1">{{ company.website || 'Website not specified' }}</p>
              <p class="text-body-2 mb-1">{{ company.contactEmail || 'Email not specified' }}</p>
              <p class="text-body-2">{{ company.phone || 'Phone not specified' }}</p>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <v-dialog v-model="showCreateDialog" max-width="520">
        <v-card>
          <v-card-title>Add company</v-card-title>
          <v-card-text>
            <v-text-field v-model="form.name" label="Name" required />
            <v-text-field v-model="form.industry" label="Industry" />
            <v-text-field v-model="form.website" label="Website" />
            <v-text-field v-model="form.contactEmail" label="Contact email" type="email" />
            <v-text-field v-model="form.phone" label="Phone" />
          </v-card-text>
          <v-card-actions>
            <v-spacer />
            <v-btn variant="text" @click="showCreateDialog = false">Cancel</v-btn>
            <v-btn color="primary" :loading="isMutating" @click="createCompany">Create</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </section>
  </PlatformSplitLayout>
</template>
