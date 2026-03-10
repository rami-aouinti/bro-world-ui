<script setup lang="ts">
import PageManagementCrud from '~/components/admin/PageManagementCrud.vue'
import { useFaqPageManagementStore } from '~/stores/pageManagement'

definePageMeta({ layout: 'admin', middleware: ['role'], requiredPermissions: ['page.faq.readList'] })
const store = useFaqPageManagementStore()
</script>

<template>
  <PageManagementCrud title="FAQ Page Management" subtitle="Manage /api/v1/page/faq entities." item-name="faq page" :store="store" />
</template>
