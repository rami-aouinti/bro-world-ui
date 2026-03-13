<script setup lang="ts">
const props = withDefaults(defineProps<{
  sticky?: boolean
  stickyTop?: string
  rounded?: string
}>(), {
  sticky: true,
  stickyTop: '84px',
  rounded: 'lg',
})

const stickyStyle = computed(() => {
  if (!props.sticky) {
    return undefined
  }

  return {
    '--ui-aside-sticky-top': props.stickyTop,
  }
})
</script>

<template>
  <aside class="ui-aside">
    <v-card
      class="ui-aside__card bg-transparent"
      :class="{ 'ui-aside__card--sticky': sticky }"
      :style="stickyStyle"
      :rounded="rounded"
      elevation="0"
    >
      <slot />
    </v-card>
  </aside>
</template>

<style scoped>
.ui-aside {
  min-width: 0;
}

.ui-aside__card {
  position: relative;
  background: linear-gradient(160deg, #f6f6f8 0%, #ececef 100%);
  border-radius: 14px;
  border: 1px solid #d4d5dc;
  box-shadow: 0 4px 12px rgba(15, 23, 42, 0.08);
  padding: 0.85rem;
  overflow: hidden;
  transition: transform 0.25s ease, box-shadow 0.25s ease;
}

.ui-aside__card::before {
  content: '';
  position: absolute;
  right: 0;
  top: 0;
  width: 0;
  height: 0;
  border-style: solid;
  border-width: 0 26px 26px 0;
  border-color: transparent #d9d5ff transparent transparent;
  transition: border-width 0.25s ease;
}

.ui-aside__card:hover {
  transform: translateY(-4px);
  box-shadow: 0 10px 20px rgba(45, 45, 94, 0.16);
}

.ui-aside__card:hover::before {
  border-width: 0 36px 36px 0;
}

.ui-aside__card--sticky {
  position: sticky;
  top: var(--ui-aside-sticky-top, 84px);
}
</style>
