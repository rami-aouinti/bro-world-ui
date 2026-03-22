<script setup lang="ts">
import PlatformSidebarNav from '~/components/platform/PlatformSidebarNav.vue'
import PlatformSplitLayout from '~/components/platform/PlatformSplitLayout.vue'
import { getCrmNav } from '~/data/platform-nav'
import { useCrmStore } from '~/stores/crm'
import type { CrmContact, CreateCrmContactPayload, UpdateCrmContactPayload } from '~/types/api/crm'

definePageMeta({ public: true, requiresAuth: false })

const route = useRoute()
const slug = computed(() => String(route.params.slug ?? ''))
const { isOwner } = usePlatformPermissions(slug)
const crmNav = computed(() => getCrmNav(slug.value, isOwner.value))
const crmStore = useCrmStore()
const { normalizeError } = useApiError()
const { $errorLogger } = useNuxtApp()

const errorMessage = ref('')
const isPageLoading = ref(true)
const isMutating = ref(false)
const showCreateDialog = ref(false)
const showEditDialog = ref(false)
const selectedContact = ref<CrmContact | null>(null)
const showViewDialog = ref(false)

const createForm = reactive<CreateCrmContactPayload>({
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  jobTitle: '',
  city: '',
  score: undefined,
})

const editForm = reactive<UpdateCrmContactPayload>({
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  jobTitle: '',
  city: '',
  score: undefined,
})

const contacts = computed(() => crmStore.getContacts(slug.value))

const tableHeaders = [
  { title: 'Nom', key: 'name' },
  { title: 'Email', key: 'email' },
  { title: 'Téléphone', key: 'phone' },
  { title: 'Poste', key: 'jobTitle' },
  { title: 'Ville', key: 'city' },
  { title: 'Score', key: 'score' },
  { title: 'Actions', key: 'actions', sortable: false },
]

const fullName = (contact: CrmContact) => `${contact.firstName ?? ''} ${contact.lastName ?? ''}`.trim() || 'N/A'

const resetCreateForm = () => {
  Object.assign(createForm, {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    jobTitle: '',
    city: '',
    score: undefined,
  })
}

const loadContacts = async (force = false) => {
  if (!slug.value) {
    return
  }

  errorMessage.value = ''

  try {
    await crmStore.fetchContacts(slug.value, force)
  }
  catch (error) {
    const normalized = normalizeError(error, {
      domain: 'platform.crm.contacts',
      action: 'load',
      fallbackKey: 'platform.crm.contacts.errors.load',
    })
    $errorLogger(error, { area: 'platform.crm.contacts', action: 'load', status: normalized.status })
    errorMessage.value = normalized.message
  }
}

const createContact = async () => {
  if (!slug.value || !createForm.firstName?.trim() || !createForm.lastName?.trim()) {
    return
  }

  isMutating.value = true
  try {
    await crmStore.createContact(slug.value, {
      ...createForm,
      firstName: createForm.firstName.trim(),
      lastName: createForm.lastName.trim(),
    })
    showCreateDialog.value = false
    resetCreateForm()
  }
  finally {
    isMutating.value = false
  }
}

const openViewDialog = (contact: CrmContact) => {
  selectedContact.value = contact
  showViewDialog.value = true
}

const openEditDialog = (contact: CrmContact) => {
  selectedContact.value = contact
  Object.assign(editForm, {
    firstName: contact.firstName,
    lastName: contact.lastName,
    email: contact.email ?? '',
    phone: contact.phone ?? '',
    jobTitle: contact.jobTitle ?? '',
    city: contact.city ?? '',
    score: contact.score ?? undefined,
  })
  showEditDialog.value = true
}

const updateContact = async () => {
  if (!slug.value || !selectedContact.value?.id) {
    return
  }

  isMutating.value = true
  try {
    await crmStore.updateContact(slug.value, selectedContact.value.id, {
      ...editForm,
      firstName: editForm.firstName?.trim(),
      lastName: editForm.lastName?.trim(),
    })
    showEditDialog.value = false
    selectedContact.value = null
  }
  finally {
    isMutating.value = false
  }
}

const removeContact = async (id: string) => {
  if (!slug.value) {
    return
  }

  await crmStore.deleteContact(slug.value, id)
}

onMounted(async () => {
  try {
    await loadContacts()
  }
  finally {
    isPageLoading.value = false
  }
})
</script>

<template>
  <PlatformSplitLayout>
    <client-only>
      <teleport to="#app-bar-teleport-target">
        <v-btn variant="outlined" :loading="crmStore.isLoading" @click="loadContacts(true)">Refresh</v-btn>
      </teleport>
      <teleport to="#app-bar-teleport-target-right">
        <v-btn color="primary" @click="showCreateDialog = true">Ajouter un contact</v-btn>
      </teleport>
    </client-only>
    <template #sidebar>
      <PlatformSidebarNav title="platform.crm.sidebar.title" subtitle="platform.common.sidebar.application" :subtitle-values="{ slug }" :items="crmNav" />
    </template>

    <section>
      <div class="d-flex align-center justify-space-between mb-4 flex-wrap ga-2">
        <div>
          <h1 class="text-h5 font-weight-bold mb-1">Contacts</h1>
          <p class="text-body-2 text-medium-emphasis">Créer, modifier et supprimer les contacts du CRM.</p>
        </div>
      </div>

      <v-alert v-if="errorMessage" type="error" variant="tonal" class="mb-4">
        {{ errorMessage }}
      </v-alert>

      <v-skeleton-loader v-if="isPageLoading" type="table-heading, table-thead, table-row-divider@6" />

      <v-data-table
        v-else
        :headers="tableHeaders"
        :items="contacts"
        :items-per-page="5"
        item-value="id"
        class="elevation-1 rounded-xl"
      >
        <template #item.name="{ item }">
          {{ fullName(item) }}
        </template>

        <template #item.email="{ item }">
          {{ item.email || 'N/A' }}
        </template>

        <template #item.phone="{ item }">
          {{ item.phone || 'N/A' }}
        </template>

        <template #item.jobTitle="{ item }">
          {{ item.jobTitle || 'N/A' }}
        </template>

        <template #item.city="{ item }">
          {{ item.city || 'N/A' }}
        </template>

        <template #item.score="{ item }">
          <v-chip size="small" color="primary" variant="tonal">{{ item.score ?? 'N/A' }}</v-chip>
        </template>

        <template #item.actions="{ item }">
          <div class="d-flex ga-2 justify-end">
            <v-btn size="small" variant="text" icon="mdi-eye" @click="openViewDialog(item)" />
            <v-btn size="small" variant="tonal" @click="openEditDialog(item)">Edit</v-btn>
            <v-btn size="small" color="error" variant="tonal" @click="removeContact(item.id)">Delete</v-btn>
          </div>
        </template>
      </v-data-table>

      <v-dialog v-model="showCreateDialog" max-width="560">
        <v-card>
          <v-card-title>Ajouter un contact</v-card-title>
          <v-card-text>
            <v-row>
              <v-col cols="12" md="6"><v-text-field v-model="createForm.firstName" label="Prénom" required /></v-col>
              <v-col cols="12" md="6"><v-text-field v-model="createForm.lastName" label="Nom" required /></v-col>
              <v-col cols="12" md="6"><v-text-field v-model="createForm.email" label="Email" type="email" /></v-col>
              <v-col cols="12" md="6"><v-text-field v-model="createForm.phone" label="Téléphone" /></v-col>
              <v-col cols="12" md="6"><v-text-field v-model="createForm.jobTitle" label="Poste" /></v-col>
              <v-col cols="12" md="6"><v-text-field v-model="createForm.city" label="Ville" /></v-col>
              <v-col cols="12" md="6"><v-text-field v-model.number="createForm.score" label="Score" type="number" min="0" max="100" /></v-col>
            </v-row>
          </v-card-text>
          <v-card-actions>
            <v-spacer />
            <v-btn variant="text" @click="showCreateDialog = false">Annuler</v-btn>
            <v-btn color="primary" :loading="isMutating" @click="createContact">Créer</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <v-dialog v-model="showEditDialog" max-width="560">
        <v-card>
          <v-card-title>Modifier le contact</v-card-title>
          <v-card-text>
            <v-row>
              <v-col cols="12" md="6"><v-text-field v-model="editForm.firstName" label="Prénom" required /></v-col>
              <v-col cols="12" md="6"><v-text-field v-model="editForm.lastName" label="Nom" required /></v-col>
              <v-col cols="12" md="6"><v-text-field v-model="editForm.email" label="Email" type="email" /></v-col>
              <v-col cols="12" md="6"><v-text-field v-model="editForm.phone" label="Téléphone" /></v-col>
              <v-col cols="12" md="6"><v-text-field v-model="editForm.jobTitle" label="Poste" /></v-col>
              <v-col cols="12" md="6"><v-text-field v-model="editForm.city" label="Ville" /></v-col>
              <v-col cols="12" md="6"><v-text-field v-model.number="editForm.score" label="Score" type="number" min="0" max="100" /></v-col>
            </v-row>
          </v-card-text>
          <v-card-actions>
            <v-spacer />
            <v-btn variant="text" @click="showEditDialog = false">Annuler</v-btn>
            <v-btn color="primary" :loading="isMutating" @click="updateContact">Enregistrer</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <v-dialog v-model="showViewDialog" max-width="520">
        <v-card>
          <v-card-title>View contact</v-card-title>
          <v-card-text>
            <p><strong>Nom:</strong> {{ selectedContact ? fullName(selectedContact) : 'N/A' }}</p>
            <p><strong>Email:</strong> {{ selectedContact?.email || 'N/A' }}</p>
            <p><strong>Téléphone:</strong> {{ selectedContact?.phone || 'N/A' }}</p>
            <p><strong>Poste:</strong> {{ selectedContact?.jobTitle || 'N/A' }}</p>
            <p><strong>Ville:</strong> {{ selectedContact?.city || 'N/A' }}</p>
            <p><strong>Score:</strong> {{ selectedContact?.score ?? 'N/A' }}</p>
          </v-card-text>
          <v-card-actions>
            <v-spacer />
            <v-btn variant="text" @click="showViewDialog = false">Fermer</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </section>
  </PlatformSplitLayout>
</template>
