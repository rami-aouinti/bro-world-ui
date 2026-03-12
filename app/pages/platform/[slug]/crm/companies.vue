<script setup lang="ts">
import PlatformSidebarNav from '~/components/platform/PlatformSidebarNav.vue'
import PlatformSplitLayout from '~/components/platform/PlatformSplitLayout.vue'
import { getCrmNav } from '~/data/platform-nav'
import { useCrmStore } from '~/stores/crm'

definePageMeta({ public: true, requiresAuth: false })

const route = useRoute()
const slug = computed(() => String(route.params.slug ?? ''))
const { isOwner } = usePlatformPermissions(slug)
const crmNav = computed(() => getCrmNav(slug.value, isOwner.value))
const loading = ref(true);
const crmStore = useCrmStore()
const errorMessage = ref('')

const companies = computed(() => crmStore.getCompanies(slug.value))

const loadCompanies = async (force = false) => {
  if (!slug.value) {
    return
  }

  errorMessage.value = ''

  try {
    await crmStore.fetchCompanies(slug.value, force)
  }
  catch {
    errorMessage.value = 'Impossible de charger les companies CRM pour cette application.'
  }
}

onMounted(async () => {
  await loadCompanies()
  await nextTick()
  loading.value = false
})
</script>

<template>
  <PlatformSplitLayout>
    <template #sidebar>
      <PlatformSidebarNav title="platform.crm.sidebar.title" subtitle="platform.common.sidebar.application" :subtitle-values="{ slug }" :items="crmNav" />
    </template>

    <section>
      <div class="d-flex align-center justify-space-between mb-4">
        <div>
          <h1 class="text-h5 font-weight-bold mb-1">Companies</h1>
          <p class="text-body-2 text-medium-emphasis">Liste synchronisée depuis l'API CRM.</p>
        </div>
        <v-btn variant="outlined" :loading="crmStore.isLoading" @click="loadCompanies(true)">Rafraîchir</v-btn>
      </div>

      <v-alert v-if="errorMessage" type="error" variant="tonal" class="mb-4">
        {{ errorMessage }}
      </v-alert>

      <v-row>
        <v-col v-for="company in companies" :key="company.id" cols="12" md="6" lg="4">
          <v-card rounded="xl" hover class="h-100">
            <v-card-text>
              <p class="text-subtitle-1 font-weight-bold">{{ company.name }}</p>
              <p class="text-body-2 text-medium-emphasis mb-2">{{ company.industry || 'N/A' }}</p>
              <p class="text-body-2 mb-1">{{ company.website || 'Website non renseigné' }}</p>
              <p class="text-body-2 mb-1">{{ company.contactEmail || 'Email non renseigné' }}</p>
              <p class="text-body-2">{{ company.phone || 'Téléphone non renseigné' }}</p>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </section>
  </PlatformSplitLayout>
</template>
