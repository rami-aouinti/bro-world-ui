<script setup lang="ts">
import ShopImageDropzone from '~/components/platform/ShopImageDropzone.vue'

const modelValue = defineModel<File[]>({ default: () => [] })

defineProps<{
  title?: string
}>()
</script>

<template>
  <v-row>
    <v-col cols="12" md="7">
      <ShopImageDropzone v-model="modelValue" />
    </v-col>
    <v-col cols="12" md="5">
      <v-sheet class="shop-admin-surface-muted pa-4 rounded-lg" border>
        <p class="text-subtitle-2 mb-3">{{ title }}</p>
        <slot name="preview" />
      </v-sheet>
    </v-col>
  </v-row>
</template>
