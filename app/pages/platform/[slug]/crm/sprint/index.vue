<script setup lang="ts">
import PlatformSidebarNav from '~/components/platform/PlatformSidebarNav.vue'
import PlatformSplitLayout from '~/components/platform/PlatformSplitLayout.vue'
import { getCrmNav } from '~/data/platform-nav'
import { useCrmStore } from '~/stores/crm'
import type { CreateCrmSprintPayload } from '~/types/api/crm'

definePageMeta({ public: true, requiresAuth: false })

const route = useRoute()
const slug = computed(() => String(route.params.slug ?? ''))
const { isOwner } = usePlatformPermissions(slug)
const crmNav = computed(() => getCrmNav(slug.value, isOwner.value))

const crmStore = useCrmStore()
const sprints = computed(() => crmStore.getSprints(slug.value))
const projects = computed(() => crmStore.getProjects(slug.value))
const projectsById = computed(() => new Map(projects.value.map(project => [project.id, project.name])))
const showCreateDialog = ref(false)
const isMutating = ref(false)
const isPageLoading = ref(true)
const goToSprint = (id: string) => navigateTo(`/platform/${slug.value}/crm/sprint/${id}`)
const editSprint = (id: string) => navigateTo(`/platform/${slug.value}/crm/sprint/${id}`)

const form = reactive<CreateCrmSprintPayload>({
  name: '',
  goal: '',
  projectId: '' as CreateCrmSprintPayload['projectId'],
  status: 'planned',
  startDate: '',
  endDate: '',
})
const isLoading = computed(() => crmStore.isLoading)
const errorMessage = ref('')
const { normalizeError } = useApiError()
const { $errorLogger } = useNuxtApp()

const loadData = async () => {
  if (!slug.value) {
    return
  }
  errorMessage.value = ''
  try {
    await Promise.all([
      crmStore.fetchProjects(slug.value),
      crmStore.fetchSprints(slug.value),
    ])
  }
  catch (error) {
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

const createSprint = async () => {
  if (!slug.value || !form.name.trim() || !form.projectId) {
    return
  }

  isMutating.value = true
  try {
    await crmStore.createSprint(slug.value, {
      ...form,
      name: form.name.trim(),
      startDate: toAtomDateTime(form.startDate),
      endDate: toAtomDateTime(form.endDate),
    })
    showCreateDialog.value = false
    Object.assign(form, { name: '', goal: '', projectId: '', status: 'planned', startDate: '', endDate: '' })
  }
  finally {
    isMutating.value = false
  }
}

const removeSprint = async (id: string) => {
  if (!slug.value) {
    return
  }

  await crmStore.deleteSprint(slug.value, id)
}

const formatDateYmd = (value?: string) => {
  if (!value) {
    return 'N/A'
  }

  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    return value
  }

  const year = parsed.getUTCFullYear()
  const month = String(parsed.getUTCMonth() + 1).padStart(2, '0')
  const day = String(parsed.getUTCDate()).padStart(2, '0')

  return `${year}.${month}.${day}`
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
    <template #sidebar>
      <PlatformSidebarNav title="platform.crm.sidebar.title" subtitle="platform.common.sidebar.application" :subtitle-values="{ slug }" :items="crmNav" />
    </template>

    <section>
      <div class="d-flex align-center justify-space-between mb-4 flex-wrap ga-2">
        <div>
          <h1 class="text-h5 font-weight-bold mb-1">Sprint Board</h1>
        </div>
        <div class="d-flex ga-2 flex-wrap">
          <v-btn color="primary" @click="showCreateDialog = true" icon="mdi-plus"></v-btn>
          <v-btn color="primary" variant="outlined" :loading="isLoading" @click="loadData" icon="mdi-refresh"></v-btn>
        </div>
      </div>

      <v-row v-if="isPageLoading">
        <v-col v-for="i in 4" :key="`sprint-skeleton-${i}`" cols="12" md="6" lg="4">
          <v-skeleton-loader type="card, article" class="h-100" />
        </v-col>
      </v-row>

      <v-row v-else>
        <v-col v-for="sprint in sprints" :key="sprint.id" cols="12" md="6" lg="4">
          <v-card rounded="xl" class="h-100 cursor-pointer sprints-card" @click="goToSprint(sprint.id)">
            <v-card-text>
              <div class="d-flex justify-space-between align-start mb-2 ga-2">
                <p class="text-subtitle-1 font-weight-bold">{{ sprint.name }}</p>
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
                    <v-list-item prepend-icon="mdi-pencil" title="Edit" @click.stop="editSprint(sprint.id)" />
                    <v-list-item prepend-icon="mdi-delete" title="Delete" @click.stop="removeSprint(sprint.id)" />
                  </v-list>
                </v-menu>
              </div>
              <p class="text-body-2 mb-2">{{ formatDateYmd(sprint.startDate) }} → {{ formatDateYmd(sprint.endDate) }}</p>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <v-dialog v-model="showCreateDialog" max-width="620">
        <v-card>
          <v-card-title>Add sprint</v-card-title>
          <v-card-text>
            <v-text-field v-model="form.name" label="Name" required />
            <v-text-field v-model="form.goal" label="Goal" />
            <v-select v-model="form.projectId" label="Project" :items="projects" item-title="name" item-value="id" />
            <v-text-field v-model="form.status" label="Status" />
            <v-text-field v-model="form.startDate" label="Start date" type="datetime-local" />
            <v-text-field v-model="form.endDate" label="End date" type="datetime-local" />
          </v-card-text>
          <v-card-actions>
            <v-spacer />
            <v-btn variant="text" @click="showCreateDialog = false">Cancel</v-btn>
            <v-btn color="primary" :loading="isMutating" @click="createSprint">Create</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </section>
  </PlatformSplitLayout>
</template>
<style scoped>
.sprints-card:hover {
  box-shadow: 0 10px 24px rgba(var(--v-theme-primary));
  transition: transform 140ms ease, box-shadow 140ms ease;
  cursor: grab;
}
</style>