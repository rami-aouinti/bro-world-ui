<script setup lang="ts">
import UiCard from '~/components/ui/UiCard.vue'
import UiSectionHeader from '~/components/ui/UiSectionHeader.vue'

definePageMeta({
  layout: 'admin',
  middleware: ['role'],
  requiredPermissions: ['admin.access'],
})

const { t } = useI18n()
const isPageLoading = ref(true)

onMounted(() => {
  isPageLoading.value = false
})

const overviewStats = [
  { label: 'Modules actifs', value: '6', icon: 'mdi-view-grid-plus-outline', color: 'primary' },
  { label: 'Actions en attente', value: '14', icon: 'mdi-timer-sand', color: 'warning' },
  { label: 'Automations OK', value: '31', icon: 'mdi-check-decagram-outline', color: 'success' },
]

const adminModules = computed(() => [
  {
    title: t('admin.navigation.dashboard.title'),
    description: t('admin.navigation.dashboard.description'),
    to: '/admin/dashboard',
    icon: 'mdi-view-dashboard-outline',
    badge: 'Pilotage',
  },
  {
    title: t('admin.navigation.settings.title'),
    description: t('admin.navigation.settings.description'),
    to: '/admin/settings',
    icon: 'mdi-cog-outline',
    badge: 'Configuration',
  },
  {
    title: t('admin.navigation.userManagement.title'),
    description: t('admin.navigation.userManagement.description'),
    to: '/admin/user-management',
    icon: 'mdi-account-cog-outline',
    badge: 'Sécurité',
  },
  {
    title: t('admin.navigation.platformManagement.title'),
    description: t('admin.navigation.platformManagement.description'),
    to: '/admin/platform-management',
    icon: 'mdi-layers-outline',
    badge: 'Produit',
  },
  {
    title: t('admin.navigation.configurationManagement.title'),
    description: t('admin.navigation.configurationManagement.description'),
    to: '/admin/configuration-management',
    icon: 'mdi-tune-variant',
    badge: 'Système',
  },
  {
    title: t('admin.navigation.pageManagement.title'),
    description: t('admin.navigation.pageManagement.description'),
    to: '/admin/page-management',
    icon: 'mdi-file-document-edit-outline',
    badge: 'Contenu',
  },
])
</script>

<template>
  <div class="admin-page-content">
    <template v-if="isPageLoading">
      <v-skeleton-loader type="heading, text" class="mb-4" />
      <v-row>
        <v-col v-for="index in 4" :key="`admin-skeleton-${index}`" cols="12" md="6">
          <v-card rounded="lg" class="pa-4">
            <v-skeleton-loader type="list-item-avatar-two-line, button" />
          </v-card>
        </v-col>
      </v-row>
    </template>

    <template v-else>
    <UiSectionHeader
      :title="t('admin.title')"
      :subtitle="t('admin.description')"
    />

    <v-row class="mb-1">
      <v-col v-for="item in overviewStats" :key="item.label" cols="12" md="4">
        <UiCard rounded="lg" compact>
          <div class="d-flex align-center justify-space-between">
            <div>
              <p class="text-caption text-medium-emphasis mb-1">{{ item.label }}</p>
              <div class="text-h5 font-weight-bold">{{ item.value }}</div>
            </div>
            <v-avatar :color="item.color" variant="tonal">
              <v-icon :icon="item.icon" />
            </v-avatar>
          </div>
        </UiCard>
      </v-col>
    </v-row>

    <v-row>
      <v-col
        v-for="module in adminModules"
        :key="module.to"
        cols="12"
        md="6"
      >
        <UiCard rounded="lg" class="module-card" compact>
          <div class="d-flex align-start ga-3">
            <v-avatar color="primary" variant="tonal" size="44">
              <v-icon :icon="module.icon" size="24" />
            </v-avatar>

            <div class="flex-grow-1">
              <div class="d-flex align-center justify-space-between ga-2 mb-1">
                <h2 class="text-h6">{{ module.title }}</h2>
                <v-chip size="small" color="primary" variant="outlined">{{ module.badge }}</v-chip>
              </div>
              <p class="text-body-2 text-medium-emphasis mb-3">{{ module.description }}</p>

              <v-btn
                color="primary"
                variant="flat"
                :to="module.to"
                append-icon="mdi-arrow-right"
              >
                {{ t('admin.modules.open') }}
              </v-btn>
            </div>
          </div>
        </UiCard>
      </v-col>
    </v-row>
      </template>
  </div>
</template>

<style scoped>
.module-card {
  border: 1px solid rgba(var(--v-theme-primary), 0.12);
}
</style>
