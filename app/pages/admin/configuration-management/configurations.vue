<script setup lang="ts">
import UiDataTable from '~/components/ui/UiDataTable.vue'
import UiActionConfirmDialog from '~/components/ui/UiActionConfirmDialog.vue'
import UiActionDialog from '~/components/ui/UiActionDialog.vue'
import UiSectionHeader from '~/components/ui/UiSectionHeader.vue'
import UiEntityActionButtons from '~/components/ui/UiEntityActionButtons.vue'
import UiTableToolbar from '~/components/ui/UiTableToolbar.vue'
import { useConfigurationsStore } from '~/stores/configurations'
import type {
  ConfigurationRead,
  ConfigurationScope,
  CreateConfigurationPayload,
} from '~/types/api/configuration'

definePageMeta({
  layout: 'admin',
  middleware: ['role'],
  requiredPermissions: ['configuration.readList'],
  skeleton: 'data-table',
})

const configurationsStore = useConfigurationsStore()
const { t } = useI18n()
const { canPermission } = useAccessControl()
const loading = computed(() => configurationsStore.isLoading)
const submitting = ref(false)
const errorMessage = ref('')
const configurations = ref<ConfigurationRead[]>([])
const search = ref('')

const formMode = ref<'create' | 'edit' | 'patch'>('create')
const formDialog = ref(false)
const deleteDialog = ref(false)
const showDialog = ref(false)
const selectedConfiguration = ref<ConfigurationRead | null>(null)
const configurationToDeleteId = ref('')

const scopeOptions: ConfigurationScope[] = ['system', 'user', 'platform', 'plugin', 'public']

const form = reactive({
  configurationKey: '',
  configurationValue: '',
  scope: 'system' as ConfigurationScope,
  private: false,
  enabled: true,
})

const headers = computed(() => [
  { title: 'Configuration Key', key: 'configurationKey', sortable: true },
  { title: 'Scope', key: 'scope', sortable: true },
  { title: 'Private', key: 'private', sortable: true },
  { title: 'Configuration Value', key: 'configurationValue', sortable: false },
  { title: 'Actions', key: 'actions', sortable: false },
])

const tableItems = computed(() => configurations.value.map(configuration => ({
  ...configuration,
  configurationKey: configuration.configurationKey,
  configurationValue: configuration.configurationValue,
})))

const formTitle = computed(() => {
  if (formMode.value === 'create') {
    return 'Créer une configuration'
  }

  if (formMode.value === 'edit') {
    return 'Éditer une configuration'
  }

  return 'Patch configuration'
})

const fetchConfigurations = async () => {
  errorMessage.value = ''

  try {
    configurations.value = await configurationsStore.fetchAll()
  }
  catch {
    errorMessage.value = 'Impossible de charger les configurations.'
  }
}

const resetForm = () => {
  Object.assign(form, {
    configurationKey: '',
    configurationValue: '',
    scope: 'system',
    private: false,
    enabled: true,
  })
}

const openCreateDialog = () => {
  formMode.value = 'create'
  resetForm()
  formDialog.value = true
}

const openEditDialog = (configuration: ConfigurationRead, patch = false) => {
  formMode.value = patch ? 'patch' : 'edit'
  Object.assign(form, {
    configurationKey: configuration.configurationKey,
    configurationValue: String(configuration.configurationValue ?? ''),
    scope: configuration.scope,
    private: configuration.private ?? false,
    enabled: configuration.enabled ?? true,
  })
  selectedConfiguration.value = configuration
  formDialog.value = true
}

const showEntity = async (id: string) => {
  selectedConfiguration.value = await configurationsStore.getById(id)
  showDialog.value = true
}

const openDeleteDialog = (id: string) => {
  configurationToDeleteId.value = id
  deleteDialog.value = true
}

const submitForm = async () => {
  submitting.value = true

  try {
    if (formMode.value === 'create') {
      const payload: CreateConfigurationPayload = {
        configurationKey: form.configurationKey,
        configurationValue: form.configurationValue,
        scope: form.scope,
      }

      await configurationsStore.create(payload)
    }
    else if (formMode.value === 'edit' && selectedConfiguration.value) {
      await configurationsStore.update(selectedConfiguration.value.id, {
        configurationKey: form.configurationKey,
        configurationValue: form.configurationValue,
        scope: form.scope,
        private: form.private,
        enabled: form.enabled,
      })
    }
    else if (formMode.value === 'patch' && selectedConfiguration.value) {
      await configurationsStore.patch(selectedConfiguration.value.id, {
        configurationValue: form.configurationValue,
        scope: form.scope,
        private: form.private,
        enabled: form.enabled,
      })
    }

    formDialog.value = false
    await fetchConfigurations()
  }
  finally {
    submitting.value = false
  }
}

const deleteEntity = async () => {
  if (!configurationToDeleteId.value) {
    return
  }

  submitting.value = true

  try {
    await configurationsStore.remove(configurationToDeleteId.value)
    deleteDialog.value = false
    configurationToDeleteId.value = ''
    await fetchConfigurations()
  }
  finally {
    submitting.value = false
  }
}

onMounted(async () => {
  await fetchConfigurations()
})
</script>

<template>
  <div class="admin-page-content">
      <UiSectionHeader>
        <template #actions>
          <UiTableToolbar
            :search="search"
            :search-label="t('admin.common.search')"
            :create-label="t('admin.common.create')"
            :refresh-label="t('admin.common.refresh')"
            :loading="loading"
            :show-create="canPermission('configuration.create')"
            @update:search="search = $event"
            @create="openCreateDialog"
            @refresh="fetchConfigurations"
          />
        </template>
      </UiSectionHeader>

    <v-alert v-if="errorMessage" type="error" variant="tonal" class="mb-4">
      {{ errorMessage }}
    </v-alert>

    <UiDataTable :headers="headers" :items="tableItems" :loading="loading" :search="search" item-key="id" :items-per-page="10" empty-text="Aucune configuration trouvée.">
      <template #item.private="{ item }">
        <v-chip :color="item.private ? 'warning' : 'default'" size="small" variant="tonal">{{ item.private ? 'Oui' : 'Non' }}</v-chip>
      </template>

      <template #item.configurationValue="{ item }">
        <code>{{ String(item.configurationValue ?? '—') }}</code>
      </template>

      <template #item.actions="{ item }">
        <div class="d-flex justify-end ga-1">
          <v-btn
            v-if="canPermission('configuration.update')"
            size="x-small"
            variant="text"
            color="primary"
            icon="mdi-pencil"
            :aria-label="`Éditer ${item.configurationKey}`"
            @click="openEditDialog(item)"
          />
          <UiEntityActionButtons
            :show-label="`Voir ${item.configurationKey}`"
            :patch-label="`Patch ${item.configurationKey}`"
            :delete-label="`Supprimer ${item.configurationKey}`"
            :show-patch="canPermission('configuration.patch')"
            :show-delete="canPermission('configuration.delete')"
            @show="showEntity(item.id)"
            @patch="openEditDialog(item, true)"
            @delete="openDeleteDialog(item.id)"
          />
        </div>
      </template>
    </UiDataTable>

    <UiActionConfirmDialog
      v-model="deleteDialog"
      :title="t('admin.common.delete')"
      :message="`Supprimer la configuration ${configurationToDeleteId} ?`"
      :confirm-label="t('admin.common.delete')"
      :cancel-label="t('admin.common.cancel')"
      :loading="submitting"
      @confirm="deleteEntity"
    />

    <UiActionDialog v-model="formDialog" :title="formTitle" max-width="620" persistent>
      <v-text-field v-model="form.configurationKey" label="Configuration key" class="mb-2" :disabled="formMode === 'patch'" />
      <v-text-field v-model="form.configurationValue" label="Configuration value" class="mb-2" />
      <v-select v-model="form.scope" :items="scopeOptions" label="Scope" class="mb-2" />
      <v-switch v-model="form.private" color="warning" label="Private" inset hide-details class="mb-2" />
      <v-switch v-model="form.enabled" color="success" label="Enabled" inset hide-details />

      <template #actions>
        <v-btn variant="text" @click="formDialog = false">{{ t('admin.common.cancel') }}</v-btn>
        <v-btn color="primary" :loading="submitting" @click="submitForm">{{ t('admin.common.save') }}</v-btn>
      </template>
    </UiActionDialog>

    <UiActionDialog v-model="showDialog" title="Détails configuration" max-width="760">
      <pre class="text-body-2" style="white-space: pre-wrap;">{{ JSON.stringify(selectedConfiguration, null, 2) }}</pre>
    </UiActionDialog>
  </div>
</template>
