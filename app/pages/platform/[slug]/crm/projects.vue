<script setup lang="ts">
import PlatformSidebarNav from '~/components/platform/PlatformSidebarNav.vue'
import PlatformSplitLayout from '~/components/platform/PlatformSplitLayout.vue'
import { getCrmNav } from '~/data/platform-nav'
import { useCrmStore } from '~/stores/crm'
import type { CreateCrmProjectPayload } from '~/types/api/crm'

definePageMeta({ public: true, requiresAuth: false })

const route = useRoute()
const slug = computed(() => String(route.params.slug ?? ''))
const { isOwner } = usePlatformPermissions(slug)
const crmNav = computed(() => getCrmNav(slug.value, isOwner.value))

const crmStore = useCrmStore()
const projects = computed(() => crmStore.getProjects(slug.value))
const companies = computed(() => crmStore.getCompanies(slug.value))
const companiesById = computed(() => new Map(companies.value.map(company => [company.id, company.name])))
const showCreateDialog = ref(false)
const isMutating = ref(false)
const form = reactive<CreateCrmProjectPayload>({
  name: '',
  code: '',
  description: '',
  companyId: '' as CreateCrmProjectPayload['companyId'],
  status: 'active',
  startedAt: '',
  dueAt: '',
})

const loadData = async () => {
  if (!slug.value) {
    return
  }

  await Promise.all([
    crmStore.fetchCompanies(slug.value),
    crmStore.fetchProjects(slug.value),
  ])
}

const toAtomDateTime = (value?: string) => {
  if (!value) {
    return undefined
  }

  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    return value
  }

  const year = parsed.getUTCFullYear()
  const month = String(parsed.getUTCMonth() + 1).padStart(2, '0')
  const day = String(parsed.getUTCDate()).padStart(2, '0')
  const hours = String(parsed.getUTCHours()).padStart(2, '0')
  const minutes = String(parsed.getUTCMinutes()).padStart(2, '0')
  const seconds = String(parsed.getUTCSeconds()).padStart(2, '0')

  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}+00:00`
}

const createProject = async () => {
  if (!slug.value || !form.name.trim() || !form.companyId) {
    return
  }

  isMutating.value = true
  try {
    await crmStore.createProject(slug.value, {
      ...form,
      name: form.name.trim(),
      startedAt: toAtomDateTime(form.startedAt),
      dueAt: toAtomDateTime(form.dueAt),
    })
    showCreateDialog.value = false
    Object.assign(form, { name: '', code: '', description: '', companyId: '', status: 'active', startedAt: '', dueAt: '' })
  }
  finally {
    isMutating.value = false
  }
}

const removeProject = async (id: string) => {
  if (!slug.value) {
    return
  }

  await crmStore.deleteProject(slug.value, id)
}

onMounted(async () => {
  await loadData()
  await nextTick()
})
</script>

<template>
  <PlatformSplitLayout>
    <template #sidebar>
      <PlatformSidebarNav title="platform.crm.sidebar.title" subtitle="platform.common.sidebar.application" :subtitle-values="{ slug }" :items="crmNav" />
    </template>

    <section>
      <div class="d-flex align-center justify-space-between mb-4 flex-wrap ga-2">
        <div>
          <h1 class="text-h5 font-weight-bold mb-1">Projects</h1>
          <p class="text-body-2 text-medium-emphasis">Liste des projets CRM depuis l'API.</p>
        </div>
        <v-btn color="primary" @click="showCreateDialog = true">Add project</v-btn>
      </div>

      <v-row>
        <v-col v-for="project in projects" :key="project.id" cols="12" md="6">
          <v-card rounded="xl" class="h-100">
            <v-card-text>
              <div class="d-flex justify-space-between align-start mb-2 ga-2">
                <p class="text-subtitle-1 font-weight-bold">{{ project.name }}</p>
                <v-btn size="x-small" color="error" variant="tonal" @click="removeProject(project.id)">Delete</v-btn>
              </div>
              <p class="text-body-2 mb-2">Company: {{ companiesById.get(project.companyId) || project.companyId }}</p>
              <v-chip size="small" variant="tonal">{{ project.status }}</v-chip>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <v-dialog v-model="showCreateDialog" max-width="620">
        <v-card>
          <v-card-title>Add project</v-card-title>
          <v-card-text>
            <v-text-field v-model="form.name" label="Name" required />
            <v-text-field v-model="form.code" label="Code" />
            <v-textarea v-model="form.description" label="Description" rows="2" />
            <v-select v-model="form.companyId" label="Company" :items="companies" item-title="name" item-value="id" />
            <v-text-field v-model="form.status" label="Status" />
            <v-text-field v-model="form.startedAt" label="Started at" type="datetime-local" />
            <v-text-field v-model="form.dueAt" label="Due at" type="datetime-local" />
          </v-card-text>
          <v-card-actions>
            <v-spacer />
            <v-btn variant="text" @click="showCreateDialog = false">Cancel</v-btn>
            <v-btn color="primary" :loading="isMutating" @click="createProject">Create</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </section>
  </PlatformSplitLayout>
</template>
