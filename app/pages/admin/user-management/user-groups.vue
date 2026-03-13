<script setup lang="ts">
import UiDataTable from '~/components/ui/UiDataTable.vue'
import UiActionConfirmDialog from '~/components/ui/UiActionConfirmDialog.vue'
import UiActionDialog from '~/components/ui/UiActionDialog.vue'
import { useUserGroupsStore } from '~/stores/userGroups'
import type { UserGroup } from '~/types/api/userGroup'
import UiSectionHeader from "~/components/ui/UiSectionHeader.vue"
import UiEntityActionButtons from '~/components/ui/UiEntityActionButtons.vue'
import UiTableToolbar from "~/components/ui/UiTableToolbar.vue"
import { validateAdminUserGroupForm } from '~/validation/schemas'

definePageMeta({
  layout: 'admin',
  middleware: ['role'],
  requiredPermissions: ['admin.access'],
  skeleton: 'data-table',
})

const userGroupsStore = useUserGroupsStore()
const { t } = useI18n()
const loading = computed(() => userGroupsStore.isLoading)
const submitting = ref(false)
const errorMessage = ref('')
const userGroups = ref<UserGroup[]>([])
const search = ref('')

const formDialog = ref(false)
const showDialog = ref(false)
const deleteDialog = ref(false)
const formMode = ref<'create' | 'edit' | 'patch'>('create')
const selectedGroup = ref<UserGroup | null>(null)
const groupToDeleteId = ref('')
const form = reactive({ name: '', role: '' })
const formValidationErrors = ref<Partial<Record<'name' | 'role', string[]>>>({})
const formValidationSummary = ref<string[]>([])

const headers = computed(() => [
  { title: t('admin.userGroups.headers.name'), key: 'name', sortable: true },
  { title: t('admin.userGroups.headers.actions'), key: 'actions', sortable: false },
])

const formTitle = computed(() => (formMode.value === 'create' ? t('admin.userGroups.form.createTitle') : formMode.value === 'edit' ? t('admin.userGroups.form.editTitle') : t('admin.userGroups.form.patchTitle')))

const fetchUserGroups = async () => {
  errorMessage.value = ''

  try {
    userGroups.value = await userGroupsStore.fetchAll()
  }
  catch {
    errorMessage.value = t('admin.userGroups.errors.load')
  }
}

const showEntity = async (id: string) => {
  selectedGroup.value = await userGroupsStore.getById(id)
  showDialog.value = true
}

const openCreateDialog = () => {
  formMode.value = 'create'
  formValidationErrors.value = {}
  formValidationSummary.value = []
  selectedGroup.value = null
  Object.assign(form, { name: '', role: '' })
  formDialog.value = true
}

const openEditDialog = (group: UserGroup, patch = false) => {
  selectedGroup.value = group
  formMode.value = patch ? 'patch' : 'edit'
  formValidationErrors.value = {}
  formValidationSummary.value = []
  Object.assign(form, { name: group.name, role: group.role?.id ?? '' })
  formDialog.value = true
}

const submitForm = async () => {
  const validation = validateAdminUserGroupForm(form, t)
  formValidationErrors.value = validation.fieldErrors
  formValidationSummary.value = validation.summary

  if (!validation.isValid) {
    return
  }

  submitting.value = true
  try {
    if (formMode.value === 'create') {
      await userGroupsStore.create({ name: form.name, role: form.role })
    }
    else if (formMode.value === 'edit' && selectedGroup.value) {
      await userGroupsStore.update(selectedGroup.value.id, { name: form.name, role: form.role })
    }
    else if (formMode.value === 'patch' && selectedGroup.value) {
      await userGroupsStore.patch(selectedGroup.value.id, { name: form.name, role: form.role })
    }

    formDialog.value = false
    await fetchUserGroups()
  }
  finally {
    submitting.value = false
  }
}

const openDeleteDialog = (id: string) => {
  groupToDeleteId.value = id
  deleteDialog.value = true
}

const deleteEntity = async () => {
  if (!groupToDeleteId.value) {
    return
  }

  submitting.value = true
  try {
    await userGroupsStore.remove(groupToDeleteId.value)
    deleteDialog.value = false
    groupToDeleteId.value = ''
    await fetchUserGroups()
  }
  finally {
    submitting.value = false
  }
}

onMounted(async () => {
  await fetchUserGroups()
})
</script>

<template>
  <div class="admin-page-content">
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
            @refresh="fetchUserGroups"
          />
        </template>
      </UiSectionHeader>
    <v-alert v-if="errorMessage" type="error" variant="tonal" class="mb-4">
      {{ errorMessage }}
    </v-alert>

    <UiDataTable
        :headers="headers"
        :items="userGroups"
        :loading="loading"
        :search="search"
        item-key="id"
        :items-per-page="10"
        :empty-text="t('admin.userGroups.empty')"
    >
      <template #item.actions="{ item }">
        <UiEntityActionButtons
          :show-label="t('admin.userGroups.aria.show', { id: item.id })"
          :patch-label="t('admin.userGroups.aria.patch', { id: item.id })"
          :delete-label="t('admin.userGroups.aria.delete', { id: item.id })"
          @show="showEntity(item.id)"
          @patch="openEditDialog(item, true)"
          @delete="openDeleteDialog(item.id)"
        />
      </template>
    </UiDataTable>

    <UiActionConfirmDialog
      v-model="deleteDialog"
      :title="t('admin.common.delete')"
      :message="t('admin.userGroups.confirmDelete', { id: groupToDeleteId })"
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
      <v-alert v-if="formValidationSummary.length" type="error" variant="tonal" class="mb-3" role="alert">
        <p class="font-weight-bold mb-1">{{ t('validation.summaryTitle') }}</p>
        <ul class="pl-4 mb-0">
          <li v-for="message in formValidationSummary" :key="message">{{ message }}</li>
        </ul>
      </v-alert>
      <v-text-field v-model="form.name" :label="t('admin.userGroups.form.groupName')" class="mb-2" :error="Boolean(formValidationErrors.name?.length)" :error-messages="formValidationErrors.name" />
      <v-text-field v-model="form.role" :label="t('admin.userGroups.form.roleId')" :error="Boolean(formValidationErrors.role?.length)" :error-messages="formValidationErrors.role" />

      <template #actions>
        <v-btn variant="text" @click="formDialog = false">{{ t('admin.common.cancel') }}</v-btn>
        <v-btn color="primary" :loading="submitting" @click="submitForm">{{ t('admin.common.save') }}</v-btn>
      </template>
    </UiActionDialog>

    <UiActionDialog
      v-model="showDialog"
      :title="t('admin.userGroups.dialogs.groupDetails')"
      max-width="700"
    >
      <pre class="text-body-2" style="white-space: pre-wrap;">{{ JSON.stringify(selectedGroup, null, 2) }}</pre>
    </UiActionDialog>
  </div>
</template>


