<script setup lang="ts">
const model = defineModel<boolean>({ default: false })

const lastFocusedElement = ref<HTMLElement | null>(null)

interface Props {
  title: string
  maxWidth?: string | number
  persistent?: boolean
}

withDefaults(defineProps<Props>(), {
  maxWidth: 700,
  persistent: false,
})

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
</script>

<template>
  <v-dialog v-model="model" :max-width="maxWidth" :persistent="persistent">
    <v-card rounded="xl">
      <v-card-title>{{ title }}</v-card-title>
      <v-card-text>
        <slot />
      </v-card-text>
      <v-card-actions v-if="$slots.actions" class="justify-end">
        <slot name="actions" />
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
