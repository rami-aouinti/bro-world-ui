<script setup lang="ts">
import EntityCard from '~/components/platform/cards/EntityCard.vue'
import type { RecruitJob } from '~/data/platform/recruit'

interface Props {
  job: RecruitJob
  to: string
}

const props = defineProps<Props>()

const subtitle = computed(() => `${props.job.location} · ${props.job.contractType}`)
</script>

<template>
  <EntityCard
    :title="props.job.title"
    :subtitle="subtitle"
    :category="props.job.category"
    :status="props.job.status"
    :tags="props.job.tags"
    date-label="Publié"
    :date-value="props.job.publishedAt"
    :to="props.to"
  />
</template>
