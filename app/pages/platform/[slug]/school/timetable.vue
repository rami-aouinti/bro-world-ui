<script setup lang="ts">
import PlatformSidebarNav from '~/components/platform/PlatformSidebarNav.vue'
import PlatformSplitLayout from '~/components/platform/PlatformSplitLayout.vue'
import PlatformHeroHeader from '~/components/platform/sections/PlatformHeroHeader.vue'
import PlatformTicketBoard from '~/components/platform/sections/PlatformTicketBoard.vue'
import { platformProposals } from '~/data/platform-enhanced'
import type { NavItem } from '~/data/platform-demo'
import { getSchoolNav } from '~/data/platform-nav'

definePageMeta({ public: true, requiresAuth: false })
const route = useRoute()
const slug = computed(() => String(route.params.slug ?? ''))
const { isOwner } = usePlatformPermissions(slug)
const timetable = [
  { day: 'Lundi', slots: '09:00-12:00 · Data Lab', room: 'Lab-2' },
  { day: 'Mardi', slots: '13:00-16:00 · UX Studio', room: 'B-103' },
  { day: 'Jeudi', slots: '10:00-12:00 · Product Strategy', room: 'C-220' },
]
const navItems = computed(() => getSchoolNav(slug.value, isOwner.value))
</script>

<template>
  <PlatformSplitLayout>
    <template #sidebar><PlatformSidebarNav title="platform.school.sidebar.timetable" subtitle="platform.common.sidebar.application" :subtitle-values="{ slug }" :items="navItems" /></template>
    <section>
      <PlatformHeroHeader title="platform.school.hero.timetable.title" subtitle="platform.school.hero.timetable.subtitle" cta="platform.school.hero.timetable.cta" />
      <v-row>
        <v-col v-for="item in timetable" :key="item.day" cols="12" md="4">
          <v-card rounded="xl" variant="outlined">
            <v-card-text>
              <p class="font-weight-bold">{{ item.day }}</p>
              <p class="text-body-2">{{ item.slots }}</p>
              <p class="text-caption text-medium-emphasis">Salle {{ item.room }}</p>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
      <PlatformTicketBoard class="mt-5" title="Backlog School" :tickets="platformProposals.school" />
    </section>
  </PlatformSplitLayout>
</template>
