<script setup lang="ts">
import type { TicketItem } from '~/data/platform-enhanced'

const props = defineProps<{ title: string, tickets: TicketItem[] }>()
const priorityColor = (p: TicketItem['priority']) => p === 'P0' ? 'error' : p === 'P1' ? 'warning' : 'info'
</script>

<template>
  <v-card rounded="xl" variant="outlined" class="ticket-board">
    <v-card-title class="ticket-board__title">{{ props.title }}</v-card-title>
    <v-divider class="ticket-board__divider" />
    <v-list lines="three" class="ticket-board__list py-0">
      <v-list-item v-for="ticket in props.tickets" :key="ticket.id" class="ticket-board__item">
        <template #prepend>
          <v-chip :color="priorityColor(ticket.priority)" size="small" variant="tonal">{{ ticket.priority }}</v-chip>
        </template>
        <v-list-item-title class="ticket-board__item-title">{{ ticket.title }}</v-list-item-title>
        <v-list-item-subtitle class="ticket-board__item-subtitle">{{ ticket.description }}</v-list-item-subtitle>
        <template #append>
          <div class="ticket-board__meta text-caption text-right">
            <div>{{ ticket.owner }}</div>
            <div>ETA {{ ticket.eta }}</div>
          </div>
        </template>
      </v-list-item>
    </v-list>
  </v-card>
</template>

<style scoped>
.ticket-board {
  border-color: var(--platform-color-border);
  background: var(--platform-color-surface);
  box-shadow: var(--platform-shadow-sm);
}

.ticket-board__title,
.ticket-board__item-title {
  color: var(--platform-color-text-primary);
}

.ticket-board__divider {
  border-color: var(--platform-color-border);
  opacity: 1;
}

.ticket-board__item {
  border-bottom: 1px solid var(--platform-color-border);
}

.ticket-board__item:last-child {
  border-bottom: none;
}

.ticket-board__item-subtitle,
.ticket-board__meta {
  color: var(--platform-color-text-secondary);
}
</style>
