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
    <p class="text-body-2 text-medium-emphasis mb-4">Analyse conversion checkout, providers et prévention fraude.</p>

    <UiLoadingState v-if="props.loading" variant="dashboard" message="Chargement des insights paiement..." />
    <UiStateAlert v-else-if="props.error" type="error" :message="props.error" />
    <UiEmptyState
      v-else-if="!props.sectionsMeta.length"
      title="Aucun funnel disponible"
      description="Configurez vos sections paiement pour afficher les métriques de conversion."
      icon="mdi-chart-funnel"
    />

    <v-row v-else>
      <v-col v-for="section in props.sectionsMeta" :key="section.id" cols="12" md="4">
        <v-card rounded="xl" class="h-100" variant="outlined">
          <v-card-text>
            <div class="d-flex align-center ga-2 mb-2">
              <v-icon :icon="section.icon" />
              <p class="font-weight-bold mb-0">{{ section.title }}</p>
            </div>
            <p class="text-body-2 text-medium-emphasis mb-4">{{ section.subtitle }}</p>

            <UiEmptyState
              v-if="!(props.sectionData[section.id]?.length)"
              title="Aucune donnée"
              description="Les KPIs de cette section seront visibles ici."
              icon="mdi-database-off-outline"
            />

            <div v-else class="d-flex flex-column ga-3">
              <v-card v-for="item in props.sectionData[section.id]" :key="item.id" rounded="lg" color="surface-variant" variant="flat">
                <v-card-text>
                  <div class="d-flex align-center justify-space-between mb-1 ga-2">
                    <p class="font-weight-medium">{{ item.title }}</p>
                    <v-chip v-if="item.status" size="x-small" variant="tonal">{{ item.status }}</v-chip>
                  </div>
                  <p class="text-caption text-medium-emphasis mb-2">{{ item.description }}</p>
                  <div class="d-flex flex-wrap ga-2">
                    <v-chip
                      v-for="metric in item.metrics || []"
                      :key="`${item.id}-${metric.label}`"
                      size="x-small"
                      :color="metric.tone || 'info'"
                      variant="tonal"
                    >
                      {{ metric.label }}: {{ metric.value }}
                    </v-chip>
                  </div>
                </v-card-text>
              </v-card>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>
