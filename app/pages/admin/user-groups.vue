<script setup lang="ts">
import UiDataTable from '~/components/ui/UiDataTable.vue'
import UiActionConfirmDialog from '~/components/ui/UiActionConfirmDialog.vue'
import UiPageSection from '~/components/ui/UiPageSection.vue'
import { useUserGroupsStore } from '~/stores/userGroups'
import type { UserGroup } from '~/types/api/userGroup'

definePageMeta({
  layout: 'admin',
  middleware: ['role'],
  requiredPermissions: ['admin.access'],
})

const userGroupsStore = useUserGroupsStore()
const { t } = useI18n()
const loading = ref(false)
const errorMessage = ref('')
const userGroups = ref<UserGroup[]>([])
const search = ref('')

const showDialog = ref(false)
const deleteDialog = ref(false)
const selectedGroup = ref<UserGroup | null>(null)
const groupToDeleteId = ref('')

const headers = computed(() => [
  { title: t('admin.userGroups.headers.name'), key: 'name', sortable: true },
  { title: t('admin.userGroups.headers.actions'), key: 'actions', sortable: false },
])

const formTitle = computed(() => (formMode.value === 'create' ? t('admin.userGroups.form.createTitle') : formMode.value === 'edit' ? t('admin.userGroups.form.editTitle') : t('admin.userGroups.form.patchTitle')))

const fetchUserGroups = async () => {
  loading.value = true
  errorMessage.value = ''

  try {
    userGroups.value = await userGroupsStore.fetchAll()
  }
  catch {
    errorMessage.value = t('admin.userGroups.errors.load')
  }
  finally {
    loading.value = false
  }
}

const showEntity = async (id: string) => {
  selectedGroup.value = await userGroupsStore.getById(id)
  showDialog.value = true
}

const submitForm = async () => {
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

await fetchUserGroups()
</script>

<template>
  <UiPageSection>
    <Teleport
      defer
      to="#app-bar-teleport-target"
    >
      <div class="user-groups-page-appbar-tools">
        <v-text-field
          v-model="search"
          :label="t('admin.common.search')"
          prepend-inner-icon="mdi-magnify"
          density="comfortable"
          variant="underlined"
          hide-details
          class="user-groups-page-appbar-tools__search"
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
          @click="fetchUserGroups"
        />
      </div>
    </Teleport>

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
        <div class="d-flex flex-nowrap ga-1 py-1">
          <v-btn size="x-small" variant="tonal" icon="mdi-eye" :aria-label="t('admin.userGroups.aria.show', { id: item.id })" @click="showEntity(item.id)" />
          <v-btn size="x-small" variant="tonal" color="warning" icon="mdi-file-edit-outline" :aria-label="t('admin.userGroups.aria.patch', { id: item.id })" @click="openEditDialog(item, true)" />
          <v-btn size="x-small" variant="tonal" color="error" icon="mdi-delete" :aria-label="t('admin.userGroups.aria.delete', { id: item.id })" @click="openDeleteDialog(item.id)" />
        </div>
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

    <v-dialog v-model="formDialog" max-width="560" persistent>
      <v-card rounded="xl">
        <v-card-title>{{ formTitle }}</v-card-title>
        <v-card-text>
          <v-text-field v-model="form.name" :label="t('admin.userGroups.form.groupName')" class="mb-2" />
          <v-text-field v-model="form.role" :label="t('admin.userGroups.form.roleId')" />
        </v-card-text>
        <v-card-actions class="justify-end">
          <v-btn variant="text" @click="formDialog = false">{{ t('admin.common.cancel') }}</v-btn>
          <v-btn color="primary" :loading="submitting" @click="submitForm">{{ t('admin.common.save') }}</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="showDialog" max-width="700">
      <v-card rounded="xl">
        <v-card-title>{{ t('admin.userGroups.dialogs.groupDetails') }}</v-card-title>
        <v-card-text>
          <pre class="text-body-2" style="white-space: pre-wrap;">{{ JSON.stringify(selectedGroup, null, 2) }}</pre>
        </v-card-text>
      </v-card>
    </v-dialog>
  </UiPageSection>
</template>


<style scoped>
.user-groups-page-appbar-tools {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  margin-inline-start: 8px;
}

.user-groups-page-appbar-tools__search {
  min-width: 200px;
  max-width: 280px;
}
</style>
