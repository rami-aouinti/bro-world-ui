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
  skeletonRows?: number
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  search: '',
  itemKey: 'id',
  emptyText: 'Aucune donnée disponible.',
  itemsPerPage: 10,
  itemsPerPageOptions: () => [5, 10, 20, 50],
  skeletonRows: 5,
})

const resolveHeaderKey = (header: DataTableHeader) => header.key ?? header.value ?? ''
const normalizedHeaders = computed(() => props.headers.map((header) => {
  const headerKey = resolveHeaderKey(header)

  if (headerKey !== 'actions') {
    return header
  }

  return {
    ...header,
    align: 'end',
  }
}))
const skeletonRowsCount = computed(() => Math.max(1, props.skeletonRows))
</script>

<template>
  <v-data-table
    class="ui-data-table table thead-light table-striped row-height-auto"
    :headers="normalizedHeaders"
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

    <template #loading>
      <tr
        v-for="index in skeletonRowsCount"
        :key="`skeleton-${index}`"
      >
        <td
          v-for="header in props.headers"
          :key="`skeleton-cell-${resolveHeaderKey(header)}-${index}`"
          class="ui-data-table__skeleton-cell"
        >
          <v-skeleton-loader type="text" class="ui-data-table__skeleton" />
        </td>
      </tr>
    </template>

    <template #no-data>
      <slot name="empty">
        <div class="ui-data-table__empty py-8 text-center text-medium-emphasis">{{ props.emptyText }}</div>
      </slot>
    </template>
  </v-data-table>
</template>


<style scoped>
.ui-data-table {
  border-radius: 1rem;
  overflow: hidden;
  background-color: transparent !important;
}

.ui-data-table :deep(.v-table__wrapper),
.ui-data-table :deep(table),
.ui-data-table :deep(thead),
.ui-data-table :deep(tbody),
.ui-data-table :deep(tr),
.ui-data-table :deep(th),
.ui-data-table :deep(td) {
  background-color: transparent !important;
}

.ui-data-table__empty {
  font-weight: 500;
}

.ui-data-table__skeleton-cell {
  padding: 0.75rem 1rem;
}

.ui-data-table__skeleton :deep(.v-skeleton-loader__text) {
  margin: 0;
}
</style>
