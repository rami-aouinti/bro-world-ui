<script setup lang="ts">
import type { ContactPagePayload } from '~/types/api/page'

defineProps<{
  cta: ContactPagePayload['cta']
}>()
</script>

<template>
  <v-card class="contact-channel mt-4" rounded="xl" variant="outlined">
    <h2 class="text-h6 mb-2">{{ cta.title }}</h2>
    <p class="text-body-2 text-high-emphasis mb-4">{{ cta.description }}</p>
    <div class="d-flex flex-wrap ga-3">
      <v-btn
        v-for="action in cta.actions"
        :key="action.label"
        :color="action.variant === 'primary' ? 'primary' : undefined"
        :variant="action.variant === 'outlined' ? 'outlined' : 'flat'"
      >
        {{ action.label }}
      </v-btn>
    </div>
  </v-card>
</template>
<style scoped>
.contact-channel {
  padding: 1rem;
}
</style>
