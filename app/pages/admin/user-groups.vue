<script setup lang="ts">
import UiDataTable from '~/components/ui/UiDataTable.vue'
import UiPageSection from '~/components/ui/UiPageSection.vue'
import UiSectionHeader from '~/components/ui/UiSectionHeader.vue'
import { useUserGroupsApi } from '~/composables/api/useUserGroupsApi'
import type { UserGroup } from '~/types/api/userGroup'

definePageMeta({
  middleware: ['role'],
  requiredPermissions: ['admin.access'],
})

const userGroupsApi = useUserGroupsApi()
const loading = ref(false)
const errorMessage = ref('')
const userGroups = ref<UserGroup[]>([])

const headers = [
  { title: 'ID', key: 'id', sortable: true },
  { title: 'Nom', key: 'name', sortable: true },
  { title: 'Rôle', key: 'roleId', sortable: true },
  { title: 'Description rôle', key: 'roleDescription', sortable: true },
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

await fetchUserGroups()
</script>

<template>
  <UiPageSection max-width="1100">
    <template #header>
      <UiSectionHeader
        title="Gestion des groupes utilisateurs"
        subtitle="Données chargées depuis /api/v1/user_group"
      >
        <template #actions>
          <v-btn
            color="primary"
            variant="outlined"
            prepend-icon="mdi-refresh"
            :loading="loading"
            @click="fetchUserGroups"
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
      :items="tableItems"
      :loading="loading"
      item-key="id"
      :items-per-page="10"
      empty-text="Aucun groupe utilisateur trouvé."
    />
  </UiPageSection>
</template>
