<script setup lang="ts">
import { storeToRefs } from 'pinia'

definePageMeta({
  public: true,
  requiresAuth: false,
  layout: false,
  skeleton: 'card-grid',
})

const { t, locale } = useI18n()
const { smAndDown } = useDisplay()
const fifaWorldCupStore = useFifaWorldCupStore()
const { stadiums, loading, error } = storeToRefs(fifaWorldCupStore)

const stadiumsLoading = computed(() => loading.value.stadiums)
const stadiumsError = computed(() => error.value.stadiums)
const refreshStadiums = () => fifaWorldCupStore.fetchStadiums(true)

const tableDensity = computed(() => (smAndDown.value ? 'comfortable' : 'compact'))
const sectionChipSize = computed(() => (smAndDown.value ? 'x-small' : 'small'))

const formatCapacity = (capacity: number | null): string => {
  if (capacity === null) {
    return t('worldCup.common.notAvailable')
  }

  return new Intl.NumberFormat(locale.value === 'fr' ? 'fr-FR' : 'en-US').format(capacity)
}

onMounted(() => {
  void fifaWorldCupStore.fetchStadiums()
})
</script>

<template>
  <NuxtLayout name="default">
    <main class="world-cup-page" :aria-label="t('worldCup.pageLabel')">
      <v-card class="pa-4 pa-md-5 section-card" variant="tonal">
        <section aria-labelledby="stadiums-title">
          <div class="d-flex align-center justify-space-between mb-3">
            <h2 id="stadiums-title" class="text-h6 mb-0">{{ t('worldCup.stadiums.title') }}</h2>
            <v-chip :size="sectionChipSize" color="primary" variant="outlined" class="section-chip">{{ stadiums.length }}</v-chip>
          </div>

          <div v-if="stadiumsLoading" class="mb-3">
            <v-skeleton-loader type="table-heading, table-row-divider@4" />
            <v-alert type="info" variant="tonal" class="mt-2">
              {{ t('worldCup.stadiums.status.loading') }}
            </v-alert>
          </div>

          <v-alert v-else-if="stadiumsError" type="error" variant="tonal" class="mb-2">
            {{ t('worldCup.stadiums.status.error') }}
            <template #append>
              <v-btn size="small" variant="text" @click="refreshStadiums">{{ t('worldCup.common.retry') }}</v-btn>
            </template>
          </v-alert>

          <v-alert v-else-if="!stadiums.length" type="info" variant="tonal">
            {{ t('worldCup.stadiums.status.empty') }}
          </v-alert>

          <v-table v-else :density="tableDensity" class="bg-transparent world-cup-table">
            <caption class="sr-only">{{ t('worldCup.stadiums.caption') }}</caption>
            <thead>
              <tr>
                <th scope="col" class="text-left">{{ t('worldCup.stadiums.columns.stadium') }}</th>
                <th scope="col" class="text-left">{{ t('worldCup.stadiums.columns.city') }}</th>
                <th scope="col" class="text-left">{{ t('worldCup.stadiums.columns.country') }}</th>
                <th scope="col" class="text-right">{{ t('worldCup.stadiums.columns.capacity') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="stadium in stadiums" :key="stadium.id">
                <td>{{ stadium.name }}</td>
                <td>{{ stadium.city || t('worldCup.common.notAvailable') }}</td>
                <td>{{ stadium.country || t('worldCup.common.notAvailable') }}</td>
                <td class="text-right">{{ formatCapacity(stadium.capacity) }}</td>
              </tr>
            </tbody>
          </v-table>
        </section>
      </v-card>
    </main>
  </NuxtLayout>
</template>

<style scoped>
.world-cup-page {
  display: grid;
  gap: 20px;
}

.section-card {
  border-radius: 16px;
}

.world-cup-table :deep(th),
.world-cup-table :deep(td) {
  white-space: nowrap;
}

.section-chip {
  font-weight: 700;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  border: 0;
}

@media (max-width: 959px) {
  .world-cup-page {
    gap: 16px;
  }
}

@media (max-width: 599px) {
  .world-cup-table :deep(th),
  .world-cup-table :deep(td) {
    font-size: 0.8rem;
  }
}
</style>
