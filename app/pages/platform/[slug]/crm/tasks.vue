<script setup lang="ts">
import PlatformSidebarNav from '~/components/platform/PlatformSidebarNav.vue'
import PlatformSplitLayout from '~/components/platform/PlatformSplitLayout.vue'
import { getCrmNav } from '~/data/platform-nav'
import { useCrmStore } from '~/stores/crm'
import type { CreateCrmTaskPayload, CrmTaskChild } from '~/types/api/crm'

definePageMeta({ public: true, requiresAuth: false })

const route = useRoute()
const slug = computed(() => String(route.params.slug ?? ''))
const { isOwner } = usePlatformPermissions(slug)
const crmNav = computed(() => getCrmNav(slug.value, isOwner.value))

const crmStore = useCrmStore()
const tasks = computed(() => crmStore.getTasks(slug.value))
const projects = computed(() => crmStore.getProjects(slug.value))
const sprints = computed(() => crmStore.getSprints(slug.value))
const selectedTaskId = ref('')
const showCreateDialog = ref(false)
const isMutating = ref(false)
const form = reactive<CreateCrmTaskPayload>({
  title: '',
  description: '',
  projectId: '' as CreateCrmTaskPayload['projectId'],
  sprintId: '' as CreateCrmTaskPayload['sprintId'],
  status: 'todo',
  priority: 'high',
  dueAt: '',
  estimatedHours: undefined,
  assigneeIds: [],
})

const selectedTask = computed(() => tasks.value.find(task => task.id === selectedTaskId.value) ?? tasks.value[0] ?? null)
const childColumns = computed(() => {
  const columns: Array<{ key: string, title: string, items: CrmTaskChild[] }> = [
    { key: 'pending', title: 'Pending', items: [] },
    { key: 'approved', title: 'Approved', items: [] },
    { key: 'rejected', title: 'Rejected', items: [] },
    { key: 'other', title: 'Other', items: [] },
  ]

  for (const child of selectedTask.value?.children ?? []) {
    const column = columns.find(item => item.key === child.status) ?? columns.find(item => item.key === 'other')!
    column.items.push(child)
  }

  return columns
})

const loadData = async () => {
  if (!slug.value) {
    return
  }

  await Promise.all([
    crmStore.fetchProjects(slug.value),
    crmStore.fetchSprints(slug.value),
    crmStore.fetchTasks(slug.value),
    crmStore.fetchMyTasks(slug.value),
  ])

  if (!selectedTaskId.value && tasks.value.length > 0) {
    selectedTaskId.value = tasks.value[0].id
  }
}

const createTask = async () => {
  if (!slug.value || !form.title.trim() || !form.projectId || !form.sprintId) {
    return
  }

  isMutating.value = true
  try {
    await crmStore.createTask(slug.value, { ...form, title: form.title.trim() })
    showCreateDialog.value = false
    Object.assign(form, {
      title: '',
      description: '',
      projectId: '',
      sprintId: '',
      status: 'todo',
      priority: 'high',
      dueAt: '',
      estimatedHours: undefined,
      assigneeIds: [],
    })
  }
  finally {
    isMutating.value = false
  }
}

const removeTask = async (id: string) => {
  if (!slug.value) {
    return
  }

  await crmStore.deleteTask(slug.value, id)

  if (selectedTaskId.value === id) {
    selectedTaskId.value = tasks.value[0]?.id ?? ''
  }
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
          <h1 class="text-h5 font-weight-bold mb-1">CRM Tasks Kanban</h1>
          <p class="text-body-2 text-medium-emphasis">Tasks on the left, child requests organized in kanban columns.</p>
        </div>
        <v-btn color="primary" @click="showCreateDialog = true">Add task</v-btn>
      </div>

      <v-row>
        <v-col cols="12" md="4">
          <v-card rounded="xl" class="h-100">
            <v-card-title>Tasks</v-card-title>
            <v-list lines="two">
              <v-list-item
                v-for="task in tasks"
                :key="task.id"
                :active="selectedTaskId === task.id"
                @click="selectedTaskId = task.id"
              >
                <template #title>{{ task.title }}</template>
                <template #subtitle>{{ task.projectName }} · {{ task.sprintName }} · {{ task.status }}</template>
                <template #append>
                  <v-btn size="x-small" color="error" variant="tonal" @click.stop="removeTask(task.id)">Delete</v-btn>
                </template>
              </v-list-item>
            </v-list>
          </v-card>
        </v-col>

        <v-col cols="12" md="8">
          <v-row>
            <v-col v-for="column in childColumns" :key="column.key" cols="12" sm="6" lg="3">
              <v-card rounded="xl" class="h-100">
                <v-card-title class="text-subtitle-1">{{ column.title }}</v-card-title>
                <v-card-text>
                  <v-card
                    v-for="child in column.items"
                    :key="child.id"
                    variant="outlined"
                    class="mb-2"
                  >
                    <v-card-text class="py-3">
                      <p class="text-body-2 font-weight-medium mb-1">{{ child.title }}</p>
                      <p class="text-caption mb-0">{{ child.requestedAt || 'No request date' }}</p>
                    </v-card-text>
                  </v-card>
                  <p v-if="column.items.length === 0" class="text-caption text-medium-emphasis mb-0">No item</p>
                </v-card-text>
              </v-card>
            </v-col>
          </v-row>
        </v-col>
      </v-row>

      <v-dialog v-model="showCreateDialog" max-width="640">
        <v-card>
          <v-card-title>Add task</v-card-title>
          <v-card-text>
            <v-text-field v-model="form.title" label="Title" required />
            <v-textarea v-model="form.description" label="Description" rows="2" />
            <v-select v-model="form.projectId" label="Project" :items="projects" item-title="name" item-value="id" />
            <v-select v-model="form.sprintId" label="Sprint" :items="sprints" item-title="name" item-value="id" />
            <v-text-field v-model="form.status" label="Status" />
            <v-text-field v-model="form.priority" label="Priority" />
            <v-text-field v-model="form.dueAt" label="Due at" type="datetime-local" />
            <v-text-field v-model.number="form.estimatedHours" type="number" label="Estimated hours" />
          </v-card-text>
          <v-card-actions>
            <v-spacer />
            <v-btn variant="text" @click="showCreateDialog = false">Cancel</v-btn>
            <v-btn color="primary" :loading="isMutating" @click="createTask">Create</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </section>
  </PlatformSplitLayout>
</template>
