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
    <client-only>
      <teleport to="#app-bar-teleport-target">
        <v-btn variant="text" size="sm" icon="mdi-refresh" :loading="crmStore.isLoading" @click="loadCompanies(true)"></v-btn>
      </teleport>
    </client-only>
    <template #sidebar>
      <PlatformSidebarNav title="platform.crm.sidebar.title" subtitle="platform.common.sidebar.application" :subtitle-values="{ slug }" :items="crmNav" />
    </template>
    <template #aside>
      <div class="text-center">
        <h3>New Company</h3>
        <v-text-field v-model="form.name" rounded="xl" variant="outlined" label="Name" required />
        <v-text-field v-model="form.industry" rounded="xl" variant="outlined"  label="Industry" />
        <v-text-field v-model="form.website" rounded="xl" variant="outlined"  label="Website" />
        <v-text-field v-model="form.contactEmail" rounded="xl" variant="outlined"  label="Contact email" type="email" />
        <v-text-field v-model="form.phone" rounded="xl" variant="outlined" label="Phone" />
        <v-spacer></v-spacer>
        <v-btn color="primary" :loading="isMutating" @click="createCompany">Save company</v-btn>
      </div>
    </template>
    <section>
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
          <v-card rounded="xl" variant="outlined" hover class="h-100 cursor-pointer" @click="goToCompany(company?.id)">
            <v-card-text>
              <div class="d-flex justify-space-between align-start mb-2 ga-2">
                <NuxtLink :to="company?.website" class="text-decoration-none">
                  <p class="text-subtitle-1 font-weight-bold">{{ company?.name }}</p>
                </NuxtLink>
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
              <p class="text-body-2 text-medium-emphasis mb-2">{{ company?.industry || 'N/A' }}</p>
              <p class="text-body-2 mb-1">Email : {{ company?.contactEmail || 'Email not specified' }}</p>
              <p class="text-body-2">Phone : {{ company?.phone || 'Phone not specified' }}</p>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </section>
  </PlatformSplitLayout>
</template>
