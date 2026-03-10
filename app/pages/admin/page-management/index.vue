<script setup lang="ts">
import UiCard from '~/components/ui/UiCard.vue'
import UiSectionHeader from '~/components/ui/UiSectionHeader.vue'

definePageMeta({
  layout: 'admin',
  middleware: ['role'],
  requiredPermissions: ['page.home.readList'],
})

const modules = [
  { title: 'Home', to: '/admin/page-management/home', icon: 'mdi-home-outline' },
  { title: 'About', to: '/admin/page-management/about', icon: 'mdi-information-outline' },
  { title: 'Contact', to: '/admin/page-management/contact', icon: 'mdi-card-account-phone-outline' },
  { title: 'FAQ', to: '/admin/page-management/faq', icon: 'mdi-frequently-asked-questions' },
]
</script>

<template>
  <div class="admin-page-content">
    <UiSectionHeader title="Page Management" subtitle="CRUD for Home, About, Contact and FAQ pages." />
    <v-row>
      <v-col v-for="module in modules" :key="module.to" cols="12" md="6">
        <UiCard variant="tonal" rounded="lg" compact>
          <div class="d-flex align-start ga-3">
            <v-icon :icon="module.icon" color="primary" size="26" class="mt-1" />
            <div class="flex-grow-1">
              <h2 class="text-h6 mb-1">{{ module.title }}</h2>
              <v-btn color="primary" variant="outlined" :to="module.to" append-icon="mdi-arrow-right">Open</v-btn>
            </div>
          </div>
        </UiCard>
      </v-col>
    </v-row>
  </div>
</template>
