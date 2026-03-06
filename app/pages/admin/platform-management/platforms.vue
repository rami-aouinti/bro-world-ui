<script setup lang="ts">
import UiDataTable from '~/components/ui/UiDataTable.vue'
import UiActionConfirmDialog from '~/components/ui/UiActionConfirmDialog.vue'
import UiActionDialog from '~/components/ui/UiActionDialog.vue'
import UiPageSection from '~/components/ui/UiPageSection.vue'
import UiSectionHeader from '~/components/ui/UiSectionHeader.vue'
import UiEntityActionButtons from '~/components/ui/UiEntityActionButtons.vue'
import UiTableToolbar from '~/components/ui/UiTableToolbar.vue'
import { usePlatformsStore } from '~/stores/platforms'
import type { PlatformRead } from '~/types/api/platform'

definePageMeta({
  layout: 'admin',
  middleware: ['role'],
  requiredPermissions: ['admin.access'],
})

const platformsStore = usePlatformsStore()
const { t } = useI18n()
const loading = ref(false)
const submitting = ref(false)
const errorMessage = ref('')
const platforms = ref<PlatformRead[]>([])
const search = ref('')

const formMode = ref<'create' | 'edit' | 'patch'>('create')
const formDialog = ref(false)
const deleteDialog = ref(false)
const showDialog = ref(false)
const selectedPlatform = ref<PlatformRead | null>(null)
const platformToDeleteId = ref('')

const form = reactive({
  name: '',
  status: '',
  enabled: true,
  private: false,
  user: '',
  description: '',
})

const headers = computed(() => [
  { title: 'Name', key: 'name', sortable: true },
  { title: 'Status', key: 'status', sortable: true },
  { title: 'Enabled', key: 'enabled', sortable: true },
  { title: 'Private', key: 'private', sortable: true },
  { title: 'User', key: 'user', sortable: true },
  { title: 'Actions', key: 'actions', sortable: false },
])

const formTitle = computed(() => {
  if (formMode.value === 'create') {
    return 'Créer une plateforme'
  }

  if (formMode.value === 'edit') {
    return 'Éditer une plateforme'
  }

  return 'Patch plateforme'
})

const fetchPlatforms = async () => {
  loading.value = true
  errorMessage.value = ''

  try {
    platforms.value = await platformsStore.fetchAll()
  }
  catch {
    errorMessage.value = 'Impossible de charger les plateformes.'
  }
  finally {
    loading.value = false
  }
}

const resetForm = () => {
  Object.assign(form, {
    name: '',
    status: '',
    enabled: true,
    private: false,
    user: '',
    description: '',
  })
}

const openCreateDialog = () => {
  formMode.value = 'create'
  resetForm()
  formDialog.value = true
}

const openEditDialog = (platform: PlatformRead, patch = false) => {
  formMode.value = patch ? 'patch' : 'edit'
  selectedPlatform.value = platform
  Object.assign(form, {
    name: platform.name,
    status: platform.status ?? '',
    enabled: platform.enabled,
    private: platform.private,
    user: platform.user ?? '',
    description: platform.description ?? '',
  })
  formDialog.value = true
}

const showEntity = async (id: string) => {
  selectedPlatform.value = await platformsStore.getById(id)
  showDialog.value = true
}

const openDeleteDialog = (id: string) => {
  platformToDeleteId.value = id
  deleteDialog.value = true
}

const submitForm = async () => {
  submitting.value = true

  try {
    if (formMode.value === 'create') {
      await platformsStore.create({
        name: form.name,
        status: form.status || undefined,
        enabled: form.enabled,
        private: form.private,
        user: form.user || null,
        description: form.description || undefined,
      })
    }
    else if (formMode.value === 'edit' && selectedPlatform.value) {
      await platformsStore.update(selectedPlatform.value.id, {
        name: form.name,
        status: form.status || undefined,
        enabled: form.enabled,
        private: form.private,
        user: form.user || null,
        description: form.description || undefined,
      })
    }
    else if (formMode.value === 'patch' && selectedPlatform.value) {
      await platformsStore.patch(selectedPlatform.value.id, {
        status: form.status || undefined,
        enabled: form.enabled,
        private: form.private,
        user: form.user || null,
        description: form.description || undefined,
      })
    }

    formDialog.value = false
    await fetchPlatforms()
  }
  finally {
    submitting.value = false
  }
}

const deleteEntity = async () => {
  if (!platformToDeleteId.value) {
    return
  }

  submitting.value = true
  try {
    await platformsStore.remove(platformToDeleteId.value)
    deleteDialog.value = false
    platformToDeleteId.value = ''
    await fetchPlatforms()
  }
  finally {
    submitting.value = false
  }
}

onMounted(async () => {
  await fetchPlatforms()
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
            @refresh="fetchPlatforms"
          />
        </template>
      </UiSectionHeader>
    </template>

    <v-alert v-if="errorMessage" type="error" variant="tonal" class="mb-4">{{ errorMessage }}</v-alert>

    <UiDataTable :headers="headers" :items="platforms" :loading="loading" :search="search" item-key="id" :items-per-page="10" empty-text="Aucune plateforme trouvée.">
      <template #item.enabled="{ item }">
        <v-chip :color="item.enabled ? 'success' : 'default'" size="small" variant="tonal">{{ item.enabled ? 'Actif' : 'Inactif' }}</v-chip>
      </template>

      <template #item.private="{ item }">
        <v-chip :color="item.private ? 'warning' : 'default'" size="small" variant="tonal">{{ item.private ? 'Oui' : 'Non' }}</v-chip>
      </template>

      <template #item.user="{ item }">
        <code>{{ item.user ?? '—' }}</code>
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
      :message="`Supprimer la plateforme ${platformToDeleteId} ?`"
      :confirm-label="t('admin.common.delete')"
      :cancel-label="t('admin.common.cancel')"
      :loading="submitting"
      @confirm="deleteEntity"
    />

    <UiActionDialog v-model="formDialog" :title="formTitle" max-width="620" persistent>
      <v-text-field v-model="form.name" label="Name" class="mb-2" :disabled="formMode === 'patch'" />
      <v-text-field v-model="form.status" label="Status" class="mb-2" />
      <v-text-field v-model="form.user" label="User (UUID)" class="mb-2" />
      <v-textarea v-model="form.description" label="Description" rows="2" class="mb-2" />
      <v-switch v-model="form.enabled" color="success" label="Enabled" inset hide-details class="mb-2" />
      <v-switch v-model="form.private" color="warning" label="Private" inset hide-details />

      <template #actions>
        <v-btn variant="text" @click="formDialog = false">{{ t('admin.common.cancel') }}</v-btn>
        <v-btn color="primary" :loading="submitting" @click="submitForm">{{ t('admin.common.save') }}</v-btn>
      </template>
    </UiActionDialog>

    <UiActionDialog v-model="showDialog" title="Détails plateforme" max-width="760">
      <pre class="text-body-2" style="white-space: pre-wrap;">{{ JSON.stringify(selectedPlatform, null, 2) }}</pre>
    </UiActionDialog>
  </UiPageSection>
</template>
