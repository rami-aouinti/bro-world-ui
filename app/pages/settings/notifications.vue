<script setup lang="ts">
definePageMeta({ public: true, requiresAuth: false })

const items = [
  { title: 'Mentions', description: 'Notify when another user mentions you in a comment' },
  { title: 'Comments', description: 'Notify when another user comments your item' },
  { title: 'Follows', description: 'Notify when another user follows you' },
  { title: 'Log in from a new device', description: '' },
]
</script>

<template>
  <SettingsLayout>
    <h3 class="text-h5 font-weight-bold mb-1">Notifications</h3>
    <p class="text-body-1 text-medium-emphasis mb-6">Choose how you receive notifications.</p>
    <v-table>
      <thead>
      <tr>
        <th>Activity</th>
        <th class="text-center">Email</th>
        <th class="text-center">Push</th>
        <th class="text-center">SMS</th>
      </tr>
      </thead>
      <tbody>
      <tr v-for="item in items" :key="item.title">
        <td>
          <div class="font-weight-medium">{{ item.title }}</div>
          <div class="text-body-2 text-medium-emphasis">{{ item.description }}</div>
        </td>
        <td class="text-center"><v-switch hide-details /></td>
        <td class="text-center"><v-switch hide-details /></td>
        <td class="text-center"><v-switch hide-details /></td>
      </tr>
      </tbody>
    </v-table>
  </SettingsLayout>
</template>
