<script setup lang="ts">
import PlatformSidebarNav from '~/components/platform/PlatformSidebarNav.vue'
import PlatformSplitLayout from '~/components/platform/PlatformSplitLayout.vue'
import PlatformHeroHeader from '~/components/platform/sections/PlatformHeroHeader.vue'
import PlatformTicketBoard from '~/components/platform/sections/PlatformTicketBoard.vue'
import { crmTickets } from '~/data/platform-enhanced'
import { crmStats } from '~/data/platform-demo'
import { getCrmNav } from '~/data/platform-nav'

definePageMeta({ public: true, requiresAuth: false })
const route = useRoute()
const slug = computed(() => String(route.params.slug ?? ''))
const { isOwner } = usePlatformPermissions(slug)
const navItems = computed(() => getCrmNav(slug.value, isOwner.value))
</script>

<template>
  <PlatformSplitLayout>
    <template #sidebar><PlatformSidebarNav title="platform.crm.sidebar.reports" subtitle="platform.common.sidebar.application" :subtitle-values="{ slug }" :items="navItems" /></template>
    <section>
      <PlatformHeroHeader title="platform.crm.hero.reports.title" subtitle="platform.crm.hero.reports.subtitle" cta="platform.crm.hero.reports.cta" />
      <v-row class="mb-2">
        <v-col v-for="stat in crmStats" :key="stat.label" cols="12" sm="6" lg="3">
          <v-card rounded="xl" variant="tonal" :color="stat.color || 'primary'">
            <v-card-text>
              <div class="text-caption mb-1">{{ stat.label }}</div>
              <div class="text-h5 font-weight-bold">{{ stat.value }}</div>
              <div class="text-caption">{{ stat.trend }}</div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
      <PlatformTicketBoard title="Recommended actions" :tickets="crmTickets" />
    </section>
  </PlatformSplitLayout>
</template>
