<script setup lang="ts">
import { computed } from 'vue'
import { useDisplay } from 'vuetify'

interface HomeNavItem {
  key: string
  to: string
  icon: string
}

const { t, te } = useI18n({ useScope: 'global' })
const { isAuthenticated } = useAuth()
const { mdAndUp } = useDisplay()

const isDesktop = computed(() => mdAndUp.value)

const homeLinks = computed<HomeNavItem[]>(() => [
  { key: 'app.navigation.about', to: '/about', icon: 'mdi-information-outline' },
  { key: 'app.navigation.contact', to: '/contact', icon: 'mdi-email-outline' },
  { key: 'app.navigation.faq', to: '/faq', icon: 'mdi-frequently-asked-questions' },
])

const ctaLinks = computed<HomeNavItem[]>(() => {
  if (isAuthenticated.value) {
    return [{ key: 'app.navigation.platform', to: '/platform', icon: 'mdi-view-grid-outline' }]
  }

  return [
    { key: 'app.navigation.login', to: '/login', icon: 'mdi-login' },
    { key: 'app.navigation.register', to: '/register', icon: 'mdi-account-plus-outline' },
  ]
})
</script>

<template>
  <v-app-bar
    class="app-bar-lite app-bar--kind-glass px-0 border-radius-xl toolbar-content-padding-y-none v-sheet v-toolbar v-toolbar--flat v-app-bar bg-transparent position-sticky top-1 z-index-sticky"
  >
    <v-toolbar-title class="app-bar-lite__brand d-flex align-center ga-3 text-truncate">
      <NuxtLink to="/" class="app-bar-lite__title-link d-flex align-center ga-2">
        <v-icon icon="mdi-earth" size="30" class="app-bar-lite__brand-icon" />
        <span class="text-truncate">
          <span class="app-bar-lite__brand-bro">Bro</span><span class="app-bar-lite__brand-world">World</span>
        </span>
      </NuxtLink>
    </v-toolbar-title>

    <template v-if="isDesktop">
      <div class="d-flex align-center ga-1 ga-sm-2 mx-auto">
        <v-btn
          v-for="item in homeLinks"
          :key="item.key"
          :to="item.to"
          variant="text"
          class="text-none"
          :prepend-icon="item.icon"
        >
          {{ te(item.key) ? t(item.key) : item.key }}
        </v-btn>
      </div>
      <v-spacer />
      <div class="d-flex align-center ga-1 ga-sm-2">
        <v-btn
          v-for="item in ctaLinks"
          :key="`cta-${item.key}`"
          :to="item.to"
          :variant="item.key === 'app.navigation.register' ? 'flat' : 'text'"
          color="primary"
          class="text-none"
          :prepend-icon="item.icon"
        >
          {{ te(item.key) ? t(item.key) : item.key }}
        </v-btn>
      </div>
    </template>

    <ClientOnly v-else>
      <v-menu location="bottom end">
        <template #activator="{ props }">
          <v-btn icon="mdi-menu" variant="text" v-bind="props" :aria-label="t('app.navigation.openMenu')" />
        </template>

        <v-list class="py-1">
          <v-list-item
            v-for="item in homeLinks"
            :key="item.key"
            :to="item.to"
            :title="te(item.key) ? t(item.key) : item.key"
            :prepend-icon="item.icon"
            rounded="lg"
            class="mx-2 my-1"
          />
          <v-divider class="my-1" />
          <v-list-item
            v-for="item in ctaLinks"
            :key="`mobile-${item.key}`"
            :to="item.to"
            :title="te(item.key) ? t(item.key) : item.key"
            :prepend-icon="item.icon"
            rounded="lg"
            class="mx-2 my-1"
          />
        </v-list>
      </v-menu>
    </ClientOnly>
  </v-app-bar>
</template>

<style scoped>
.app-bar-lite {
  margin: var(--ui-spacing-sm) var(--ui-spacing-md);
  padding-inline: var(--ui-spacing-lg);
}

.app-bar--kind-glass {
  background: color-mix(in srgb, rgb(var(--v-theme-surface)) 82%, transparent);
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  box-shadow: 0 12px 24px rgba(var(--v-theme-on-surface), 0.08);
  backdrop-filter: blur(12px);
}

.app-bar-lite__brand {
  min-width: 0;
}

.app-bar-lite__title-link {
  color: inherit;
  text-decoration: none;
  min-width: 0;
}

.app-bar-lite__brand-bro {
  font-weight: 700;
}

.app-bar-lite__brand-world {
  font-weight: 600;
  color: rgb(var(--v-theme-primary));
}
</style>
