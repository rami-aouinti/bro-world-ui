<script setup lang="ts">
import UiAvatar from '~/components/ui/UiAvatar.vue'
import UiPageSection from '~/components/ui/UiPageSection.vue'
import UiSectionHeader from '~/components/ui/UiSectionHeader.vue'

definePageMeta({
  public: true,
  requiresAuth: false,
})

const route = useRoute()

const username = computed(() => String(route.params.username ?? ''))
const displayName = computed(() => username.value || 'Unknown user')
</script>

<template>
  <UiPageSection max-width="900" card>
    <template #header>
      <UiSectionHeader
        title="User Profile"
        :subtitle="`Profil public de @${username}`"
      />
    </template>

    <div class="d-flex align-center ga-3 mb-4">
      <UiAvatar :name="displayName" size="lg" />
      <div>
        <p class="text-h6 mb-0">@{{ username }}</p>
        <p class="text-body-2 text-medium-emphasis mb-0">Public profile page</p>
      </div>
    </div>

    <div class="d-flex ga-3 flex-wrap">
      <v-btn variant="outlined" to="/platform">Voir les platforms</v-btn>
      <v-btn color="primary" variant="flat" to="/profile">Mon profil</v-btn>
    </div>
  </UiPageSection>
</template>
