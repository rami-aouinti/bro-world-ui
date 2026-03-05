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
const showDialog = ref(false)
const rolesDialog = ref(false)
const groupsDialog = ref(false)
const selectedUser = ref<UserRead | null>(null)
const selectedUserRoles = ref<string[]>([])
const selectedUserGroups = ref<UserGroup[]>([])
const groupToAttach = ref('')

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
  { title: 'Username', key: 'username', sortable: true },
  { title: 'Nom', key: 'fullName', sortable: true },
  { title: 'Email', key: 'email', sortable: true },
  { title: 'Language', key: 'language', sortable: true },
  { title: 'Locale', key: 'locale', sortable: true },
  { title: 'Timezone', key: 'timezone', sortable: true },
  { title: 'Photo', key: 'photo', sortable: false },
  { title: 'Actions', key: 'actions', sortable: false },
]

const tableItems = computed(() => users.value.map(user => ({
  ...user,
  fullName: `${user.firstName} ${user.lastName}`.trim(),
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
    <template #header>
      <UiSectionHeader
        title="Gestion des utilisateurs"
        subtitle="Données chargées depuis /api/v1/user"
      >
        <template #actions>
          <v-btn color="primary" prepend-icon="mdi-plus" class="mr-2" @click="openCreateDialog">
            Créer
          </v-btn>
          <v-btn
            color="primary"
            variant="outlined"
            prepend-icon="mdi-refresh"
            :loading="loading"
            @click="fetchUsers"
          >
            Actualiser
          </v-btn>
        </template>
      </UiSectionHeader>
    </template>

    <v-card rounded="xl" elevation="2" class="pa-4">
      <v-text-field
        v-model="search"
        label="Rechercher"
        prepend-inner-icon="mdi-magnify"
        density="comfortable"
        hide-details
        class="mb-4"
        max-width="360"
      />

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

        <template #item.actions="{ item }">
          <div class="d-flex flex-wrap ga-1 py-1">
            <v-btn size="small" variant="tonal" rounded="pill" @click="showEntity(item.id)">Show</v-btn>
            <v-btn size="small" variant="tonal" rounded="pill" color="secondary" @click="openRolesDialog(item)">Roles</v-btn>
            <v-btn size="small" variant="tonal" rounded="pill" color="secondary" @click="openGroupsDialog(item)">Groups</v-btn>
            <v-btn size="small" variant="tonal" rounded="pill" color="info" @click="openEditDialog(item)">Edit</v-btn>
            <v-btn size="small" variant="tonal" rounded="pill" color="warning" @click="openEditDialog(item, true)">Patch</v-btn>
            <v-btn size="small" variant="tonal" rounded="pill" color="error" @click="deleteEntity(item.id)">Delete</v-btn>
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
