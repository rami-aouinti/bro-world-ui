<script setup lang="ts">
import PlatformSidebarNav from '~/components/platform/PlatformSidebarNav.vue'
import PlatformSplitLayout from '~/components/platform/PlatformSplitLayout.vue'
import { getCrmNav } from '~/data/platform-nav'
import { useCrmApi } from '~/composables/api/useCrmApi'
import type { CrmGithubSyncJob } from '~/types/api/crm'

definePageMeta({ public: true, requiresAuth: false })

const route = useRoute()
const slug = computed(() => String(route.params.slug ?? ''))
const { isOwner } = usePlatformPermissions(slug)
const crmNav = computed(() => getCrmNav(slug.value, isOwner.value))
const crmApi = useCrmApi()

const form = reactive({
  token: '',
  owner: '',
  issueTarget: 'task' as 'task' | 'task-request',
  createPublicProject: true,
  dryRun: false,
})

const jobId = ref('')
const jobStatus = ref<CrmGithubSyncJob | null>(null)
const loadingBootstrap = ref(false)
const loadingStatus = ref(false)
const errorMessage = ref('')

const queueBootstrap = async () => {
  if (!slug.value) return

  loadingBootstrap.value = true
  errorMessage.value = ''

  try {
    const response = await crmApi.queueGithubBootstrapSync(slug.value, {
      token: form.token.trim(),
      owner: form.owner.trim(),
      issueTarget: form.issueTarget,
      createPublicProject: form.createPublicProject,
      dryRun: form.dryRun,
    })
    jobId.value = response.jobId
    await loadJobStatus()
  }
  catch {
    errorMessage.value = 'Impossible de lancer la synchronisation GitHub.'
  }
  finally {
    loadingBootstrap.value = false
  }
}

const loadJobStatus = async () => {
  if (!slug.value || !jobId.value) return

  loadingStatus.value = true
  errorMessage.value = ''

  try {
    jobStatus.value = await crmApi.getGithubSyncJobStatus(slug.value, jobId.value)
  }
  catch {
    errorMessage.value = 'Impossible de récupérer le statut du job de synchronisation.'
    jobStatus.value = null
  }
  finally {
    loadingStatus.value = false
  }
}
</script>

<template>
  <PlatformSplitLayout>
    <template #sidebar>
      <PlatformSidebarNav
        title="platform.crm.sidebar.title"
        subtitle="platform.common.sidebar.application"
        :subtitle-values="{ slug }"
        :items="crmNav"
      />
    </template>

    <section class="d-flex flex-column ga-6">
      <v-card rounded="xl" variant="outlined">
        <v-card-title>Synchronisation GitHub CRM</v-card-title>
        <v-card-text class="d-flex flex-column ga-3">
          <v-alert v-if="errorMessage" type="error" variant="tonal">{{ errorMessage }}</v-alert>

          <v-text-field v-model="form.owner" label="GitHub owner" variant="outlined" hide-details="auto" />
          <v-text-field v-model="form.token" label="GitHub token" type="password" variant="outlined" hide-details="auto" />
          <v-select
            v-model="form.issueTarget"
            :items="[{ title: 'Task', value: 'task' }, { title: 'Task Request', value: 'task-request' }]"
            label="Issue target"
            variant="outlined"
            hide-details="auto"
          />
          <v-checkbox v-model="form.createPublicProject" label="Créer un projet public" hide-details />
          <v-checkbox v-model="form.dryRun" label="Dry run" hide-details />

          <div class="d-flex ga-3">
            <v-btn color="primary" prepend-icon="mdi-play" :loading="loadingBootstrap" @click="queueBootstrap">
              Lancer la synchronisation
            </v-btn>
            <v-btn variant="outlined" prepend-icon="mdi-refresh" :disabled="!jobId" :loading="loadingStatus" @click="loadJobStatus">
              Rafraîchir le statut
            </v-btn>
          </div>
        </v-card-text>
      </v-card>

      <v-card rounded="xl" variant="outlined">
        <v-card-title>Statut du job</v-card-title>
        <v-card-text>
          <v-alert v-if="!jobId" type="info" variant="tonal">Aucun job lancé pour le moment.</v-alert>
          <v-skeleton-loader v-else-if="loadingStatus" type="list-item-three-line" />
          <v-list v-else-if="jobStatus" lines="two" border rounded>
            <v-list-item title="Job ID" :subtitle="jobStatus.id" />
            <v-list-item title="Statut" :subtitle="jobStatus.status" />
            <v-list-item title="Owner" :subtitle="jobStatus.owner" />
            <v-list-item title="Projets créés" :subtitle="String(jobStatus.projectsCreated)" />
            <v-list-item title="Repositories liés" :subtitle="String(jobStatus.reposAttached)" />
            <v-list-item title="Issues importées" :subtitle="String(jobStatus.issuesImported)" />
            <v-list-item title="Erreurs" :subtitle="String(jobStatus.errorsCount)" />
          </v-list>
        </v-card-text>
      </v-card>
    </section>
  </PlatformSplitLayout>
</template>
