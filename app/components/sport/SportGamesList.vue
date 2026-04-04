<script setup lang="ts">
import type { SportGameCardItem } from './types'

const props = defineProps<{
  games: SportGameCardItem[]
}>()
</script>

<template>
  <v-row>
    <v-col
      v-for="game in props.games"
      :key="game.id"
      cols="12"
      md="6"
      lg="4"
    >
      <SportGameCard :game="game" />
    </v-col>
  </v-row>
</template>
