<script setup lang="ts">
import UiDataTable from '~/components/ui/UiDataTable.vue'
import UiPageSection from '~/components/ui/UiPageSection.vue'
import UiSectionHeader from '~/components/ui/UiSectionHeader.vue'
import { useUsersApi } from '~/composables/api/useUsersApi'
import type { UserRead } from '~/types/api/user'

definePageMeta({ middleware: ['role'], requiredPermissions: ['admin.access'] })

const usersApi = useUsersApi()
const loading = ref(false)
const actionLoading = ref(false)
const errorMessage = ref('')
const dialogError = ref('')
const users = ref<UserRead[]>([])
const search = ref('')

const createDialog = ref(false)
const showDialog = ref(false)
const editDialog = ref(false)
const patchDialog = ref(false)
const deleteDialog = ref(false)

const selectedItem = ref<UserRead | null>(null)

const headers = [
  { title: 'Username', key: 'username', sortable: true },
  { title: 'Nom', key: 'fullName', sortable: true },
  { title: 'Email', key: 'email', sortable: true },
  { title: 'Timezone', key: 'timezone', sortable: true },
  { title: 'Rôles', key: 'rolesLabel', sortable: false },
  { title: 'Actions', key: 'actions', sortable: false },
]

const emptyUserForm = () => ({
  username: '',
  firstName: '',
  lastName: '',
  email: '',
  timezone: 'Europe/Paris',
  roles: '',
  userGroups: '',
})

const createForm = ref(emptyUserForm())
const editForm = ref(emptyUserForm())
const patchForm = ref({ firstName: '', lastName: '', email: '', timezone: '' })

const tableItems = computed(() => users.value.map(user => ({
  ...user,
  fullName: `${user.firstName} ${user.lastName}`.trim(),
  rolesLabel: Array.isArray(user.roles) ? user.roles.map(role => role.id).join(', ') : '',
})))

const parseIds = (value: string) => value.split(',').map(item => item.trim()).filter(Boolean)

const fetchUsers = async () => {
  loading.value = true
  errorMessage.value = ''
  try {
    const response = await usersApi.list({ limit: 200 })
    users.value = Array.isArray(response) ? response : (response.results ?? [])
  }
  catch {
    errorMessage.value = 'Impossible de charger les utilisateurs depuis /api/v1/user.'
  }
  finally {
    loading.value = false
  }
}

const openCreateDialog = () => {
  createForm.value = emptyUserForm()
  dialogError.value = ''
  createDialog.value = true
}

const openShowDialog = async (id: string) => {
  dialogError.value = ''
  actionLoading.value = true
  try {
    selectedItem.value = await usersApi.getById(id)
    showDialog.value = true
  }
  catch {
    dialogError.value = 'Impossible de charger le détail utilisateur.'
  }
  finally {
    actionLoading.value = false
  }
}

const openEditDialog = (item: UserRead) => {
  selectedItem.value = item
  editForm.value = {
    username: item.username,
    firstName: item.firstName,
    lastName: item.lastName,
    email: item.email,
    timezone: item.timezone,
    roles: item.roles.map(role => role.id).join(', '),
    userGroups: item.userGroups.map(group => group.id).join(', '),
  }
  dialogError.value = ''
  editDialog.value = true
}

const openPatchDialog = (item: UserRead) => {
  selectedItem.value = item
  patchForm.value = { firstName: item.firstName, lastName: item.lastName, email: item.email, timezone: item.timezone }
  dialogError.value = ''
  patchDialog.value = true
}

const openDeleteDialog = (item: UserRead) => {
  selectedItem.value = item
  dialogError.value = ''
  deleteDialog.value = true
}

const submitCreate = async () => {
  actionLoading.value = true
  dialogError.value = ''
  try {
    await usersApi.create({
      username: createForm.value.username,
      firstName: createForm.value.firstName,
      lastName: createForm.value.lastName,
      email: createForm.value.email,
      timezone: createForm.value.timezone,
      roles: parseIds(createForm.value.roles),
      userGroups: parseIds(createForm.value.userGroups),
    })
    createDialog.value = false
    await fetchUsers()
  }
  catch {
    dialogError.value = 'Impossible de créer l\'utilisateur.'
  }
  finally {
    actionLoading.value = false
  }
}

const submitEdit = async () => {
  if (!selectedItem.value) return
  actionLoading.value = true
  dialogError.value = ''
  try {
    await usersApi.update(selectedItem.value.id, {
      username: editForm.value.username,
      firstName: editForm.value.firstName,
      lastName: editForm.value.lastName,
      email: editForm.value.email,
      timezone: editForm.value.timezone,
      roles: parseIds(editForm.value.roles),
      userGroups: parseIds(editForm.value.userGroups),
    })
    editDialog.value = false
    await fetchUsers()
  }
  catch {
    dialogError.value = 'Impossible de modifier l\'utilisateur.'
  }
  finally {
    actionLoading.value = false
  }
}

const submitPatch = async () => {
  if (!selectedItem.value) return
  actionLoading.value = true
  dialogError.value = ''
  try {
    await usersApi.patch(selectedItem.value.id, {
      ...(patchForm.value.firstName.trim() ? { firstName: patchForm.value.firstName } : {}),
      ...(patchForm.value.lastName.trim() ? { lastName: patchForm.value.lastName } : {}),
      ...(patchForm.value.email.trim() ? { email: patchForm.value.email } : {}),
      ...(patchForm.value.timezone.trim() ? { timezone: patchForm.value.timezone } : {}),
    })
    patchDialog.value = false
    await fetchUsers()
  }
  catch {
    dialogError.value = 'Impossible de patcher l\'utilisateur.'
  }
  finally {
    actionLoading.value = false
  }
}

const submitDelete = async () => {
  if (!selectedItem.value) return
  actionLoading.value = true
  dialogError.value = ''
  try {
    await usersApi.delete(selectedItem.value.id)
    deleteDialog.value = false
    await fetchUsers()
  }
  catch {
    dialogError.value = 'Impossible de supprimer l\'utilisateur.'
  }
  finally {
    actionLoading.value = false
  }
}

await fetchUsers()
</script>

<template>
  <UiPageSection max-width="1200">
    <template #header>
      <UiSectionHeader title="Gestion des utilisateurs" subtitle="Données chargées depuis /api/v1/user">
        <template #actions>
          <v-btn color="primary" prepend-icon="mdi-plus" class="mr-2" @click="openCreateDialog">Créer</v-btn>
          <v-btn color="primary" variant="outlined" prepend-icon="mdi-refresh" :loading="loading" @click="fetchUsers">Actualiser</v-btn>
        </template>
      </UiSectionHeader>
    </template>

    <v-text-field v-model="search" label="Rechercher" prepend-inner-icon="mdi-magnify" density="comfortable" hide-details class="mb-4" max-width="360" />
    <v-alert v-if="errorMessage" type="error" variant="tonal" class="mb-4">{{ errorMessage }}</v-alert>

    <UiDataTable :headers="headers" :items="tableItems" :loading="loading" :search="search" item-key="id" :items-per-page="10" empty-text="Aucun utilisateur trouvé.">
      <template #item.rolesLabel="{ item }"><span class="text-body-2">{{ item.rolesLabel || '—' }}</span></template>
      <template #item.actions="{ item }">
        <div class="d-flex flex-wrap ga-1 py-1">
          <v-btn size="x-small" variant="tonal" :loading="actionLoading" @click="openShowDialog(item.id)">Show</v-btn>
          <v-btn size="x-small" variant="tonal" color="info" @click="openEditDialog(item)">Edit</v-btn>
          <v-btn size="x-small" variant="tonal" color="warning" @click="openPatchDialog(item)">Patch</v-btn>
          <v-btn size="x-small" variant="tonal" color="error" @click="openDeleteDialog(item)">Delete</v-btn>
        </div>
      </template>

      <template #item.actions="{ item }">
        <div class="d-flex flex-wrap ga-1 py-1">
          <v-btn size="x-small" variant="tonal" @click="showEntity(item.id)">Show</v-btn>
          <v-btn size="x-small" variant="tonal" color="info" @click="updateEntity(item.id)">Edit</v-btn>
          <v-btn size="x-small" variant="tonal" color="warning" @click="patchEntity(item.id)">Patch</v-btn>
          <v-btn size="x-small" variant="tonal" color="error" @click="deleteEntity(item.id)">Delete</v-btn>
        </div>
      </template>
    </UiDataTable>

    <v-dialog v-model="createDialog" max-width="700"><v-card title="Créer un utilisateur"><v-card-text><v-alert v-if="dialogError" type="error" variant="tonal" class="mb-4">{{ dialogError }}</v-alert><v-text-field v-model="createForm.username" label="Username"/><v-text-field v-model="createForm.firstName" label="Prénom"/><v-text-field v-model="createForm.lastName" label="Nom"/><v-text-field v-model="createForm.email" label="Email"/><v-text-field v-model="createForm.timezone" label="Timezone"/><v-text-field v-model="createForm.roles" label="Rôles (IDs séparés par virgule)"/><v-text-field v-model="createForm.userGroups" label="Groupes (IDs séparés par virgule)"/></v-card-text><v-card-actions><v-spacer/><v-btn variant="text" @click="createDialog = false">Annuler</v-btn><v-btn color="primary" :loading="actionLoading" @click="submitCreate">Créer</v-btn></v-card-actions></v-card></v-dialog>

    <v-dialog v-model="showDialog" max-width="700"><v-card title="Détail utilisateur"><v-card-text><v-text-field :model-value="selectedItem?.id || ''" label="ID" readonly/><v-text-field :model-value="selectedItem?.username || ''" label="Username" readonly/><v-text-field :model-value="selectedItem?.firstName || ''" label="Prénom" readonly/><v-text-field :model-value="selectedItem?.lastName || ''" label="Nom" readonly/><v-text-field :model-value="selectedItem?.email || ''" label="Email" readonly/><v-text-field :model-value="selectedItem?.timezone || ''" label="Timezone" readonly/></v-card-text><v-card-actions><v-spacer/><v-btn color="primary" @click="showDialog = false">Fermer</v-btn></v-card-actions></v-card></v-dialog>

    <v-dialog v-model="editDialog" max-width="700"><v-card title="Modifier un utilisateur"><v-card-text><v-alert v-if="dialogError" type="error" variant="tonal" class="mb-4">{{ dialogError }}</v-alert><v-text-field v-model="editForm.username" label="Username"/><v-text-field v-model="editForm.firstName" label="Prénom"/><v-text-field v-model="editForm.lastName" label="Nom"/><v-text-field v-model="editForm.email" label="Email"/><v-text-field v-model="editForm.timezone" label="Timezone"/><v-text-field v-model="editForm.roles" label="Rôles (IDs séparés par virgule)"/><v-text-field v-model="editForm.userGroups" label="Groupes (IDs séparés par virgule)"/></v-card-text><v-card-actions><v-spacer/><v-btn variant="text" @click="editDialog = false">Annuler</v-btn><v-btn color="info" :loading="actionLoading" @click="submitEdit">Enregistrer</v-btn></v-card-actions></v-card></v-dialog>

    <v-dialog v-model="patchDialog" max-width="700"><v-card title="Patch utilisateur"><v-card-text><v-alert v-if="dialogError" type="error" variant="tonal" class="mb-4">{{ dialogError }}</v-alert><v-text-field v-model="patchForm.firstName" label="Prénom (optionnel)"/><v-text-field v-model="patchForm.lastName" label="Nom (optionnel)"/><v-text-field v-model="patchForm.email" label="Email (optionnel)"/><v-text-field v-model="patchForm.timezone" label="Timezone (optionnelle)"/></v-card-text><v-card-actions><v-spacer/><v-btn variant="text" @click="patchDialog = false">Annuler</v-btn><v-btn color="warning" :loading="actionLoading" @click="submitPatch">Appliquer</v-btn></v-card-actions></v-card></v-dialog>

    <v-dialog v-model="deleteDialog" max-width="500"><v-card title="Supprimer l'utilisateur"><v-card-text>Voulez-vous vraiment supprimer <strong>{{ selectedItem?.username }}</strong> ?<v-alert v-if="dialogError" type="error" variant="tonal" class="mt-4">{{ dialogError }}</v-alert></v-card-text><v-card-actions><v-spacer/><v-btn variant="text" @click="deleteDialog = false">Annuler</v-btn><v-btn color="error" :loading="actionLoading" @click="submitDelete">Supprimer</v-btn></v-card-actions></v-card></v-dialog>
  </UiPageSection>
</template>
