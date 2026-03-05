<script setup lang="ts">
import UiDataTable from '~/components/ui/UiDataTable.vue'
import UiPageSection from '~/components/ui/UiPageSection.vue'
import UiSectionHeader from '~/components/ui/UiSectionHeader.vue'
definePageMeta({
  middleware: ['role'],
  requiredPermissions: ['admin.access'],
})

const { t } = useI18n()

interface AdminUser {
  id: number
  name: string
  email: string
  role: 'Admin' | 'Editor' | 'Viewer'
  status: 'Actif' | 'En attente' | 'Suspendu'
}

const headers = [
  { title: 'Nom', key: 'name', sortable: true },
  { title: 'Email', key: 'email', sortable: true },
  { title: 'Rôle', key: 'role', sortable: true },
  { title: 'Statut', key: 'status', sortable: true },
  { title: 'Actions', key: 'actions', sortable: false, align: 'end' },
]

const users = ref<AdminUser[]>([
  { id: 1, name: 'Alice Martin', email: 'alice@bro.world', role: 'Admin', status: 'Actif' },
  { id: 2, name: 'Nora Dupuis', email: 'nora@bro.world', role: 'Editor', status: 'En attente' },
  { id: 3, name: 'Karim Benali', email: 'karim@bro.world', role: 'Viewer', status: 'Actif' },
  { id: 4, name: 'Sofia Leroy', email: 'sofia@bro.world', role: 'Editor', status: 'Suspendu' },
  { id: 5, name: 'Lucas Bernard', email: 'lucas@bro.world', role: 'Viewer', status: 'Actif' },
  { id: 6, name: 'Ines Petit', email: 'ines@bro.world', role: 'Admin', status: 'Actif' },
  { id: 7, name: 'Mehdi Robert', email: 'mehdi@bro.world', role: 'Editor', status: 'En attente' },
  { id: 8, name: 'Emma Moreau', email: 'emma@bro.world', role: 'Viewer', status: 'Suspendu' },
])

const search = ref('')
const forceEmptyState = ref(false)

const tableItems = computed(() => (forceEmptyState.value ? [] : users.value))

const roleColor = (role: AdminUser['role']) => {
  if (role === 'Admin') return 'primary'
  if (role === 'Editor') return 'info'
  return 'default'
}

const statusColor = (status: AdminUser['status']) => {
  if (status === 'Actif') return 'success'
  if (status === 'En attente') return 'warning'
  return 'error'
}
</script>

<template>
  <UiPageSection max-width="1200" card>
    <template #header>
      <UiSectionHeader
        :title="t('admin.title')"
        :subtitle="t('admin.description')"
      />
    </template>

    <div class="d-flex flex-wrap ga-4 mb-4">
      <v-text-field
        v-model="search"
        label="Rechercher un utilisateur"
        prepend-inner-icon="mdi-magnify"
        hide-details
        density="comfortable"
        max-width="360"
      />

      <v-switch
        v-model="forceEmptyState"
        hide-details
        label="Forcer l'état vide"
        color="primary"
      />
    </div>

    <UiDataTable
      :headers="headers"
      :items="tableItems"
      :search="search"
      item-key="id"
      :items-per-page="5"
      :items-per-page-options="[5, 10, 20]"
      empty-text="Aucun utilisateur à afficher."
    >
      <template #item.role="{ item }">
        <v-chip size="small" :color="roleColor(item.role)" variant="tonal">
          {{ item.role }}
        </v-chip>
      </template>

      <template #item.status="{ item }">
        <v-chip size="small" :color="statusColor(item.status)" variant="flat">
          {{ item.status }}
        </v-chip>
      </template>

      <template #item.actions="{ item }">
        <v-btn
          variant="text"
          size="small"
          color="primary"
          :aria-label="`Voir ${item.name}`"
          prepend-icon="mdi-open-in-new"
        >
          Voir
        </v-btn>
      </template>

      <template #empty>
        <v-alert type="info" variant="tonal" class="ma-4">
          Aucun résultat. Essayez une autre recherche ou désactivez l'état vide.
        </v-alert>
      </template>
    </UiDataTable>
  </UiPageSection>
</template>
