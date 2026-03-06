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

const modules = computed(() => [
  {
    title: t('admin.modules.users.title'),
    description: t('admin.modules.users.description'),
    to: '/admin/user-management/users',
    icon: 'mdi-account-multiple-outline',
  },
  {
    title: t('admin.modules.roles.title'),
    description: t('admin.modules.roles.description'),
    to: '/admin/user-management/roles',
    icon: 'mdi-shield-account-outline',
  },
  {
    title: t('admin.modules.groups.title'),
    description: t('admin.modules.groups.description'),
    to: '/admin/user-management/groups',
    icon: 'mdi-account-group-outline',
  },
  {
    title: t('admin.modules.apiKeys.title'),
    description: t('admin.modules.apiKeys.description'),
    to: '/admin/user-management/api-keys',
    icon: 'mdi-key-outline',
  },
])
</script>

<template>
  <UiPageSection max-width="1200" card>
    <template #header>
      <UiSectionHeader
        :title="t('admin.userManagement.title')"
        :subtitle="t('admin.userManagement.description')"
      />
    </template>

    <v-row>
      <v-col
        v-for="module in modules"
        :key="module.to"
        cols="12"
        md="6"
      >
        <UiCard variant="tonal" rounded="lg" compact>
          <div class="d-flex align-start ga-3">
            <v-icon :icon="module.icon" color="primary" size="26" class="mt-1" />

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
