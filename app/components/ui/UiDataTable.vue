<script setup lang="ts">
interface DataTableHeader {
  key?: string
  value?: string
  title?: string
  [key: string]: unknown
}

interface Props {
  headers: DataTableHeader[]
  items: Record<string, unknown>[]
  loading?: boolean
  search?: string
  itemKey?: string
  emptyText?: string
  itemsPerPage?: number
  itemsPerPageOptions?: number[]
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  search: '',
  itemKey: 'id',
  emptyText: 'Aucune donnée disponible.',
  itemsPerPage: 10,
  itemsPerPageOptions: () => [5, 10, 20, 50],
})

const resolveHeaderKey = (header: DataTableHeader) => header.key ?? header.value ?? ''
</script>

<template>
  <v-data-table
    class="ui-data-table"
    :headers="props.headers"
    :items="props.items"
    :loading="props.loading"
    :search="props.search"
    :item-value="props.itemKey"
    :items-per-page="props.itemsPerPage"
    :items-per-page-options="props.itemsPerPageOptions"
  >
    <template
      v-for="header in props.headers"
      :key="resolveHeaderKey(header)"
      #[`item.${resolveHeaderKey(header)}`]="slotProps"
    >
      <slot :name="`item.${resolveHeaderKey(header)}`" v-bind="slotProps">
        {{ slotProps.value }}
      </slot>
    </template>

    <template #item.actions="slotProps">
      <slot name="item.actions" v-bind="slotProps" />
    </template>

    <template #no-data>
      <slot name="empty">
        <div class="py-8 text-center text-medium-emphasis">{{ props.emptyText }}</div>
      </slot>
    </template>
  </v-data-table>
</template>
