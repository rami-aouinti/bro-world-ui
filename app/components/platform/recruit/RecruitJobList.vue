<script setup lang="ts">
import { formatRecruitSalary, type RecruitJob } from '~/data/platform/recruit'

defineProps<{
  jobs: RecruitJob[]
  slug: string
}>()

defineEmits<{
  edit: [job: RecruitJob]
  delete: [job: RecruitJob]
  apply: [job: RecruitJob]
}>()
</script>

<template>
  <v-card
    v-for="job in jobs"
    :key="job.id"
    rounded="xl"
    class="mb-4 border"
    hover
    :to="`/platform/${slug}/recruit/job/${job.slug}`"
  >
    <v-card-text class="pa-6">
      <div class="d-flex justify-end mb-2">
        <v-menu v-if="job.owner && !job.apply" location="bottom end">
          <template #activator="{ props }">
            <v-btn icon="mdi-dots-vertical" size="small" variant="text" v-bind="props" @click.prevent />
          </template>
          <v-list density="compact" min-width="160">
            <v-list-item prepend-icon="mdi-pencil" title="Edit" @click.prevent="$emit('edit', job)" />
            <v-list-item prepend-icon="mdi-delete" title="Delete" @click.prevent="$emit('delete', job)" />
          </v-list>
        </v-menu>
      </div>

      <div class="d-flex align-center justify-space-between gap-4">
        <div>
          <div class="d-flex align-center ga-2 flex-wrap mb-3">
            <v-chip size="small" color="teal" variant="tonal">Passt hervorragend</v-chip>
            <v-chip v-if="job.apply && !job.owner" size="small" color="success" variant="tonal">Applyed</v-chip>
          </div>
          <h2 class="text-h5 font-weight-bold mb-2">{{ job.title }}</h2>
          <p class="text-body-1 mb-2">{{ job.company.name }} · {{ job.location }} · {{ formatRecruitSalary(job.salary) }}</p>
          <p class="text-body-2 mb-3">{{ job.tags.join(' | ') }}</p>
          <p class="text-body-2 text-medium-emphasis mb-0">{{ job.postedAtLabel }}</p>
        </div>
        <v-avatar size="72" rounded="lg" color="deep-orange-lighten-4" class="text-deep-orange-darken-3 font-weight-bold">
          {{ job.company.logo }}
        </v-avatar>
      </div>

      <div v-if="!job.owner && !job.apply" class="d-flex justify-end mt-4">
        <v-btn color="primary" variant="flat" @click.prevent="$emit('apply', job)">Apply</v-btn>
      </div>
    </v-card-text>
  </v-card>
</template>
