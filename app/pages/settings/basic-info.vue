<script setup lang="ts">
definePageMeta({ public: true, requiresAuth: false })
</script>

<template>
  <SettingsLayout>
    <h3 class="text-h5 font-weight-bold mb-6">Basic Info</h3>
    <v-row>
      <v-col cols="12" md="6"><v-text-field label="First Name" variant="underlined" /></v-col>
      <v-col cols="12" md="6"><v-text-field label="Last Name" variant="underlined" /></v-col>
      <v-col cols="12" md="4"><v-select :items="['Female', 'Male']" label="I'm" variant="underlined" /></v-col>
      <v-col cols="12" md="8"><v-text-field label="Birth Date" variant="underlined" placeholder="February 1, 2022" /></v-col>
      <v-col cols="12" md="6"><v-text-field label="Email" variant="underlined" /></v-col>
      <v-col cols="12" md="6"><v-text-field label="Confirmation Email" variant="underlined" /></v-col>
      <v-col cols="12" md="6"><v-text-field label="Your Location" variant="underlined" /></v-col>
      <v-col cols="12" md="6"><v-text-field label="Phone Number" variant="underlined" /></v-col>
      <v-col cols="12" md="6"><v-select :items="['English', 'French', 'Spanish']" label="Language" variant="underlined" /></v-col>
      <v-col cols="12" md="6"><v-select :items="['Vue', 'Angular', 'React']" label="Skills" chips multiple variant="underlined" /></v-col>
    </v-row>
  </SettingsLayout>
</template>
