<script setup lang="ts">
import UiDataTable from '~/components/ui/UiDataTable.vue'
import UiPageSection from '~/components/ui/UiPageSection.vue'
import UiSectionHeader from '~/components/ui/UiSectionHeader.vue'
import { useUsersApi } from '~/composables/api/useUsersApi'
import type { UserGroup } from '~/types/api/userGroup'
import type { UserRead, UserWrite } from '~/types/api/user'

definePageMeta({
  layout: 'admin',
  middleware: ['role'],
  requiredPermissions: ['admin.access'],
})

const usersApi = useUsersApi()
const loading = ref(false)
const submitting = ref(false)
const errorMessage = ref('')
const users = ref<UserRead[]>([])
const search = ref('')

const formMode = ref<'create' | 'edit' | 'patch'>('create')
const formDialog = ref(false)
const selectedUser = ref<UserRead | null>(null)
const userRelations = ref<Record<string, { roles: string[]; groups: UserGroup[] }>>({})

const form = reactive<UserWrite>({
  username: '',
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  language: 'fr',
  locale: 'fr_FR',
  timezone: 'Europe/Paris',
  photo: '',
})

const headers = [
  { title: 'Username', key: 'username', sortable: true },
  { title: 'Nom', key: 'fullName', sortable: true },
  { title: 'Email', key: 'email', sortable: true },
  { title: '', key: 'photo', sortable: false },
  { title: 'Relations', key: 'relations', sortable: false },
  { title: 'Actions', key: 'actions', sortable: false },
]

const tableItems = computed(() => users.value.map(user => ({
  ...user,
  fullName: `${user.firstName} ${user.lastName}`.trim(),
  relations: userRelations.value[user.id] ?? { roles: [], groups: [] },
})))

const formTitle = computed(() => {
  if (formMode.value === 'create') {
    return 'Créer un utilisateur'
  }

  if (formMode.value === 'edit') {
    return 'Éditer un utilisateur'
  }

  return 'Patch utilisateur'
})

const fetchUsers = async () => {
  loading.value = true
  errorMessage.value = ''

  try {
    users.value = await usersApi.list({ limit: 200 })

    const relations = await Promise.all(users.value.map(async (user) => {
      const [roles, groups] = await Promise.all([
        usersApi.getRoles(user.id).catch(() => []),
        usersApi.getGroups(user.id).catch(() => []),
      ])

      return [user.id, { roles, groups }] as const
    }))

    userRelations.value = Object.fromEntries(relations)
  }
  catch {
    errorMessage.value = 'Impossible de charger les utilisateurs depuis /api/v1/user.'
  }
  finally {
    loading.value = false
  }
}

const resetForm = () => {
  Object.assign(form, {
    username: '',
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    language: 'fr',
    locale: 'fr_FR',
    timezone: 'Europe/Paris',
    photo: '',
  })
}

const openCreateDialog = () => {
  formMode.value = 'create'
  resetForm()
  formDialog.value = true
}

const openEditDialog = (user: UserRead, patch = false) => {
  formMode.value = patch ? 'patch' : 'edit'
  Object.assign(form, {
    username: user.username,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    password: '',
    language: user.language ?? 'fr',
    locale: user.locale ?? 'fr_FR',
    timezone: user.timezone,
    photo: user.photo ?? '',
  })
  selectedUser.value = user
  formDialog.value = true
}

const submitForm = async () => {
  if ((formMode.value === 'edit' || formMode.value === 'patch') && !selectedUser.value) {
    return
  }

  submitting.value = true
  try {
    if (formMode.value === 'create') {
      await usersApi.create({ ...form })
    }
    else if (formMode.value === 'edit') {
      await usersApi.update(selectedUser.value!.id, { ...form })
    }
    else {
      await usersApi.patch(selectedUser.value!.id, {
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        timezone: form.timezone,
        language: form.language,
        locale: form.locale,
        photo: form.photo,
      })
    }

    formDialog.value = false
    await fetchUsers()
  }
  finally {
    submitting.value = false
  }
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
          <v-btn color="primary" prepend-icon="mdi-plus" class="mr-2" @click="openCreateDialog">
            Créer
          </v-btn>
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

    <v-card rounded="xl" elevation="2" class="pa-4">
      <v-text-field
        v-model="search"
        label="Rechercher"
        prepend-inner-icon="mdi-magnify"
        density="comfortable"
        hide-details
        class="mb-4"
        max-width="360"
      />

      <v-alert v-if="errorMessage" type="error" variant="tonal" class="mb-4">
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
        <template #item.photo="{ item }">
          <v-avatar size="32">
            <v-img :src="item.photo" :alt="item.username" />
          </v-avatar>
        </template>

        <template #item.relations="{ item }">
          <div class="d-flex flex-wrap ga-1 py-1">
            <v-chip
              v-for="role in item.relations.roles"
              :key="`role-${item.id}-${role}`"
              size="small"
              color="secondary"
              variant="tonal"
            >
              {{ role }}
            </v-chip>
            <v-chip
              v-for="group in item.relations.groups"
              :key="`group-${item.id}-${group.id}`"
              size="small"
              color="info"
              variant="tonal"
            >
              {{ group.name }}
            </v-chip>
          </div>
        </template>

        <template #item.actions="{ item }">
          <div class="d-flex flex-wrap ga-1 py-1">
            <v-btn
              size="small"
              variant="tonal"
              color="warning"
              icon="mdi-file-edit-outline"
              :aria-label="`Patch ${item.username}`"
              @click="openEditDialog(item, true)"
            />
            <v-btn
              size="small"
              variant="tonal"
              color="error"
              icon="mdi-delete"
              :aria-label="`Delete ${item.username}`"
              @click="deleteEntity(item.id)"
            />
          </div>
        </template>
      </UiDataTable>
    </v-card>

    <v-dialog v-model="formDialog" max-width="760" persistent>
      <v-card rounded="xl" class="pa-2">
        <v-card-title class="text-h6">{{ formTitle }}</v-card-title>
        <v-card-text>
          <v-row>
            <v-col cols="12" md="6"><v-text-field v-model="form.username" label="Username" :disabled="formMode === 'patch'" /></v-col>
            <v-col cols="12" md="6"><v-text-field v-model="form.email" label="Email" /></v-col>
            <v-col cols="12" md="6"><v-text-field v-model="form.firstName" label="Prénom" /></v-col>
            <v-col cols="12" md="6"><v-text-field v-model="form.lastName" label="Nom" /></v-col>
            <v-col cols="12" md="6"><v-text-field v-model="form.password" type="password" label="Password" hint="Laisser vide pour ne pas changer" persistent-hint /></v-col>
            <v-col cols="12" md="6"><v-text-field v-model="form.timezone" label="Timezone" /></v-col>
            <v-col cols="12" md="6"><v-text-field v-model="form.language" label="Language" /></v-col>
            <v-col cols="12" md="6"><v-text-field v-model="form.locale" label="Locale" /></v-col>
            <v-col cols="12"><v-text-field v-model="form.photo" label="Photo URL" /></v-col>
          </v-row>
        </v-card-text>
        <v-card-actions class="justify-end">
          <v-btn variant="text" @click="formDialog = false">Annuler</v-btn>
          <v-btn color="primary" :loading="submitting" @click="submitForm">Enregistrer</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

  </UiPageSection>
</template>
