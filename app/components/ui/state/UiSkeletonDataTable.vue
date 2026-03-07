<script setup lang="ts">
interface Props {
  rows?: number
}

const props = withDefaults(defineProps<Props>(), {
  rows: 6,
})
</script>

<template>
  <div class="ui-skeleton-layout ui-skeleton-datatable">
    <div class="ui-skeleton-block ui-skeleton-block--table-header mb-3" />

    <div class="ui-skeleton-datatable__rows">
      <div
        v-for="idx in props.rows"
        :key="`datatable-row-${idx}`"
        class="ui-skeleton-datatable__row"
      >
        <span class="ui-skeleton-block ui-skeleton-block--table-cell ui-skeleton-block--w-30" />
        <span class="ui-skeleton-block ui-skeleton-block--table-cell ui-skeleton-block--w-20" />
        <span class="ui-skeleton-block ui-skeleton-block--table-cell ui-skeleton-block--w-15" />
        <span class="ui-skeleton-block ui-skeleton-block--table-cell ui-skeleton-block--w-25" />
      </div>
    </div>
  </div>
</template>
