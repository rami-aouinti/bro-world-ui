<script setup lang="ts">
const { t, te } = useI18n()

const props = defineProps<{ title: string, subtitle: string, cta?: string }>()

const resolveLabel = (value?: string) => {
  if (!value) return ''
  return te(value) ? t(value) : value
}
</script>

<template>
  <v-sheet class="hero-header mb-6" rounded="xl">
    <div>
      <h1 class="hero-header__title text-h5 font-weight-bold mb-1">{{ resolveLabel(props.title) }}</h1>
      <p class="hero-header__subtitle text-body-2">{{ resolveLabel(props.subtitle) }}</p>
    </div>
    <v-btn v-if="props.cta" color="primary" prepend-icon="mdi-lightning-bolt-outline">{{ resolveLabel(props.cta) }}</v-btn>
  </v-sheet>
</template>

<style scoped>
.hero-header {
  display: flex;
  justify-content: space-between;
  gap: var(--platform-space-4);
  align-items: center;
  padding: var(--platform-space-4);
  border: 1px solid var(--platform-color-border);
  background: linear-gradient(
    120deg,
    var(--platform-color-accent-soft),
    var(--platform-color-surface-muted)
  );
  box-shadow: var(--platform-shadow-sm);
}

.hero-header__title {
  color: var(--platform-color-text-primary);
}

.hero-header__subtitle {
  color: var(--platform-color-text-secondary);
}
</style>
