<script setup lang="ts">
const route = useRoute()

const adminLinks = [
  { label: 'Accueil admin', to: '/admin' },
  { label: 'Utilisateurs', to: '/admin/users' },
  { label: 'Rôles', to: '/admin/roles' },
  { label: 'Groupes', to: '/admin/user-groups' },
  { label: 'Clés API', to: '/admin/api-keys' },
]

const labelMap: Record<string, string> = {
  admin: 'Administration',
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
      <v-container class="pt-6 pb-2">
        <v-card
          rounded="lg"
          variant="tonal"
          class="pa-4"
        >
          <div class="d-flex flex-column ga-3">
            <v-breadcrumbs
              :items="breadcrumbs"
              density="comfortable"
            />

            <div class="d-flex flex-wrap ga-2">
              <v-chip
                v-for="link in adminLinks"
                :key="link.to"
                :to="link.to"
                :color="route.path === link.to ? 'primary' : undefined"
                :variant="route.path === link.to ? 'flat' : 'outlined'"
                prepend-icon="mdi-arrow-right"
                size="small"
                link
              >
                {{ link.label }}
              </v-chip>
            </div>
          </div>
        </v-card>
      </v-container>

      <slot />
    </v-main>
  </v-app>
</template>
