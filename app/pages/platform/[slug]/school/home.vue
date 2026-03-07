<script setup lang="ts">
import PlatformSplitLayout from '~/components/platform/PlatformSplitLayout.vue'
import PlatformSidebarNav from '~/components/platform/PlatformSidebarNav.vue'
import PlatformHeroHeader from '~/components/platform/sections/PlatformHeroHeader.vue'
import { schoolClasses } from '~/data/platform-demo'
import { getSchoolNav } from '~/data/platform-nav'

definePageMeta({ public: true, requiresAuth: false })
const route = useRoute()
const slug = computed(() => String(route.params.slug ?? ''))
const { isOwner } = usePlatformPermissions(slug)
const showAccessDenied = computed(() => route.query.accessDenied === 'admin')
const navItems = computed(() => getSchoolNav(slug.value, isOwner.value))
</script>

<template>
  <PlatformSplitLayout>
    <template #sidebar><PlatformSidebarNav title="School" :subtitle="`Application ${slug}`" :items="navItems" /></template>
    <section>
      <v-alert v-if="showAccessDenied" type="error" variant="tonal" class="mb-4">
        Accès admin refusé : permissions insuffisantes pour cette application.
      </v-alert>
      <PlatformHeroHeader title="Liste des classes" subtitle="Modules pédagogiques, professeurs et progression de cohortes." cta="Nouvelle classe" />
      <v-row>
        <v-col v-for="classe in schoolClasses" :key="classe.id" cols="12" md="6" lg="4">
          <v-card rounded="xl" hover>
            <v-card-text>
              <p class="font-weight-bold">{{ classe.name }}</p>
              <p class="text-body-2 text-medium-emphasis">{{ classe.level }} · {{ classe.room }}</p>
              <p class="text-body-2 mt-2">👩‍🏫 {{ classe.teacher }} · 👨‍🎓 {{ classe.students }} élèves</p>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </section>
  </PlatformSplitLayout>
</template>
