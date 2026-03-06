<script setup lang="ts">
import UiDataTable from '~/components/ui/UiDataTable.vue'
import UiActionConfirmDialog from '~/components/ui/UiActionConfirmDialog.vue'
import UiActionDialog from '~/components/ui/UiActionDialog.vue'
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
const { t } = useI18n()
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
  loading.value = true
  errorMessage.value = ''

  try {
    apiKeys.value = await apiKeysStore.fetchAll()
  }
  catch {
    errorMessage.value = t('admin.apiKeys.errors.load', { version: selectedVersion.value })
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
          :label="t('admin.common.search')"
          prepend-inner-icon="mdi-magnify"
          density="comfortable"
          variant="underlined"
          hide-details
          class="api-keys-page-appbar-tools__search"
        />

        <v-btn
          icon="mdi-plus"
          color="primary"
          :aria-label="t('admin.common.create')"
          @click="openCreateDialog"
        />

        <v-btn
          icon="mdi-refresh"
          color="primary"
          variant="outlined"
          :loading="loading"
          :aria-label="t('admin.common.refresh')"
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
        <div class="d-flex flex-nowrap ga-1 py-1">
          <v-btn size="x-small" variant="tonal" icon="mdi-eye" :aria-label="t('admin.apiKeys.aria.show', { id: item.id })" @click="showEntity(item.id)" />
          <v-btn size="x-small" variant="tonal" color="warning" icon="mdi-file-edit-outline" :aria-label="t('admin.apiKeys.aria.patch', { id: item.id })" @click="openEditDialog(item, true)" />
          <v-btn size="x-small" variant="tonal" color="error" icon="mdi-delete" :aria-label="t('admin.apiKeys.aria.delete', { id: item.id })" @click="openDeleteDialog(item.id)" />
        </div>
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
