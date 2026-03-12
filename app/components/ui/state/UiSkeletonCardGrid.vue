<script setup lang="ts">
interface Props {
  cards?: number
  columns?: number
}

const props = withDefaults(defineProps<Props>(), {
  cards: 1,
  columns: 12,
})
</script>

<template>
  <div class="ui-skeleton-layout ui-skeleton-card-grid">
    <v-row>
      <v-col v-for="idx in props.cards" :key="`card-grid-${idx}`" :cols="columns">
        <v-skeleton-loader type="card"></v-skeleton-loader>
      </v-col>
    </v-row>
  </div>
</template>
