<script setup lang="ts">
interface Props {
  cards?: number
  sections?: number
}

const props = withDefaults(defineProps<Props>(), {
  cards: 4,
  sections: 2,
})
</script>

<template>
  <div class="ui-skeleton-layout ui-skeleton-dashboard">
    <div class="ui-skeleton-grid ui-skeleton-grid--cards mb-4">
      <div
        v-for="idx in props.cards"
        :key="`dashboard-card-${idx}`"
        class="ui-skeleton-block ui-skeleton-block--card"
      />
    </div>

    <div class="ui-skeleton-dashboard__sections">
      <div
        v-for="idx in props.sections"
        :key="`dashboard-section-${idx}`"
        class="ui-skeleton-block ui-skeleton-block--section"
      />
    </div>
  </div>
</template>
