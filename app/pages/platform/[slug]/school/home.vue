<script setup lang="ts">
import PlatformSplitLayout from '~/components/platform/PlatformSplitLayout.vue'
import PlatformSidebarNav from '~/components/platform/PlatformSidebarNav.vue'
import PlatformHeroHeader from '~/components/platform/sections/PlatformHeroHeader.vue'
import { schoolClasses, type NavItem } from '~/data/platform-demo'

definePageMeta({ public: true, requiresAuth: false })
const route = useRoute()
const slug = computed(() => String(route.params.slug ?? ''))
const isOwner = computed(() => true)
const navItems = computed<NavItem[]>(() => {
  const base = `/platform/${slug.value}/school`
  const items: NavItem[] = [
    { title: 'Classes', icon: 'mdi-google-classroom', to: `${base}/home` },
    { title: 'Students', icon: 'mdi-account-school-outline', to: `${base}/students` },
    { title: 'Teachers', icon: 'mdi-teach', to: `${base}/teachers` },
    { title: 'Timetable', icon: 'mdi-calendar-clock-outline', to: `${base}/timetable` },
    { title: 'Settings', icon: 'mdi-cog-outline', to: `${base}/settings` },
    { title: 'Certificates', icon: 'mdi-certificate-outline', to: `${base}/certificates` },
    { title: 'Tickets', icon: 'mdi-ticket-confirmation-outline', to: `${base}/tickets` },
  ]
  if (isOwner.value) items.push({ title: 'Admin', icon: 'mdi-shield-crown-outline', to: `${base}/admin` })
  return items
})
</script>

<template>
  <PlatformSplitLayout>
    <template #sidebar><PlatformSidebarNav title="School" :subtitle="`Application ${slug}`" :items="navItems" /></template>
    <section>
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
