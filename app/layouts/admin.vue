<script setup lang="ts">
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
      <v-container fluid class="py-6">
        <v-row>
          <v-col cols="12" md="3">
            <v-card class="admin-layout__menu-card" rounded="xl" variant="outlined">
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
.admin-layout__menu-card {
  position: sticky;
  top: 100px;
}

.admin-layout__menu-list {
  background: transparent;
}

.admin-layout__submenu-item {
  padding-inline-start: 52px;
}
</style>
