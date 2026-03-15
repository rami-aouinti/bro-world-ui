<script setup lang="ts">
import PlatformSidebarNav from '~/components/platform/PlatformSidebarNav.vue'
import PlatformSplitLayout from '~/components/platform/PlatformSplitLayout.vue'
import { getCrmNav } from '~/data/platform-nav'
import { useCrmStore } from '~/stores/crm'
import type { CrmProject } from '~/types/api/crm'

definePageMeta({ public: true, requiresAuth: false })

const route = useRoute()
const slug = computed(() => String(route.params.slug ?? ''))
const projectId = computed(() => String(route.params.id ?? ''))
const { isOwner } = usePlatformPermissions(slug)
const crmNav = computed(() => getCrmNav(slug.value, isOwner.value))
const crmStore = useCrmStore()

const project = ref<CrmProject | null>(null)
const selectedUserId = ref('')
const isLoading = ref(false)
const isAssigning = ref(false)
const errorMessage = ref('')

const users = computed(() => crmStore.getPublicUsers())
const userOptions = computed(() => users.value.map(user => ({ title: `${user.firstName} ${user.lastName}`, value: user.id, photo: user.photo, email: user.email })))
const projectStatusColor = computed(() => {
  const status = String(project.value?.status ?? '').toLowerCase()
  if (status.includes('done') || status.includes('completed')) {
    return 'success'
  }
  if (status.includes('progress') || status.includes('active')) {
    return 'info'
  }
  if (status.includes('blocked') || status.includes('late')) {
    return 'error'
  }

  return 'warning'
})

const formatDate = (date?: string | null) => {
  if (!date) {
    return 'N/A'
  }

  return new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(date))
}

const formatFileSize = (size: number) => {
  if (size <= 0) {
    return '0 B'
  }

  const units = ['B', 'KB', 'MB', 'GB']
  const exponent = Math.min(Math.floor(Math.log(size) / Math.log(1024)), units.length - 1)
  const value = size / 1024 ** exponent

  return `${value.toFixed(value >= 10 ? 0 : 1)} ${units[exponent]}`
}

const loadProject = async () => {
  if (!slug.value || !projectId.value) {
    return
  }

  isLoading.value = true
  errorMessage.value = ''

  try {
    await crmStore.fetchPublicUsers()
    project.value = await crmStore.fetchProjectById(slug.value, projectId.value)
  }
  catch {
    errorMessage.value = 'Unable to load project details.'
  }
  finally {
    isLoading.value = false
  }
}

const assignProjectUser = async () => {
  if (!slug.value || !project.value || !selectedUserId.value) {
    return
  }

  isAssigning.value = true
  try {
    await crmStore.assignProjectAssignee(slug.value, project.value.id, selectedUserId.value)
    await loadProject()
    selectedUserId.value = ''
  }
  finally {
    isAssigning.value = false
  }
}

const removeProjectUser = async (userId?: string) => {
  if (!slug.value || !project.value || !userId) {
    return
  }

  isAssigning.value = true
  try {
    await crmStore.removeProjectAssignee(slug.value, project.value.id, userId)
    await loadProject()
  }
  finally {
    isAssigning.value = false
  }
}

onMounted(loadProject)
</script>

<template>
  <PlatformSplitLayout>
    <template #sidebar>
      <PlatformSidebarNav title="platform.crm.sidebar.title" subtitle="platform.common.sidebar.application" :subtitle-values="{ slug }" :items="crmNav" />
    </template>

    <section>
      <div class="d-flex align-center justify-space-between mb-4 ga-2 flex-wrap">
        <div>
          <h1 class="text-h5 font-weight-bold mb-1">Project detail</h1>
          <p class="text-body-2 text-medium-emphasis mb-0">{{ projectId }}</p>
        </div>
        <v-btn variant="outlined" :loading="isLoading" @click="loadProject">Refresh</v-btn>
      </div>

      <v-alert v-if="errorMessage" type="error" variant="tonal" class="mb-4">{{ errorMessage }}</v-alert>

      <template v-if="isLoading && !project">
        <v-skeleton-loader type="article, article, article" class="mb-4" />
        <v-skeleton-loader type="heading, list-item-three-line, list-item-three-line" />
      </template>

      <div v-if="project" class="project-detail-grid">
        <v-expand-transition>
          <v-card rounded="xl" class="detail-card">
            <v-card-text>
              <div class="d-flex justify-space-between align-start ga-2 mb-4 flex-wrap">
                <div>
                  <p class="text-caption text-medium-emphasis mb-1">Name</p>
                  <p class="text-h6 font-weight-bold mb-1">{{ project.name }}</p>
                  <p class="text-body-2 text-medium-emphasis mb-0">Code: {{ project.code || 'N/A' }}</p>
                </div>
                <v-chip :color="projectStatusColor" variant="tonal">{{ project.status }}</v-chip>
              </div>

              <p class="text-caption text-medium-emphasis mb-1">Description</p>
              <p class="text-body-2 mb-4">{{ project.description || 'N/A' }}</p>

              <v-timeline density="compact" side="end" line-inset="8">
                <v-timeline-item dot-color="primary" size="small">
                  <div class="text-caption text-medium-emphasis">Started at</div>
                  <div class="text-body-2">{{ formatDate(project.startedAt) }}</div>
                </v-timeline-item>
                <v-timeline-item dot-color="warning" size="small">
                  <div class="text-caption text-medium-emphasis">Due at</div>
                  <div class="text-body-2">{{ formatDate(project.dueAt) }}</div>
                </v-timeline-item>
              </v-timeline>
            </v-card-text>
          </v-card>
        </v-expand-transition>

        <v-expand-transition>
          <v-card rounded="xl" class="detail-card">
            <v-card-title>Attachments</v-card-title>
            <v-card-text>
              <v-list v-if="(project.attachments || []).length" lines="two">
                <v-list-item v-for="file in project.attachments || []" :key="`${file.url}-${file.uploadedAt}`" :title="file.originalName" :subtitle="`${file.mimeType} • ${formatFileSize(file.size)}`" :href="file.url" target="_blank">
                  <template #append>
                    <span class="text-caption text-medium-emphasis">{{ formatDate(file.uploadedAt) }}</span>
                  </template>
                </v-list-item>
              </v-list>
              <p v-else class="text-body-2 text-medium-emphasis">No attachments available.</p>
            </v-card-text>
          </v-card>
        </v-expand-transition>

        <v-expand-transition>
          <v-card rounded="xl" class="detail-card">
            <v-card-title>Wiki pages</v-card-title>
            <v-card-text>
              <v-expansion-panels v-if="(project.wikiPages || []).length" variant="accordion">
                <v-expansion-panel v-for="wiki in project.wikiPages || []" :key="wiki.id">
                  <v-expansion-panel-title>
                    <div>
                      <p class="text-subtitle-2 font-weight-bold mb-1">{{ wiki.title }}</p>
                      <p class="text-caption text-medium-emphasis mb-0">Created {{ formatDate(wiki.createdAt) }}</p>
                    </div>
                  </v-expansion-panel-title>
                  <v-expansion-panel-text>
                    <p class="text-body-2 wiki-content">{{ wiki.content }}</p>
                  </v-expansion-panel-text>
                </v-expansion-panel>
              </v-expansion-panels>
              <p v-else class="text-body-2 text-medium-emphasis">No wiki pages available.</p>
            </v-card-text>
          </v-card>
        </v-expand-transition>

        <v-expand-transition>
          <v-card rounded="xl" class="detail-card">
            <v-card-title>Assignees</v-card-title>
            <v-card-text>
              <div class="d-flex ga-2 align-center flex-wrap mb-4">
                <v-select v-model="selectedUserId" label="Ajouter un user" :items="userOptions" item-title="title" item-value="value" class="assignee-select" hide-details>
                  <template #item="{ item, props }">
                    <v-list-item v-bind="props" :subtitle="item.raw.email">
                      <template #prepend><v-avatar size="28" :image="item.raw.photo || undefined" /></template>
                    </v-list-item>
                  </template>
                </v-select>
                <v-btn color="primary" :loading="isAssigning" @click="assignProjectUser">Assign user</v-btn>
              </div>

              <TransitionGroup name="chips" tag="div" class="d-flex flex-wrap ga-2">
                <v-chip v-for="assignee in project.assignees || []" :key="assignee.id || assignee.email" closable @click:close="removeProjectUser(assignee.id)">
                  <v-avatar start size="20" :image="assignee.photo || undefined" />
                  {{ [assignee.firstName, assignee.lastName].filter(Boolean).join(' ') || assignee.email || assignee.id }}
                </v-chip>
              </TransitionGroup>
              <p v-if="!(project.assignees || []).length" class="text-body-2 text-medium-emphasis mt-3">No assignees yet.</p>
            </v-card-text>
          </v-card>
        </v-expand-transition>
      </div>
    </section>
  </PlatformSplitLayout>
</template>

<style scoped>
.project-detail-grid {
  display: grid;
  gap: 16px;
}

.detail-card {
  animation: card-enter 0.45s ease;
}

.assignee-select { min-width: 320px; }

.wiki-content {
  white-space: pre-line;
}

.chips-enter-active,
.chips-leave-active {
  transition: all 0.2s ease;
}

.chips-enter-from,
.chips-leave-to {
  opacity: 0;
  transform: translateY(8px);
}

@keyframes card-enter {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
