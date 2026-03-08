<script setup lang="ts">
import { formatRecruitSalary, type RecruitJob } from '~/data/platform/recruit'
import RecruitJobCard from '~/components/platform/recruit/RecruitJobCard.vue'

defineProps<{
  jobs: RecruitJob[]
  slug: string
}>()

const { t } = useI18n()

defineEmits<{
  edit: [job: RecruitJob]
  delete: [job: RecruitJob]
  apply: [job: RecruitJob]
}>()
</script>

<template>
  <transition-group name="recruit-list" tag="div">
    <RecruitJobCard
      v-for="job in jobs"
      :key="job.id"
      class="recruit-card--interactive"
      variant="detailed"
      :to="`/platform/${slug}/recruit/job/${job.slug}`"
      :title="job.title"
      :company="job.company.name"
      :location="job.location"
      :salary="formatRecruitSalary(job.salary)"
      :tags="job.tags"
      :posted-at="job.postedAtLabel"
      :logo="job.company.logo"
      :badges="[
        { label: t('platform.recruit.jobList.badges.strongMatch'), color: 'teal', variant: 'tonal' },
        ...(job.apply && !job.owner ? [{ label: t('platform.recruit.jobList.badges.applied'), color: 'success', variant: 'tonal' }] : []),
      ]"
      :show-edit-action="job.owner && !job.apply"
      :show-delete-action="job.owner && !job.apply"
      :show-apply-action="!job.owner && !job.apply"
      :apply-label="t('platform.recruit.jobList.actions.apply')"
      :edit-label="t('platform.recruit.jobList.actions.edit')"
      :delete-label="t('platform.recruit.jobList.actions.delete')"
      @edit="$emit('edit', job)"
      @delete="$emit('delete', job)"
      @apply="$emit('apply', job)"
    />
  </transition-group>
</template>
