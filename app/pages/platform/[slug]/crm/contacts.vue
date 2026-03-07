<script setup lang="ts">
import PlatformSidebarNav from '~/components/platform/PlatformSidebarNav.vue'
import PlatformSplitLayout from '~/components/platform/PlatformSplitLayout.vue'
import PlatformHeroHeader from '~/components/platform/sections/PlatformHeroHeader.vue'
import PlatformMediaCard from '~/components/platform/sections/PlatformMediaCard.vue'
import PlatformTicketBoard from '~/components/platform/sections/PlatformTicketBoard.vue'
import { crmTickets, recruitCandidates } from '~/data/platform-enhanced'
import type { NavItem } from '~/data/platform-demo'
import { getCrmNav } from '~/data/platform-nav'

definePageMeta({ public: true, requiresAuth: false })
const route = useRoute()
const slug = computed(() => String(route.params.slug ?? ''))
const { isOwner } = usePlatformPermissions(slug)

const navItems = computed(() => getCrmNav(slug.value, isOwner.value))
</script>

<template>
  <PlatformSplitLayout>
    <template #sidebar><PlatformSidebarNav title="platform.crm.sidebar.title" subtitle="platform.common.sidebar.application" :subtitle-values="{ slug }" :items="navItems" /></template>
    <section>
      <PlatformHeroHeader title="platform.crm.hero.contacts.title" subtitle="platform.crm.hero.contacts.subtitle" cta="platform.crm.hero.contacts.cta" />
      <v-row>
        <v-col v-for="candidate in recruitCandidates" :key="candidate.id" cols="12" md="4">
          <PlatformMediaCard :item="candidate" />
        </v-col>
      </v-row>
      <PlatformTicketBoard class="mt-6" title="Tickets CRM prioritaires" :tickets="crmTickets" />
    </section>
  </PlatformSplitLayout>
</template>
