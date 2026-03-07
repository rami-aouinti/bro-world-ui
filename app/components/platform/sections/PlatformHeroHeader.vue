<script setup lang="ts">
const props = defineProps<{ title: string, subtitle: string, cta?: string }>()
</script>

<template>
  <v-sheet class="hero-header mb-6" rounded="xl">
    <div>
      <h1 class="text-h5 font-weight-bold mb-1">{{ props.title }}</h1>
      <p class="text-body-2 text-medium-emphasis">{{ props.subtitle }}</p>
    </div>
    <v-btn v-if="props.cta" color="primary" prepend-icon="mdi-lightning-bolt-outline">{{ props.cta }}</v-btn>
  </v-sheet>
</template>

<style scoped>
.hero-header {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  align-items: center;
  padding: 1rem;
  border: 1px solid rgba(127, 127, 127, 0.16);
  background: linear-gradient(120deg, rgba(103, 58, 183, 0.08), rgba(3, 169, 244, 0.06));
}
</style>
