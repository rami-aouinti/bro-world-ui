<script setup lang="ts">
import UiDataTable from '~/components/ui/UiDataTable.vue'
import UiPageSection from '~/components/ui/UiPageSection.vue'
import UiSectionHeader from '~/components/ui/UiSectionHeader.vue'
import { useUserGroupsStore } from '~/stores/userGroups'
import type { UserGroup } from '~/types/api/userGroup'

definePageMeta({
  layout: 'admin',
  middleware: ['role'],
  requiredPermissions: ['admin.access'],
})

const userGroupsStore = useUserGroupsStore()
const loading = ref(false)
const errorMessage = ref('')
const userGroups = ref<UserGroup[]>([])
const search = ref('')

const showDialog = ref(false)
const selectedGroup = ref<UserGroup | null>(null)

const headers = [
  { title: 'ID', key: 'id', sortable: true },
  { title: 'Nom', key: 'name', sortable: true },
  { title: 'Détails', key: 'actions', sortable: false },
]

const fetchUserGroups = async () => {
  loading.value = true
  errorMessage.value = ''

  try {
    userGroups.value = await userGroupsStore.fetchAll()
  }
  catch {
    errorMessage.value = 'Impossible de charger les groupes depuis /api/v1/user_group.'
  }
  finally {
    loading.value = false
  }
}

const showEntity = async (id: string) => {
  selectedGroup.value = await userGroupsStore.getById(id)
  showDialog.value = true
}

await fetchUserGroups()
</script>

<template>
  <UiPageSection>
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
          icon="mdi-refresh"
          color="primary"
          variant="outlined"
          :loading="loading"
          :aria-label="'Actualiser'"
          @click="fetchUserGroups"
        />
      </div>
    </Teleport>

    <v-card rounded="xl" elevation="2" class="pa-4">
      <v-alert v-if="errorMessage" type="error" variant="tonal" class="mb-4">
        {{ errorMessage }}
      </v-alert>

      <UiDataTable
        :headers="headers"
        :items="userGroups"
        :loading="loading"
        :search="search"
        item-key="id"
        :items-per-page="10"
        empty-text="Aucun groupe utilisateur trouvé."
      >
        <template #item.actions="{ item }">
          <div class="d-flex flex-nowrap ga-1 py-1">
            <v-btn size="x-small" variant="tonal" icon="mdi-eye" :aria-label="`Show ${item.id}`" @click="showEntity(item.id)" />
          </div>
        </template>
      </UiDataTable>
    </v-card>

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
