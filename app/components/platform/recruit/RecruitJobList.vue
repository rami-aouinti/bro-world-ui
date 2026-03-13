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

<style scoped>
.recruit-card--interactive {
  transition:
    transform var(--recruit-motion-duration-fast, 150ms) var(--recruit-motion-easing, cubic-bezier(0.2, 0, 0, 1)),
    box-shadow var(--recruit-motion-duration-base, 220ms) var(--recruit-motion-easing, cubic-bezier(0.2, 0, 0, 1));
  will-change: transform, box-shadow;
}

.recruit-card--interactive:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 28px rgba(15, 23, 42, 0.12);
}

.recruit-list-enter-active,
.recruit-list-leave-active,
.recruit-list-move {
  transition:
    opacity var(--recruit-motion-duration-fast, 150ms) var(--recruit-motion-easing, cubic-bezier(0.2, 0, 0, 1)),
    transform var(--recruit-motion-duration-base, 220ms) var(--recruit-motion-easing, cubic-bezier(0.2, 0, 0, 1));
}

.recruit-list-enter-from,
.recruit-list-leave-to {
  opacity: 0;
  transform: translateY(8px);
}

@media (prefers-reduced-motion: reduce) {
  .recruit-card--interactive,
  .recruit-list-enter-active,
  .recruit-list-leave-active,
  .recruit-list-move {
    transition-duration: 1ms !important;
  }

  .recruit-card--interactive:hover,
  .recruit-list-enter-from,
  .recruit-list-leave-to {
    transform: none !important;
  }
}
</style>
