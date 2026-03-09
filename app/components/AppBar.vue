<script setup lang="ts">
import UiAvatar from '~/components/ui/UiAvatar.vue'
import { computed, ref } from 'vue'
import { useDisplay, useTheme } from 'vuetify'
import type { NotificationRead } from '~/types/api/notification'
import { useNotificationsApi } from '~/composables/api/useNotificationsApi'

interface NavItem {
  key: string
  to?: string
  icon: string
}

interface ActionNavItem extends NavItem {
  to: string
}

const router = useRouter()
const route = useRoute()
const { t, te, locale, locales, setLocale } = useI18n({ useScope: 'global' })
const authSession = useAuthSessionStore()
const { can, canPermission } = useAccessControl()
const { logout } = useAuth()
const theme = useTheme()

const isProfileMenuOpen = ref(false)
const isNotificationsMenuOpen = ref(false)
const isAuthenticated = computed(() => Boolean(authSession.profile))
const notificationsApi = useNotificationsApi()

const mainHeaderItems = computed<NavItem[]>(() => [
  { key: 'app.navigation.platform', to: '/platform', icon: 'mdi-view-grid-outline' },
  { key: 'Blog', to: '/blog', icon: 'mdi-post-outline' },
  { key: 'app.navigation.about', to: '/about', icon: 'mdi-information-outline' },
  { key: 'app.navigation.contact', to: '/contact', icon: 'mdi-email-outline' },
  { key: 'app.navigation.faq', to: '/faq', icon: 'mdi-frequently-asked-questions' },
])

const adminHeaderItems = computed<NavItem[]>(() => [])

const headerItems = computed<NavItem[]>(() => route.path.startsWith('/admin')
  ? adminHeaderItems.value
  : mainHeaderItems.value)

const actionItems = computed<ActionNavItem[]>(() => {
  if (!isAuthenticated.value) {
    return []
  }

  return [
    { key: 'app.navigation.calendar', to: '/calendar', icon: 'mdi-calendar-month-outline' },
    { key: 'app.navigation.inbox', to: '/inbox', icon: 'mdi-message-processing-outline' },
  ]
})

const { data: latestNotifications } = useAsyncData<NotificationRead[]>(
  'appbar-notifications-latest',
  () => notificationsApi.getNotifications(3, 0),
  {
    default: () => [],
    watch: [isAuthenticated],
    immediate: isAuthenticated.value,
  },
)

const notificationPreviewItems = computed(() => latestNotifications.value ?? [])

const getNotificationAvatarLabel = (notification: NotificationRead) => {
  if (!notification.from) {
    return notification.type
  }

  return `${notification.from.firstName} ${notification.from.lastName}`.trim()
}

const { mdAndUp } = useDisplay()
const isDesktop = computed(() => mdAndUp.value)
const profileName = computed(() => {
  const profile = authSession.profile
  if (!profile) {
    return ''
  }

  return `${profile.firstName} ${profile.lastName}`.trim() || profile.username
})

const isDark = computed(() => theme.global.name.value === 'dark')

const availableLocales = computed(() => locales.value
  .map((item) => {
    if (typeof item === 'string') {
      return {
        code: item,
        name: item.toUpperCase(),
      }
    }

    if (item && typeof item === 'object' && 'code' in item) {
      return {
        code: item.code,
        name: 'name' in item && typeof item.name === 'string' ? item.name : item.code.toUpperCase(),
      }
    }

    return null
  })
  .filter((value): value is { code: string, name: string } => Boolean(value)))

const currentLocaleLabel = computed(() => locale.value.toUpperCase())

const localeFlags: Record<string, string> = {
  en: '🇬🇧',
  fr: '🇫🇷',
}

const getFlag = (code: string) => localeFlags[code] ?? '🌐'

const toggleTheme = () => {
  theme.global.name.value = isDark.value ? 'light' : 'dark'
}

const signOut = async () => {
  if (!canPermission('profile.logout')) {
    return
  }

  await logout()
  await router.push('/login')
}
</script>

<template>
  <v-app-bar
    :class="{ 'blur shadow-blur': !isDark }"
    class="app-bar px-0 border-radius-xl toolbar-content-padding-y-none v-sheet v-toolbar v-toolbar--flat v-app-bar bg-transparent position-sticky top-1 z-index-sticky"
  >
    <v-toolbar-title class="app-bar__brand d-flex align-center ga-3 text-truncate">
      <NuxtLink to="/" class="app-bar__title-link d-flex align-center ga-2">
        <v-icon icon="mdi-earth" size="32" class="app-bar__brand-icon" />
        <span class="text-truncate">
          <span class="app-bar__brand-bro">Bro</span><span class="app-bar__brand-world">World</span>
        </span>
      </NuxtLink>
    </v-toolbar-title>

    <div id="app-bar-teleport-target" class="app-bar__teleport-target" />

    <v-spacer v-if="!isDesktop" />

    <template v-if="isDesktop">
      <div class="d-flex align-center ga-1 ga-sm-2 app-bar__center-links">
        <v-btn
          v-for="item in headerItems"
          :key="item.key"
          :to="item.to"
          variant="text"
          class="text-none app-bar__link-btn"
          :prepend-icon="item.icon"
        >
          {{ te(item.key) ? t(item.key) : item.key }}
        </v-btn>
      </div>

      <v-spacer />

      <div class="d-flex align-center ga-1 ga-sm-2">
        <v-btn
          v-for="action in actionItems"
          :key="action.key"
          :to="action.to"
          icon
          variant="text"
          class="app-bar__icon-btn"
          :aria-label="t(action.key)"
        >
          <v-icon :icon="action.icon" />
        </v-btn>

        <v-menu v-if="isAuthenticated" location="bottom end" v-model="isNotificationsMenuOpen">
          <template #activator="{ props }">
            <v-btn
              icon
              variant="text"
              class="app-bar__icon-btn"
              v-bind="props"
              :aria-label="t('app.navigation.notifications')"
            >
              <v-icon icon="mdi-bell-outline" />
            </v-btn>
          </template>

          <v-list class="py-1 app-bar__menu" min-width="320">
            <v-list-item
              v-for="notification in notificationPreviewItems"
              :key="notification.id"
              :to="`/notifications/${notification.id}`"
              rounded="lg"
              class="mx-2 my-1"
            >
              <template #prepend>
                <v-avatar v-if="notification.from?.photo" size="34" class="me-3">
                  <v-img :src="notification.from.photo" :alt="getNotificationAvatarLabel(notification)" cover />
                </v-avatar>
                <v-avatar v-else size="34" color="primary" variant="tonal" class="me-3">
                  <v-icon icon="mdi-earth" size="18" />
                </v-avatar>
              </template>

              <v-list-item-title class="font-weight-medium text-truncate">{{ notification.title }}</v-list-item-title>
            </v-list-item>

            <v-list-item
              to="/notifications"
              rounded="lg"
              class="mx-2 my-1 text-primary"
              title="Show all"
              prepend-icon="mdi-arrow-right"
            />
          </v-list>
        </v-menu>

        <v-menu location="bottom end" v-model="isProfileMenuOpen">
          <template #activator="{ props }">
            <UiAvatar :aria-label="t('app.navigation.profile')"
                      v-bind="props" :src="authSession.profile?.photo" size="xs" :name="profileName" status="online" class="me-1" />
          </template>

          <v-list class="py-1 app-bar__menu" min-width="220">
            <v-list-item to="/profile" :title="t('app.navigation.profile')" prepend-icon="mdi-account-outline" rounded="lg" class="mx-2 my-1" />
            <v-list-item to="/settings" :title="t('app.navigation.settings')" prepend-icon="mdi-cog-outline" rounded="lg" class="mx-2 my-1" />
            <v-list-item
              v-if="canPermission('admin.access')"
              to="/admin"
              :title="t('app.navigation.admin')"
              prepend-icon="mdi-shield-account-outline"
              rounded="lg"
              class="mx-2 my-1"
            />
            <v-list-item
              v-if="canPermission('profile.logout')"
              :title="t('profile.logout')"
              prepend-icon="mdi-logout"
              rounded="lg"
              class="mx-2 my-1"
              @click="signOut"
            />
          </v-list>
        </v-menu>

        <v-menu location="bottom end">
          <template #activator="{ props }">
            <span class="px-2" v-bind="props">{{ getFlag(locale) }}</span>
          </template>

          <v-list class="py-1 app-bar__menu" min-width="180">
            <v-list-item
              v-for="item in availableLocales"
              :key="item.code"
              rounded="lg"
              class="mx-2 my-1"
              :active="locale === item.code"
              @click="setLocale(item.code)"
            >
              <template #prepend>
                <span class="text-body-1">{{ getFlag(item.code) }}</span>
              </template>
              <template #append>
                <v-icon v-if="locale === item.code" icon="mdi-check" size="16" />
              </template>
            </v-list-item>
          </v-list>
        </v-menu>

        <v-icon
            class="mx-4"
            :aria-label="t('app.navigation.toggleTheme')"
            @click="toggleTheme" :icon="isDark ? 'mdi-weather-night' : 'mdi-white-balance-sunny'" />
      </div>
    </template>

    <v-menu v-else location="bottom end">
      <template #activator="{ props }">
        <v-btn icon="mdi-menu" variant="text" v-bind="props" :aria-label="t('app.navigation.openMenu')" />
      </template>

      <v-list class="py-1">
        <v-list-item
          v-for="item in headerItems"
          :key="item.key"
          :to="item.to"
          :title="te(item.key) ? t(item.key) : item.key"
          :prepend-icon="item.icon"
          rounded="lg"
          class="mx-2 my-1"
        />
        <v-list-item
          v-for="action in actionItems"
          :key="`mobile-${action.key}`"
          :to="action.to"
          :title="t(action.key)"
          :prepend-icon="action.icon"
          rounded="lg"
          class="mx-2 my-1"
        />
        <v-list-item
          v-if="isAuthenticated"
          to="/settings"
          :title="t('app.navigation.settings')"
          prepend-icon="mdi-cog-outline"
          rounded="lg"
          class="mx-2 my-1"
        />
        <v-divider class="my-1" />
        <v-list-item
          v-for="item in availableLocales"
          :key="`mobile-${item.code}`"
          rounded="lg"
          class="mx-2 my-1"
          :title="`${getFlag(item.code)} ${item.name}`"
          @click="setLocale(item.code)"
        />
        <v-list-item :title="t('app.navigation.toggleTheme')" prepend-icon="mdi-theme-light-dark" rounded="lg" class="mx-2 my-1" @click="toggleTheme" />
        <v-list-item
          v-if="canPermission('profile.logout')"
          :title="t('profile.logout')"
          prepend-icon="mdi-logout"
          rounded="lg"
          class="mx-2 my-1"
          @click="signOut"
        />
      </v-list>
    </v-menu>
  </v-app-bar>
</template>

<style scoped>
.app-bar {
  margin: var(--ui-spacing-sm) var(--ui-spacing-md);
  padding-inline: var(--ui-spacing-lg);
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  box-shadow: 0 12px 24px rgba(var(--v-theme-on-surface), 0.08);
}

.app-bar--dark {
  background: color-mix(in srgb, rgb(var(--v-theme-surface)) 88%, #000 12%);
}

.app-bar__brand {
  min-width: 0;
}

.app-bar__title-link {
  color: rgb(var(--v-theme-on-surface));
  text-decoration: none;
  font-weight: 700;
  border-radius: var(--ui-radius-sm);
  transition: color 0.2s ease, box-shadow 0.2s ease;
}

.app-bar__title-link:hover {
  color: rgb(var(--v-theme-primary));
}

.app-bar__title-link:focus-visible {
  outline: none;
  box-shadow: var(--ui-focus);
}

.app-bar__brand-icon {
  color: rgb(var(--v-theme-primary));
}

.app-bar__brand-bro {
  color: rgb(var(--v-theme-on-surface));
}

.app-bar__brand-world {
  color: rgb(var(--v-theme-primary));
}

.app-bar__center-links {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
}

.app-bar__link-btn {
  font-weight: 500;
  color: rgb(var(--v-theme-on-surface));
  border-radius: var(--ui-radius-md);
}

.app-bar__link-btn:hover {
  color: rgb(var(--v-theme-primary));
  background-color: rgba(var(--v-theme-primary), 0.08);
}

.app-bar__link-btn:focus-visible {
  outline: none;
  box-shadow: var(--ui-focus);
}

.app-bar__icon-btn {
  color: rgb(var(--v-theme-on-surface));
  border-radius: var(--ui-radius-pill);
}

.app-bar__icon-btn:hover {
  color: rgb(var(--v-theme-primary));
  background-color: rgba(var(--v-theme-primary), 0.08);
}

.app-bar__icon-btn:focus-visible {
  outline: none;
  box-shadow: var(--ui-focus);
}

.app-bar__teleport-target {
  display: flex;
  align-items: center;
  min-width: 0;
}

@media (max-width: 959px) {
  .app-bar {
    margin: var(--ui-spacing-sm);
    padding-inline: var(--ui-spacing-md);
  }
}
</style>
