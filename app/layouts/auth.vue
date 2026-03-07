<script setup lang="ts">
withDefaults(defineProps<{
  showPageSkeleton?: boolean
  pageSkeletonKey?: string
}>(), {
  showPageSkeleton: false,
  pageSkeletonKey: '',
})
</script>

<template>
  <v-app>
    <v-main>
      <template v-if="showPageSkeleton">
        <slot name="layout-skeleton">
          <v-container class="py-12">
            <v-row justify="center">
              <v-col cols="12" sm="10" md="6" lg="4">
                <v-skeleton-loader type="card" />
              </v-col>
            </v-row>
          </v-container>
        </slot>
      </template>

      <slot v-else />
    </v-main>
  </v-app>
</template>
