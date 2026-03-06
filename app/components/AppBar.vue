<script setup lang="ts">
import UiAvatar from '~/components/ui/UiAvatar.vue'
import { computed, ref } from 'vue'
import { useDisplay, useTheme } from 'vuetify'

interface NavItem {
  key: string
  to?: string
  icon: string
}

const router = useRouter()
const route = useRoute()
const { t, locale, locales, setLocale } = useI18n({ useScope: 'global' })
const authSession = useAuthSessionStore()
const { can, canPermission } = useAccessControl()
const { logout } = useAuth()
const theme = useTheme()

const isProfileMenuOpen = ref(false)
const isAuthenticated = computed(() => Boolean(authSession.profile))

const mainHeaderItems = computed<NavItem[]>(() => [
  { key: 'app.navigation.platform', to: '/platform', icon: 'mdi-view-grid-outline' },
  { key: 'app.navigation.about', to: '/about', icon: 'mdi-information-outline' },
  { key: 'app.navigation.contact', to: '/contact', icon: 'mdi-email-outline' },
  { key: 'app.navigation.faq', to: '/faq', icon: 'mdi-frequently-asked-questions' },
  { key: 'app.navigation.setting', to: '/setting', icon: 'mdi-cog-outline' },
])

const adminHeaderItems = computed<NavItem[]>(() => [])

const headerItems = computed<NavItem[]>(() => route.path.startsWith('/admin')
  ? adminHeaderItems.value
  : mainHeaderItems.value)

const actionItems = computed<NavItem[]>(() => {
  if (!isAuthenticated.value) {
    return []
  }

  return [
    { key: 'app.navigation.calendar', icon: 'mdi-calendar-month-outline' },
    { key: 'app.navigation.messages', icon: 'mdi-message-processing-outline' },
    { key: 'app.navigation.notifications', icon: 'mdi-bell-outline' },
  ]
})

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
    flat
    rounded="xl"
    class="app-bar px-3 px-sm-5 py-2"
  >
    <v-toolbar-title class="app-bar__brand d-flex align-center ga-3 text-truncate">
      <NuxtLink to="/" class="app-bar__title-link d-flex align-center ga-2">
        <v-icon icon="mdi-alpha-v-circle-outline" size="32" class="app-bar__brand-icon" />
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
          {{ t(item.key) }}
        </v-btn>
      </div>

      <v-spacer />

      <div class="d-flex align-center ga-1 ga-sm-2">
        <v-btn
          v-for="action in actionItems"
          :key="action.key"
          icon
          variant="text"
          class="app-bar__icon-btn"
          :aria-label="t(action.key)"
        >
          <v-icon :icon="action.icon" />
        </v-btn>

        <v-menu location="bottom end" v-model="isProfileMenuOpen">
          <template #activator="{ props }">
            <UiAvatar :aria-label="t('app.navigation.profile')"
                      v-bind="props" :src="authSession.profile?.photo" size="sm" :name="profileName" status="online" />
          </template>

          <v-list class="py-1 app-bar__menu" min-width="220">
            <v-list-item to="/profile" :title="t('app.navigation.profile')" prepend-icon="mdi-account-outline" rounded="lg" class="mx-2 my-1" />
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
            <v-btn
              variant="text"
              class="app-bar__lang-btn"
              :aria-label="t('app.navigation.language')"
              v-bind="props"
            >
              <span class="me-1">{{ getFlag(locale) }}</span>
              <span class="app-bar__lang-label">{{ currentLocaleLabel }}</span>
              <v-icon icon="mdi-chevron-down" size="16" class="ms-1" />
            </v-btn>
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
              <v-list-item-title>{{ item.name }}</v-list-item-title>
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
          :title="t(item.key)"
          :prepend-icon="item.icon"
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
  min-height: 76px;
  background: #f5f5f7;
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  box-shadow: 0 12px 24px rgba(15, 23, 42, 0.08);
}

.app-bar__brand {
  min-width: 0;
}

.app-bar__title-link {
  color: #24262d;
  text-decoration: none;
  font-weight: 700;
}

.app-bar__brand-icon {
  color: #ec407a;
}

.app-bar__brand-bro {
  color: #24262d;
}

.app-bar__brand-world {
  color: #ec407a;
}

.app-bar__center-links {
  margin-inline-start: 1rem;
}

.app-bar__link-btn {
  font-weight: 500;
  color: #2f3136;
  border-radius: 12px;
}

.app-bar__icon-btn {
  color: #4a4d55;
}

.app-bar__avatar-btn {
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.9);
}

.app-bar__menu {
  background-color: #f7f5f7;
}

.app-bar__lang-btn {
  border-radius: 12px;
  text-transform: none;
  min-width: 92px;
}

.app-bar__lang-label {
  font-size: 0.8rem;
  font-weight: 700;
  letter-spacing: 0.04em;
}

.app-bar__theme-btn {
  border-radius: 999px;
  min-width: 42px;
  background-color: #7f8188;
  color: #ffffff;
}

.app-bar__teleport-target {
  display: flex;
  align-items: center;
  min-width: 0;
}

@media (max-width: 959px) {
  .app-bar {
    margin: var(--ui-spacing-sm);
    min-height: 64px;
    padding-inline: var(--ui-spacing-md);
  }
}
</style>
