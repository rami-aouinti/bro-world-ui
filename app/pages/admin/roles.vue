<script setup lang="ts">
import UiDataTable from '~/components/ui/UiDataTable.vue'
import UiPageSection from '~/components/ui/UiPageSection.vue'
import UiSectionHeader from '~/components/ui/UiSectionHeader.vue'
import { useRolesApi } from '~/composables/api/useRolesApi'
import type { Role } from '~/types/api/role'

definePageMeta({
  middleware: ['role'],
  requiredPermissions: ['admin.access'],
})

const rolesApi = useRolesApi()
const loading = ref(false)
const errorMessage = ref('')
const roles = ref<Role[]>([])

const headers = [
  { title: 'Identifiant', key: 'id', sortable: true },
  { title: 'Description', key: 'description', sortable: true },
]

const fetchRoles = async () => {
  loading.value = true
  errorMessage.value = ''

  try {
    const response = await rolesApi.list({ limit: 200 })
    roles.value = response.results
  }
  catch {
    errorMessage.value = 'Impossible de charger les rôles depuis /api/v1/roles.'
  }
  finally {
    loading.value = false
  }
}

await fetchRoles()
</script>

<template>
  <UiPageSection max-width="1000">
    <template #header>
      <UiSectionHeader
        title="Gestion des rôles"
        subtitle="Données chargées depuis /api/v1/roles"
      >
        <template #actions>
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
      :items="roles"
      :loading="loading"
      item-key="id"
      :items-per-page="10"
      empty-text="Aucun rôle trouvé."
    >
      <template #item.description="{ item }">
        {{ item.description || '—' }}
      </template>
    </UiDataTable>
  </UiPageSection>
</template>
