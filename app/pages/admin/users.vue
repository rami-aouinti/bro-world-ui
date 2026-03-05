<script setup lang="ts">
import UiDataTable from '~/components/ui/UiDataTable.vue'
import UiPageSection from '~/components/ui/UiPageSection.vue'
import UiSectionHeader from '~/components/ui/UiSectionHeader.vue'
import { useUsersApi } from '~/composables/api/useUsersApi'
import type { UserRead } from '~/types/api/user'

definePageMeta({
  layout: 'admin',
  middleware: ['role'],
  requiredPermissions: ['admin.access'],
})

const usersApi = useUsersApi()
const loading = ref(false)
const errorMessage = ref('')
const users = ref<UserRead[]>([])
const search = ref('')

const headers = [
  { title: 'Username', key: 'username', sortable: true },
  { title: 'Nom', key: 'fullName', sortable: true },
  { title: 'Email', key: 'email', sortable: true },
  { title: 'Timezone', key: 'timezone', sortable: true },
  { title: 'Rôles', key: 'rolesLabel', sortable: false },
  { title: 'Actions', key: 'actions', sortable: false },
]

const tableItems = computed(() => users.value.map(user => ({
  ...user,
  fullName: `${user.firstName} ${user.lastName}`.trim(),
  rolesLabel: Array.isArray(user.roles) ? user.roles.map(role => role.id).join(', ') : '',
})))

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

const showEntity = async (id: string) => {
  const entity = await usersApi.getById(id)
  window.alert(JSON.stringify(entity, null, 2))
}

const updateEntity = async (id: string) => {
  const payloadRaw = window.prompt('Payload JSON pour PUT (edit):', '{\n  "username": "",\n  "firstName": "",\n  "lastName": "",\n  "email": "",\n  "timezone": "Europe/Paris",\n  "roles": [],\n  "userGroups": []\n}')

  if (!payloadRaw) {
    return
  }

  await usersApi.update(id, JSON.parse(payloadRaw))
  await fetchUsers()
}

const patchEntity = async (id: string) => {
  const payloadRaw = window.prompt('Payload JSON pour PATCH:', '{\n  "email": ""\n}')

  if (!payloadRaw) {
    return
  }

  await usersApi.patch(id, JSON.parse(payloadRaw))
  await fetchUsers()
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

    <v-text-field
      v-model="search"
      label="Rechercher"
      prepend-inner-icon="mdi-magnify"
      density="comfortable"
      hide-details
      class="mb-4"
      max-width="360"
    />

    <v-alert
      v-if="errorMessage"
      type="error"
      variant="tonal"
      class="mb-4"
    >
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
      <template #item.rolesLabel="{ item }">
        <span class="text-body-2">{{ item.rolesLabel || '—' }}</span>
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
  </UiPageSection>
</template>
