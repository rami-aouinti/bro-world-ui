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

const modules = computed(() => [
  {
    title: t('admin.modules.configurations.title'),
    description: t('admin.modules.configurations.description'),
    to: '/admin/configuration-management/configurations',
    icon: 'mdi-cog-sync-outline',
    detail: '149 paramètres • 12 variables sensibles surveillées',
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
      :title="t('admin.configurationManagement.title')"
      :subtitle="t('admin.configurationManagement.description')"
    />

    <v-row>
      <v-col
        v-for="module in modules"
        :key="module.to"
        cols="12"
        md="6"
      >
        <UiCard rounded="lg" compact>
          <div class="d-flex align-start ga-3">
            <v-avatar color="deep-purple" variant="tonal" size="42">
              <v-icon :icon="module.icon" size="22" />
            </v-avatar>

            <div class="flex-grow-1">
              <h2 class="text-h6 mb-1">{{ module.title }}</h2>
              <p class="text-body-2 text-medium-emphasis mb-2">{{ module.description }}</p>
              <p class="text-caption mb-3">{{ module.detail }}</p>

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
      </template>
  </div>
</template>
