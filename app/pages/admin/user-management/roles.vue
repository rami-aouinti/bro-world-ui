<script setup lang="ts">
import UiDataTable from '~/components/ui/UiDataTable.vue'
import UiSectionHeader from '~/components/ui/UiSectionHeader.vue'
import UiTableToolbar from '~/components/ui/UiTableToolbar.vue'
import { useRolesStore } from '~/stores/roles'
import type { Role } from '~/types/api/role'

definePageMeta({
  layout: 'admin',
  middleware: ['role'],
  requiredPermissions: ['admin.access'],
  skeleton: 'data-table',
})

const rolesStore = useRolesStore()
const { t } = useI18n()
const loading = computed(() => rolesStore.isLoading)
const errorMessage = ref('')
const roles = ref<Role[]>([])
const search = ref('')
const rolesCount = ref<number | null>(null)

const showDialog = ref(false)
const selectedRole = ref<Role | null>(null)
const selectedRoleInherited = ref<string[]>([])
const loadingRoleDetails = ref(false)

const headers = computed(() => [
  { title: t('admin.roles.headers.id'), key: 'id', sortable: true },
  { title: t('admin.roles.headers.description'), key: 'description', sortable: true },
  { title: t('admin.roles.headers.actions'), key: 'actions', sortable: false },
])

const fetchRoles = async () => {
  errorMessage.value = ''

  try {
    roles.value = await rolesStore.fetchAll()
    rolesCount.value = rolesStore.count
  }
  catch {
    errorMessage.value = t('admin.roles.errors.load')
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
    errorMessage.value = t('admin.roles.errors.loadDetails', { id })
  }
  finally {
    loadingRoleDetails.value = false
  }
}

onMounted(async () => {
  await fetchRoles()
})
</script>

<template>
  <div class="admin-page-content">
      <UiSectionHeader
      >
        <template #actions>
          <UiTableToolbar
            :search="search"
            :search-label="t('admin.common.search')"
            :refresh-label="t('admin.common.refresh')"
            :loading="loading"
            :show-create="false"
            @update:search="search = $event"
            @refresh="fetchRoles"
          />
        </template>
      </UiSectionHeader>
    <v-alert v-if="errorMessage" type="error" variant="tonal" class="mb-4">{{ errorMessage }}</v-alert>

    <UiDataTable :headers="headers" :items="roles" :loading="loading" :search="search" item-key="id" :items-per-page="10" :empty-text="t('admin.roles.empty')">
      <template #item.description="{ item }">{{ item.description || '—' }}</template>
      <template #item.actions="{ item }">
        <div class="d-flex justify-end flex-nowrap ga-1 py-1">
          <v-btn size="x-small" variant="text" color="success" icon="mdi-eye" :loading="loadingRoleDetails" :aria-label="`Voir ${item.id}`" @click="showEntity(item.id)" />
        </div>
      </template>
    </UiDataTable>

    <v-dialog retain-focus v-model="showDialog" max-width="700">
      <v-card rounded="xl">
        <v-card-title>{{ t('admin.roles.dialogs.details') }}</v-card-title>
        <v-card-text>
          <pre class="text-body-2 mb-4" style="white-space: pre-wrap;">{{ JSON.stringify(selectedRole, null, 2) }}</pre>
          <div class="text-subtitle-2 mb-2">{{ t('admin.roles.dialogs.inheritedRoles') }}</div>
          <div class="d-flex flex-wrap ga-2">
            <v-chip v-for="role in selectedRoleInherited" :key="role" size="small">{{ role }}</v-chip>
            <span v-if="!selectedRoleInherited.length" class="text-body-2">{{ t('admin.roles.dialogs.noInheritedRoles') }}</span>
          </div>
        </v-card-text>
      </v-card>
    </v-dialog>
  </div>
</template>
