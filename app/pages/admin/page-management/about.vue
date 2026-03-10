<script setup lang="ts">
import PageManagementCrud from '~/components/admin/PageManagementCrud.vue'
import { useAboutPageManagementStore } from '~/stores/pageManagement'

definePageMeta({ layout: 'admin', middleware: ['role'], requiredPermissions: ['page.about.readList'] })
const store = useAboutPageManagementStore()
</script>

<template>
  <PageManagementCrud title="About Page Management" subtitle="Manage /api/v1/page/about entities." item-name="about page" :store="store" />
</template>
