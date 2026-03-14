<script setup lang="ts">
import PlatformSidebarNav from '~/components/platform/PlatformSidebarNav.vue'
import PlatformSplitLayout from '~/components/platform/PlatformSplitLayout.vue'
import { getCrmNav } from '~/data/platform-nav'
import { useCrmStore } from '~/stores/crm'
import type { CrmCompany } from '~/types/api/crm'

definePageMeta({ public: true, requiresAuth: false })

const route = useRoute()
const slug = computed(() => String(route.params.slug ?? ''))
const companyId = computed(() => String(route.params.id ?? ''))
const { isOwner } = usePlatformPermissions(slug)
const crmNav = computed(() => getCrmNav(slug.value, isOwner.value))
const crmStore = useCrmStore()

const company = ref<CrmCompany | null>(null)
const isLoading = ref(false)
const errorMessage = ref('')

const loadCompany = async () => {
  if (!slug.value || !companyId.value) {
    return
  }

  isLoading.value = true
  errorMessage.value = ''

  try {
    company.value = await crmStore.fetchCompanyById(slug.value, companyId.value)
  }
  catch {
    errorMessage.value = 'Unable to load company details.'
  }
  finally {
    isLoading.value = false
  }
}

onMounted(loadCompany)
</script>

<template>
  <PlatformSplitLayout>
    <template #sidebar>
      <PlatformSidebarNav title="platform.crm.sidebar.title" subtitle="platform.common.sidebar.application" :subtitle-values="{ slug }" :items="crmNav" />
    </template>

    <section>
      <div class="d-flex align-center justify-space-between mb-4 ga-2 flex-wrap">
        <div>
          <h1 class="text-h5 font-weight-bold mb-1">Company detail</h1>
          <p class="text-body-2 text-medium-emphasis mb-0">{{ companyId }}</p>
        </div>
        <v-btn variant="outlined" :loading="isLoading" @click="loadCompany">Refresh</v-btn>
      </div>

      <v-alert v-if="errorMessage" type="error" variant="tonal" class="mb-4">{{ errorMessage }}</v-alert>

      <v-card v-if="company" rounded="xl">
        <v-card-text class="d-grid ga-2">
          <p><strong>Name:</strong> {{ company.name }}</p>
          <p><strong>Industry:</strong> {{ company.industry || 'N/A' }}</p>
          <p><strong>Website:</strong> {{ company.website || 'N/A' }}</p>
          <p><strong>Contact email:</strong> {{ company.contactEmail || 'N/A' }}</p>
          <p><strong>Phone:</strong> {{ company.phone || 'N/A' }}</p>
        </v-card-text>
      </v-card>
    </section>
  </PlatformSplitLayout>
</template>
