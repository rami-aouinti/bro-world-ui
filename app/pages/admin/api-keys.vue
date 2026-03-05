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
const actionLoading = ref(false)
const errorMessage = ref('')
const dialogError = ref('')
const apiKeys = ref<ApiKey[]>([])
const selectedVersion = ref<'v1' | 'v2'>('v1')

const createDialog = ref(false)
const showDialog = ref(false)
const editDialog = ref(false)
const patchDialog = ref(false)
const deleteDialog = ref(false)

const selectedItem = ref<ApiKey | null>(null)
const createForm = ref({ token: '', description: '' })
const editForm = ref({ token: '', description: '' })
const patchForm = ref({ token: '', description: '' })

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

const resetDialogError = () => {
  dialogError.value = ''
}

const openCreateDialog = () => {
  createForm.value = { token: '', description: '' }
  resetDialogError()
  createDialog.value = true
}

const openShowDialog = async (id: string) => {
  resetDialogError()
  actionLoading.value = true

  try {
    selectedItem.value = await currentClient.value.getById(id)
    showDialog.value = true
  }
  catch {
    dialogError.value = 'Impossible de charger le détail de la clé API.'
  }
  finally {
    actionLoading.value = false
  }
}

const openEditDialog = (item: ApiKey) => {
  selectedItem.value = item
  editForm.value = { token: item.token, description: item.description }
  resetDialogError()
  editDialog.value = true
}

const openPatchDialog = (item: ApiKey) => {
  selectedItem.value = item
  patchForm.value = { token: '', description: item.description }
  resetDialogError()
  patchDialog.value = true
}

const openDeleteDialog = (item: ApiKey) => {
  selectedItem.value = item
  resetDialogError()
  deleteDialog.value = true
}

const submitCreate = async () => {
  actionLoading.value = true
  resetDialogError()

  try {
    await currentClient.value.create(createForm.value)
    createDialog.value = false
    await fetchApiKeys()
  }
  catch {
    dialogError.value = 'Impossible de créer la clé API.'
  }
  finally {
    actionLoading.value = false
  }
}

const submitEdit = async () => {
  if (!selectedItem.value) {
    return
  }

  actionLoading.value = true
  resetDialogError()

  try {
    await currentClient.value.update(selectedItem.value.id, editForm.value)
    editDialog.value = false
    await fetchApiKeys()
  }
  catch {
    dialogError.value = 'Impossible de modifier la clé API.'
  }
  finally {
    actionLoading.value = false
  }
}

const submitPatch = async () => {
  if (!selectedItem.value) {
    return
  }

  actionLoading.value = true
  resetDialogError()

  try {
    const payload = {
      ...(patchForm.value.token.trim() ? { token: patchForm.value.token } : {}),
      ...(patchForm.value.description.trim() ? { description: patchForm.value.description } : {}),
    }

    await currentClient.value.patch(selectedItem.value.id, payload)
    patchDialog.value = false
    await fetchApiKeys()
  }
  catch {
    dialogError.value = 'Impossible de patcher la clé API.'
  }
  finally {
    actionLoading.value = false
  }
}

const submitDelete = async () => {
  if (!selectedItem.value) {
    return
  }

  actionLoading.value = true
  resetDialogError()

  try {
    await currentClient.value.delete(selectedItem.value.id)
    deleteDialog.value = false
    await fetchApiKeys()
  }
  catch {
    dialogError.value = 'Impossible de supprimer la clé API.'
  }
  finally {
    actionLoading.value = false
  }
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
          <v-btn color="primary" prepend-icon="mdi-plus" class="mr-2" @click="openCreateDialog">Créer</v-btn>
          <v-btn color="primary" variant="outlined" prepend-icon="mdi-refresh" :loading="loading" @click="fetchApiKeys">
            Actualiser
          </v-btn>
        </template>
      </UiSectionHeader>
    </template>

    <v-alert v-if="errorMessage" type="error" variant="tonal" class="mb-4">{{ errorMessage }}</v-alert>

    <UiDataTable :headers="headers" :items="tableItems" :loading="loading" item-key="id" :items-per-page="10" empty-text="Aucune clé API trouvée.">
      <template #item.tokenMasked="{ item }"><code>{{ item.tokenMasked }}</code></template>
      <template #item.actions="{ item }">
        <div class="d-flex flex-wrap ga-1 py-1">
          <v-btn size="x-small" variant="tonal" :loading="actionLoading" @click="openShowDialog(item.id)">Show</v-btn>
          <v-btn size="x-small" variant="tonal" color="info" @click="openEditDialog(item)">Edit</v-btn>
          <v-btn size="x-small" variant="tonal" color="warning" @click="openPatchDialog(item)">Patch</v-btn>
          <v-btn size="x-small" variant="tonal" color="error" @click="openDeleteDialog(item)">Delete</v-btn>
        </div>
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

    <v-dialog v-model="createDialog" max-width="600">
      <v-card title="Créer une clé API">
        <v-card-text>
          <v-alert v-if="dialogError" type="error" variant="tonal" class="mb-4">{{ dialogError }}</v-alert>
          <v-text-field v-model="createForm.token" label="Token" />
          <v-text-field v-model="createForm.description" label="Description" />
        </v-card-text>
        <v-card-actions><v-spacer /><v-btn variant="text" @click="createDialog = false">Annuler</v-btn><v-btn color="primary" :loading="actionLoading" @click="submitCreate">Créer</v-btn></v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="showDialog" max-width="600">
      <v-card title="Détail clé API">
        <v-card-text>
          <v-text-field :model-value="selectedItem?.id || ''" label="ID" readonly />
          <v-text-field :model-value="selectedItem?.description || ''" label="Description" readonly />
          <v-text-field :model-value="selectedItem?.token || ''" label="Token" readonly />
        </v-card-text>
        <v-card-actions><v-spacer /><v-btn color="primary" @click="showDialog = false">Fermer</v-btn></v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="editDialog" max-width="600">
      <v-card title="Modifier une clé API">
        <v-card-text>
          <v-alert v-if="dialogError" type="error" variant="tonal" class="mb-4">{{ dialogError }}</v-alert>
          <v-text-field v-model="editForm.token" label="Token" />
          <v-text-field v-model="editForm.description" label="Description" />
        </v-card-text>
        <v-card-actions><v-spacer /><v-btn variant="text" @click="editDialog = false">Annuler</v-btn><v-btn color="info" :loading="actionLoading" @click="submitEdit">Enregistrer</v-btn></v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="patchDialog" max-width="600">
      <v-card title="Patch clé API">
        <v-card-text>
          <v-alert v-if="dialogError" type="error" variant="tonal" class="mb-4">{{ dialogError }}</v-alert>
          <v-text-field v-model="patchForm.token" label="Token (optionnel)" />
          <v-text-field v-model="patchForm.description" label="Description (optionnelle)" />
        </v-card-text>
        <v-card-actions><v-spacer /><v-btn variant="text" @click="patchDialog = false">Annuler</v-btn><v-btn color="warning" :loading="actionLoading" @click="submitPatch">Appliquer</v-btn></v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="deleteDialog" max-width="500">
      <v-card title="Supprimer la clé API">
        <v-card-text>
          Voulez-vous vraiment supprimer la clé <strong>{{ selectedItem?.id }}</strong> ?
          <v-alert v-if="dialogError" type="error" variant="tonal" class="mt-4">{{ dialogError }}</v-alert>
        </v-card-text>
        <v-card-actions><v-spacer /><v-btn variant="text" @click="deleteDialog = false">Annuler</v-btn><v-btn color="error" :loading="actionLoading" @click="submitDelete">Supprimer</v-btn></v-card-actions>
      </v-card>
    </v-dialog>
  </UiPageSection>
</template>
