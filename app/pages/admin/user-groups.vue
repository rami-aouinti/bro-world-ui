<script setup lang="ts">
import UiDataTable from '~/components/ui/UiDataTable.vue'
import UiPageSection from '~/components/ui/UiPageSection.vue'
import UiSectionHeader from '~/components/ui/UiSectionHeader.vue'
import { useUserGroupsApi } from '~/composables/api/useUserGroupsApi'
import type { UserGroup } from '~/types/api/userGroup'

definePageMeta({ middleware: ['role'], requiredPermissions: ['admin.access'] })

const userGroupsApi = useUserGroupsApi()
const loading = ref(false)
const actionLoading = ref(false)
const errorMessage = ref('')
const dialogError = ref('')
const userGroups = ref<UserGroup[]>([])

const createDialog = ref(false)
const showDialog = ref(false)
const editDialog = ref(false)
const patchDialog = ref(false)
const deleteDialog = ref(false)

const selectedItem = ref<UserGroup | null>(null)
const createForm = ref({ name: '', role: '' })
const editForm = ref({ name: '', role: '' })
const patchForm = ref({ name: '', role: '' })

const headers = [
  { title: 'ID', key: 'id', sortable: true },
  { title: 'Nom', key: 'name', sortable: true },
  { title: 'Rôle', key: 'roleId', sortable: true },
  { title: 'Description rôle', key: 'roleDescription', sortable: true },
  { title: 'Actions', key: 'actions', sortable: false },
]

const tableItems = computed(() => userGroups.value.map(group => ({
  ...group,
  roleId: group.role?.id || '',
  roleDescription: group.role?.description || '',
})))

const fetchUserGroups = async () => {
  loading.value = true
  errorMessage.value = ''
  try {
    const response = await userGroupsApi.list({ limit: 200 })
    userGroups.value = Array.isArray(response) ? response : (response.results ?? [])
  }
  catch {
    errorMessage.value = 'Impossible de charger les groupes depuis /api/v1/user_group.'
  }
  finally {
    loading.value = false
  }
}

const openCreateDialog = () => {
  createForm.value = { name: '', role: '' }
  dialogError.value = ''
  createDialog.value = true
}

const openShowDialog = async (id: string) => {
  dialogError.value = ''
  actionLoading.value = true
  try {
    selectedItem.value = await userGroupsApi.getById(id)
    showDialog.value = true
  }
  catch {
    dialogError.value = 'Impossible de charger le détail du groupe.'
  }
  finally {
    actionLoading.value = false
  }
}

const openEditDialog = (item: UserGroup) => {
  selectedItem.value = item
  editForm.value = { name: item.name, role: item.role?.id || '' }
  dialogError.value = ''
  editDialog.value = true
}

const openPatchDialog = (item: UserGroup) => {
  selectedItem.value = item
  patchForm.value = { name: item.name, role: item.role?.id || '' }
  dialogError.value = ''
  patchDialog.value = true
}

const openDeleteDialog = (item: UserGroup) => {
  selectedItem.value = item
  dialogError.value = ''
  deleteDialog.value = true
}

const submitCreate = async () => {
  actionLoading.value = true
  dialogError.value = ''
  try {
    await userGroupsApi.create(createForm.value)
    createDialog.value = false
    await fetchUserGroups()
  }
  catch {
    dialogError.value = 'Impossible de créer le groupe.'
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
    await userGroupsApi.update(selectedItem.value.id, editForm.value)
    editDialog.value = false
    await fetchUserGroups()
  }
  catch {
    dialogError.value = 'Impossible de modifier le groupe.'
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
    await userGroupsApi.patch(selectedItem.value.id, {
      ...(patchForm.value.name.trim() ? { name: patchForm.value.name } : {}),
      ...(patchForm.value.role.trim() ? { role: patchForm.value.role } : {}),
    })
    patchDialog.value = false
    await fetchUserGroups()
  }
  catch {
    dialogError.value = 'Impossible de patcher le groupe.'
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
    await userGroupsApi.delete(selectedItem.value.id)
    deleteDialog.value = false
    await fetchUserGroups()
  }
  catch {
    dialogError.value = 'Impossible de supprimer le groupe.'
  }
  finally {
    actionLoading.value = false
  }
}

await fetchUserGroups()
</script>

<template>
  <UiPageSection max-width="1100">
    <template #header>
      <UiSectionHeader title="Gestion des groupes utilisateurs" subtitle="Données chargées depuis /api/v1/user_group">
        <template #actions>
          <v-btn color="primary" prepend-icon="mdi-plus" class="mr-2" @click="openCreateDialog">Créer</v-btn>
          <v-btn color="primary" variant="outlined" prepend-icon="mdi-refresh" :loading="loading" @click="fetchUserGroups">Actualiser</v-btn>
        </template>
      </UiSectionHeader>
    </template>

    <v-alert v-if="errorMessage" type="error" variant="tonal" class="mb-4">{{ errorMessage }}</v-alert>

    <UiDataTable :headers="headers" :items="tableItems" :loading="loading" item-key="id" :items-per-page="10" empty-text="Aucun groupe utilisateur trouvé.">
      <template #item.actions="{ item }">
        <div class="d-flex flex-wrap ga-1 py-1">
          <v-btn size="x-small" variant="tonal" :loading="actionLoading" @click="openShowDialog(item.id)">Show</v-btn>
          <v-btn size="x-small" variant="tonal" color="info" @click="openEditDialog(item)">Edit</v-btn>
          <v-btn size="x-small" variant="tonal" color="warning" @click="openPatchDialog(item)">Patch</v-btn>
          <v-btn size="x-small" variant="tonal" color="error" @click="openDeleteDialog(item)">Delete</v-btn>
        </div>
      </template>
    </UiDataTable>

    <v-dialog v-model="createDialog" max-width="600"><v-card title="Créer un groupe"><v-card-text><v-alert v-if="dialogError" type="error" variant="tonal" class="mb-4">{{ dialogError }}</v-alert><v-text-field v-model="createForm.name" label="Nom"/><v-text-field v-model="createForm.role" label="Rôle (ID)"/></v-card-text><v-card-actions><v-spacer/><v-btn variant="text" @click="createDialog = false">Annuler</v-btn><v-btn color="primary" :loading="actionLoading" @click="submitCreate">Créer</v-btn></v-card-actions></v-card></v-dialog>

    <v-dialog v-model="showDialog" max-width="600"><v-card title="Détail groupe"><v-card-text><v-text-field :model-value="selectedItem?.id || ''" label="ID" readonly/><v-text-field :model-value="selectedItem?.name || ''" label="Nom" readonly/><v-text-field :model-value="selectedItem?.role?.id || ''" label="Rôle" readonly/><v-text-field :model-value="selectedItem?.role?.description || ''" label="Description rôle" readonly/></v-card-text><v-card-actions><v-spacer/><v-btn color="primary" @click="showDialog = false">Fermer</v-btn></v-card-actions></v-card></v-dialog>

    <v-dialog v-model="editDialog" max-width="600"><v-card title="Modifier un groupe"><v-card-text><v-alert v-if="dialogError" type="error" variant="tonal" class="mb-4">{{ dialogError }}</v-alert><v-text-field v-model="editForm.name" label="Nom"/><v-text-field v-model="editForm.role" label="Rôle (ID)"/></v-card-text><v-card-actions><v-spacer/><v-btn variant="text" @click="editDialog = false">Annuler</v-btn><v-btn color="info" :loading="actionLoading" @click="submitEdit">Enregistrer</v-btn></v-card-actions></v-card></v-dialog>

    <v-dialog v-model="patchDialog" max-width="600"><v-card title="Patch groupe"><v-card-text><v-alert v-if="dialogError" type="error" variant="tonal" class="mb-4">{{ dialogError }}</v-alert><v-text-field v-model="patchForm.name" label="Nom (optionnel)"/><v-text-field v-model="patchForm.role" label="Rôle (ID optionnel)"/></v-card-text><v-card-actions><v-spacer/><v-btn variant="text" @click="patchDialog = false">Annuler</v-btn><v-btn color="warning" :loading="actionLoading" @click="submitPatch">Appliquer</v-btn></v-card-actions></v-card></v-dialog>

    <v-dialog v-model="deleteDialog" max-width="500"><v-card title="Supprimer le groupe"><v-card-text>Voulez-vous vraiment supprimer <strong>{{ selectedItem?.name }}</strong> ?<v-alert v-if="dialogError" type="error" variant="tonal" class="mt-4">{{ dialogError }}</v-alert></v-card-text><v-card-actions><v-spacer/><v-btn variant="text" @click="deleteDialog = false">Annuler</v-btn><v-btn color="error" :loading="actionLoading" @click="submitDelete">Supprimer</v-btn></v-card-actions></v-card></v-dialog>
  </UiPageSection>
</template>
