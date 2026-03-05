<script setup lang="ts">
import UiDataTable from '~/components/ui/UiDataTable.vue'
import UiPageSection from '~/components/ui/UiPageSection.vue'
import UiSectionHeader from '~/components/ui/UiSectionHeader.vue'
import { useApiKeysApi } from '~/composables/api/useApiKeysApi'
import type { ApiKey } from '~/types/api/apiKey'

definePageMeta({
  layout: 'admin',
  middleware: ['role'],
  requiredPermissions: ['admin.access'],
})

const apiKeysApi = useApiKeysApi()
const loading = ref(false)
const errorMessage = ref('')
const apiKeys = ref<ApiKey[]>([])
const selectedVersion = ref<'v1' | 'v2'>('v1')

const headers = [
  { title: 'ID', key: 'id', sortable: true },
  { title: 'Description', key: 'description', sortable: true },
  { title: 'Token', key: 'tokenMasked', sortable: false },
  { title: 'Actions', key: 'actions', sortable: false },
]

const currentClient = computed(() => apiKeysApi[selectedVersion.value])

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
    const response = await currentClient.value.list({ limit: 200 })
    apiKeys.value = Array.isArray(response) ? response : (response.results ?? [])
  }
  catch {
    errorMessage.value = `Impossible de charger les clés API depuis /api/${selectedVersion.value}/api_key.`
  }
  finally {
    loading.value = false
  }
}

const showEntity = async (id: string) => {
  const entity = await currentClient.value.getById(id)
  window.alert(JSON.stringify(entity, null, 2))
}

const updateEntity = async (id: string) => {
  const payloadRaw = window.prompt('Payload JSON pour PUT (edit):', '{\n  "token": "",\n  "description": ""\n}')

  if (!payloadRaw) {
    return
  }

  await currentClient.value.update(id, JSON.parse(payloadRaw))
  await fetchApiKeys()
}

const patchEntity = async (id: string) => {
  const payloadRaw = window.prompt('Payload JSON pour PATCH:', '{\n  "description": ""\n}')

  if (!payloadRaw) {
    return
  }

  await currentClient.value.patch(id, JSON.parse(payloadRaw))
  await fetchApiKeys()
}

const deleteEntity = async (id: string) => {
  if (!window.confirm(`Supprimer la clé API ${id} ?`)) {
    return
  }

  await currentClient.value.delete(id)
  await fetchApiKeys()
}

await fetchApiKeys()
</script>

<template>
  <UiPageSection max-width="1100">
    <template #header>
      <UiSectionHeader
        title="Gestion des clés API"
        :subtitle="`Données chargées depuis /api/${selectedVersion}/api_key`"
      >
        <template #actions>
          <v-btn-toggle
            v-model="selectedVersion"
            mandatory
            color="primary"
            variant="outlined"
            density="comfortable"
            class="mr-2"
            @update:model-value="fetchApiKeys"
          >
            <v-btn value="v1">v1</v-btn>
            <v-btn value="v2">v2</v-btn>
          </v-btn-toggle>
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

      <template #item.actions="{ item }">
        <div class="d-flex flex-wrap ga-1 py-1">
          <v-btn size="x-small" variant="tonal" @click="showEntity(item.id)">Show</v-btn>
          <v-btn size="x-small" variant="tonal" color="info" @click="updateEntity(item.id)">Edit</v-btn>
          <v-btn size="x-small" variant="tonal" color="warning" @click="patchEntity(item.id)">Patch</v-btn>
          <v-btn size="x-small" variant="tonal" color="error" @click="deleteEntity(item.id)">Delete</v-btn>
        </div>
      </template>
    </UiDataTable>
  </UiPageSection>
</template>
