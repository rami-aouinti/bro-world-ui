<script setup lang="ts">
import UiCard from '~/components/ui/UiCard.vue'
import UiPageSection from '~/components/ui/UiPageSection.vue'
import UiSectionHeader from '~/components/ui/UiSectionHeader.vue'

definePageMeta({
  layout: 'admin',
  middleware: ['role'],
  requiredPermissions: ['admin.access'],
})

const { t } = useI18n()

const adminModules = [
  {
    title: 'Utilisateurs',
    description: 'Gérer les comptes utilisateurs (lecture, recherche et actions API).',
    to: '/admin/users',
    icon: 'mdi-account-multiple-outline',
  },
  {
    title: 'Rôles',
    description: 'Consulter et administrer les rôles exposés par /api/v1/role.',
    to: '/admin/roles',
    icon: 'mdi-shield-account-outline',
  },
  {
    title: 'Groupes utilisateurs',
    description: 'Superviser les user groups et leurs rôles associés.',
    to: '/admin/user-groups',
    icon: 'mdi-account-group-outline',
  },
  {
    title: 'Clés API',
    description: 'Lister et gérer les clés API disponibles sur /api/v1/api_key.',
    to: '/admin/api-keys',
    icon: 'mdi-key-outline',
  },
]
</script>

<template>
  <UiPageSection
    max-width="1200"
    card
  >
    <template #header>
      <UiSectionHeader
        :title="t('admin.title')"
        :subtitle="t('admin.description')"
      />
    </template>

    <v-row>
      <v-col
        v-for="module in adminModules"
        :key="module.to"
        cols="12"
        md="6"
      >
        <UiCard
          variant="tonal"
          rounded="lg"
          compact
        >
          <div class="d-flex align-start ga-3">
            <v-icon
              :icon="module.icon"
              color="primary"
              size="28"
              class="mt-1"
            />

            <div class="flex-grow-1">
              <h2 class="text-h6 mb-1">{{ module.title }}</h2>
              <p class="text-body-2 text-medium-emphasis mb-3">{{ module.description }}</p>

              <v-btn
                color="primary"
                variant="outlined"
                :to="module.to"
                append-icon="mdi-arrow-right"
              >
                Ouvrir
              </v-btn>
            </div>
          </div>
        </UiCard>
      </v-col>
    </v-row>
  </UiPageSection>
</template>
