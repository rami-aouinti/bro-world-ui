<script setup lang="ts">
import { computed } from 'vue'
import { useDisplay } from 'vuetify'

interface NavItem {
  label: string
  to: string
}

const siteName = 'Bro World'

const navItems: NavItem[] = [
  { label: 'Accueil', to: '/' },
  { label: 'Dashboard', to: '/dashboard' },
  { label: 'Profil', to: '/profile' },
  { label: 'Support', to: '/support' },
]

const { mdAndUp } = useDisplay()
const isDesktop = computed(() => mdAndUp.value)
</script>

<template>
  <v-app-bar
    flat
    class="app-bar px-2 px-sm-4 py-1 bg-white"
    border="b"
  >
    <v-toolbar-title class="font-weight-bold text-primary d-flex align-center ga-2">
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
        class="text-none"
      >
        {{ item.label }}
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
          aria-label="Ouvrir le menu"
        />
      </template>

      <v-list class="py-1">
        <v-list-item
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          :title="item.label"
          rounded="lg"
          class="mx-2 my-1"
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
</style>
