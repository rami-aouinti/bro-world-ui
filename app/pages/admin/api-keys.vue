<script setup lang="ts">
import UiDataTable from '~/components/ui/UiDataTable.vue'
import UiPageSection from '~/components/ui/UiPageSection.vue'
import UiSectionHeader from '~/components/ui/UiSectionHeader.vue'
import type { ApiKey } from '~/types/api/apiKey'

definePageMeta({
  middleware: ['role'],
  requiredPermissions: ['admin.access'],
})

const apiKeysApi = useApiKeysApi()
const loading = ref(false)
const errorMessage = ref('')
const apiKeys = ref<ApiKey[]>([])

const headers = [
  { title: 'ID', key: 'id', sortable: true },
  { title: 'Description', key: 'description', sortable: true },
  { title: 'Token', key: 'tokenMasked', sortable: false },
]

const maskToken = (token: string) => {
  if (!token) {
    return '—'
  }

  if (token.length <= 10) {
    return '••••••'
  }

  return `${token.slice(0, 6)}...${token.slice(-4)}`
}

const tableItems = computed(() => apiKeys.value.map(key => ({
  ...key,
  tokenMasked: maskToken(key.token),
})))

const fetchApiKeys = async () => {
  loading.value = true
  errorMessage.value = ''

  try {
    const response = await apiKeysApi.v1.list({ limit: 200 })
    apiKeys.value = response.results
  }
  catch {
    errorMessage.value = 'Impossible de charger les clés API depuis /api/v1/api-keys.'
  }
  finally {
    loading.value = false
  }
}

await fetchApiKeys()
</script>

<template>
  <UiPageSection max-width="1100">
    <template #header>
      <UiSectionHeader
        title="Gestion des clés API"
        subtitle="Données chargées depuis /api/v1/api-keys"
      >
        <template #actions>
          <v-btn
            color="primary"
            variant="outlined"
            prepend-icon="mdi-refresh"
            :loading="loading"
            @click="fetchApiKeys"
          >
            Actualiser
          </v-btn>
        </template>
      </UiSectionHeader>
    </template>

    <v-alert
      v-if="errorMessage"
      type="error"
      variant="tonal"
      class="mb-4"
    >
      {{ errorMessage }}
    </v-alert>

    <UiDataTable
      :headers="headers"
      :items="tableItems"
      :loading="loading"
      item-key="id"
      :items-per-page="10"
      empty-text="Aucune clé API trouvée."
    >
      <template #item.tokenMasked="{ item }">
        <code>{{ item.tokenMasked }}</code>
      </template>
    </UiDataTable>
  </UiPageSection>
</template>
