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
const showCreateDialog = ref(false)
const isMutating = ref(false)
const isPageLoading = ref(true)
const isLoading = computed(() => crmStore.isLoading)
const selectedStatusFilter = ref('all')
const goToProject = (id: string) => navigateTo(`/platform/${slug.value}/crm/project/${id}`)
const editProject = (id: string) => navigateTo(`/platform/${slug.value}/crm/project/${id}`)
const statusFilters = computed(() => {
  const counts = new Map<string, number>()

  for (const project of projects.value) {
    const status = (project.status || 'unknown').toLowerCase()
    counts.set(status, (counts.get(status) ?? 0) + 1)
  }

  const total = projects.value.length || 1
  const dynamicFilters = Array.from(counts.entries()).map(([value, count]) => ({
    value,
    label: value.charAt(0).toUpperCase() + value.slice(1),
    count,
    ratio: Math.round((count / total) * 100),
  }))

  return [
    {
      value: 'all',
      label: 'All',
      count: projects.value.length,
      ratio: 100,
    },
    ...dynamicFilters,
  ]
})
const filteredProjects = computed(() => {
  if (selectedStatusFilter.value === 'all') {
    return projects.value
  }
  return projects.value.filter(project => (project.status || 'unknown').toLowerCase() === selectedStatusFilter.value)
})

const form = reactive<CreateCrmProjectPayload>({
  name: '',
  code: '',
  description: '',
  companyId: '' as CreateCrmProjectPayload['companyId'],
  status: 'active',
  startedAt: '',
  dueAt: '',
})
const { normalizeError } = useApiError()
const { $errorLogger } = useNuxtApp()
const errorMessage = ref('')
const loadData = async () => {
  if (!slug.value) {
    return
  }

  errorMessage.value = ''

  try {
    await Promise.all([
      crmStore.fetchCompanies(slug.value),
      crmStore.fetchProjects(slug.value),
    ])
  } catch (error) {
    const normalized = normalizeError(error, {
      domain: 'platform.crm.tasks',
      action: 'load',
      fallbackKey: 'platform.crm.tasks.errors.load',
    })
    $errorLogger(error, { area: 'platform.crm.tasks', action: 'load', status: normalized.status })
    errorMessage.value = normalized.message
  }

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
  try {
    await loadData()
    await nextTick()
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
        <v-btn size="large"
               variant="text"
               class="text-none app-bar__link-btn" :loading="isLoading" @click="loadData" icon="mdi-refresh"></v-btn>
      </teleport>
      <teleport to="#app-bar-teleport-target-right">
        <v-btn color="primary" block @click="showCreateDialog = true" prepend-icon="mdi-plus">New Project</v-btn>
      </teleport>
    </client-only>
    <template #sidebar>
      <PlatformSidebarNav title="platform.crm.sidebar.title" subtitle="platform.common.sidebar.application" :subtitle-values="{ slug }" :items="crmNav" />
    </template>
    <template #aside>
      <div class="d-flex flex-column ga-4">
        <v-card rounded="xl" variant="outlined">
          <v-card-title class="text-subtitle-2">Filters</v-card-title>
          <v-card-text class="d-flex flex-column ga-2">
            <v-btn
              v-for="filter in statusFilters"
              :key="`project-filter-${filter.value}`"
              :variant="selectedStatusFilter === filter.value ? 'flat' : 'tonal'"
              :color="selectedStatusFilter === filter.value ? 'primary' : undefined"
              class="justify-space-between"
              @click="selectedStatusFilter = filter.value"
            >
              <span>{{ filter.label }} ({{ filter.count }})</span>
              <span class="text-caption">{{ filter.ratio }}%</span>
            </v-btn>
          </v-card-text>
        </v-card>
      </div>
    </template>
    <section>
      <v-row v-if="isPageLoading">
        <v-col v-for="i in 4" :key="`project-skeleton-${i}`" cols="12" md="6" lg="4">
          <v-skeleton-loader type="card, article" class="h-100" />
        </v-col>
      </v-row>

      <v-row v-else>
        <v-col v-for="project in filteredProjects" :key="project.id" cols="12" md="6" lg="6">
          <v-card rounded="xl" variant="outlined" class="h-100 cursor-pointer projects-card" @click="goToProject(project.id)">
            <v-card-text>
              <div class="d-flex justify-space-between align-start mb-2 ga-2">
                <p class="text-subtitle-1 font-weight-bold">{{ project.name }}</p>
                <v-menu location="bottom end">
                  <template #activator="{ props }">
                    <v-btn
                      v-bind="props"
                      size="x-small"
                      icon="mdi-cog"
                      variant="text"
                      @click.stop
                    />
                  </template>
                  <v-list density="compact">
                    <v-list-item prepend-icon="mdi-pencil" title="Edit" @click.stop="editProject(project.id)" />
                    <v-list-item prepend-icon="mdi-delete" title="Delete" @click.stop="removeProject(project.id)" />
                  </v-list>
                </v-menu>
              </div>
              <div class="d-flex align-center ga-2">
                <v-chip size="small" variant="tonal">{{ project.status || 'unknown' }}</v-chip>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
        <v-col v-if="filteredProjects.length === 0" cols="12">
          <v-alert type="info" variant="tonal">No projects found for this filter.</v-alert>
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
<style scoped>
.projects-card:hover {
  box-shadow: 0 10px 24px rgba(var(--v-theme-primary));
  transition: transform 140ms ease, box-shadow 140ms ease;
  cursor: grab;
}
</style>
