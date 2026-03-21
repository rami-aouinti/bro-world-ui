<script setup lang="ts">
import { socialSuggestions } from '~/data/settings-demo'

definePageMeta({ public: false, requiresAuth: true })

const currentUser = useCurrentUserStore()

onMounted(() => currentUser.fetchMe())
</script>

<template>
  <SettingsLayout>
    <v-card rounded="xl">
      <v-card-text>
        <h3 class="text-h5 font-weight-bold mb-1">Connected accounts</h3>
        <p class="text-body-2 text-medium-emphasis mb-4">Social providers linked to your account.</p>

        <v-list>
          <template v-for="(provider, index) in currentUser.me?.socials || []" :key="provider.provider">
            <v-list-item :title="provider.provider" :subtitle="provider.providerId" prepend-icon="mdi-link-variant" />
            <v-divider v-if="index < (currentUser.me?.socials?.length || 0) - 1" class="my-2" />
          </template>
        </v-list>
      </v-card-text>
    </v-card>
    <template #aside>
      <v-card-text>
        <h4 class="text-subtitle-1 font-weight-bold mb-3">Suggested integrations (fake data)</h4>
        <v-list density="compact" class="bg-transparent">
          <v-list-item v-for="item in socialSuggestions" :key="item.provider" :title="item.provider" :subtitle="item.description" :prepend-icon="item.icon">
            <template #append><v-btn size="small" variant="text">Connect</v-btn></template>
          </v-list-item>
        </v-list>
      </v-card-text>
    </template>
  </SettingsLayout>
</template>
