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
    title: t('admin.modules.configurations.title'),
    description: t('admin.modules.configurations.description'),
    to: '/admin/configuration-management/configurations',
    icon: 'mdi-cog-sync-outline',
  },
])
</script>

<template>
  <UiPageSection max-width="1200" card>
    <template #header>
      <UiSectionHeader
        :title="t('admin.configurationManagement.title')"
        :subtitle="t('admin.configurationManagement.description')"
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
