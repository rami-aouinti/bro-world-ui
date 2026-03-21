<script setup lang="ts">
import UiAvatar from '~/components/ui/UiAvatar.vue'
import ConversationAvatarGroup from '~/components/inbox/ConversationAvatarGroup.vue'
import { computed, ref, watch } from 'vue'
import { useDisplay } from 'vuetify'
import type { NotificationListResponse, NotificationRead } from '~/types/api/notification'
import type { PrivateConversationsResponse } from '~/types/api/chat'
import { useNotificationsApi } from '~/composables/api/useNotificationsApi'
import { usePrivateChatApi } from '~/composables/api/usePrivateChatApi'
import { useNotificationTarget } from '~/composables/useNotificationTarget'
import { useMercureEventSource } from '~/composables/useMercureEventSource'
import { buildConversationPreview } from '~/utils/inboxConversationPreview'

interface NavItem {
  key: string
  to?: string
  icon: string
}

interface ActionNavItem extends NavItem {
  to: string
}

interface InboxConversationPreview {
  id: string
  name: string
  excerpt: string
  participants: Array<{ id: string, photo: string | null, label: string }>
  unread: number
  route: string
  latestMessageAt: string
}

const router = useRouter()
const route = useRoute()
const { t, te, locale, locales, setLocale } = useI18n({ useScope: 'global' })
const authSession = useAuthSessionStore()
const { can, canPermission } = useAccessControl()
const { logout } = useAuth()

const isProfileMenuOpen = ref(false)
const isNotificationsMenuOpen = ref(false)
const isInboxMenuOpen = ref(false)
const isAuthenticated = computed(() => Boolean(authSession.profile))
const notificationsApi = useNotificationsApi()
const privateChatApi = usePrivateChatApi()
const { getNotificationTarget } = useNotificationTarget()

const { data: inboxConversationsSummary, refresh: refreshInboxConversationsSummary } = useAsyncData<PrivateConversationsResponse>(
  'appbar-inbox-latest',
  () => privateChatApi.getConversations(20, 1),
  {
    default: () => ({
      items: [],
      pagination: {
        page: 1,
        limit: 20,
        totalItems: 0,
        totalPages: 0,
      },
      filters: [],
    }),
    watch: [isAuthenticated],
    immediate: isAuthenticated.value,
  },
)

const inboxConversationsPreview = computed<InboxConversationPreview[]>(() => (inboxConversationsSummary.value?.items ?? [])
  .map(buildConversationPreview)
  .sort((a, b) => new Date(b.latestMessageAt).getTime() - new Date(a.latestMessageAt).getTime())
  .slice(0, 3))

const inboxUnreadCount = computed(() => inboxConversationsPreview.value.reduce((total, item) => total + item.unread, 0))

watch(isInboxMenuOpen, async (isOpen) => {
  if (!isOpen || !isAuthenticated.value) {
    return
  }

  await refreshInboxConversationsSummary()
})

const mainHeaderItems = computed<NavItem[]>(() => [
  { key: 'app.navigation.platform', to: '/platform', icon: 'mdi-view-grid-outline' },
  { key: 'app.navigation.blog', to: '/blog', icon: 'mdi-post-outline' },
  { key: 'app.navigation.quiz', to: '/quiz', icon: 'mdi-help-circle-outline' }
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
  ]
})

const { data: notificationsSummary, refresh: refreshNotificationsSummary } = useAsyncData<NotificationListResponse>(
  'appbar-notifications-latest',
  () => notificationsApi.getNotifications(3, 0),
  {
    default: () => ({ items: [], unreadCount: 0 }),
    watch: [isAuthenticated],
    immediate: isAuthenticated.value,
  },
)

const notificationPreviewItems = computed(() => notificationsSummary.value?.items ?? [])
const unreadNotificationsCount = computed(() => notificationsSummary.value?.unreadCount ?? 0)

const mercureTopics = computed(() => {
  if (!authSession.profile?.id) {
    return []
  }

  return [
    `/users/${authSession.profile.id}/notifications`,
    ...(inboxConversationsSummary.value?.items ?? []).map(conversation => `/conversations/${conversation.id}/messages`),
  ]
})

const isNotificationPayload = (payload: unknown): payload is {
  id: string
  title: string
  description?: string
  type: string
  recipientId?: string
} => {
  if (!payload || typeof payload !== 'object') {
    return false
  }

  const candidate = payload as Record<string, unknown>
  return typeof candidate.id === 'string'
    && typeof candidate.title === 'string'
    && typeof candidate.type === 'string'
}

const isConversationMessagePayload = (payload: unknown): payload is {
  id: string
  conversationId: string
  senderId: string
  content: string
} => {
  if (!payload || typeof payload !== 'object') {
    return false
  }

  const candidate = payload as Record<string, unknown>
  return typeof candidate.id === 'string'
    && typeof candidate.conversationId === 'string'
    && typeof candidate.senderId === 'string'
    && typeof candidate.content === 'string'
}

useMercureEventSource(mercureTopics, async (payload) => {
  if (!isAuthenticated.value) {
    return
  }

  if (isConversationMessagePayload(payload)) {
    await refreshInboxConversationsSummary()
    return
  }

  if (!isNotificationPayload(payload)) {
    return
  }

  if (!notificationsSummary.value) {
    await refreshNotificationsSummary()
    return
  }

  if (notificationsSummary.value.items.some(item => item.id === payload.id)) {
    return
  }

  notificationsSummary.value = {
    ...notificationsSummary.value,
    unreadCount: notificationsSummary.value.unreadCount + 1,
    items: [
      {
        id: payload.id,
        title: payload.title,
        description: payload.description ?? '',
        type: payload.type,
        read: false,
        createdAt: new Date().toISOString(),
        from: null,
      },
      ...notificationsSummary.value.items,
    ].slice(0, 3),
  }
})

watch(isNotificationsMenuOpen, async (isOpen) => {
  if (!isOpen || unreadNotificationsCount.value === 0) {
    return
  }

  await notificationsApi.markAllAsRead()
  await refreshNotificationsSummary()
})

const getNotificationAvatarLabel = (notification: NotificationRead) => {
  if (!notification.from) {
    return notification.type
  }

  return `${notification.from.firstName} ${notification.from.lastName}`.trim()
}

const truncateText = (value: string | null | undefined, maxLength = 20) => {
  if (!value) {
    return ''
  }

  return value.length > maxLength ? `${value.slice(0, maxLength).trimEnd()}...` : value
}

const formatRelativeTime = (value: string | null | undefined) => {
  if (!value) {
    return ''
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return ''
  }

  const diffMs = date.getTime() - Date.now()
  const absDiffMs = Math.abs(diffMs)
  const minute = 60 * 1000
  const hour = 60 * minute
  const day = 24 * hour
  const rtf = new Intl.RelativeTimeFormat(locale.value, { numeric: 'auto' })

  if (absDiffMs < hour) {
    return rtf.format(Math.round(diffMs / minute), 'minute')
  }

  if (absDiffMs < day) {
    return rtf.format(Math.round(diffMs / hour), 'hour')
  }

  return rtf.format(Math.round(diffMs / day), 'day')
}

const {
  isDark,
  preference: themePreference,
  primaryOptions,
  radiusOptions,
  shadowOptions,
  toggleThemeMode,
  setPrimaryTheme,
  setThemeRadius,
  setThemeShadow,
} = useThemePreferences()

const { mdAndUp } = useDisplay()
const isDesktop = computed(() => mdAndUp.value)
const profileName = computed(() => {
  const profile = authSession.profile
  if (!profile) {
    return ''
  }

  return `${profile.firstName} ${profile.lastName}`.trim() || profile.username
})

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


const localeFlags: Record<string, string> = {
  en: '🇬🇧',
  fr: '🇫🇷',
}

const getFlag = (code: string) => localeFlags[code] ?? '🌐'

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
    class="app-bar app-bar--kind-glass px-0 border-radius-xl toolbar-content-padding-y-none v-sheet v-toolbar v-toolbar--flat v-app-bar bg-transparent position-sticky top-1 z-index-sticky"
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
      <div class="d-flex align-center ga-1 ga-sm-2 mx-auto app-bar__center-links">
        <v-btn
          v-for="item in headerItems"
          :key="item.key"
          :to="item.to"
          size="large"
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

        <v-menu v-if="isAuthenticated" location="bottom end" v-model="isInboxMenuOpen">
          <template #activator="{ props }">
            <v-btn
              icon
              variant="text"
              class="app-bar__icon-btn"
              v-bind="props"
              :aria-label="t('app.navigation.inbox')"
            >
              <v-badge :model-value="inboxUnreadCount > 0" :content="inboxUnreadCount" color="primary" offset-x="2" offset-y="2">
                <v-icon icon="mdi-message-processing-outline" />
              </v-badge>
            </v-btn>
          </template>

          <v-list class="py-1 app-bar__menu" min-width="320">
            <v-list-item
              v-for="conversation in inboxConversationsPreview"
              :key="conversation.id"
              :to="conversation.route"
              rounded="lg"
              class="mx-2 my-1 app-bar__message-item"
            >
              <template #prepend>
                <div class="d-flex align-center mt-6">
                  <ConversationAvatarGroup :participants="conversation.participants" :size="72" />
                </div>
              </template>

              <div class="app-bar__message-content">
                <v-list-item-title class="font-weight-medium text-truncate">{{ truncateText(conversation.name) }}</v-list-item-title>
                <v-list-item-subtitle class="text-truncate">{{ truncateText(conversation.excerpt) }}</v-list-item-subtitle>
              </div>

              <template #append>
                <div class="app-bar__message-meta text-caption text-medium-emphasis">
                  <span class="mx-auto">{{ formatRelativeTime(conversation.latestMessageAt) }}</span>
                  <v-badge
                    v-if="conversation.unread"
                    :content="conversation.unread"
                    color="primary"
                    inline
                  />
                </div>
              </template>
            </v-list-item>

            <v-list-item
              to="/inbox"
              rounded="lg"
              class="mx-2 my-1 text-primary"
              :title="t('app.common.showAll')"
              prepend-icon="mdi-arrow-right"
            />
          </v-list>
        </v-menu>

        <v-menu v-if="isAuthenticated" location="bottom end" v-model="isNotificationsMenuOpen">
          <template #activator="{ props }">
            <v-btn
              icon
              variant="text"
              class="app-bar__icon-btn"
              v-bind="props"
              :aria-label="t('app.navigation.notifications')"
            >
              <v-badge :model-value="unreadNotificationsCount > 0" :content="unreadNotificationsCount" color="error" offset-x="2" offset-y="2">
                <v-icon icon="mdi-bell-outline" />
              </v-badge>
            </v-btn>
          </template>

          <v-list class="py-1 app-bar__menu" min-width="320">
            <v-list-item
              v-for="notification in notificationPreviewItems"
              :key="notification.id"
              :to="getNotificationTarget(notification) ?? `/notifications/${notification.id}`"
              rounded="lg"
              class="mx-2 my-1 app-bar__message-item"
            >
              <template #prepend>
                <v-avatar v-if="notification.from?.photo" size="34" class="me-3">
                  <v-img :src="notification.from.photo" :alt="getNotificationAvatarLabel(notification)" cover />
                </v-avatar>
                <v-avatar v-else size="34" color="primary" variant="tonal" class="me-3">
                  <v-icon icon="mdi-earth" size="18" />
                </v-avatar>
              </template>

              <div class="app-bar__message-content">
                <v-list-item-title class="font-weight-medium text-truncate">{{ truncateText(notification.title) }}</v-list-item-title>
                <v-list-item-subtitle class="text-truncate">{{ truncateText(notification.description) }}</v-list-item-subtitle>
              </div>

              <template #append>
                <span class="app-bar__message-time text-caption text-medium-emphasis">{{ formatRelativeTime(notification.createdAt) }}</span>
              </template>
            </v-list-item>

            <v-list-item
              to="/notifications"
              rounded="lg"
              class="mx-2 my-1 text-primary"
              :title="t('app.common.showAll')"
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
            <template v-if="isAuthenticated">
              <v-list-item to="/profile" :title="t('app.navigation.profile')" prepend-icon="mdi-account-outline" rounded="lg" class="mx-2 my-1" />
              <v-list-item to="/settings" :title="t('app.navigation.settings')" prepend-icon="mdi-cog-outline" rounded="lg" class="mx-2 my-1" />
              <v-list-item to="/about" :title="t('app.navigation.about')" prepend-icon="mdi-information-outline" rounded="lg" class="mx-2 my-1" />
              <v-list-item to="/contact" :title="t('app.navigation.contact')" prepend-icon="mdi-email-outline" rounded="lg" class="mx-2 my-1" />
              <v-list-item to="/faq" :title="t('app.navigation.faq')" prepend-icon="mdi-frequently-asked-questions" rounded="lg" class="mx-2 my-1" />
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
            </template>
            <template v-else>
              <v-list-item to="/login" :title="t('app.navigation.login')" prepend-icon="mdi-login" rounded="lg" class="mx-2 my-1" />
              <v-list-item to="/register" :title="t('app.navigation.register')" prepend-icon="mdi-account-plus-outline" rounded="lg" class="mx-2 my-1" />
              <v-list-item to="/about" :title="t('app.navigation.about')" prepend-icon="mdi-information-outline" rounded="lg" class="mx-2 my-1" />
              <v-list-item to="/contact" :title="t('app.navigation.contact')" prepend-icon="mdi-email-outline" rounded="lg" class="mx-2 my-1" />
              <v-list-item to="/faq" :title="t('app.navigation.faq')" prepend-icon="mdi-frequently-asked-questions" rounded="lg" class="mx-2 my-1" />
            </template>
          </v-list>
        </v-menu>

        <v-menu location="bottom end" :close-on-content-click="false">
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

        <v-menu location="bottom end" :close-on-content-click="false">
          <template #activator="{ props }">
            <v-icon class="mx-2" v-bind="props" :icon="isDark ? 'mdi-weather-night' : 'mdi-white-balance-sunny'" />
          </template>

          <v-list class="py-2 px-2 app-bar__menu" min-width="280">
            <v-list-item
              :title="t('app.navigation.toggleTheme')"
              prepend-icon="mdi-theme-light-dark"
              rounded="lg"
              class="mx-2 my-1"
              @click="toggleThemeMode"
            >
              <template #append>
                <v-chip size="x-small" variant="tonal">{{ themePreference.mode }}</v-chip>
              </template>
            </v-list-item>
            <v-divider class="my-1" />
            <div class="app-bar__setting-block">
              <v-list-subheader class="app-bar__setting-title">Primary</v-list-subheader>
              <p class="app-bar__setting-caption mb-2">Choisissez une couleur principale pour les boutons et accents.</p>
              <div class="app-bar__option-row app-bar__option-row--primary">
                <v-btn
                  v-for="option in primaryOptions"
                  :key="`primary-${option.value}`"
                  size="small"
                  variant="text"
                  class="app-bar__swatch-btn"
                  :class="{ 'app-bar__swatch-btn--active': themePreference.primary === option.value }"
                  :title="`Primary: ${option.label}`"
                  @click="setPrimaryTheme(option.value)"
                >
                  <v-avatar size="20" :style="{ backgroundColor: option.color }" />
                  <span class="app-bar__swatch-label">{{ option.label }}</span>
                  <v-icon v-if="themePreference.primary === option.value" size="14" icon="mdi-check" class="app-bar__swatch-check" />
                </v-btn>
              </div>
            </div>
            <v-divider class="my-1" />
            <v-list-subheader>Radius</v-list-subheader>
            <div class="app-bar__option-row">
              <v-btn
                v-for="option in radiusOptions"
                :key="`radius-${option.value}`"
                size="small"
                variant="tonal"
                class="app-bar__option-pill"
                :class="{ 'app-bar__option-pill--active': themePreference.radius === option.value }"
                @click="setThemeRadius(option.value)"
              >
                {{ option.label }}
              </v-btn>
            </div>
            <v-divider class="my-1" />
            <v-list-subheader>Shadow</v-list-subheader>
            <div class="app-bar__option-row">
              <v-btn
                v-for="option in shadowOptions"
                :key="`shadow-${option.value}`"
                size="small"
                variant="tonal"
                class="app-bar__option-pill"
                :class="{ 'app-bar__option-pill--active': themePreference.shadow === option.value }"
                @click="setThemeShadow(option.value)"
              >
                {{ option.label }}
              </v-btn>
            </div>
          </v-list>
        </v-menu>
      </div>
    </template>

    <v-menu v-else location="bottom end" :close-on-content-click="false">
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
        <v-list-item
          v-else
          to="/login"
          :title="t('app.navigation.login')"
          prepend-icon="mdi-login"
          rounded="lg"
          class="mx-2 my-1"
        />
        <v-list-item
          v-if="!isAuthenticated"
          to="/register"
          :title="t('app.navigation.register')"
          prepend-icon="mdi-account-plus-outline"
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
        <v-list-item :title="t('app.navigation.toggleTheme')" prepend-icon="mdi-theme-light-dark" rounded="lg" class="mx-2 my-1" @click="toggleThemeMode" />
        <v-list-item
          v-for="option in primaryOptions"
          :key="`mobile-primary-${option.value}`"
          rounded="lg"
          class="mx-2 my-1"
          :title="`Primary: ${option.label}`"
          :prepend-icon="themePreference.primary === option.value ? 'mdi-check-circle' : 'mdi-circle-outline'"
          @click="setPrimaryTheme(option.value)"
        >
          <template #append>
            <v-avatar size="16" :style="{ backgroundColor: option.color }" />
          </template>
        </v-list-item>
        <v-list-item
          v-for="option in radiusOptions"
          :key="`mobile-radius-${option.value}`"
          rounded="lg"
          class="mx-2 my-1"
          :title="`Radius: ${option.label}`"
          :prepend-icon="themePreference.radius === option.value ? 'mdi-check-circle' : 'mdi-circle-outline'"
          @click="setThemeRadius(option.value)"
        />
        <v-list-item
          v-for="option in shadowOptions"
          :key="`mobile-shadow-${option.value}`"
          rounded="lg"
          class="mx-2 my-1"
          :title="`Shadow: ${option.label}`"
          :prepend-icon="themePreference.shadow === option.value ? 'mdi-check-circle' : 'mdi-circle-outline'"
          @click="setThemeShadow(option.value)"
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
  </v-app-bar>
</template>

<style scoped>
.app-bar {
  margin: var(--ui-spacing-sm) var(--ui-spacing-md);
  padding-inline: var(--ui-spacing-lg);
}

.app-bar--kind-glass {
  background: color-mix(in srgb, rgb(var(--v-theme-surface)) 82%, transparent);
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  box-shadow: 0 12px 24px rgba(var(--v-theme-on-surface), 0.08);
  backdrop-filter: blur(12px);
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

.app-bar__option-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  padding: 0.25rem 0.75rem 0.5rem;
}

.app-bar__setting-block {
  padding: 0 0.25rem;
}

.app-bar__setting-title {
  padding-inline: 0.5rem;
}

.app-bar__setting-caption {
  padding-inline: 0.75rem;
  color: rgba(var(--v-theme-on-surface), 0.68);
  font-size: 0.78rem;
}

.app-bar__option-row--primary {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.5rem;
}

.app-bar__swatch-btn {
  min-width: 0;
  width: 100%;
  justify-content: flex-start;
  gap: 0.5rem;
  height: 38px;
  padding: 0.25rem 0.5rem;
  border-radius: 10px;
  position: relative;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.12);
}

.app-bar__swatch-label {
  font-size: 0.74rem;
  color: rgba(var(--v-theme-on-surface), 0.78);
  text-transform: none;
}

.app-bar__swatch-btn--active {
  border-color: rgba(var(--v-theme-primary), 0.45);
  background: rgba(var(--v-theme-primary), 0.08);
}

.app-bar__swatch-btn--active .app-bar__swatch-label {
  color: rgb(var(--v-theme-primary));
}

.app-bar__swatch-check {
  position: absolute;
  right: 6px;
  bottom: 6px;
  background: rgb(var(--v-theme-surface));
  border-radius: 999px;
}

.app-bar__option-pill {
  text-transform: none;
}

.app-bar__option-pill--active {
  background: rgba(var(--v-theme-primary), 0.2);
}

.app-bar__message-item :deep(.v-list-item__content) {
  min-width: 0;
}

.app-bar__message-content {
  min-width: 0;
}

.app-bar__message-meta {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  white-space: nowrap;
}

.app-bar__message-time {
  white-space: nowrap;
}

@media (max-width: 959px) {
  .app-bar {
    margin: var(--ui-spacing-sm);
    padding-inline: var(--ui-spacing-md);
  }
}
</style>
