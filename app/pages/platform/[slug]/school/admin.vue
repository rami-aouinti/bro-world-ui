<script setup lang="ts">
import PlatformSplitLayout from '~/components/platform/PlatformSplitLayout.vue'
import PlatformSidebarNav from '~/components/platform/PlatformSidebarNav.vue'
import { schoolClasses } from '~/data/platform-demo'
import { getSchoolNav } from '~/data/platform-nav'

definePageMeta({ public: true, requiresAuth: false })
const route = useRoute()
const slug = computed(() => String(route.params.slug ?? ''))
const page = computed(() => route.path.split('/').pop() || 'home')
const platformPermissions = usePlatformPermissions(slug)
const { isOwner } = platformPermissions
const navItems = computed(() => getSchoolNav(slug.value, isOwner.value))
const accessDenied = ref(false)

onMounted(async () => {
  await platformPermissions.resolveApplication()

  if (!platformPermissions.canAccessAdmin.value) {
    accessDenied.value = true

    setTimeout(() => {
      navigateTo(platformPermissions.getDeniedRedirectPath('school'))
    }, 1200)
  }
})
</script>

<template>
  <PlatformSplitLayout>
    <template #sidebar><PlatformSidebarNav title="platform.school.sidebar.title" subtitle="platform.common.sidebar.application" :subtitle-values="{ slug }" :items="navItems" /></template>
    <section>
      <v-alert v-if="accessDenied" type="error" variant="tonal" class="mb-4">
        Accès refusé à l’espace admin School. Redirection en cours…
      </v-alert>
      <template v-else>
        <h1 class="text-h5 font-weight-bold mb-4 text-capitalize">{{ page }}</h1>
        <v-row>
          <v-col v-for="(classe, idx) in schoolClasses" :key="classe.id" cols="12" md="6">
            <v-card rounded="xl" variant="outlined">
              <v-card-text>
                <p class="font-weight-bold">{{ page === 'certificates' ? `Certificat ${idx + 1}` : classe.name }}</p>
                <p class="text-body-2 text-medium-emphasis">{{ page === 'settings' ? 'Paramètres académiques, permissions, sessions.' : 'Données de démonstration pour enrichir la plateforme school.' }}</p>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </template>
    </section>
  </PlatformSplitLayout>
</template>
