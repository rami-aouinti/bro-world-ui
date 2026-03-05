<script setup lang="ts">
import UiDataTable from '~/components/ui/UiDataTable.vue'
import UiPageSection from '~/components/ui/UiPageSection.vue'
import UiSectionHeader from '~/components/ui/UiSectionHeader.vue'
import { useUsersApi } from '~/composables/api/useUsersApi'
import type { UserGroup } from '~/types/api/userGroup'
import type { UserRead, UserWrite } from '~/types/api/user'

definePageMeta({
  layout: 'admin',
  middleware: ['role'],
  requiredPermissions: ['admin.access'],
})

const usersApi = useUsersApi()
const loading = ref(false)
const submitting = ref(false)
const errorMessage = ref('')
const users = ref<UserRead[]>([])
const search = ref('')

const formMode = ref<'create' | 'edit' | 'patch'>('create')
const formDialog = ref(false)
const selectedUser = ref<UserRead | null>(null)
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

const headers = [
  { title: '', key: 'photo', sortable: false },
  { title: 'Username', key: 'username', sortable: true },
  { title: 'Nom', key: 'fullName', sortable: true },
  { title: 'Email', key: 'email', sortable: true },
  { title: 'Relations', key: 'relations', sortable: false },
  { title: 'Actions', key: 'actions', sortable: false },
]

const tableItems = computed(() => users.value.map(user => ({
  ...user,
  fullName: `${user.firstName} ${user.lastName}`.trim(),
  relations: userRelations.value[user.id] ?? { roles: [], groups: [] },
})))

const formTitle = computed(() => {
  if (formMode.value === 'create') {
    return 'Créer un utilisateur'
  }

  if (formMode.value === 'edit') {
    return 'Éditer un utilisateur'
  }

  return 'Patch utilisateur'
})

const fetchUsers = async () => {
  loading.value = true
  errorMessage.value = ''

  try {
    users.value = await usersApi.list({ limit: 200 })

    const relations = await Promise.all(users.value.map(async (user) => {
      const [roles, groups] = await Promise.all([
        usersApi.getRoles(user.id).catch(() => []),
        usersApi.getGroups(user.id).catch(() => []),
      ])

      return [user.id, { roles, groups }] as const
    }))

    userRelations.value = Object.fromEntries(relations)
  }
  catch {
    errorMessage.value = 'Impossible de charger les utilisateurs depuis /api/v1/user.'
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
  selectedUser.value = await usersApi.getById(id)
  showDialog.value = true
}

const openRolesDialog = async (user: UserRead) => {
  selectedUser.value = user
  selectedUserRoles.value = await usersApi.getRoles(user.id)
  rolesDialog.value = true
}

const openGroupsDialog = async (user: UserRead) => {
  selectedUser.value = user
  selectedUserGroups.value = await usersApi.getGroups(user.id)
  groupsDialog.value = true
}

const attachGroup = async () => {
  if (!selectedUser.value || !groupToAttach.value.trim()) {
    return
  }

  await usersApi.attachGroup(selectedUser.value.id, groupToAttach.value.trim())
  groupToAttach.value = ''
  selectedUserGroups.value = await usersApi.getGroups(selectedUser.value.id)
}

const detachGroup = async (groupId: string) => {
  if (!selectedUser.value) {
    return
  }

  await usersApi.detachGroup(selectedUser.value.id, groupId)
  selectedUserGroups.value = await usersApi.getGroups(selectedUser.value.id)
}

const submitForm = async () => {
  if ((formMode.value === 'edit' || formMode.value === 'patch') && !selectedUser.value) {
    return
  }

  submitting.value = true
  try {
    if (formMode.value === 'create') {
      await usersApi.create({ ...form })
    }
    else if (formMode.value === 'edit') {
      await usersApi.update(selectedUser.value!.id, { ...form })
    }
    else {
      await usersApi.patch(selectedUser.value!.id, {
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

const deleteEntity = async (id: string) => {
  if (!window.confirm(`Supprimer l\'utilisateur ${id} ?`)) {
    return
  }

  await usersApi.delete(id)
  await fetchUsers()
}

await fetchUsers()
</script>

<template>
  <UiPageSection max-width="1200">
    <Teleport
      defer
      to="#app-bar-teleport-target"
    >
      <div class="users-page-appbar-tools">
        <v-text-field
          v-model="search"
          label="Rechercher"
          prepend-inner-icon="mdi-magnify"
          density="comfortable"
          variant="underlined"
          hide-details
          class="users-page-appbar-tools__search"
        />

        <v-btn
          icon="mdi-plus"
          color="primary"
          :aria-label="'Créer'"
          @click="openCreateDialog"
        />

        <v-btn
          icon="mdi-refresh"
          color="primary"
          variant="outlined"
          :loading="loading"
          :aria-label="'Actualiser'"
          @click="fetchUsers"
        />
      </div>
    </Teleport>

    <template #header>
      <UiSectionHeader
        title="Gestion des utilisateurs"
        subtitle="Données chargées depuis /api/v1/user"
      />
    </template>

    <v-card rounded="xl" elevation="2" class="pa-4">
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
        empty-text="Aucun utilisateur trouvé."
      >
        <template #item.photo="{ item }">
          <v-avatar size="32">
            <v-img :src="item.photo" :alt="item.username" />
          </v-avatar>
        </template>

        <template #item.relations="{ item }">
          <div class="d-flex flex-nowrap ga-1 py-1">
            <v-btn size="x-small" variant="tonal" color="secondary" @click="openRolesDialog(item)">Roles</v-btn>
            <v-btn size="x-small" variant="tonal" color="secondary" @click="openGroupsDialog(item)">Groups</v-btn>
          </div>
        </template>

        <template #item.actions="{ item }">
          <div class="d-flex flex-nowrap ga-1 py-1">
            <v-btn size="x-small" variant="tonal" icon="mdi-eye" :aria-label="`Show ${item.username}`" @click="showEntity(item.id)" />
            <v-btn size="x-small" variant="tonal" color="warning" icon="mdi-file-edit-outline" :aria-label="`Patch ${item.username}`" @click="openEditDialog(item, true)" />
            <v-btn size="x-small" variant="tonal" color="error" icon="mdi-delete" :aria-label="`Delete ${item.username}`" @click="deleteEntity(item.id)" />
          </div>
        </template>
      </UiDataTable>
    </v-card>

    <v-dialog v-model="formDialog" max-width="760" persistent>
      <v-card rounded="xl" class="pa-2">
        <v-card-title class="text-h6">{{ formTitle }}</v-card-title>
        <v-card-text>
          <v-row>
            <v-col cols="12" md="6"><v-text-field v-model="form.username" label="Username" :disabled="formMode === 'patch'" /></v-col>
            <v-col cols="12" md="6"><v-text-field v-model="form.email" label="Email" /></v-col>
            <v-col cols="12" md="6"><v-text-field v-model="form.firstName" label="Prénom" /></v-col>
            <v-col cols="12" md="6"><v-text-field v-model="form.lastName" label="Nom" /></v-col>
            <v-col cols="12" md="6"><v-text-field v-model="form.password" type="password" label="Password" hint="Laisser vide pour ne pas changer" persistent-hint /></v-col>
            <v-col cols="12" md="6"><v-text-field v-model="form.timezone" label="Timezone" /></v-col>
            <v-col cols="12" md="6"><v-text-field v-model="form.language" label="Language" /></v-col>
            <v-col cols="12" md="6"><v-text-field v-model="form.locale" label="Locale" /></v-col>
            <v-col cols="12"><v-text-field v-model="form.photo" label="Photo URL" /></v-col>
          </v-row>
        </v-card-text>
        <v-card-actions class="justify-end">
          <v-btn variant="text" @click="formDialog = false">Annuler</v-btn>
          <v-btn color="primary" :loading="submitting" @click="submitForm">Enregistrer</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>


    <v-dialog v-model="showDialog" max-width="700">
      <v-card rounded="xl">
        <v-card-title>Détails utilisateur</v-card-title>
        <v-card-text>
          <pre class="text-body-2" style="white-space: pre-wrap;">{{ JSON.stringify(selectedUser, null, 2) }}</pre>
        </v-card-text>
      </v-card>
    </v-dialog>

    <v-dialog v-model="rolesDialog" max-width="560">
      <v-card rounded="xl">
        <v-card-title>Rôles utilisateur</v-card-title>
        <v-card-text>
          <v-chip v-for="role in selectedUserRoles" :key="role" class="mr-2 mb-2">{{ role }}</v-chip>
        </v-card-text>
      </v-card>
    </v-dialog>

    <v-dialog v-model="groupsDialog" max-width="700">
      <v-card rounded="xl">
        <v-card-title>Groupes utilisateur</v-card-title>
        <v-card-text>
          <v-text-field
            v-model="groupToAttach"
            label="ID du groupe à attacher"
            append-inner-icon="mdi-plus"
            @click:append-inner="attachGroup"
          />
          <div class="d-flex flex-column ga-2">
            <div v-for="group in selectedUserGroups" :key="group.id" class="d-flex align-center justify-space-between border rounded px-3 py-2">
              <div>
                <div class="text-body-1">{{ group.name }}</div>
                <div class="text-caption">{{ group.id }} • {{ group.role?.id }}</div>
              </div>
              <v-btn size="small" color="error" variant="tonal" @click="detachGroup(group.id)">Detach</v-btn>
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
