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

const adminModules = computed(() => [
  {
    title: t('admin.navigation.dashboard.title'),
    description: t('admin.navigation.dashboard.description'),
    to: '/admin/dashboard',
    icon: 'mdi-view-dashboard-outline',
  },
  {
    title: t('admin.navigation.settings.title'),
    description: t('admin.navigation.settings.description'),
    to: '/admin/settings',
    icon: 'mdi-cog-outline',
  },
  {
    title: t('admin.navigation.userManagement.title'),
    description: t('admin.navigation.userManagement.description'),
    to: '/admin/user-management',
    icon: 'mdi-account-cog-outline',
  },
  {
    title: t('admin.navigation.platformManagement.title'),
    description: t('admin.navigation.platformManagement.description'),
    to: '/admin/platform-management',
    icon: 'mdi-layers-outline',
  },
  {
    title: t('admin.navigation.configurationManagement.title'),
    description: t('admin.navigation.configurationManagement.description'),
    to: '/admin/configuration-management',
    icon: 'mdi-tune-variant',
  },
])
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
                {{ t('admin.modules.open') }}
              </v-btn>
            </div>
          </div>
        </UiCard>
      </v-col>
    </v-row>
  </UiPageSection>
</template>
