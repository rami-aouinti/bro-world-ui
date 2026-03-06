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
</script>

<template>
  <UiPageSection max-width="900" card>
    <template #header>
      <UiSectionHeader
        :title="t('admin.modules.platforms.title')"
        :subtitle="t('admin.modules.platforms.description')"
      />
    </template>

    <UiCard rounded="lg" compact>
      <p class="text-body-1 text-medium-emphasis">
        {{ t('admin.modules.platforms.description') }}
      </p>
    </UiCard>
  </UiPageSection>
</template>
