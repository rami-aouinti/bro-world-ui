<script setup lang="ts">
const model = defineModel<boolean>({ default: false })

interface Props {
  title: string
  maxWidth?: string | number
  persistent?: boolean
}

withDefaults(defineProps<Props>(), {
  maxWidth: 700,
  persistent: false,
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
