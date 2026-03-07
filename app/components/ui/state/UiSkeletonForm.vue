<script setup lang="ts">
interface Props {
  sections?: number
}

const props = withDefaults(defineProps<Props>(), {
  sections: 3,
})
</script>

<template>
  <div class="ui-skeleton-layout ui-skeleton-form">
    <div
      v-for="idx in props.sections"
      :key="`form-section-${idx}`"
      class="ui-skeleton-form__section"
    >
      <div class="ui-skeleton-block ui-skeleton-block--label" />
      <div class="ui-skeleton-block ui-skeleton-block--input" />
    </div>

    <div class="ui-skeleton-block ui-skeleton-block--button mt-2" />
  </div>
</template>
