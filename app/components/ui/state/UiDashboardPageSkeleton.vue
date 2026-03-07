<template>
  <v-container fluid class="py-6">
    <v-row class="mb-4" dense>
      <v-col v-for="idx in 4" :key="idx" cols="12" sm="6" lg="3">
        <v-skeleton-loader type="card" />
      </v-col>
    </v-row>

    <v-row dense>
      <v-col cols="12" lg="8">
        <v-skeleton-loader type="image" height="280" />
      </v-col>

      <v-col cols="12" lg="4">
        <v-skeleton-loader type="list-item-two-line@5" />
      </v-col>
    </v-row>
  </v-container>
</template>
