<script setup lang="ts">
import PlatformSidebarNav from '~/components/platform/PlatformSidebarNav.vue'
import PlatformSplitLayout from '~/components/platform/PlatformSplitLayout.vue'
import PlatformHeroHeader from '~/components/platform/sections/PlatformHeroHeader.vue'
import { crmTickets } from '~/data/platform-enhanced'
import type { NavItem } from '~/data/platform-demo'
import { getCrmNav } from '~/data/platform-nav'

definePageMeta({ public: true, requiresAuth: false })
const route = useRoute()
const slug = computed(() => String(route.params.slug ?? ''))
const { isOwner } = usePlatformPermissions(slug)
const automations = [
  { name: 'Welcome sequence', trigger: 'New lead', status: 'Active', impact: '+18% activation' },
  { name: 'Deal follow-up', trigger: 'Quote open > 3 days', status: 'Active', impact: '+11% conversion' },
  { name: 'Renewal alert', trigger: 'J-45 fin contrat', status: 'Pilot', impact: '-7% churn' },
]

const navItems = computed(() => getCrmNav(slug.value, isOwner.value))
</script>

<template>
  <PlatformSplitLayout>
    <template #sidebar><PlatformSidebarNav title="platform.crm.sidebar.automation" subtitle="platform.common.sidebar.application" :subtitle-values="{ slug }" :items="navItems" /></template>
    <section>
      <PlatformHeroHeader title="platform.crm.hero.automation.title" subtitle="platform.crm.hero.automation.subtitle" cta="platform.crm.hero.automation.cta" />
      <v-row>
        <v-col v-for="item in automations" :key="item.name" cols="12" md="4">
          <v-card rounded="xl" variant="outlined" class="h-100">
            <v-card-text>
              <p class="font-weight-bold mb-1">{{ item.name }}</p>
              <p class="text-body-2 text-medium-emphasis">Trigger: {{ item.trigger }}</p>
              <div class="d-flex justify-space-between mt-3">
                <v-chip size="small" color="success" variant="tonal">{{ item.status }}</v-chip>
                <v-chip size="small" color="primary" variant="outlined">{{ item.impact }}</v-chip>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
      <v-alert class="mt-5" variant="tonal" type="info">{{ crmTickets[0].description }}</v-alert>
    </section>
  </PlatformSplitLayout>
</template>
