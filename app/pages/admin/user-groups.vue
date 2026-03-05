<script setup lang="ts">
import UiDataTable from '~/components/ui/UiDataTable.vue'
import UiPageSection from '~/components/ui/UiPageSection.vue'
import UiSectionHeader from '~/components/ui/UiSectionHeader.vue'
import { useUserGroupsApi } from '~/composables/api/useUserGroupsApi'
import type { UserGroup } from '~/types/api/userGroup'

definePageMeta({
  layout: 'admin',
  middleware: ['role'],
  requiredPermissions: ['admin.access'],
})

const userGroupsApi = useUserGroupsApi()
const loading = ref(false)
const submitting = ref(false)
const errorMessage = ref('')
const userGroups = ref<UserGroup[]>([])
const search = ref('')

const formDialog = ref(false)
const showDialog = ref(false)
const formMode = ref<'create' | 'edit' | 'patch'>('create')
const selectedGroup = ref<UserGroup | null>(null)
const form = reactive({ name: '', role: '' })

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

const formTitle = computed(() => (formMode.value === 'create' ? 'Créer un groupe' : formMode.value === 'edit' ? 'Éditer un groupe' : 'Patch groupe'))

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
  formMode.value = 'create'
  Object.assign(form, { name: '', role: '' })
  formDialog.value = true
}

const openEditDialog = (group: UserGroup, patch = false) => {
  formMode.value = patch ? 'patch' : 'edit'
  selectedGroup.value = group
  Object.assign(form, { name: group.name, role: group.role?.id ?? '' })
  formDialog.value = true
}

const showEntity = async (id: string) => {
  selectedGroup.value = await userGroupsApi.getById(id)
  showDialog.value = true
}

const submitForm = async () => {
  submitting.value = true
  try {
    if (formMode.value === 'create') {
      await userGroupsApi.create({ name: form.name, role: form.role })
    }
    else if (formMode.value === 'edit' && selectedGroup.value) {
      await userGroupsApi.update(selectedGroup.value.id, { name: form.name, role: form.role })
    }
    else if (formMode.value === 'patch' && selectedGroup.value) {
      await userGroupsApi.patch(selectedGroup.value.id, { name: form.name, role: form.role })
    }

    formDialog.value = false
    await fetchUserGroups()
  }
  finally {
    submitting.value = false
  }
}

const deleteEntity = async (id: string) => {
  if (!window.confirm(`Supprimer le groupe ${id} ?`)) {
    return
  }

  await userGroupsApi.delete(id)
  await fetchUserGroups()
}

await fetchUserGroups()
</script>

<template>
  <UiPageSection max-width="1100">
    <Teleport
      defer
      to="#app-bar-teleport-target"
    >
      <div class="user-groups-page-appbar-tools">
        <v-text-field
          v-model="search"
          label="Rechercher"
          prepend-inner-icon="mdi-magnify"
          density="comfortable"
          variant="underlined"
          hide-details
          class="user-groups-page-appbar-tools__search"
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
          @click="fetchUserGroups"
        />
      </div>
    </Teleport>

    <template #header>
      <UiSectionHeader
        title="Gestion des groupes utilisateurs"
        subtitle="Données chargées depuis /api/v1/user_group"
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
        empty-text="Aucun groupe utilisateur trouvé."
      >
        <template #item.actions="{ item }">
          <div class="d-flex flex-wrap ga-1 py-1">
            <v-btn size="small" variant="tonal" rounded="pill" @click="showEntity(item.id)">Show</v-btn>
            <v-btn size="small" variant="tonal" rounded="pill" color="info" @click="openEditDialog(item)">Edit</v-btn>
            <v-btn size="small" variant="tonal" rounded="pill" color="warning" @click="openEditDialog(item, true)">Patch</v-btn>
            <v-btn size="small" variant="tonal" rounded="pill" color="error" @click="deleteEntity(item.id)">Delete</v-btn>
          </div>
        </template>
      </UiDataTable>
    </v-card>

    <v-dialog v-model="formDialog" max-width="560" persistent>
      <v-card rounded="xl">
        <v-card-title>{{ formTitle }}</v-card-title>
        <v-card-text>
          <v-text-field v-model="form.name" label="Nom du groupe" class="mb-2" />
          <v-text-field v-model="form.role" label="ID du rôle" />
        </v-card-text>
        <v-card-actions class="justify-end">
          <v-btn variant="text" @click="formDialog = false">Annuler</v-btn>
          <v-btn color="primary" :loading="submitting" @click="submitForm">Enregistrer</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="showDialog" max-width="700">
      <v-card rounded="xl">
        <v-card-title>Détails groupe</v-card-title>
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
