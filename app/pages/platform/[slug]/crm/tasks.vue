<script setup lang="ts">
import PlatformSidebarNav from '~/components/platform/PlatformSidebarNav.vue'
import PlatformSplitLayout from '~/components/platform/PlatformSplitLayout.vue'
import { getCrmNav } from '~/data/platform-nav'
import { useCrmStore } from '~/stores/crm'
import type { CrmTask, CrmTaskChild } from '~/types/api/crm'

definePageMeta({ public: true, requiresAuth: false })

interface CrmBoardChild extends CrmTaskChild {
  taskTitle: string
  projectName: string
  sprintName: string
}

type KanbanStatus = 'pending' | 'progress' | 'review' | 'done'

const route = useRoute()
const slug = computed(() => String(route.params.slug ?? ''))
const { isOwner } = usePlatformPermissions(slug)
const crmNav = computed(() => getCrmNav(slug.value, isOwner.value))

const crmStore = useCrmStore()
const tasks = computed(() => crmStore.getTasks(slug.value))
const isLoading = computed(() => crmStore.isLoading)
const { normalizeError } = useApiError()
const { $errorLogger } = useNuxtApp()

const boardChildren = ref<CrmBoardChild[]>([])
const draggingChildId = ref<string | null>(null)
const hoveredColumn = ref<KanbanStatus | null>(null)
const errorMessage = ref('')

const KANBAN_COLUMNS: Array<{ key: KanbanStatus, title: string, subtitle: string }> = [
  { key: 'pending', title: 'Backlog', subtitle: 'Pending requests' },
  { key: 'progress', title: 'In Progress', subtitle: 'Currently in progress' },
  { key: 'review', title: 'In Review', subtitle: 'Waiting for review' },
  { key: 'done', title: 'Done', subtitle: 'Completed requests' },
]

const flattenChildren = (taskList: CrmTask[]): CrmBoardChild[] => taskList.flatMap(task =>
  task.children.map(child => ({
    ...child,
    taskTitle: task.title,
    projectName: task.projectName,
    sprintName: task.sprintName,
  })),
)

watch(tasks, (value) => {
  boardChildren.value = flattenChildren(value)
}, { immediate: true, deep: true })

const boardByStatus = computed(() => {
  const map: Record<KanbanStatus, CrmBoardChild[]> = {
    pending: [],
    progress: [],
    review: [],
    done: [],
  }

  for (const child of boardChildren.value) {
    if (child.status === 'progress' || child.status === 'review' || child.status === 'done') {
      map[child.status].push(child)
      continue
    }

    map.pending.push(child)
  }

  return map
})

const loadData = async () => {
  if (!slug.value) {
    return
  }

  errorMessage.value = ''

  try {
    await crmStore.fetchTasks(slug.value, true)
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

const onDragStart = (id: string) => {
  draggingChildId.value = id
}

const onDragEnd = () => {
  draggingChildId.value = null
  hoveredColumn.value = null
}

const onDropColumn = async (status: KanbanStatus) => {
  if (!slug.value || !draggingChildId.value) {
    return
  }

  const childId = draggingChildId.value
  const previousChild = boardChildren.value.find(item => item.id === childId)
  if (!previousChild || previousChild.status === status) {
    onDragEnd()
    return
  }

  const previousStatus = previousChild.status
  boardChildren.value = boardChildren.value.map(item =>
    item.id === childId
      ? { ...item, status }
      : item,
  )

  try {
    await crmStore.updateTaskRequestStatus(slug.value, childId, { status })
  }
  catch (error) {
    boardChildren.value = boardChildren.value.map(item =>
      item.id === childId
        ? { ...item, status: previousStatus }
        : item,
    )

    const normalized = normalizeError(error, {
      domain: 'platform.crm.tasks',
      action: 'update-status',
      fallbackKey: 'platform.crm.tasks.errors.updateStatus',
    })
    $errorLogger(error, { area: 'platform.crm.tasks', action: 'update-status', status: normalized.status })
    errorMessage.value = normalized.message
  }
  finally {
    onDragEnd()
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

    <section class="crm-kanban-page">
      <div class="d-flex align-center justify-space-between mb-6 flex-wrap ga-2">
        <div>
          <h1 class="text-h4 font-weight-bold mb-1">Tasks Kanban</h1>
          <p class="text-body-1 text-medium-emphasis mb-0">Drag & drop task requests between columns to update their status.</p>
        </div>
        <v-btn color="primary" variant="elevated" :loading="isLoading" @click="loadData">Refresh board</v-btn>
      </div>

      <v-alert v-if="errorMessage" type="error" variant="tonal" class="mb-4">
        {{ errorMessage }}
      </v-alert>

      <div class="kanban-board">
        <div
          v-for="column in KANBAN_COLUMNS"
          :key="column.key"
          class="kanban-column"
          :class="{ 'is-hovered': hoveredColumn === column.key }"
          @dragover.prevent="hoveredColumn = column.key"
          @dragleave="hoveredColumn = null"
          @drop.prevent="onDropColumn(column.key)"
        >
          <div class="kanban-column__header">
            <h2 class="text-h5 font-weight-bold mb-1">{{ column.title }}</h2>
            <p class="text-body-2 text-medium-emphasis mb-0">{{ column.subtitle }}</p>
            <v-chip class="mt-3" size="small" color="primary" variant="tonal">{{ boardByStatus[column.key].length }} cards</v-chip>
          </div>

          <div class="kanban-column__body">
            <v-card
              v-for="child in boardByStatus[column.key]"
              :key="child.id"
              class="kanban-card"
              rounded="xl"
              draggable="true"
              @dragstart="onDragStart(child.id)"
              @dragend="onDragEnd"
            >
              <v-card-text>
                <div class="d-flex align-center justify-space-between mb-3">
                  <v-chip size="small" :color="column.key === 'done' ? 'success' : 'primary'" variant="flat" class="text-uppercase">
                    {{ child.status }}
                  </v-chip>
                  <span class="text-caption text-medium-emphasis">#{{ child.id.slice(0, 8) }}</span>
                </div>

                <p class="text-subtitle-1 font-weight-bold mb-2">{{ child.title }}</p>
                <p class="text-body-2 text-medium-emphasis mb-3">{{ child.taskTitle }}</p>

                <div class="d-flex align-center justify-space-between">
                  <div>
                    <p class="text-caption mb-0">{{ child.projectName }}</p>
                    <p class="text-caption text-medium-emphasis mb-0">{{ child.sprintName }}</p>
                  </div>
                  <v-icon size="18" icon="mdi-drag" class="text-medium-emphasis" />
                </div>
              </v-card-text>
            </v-card>

            <div v-if="boardByStatus[column.key].length === 0" class="kanban-empty">
              Drop cards here
            </div>
          </div>
        </div>
      </div>
    </section>
  </PlatformSplitLayout>
</template>

<style scoped>
.crm-kanban-page {
  background: linear-gradient(180deg, #f0f3f9 0%, #e7ebf3 100%);
  border-radius: 24px;
  padding: 20px;
}

.kanban-board {
  display: grid;
  grid-template-columns: repeat(4, minmax(260px, 1fr));
  gap: 18px;
}

.kanban-column {
  background: #dfe4ee;
  border-radius: 18px;
  min-height: 520px;
  padding: 14px;
  transition: all 180ms ease;
  border: 2px solid transparent;
}

.kanban-column.is-hovered {
  border-color: #3f72d8;
  box-shadow: 0 0 0 4px rgba(63, 114, 216, 0.12);
}

.kanban-column__header {
  padding: 6px 6px 10px;
}

.kanban-column__body {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.kanban-card {
  background: #fff;
  box-shadow: 0 10px 24px rgba(24, 39, 75, 0.08);
  transition: transform 140ms ease, box-shadow 140ms ease;
  cursor: grab;
}

.kanban-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 14px 28px rgba(24, 39, 75, 0.12);
}

.kanban-empty {
  border: 2px dashed rgba(35, 55, 95, 0.25);
  border-radius: 16px;
  min-height: 80px;
  display: grid;
  place-items: center;
  color: rgba(35, 55, 95, 0.65);
  font-size: 0.95rem;
}

@media (max-width: 1280px) {
  .kanban-board {
    grid-template-columns: repeat(2, minmax(260px, 1fr));
  }
}

@media (max-width: 760px) {
  .kanban-board {
    grid-template-columns: 1fr;
  }
}
</style>
