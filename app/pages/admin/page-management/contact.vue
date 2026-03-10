<script setup lang="ts">
import PageManagementCrud from '~/components/admin/PageManagementCrud.vue'
import { useContactPageManagementStore } from '~/stores/pageManagement'

definePageMeta({ layout: 'admin', middleware: ['role'], requiredPermissions: ['page.contact.readList'] })
const store = useContactPageManagementStore()
</script>

<template>
  <PageManagementCrud title="Contact Page Management" subtitle="Manage /api/v1/page/contact entities." item-name="contact page" :store="store" />
</template>
