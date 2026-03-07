<script setup lang="ts">
import UiAside from '~/components/ui/layout/UiAside.vue'

const route = useRoute()
const { t } = useI18n()

const adminMenu = computed(() => [
  {
    title: t('admin.navigation.dashboard.title'),
    to: '/admin/dashboard',
    icon: 'mdi-view-dashboard-outline',
  },
  {
    title: t('admin.navigation.settings.title'),
    to: '/admin/settings',
    icon: 'mdi-cog-outline',
  },
  {
    title: t('admin.navigation.userManagement.title'),
    value: 'user-management',
    icon: 'mdi-account-group-outline',
    children: [
      {
        title: t('admin.modules.users.title'),
        to: '/admin/user-management/users',
        icon: 'mdi-account-outline',
      },
      {
        title: t('admin.modules.roles.title'),
        to: '/admin/user-management/roles',
        icon: 'mdi-shield-account-outline',
      },
      {
        title: t('admin.modules.groups.title'),
        to: '/admin/user-management/user-groups',
        icon: 'mdi-account-multiple-outline',
      },
      {
        title: t('admin.modules.apiKeys.title'),
        to: '/admin/user-management/api-keys',
        icon: 'mdi-key-outline',
      },
    ],
  },
  {
    title: t('admin.navigation.platformManagement.title'),
    value: 'platform-management',
    icon: 'mdi-layers-outline',
    children: [
      {
        title: t('admin.modules.platforms.title'),
        to: '/admin/platform-management/platforms',
        icon: 'mdi-view-grid-outline',
      },
      {
        title: t('admin.modules.plugins.title'),
        to: '/admin/platform-management/plugins',
        icon: 'mdi-puzzle-outline',
      },
    ],
  },
  {
    title: t('admin.navigation.configurationManagement.title'),
    value: 'configuration-management',
    icon: 'mdi-tune-variant',
    children: [
      {
        title: t('admin.modules.configurations.title'),
        to: '/admin/configuration-management/configurations',
        icon: 'mdi-cog-sync-outline',
      },
    ],
  },
])

const openGroups = computed(() => {
  const groups = []

  if (route.path.startsWith('/admin/user-management')) groups.push('user-management')
  if (route.path.startsWith('/admin/platform-management')) groups.push('platform-management')
  if (route.path.startsWith('/admin/configuration-management')) groups.push('configuration-management')

  return groups
})
</script>

<template>
  <v-app>
    <AppBar />

    <v-main>
      <v-container fluid class="py-6">
        <v-row>
          <v-col cols="12" md="3">
            <UiAside class="admin-layout__menu-card" rounded="xl" sticky-top="100px">
              <v-list
                :opened="openGroups"
                nav
                color="primary"
                density="comfortable"
                bg-color="transparent"
                class="admin-layout__menu-list"
              >
                <template v-for="item in adminMenu" :key="item.title">
                  <v-list-item
                    v-if="!item.children"
                    :to="item.to"
                    :prepend-icon="item.icon"
                    rounded="lg"
                    class="mb-1"
                  >
                    <v-list-item-title>{{ item.title }}</v-list-item-title>
                  </v-list-item>

                  <v-list-group
                    v-else
                    :value="item.value"
                  >
                    <template #activator="{ props }">
                      <v-list-item
                        v-bind="props"
                        :prepend-icon="item.icon"
                        rounded="lg"
                      >
                        <v-list-item-title>{{ item.title }}</v-list-item-title>
                      </v-list-item>
                    </template>

                    <v-list-item
                      v-for="child in item.children"
                      :key="child.to"
                      :to="child.to"
                      :prepend-icon="child.icon"
                      rounded="lg"
                      class="admin-layout__submenu-item"
                    >
                      <v-list-item-title>{{ child.title }}</v-list-item-title>
                    </v-list-item>
                  </v-list-group>
                </template>
              </v-list>
            </UiAside>
          </v-col>

          <v-col cols="12" md="9">
            <slot />
          </v-col>
        </v-row>
      </v-container>
    </v-main>
  </v-app>
</template>

<style scoped>
.admin-layout__menu-card {
  background: transparent;
}

.admin-layout__menu-list {
  background: transparent;
}

.admin-layout__submenu-item {
  margin: 6px 0 6px 14px;
  padding-inline-start: 14px;
}
</style>
