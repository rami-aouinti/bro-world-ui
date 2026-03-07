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
    <p class="text-body-2 text-medium-emphasis mb-4">Sections métier CRM configurables par équipe RevOps.</p>

    <UiLoadingState v-if="props.loading" variant="form" message="Chargement des paramètres CRM..." />
    <UiStateAlert v-else-if="props.error" type="error" :message="props.error" />
    <UiEmptyState
      v-else-if="!props.sectionsMeta.length"
      title="Aucune section CRM"
      description="Ajoutez des sections pour piloter le routage, l'automatisation et la gouvernance."
      icon="mdi-view-dashboard-outline"
    />

    <v-expansion-panels v-else multiple variant="accordion">
      <v-expansion-panel v-for="section in props.sectionsMeta" :key="section.id" rounded="xl" class="mb-3">
        <v-expansion-panel-title>
          <div class="d-flex align-center ga-3">
            <v-icon :icon="section.icon" />
            <div>
              <p class="font-weight-bold mb-0">{{ section.title }}</p>
              <p class="text-caption text-medium-emphasis mb-0">{{ section.subtitle }}</p>
            </div>
          </div>
        </v-expansion-panel-title>
        <v-expansion-panel-text>
          <UiEmptyState
            v-if="!(props.sectionData[section.id]?.length)"
            title="Section vide"
            description="Aucun module configuré pour cette section."
            icon="mdi-package-variant-closed"
          />
          <v-row v-else>
            <v-col v-for="item in props.sectionData[section.id]" :key="item.id" cols="12" md="6">
              <v-card rounded="lg" variant="outlined" class="h-100">
                <v-card-text>
                  <div class="d-flex align-center justify-space-between mb-2 ga-2">
                    <p class="font-weight-bold">{{ item.title }}</p>
                    <v-chip v-if="item.status" size="small" variant="tonal">{{ item.status }}</v-chip>
                  </div>
                  <p class="text-body-2 text-medium-emphasis mb-2">{{ item.description }}</p>
                  <p v-if="item.owner" class="text-caption mb-2">Owner: {{ item.owner }}</p>
                  <div class="d-flex ga-2 flex-wrap">
                    <v-chip
                      v-for="metric in item.metrics || []"
                      :key="`${item.id}-${metric.label}`"
                      size="small"
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
        </v-expansion-panel-text>
      </v-expansion-panel>
    </v-expansion-panels>
  </div>
</template>
