<script setup lang="ts">
import type { TicketItem } from '~/data/platform-enhanced'
const props = defineProps<{ title: string, tickets: TicketItem[] }>()
const priorityColor = (p: TicketItem['priority']) => p === 'P0' ? 'error' : p === 'P1' ? 'warning' : 'info'
</script>

<template>
  <v-card rounded="xl" variant="outlined">
    <v-card-title>{{ props.title }}</v-card-title>
    <v-divider />
    <v-list lines="three" class="py-0">
      <v-list-item v-for="ticket in props.tickets" :key="ticket.id">
        <template #prepend>
          <v-chip :color="priorityColor(ticket.priority)" size="small" variant="tonal">{{ ticket.priority }}</v-chip>
        </template>
        <v-list-item-title>{{ ticket.title }}</v-list-item-title>
        <v-list-item-subtitle>{{ ticket.description }}</v-list-item-subtitle>
        <template #append>
          <div class="text-caption text-medium-emphasis text-right">
            <div>{{ ticket.owner }}</div>
            <div>ETA {{ ticket.eta }}</div>
          </div>
        </template>
      </v-list-item>
    </v-list>
  </v-card>
</template>
