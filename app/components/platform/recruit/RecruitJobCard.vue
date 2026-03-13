<script setup lang="ts">
type RecruitJobCardBadge = {
  label: string
  color?: string
  variant?: 'flat' | 'text' | 'elevated' | 'tonal' | 'outlined' | 'plain'
}

const props = withDefaults(defineProps<{
  variant?: 'compact' | 'detailed'
  to?: string
  title: string
  company?: string
  location?: string
  salary?: string
  meta?: string
  postedAt?: string
  tags?: string[]
  logo?: string
  badges?: RecruitJobCardBadge[]
  statusBadge?: RecruitJobCardBadge | null
  showApplyAction?: boolean
  showEditAction?: boolean
  showDeleteAction?: boolean
  applyLabel?: string
  editLabel?: string
  deleteLabel?: string
}>(), {
  variant: 'detailed',
  to: undefined,
  company: '',
  location: '',
  salary: '',
  meta: '',
  postedAt: '',
  tags: () => [],
  logo: '',
  badges: () => [],
  statusBadge: null,
  showApplyAction: false,
  showEditAction: false,
  showDeleteAction: false,
  applyLabel: '',
  editLabel: '',
  deleteLabel: '',
})

const emit = defineEmits<{
  apply: []
  edit: []
  delete: []
}>()

const headerParts = computed(() => [props.company, props.location, props.salary].filter(Boolean))
const managementActionsVisible = computed(() => props.showEditAction || props.showDeleteAction)
const showRightAvatar = computed(() => !!props.logo && props.variant === 'detailed')
const showMeta = computed(() => !!props.meta)
const showTags = computed(() => props.tags.length > 0 && props.variant === 'detailed')
const avatarSize = computed(() => (props.variant === 'compact' ? 64 : 72))
const avatarTextClass = computed(() => (props.variant === 'compact' ? 'text-h6' : 'text-h5'))
</script>

<template>
  <v-card rounded="xl" class="recruit-job-card mb-4" hover :to="to">
    <v-card-text class="recruit-job-card__content">
      <div class="d-flex justify-end mb-2">
        <v-menu v-if="managementActionsVisible" location="bottom end">
          <template #activator="{ props: menuProps }">
            <v-btn
              icon="mdi-dots-vertical"
              size="small"
              variant="text"
              aria-label="More actions"
              v-bind="menuProps"
              @click.prevent
            />
          </template>
          <v-list density="compact" min-width="160">
            <v-list-item v-if="showEditAction" prepend-icon="mdi-pencil" :title="editLabel" @click.prevent="emit('edit')" />
            <v-list-item v-if="showDeleteAction" prepend-icon="mdi-delete" :title="deleteLabel" @click.prevent="emit('delete')" />
          </v-list>
        </v-menu>
      </div>

      <div class="d-flex align-center justify-space-between ga-4" :class="{ 'align-start': variant === 'compact' }">
        <div class="flex-grow-1">
          <div v-if="badges.length || statusBadge" class="d-flex align-center ga-2 flex-wrap mb-3">
            <v-chip
              v-for="badge in badges"
              :key="badge.label"
              size="small"
              :color="badge.color ?? 'teal'"
              :variant="badge.variant ?? 'tonal'"
            >
              {{ badge.label }}
            </v-chip>
            <v-chip
              v-if="statusBadge"
              size="small"
              :color="statusBadge.color ?? 'primary'"
              :variant="statusBadge.variant ?? 'tonal'"
            >
              {{ statusBadge.label }}
            </v-chip>
          </div>

          <h2 class="font-weight-bold mb-2" :class="variant === 'compact' ? 'text-h6' : 'text-h5'">{{ title }}</h2>
          <p v-if="headerParts.length" class="text-body-1 mb-2">{{ headerParts.join(' · ') }}</p>
          <p v-if="showMeta" class="text-body-2 text-medium-emphasis mb-1">{{ meta }}</p>
          <p v-if="showTags" class="text-body-2 mb-3">{{ tags.join(' | ') }}</p>
          <p v-if="postedAt" class="text-body-2 text-medium-emphasis mb-0">{{ postedAt }}</p>
        </div>

        <v-avatar
          v-if="showRightAvatar"
          :size="avatarSize"
          rounded="lg"
          color="deep-orange-lighten-4"
          class="text-deep-orange-darken-3 font-weight-bold"
          :class="avatarTextClass"
        >
          {{ logo }}
        </v-avatar>
      </div>

      <div v-if="showApplyAction" class="d-flex justify-end mt-4">
        <v-btn color="primary" variant="flat" @click.prevent="emit('apply')">{{ applyLabel }}</v-btn>
      </div>
    </v-card-text>
  </v-card>
</template>

<style scoped>
.recruit-job-card {
  border-radius: 24px;
  box-shadow: 0 6px 24px rgba(15, 23, 42, 0.08);
}

.recruit-job-card__content {
  padding: 24px;
}
</style>
