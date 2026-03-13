<script setup lang="ts">
import UiCard from '~/components/ui/UiCard.vue'
import UiSectionHeader from '~/components/ui/UiSectionHeader.vue'

definePageMeta({
  layout: 'admin',
  middleware: ['role'],
  requiredPermissions: ['page.home.readList'],
})

const isPageLoading = ref(true)

onMounted(() => {
  isPageLoading.value = false
})

const modules = [
  { title: 'Home', to: '/admin/page-management/home', icon: 'mdi-home-outline', detail: 'Last update: 2 days ago' },
  { title: 'About', to: '/admin/page-management/about', icon: 'mdi-information-outline', detail: 'Last update: yesterday at 18:20' },
  { title: 'Contact', to: '/admin/page-management/contact', icon: 'mdi-card-account-phone-outline', detail: '12 forms received today' },
  { title: 'FAQ', to: '/admin/page-management/faq', icon: 'mdi-frequently-asked-questions', detail: '34 published questions' },
]
</script>

<template>
  <div class="admin-page-content">
    <template v-if="isPageLoading">
      <v-skeleton-loader type="heading, text" class="mb-4" />
      <v-row>
        <v-col v-for="index in 4" :key="`admin-skeleton-${index}`" cols="12" md="6">
          <v-card rounded="lg" class="pa-4">
            <v-skeleton-loader type="list-item-avatar-two-line, button" />
          </v-card>
        </v-col>
      </v-row>
    </template>

    <template v-else>
    <UiSectionHeader title="Page Management" subtitle="Manage, edit, and publish institutional content." />
    <v-row>
      <v-col v-for="module in modules" :key="module.to" cols="12" md="6">
        <UiCard rounded="lg" compact>
          <div class="d-flex align-start ga-3">
            <v-avatar color="teal" variant="tonal" size="42">
              <v-icon :icon="module.icon" size="22" />
            </v-avatar>
            <div class="flex-grow-1">
              <h2 class="text-h6 mb-1">{{ module.title }}</h2>
              <p class="text-caption text-medium-emphasis mb-3">{{ module.detail }}</p>
              <v-btn color="primary" variant="outlined" :to="module.to" append-icon="mdi-arrow-right">Open</v-btn>
            </div>
          </div>
        </UiCard>
      </v-col>
    </v-row>
      </template>
  </div>
</template>
