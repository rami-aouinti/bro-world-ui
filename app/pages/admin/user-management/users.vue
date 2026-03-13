<script setup lang="ts">
import UiDataTable from '~/components/ui/UiDataTable.vue'
import UiActionConfirmDialog from '~/components/ui/UiActionConfirmDialog.vue'
import UiActionDialog from '~/components/ui/UiActionDialog.vue'
import UiSectionHeader from '~/components/ui/UiSectionHeader.vue'
import UiEntityActionButtons from '~/components/ui/UiEntityActionButtons.vue'
import UiTableToolbar from '~/components/ui/UiTableToolbar.vue'
import { useUserManagementPage } from '~/composables/admin/useUserManagementPage'

definePageMeta({
  layout: 'admin',
  middleware: ['role'],
  requiredPermissions: ['admin.access'],
  skeleton: 'data-table',
})

const { t } = useI18n()

const {
  attachGroup,
  deleteDialog,
  deleteEntity,
  detachGroup,
  errorMessage,
  fetchUsers,
  form,
  formDialog,
  formMode,
  formTitle,
  groupToAttach,
  groupsDialog,
  headers,
  loading,
  openCreateDialog,
  openDeleteDialog,
  openEditDialog,
  openGroupsDialog,
  openRolesDialog,
  rolesDialog,
  search,
  selectedUser,
  selectedUserGroups,
  selectedUserRoles,
  showDialog,
  showEntity,
  submitForm,
  submitting,
  tableItems,
  userToDeleteId,
} = useUserManagementPage(t)
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
            @refresh="fetchUsers"
          />
        </template>
      </UiSectionHeader>
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
        :empty-text="t('admin.users.empty')"
    >
      <template #item.photo="{ item }">
        <v-avatar size="32">
          <v-img :src="item.photo" :alt="item.username" />
        </v-avatar>
      </template>

      <template #item.relations="{ item }">
        <div class="d-flex flex-nowrap ga-1 py-1">
          <v-btn size="x-small" variant="outlined" color="secondary" @click="openRolesDialog(item)">{{ t('admin.users.buttons.roles') }}</v-btn>
          <v-btn size="x-small" variant="outlined" color="secondary" @click="openGroupsDialog(item)">{{ t('admin.users.buttons.groups') }}</v-btn>
        </div>
      </template>

      <template #item.actions="{ item }">
        <UiEntityActionButtons
          :show-label="t('admin.users.aria.show', { name: item.username })"
          :patch-label="t('admin.users.aria.patch', { name: item.username })"
          :delete-label="t('admin.users.aria.delete', { name: item.username })"
          @show="showEntity(item.id)"
          @patch="openEditDialog(item, true)"
          @delete="openDeleteDialog(item.id)"
        />
      </template>
    </UiDataTable>

    <UiActionConfirmDialog
      v-model="deleteDialog"
      :title="t('admin.common.delete')"
      :message="t('admin.users.confirmDelete', { id: userToDeleteId })"
      :confirm-label="t('admin.common.delete')"
      :cancel-label="t('admin.common.cancel')"
      :loading="submitting"
      @confirm="deleteEntity"
    />

    <UiActionDialog
      v-model="formDialog"
      :title="formTitle"
      max-width="760"
      persistent
    >
      <v-row>
        <v-col cols="12" md="6"><v-text-field v-model="form.username" :label="t('admin.users.form.username')" :disabled="formMode === 'patch'" /></v-col>
        <v-col cols="12" md="6"><v-text-field v-model="form.email" :label="t('admin.users.form.email')" /></v-col>
        <v-col cols="12" md="6"><v-text-field v-model="form.firstName" :label="t('admin.users.form.firstName')" /></v-col>
        <v-col cols="12" md="6"><v-text-field v-model="form.lastName" :label="t('admin.users.form.lastName')" /></v-col>
        <v-col cols="12" md="6"><v-text-field v-model="form.password" type="password" :label="t('admin.users.form.password')" :hint="t('admin.users.form.passwordHint')" persistent-hint /></v-col>
        <v-col cols="12" md="6"><v-text-field v-model="form.timezone" :label="t('admin.users.form.timezone')" /></v-col>
        <v-col cols="12" md="6"><v-text-field v-model="form.language" :label="t('admin.users.form.language')" /></v-col>
        <v-col cols="12" md="6"><v-text-field v-model="form.locale" :label="t('admin.users.form.locale')" /></v-col>
        <v-col cols="12"><v-text-field v-model="form.photo" :label="t('admin.users.form.photoUrl')" /></v-col>
      </v-row>

      <template #actions>
        <v-btn variant="text" @click="formDialog = false">{{ t('admin.common.cancel') }}</v-btn>
        <v-btn color="primary" :loading="submitting" @click="submitForm">{{ t('admin.common.save') }}</v-btn>
      </template>
    </UiActionDialog>


    <UiActionDialog
      v-model="showDialog"
      :title="t('admin.users.dialogs.userDetails')"
      max-width="700"
    >
      <pre class="text-body-2" style="white-space: pre-wrap;">{{ JSON.stringify(selectedUser, null, 2) }}</pre>
    </UiActionDialog>

    <v-dialog v-model="rolesDialog" max-width="560">
      <v-card rounded="xl">
        <v-card-title>{{ t('admin.users.dialogs.userRoles') }}</v-card-title>
        <v-card-text>
          <v-chip v-for="role in selectedUserRoles" :key="role" class="mr-2 mb-2">{{ role }}</v-chip>
        </v-card-text>
      </v-card>
    </v-dialog>

    <v-dialog v-model="groupsDialog" max-width="700">
      <v-card rounded="xl">
        <v-card-title>{{ t('admin.users.dialogs.userGroups') }}</v-card-title>
        <v-card-text>
          <v-text-field
            v-model="groupToAttach"
            :label="t('admin.users.form.groupIdToAttach')"
            append-inner-icon="mdi-plus"
            @click:append-inner="attachGroup"
          />
          <div class="d-flex flex-column ga-2">
            <div v-for="group in selectedUserGroups" :key="group.id" class="d-flex align-center justify-space-between border rounded px-3 py-2">
              <div>
                <div class="text-body-1">{{ group.name }}</div>
                <div class="text-caption">{{ group.id }} • {{ group.role?.id }}</div>
              </div>
              <v-btn size="small" color="error" variant="tonal" @click="detachGroup(group.id)">{{ t('admin.users.buttons.detach') }}</v-btn>
            </div>
          </div>
        </v-card-text>
      </v-card>
    </v-dialog>

  </div>
</template>

