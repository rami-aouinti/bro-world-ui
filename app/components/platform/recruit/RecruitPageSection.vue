<script setup lang="ts">
import UiPageSection from '~/components/ui/UiPageSection.vue'
import UiSectionHeader from '~/components/ui/UiSectionHeader.vue'

interface RecruitQuickStat {
  label: string
  value: string | number
  icon?: string
  color?: string
}

interface Props {
  title?: string
  subtitle?: string
  stats?: RecruitQuickStat[]
  contentVariant?: 'flat' | 'elevated' | 'tonal' | 'outlined' | 'text' | 'plain'
  contentClass?: string
}

const props = withDefaults(defineProps<Props>(), {
  title: undefined,
  subtitle: undefined,
  stats: () => [],
  contentVariant: 'outlined',
  contentClass: '',
})
</script>

<template>
  <UiPageSection :card="false" padding="px-0 py-4">
    <UiSectionHeader :title="props.title" :subtitle="props.subtitle">
      <template v-if="$slots.actions" #actions>
        <slot name="actions" />
      </template>
    </UiSectionHeader>

    <v-row v-if="props.stats.length" class="mb-2">
      <v-col
        v-for="stat in props.stats"
        :key="stat.label"
        cols="12"
        sm="6"
        md="3"
      >
        <v-card rounded="xl" :variant="props.contentVariant === 'tonal' ? 'tonal' : 'flat'" :color="stat.color || 'primary'" class="h-100">
          <v-card-text>
            <div class="d-flex align-center ga-2 mb-1">
              <v-icon v-if="stat.icon" :icon="stat.icon" size="18" />
              <p class="text-caption text-uppercase mb-0">{{ stat.label }}</p>
            </div>
            <p class="text-h6 font-weight-bold mb-0">{{ stat.value }}</p>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-card rounded="xl" :variant="props.contentVariant" class="recruit-page-section__content" :class="props.contentClass">
      <slot />
    </v-card>
  </UiPageSection>
</template>

<style scoped>
.recruit-page-section__content {
  padding: 24px;
}

@media (max-width: 960px) {
  .recruit-page-section__content {
    padding: 16px;
  }
}
</style>
