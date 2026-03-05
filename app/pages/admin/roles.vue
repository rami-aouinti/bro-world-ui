<script setup lang="ts">
import UiDataTable from '~/components/ui/UiDataTable.vue'
import UiPageSection from '~/components/ui/UiPageSection.vue'
import UiSectionHeader from '~/components/ui/UiSectionHeader.vue'
import { useRolesApi } from '~/composables/api/useRolesApi'
import type { Role } from '~/types/api/role'

definePageMeta({ middleware: ['role'], requiredPermissions: ['admin.access'] })

const rolesApi = useRolesApi()
const loading = ref(false)
const actionLoading = ref(false)
const errorMessage = ref('')
const roles = ref<Role[]>([])
const showDialog = ref(false)
const selectedItem = ref<Role | null>(null)

const headers = [
  { title: 'Identifiant', key: 'id', sortable: true },
  { title: 'Description', key: 'description', sortable: true },
  { title: 'Actions', key: 'actions', sortable: false },
]

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

const openShowDialog = async (id: string) => {
  actionLoading.value = true
  try {
    selectedItem.value = await rolesApi.getById(id)
    showDialog.value = true
  }
  catch {
    errorMessage.value = 'Impossible de charger le détail du rôle.'
  }
  finally {
    actionLoading.value = false
  }
}

await fetchRoles()
</script>

<template>
  <UiPageSection max-width="1000">
    <template #header>
      <UiSectionHeader title="Gestion des rôles" subtitle="Données chargées depuis /api/v1/role">
        <template #actions>
          <v-btn color="primary" variant="outlined" prepend-icon="mdi-refresh" :loading="loading" @click="fetchRoles">Actualiser</v-btn>
        </template>
      </UiSectionHeader>
    </template>

    <v-alert v-if="errorMessage" type="error" variant="tonal" class="mb-4">{{ errorMessage }}</v-alert>

    <UiDataTable :headers="headers" :items="roles" :loading="loading" item-key="id" :items-per-page="10" empty-text="Aucun rôle trouvé.">
      <template #item.description="{ item }">{{ item.description || '—' }}</template>
      <template #item.actions="{ item }">
        <v-btn size="x-small" variant="tonal" :loading="actionLoading" @click="openShowDialog(item.id)">Show</v-btn>
      </template>

      <template #item.actions="{ item }">
        <v-btn size="x-small" variant="tonal" @click="showEntity(item.id)">
          Show
        </v-btn>
      </template>
    </UiDataTable>

    <v-dialog v-model="showDialog" max-width="600">
      <v-card title="Détail rôle">
        <v-card-text>
          <v-text-field :model-value="selectedItem?.id || ''" label="ID" readonly />
          <v-text-field :model-value="selectedItem?.description || ''" label="Description" readonly />
        </v-card-text>
        <v-card-actions><v-spacer /><v-btn color="primary" @click="showDialog = false">Fermer</v-btn></v-card-actions>
      </v-card>
    </v-dialog>
  </UiPageSection>
</template>
