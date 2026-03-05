<script setup lang="ts">
import UiDataTable from '~/components/ui/UiDataTable.vue'
import UiPageSection from '~/components/ui/UiPageSection.vue'
import UiSectionHeader from '~/components/ui/UiSectionHeader.vue'
import type { UserRead } from '~/types/api/user'

definePageMeta({
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
]

const tableItems = computed(() => users.value.map(user => ({
  ...user,
  fullName: `${user.firstName} ${user.lastName}`.trim(),
  rolesLabel: user.roles.map(role => role.id).join(', '),
})))

const fetchUsers = async () => {
  loading.value = true
  errorMessage.value = ''

  try {
    const response = await usersApi.list({ limit: 200 })
    users.value = response.results
  }
  catch {
    errorMessage.value = 'Impossible de charger les utilisateurs depuis /api/v1/users.'
  }
  finally {
    loading.value = false
  }
}

await fetchUsers()
</script>

<template>
  <UiPageSection max-width="1200">
    <template #header>
      <UiSectionHeader
        title="Gestion des utilisateurs"
        subtitle="Données chargées depuis /api/v1/users"
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
    </UiDataTable>
  </UiPageSection>
</template>
