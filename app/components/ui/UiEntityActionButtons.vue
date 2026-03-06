<script setup lang="ts">
interface Props {
  showLabel: string
  patchLabel?: string
  deleteLabel?: string
  showPatch?: boolean
  showDelete?: boolean
}

withDefaults(defineProps<Props>(), {
  patchLabel: '',
  deleteLabel: '',
  showPatch: true,
  showDelete: true,
})

const emit = defineEmits<{
  (e: 'show'): void
  (e: 'patch'): void
  (e: 'delete'): void
}>()
</script>

<template>
  <div class="ui-entity-action-buttons d-flex justify-end flex-nowrap ga-1 py-1">
    <v-btn
      size="x-small"
      variant="text"
      color="success"
      icon="mdi-eye"
      :aria-label="showLabel"
      @click="emit('show')"
    />

    <v-btn
      v-if="showPatch"
      size="x-small"
      variant="text"
      color="warning"
      icon="mdi-file-edit-outline"
      :aria-label="patchLabel"
      @click="emit('patch')"
    />

    <v-btn
      v-if="showDelete"
      size="x-small"
      variant="text"
      color="red"
      icon="mdi-delete"
      :aria-label="deleteLabel"
      @click="emit('delete')"
    />
  </div>
</template>
