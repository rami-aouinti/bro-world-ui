<script setup lang="ts">
import UiDataTable from '~/components/ui/UiDataTable.vue'
import UiActionConfirmDialog from '~/components/ui/UiActionConfirmDialog.vue'
import UiActionDialog from '~/components/ui/UiActionDialog.vue'
import UiPageSection from '~/components/ui/UiPageSection.vue'
import UiSectionHeader from '~/components/ui/UiSectionHeader.vue'
import UiEntityActionButtons from '~/components/ui/UiEntityActionButtons.vue'
import UiTableToolbar from '~/components/ui/UiTableToolbar.vue'
import { useApiKeysStore } from '~/stores/apiKeys'
import type { ApiKey } from '~/types/api/apiKey'

definePageMeta({
  layout: 'admin',
  middleware: ['role'],
  requiredPermissions: ['admin.access'],
  skeleton: 'data-table',
})

const apiKeysStore = useApiKeysStore()
const { t } = useI18n()
const loading = computed(() => apiKeysStore.isLoading)
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
const deleteDialog = ref(false)
const showDialog = ref(false)
const formMode = ref<'create' | 'edit' | 'patch'>('create')
const selectedItem = ref<ApiKey | null>(null)
const apiKeyToDeleteId = ref('')
const form = reactive({ token: '', description: '' })

const headers = computed(() => [
  { title: t('admin.apiKeys.headers.description'), key: 'description', sortable: true },
  { title: t('admin.apiKeys.headers.token'), key: 'tokenMasked', sortable: false },
  { title: t('admin.apiKeys.headers.actions'), key: 'actions', sortable: false },
])

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

const formTitle = computed(() => (formMode.value === 'create' ? t('admin.apiKeys.form.createTitle') : formMode.value === 'edit' ? t('admin.apiKeys.form.editTitle') : t('admin.apiKeys.form.patchTitle')))

const fetchApiKeys = async () => {
  errorMessage.value = ''

  try {
    apiKeys.value = await apiKeysStore.fetchAll()
  }
  catch {
    errorMessage.value = t('admin.apiKeys.errors.load', { version: selectedVersion.value })
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

const openDeleteDialog = (id: string) => {
  apiKeyToDeleteId.value = id
  deleteDialog.value = true
}

const deleteEntity = async () => {
  if (!apiKeyToDeleteId.value) {
    return
  }

  submitting.value = true
  try {
    await apiKeysStore.remove(apiKeyToDeleteId.value)
    deleteDialog.value = false
    apiKeyToDeleteId.value = ''
    await fetchApiKeys()
  }
  finally {
    submitting.value = false
  }
}

onMounted(async () => {
  await fetchApiKeys()
})
</script>

<template>
  <UiPageSection>
    <template #header>
      <UiSectionHeader
      >
        <template #actions>
          <UiTableToolbar
            :search="search"
            :search-label="t('admin.common.search')"
            :create-label="t('admin.common.create')"
            :refresh-label="t('admin.common.refresh')"
            :loading="loading"
            @update:search="search = $event"
            @create="openCreateDialog"
            @refresh="fetchApiKeys"
          >
            <template #prepend>
              <v-btn-toggle
                v-model="selectedVersion"
                mandatory
                color="primary"
                variant="outlined"
                density="comfortable"
                @update:model-value="fetchApiKeys"
              >
                <v-btn value="v1">v1</v-btn>
                <v-btn value="v2">v2</v-btn>
              </v-btn-toggle>
            </template>
          </UiTableToolbar>
        </template>
      </UiSectionHeader>
    </template>

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
        :empty-text="t('admin.apiKeys.empty')"
    >
      <template #item.tokenMasked="{ item }">
        <code>{{ item.tokenMasked }}</code>
      </template>

      <template #item.actions="{ item }">
        <UiEntityActionButtons
          :show-label="t('admin.apiKeys.aria.show', { id: item.id })"
          :patch-label="t('admin.apiKeys.aria.patch', { id: item.id })"
          :delete-label="t('admin.apiKeys.aria.delete', { id: item.id })"
          @show="showEntity(item.id)"
          @patch="openEditDialog(item, true)"
          @delete="openDeleteDialog(item.id)"
        />
      </template>
    </UiDataTable>

    <UiActionConfirmDialog
      v-model="deleteDialog"
      :title="t('admin.common.delete')"
      :message="t('admin.apiKeys.confirmDelete', { id: apiKeyToDeleteId })"
      :confirm-label="t('admin.common.delete')"
      :cancel-label="t('admin.common.cancel')"
      :loading="submitting"
      @confirm="deleteEntity"
    />

    <UiActionDialog
      v-model="formDialog"
      :title="formTitle"
      max-width="560"
      persistent
    >
      <v-text-field v-model="form.description" :label="t('admin.apiKeys.form.description')" class="mb-2" />
      <v-text-field v-model="form.token" :label="t('admin.apiKeys.form.token')" :disabled="formMode === 'patch'" />

      <template #actions>
        <v-btn variant="text" @click="formDialog = false">{{ t('admin.common.cancel') }}</v-btn>
        <v-btn color="primary" :loading="submitting" @click="submitForm">{{ t('admin.common.save') }}</v-btn>
      </template>
    </UiActionDialog>

    <UiActionDialog
      v-model="showDialog"
      :title="t('admin.apiKeys.dialogs.details')"
      max-width="700"
    >
      <pre class="text-body-2" style="white-space: pre-wrap;">{{ JSON.stringify(selectedItem, null, 2) }}</pre>
    </UiActionDialog>
  </UiPageSection>
</template>


