<script setup lang="ts">
const route = useRoute()

const labelMap: Record<string, string> = {
  admin: 'Administration',
  dashboard: 'Dashboard',
  settings: 'Settings',
  'user-management': 'User Management',
  users: 'Utilisateurs',
  roles: 'Rôles',
  'user-groups': 'Groupes utilisateurs',
  'api-keys': 'Clés API',
}

const breadcrumbs = computed(() => {
  const parts = route.path.split('/').filter(Boolean)

  return parts.map((segment, index) => {
    const to = `/${parts.slice(0, index + 1).join('/')}`

    return {
      title: labelMap[segment] ?? segment,
      to,
      disabled: index === parts.length - 1,
    }
  })
})
</script>

<template>
  <v-app>
    <AppBar />

    <v-main>
      <Teleport
        defer
        to="#app-bar-teleport-target"
      >
        <v-breadcrumbs
          :items="breadcrumbs"
          density="comfortable"
          class="admin-layout__breadcrumbs"
        />
      </Teleport>

      <slot />
    </v-main>
  </v-app>
</template>


<style scoped>
.admin-layout__breadcrumbs {
  min-width: 0;
  padding-inline: 12px;
}
</style>
