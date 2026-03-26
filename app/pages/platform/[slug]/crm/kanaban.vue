<script setup lang="ts">
definePageMeta({ public: true, requiresAuth: false })

const route = useRoute()
const slug = computed(() => String(route.params.slug ?? ''))

await navigateTo(`/platform/${slug.value}/crm/kanban`, { redirectCode: 301, replace: true })
</script>
