<script setup lang="ts">
import PlatformSplitLayout from '~/components/platform/PlatformSplitLayout.vue'
import { useCurrentUserStore } from '~/stores/currentUser'
import type { UserApplication } from '~/types/api/user'

definePageMeta({
  public: false,
  requiresAuth: true,
})

const currentUser = useCurrentUserStore()

const isLoading = ref(true)
const errorMessage = ref('')
const applications = ref<UserApplication[]>([])

const applicationStatusColor = (status: string) => {
  switch (status) {
    case 'active':
      return 'success'
    case 'maintenance':
      return 'warning'
    case 'disabled':
      return 'error'
    default:
      return 'default'
  }
}

const loadApplications = async () => {
  isLoading.value = true
  errorMessage.value = ''

  try {
    applications.value = await currentUser.fetchMyApplications()
  }
  catch (error) {
    console.error(error)
    errorMessage.value = 'Impossible de charger vos applications.'
  }
  finally {
    isLoading.value = false
  }
}

onMounted(async () => {
  await loadApplications()
})
</script>

<template>
  <PlatformSplitLayout>
    <template #sidebar>
      <v-card class="pa-5" elevation="2" rounded="xl">
        <h6 class="text-h6 font-weight-bold mb-2">My applications</h6>
        <p class="text-body-2 text-medium-emphasis mb-0">
          Retrouvez toutes les applications que vous avez créées.
        </p>
      </v-card>
    </template>

    <section>
      <h1 class="text-h5 font-weight-bold mb-4">My applications</h1>

      <v-skeleton-loader v-if="isLoading" type="list-item-three-line@6" />
      <v-alert v-else-if="errorMessage" type="error" variant="tonal" class="mb-4">{{ errorMessage }}</v-alert>

      <v-row v-else-if="applications.length">
        <v-col v-for="application in applications" :key="application.id" cols="12" md="6">
          <v-card class="h-100 pa-4" elevation="1" rounded="xl">
            <div class="d-flex align-center justify-space-between ga-2 mb-2">
              <h2 class="text-subtitle-1 font-weight-bold mb-0">{{ application.title }}</h2>
              <v-chip size="small" :color="applicationStatusColor(application.status)" variant="tonal">{{ application.status }}</v-chip>
            </div>

            <p class="text-body-2 text-medium-emphasis mb-2">{{ application.platformName }} • {{ application.slug }}</p>
            <p class="text-body-2 mb-3">{{ application.description || 'Aucune description.' }}</p>

            <div class="d-flex align-center justify-space-between">
              <v-chip size="small" :color="application.private ? 'warning' : 'success'" variant="tonal">
                {{ application.private ? 'Private' : 'Public' }}
              </v-chip>
              <span class="text-caption text-medium-emphasis">{{ application.updatedAt || application.createdAt }}</span>
            </div>
          </v-card>
        </v-col>
      </v-row>

      <v-card v-else class="pa-5" rounded="xl" variant="outlined">
        <p class="mb-0 text-body-2 text-medium-emphasis">Vous n’avez encore créé aucune application.</p>
      </v-card>
    </section>
  </PlatformSplitLayout>
</template>
