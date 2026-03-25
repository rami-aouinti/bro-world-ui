<script setup lang="ts">
const model = defineModel<boolean>({ default: false })

const lastFocusedElement = ref<HTMLElement | null>(null)

interface Props {
  title: string
  message: string
  confirmLabel: string
  cancelLabel: string
  loading?: boolean
  confirmColor?: string
  maxWidth?: string | number
}

withDefaults(defineProps<Props>(), {
  loading: false,
  confirmColor: 'error',
  maxWidth: 420,
})

const emit = defineEmits<{
  confirm: []
}>()


watch(model, (isOpen, wasOpen) => {
  if (isOpen && !wasOpen) {
    lastFocusedElement.value = document.activeElement instanceof HTMLElement ? document.activeElement : null
    return
  }

  if (!isOpen && wasOpen) {
    nextTick(() => {
      lastFocusedElement.value?.focus()
    })
  }
})

const closeDialog = () => {
  model.value = false
}

const confirmAction = () => {
  emit('confirm')
}
</script>

<template>
  <v-dialog v-model="model" :max-width="maxWidth">
    <v-card rounded="xl">
      <v-card-title>{{ title }}</v-card-title>
      <v-card-text>{{ message }}</v-card-text>

      <v-card-actions class="justify-end">
        <v-btn variant="text" :disabled="loading" @click="closeDialog">
          {{ cancelLabel }}
        </v-btn>
        <v-btn :color="confirmColor" :loading="loading" @click="confirmAction">
          {{ confirmLabel }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
