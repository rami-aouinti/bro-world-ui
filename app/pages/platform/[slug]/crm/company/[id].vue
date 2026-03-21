<script setup lang="ts">
import PlatformSidebarNav from '~/components/platform/PlatformSidebarNav.vue'
import PlatformSplitLayout from '~/components/platform/PlatformSplitLayout.vue'
import { getCrmNav } from '~/data/platform-nav'
import { useCrmStore } from '~/stores/crm'
import type { CreateCrmProjectPayload, CrmCompany } from '~/types/api/crm'

definePageMeta({ public: true, requiresAuth: false })

const route = useRoute()
const slug = computed(() => String(route.params.slug ?? ''))
const companyId = computed(() => String(route.params.id ?? ''))
const { isOwner } = usePlatformPermissions(slug)
const crmNav = computed(() => getCrmNav(slug.value, isOwner.value))
const crmStore = useCrmStore()

const company = ref<CrmCompany | null>(null)
const isLoading = ref(false)
const errorMessage = ref('')
const showCreateProjectDialog = ref(false)
const isCreatingProject = ref(false)

const openProjectDetail = (id?: string) => {
  if (!id) {
    return
  }

  navigateTo(`/platform/${slug.value}/crm/project/${id}`)
}

const editCompanyProject = (id?: string) => openProjectDetail(id)

const deleteCompanyProject = async (id?: string) => {
  if (!slug.value || !id) {
    return
  }

  await crmStore.deleteProject(slug.value, id)
  await loadCompany()
}

const projectForm = reactive<CreateCrmProjectPayload>({
  name: '',
  code: '',
  description: '',
  companyId: '' as CreateCrmProjectPayload['companyId'],
  status: 'active',
  startedAt: '',
  dueAt: '',
})

const loadCompany = async () => {
  if (!slug.value || !companyId.value) {
    return
  }

  isLoading.value = true
  errorMessage.value = ''

  try {
    company.value = await crmStore.fetchCompanyById(slug.value, companyId.value)
    projectForm.companyId = companyId.value as CreateCrmProjectPayload['companyId']
  }
  catch {
    errorMessage.value = 'Unable to load company details.'
  }
  finally {
    isLoading.value = false
  }
}


const editCompany = () => navigateTo(`/platform/${slug.value}/crm/company/${companyId.value}`)

const deleteCompany = async () => {
  if (!slug.value || !company.value) {
    return
  }

  await crmStore.deleteCompany(slug.value, company.value.id)
  await navigateTo(`/platform/${slug.value}/crm/companies`)
}

const createProjectForCompany = async () => {
  if (!slug.value || !projectForm.name.trim() || !projectForm.companyId) {
    return
  }

  isCreatingProject.value = true
  try {
    await crmStore.createProject(slug.value, {
      ...projectForm,
      name: projectForm.name.trim(),
    })
    showCreateProjectDialog.value = false
    Object.assign(projectForm, { name: '', code: '', description: '', companyId: companyId.value, status: 'active', startedAt: '', dueAt: '' })
  }
  finally {
    isCreatingProject.value = false
  }
}

onMounted(loadCompany)
</script>

<template>
  <PlatformSplitLayout>
    <template #sidebar>
      <PlatformSidebarNav title="platform.crm.sidebar.title" subtitle="platform.common.sidebar.application" :subtitle-values="{ slug }" :items="crmNav" />
    </template>
    <template #aside>
      <div class="text-center">
        <v-btn color="primary" @click="showCreateProjectDialog = true">Add Project</v-btn>
        <v-row v-if="(company?.projects || []).length" class="mt-4" dense>
          <v-col v-for="project in company.projects || []" :key="project.id" cols="12">
            <v-card variant="outlined" class="project-card mt-3" @click="openProjectDetail(project?.id)">
              <v-card-text>
                <div class="d-flex justify-space-between align-start ga-2">
                  <p class="text-subtitle-2 font-weight-bold mb-1">{{ project?.name }}</p>
                  <v-menu location="bottom end">
                    <template #activator="{ props }">
                      <v-btn v-bind="props" icon="mdi-cog" size="x-small" variant="text" @click.stop />
                    </template>
                    <v-list density="compact">
                      <v-list-item prepend-icon="mdi-pencil" title="Edit" @click.stop="editCompanyProject(project.id)" />
                      <v-list-item prepend-icon="mdi-delete" title="Delete" @click.stop="deleteCompanyProject(project.id)" />
                    </v-list>
                  </v-menu>
                </div>
                <p class="text-caption text-medium-emphasis mb-0">{{ project.id }}</p>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
        <p v-else class="text-body-2 text-medium-emphasis">No projects available.</p>
      </div>
    </template>
    <section>
      <div class="d-flex align-center justify-end mb-4 ga-2 flex-wrap">
        <div class="d-flex ga-2 flex-wrap">

          <v-menu location="bottom end">
            <template #activator="{ props }">
              <v-btn v-bind="props" icon="mdi-cog" size="sm" variant="text" />
            </template>
            <v-list density="compact">
              <v-list-item prepend-icon="mdi-pencil" title="Edit" @click="editCompany" />
              <v-list-item prepend-icon="mdi-delete" title="Delete" @click="deleteCompany" />
            </v-list>
          </v-menu>
          <v-btn variant="text" icon="mdi-refresh" size="sm" :loading="isLoading" @click="loadCompany"></v-btn>
        </div>
      </div>

      <v-alert v-if="errorMessage" type="error" variant="tonal" class="mb-4">{{ errorMessage }}</v-alert>

      <v-skeleton-loader v-if="isLoading && !company" type="article, article, article" class="mb-4" />

      <v-card v-if="company" rounded="xl">
        <v-card-text class="d-grid ga-2">
          <p><strong>Name:</strong> {{ company?.name }}</p>
          <p><strong>Industry:</strong> {{ company?.industry || 'N/A' }}</p>
          <p><strong>Website:</strong> {{ company?.website || 'N/A' }}</p>
          <p><strong>Contact email:</strong> {{ company?.contactEmail || 'N/A' }}</p>
          <p><strong>Phone:</strong> {{ company?.phone || 'N/A' }}</p>
        </v-card-text>
      </v-card>

      <v-dialog v-model="showCreateProjectDialog" max-width="560">
        <v-card>
          <v-card-title>Ajouter un projet à la company</v-card-title>
          <v-card-text>
            <v-text-field v-model="projectForm.name" label="Nom" required />
            <v-text-field v-model="projectForm.code" label="Code" />
            <v-textarea v-model="projectForm.description" label="Description" rows="2" />
            <v-text-field v-model="projectForm.status" label="Status" />
          </v-card-text>
          <v-card-actions>
            <v-spacer />
            <v-btn variant="text" @click="showCreateProjectDialog = false">Annuler</v-btn>
            <v-btn color="primary" :loading="isCreatingProject" @click="createProjectForCompany">Créer</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </section>
  </PlatformSplitLayout>
</template>

<style scoped>
.project-card {
  cursor: pointer;
}
</style>
