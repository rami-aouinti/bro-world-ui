<script setup lang="ts">
const route = useRoute()
const { t } = useI18n()

const labelMap = computed<Record<string, string>>(() => ({
  admin: t('admin.title'),
  dashboard: t('admin.navigation.dashboard.title'),
  settings: t('admin.navigation.settings.title'),
  'user-management': t('admin.navigation.userManagement.title'),
  users: t('admin.modules.users.title'),
  groups: t('admin.modules.groups.title'),
  roles: t('admin.modules.roles.title'),
  'user-groups': t('admin.modules.groups.title'),
  'api-keys': t('admin.modules.apiKeys.title'),
}))

const breadcrumbs = computed(() => {
  const parts = route.path.split('/').filter(Boolean)

  return parts.map((segment, index) => {
    const to = `/${parts.slice(0, index + 1).join('/')}`

    return {
      title: labelMap.value[segment] ?? segment,
      to,
      disabled: index === parts.length - 1,
    }
  })
})

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
    icon: 'mdi-account-group-outline',
    children: [
      {
        title: t('admin.modules.users.title'),
        to: '/admin/user-management/users',
      },
      {
        title: t('admin.modules.roles.title'),
        to: '/admin/user-management/roles',
      },
      {
        title: t('admin.modules.groups.title'),
        to: '/admin/user-management/user-groups',
      },
      {
        title: t('admin.modules.apiKeys.title'),
        to: '/admin/user-management/api-keys',
      },
    ],
  },
])

const openGroups = computed(() => {
  if (route.path.startsWith('/admin/user-management')) {
    return ['user-management']
  }

  return []
})
</script>

<template>
  <v-app>
    <AppBar />

    <v-main>
      <Teleport defer to="#app-bar-teleport-target">
        <v-breadcrumbs
          :items="breadcrumbs"
          density="comfortable"
          class="admin-layout__breadcrumbs"
        />
      </Teleport>

      <v-container fluid class="py-6">
        <v-row>
          <v-col cols="12" md="3">
            <v-card class="admin-layout__menu-card" rounded="xl" variant="outlined">
              <v-list
                :opened="openGroups"
                nav
                color="primary"
                density="comfortable"
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
                    value="user-management"
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
                      rounded="lg"
                      class="admin-layout__submenu-item"
                    >
                      <v-list-item-title>{{ child.title }}</v-list-item-title>
                    </v-list-item>
                  </v-list-group>
                </template>
              </v-list>
            </v-card>
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
.admin-layout__breadcrumbs {
  min-width: 0;
  padding-inline: 12px;
}

.admin-layout__menu-card {
  position: sticky;
  top: 100px;
}

.admin-layout__submenu-item {
  padding-inline-start: 52px;
}
</style>
