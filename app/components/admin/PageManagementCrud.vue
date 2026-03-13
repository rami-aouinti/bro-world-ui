<script setup lang="ts">
import UiActionConfirmDialog from '~/components/ui/UiActionConfirmDialog.vue'
import UiActionDialog from '~/components/ui/UiActionDialog.vue'
import UiDataTable from '~/components/ui/UiDataTable.vue'
import UiEntityActionButtons from '~/components/ui/UiEntityActionButtons.vue'
import UiSectionHeader from '~/components/ui/UiSectionHeader.vue'
import UiTableToolbar from '~/components/ui/UiTableToolbar.vue'
import type { PageEntityRead } from '~/types/api/page'

const props = defineProps<{
  title: string
  subtitle: string
  itemName: string
  store: {
    items: Ref<PageEntityRead[]>
    isLoading: Ref<boolean>
    fetchAll: () => Promise<PageEntityRead[]>
    create: (payload: Record<string, unknown>) => Promise<PageEntityRead>
    update: (id: string, payload: Record<string, unknown>) => Promise<PageEntityRead>
    patch: (id: string, payload: Record<string, unknown>) => Promise<PageEntityRead>
    remove: (id: string) => Promise<void>
    getById: (id: string) => Promise<PageEntityRead>
  }
}>()

const loading = computed(() => props.store.isLoading)
const submitting = ref(false)
const errorMessage = ref('')
const search = ref('')
const items = ref<PageEntityRead[]>([])
const formDialog = ref(false)
const showDialog = ref(false)
const deleteDialog = ref(false)
const formMode = ref<'create' | 'edit' | 'patch'>('create')
const selected = ref<PageEntityRead | null>(null)
const deleteId = ref('')

const form = reactive({
  languageCode: 'en',
  jsonPayload: '{\n\n}',
})

const headers = [
  { title: 'ID', key: 'id', sortable: true },
  { title: 'languageCode', key: 'languageCode', sortable: true },
  { title: 'Actions', key: 'actions', sortable: false },
]

const refresh = async () => {
  errorMessage.value = ''
  try {
    items.value = await props.store.fetchAll()
  }
  catch {
    errorMessage.value = `Impossible de charger ${props.itemName}.`
  }
}

const openCreate = () => {
  formMode.value = 'create'
  selected.value = null
  form.languageCode = 'en'
  form.jsonPayload = '{\n\n}'
  formDialog.value = true
}

const openEdit = (item: PageEntityRead, patch = false) => {
  formMode.value = patch ? 'patch' : 'edit'
  selected.value = item
  form.languageCode = typeof item.languageCode === 'string' ? item.languageCode : 'en'
  form.jsonPayload = JSON.stringify(item, null, 2)
  formDialog.value = true
}

const showEntity = async (id: string) => {
  selected.value = await props.store.getById(id)
  showDialog.value = true
}

const openDelete = (id: string) => {
  deleteId.value = id
  deleteDialog.value = true
}

const parsePayload = () => {
  const parsed = JSON.parse(form.jsonPayload) as Record<string, unknown>
  parsed.languageCode = form.languageCode
  return parsed
}

const submit = async () => {
  submitting.value = true
  try {
    const payload = parsePayload()
    if (formMode.value === 'create') {
      await props.store.create(payload)
    }
    else if (selected.value?.id && formMode.value === 'edit') {
      await props.store.update(selected.value.id, payload)
    }
    else if (selected.value?.id) {
      await props.store.patch(selected.value.id, payload)
    }
    formDialog.value = false
    await refresh()
  }
  finally {
    submitting.value = false
  }
}

const remove = async () => {
  if (!deleteId.value) return
  submitting.value = true
  try {
    await props.store.remove(deleteId.value)
    deleteDialog.value = false
    deleteId.value = ''
    await refresh()
  }
  finally {
    submitting.value = false
  }
}

onMounted(refresh)
</script>

<template>
  <div class="admin-page-content">
    <UiSectionHeader :title="title" :subtitle="subtitle">
      <template #actions>
        <UiTableToolbar
          :search="search"
          :loading="loading"
          search-label="Search"
          create-label="Create"
          refresh-label="Refresh"
          @update:search="search = $event"
          @create="openCreate"
          @refresh="refresh"
        />
      </template>
    </UiSectionHeader>

    <v-alert v-if="errorMessage" type="error" variant="tonal" class="mb-4">{{ errorMessage }}</v-alert>

    <UiDataTable :headers="headers" :items="items" :loading="loading" :search="search" item-key="id" :items-per-page="10" empty-text="No records found.">
      <template #item.actions="{ item }">
        <div class="d-flex justify-end ga-1">
          <v-btn size="x-small" variant="text" color="primary" icon="mdi-pencil" :aria-label="`Edit ${item.id}`" @click="openEdit(item)" />
          <UiEntityActionButtons
            :show-label="`Voir ${item.id}`"
            :patch-label="`Patch ${item.id}`"
            :delete-label="`Delete ${item.id}`"
            @show="showEntity(item.id)"
            @patch="openEdit(item, true)"
            @delete="openDelete(item.id)"
          />
        </div>
      </template>
    </UiDataTable>

    <UiActionDialog v-model="formDialog" :title="`${formMode} ${itemName}`" max-width="760" persistent>
      <v-select v-model="form.languageCode" :items="['en', 'fr']" label="languageCode" class="mb-3" />
      <v-textarea v-model="form.jsonPayload" label="JSON payload" rows="16" auto-grow />
      <template #actions>
        <v-btn variant="text" @click="formDialog = false">Cancel</v-btn>
        <v-btn color="primary" :loading="submitting" @click="submit">Save</v-btn>
      </template>
    </UiActionDialog>

    <UiActionDialog v-model="showDialog" :title="`Details ${itemName}`" max-width="760">
      <pre class="text-body-2" style="white-space: pre-wrap;">{{ JSON.stringify(selected, null, 2) }}</pre>
    </UiActionDialog>

    <UiActionConfirmDialog
      v-model="deleteDialog"
      title="Delete"
      :message="`Delete ${itemName} ${deleteId} ?`"
      confirm-label="Delete"
      cancel-label="Cancel"
      :loading="submitting"
      @confirm="remove"
    />
  </div>
</template>
