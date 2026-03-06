<script setup lang="ts">
import UiDataTable from '~/components/ui/UiDataTable.vue'
import UiPageSection from '~/components/ui/UiPageSection.vue'
import UiSectionHeader from '~/components/ui/UiSectionHeader.vue'
import { useRolesStore } from '~/stores/roles'
import type { Role } from '~/types/api/role'

definePageMeta({
  layout: 'admin',
  middleware: ['role'],
  requiredPermissions: ['admin.access'],
})

const rolesStore = useRolesStore()
const loading = ref(false)
const submitting = ref(false)
const errorMessage = ref('')
const roles = ref<Role[]>([])
const search = ref('')
const rolesCount = ref<number | null>(null)

const showDialog = ref(false)
const formDialog = ref(false)
const selectedRole = ref<Role | null>(null)
const selectedRoleInherited = ref<string[]>([])
const loadingRoleDetails = ref(false)
const formMode = ref<'create' | 'edit' | 'patch'>('create')
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
    roles.value = await rolesStore.fetchAll()
    rolesCount.value = rolesStore.count
  }
  catch {
    errorMessage.value = 'Impossible de charger les rôles depuis /api/v1/role.'
  }
  finally {
    loading.value = false
  }
}

const showEntity = async (id: string) => {
  loadingRoleDetails.value = true

  try {
    const [role, inherited] = await Promise.all([
      rolesStore.getById(id),
      rolesStore.inherited(id),
    ])

    selectedRole.value = role
    selectedRoleInherited.value = inherited
    showDialog.value = true
  }
  catch {
    errorMessage.value = `Impossible de charger les détails du rôle ${id}.`
  }
  finally {
    loadingRoleDetails.value = false
  }
}

const openCreateDialog = () => {
  formMode.value = 'create'
  Object.assign(form, { id: '', description: '' })
  formDialog.value = true
}

const openEditDialog = (item: Role, patch = false) => {
  selectedRole.value = item
  formMode.value = patch ? 'patch' : 'edit'
  Object.assign(form, { id: item.id, description: item.description ?? '' })
  formDialog.value = true
}

const submitForm = async () => {
  submitting.value = true
  try {
    if (formMode.value === 'create') {
      await rolesStore.create({ id: form.id, description: form.description || undefined })
    }
    else if (formMode.value === 'edit' && selectedRole.value) {
      await rolesStore.update(selectedRole.value.id, { id: form.id, description: form.description || undefined })
    }
    else if (formMode.value === 'patch' && selectedRole.value) {
      await rolesStore.patch(selectedRole.value.id, { description: form.description || undefined })
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

  await rolesStore.remove(id)
  await fetchRoles()
}

await fetchRoles()
</script>

<template>
  <UiPageSection>
    <Teleport defer to="#app-bar-teleport-target">
      <div class="roles-page-appbar-tools">
        <v-text-field v-model="search" label="Rechercher" prepend-inner-icon="mdi-magnify" density="comfortable" variant="underlined" hide-details class="roles-page-appbar-tools__search" />
        <v-btn icon="mdi-plus" color="primary" :aria-label="'Créer'" @click="openCreateDialog" />
        <v-btn icon="mdi-refresh" color="primary" variant="outlined" :loading="loading" :aria-label="'Actualiser'" @click="fetchRoles" />
      </div>
    </Teleport>

    <v-card rounded="xl" elevation="2" class="pa-4">
      <v-alert v-if="errorMessage" type="error" variant="tonal" class="mb-4">{{ errorMessage }}</v-alert>

      <UiDataTable :headers="headers" :items="roles" :loading="loading" :search="search" item-key="id" :items-per-page="10" empty-text="Aucun rôle trouvé.">
        <template #item.description="{ item }">{{ item.description || '—' }}</template>
        <template #item.actions="{ item }">
          <div class="d-flex flex-nowrap ga-1 py-1">
            <v-btn size="x-small" variant="tonal" icon="mdi-eye" :loading="loadingRoleDetails" :aria-label="`Voir ${item.id}`" @click="showEntity(item.id)" />
            <v-btn size="x-small" variant="tonal" color="primary" icon="mdi-pencil" :aria-label="`Edit ${item.id}`" @click="openEditDialog(item)" />
            <v-btn size="x-small" variant="tonal" color="warning" icon="mdi-file-edit-outline" :aria-label="`Patch ${item.id}`" @click="openEditDialog(item, true)" />
            <v-btn size="x-small" variant="tonal" color="error" icon="mdi-delete" :aria-label="`Delete ${item.id}`" @click="deleteEntity(item.id)" />
          </div>
        </template>
      </UiDataTable>
    </v-card>

    <v-dialog v-model="formDialog" max-width="560" persistent>
      <v-card rounded="xl">
        <v-card-title>{{ formTitle }}</v-card-title>
        <v-card-text>
          <v-text-field v-model="form.id" label="Identifiant" :disabled="formMode !== 'create'" class="mb-2" />
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
          <pre class="text-body-2 mb-4" style="white-space: pre-wrap;">{{ JSON.stringify(selectedRole, null, 2) }}</pre>
          <div class="text-subtitle-2 mb-2">Rôles hérités</div>
          <div class="d-flex flex-wrap ga-2">
            <v-chip v-for="role in selectedRoleInherited" :key="role" size="small">{{ role }}</v-chip>
            <span v-if="!selectedRoleInherited.length" class="text-body-2">Aucun rôle hérité.</span>
          </div>
        </v-card-text>
      </v-card>
    </v-dialog>
  </UiPageSection>
</template>

<style scoped>
.roles-page-appbar-tools {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  margin-inline-start: 8px;
}

.roles-page-appbar-tools__search {
  min-width: 200px;
  max-width: 280px;
}
</style>
