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
const errorMessage = ref('')
const roles = ref<Role[]>([])
const search = ref('')
const rolesCount = ref<number | null>(null)

const showDialog = ref(false)
const selectedRole = ref<Role | null>(null)
const selectedRoleInherited = ref<string[]>([])
const loadingRoleDetails = ref(false)

const headers = [
  { title: 'Identifiant', key: 'id', sortable: true },
  { title: 'Description', key: 'description', sortable: true },
  { title: 'Détails', key: 'actions', sortable: false },
]

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

await fetchRoles()
</script>

<template>
  <UiPageSection max-width="1000">
    <Teleport defer to="#app-bar-teleport-target">
      <div class="roles-page-appbar-tools">
        <v-text-field v-model="search" label="Rechercher" prepend-inner-icon="mdi-magnify" density="comfortable" variant="underlined" hide-details class="roles-page-appbar-tools__search" />
        <v-btn icon="mdi-refresh" color="primary" variant="outlined" :loading="loading" :aria-label="'Actualiser'" @click="fetchRoles" />
      </div>
    </Teleport>

    <template #header>
      <UiSectionHeader
        title="Gestion des rôles"
        :subtitle="`Données en lecture depuis /api/v1/role${rolesCount !== null ? ` • ${rolesCount} rôles` : ''}`"
      />
    </template>

    <v-card rounded="xl" elevation="2" class="pa-4">
      <v-alert v-if="errorMessage" type="error" variant="tonal" class="mb-4">{{ errorMessage }}</v-alert>

      <UiDataTable :headers="headers" :items="roles" :loading="loading" :search="search" item-key="id" :items-per-page="10" empty-text="Aucun rôle trouvé.">
        <template #item.description="{ item }">{{ item.description || '—' }}</template>
        <template #item.actions="{ item }">
          <div class="d-flex flex-nowrap ga-1 py-1">
            <v-btn size="x-small" variant="tonal" icon="mdi-eye" :loading="loadingRoleDetails" :aria-label="`Voir ${item.id}`" @click="showEntity(item.id)" />
          </div>
        </template>
      </UiDataTable>
    </v-card>

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
