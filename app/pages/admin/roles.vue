<script setup lang="ts">
import UiDataTable from '~/components/ui/UiDataTable.vue'
import UiPageSection from '~/components/ui/UiPageSection.vue'
import UiSectionHeader from '~/components/ui/UiSectionHeader.vue'
import { useRolesApi } from '~/composables/api/useRolesApi'
import type { Role } from '~/types/api/role'

definePageMeta({
  layout: 'admin',
  middleware: ['role'],
  requiredPermissions: ['admin.access'],
})

const rolesApi = useRolesApi()
const loading = ref(false)
const submitting = ref(false)
const errorMessage = ref('')
const roles = ref<Role[]>([])

const formDialog = ref(false)
const showDialog = ref(false)
const formMode = ref<'create' | 'edit' | 'patch'>('create')
const selectedRole = ref<Role | null>(null)
const form = reactive({ id: '', description: '' })

const headers = [
  { title: 'Identifiant', key: 'id', sortable: true },
  { title: 'Description', key: 'description', sortable: true },
  { title: 'Actions', key: 'actions', sortable: false },
]

const formTitle = computed(() => (formMode.value === 'create' ? 'Créer un rôle' : formMode.value === 'edit' ? 'Éditer un rôle' : 'Patch rôle'))

const fetchRoles = async () => {
  loading.value = true
  errorMessage.value = ''

  try {
    const response = await rolesApi.list({ limit: 200 })
    roles.value = Array.isArray(response) ? response : (response.results ?? [])
  }
  catch {
    errorMessage.value = 'Impossible de charger les rôles depuis /api/v1/role.'
  }
  finally {
    loading.value = false
  }
}

const showEntity = async (id: string) => {
  selectedRole.value = await rolesApi.getById(id)
  showDialog.value = true
}

const openCreateDialog = () => {
  formMode.value = 'create'
  Object.assign(form, { id: '', description: '' })
  formDialog.value = true
}

const openEditDialog = (role: Role, patch = false) => {
  selectedRole.value = role
  formMode.value = patch ? 'patch' : 'edit'
  Object.assign(form, { id: role.id, description: role.description ?? '' })
  formDialog.value = true
}

const submitForm = async () => {
  submitting.value = true
  try {
    if (formMode.value === 'create') {
      await rolesApi.create({ id: form.id, description: form.description || undefined })
    }
    else if (formMode.value === 'edit' && selectedRole.value) {
      await rolesApi.update(selectedRole.value.id, { id: form.id, description: form.description || undefined })
    }
    else if (formMode.value === 'patch' && selectedRole.value) {
      await rolesApi.patch(selectedRole.value.id, { id: form.id, description: form.description || undefined })
    }

    formDialog.value = false
    await fetchRoles()
  }
  finally {
    submitting.value = false
  }
}

const deleteEntity = async (id: string) => {
  if (!window.confirm(`Supprimer le rôle ${id} ?`)) {
    return
  }

  await rolesApi.delete(id)
  await fetchRoles()
}

await fetchRoles()
</script>

<template>
  <UiPageSection max-width="1000">
    <template #header>
      <UiSectionHeader
        title="Gestion des rôles"
        subtitle="Données chargées depuis /api/v1/role"
      >
        <template #actions>
          <v-btn color="primary" prepend-icon="mdi-plus" class="mr-2" @click="openCreateDialog">Créer</v-btn>
          <v-btn
            color="primary"
            variant="outlined"
            prepend-icon="mdi-refresh"
            :loading="loading"
            @click="fetchRoles"
          >
            Actualiser
          </v-btn>
        </template>
      </UiSectionHeader>
    </template>

    <v-card rounded="xl" elevation="2" class="pa-4">
      <v-alert v-if="errorMessage" type="error" variant="tonal" class="mb-4">
        {{ errorMessage }}
      </v-alert>

      <UiDataTable
        :headers="headers"
        :items="roles"
        :loading="loading"
        item-key="id"
        :items-per-page="10"
        empty-text="Aucun rôle trouvé."
      >
        <template #item.description="{ item }">
          {{ item.description || '—' }}
        </template>

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
          <v-text-field v-model="form.id" label="ID rôle" :disabled="formMode === 'patch'" class="mb-2" />
          <v-text-field v-model="form.description" label="Description" />
        </v-card-text>
        <v-card-actions class="justify-end">
          <v-btn variant="text" @click="formDialog = false">Annuler</v-btn>
          <v-btn color="primary" :loading="submitting" @click="submitForm">Enregistrer</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="showDialog" max-width="700">
      <v-card rounded="xl">
        <v-card-title>Détails rôle</v-card-title>
        <v-card-text>
          <pre class="text-body-2" style="white-space: pre-wrap;">{{ JSON.stringify(selectedRole, null, 2) }}</pre>
        </v-card-text>
      </v-card>
    </v-dialog>
  </UiPageSection>
</template>
