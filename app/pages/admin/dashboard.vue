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

const statistics = computed(() => [
  {
    title: t('admin.dashboard.stats.activeUsers'),
    value: '1 248',
    icon: 'mdi-account-check-outline',
    color: 'primary',
  },
  {
    title: t('admin.dashboard.stats.newAccounts'),
    value: '84',
    icon: 'mdi-account-plus-outline',
    color: 'success',
  },
  {
    title: t('admin.dashboard.stats.apiRequests'),
    value: '56 320',
    icon: 'mdi-api',
    color: 'info',
  },
  {
    title: t('admin.dashboard.stats.errors'),
    value: '7',
    icon: 'mdi-alert-circle-outline',
    color: 'error',
  },
])
</script>

<template>
  <UiPageSection max-width="1200" card>
    <template #header>
      <UiSectionHeader
        :title="t('admin.dashboard.title')"
        :subtitle="t('admin.dashboard.description')"
      />
    </template>

    <v-row>
      <v-col
        v-for="item in statistics"
        :key="item.title"
        cols="12"
        md="6"
        lg="3"
      >
        <UiCard rounded="lg" compact>
          <div class="d-flex align-center justify-space-between mb-3">
            <span class="text-body-2 text-medium-emphasis">{{ item.title }}</span>
            <v-icon :icon="item.icon" :color="item.color" />
          </div>
          <div class="text-h4 font-weight-bold">{{ item.value }}</div>
        </UiCard>
      </v-col>
    </v-row>
  </UiPageSection>
</template>
