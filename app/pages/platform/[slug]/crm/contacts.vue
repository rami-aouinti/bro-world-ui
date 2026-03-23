<script setup lang="ts">
import PlatformSidebarNav from '~/components/platform/PlatformSidebarNav.vue'
import PlatformSplitLayout from '~/components/platform/PlatformSplitLayout.vue'
import { getCrmNav } from '~/data/platform-nav'
import { useCrmStore } from '~/stores/crm'
import type { CrmContact, CreateCrmContactPayload, UpdateCrmContactPayload } from '~/types/api/crm'
import {useListingPagination} from '~/composables/useListingPagination'

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
const selectedItem = ref<CrmContact | null>(null)
const showFilters = ref(true)
const searchQuery = ref('')
const cityFilter = ref('')

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
const filteredContacts = computed(() => contacts.value.filter((contact) => {
  const query = searchQuery.value.trim().toLowerCase()
  const city = cityFilter.value.trim().toLowerCase()
  const matchesSearch = !query
    || fullName(contact).toLowerCase().includes(query)
    || (contact.email || '').toLowerCase().includes(query)
    || (contact.jobTitle || '').toLowerCase().includes(query)
  const matchesCity = !city || (contact.city || '').toLowerCase().includes(city)

  return matchesSearch && matchesCity
}))
const {
  page,
  paginatedItems: paginatedContacts,
  pageLength,
  shouldShowPagination,
} = useListingPagination(filteredContacts, [searchQuery, cityFilter])

const fullName = (contact: CrmContact) => `${contact.firstName ?? ''} ${contact.lastName ?? ''}`.trim() || 'N/A'
const selectContact = (contact: CrmContact) => {
  selectedItem.value = contact
  showFilters.value = false
}
const showFiltersPanel = () => {
  showFilters.value = true
}

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
    if (selectedItem.value) {
      selectedItem.value = contacts.value.find(contact => contact.id === selectedItem.value?.id) ?? null
    }
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
        <v-btn
          size="large"
          variant="text"
          class="text-none app-bar__link-btn"
          :loading="isPageLoading"
          @click="loadContacts(true)"
          icon="mdi-refresh"
        />
      </teleport>
      <teleport to="#app-bar-teleport-target-right">
        <v-btn rounded="xl" variant="outlined" @click="showCreateDialog = true">Ajouter un contact</v-btn>
      </teleport>
    </client-only>
    <template #sidebar>
      <PlatformSidebarNav title="platform.crm.sidebar.title" subtitle="platform.common.sidebar.application" :subtitle-values="{ slug }" :items="crmNav" />
    </template>
    <template #aside>
      <div class="d-flex flex-column ga-4">
        <template v-if="showFilters">
          <v-card rounded="xl" variant="text">
            <v-card-title class="text-subtitle-2">Filters</v-card-title>
            <v-card-text class="d-flex flex-column ga-3">
              <v-text-field v-model="searchQuery" label="Search" rounded="xl" density="comfortable" variant="outlined" hide-details prepend-inner-icon="mdi-magnify" />
              <v-text-field v-model="cityFilter" label="City" rounded="xl" density="comfortable" variant="outlined" hide-details prepend-inner-icon="mdi-magnify" />
            </v-card-text>
          </v-card>
        </template>
        <v-card v-else-if="selectedItem" rounded="xl" variant="text">
          <v-btn size="small" variant="tonal" prepend-icon="mdi-filter-outline" @click="showFiltersPanel">Filter</v-btn>
          <h4 class="text-truncate">{{ fullName(selectedItem) }}</h4>
          <v-card-text>
            <p class="text-body-2 mb-1"><strong>Email:</strong> {{ selectedItem.email || 'N/A' }}</p>
            <p class="text-body-2 mb-1"><strong>Job:</strong> {{ selectedItem.jobTitle || 'N/A' }}</p>
            <p class="text-body-2 mb-0"><strong>City:</strong> {{ selectedItem.city || 'N/A' }}</p>
          </v-card-text>
        </v-card>
      </div>
    </template>
    <section class="contacts-page">
      <div class="contacts-page__content">
        <div class="d-flex align-center justify-space-between mb-4 flex-wrap ga-2">
          <div>
            <h1 class="text-h5 font-weight-bold mb-1">Contacts</h1>
            <p class="text-body-2 text-medium-emphasis">Créer, modifier et supprimer les contacts du CRM.</p>
          </div>
        </div>

        <v-alert v-if="errorMessage" type="error" variant="tonal" class="mb-4">
          {{ errorMessage }}
        </v-alert>

        <v-row v-if="isPageLoading">
          <v-col v-for="index in 6" :key="`contact-skeleton-${index}`" cols="12" md="6" lg="4">
            <v-skeleton-loader type="card, article" class="h-100" />
          </v-col>
        </v-row>

        <v-row v-else>
          <v-col v-for="contact in paginatedContacts" :key="contact.id" cols="12" md="6" lg="4">
            <v-card rounded="xl" variant="outlined" class="h-100 cursor-pointer" @click="selectContact(contact)">
              <v-card-text>
                <div class="d-flex justify-space-between align-start mb-3 ga-2">
                  <div>
                    <p class="text-subtitle-1 font-weight-bold mb-1">{{ fullName(contact) }}</p>
                    <p class="text-body-2 text-medium-emphasis mb-0">{{ contact.jobTitle || 'N/A' }}</p>
                  </div>
                  <v-chip size="small" color="primary" variant="tonal">Score {{ contact.score ?? 'N/A' }}</v-chip>
                </div>
                <div class="d-flex flex-column ga-1 text-body-2 mb-3">
                  <p class="mb-0"><strong>Email:</strong> {{ contact.email || 'N/A' }}</p>
                  <p class="mb-0"><strong>Téléphone:</strong> {{ contact.phone || 'N/A' }}</p>
                  <p class="mb-0"><strong>Ville:</strong> {{ contact.city || 'N/A' }}</p>
                </div>
                <div class="d-flex justify-between ga-2">
                  <v-btn variant="outlined" rounded="xl" class="text-body-2" @click.stop="openViewDialog(contact)">Open</v-btn>
                  <v-spacer />
                  <v-menu location="bottom end">
                    <template #activator="{ props }">
                      <v-btn
                        v-bind="props"
                        variant="outlined"
                        rounded="xl"
                        class="text-body-2"
                        @click.stop
                      >
                        Manage
                      </v-btn>
                    </template>
                    <v-list density="compact">
                      <v-list-item prepend-icon="mdi-pencil" title="Edit" @click.stop="openEditDialog(contact)" />
                      <v-list-item prepend-icon="mdi-delete" title="Delete" @click.stop="removeContact(contact.id)" />
                    </v-list>
                  </v-menu>
                </div>
              </v-card-text>
            </v-card>
          </v-col>
          <v-col v-if="paginatedContacts.length === 0" cols="12">
            <v-alert type="info" variant="tonal">Aucun contact trouvé.</v-alert>
          </v-col>
        </v-row>
      </div>

      <div v-if="shouldShowPagination" class="contacts-page__footer d-flex justify-center">
        <v-pagination v-model="page" :length="pageLength" total-visible="5" />
      </div>

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
<style scoped>
.contacts-page {
  min-height: 75vh;
  display: flex;
  flex-direction: column;
}

.contacts-page__content {
  flex: 1;
}

.contacts-page__footer {
  margin-top: auto;
  padding-bottom: 0;
}
</style>
