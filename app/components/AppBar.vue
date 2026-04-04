<script setup lang="ts">
import { computed, defineAsyncComponent } from 'vue'
import { useDisplay } from 'vuetify'

interface NavItem {
  key: string
  to?: string
  icon: string
  children?: ActionNavItem[]
}

interface ActionNavItem extends NavItem {
  to: string
}

const router = useRouter()
const route = useRoute()
const { t, te, locale, locales, setLocale } = useI18n({ useScope: 'global' })
const isRtl = computed(() => locale.value === 'ar')
const { canPermission } = useAccessControl()
const { logout, isAuthenticated } = useAuth()

const AppBarInboxMenu = defineAsyncComponent(() => import('~/components/layout/app-bar/AppBarInboxMenu.vue'))
const AppBarNotificationsMenu = defineAsyncComponent(() => import('~/components/layout/app-bar/AppBarNotificationsMenu.vue'))
const AppBarProfileMenu = defineAsyncComponent(() => import('~/components/layout/app-bar/AppBarProfileMenu.vue'))

const mainHeaderItems = computed<NavItem[]>(() => [
  { key: 'app.navigation.platform', to: '/platform', icon: 'mdi-view-grid-outline' },
  {
    key: 'app.navigation.sport',
    icon: 'mdi-trophy-outline',
    children: [
      { key: 'app.navigation.football', to: '/sport/football', icon: 'mdi-soccer' },
      { key: 'app.navigation.baseball', to: '/sport/baseball', icon: 'mdi-baseball' },
    ],
  },
  { key: 'app.navigation.blog', to: '/blog', icon: 'mdi-post-outline' },
  { key: 'app.navigation.quiz', to: '/quiz', icon: 'mdi-help-circle-outline' },
  { key: 'app.navigation.game', to: '/game', icon: 'mdi-controller-classic-outline' }
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


const localeFlags: Record<string, { src: string, alt: string }> = {
  en: { src: '/images/flags/gb.svg', alt: 'English' },
  fr: { src: '/images/flags/fr.svg', alt: 'Français' },
  es: { src: '/images/flags/es.svg', alt: 'Español' },
  de: { src: '/images/flags/de.svg', alt: 'Deutsch' },
  ar: { src: '/images/flags/sa.svg', alt: 'العربية' },
  pt: { src: '/images/flags/pt.svg', alt: 'Português' },
}

const getFlag = (code: string) => {
  const normalizedCode = code.toLowerCase().split(/[-_]/)[0]
  return localeFlags[normalizedCode] ?? { src: '/images/flags/gb.svg', alt: normalizedCode.toUpperCase() }
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
    :class="{ 'blur shadow-blur': !isDark, 'app-bar--rtl': isRtl }"
    class="app-bar app-bar--kind-glass px-0 border-radius-xl toolbar-content-padding-y-none v-sheet v-toolbar v-toolbar--flat v-app-bar bg-transparent position-sticky top-1 z-index-sticky"
  >
    <v-toolbar-title class="app-bar__brand d-flex align-center ga-3 text-truncate">
      <NuxtLink to="/" class="app-bar__title-link d-flex align-center ga-2">
        <span class="app-bar__brand-icon-slot" aria-hidden="true">
          <v-icon icon="mdi-earth" size="32" class="app-bar__brand-icon" />
        </span>
        <span class="app-bar__brand-title text-truncate">
          <span class="app-bar__brand-bro">Bro</span><span class="app-bar__brand-world">World</span>
        </span>
      </NuxtLink>
    </v-toolbar-title>

    <div id="app-bar-teleport-target" class="app-bar__teleport-target" />

    <v-spacer v-if="!isDesktop" />

    <template v-if="isDesktop">
      <div class="d-flex align-center ga-1 ga-sm-2 mx-auto app-bar__center-links">
        <template v-for="item in headerItems" :key="item.key">
          <v-menu v-if="item.children?.length" location="bottom">
            <template #activator="{ props }">
              <v-btn
                size="large"
                variant="text"
                class="text-none app-bar__link-btn"
                :prepend-icon="item.icon"
                append-icon="mdi-chevron-down"
                v-bind="props"
              >
                {{ te(item.key) ? t(item.key) : item.key }}
              </v-btn>
            </template>
            <v-list class="py-1 app-bar__menu" min-width="220">
              <v-list-item
                v-for="child in item.children"
                :key="child.key"
                :to="child.to"
                :title="te(child.key) ? t(child.key) : child.key"
                :prepend-icon="child.icon"
                rounded="lg"
                class="mx-2 my-1"
              />
            </v-list>
          </v-menu>
          <v-btn
            v-else
            :to="item.to"
            size="large"
            variant="text"
            class="text-none app-bar__link-btn"
            :prepend-icon="item.icon"
          >
            {{ te(item.key) ? t(item.key) : item.key }}
          </v-btn>
        </template>
        <div id="app-bar-teleport-target-right"/>
      </div>
      <v-spacer />
      <div class="d-flex align-center ga-1 ga-sm-2 mx-auto app-bar__center-links">
        <div id="app-bar-teleport-target"/>
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

        <ClientOnly>
          <div class="d-flex align-center ga-1 ga-sm-2">
            <AppBarInboxMenu v-if="isAuthenticated" />
            <AppBarNotificationsMenu v-if="isAuthenticated" />
            <AppBarProfileMenu :can-access-admin="canPermission('admin.access')" :can-logout="canPermission('profile.logout')" @logout="signOut" />

            <v-menu location="bottom end" :close-on-content-click="false">
              <template #activator="{ props }">
                <v-btn
                  icon
                  variant="text"
                  class="app-bar__locale-flag app-bar__icon-btn app-bar__control-btn"
                  v-bind="props"
                  :aria-label="`Select language, current ${getFlag(locale).alt}`"
                >
                  <img class="app-bar__locale-flag-image" :src="getFlag(locale).src" :alt="getFlag(locale).alt" width="22" height="16">
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
                    <span class="text-body-1 app-bar__locale-flag">
                      <img class="app-bar__locale-flag-image mx-4" :src="getFlag(item.code).src" :alt="getFlag(item.code).alt" width="20" height="14">
                      {{ getFlag(item.code).alt }}
                    </span>
                  </template>
                  <template #append>
                    <v-icon v-if="locale === item.code" icon="mdi-check" size="16" />
                  </template>
                </v-list-item>
              </v-list>
            </v-menu>

            <v-menu location="bottom end" :close-on-content-click="false">
              <template #activator="{ props }">
                <v-btn
                  icon
                  variant="text"
                  class="app-bar__icon-btn app-bar__control-btn app-bar__theme-toggle-btn"
                  v-bind="props"
                  :aria-label="t('app.navigation.toggleTheme')"
                >
                  <v-icon :icon="isDark ? 'mdi-weather-night' : 'mdi-white-balance-sunny'" />
                </v-btn>
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
                  <div class="app-bar__option-row app-bar__option-row--primary">
                    <v-btn
                      v-for="option in primaryOptions"
                      :key="`primary-${option.value}`"
                      size="sm"
                      variant="text"
                      class="app-bar__swatch-btn"
                      :class="{ 'app-bar__swatch-btn--active': themePreference.primary === option.value }"
                      :title="`Primary: ${option.label}`"
                      @click="setPrimaryTheme(option.value)"
                    >
                      <v-avatar size="20" :style="{ backgroundColor: option.color }" />
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
          <template #fallback>
            <div class="app-bar__menus-fallback" aria-hidden="true" />
          </template>
        </ClientOnly>
      </div>
    </template>

    <ClientOnly v-else>
      <v-menu location="bottom end" :close-on-content-click="false">
        <template #activator="{ props }">
          <v-btn icon="mdi-menu" variant="text" v-bind="props" :aria-label="t('app.navigation.openMenu')" />
        </template>

        <v-list class="py-1">
          <template v-for="item in headerItems" :key="item.key">
            <v-list-group v-if="item.children?.length" :value="item.key">
              <template #activator="{ props }">
                <v-list-item
                  v-bind="props"
                  :title="te(item.key) ? t(item.key) : item.key"
                  :prepend-icon="item.icon"
                  rounded="lg"
                  class="mx-2 my-1"
                />
              </template>
              <v-list-item
                v-for="child in item.children"
                :key="`mobile-${child.key}`"
                :to="child.to"
                :title="te(child.key) ? t(child.key) : child.key"
                :prepend-icon="child.icon"
                rounded="lg"
                class="mx-4 my-1"
              />
            </v-list-group>
            <v-list-item
              v-else
              :to="item.to"
              :title="te(item.key) ? t(item.key) : item.key"
              :prepend-icon="item.icon"
              rounded="lg"
              class="mx-2 my-1"
            />
          </template>
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
      <template #fallback>
        <v-btn icon="mdi-menu" variant="text" :aria-label="t('app.navigation.openMenu')" />
      </template>
    </ClientOnly>
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

.app-bar__menus-fallback {
  width: 184px;
  min-height: 40px;
}

.app-bar__brand {
  min-width: 0;
}

.app-bar__title-link {
  min-height: 40px;
  color: rgb(var(--v-theme-on-surface));
  text-decoration: none;
  font-weight: 700;
  border-radius: var(--ui-radius-sm);
  transition: color 0.2s ease, box-shadow 0.2s ease;
}

.app-bar__brand-title {
  display: inline-block;
  min-width: 8ch;
  line-height: 1.2;
}

.app-bar__brand-icon-slot {
  flex: 0 0 32px;
  width: 32px;
  height: 32px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
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

.app-bar--rtl :deep(.v-toolbar__content) {
  flex-direction: row-reverse;
}

.app-bar--rtl .app-bar__center-links {
  left: auto;
  right: 50%;
  transform: translateX(50%);
}

.app-bar__link-btn {
  font-weight: 500;
  color: rgb(var(--v-theme-on-surface));
  border-radius: var(--ui-radius);
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
  border-radius: var(--ui-radius);
}

.app-bar__control-btn {
  width: 40px;
  height: 40px;
}

.app-bar__theme-toggle-btn {
  margin-inline-end: var(--ui-spacing-xs);
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
  grid-template-columns: repeat(4, minmax(0, 1fr));
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

.app-bar__locale-flag {
  display: inline-flex;
  align-items: center;
}

.app-bar__locale-flag-image {
  display: block;
  border-radius: 2px;
  object-fit: cover;
  box-shadow: 0 0 0 1px rgba(var(--v-theme-on-surface), 0.14);
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
