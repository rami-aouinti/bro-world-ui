<script setup lang="ts">
import EntityCard from '~/components/platform/cards/EntityCard.vue'
import type { SchoolClass } from '~/data/platform/school'

interface Props {
  classItem: SchoolClass
}

const props = defineProps<Props>()

const subtitle = computed(() => `${props.classItem.students} students · Level ${props.classItem.level} · ${props.classItem.instructor}`)
</script>

<template>
  <EntityCard
    :title="props.classItem.title"
    :subtitle="subtitle"
    :category="props.classItem.category"
    :status="props.classItem.status"
    :tags="props.classItem.tags"
    date-label="Start"
    :date-value="props.classItem.startDate"
  />
</template>
