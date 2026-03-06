<script setup lang="ts">
import UiDataTable from '~/components/ui/UiDataTable.vue'
import UiActionConfirmDialog from '~/components/ui/UiActionConfirmDialog.vue'
import UiActionDialog from '~/components/ui/UiActionDialog.vue'
import UiPageSection from '~/components/ui/UiPageSection.vue'
import UiSectionHeader from '~/components/ui/UiSectionHeader.vue'
import { useUsersStore } from '~/stores/users'
import type { UserGroup } from '~/types/api/userGroup'
import type { UserRead, UserWrite } from '~/types/api/user'

definePageMeta({
  layout: 'admin',
  middleware: ['role'],
  requiredPermissions: ['admin.access'],
})

const usersStore = useUsersStore()
const { t } = useI18n()
const loading = ref(false)
const submitting = ref(false)
const errorMessage = ref('')
const users = ref<UserRead[]>([])
const search = ref('')

const formMode = ref<'create' | 'edit' | 'patch'>('create')
const formDialog = ref(false)
const deleteDialog = ref(false)
const showDialog = ref(false)
const rolesDialog = ref(false)
const groupsDialog = ref(false)
const selectedUser = ref<UserRead | null>(null)
const userToDeleteId = ref('')
const selectedUserRoles = ref<string[]>([])
const selectedUserGroups = ref<UserGroup[]>([])
const groupToAttach = ref('')
const userRelations = ref<Record<string, { roles: string[]; groups: UserGroup[] }>>({})

const form = reactive<UserWrite>({
  username: '',
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  language: 'fr',
  locale: 'fr_FR',
  timezone: 'Europe/Paris',
  photo: '',
})

const headers = computed(() => [
  { title: '', key: 'photo', sortable: false },
  { title: t('admin.users.headers.username'), key: 'username', sortable: true },
  { title: t('admin.users.headers.name'), key: 'fullName', sortable: true },
  { title: t('admin.users.headers.email'), key: 'email', sortable: true },
  { title: t('admin.users.headers.relations'), key: 'relations', sortable: false },
  { title: t('admin.users.headers.actions'), key: 'actions', sortable: false },
])

const tableItems = computed(() => users.value.map(user => ({
  ...user,
  fullName: `${user.firstName} ${user.lastName}`.trim(),
  relations: userRelations.value[user.id] ?? { roles: [], groups: [] },
})))

const formTitle = computed(() => {
  if (formMode.value === 'create') {
    return t('admin.users.form.createTitle')
  }

  if (formMode.value === 'edit') {
    return t('admin.users.form.editTitle')
  }

  return t('admin.users.form.patchTitle')
})

const fetchUsers = async () => {
  loading.value = true
  errorMessage.value = ''

  try {
    users.value = await usersStore.fetchAll()
    userRelations.value = { ...usersStore.relations }

    void usersStore.fetchRelations(users.value.map(user => user.id)).then(() => {
      userRelations.value = { ...usersStore.relations }
    })
  }
  catch {
    errorMessage.value = t('admin.users.errors.load')
  }
  finally {
    loading.value = false
  }
}

const resetForm = () => {
  Object.assign(form, {
    username: '',
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    language: 'fr',
    locale: 'fr_FR',
    timezone: 'Europe/Paris',
    photo: '',
  })
}

const openCreateDialog = () => {
  formMode.value = 'create'
  resetForm()
  formDialog.value = true
}

const openEditDialog = (user: UserRead, patch = false) => {
  formMode.value = patch ? 'patch' : 'edit'
  Object.assign(form, {
    username: user.username,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    password: '',
    language: user.language ?? 'fr',
    locale: user.locale ?? 'fr_FR',
    timezone: user.timezone,
    photo: user.photo ?? '',
  })
  selectedUser.value = user
  formDialog.value = true
}


const showEntity = async (id: string) => {
  selectedUser.value = await usersStore.getById(id)
  showDialog.value = true
}

const openRolesDialog = async (user: UserRead) => {
  selectedUser.value = user
  selectedUserRoles.value = await usersStore.getRoles(user.id)
  rolesDialog.value = true
}

const openGroupsDialog = async (user: UserRead) => {
  selectedUser.value = user
  selectedUserGroups.value = await usersStore.getGroups(user.id)
  groupsDialog.value = true
}

const openDeleteDialog = (id: string) => {
  userToDeleteId.value = id
  deleteDialog.value = true
}

const attachGroup = async () => {
  if (!selectedUser.value || !groupToAttach.value.trim()) {
    return
  }

  await usersStore.attachGroup(selectedUser.value.id, groupToAttach.value.trim())
  groupToAttach.value = ''
  selectedUserGroups.value = await usersStore.getGroups(selectedUser.value.id)
}

const detachGroup = async (groupId: string) => {
  if (!selectedUser.value) {
    return
  }

  await usersStore.detachGroup(selectedUser.value.id, groupId)
  selectedUserGroups.value = await usersStore.getGroups(selectedUser.value.id)
}

const submitForm = async () => {
  if ((formMode.value === 'edit' || formMode.value === 'patch') && !selectedUser.value) {
    return
  }

  submitting.value = true
  try {
    if (formMode.value === 'create') {
      await usersStore.create({ ...form })
    }
    else if (formMode.value === 'edit') {
      await usersStore.update(selectedUser.value!.id, { ...form })
    }
    else {
      await usersStore.patch(selectedUser.value!.id, {
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        timezone: form.timezone,
        language: form.language,
        locale: form.locale,
        photo: form.photo,
      })
    }

    formDialog.value = false
    await fetchUsers()
  }
  finally {
    submitting.value = false
  }
}

const deleteEntity = async () => {
  if (!userToDeleteId.value) {
    return
  }

  submitting.value = true
  try {
    await usersStore.remove(userToDeleteId.value)
    deleteDialog.value = false
    userToDeleteId.value = ''
    await fetchUsers()
  }
  finally {
    submitting.value = false
  }
}

onMounted(async () => {
  await fetchUsers()
})
</script>

<template>
  <UiPageSection>
    <template #header>
      <UiSectionHeader
      >
        <template #actions>
          <div class="users-page-appbar-tools">
            <v-text-field
                v-model="search"
                :label="t('admin.common.search')"
                prepend-inner-icon="mdi-magnify"
                density="compact"
                variant="outlined"
                hide-details
                class="users-page-appbar-tools__search"
            />

            <v-btn
                prepend-icon="mdi-plus"
                color="primary"
                :aria-label="t('admin.common.create')"
                @click="openCreateDialog"
                variant="outlined"
            >New</v-btn>

            <v-btn
                prepend-icon="mdi-refresh"
                color="primary"
                variant="outlined"
                :loading="loading"
                :aria-label="t('admin.common.refresh')"
                @click="fetchUsers"
            >Refresh</v-btn>
          </div>
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
        :empty-text="t('admin.users.empty')"
    >
      <template #item.photo="{ item }">
        <v-avatar size="32">
          <v-img :src="item.photo" :alt="item.username" />
        </v-avatar>
      </template>

      <template #item.relations="{ item }">
        <div class="d-flex flex-nowrap ga-1 py-1">
          <v-btn size="x-small" variant="tonal" color="secondary" @click="openRolesDialog(item)">{{ t('admin.users.buttons.roles') }}</v-btn>
          <v-btn size="x-small" variant="tonal" color="secondary" @click="openGroupsDialog(item)">{{ t('admin.users.buttons.groups') }}</v-btn>
        </div>
      </template>

      <template #item.actions="{ item }">
        <div class="d-flex justify-end flex-nowrap ga-1 py-1">
          <v-btn size="x-small" variant="tonal" icon="mdi-eye" :aria-label="t('admin.users.aria.show', { name: item.username })" @click="showEntity(item.id)" />
          <v-btn size="x-small" variant="tonal" color="warning" icon="mdi-file-edit-outline" :aria-label="t('admin.users.aria.patch', { name: item.username })" @click="openEditDialog(item, true)" />
          <v-btn size="x-small" variant="tonal" color="error" icon="mdi-delete" :aria-label="t('admin.users.aria.delete', { name: item.username })" @click="openDeleteDialog(item.id)" />
        </div>
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

  </UiPageSection>
</template>

<style scoped>
.users-page-appbar-tools {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  margin-inline-start: 8px;
}

.users-page-appbar-tools__search {
  min-width: 200px;
  max-width: 280px;
}
</style>
