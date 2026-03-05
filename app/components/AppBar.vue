<script setup lang="ts">
import UiAvatar from '~/components/ui/UiAvatar.vue'
import { computed } from 'vue'
import { useDisplay } from 'vuetify'

interface NavItem {
  key: string
  to: string
}

const { t } = useI18n()
const authSession = useAuthSessionStore()
const { can, canPermission } = useAccessControl()

const siteName = computed(() => t('app.name'))

const navItems = computed<NavItem[]>(() => {
  const items: NavItem[] = [{ key: 'app.navigation.home', to: '/' }]

  if (!can()) {
    items.push({ key: 'app.navigation.login', to: '/login' })
    return items
  }

  items.push({ key: 'app.navigation.profile', to: '/profile' })

  if (canPermission('admin.access')) {
    items.push({ key: 'app.navigation.admin', to: '/admin' })
  }

  return items
})

const { mdAndUp } = useDisplay()
const isDesktop = computed(() => mdAndUp.value)
console.log(authSession)
const profileName = computed(() => {
  const profile = authSession.profile
  if (!profile) {
    return ''
  }

  return `${profile.firstName} ${profile.lastName}`.trim() || profile.username
})
</script>

<template>
  <v-app-bar
    flat
    class="app-bar md-app-bar px-2 px-sm-4 py-1"
    border="b"
  >
    <v-toolbar-title class="md-app-bar__title font-weight-bold d-flex align-center ga-2">
      {{ siteName }}
    </v-toolbar-title>

    <v-spacer />

    <div
      v-if="isDesktop"
      class="d-flex align-center ga-2"
    >
      <v-btn
        v-for="item in navItems"
        :key="item.to"
        :to="item.to"
        variant="text"
        class="text-none md-app-bar__nav-btn"
      >
        {{ t(item.key) }}
      </v-btn>

      <v-btn
        v-if="can(['ROLE_USER', 'ROLE_ADMIN'])"
        to="/profile"
        variant="text"
        class="text-none px-1 md-app-bar__avatar-btn"
        :aria-label="t('app.navigation.profile')"
      >
        <UiAvatar
          :src="authSession.profile?.photo"
          :name="profileName"
          size="sm"
          status="online"
        />
      </v-btn>
    </div>

    <v-menu
      v-else
      location="bottom end"
    >
      <template #activator="{ props }">
        <v-btn
          icon="mdi-menu"
          variant="text"
          v-bind="props"
          :aria-label="t('app.navigation.openMenu')"
        />
      </template>

      <v-list class="py-1">
        <v-list-item
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          :title="t(item.key)"
          rounded="lg"
          class="mx-2 my-1 md-app-bar__menu-item"
        />
      </v-list>
    </v-menu>
  </v-app-bar>
</template>

<style scoped>
.app-bar {
  padding-inline: var(--ui-spacing-md);
  min-height: calc(56px + var(--ui-spacing-xs));
}

.md-app-bar__title {
  color: rgb(var(--v-theme-default));
}

.md-app-bar__nav-btn {
  font-weight: 600;
  opacity: 0.9;
}

.md-app-bar__avatar-btn {
  border-radius: 9999px;
}
</style>
