<script setup lang="ts">
interface Props {
  title: string
  subtitle?: string
  category: string
  status: string
  tags?: string[]
  dateLabel?: string
  dateValue?: string
  to?: string
}

const props = withDefaults(defineProps<Props>(), {
  subtitle: undefined,
  tags: () => [],
  dateLabel: 'Updated',
  dateValue: undefined,
  to: undefined,
})
</script>

<template>
  <v-card class="entity-card h-100" :to="props.to" variant="outlined" rounded="xl">
    <v-card-text class="d-flex flex-column ga-3">
      <div>
        <p class="text-subtitle-1 font-weight-medium mb-1">{{ props.title }}</p>
        <p v-if="props.subtitle" class="text-body-2 text-medium-emphasis">{{ props.subtitle }}</p>
      </div>

      <div class="d-flex align-center ga-2 flex-wrap">
        <v-chip size="small" color="primary" variant="tonal">{{ props.category }}</v-chip>
        <v-chip size="small" variant="outlined">{{ props.status }}</v-chip>
      </div>

      <div class="d-flex ga-2 flex-wrap">
        <v-chip
          v-for="tag in props.tags"
          :key="`${props.title}-${tag}`"
          size="x-small"
          color="secondary"
          variant="tonal"
        >
          #{{ tag }}
        </v-chip>
      </div>

      <p v-if="props.dateValue" class="text-caption text-medium-emphasis mt-auto">
        {{ props.dateLabel }} · {{ props.dateValue }}
      </p>
    </v-card-text>
  </v-card>
</template>

<style scoped>
.entity-card {
  transition: transform 0.18s ease, box-shadow 0.18s ease;
}

.entity-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 20px rgba(var(--v-theme-on-surface), 0.08);
}
</style>
