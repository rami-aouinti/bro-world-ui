<script setup lang="ts">
import UiEmptyState from '~/components/ui/state/UiEmptyState.vue'
import UiLoadingState from '~/components/ui/state/UiLoadingState.vue'
import UiStateAlert from '~/components/ui/state/UiStateAlert.vue'
import type { PlatformPageSections, PlatformSectionItem } from '~/data/platform-demo'

interface Props {
  title: string
  sectionsMeta: PlatformPageSections['sections']
  sectionData: Record<string, PlatformSectionItem[]>
  loading?: boolean
  error?: string | null
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  error: null,
})
</script>

<template>
  <div>
    <h1 class="text-h5 font-weight-bold mb-1">{{ props.title }}</h1>
    <p class="text-body-2 text-medium-emphasis mb-4">Paramètres académiques, permissions et templates de certificats.</p>

    <UiLoadingState v-if="props.loading" variant="form" message="Chargement des paramètres école..." />
    <UiStateAlert v-else-if="props.error" type="error" :message="props.error" />
    <UiEmptyState
      v-else-if="!props.sectionsMeta.length"
      title="Aucune section configurée"
      description="Ajoutez des sections métier pour la gouvernance académique."
      icon="mdi-school-outline"
    />

    <v-row v-else>
      <v-col v-for="section in props.sectionsMeta" :key="section.id" cols="12">
        <v-card rounded="xl" variant="outlined">
          <v-card-text>
            <div class="d-flex align-center ga-2 mb-1">
              <v-icon :icon="section.icon" />
              <p class="font-weight-bold mb-0">{{ section.title }}</p>
            </div>
            <p class="text-caption text-medium-emphasis mb-4">{{ section.subtitle }}</p>

            <UiEmptyState
              v-if="!(props.sectionData[section.id]?.length)"
              title="Aucune configuration"
              description="Ajoutez une configuration pour cette section."
              icon="mdi-form-select"
            />

            <v-row v-else>
              <v-col v-for="item in props.sectionData[section.id]" :key="item.id" cols="12" md="6" lg="4">
                <v-card rounded="lg" color="surface" variant="tonal" class="h-100">
                  <v-card-text>
                    <div class="d-flex align-center justify-space-between ga-2 mb-2">
                      <p class="font-weight-medium">{{ item.title }}</p>
                      <v-chip v-if="item.status" size="x-small" variant="flat">{{ item.status }}</v-chip>
                    </div>
                    <p class="text-body-2 text-medium-emphasis mb-2">{{ item.description }}</p>
                    <p v-if="item.owner" class="text-caption mb-2">Responsable: {{ item.owner }}</p>
                    <div class="d-flex flex-wrap ga-2">
                      <v-chip
                        v-for="metric in item.metrics || []"
                        :key="`${item.id}-${metric.label}`"
                        size="x-small"
                        :color="metric.tone || 'primary'"
                        variant="tonal"
                      >
                        {{ metric.label }} · {{ metric.value }}
                      </v-chip>
                    </div>
                  </v-card-text>
                </v-card>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>
