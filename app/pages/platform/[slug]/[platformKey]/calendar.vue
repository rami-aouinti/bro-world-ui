<script setup lang="ts">
import PlatformSidebarNav from '~/components/platform/PlatformSidebarNav.vue'
import PlatformSplitLayout from '~/components/platform/PlatformSplitLayout.vue'
import { useCalendarEventsApi } from '~/composables/api/useCalendarEventsApi'
import { getCrmNav, getRecruitNav, getSchoolNav, getShopNav } from '~/data/platform-nav'
import type { CalendarEventRead } from '~/types/api/calendar'
import type { PlatformNavItem } from '~/data/platform-nav'

definePageMeta({ public: true, requiresAuth: false })

const route = useRoute()
const slug = computed(() => String(route.params.slug ?? ''))
const platformKey = computed(() => String(route.params.platformKey ?? '').toLowerCase())
const { isOwner } = usePlatformPermissions(slug)
const { isAuthenticated } = useAuth()
const calendarApi = useCalendarEventsApi()

const navItems = computed<PlatformNavItem[]>(() => {
  if (platformKey.value === 'shop') return getShopNav(slug.value, isOwner.value)
  if (platformKey.value === 'recruit') return getRecruitNav(slug.value, isOwner.value, isAuthenticated.value)
  if (platformKey.value === 'school') return getSchoolNav(slug.value, isOwner.value)
  return getCrmNav(slug.value, isOwner.value)
})

const { data: events, pending, error, execute: loadCalendar } = useAsyncData(
  () => `application-calendar-${slug.value}-${isAuthenticated.value ? 'private' : 'public'}`,
  async () => {
    return calendarApi.list(slug.value, isAuthenticated.value)
  },
  {
    watch: [slug, isAuthenticated],
    server: false,
    immediate: false,
    default: () => [] as CalendarEventRead[],
  },
)

onMounted(() => {
  void loadCalendar()
})
</script>

<template>
  <PlatformSplitLayout>
    <template #sidebar>
      <PlatformSidebarNav
        title="Calendar"
        subtitle="platform.common.sidebar.application"
        :subtitle-values="{ slug }"
        :items="navItems"
      />
    </template>

    <section>
      <v-alert v-if="error" type="error" variant="tonal" class="mb-4">Impossible de charger le calendrier de cette platform.</v-alert>
      <v-progress-linear v-else-if="pending" color="primary" indeterminate class="mb-4" />

      <template v-else>
        <v-alert v-if="!events?.length" type="info" variant="tonal">
          Aucun événement trouvé pour cette application.
        </v-alert>

        <v-list v-else lines="two" density="comfortable" class="rounded-lg border">
          <v-list-item
            v-for="event in events"
            :key="event.id"
            :title="event.title"
            :subtitle="`${new Date(event.startAt).toLocaleString()} → ${new Date(event.endAt).toLocaleString()}`"
          >
            <template #append>
              <v-chip size="small" variant="tonal">{{ event.status }}</v-chip>
            </template>
          </v-list-item>
        </v-list>
      </template>
    </section>
  </PlatformSplitLayout>
</template>
