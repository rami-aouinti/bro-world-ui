<script setup lang="ts">
import PlatformSplitLayout from '~/components/platform/PlatformSplitLayout.vue'
import PlatformSidebarNav from '~/components/platform/PlatformSidebarNav.vue'
import { schoolClasses } from '~/data/platform-demo'
import { getSchoolNav } from '~/data/platform-nav'

definePageMeta({ public: true, requiresAuth: false })
const route = useRoute()
const slug = computed(() => String(route.params.slug ?? ''))
const { isOwner } = usePlatformPermissions(slug)
const page = computed(() => route.path.split('/').pop() || 'home')
const navItems = computed(() => getSchoolNav(slug.value, isOwner.value))
</script>

<template>
  <PlatformSplitLayout>
    <template #sidebar><PlatformSidebarNav title="platform.school.sidebar.title" subtitle="platform.common.sidebar.application" :subtitle-values="{ slug }" :items="navItems" /></template>
    <section>
      <h1 class="text-h5 font-weight-bold mb-4 text-capitalize">{{ page }}</h1>
      <v-row>
        <v-col v-for="(classe, idx) in schoolClasses" :key="classe.id" cols="12" md="6">
          <v-card rounded="xl" variant="outlined">
            <v-card-text>
              <p class="font-weight-bold">{{ page === 'certificates' ? `Certificat ${idx + 1}` : classe.name }}</p>
              <p class="text-body-2 text-medium-emphasis">{{ page === 'settings' ? 'Academic settings, permissions, sessions.' : 'Demo data to enrich the school platform.' }}</p>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </section>
  </PlatformSplitLayout>
</template>
