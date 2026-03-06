<script setup lang="ts">
import UiDataTable from '~/components/ui/UiDataTable.vue'
import UiPageSection from '~/components/ui/UiPageSection.vue'
import UiSectionHeader from '~/components/ui/UiSectionHeader.vue'
import { useApiKeysStore } from '~/stores/apiKeys'
import type { ApiKey } from '~/types/api/apiKey'

definePageMeta({
  layout: 'admin',
  middleware: ['role'],
  requiredPermissions: ['admin.access'],
})

const apiKeysStore = useApiKeysStore()
const loading = ref(false)
const submitting = ref(false)
const errorMessage = ref('')
const apiKeys = ref<ApiKey[]>([])
const search = ref('')
const selectedVersion = computed({
  get: () => apiKeysStore.version,
  set: (value) => {
    apiKeysStore.version = value
  },
})

const formDialog = ref(false)
const showDialog = ref(false)
const formMode = ref<'create' | 'edit' | 'patch'>('create')
const selectedItem = ref<ApiKey | null>(null)
const form = reactive({ token: '', description: '' })

const headers = [
  { title: 'ID', key: 'id', sortable: true },
  { title: 'Description', key: 'description', sortable: true },
  { title: 'Token', key: 'tokenMasked', sortable: false },
  { title: 'Actions', key: 'actions', sortable: false },
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

const formTitle = computed(() => (formMode.value === 'create' ? 'Créer une clé API' : formMode.value === 'edit' ? 'Éditer une clé API' : 'Patch clé API'))

const fetchApiKeys = async () => {
  loading.value = true
  errorMessage.value = ''

  try {
    apiKeys.value = await apiKeysStore.fetchAll()
  }
  catch {
    errorMessage.value = `Impossible de charger les clés API depuis /api/${selectedVersion.value}/api_key.`
  }
  finally {
    loading.value = false
  }
}

const showEntity = async (id: string) => {
  selectedItem.value = await apiKeysStore.getById(id)
  showDialog.value = true
}

const openCreateDialog = () => {
  formMode.value = 'create'
  Object.assign(form, { token: '', description: '' })
  formDialog.value = true
}

const openEditDialog = (item: ApiKey, patch = false) => {
  selectedItem.value = item
  formMode.value = patch ? 'patch' : 'edit'
  Object.assign(form, { token: item.token, description: item.description })
  formDialog.value = true
}

const submitForm = async () => {
  submitting.value = true
  try {
    if (formMode.value === 'create') {
      await apiKeysStore.create({ token: form.token, description: form.description })
    }
    else if (formMode.value === 'edit' && selectedItem.value) {
      await apiKeysStore.update(selectedItem.value.id, { token: form.token, description: form.description })
    }
    else if (formMode.value === 'patch' && selectedItem.value) {
      await apiKeysStore.patch(selectedItem.value.id, { description: form.description, token: form.token })
    }

    formDialog.value = false
    await fetchApiKeys()
  }
  finally {
    submitting.value = false
  }
}

const deleteEntity = async (id: string) => {
  if (!window.confirm(`Supprimer la clé API ${id} ?`)) {
    return
  }

  await apiKeysStore.remove(id)
  await fetchApiKeys()
}

await fetchApiKeys()
</script>

<template>
  <UiPageSection>
    <Teleport
      defer
      to="#app-bar-teleport-target"
    >
      <div class="api-keys-page-appbar-tools">
        <v-text-field
          v-model="search"
          label="Rechercher"
          prepend-inner-icon="mdi-magnify"
          density="comfortable"
          variant="underlined"
          hide-details
          class="api-keys-page-appbar-tools__search"
        />

        <v-btn
          icon="mdi-plus"
          color="primary"
          :aria-label="'Créer'"
          @click="openCreateDialog"
        />

        <v-btn
          icon="mdi-refresh"
          color="primary"
          variant="outlined"
          :loading="loading"
          :aria-label="'Actualiser'"
          @click="fetchApiKeys"
        />
      </div>
    </Teleport>

    <template #header>
      <UiSectionHeader
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
        </template>
      </UiSectionHeader>
    </template>

    <v-card rounded="xl" elevation="2" class="pa-4">
      <v-alert v-if="errorMessage" type="error" variant="tonal" class="mb-4">
        {{ errorMessage }}
      </v-alert>

      <UiDataTable
        :headers="headers"
        :items="tableItems"
        :loading="loading"
        :search="search"
        item-key="id"
        :items-per-page="10"
        empty-text="Aucune clé API trouvée."
      >
        <template #item.tokenMasked="{ item }">
          <code>{{ item.tokenMasked }}</code>
        </template>

        <template #item.actions="{ item }">
          <div class="d-flex flex-nowrap ga-1 py-1">
            <v-btn size="x-small" variant="tonal" icon="mdi-eye" :aria-label="`Show ${item.id}`" @click="showEntity(item.id)" />
            <v-btn size="x-small" variant="tonal" color="warning" icon="mdi-file-edit-outline" :aria-label="`Patch ${item.id}`" @click="openEditDialog(item, true)" />
            <v-btn size="x-small" variant="tonal" color="error" icon="mdi-delete" :aria-label="`Delete ${item.id}`" @click="deleteEntity(item.id)" />
          </div>
        </template>
      </UiDataTable>
    </v-card>

    <v-dialog v-model="formDialog" max-width="560" persistent>
      <v-card rounded="xl">
        <v-card-title>{{ formTitle }}</v-card-title>
        <v-card-text>
          <v-text-field v-model="form.description" label="Description" class="mb-2" />
          <v-text-field v-model="form.token" label="Token" :disabled="formMode === 'patch'" />
        </v-card-text>
        <v-card-actions class="justify-end">
          <v-btn variant="text" @click="formDialog = false">Annuler</v-btn>
          <v-btn color="primary" :loading="submitting" @click="submitForm">Enregistrer</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="showDialog" max-width="700">
      <v-card rounded="xl">
        <v-card-title>Détails clé API</v-card-title>
        <v-card-text>
          <pre class="text-body-2" style="white-space: pre-wrap;">{{ JSON.stringify(selectedItem, null, 2) }}</pre>
        </v-card-text>
      </v-card>
    </v-dialog>
  </UiPageSection>
</template>


<style scoped>
.api-keys-page-appbar-tools {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  margin-inline-start: 8px;
}

.api-keys-page-appbar-tools__search {
  min-width: 200px;
  max-width: 280px;
}
</style>
