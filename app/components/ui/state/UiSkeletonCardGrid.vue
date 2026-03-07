<script setup lang="ts">
interface Props {
  cards?: number
}

const props = withDefaults(defineProps<Props>(), {
  cards: 6,
})
</script>

<template>
  <div class="ui-skeleton-layout ui-skeleton-card-grid">
    <div class="ui-skeleton-grid ui-skeleton-grid--cards">
      <div
        v-for="idx in props.cards"
        :key="`card-grid-${idx}`"
        class="ui-skeleton-block ui-skeleton-block--card"
      />
    </div>
  </div>
</template>
