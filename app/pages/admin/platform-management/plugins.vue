<script setup lang="ts">
import UiDataTable from '~/components/ui/UiDataTable.vue'
import UiActionConfirmDialog from '~/components/ui/UiActionConfirmDialog.vue'
import UiActionDialog from '~/components/ui/UiActionDialog.vue'
import UiPageSection from '~/components/ui/UiPageSection.vue'
import UiSectionHeader from '~/components/ui/UiSectionHeader.vue'
import UiEntityActionButtons from '~/components/ui/UiEntityActionButtons.vue'
import UiTableToolbar from '~/components/ui/UiTableToolbar.vue'
import { usePluginsStore } from '~/stores/plugins'
import type { PluginRead } from '~/types/api/plugin'

definePageMeta({
  layout: 'admin',
  middleware: ['role'],
  requiredPermissions: ['admin.access'],
})

const pluginsStore = usePluginsStore()
const { t } = useI18n()
const loading = ref(false)
const submitting = ref(false)
const errorMessage = ref('')
const plugins = ref<PluginRead[]>([])
const search = ref('')

const formMode = ref<'create' | 'edit' | 'patch'>('create')
const formDialog = ref(false)
const deleteDialog = ref(false)
const showDialog = ref(false)
const selectedPlugin = ref<PluginRead | null>(null)
const pluginToDeleteId = ref('')

const form = reactive({
  name: '',
  enabled: true,
  private: false,
  platform: '',
  description: '',
})

const headers = computed(() => [
  { title: 'Name', key: 'name', sortable: true },
  { title: 'Enabled', key: 'enabled', sortable: true },
  { title: 'Private', key: 'private', sortable: true },
  { title: 'Platform', key: 'platform', sortable: true },
  { title: 'Actions', key: 'actions', sortable: false },
])

const formTitle = computed(() => {
  if (formMode.value === 'create') {
    return 'Créer un plugin'
  }

  if (formMode.value === 'edit') {
    return 'Éditer un plugin'
  }

  return 'Patch plugin'
})

const fetchPlugins = async () => {
  loading.value = true
  errorMessage.value = ''

  try {
    plugins.value = await pluginsStore.fetchAll()
  }
  catch {
    errorMessage.value = 'Impossible de charger les plugins.'
  }
  finally {
    loading.value = false
  }
}

const resetForm = () => {
  Object.assign(form, {
    name: '',
    enabled: true,
    private: false,
    platform: '',
    description: '',
  })
}

const openCreateDialog = () => {
  formMode.value = 'create'
  resetForm()
  formDialog.value = true
}

const openEditDialog = (plugin: PluginRead, patch = false) => {
  formMode.value = patch ? 'patch' : 'edit'
  selectedPlugin.value = plugin
  Object.assign(form, {
    name: plugin.name,
    enabled: plugin.enabled,
    private: plugin.private,
    platform: plugin.platform ?? '',
    description: plugin.description ?? '',
  })
  formDialog.value = true
}

const showEntity = async (id: string) => {
  selectedPlugin.value = await pluginsStore.getById(id)
  showDialog.value = true
}

const openDeleteDialog = (id: string) => {
  pluginToDeleteId.value = id
  deleteDialog.value = true
}

const submitForm = async () => {
  submitting.value = true

  try {
    if (formMode.value === 'create') {
      await pluginsStore.create({
        name: form.name,
        enabled: form.enabled,
        private: form.private,
        platform: form.platform || null,
        description: form.description || undefined,
      })
    }
    else if (formMode.value === 'edit' && selectedPlugin.value) {
      await pluginsStore.update(selectedPlugin.value.id, {
        name: form.name,
        enabled: form.enabled,
        private: form.private,
        platform: form.platform || null,
        description: form.description || undefined,
      })
    }
    else if (formMode.value === 'patch' && selectedPlugin.value) {
      await pluginsStore.patch(selectedPlugin.value.id, {
        enabled: form.enabled,
        private: form.private,
        platform: form.platform || null,
        description: form.description || undefined,
      })
    }

    formDialog.value = false
    await fetchPlugins()
  }
  finally {
    submitting.value = false
  }
}

const deleteEntity = async () => {
  if (!pluginToDeleteId.value) {
    return
  }

  submitting.value = true
  try {
    await pluginsStore.remove(pluginToDeleteId.value)
    deleteDialog.value = false
    pluginToDeleteId.value = ''
    await fetchPlugins()
  }
  finally {
    submitting.value = false
  }
}

onMounted(async () => {
  await fetchPlugins()
})
</script>

<template>
  <UiPageSection>
    <template #header>
      <UiSectionHeader>
        <template #actions>
          <UiTableToolbar
            :search="search"
            :search-label="t('admin.common.search')"
            :create-label="t('admin.common.create')"
            :refresh-label="t('admin.common.refresh')"
            :loading="loading"
            @update:search="search = $event"
            @create="openCreateDialog"
            @refresh="fetchPlugins"
          />
        </template>
      </UiSectionHeader>
    </template>

    <v-alert v-if="errorMessage" type="error" variant="tonal" class="mb-4">{{ errorMessage }}</v-alert>

    <UiDataTable :headers="headers" :items="plugins" :loading="loading" :search="search" item-key="id" :items-per-page="10" empty-text="Aucun plugin trouvé.">
      <template #item.enabled="{ item }">
        <v-chip :color="item.enabled ? 'success' : 'default'" size="small" variant="tonal">{{ item.enabled ? 'Actif' : 'Inactif' }}</v-chip>
      </template>

      <template #item.private="{ item }">
        <v-chip :color="item.private ? 'warning' : 'default'" size="small" variant="tonal">{{ item.private ? 'Oui' : 'Non' }}</v-chip>
      </template>

      <template #item.platform="{ item }">
        <code>{{ item.platform ?? '—' }}</code>
      </template>

      <template #item.actions="{ item }">
        <div class="d-flex justify-end ga-1">
          <v-btn size="x-small" variant="text" color="primary" icon="mdi-pencil" :aria-label="`Éditer ${item.name}`" @click="openEditDialog(item)" />
          <UiEntityActionButtons
            :show-label="`Voir ${item.name}`"
            :patch-label="`Patch ${item.name}`"
            :delete-label="`Supprimer ${item.name}`"
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
      :message="`Supprimer le plugin ${pluginToDeleteId} ?`"
      :confirm-label="t('admin.common.delete')"
      :cancel-label="t('admin.common.cancel')"
      :loading="submitting"
      @confirm="deleteEntity"
    />

    <UiActionDialog v-model="formDialog" :title="formTitle" max-width="620" persistent>
      <v-text-field v-model="form.name" label="Name" class="mb-2" :disabled="formMode === 'patch'" />
      <v-text-field v-model="form.platform" label="Platform (UUID)" class="mb-2" />
      <v-textarea v-model="form.description" label="Description" rows="2" class="mb-2" />
      <v-switch v-model="form.enabled" color="success" label="Enabled" inset hide-details class="mb-2" />
      <v-switch v-model="form.private" color="warning" label="Private" inset hide-details />

      <template #actions>
        <v-btn variant="text" @click="formDialog = false">{{ t('admin.common.cancel') }}</v-btn>
        <v-btn color="primary" :loading="submitting" @click="submitForm">{{ t('admin.common.save') }}</v-btn>
      </template>
    </UiActionDialog>

    <UiActionDialog v-model="showDialog" title="Détails plugin" max-width="760">
      <pre class="text-body-2" style="white-space: pre-wrap;">{{ JSON.stringify(selectedPlugin, null, 2) }}</pre>
    </UiActionDialog>
  </UiPageSection>
</template>
