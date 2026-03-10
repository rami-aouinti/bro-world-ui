<script setup lang="ts">
import PageManagementCrud from '~/components/admin/PageManagementCrud.vue'
import { useHomePageManagementStore } from '~/stores/pageManagement'

definePageMeta({ layout: 'admin', middleware: ['role'], requiredPermissions: ['page.home.readList'] })
const store = useHomePageManagementStore()
</script>

<template>
  <PageManagementCrud title="Home Page Management" subtitle="Manage /api/v1/page/home entities." item-name="home page" :store="store" />
</template>
