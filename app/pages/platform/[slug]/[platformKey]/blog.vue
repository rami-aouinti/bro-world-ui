<script setup lang="ts">
import BlogFeed from '~/components/plugins/BlogFeed.vue'
import { useBlogsApi } from '~/composables/api/useBlogsApi'
import { usePlatformPluginPage } from '~/composables/platform/usePlatformPluginPage'

definePageMeta({ public: true, requiresAuth: false })

const { slug, navItems, isAuthenticated } = usePlatformPluginPage()
const blogsApi = useBlogsApi()

const { data: blog, pending, error, execute: loadBlog } = useAsyncData(
  () => `application-blog-${slug.value}`,
  () => blogsApi.getApplicationBlog(slug.value),
  {
    watch: [slug],
    server: false,
    immediate: false,
  },
)

onMounted(() => {
  void loadBlog()
})
</script>

<template>
  <PlatformPluginPageShell title="Blog" :slug="slug" :nav-items="navItems">
    <v-alert v-if="error" type="error" variant="tonal" class="mb-4">Impossible de charger le blog de cette platform.</v-alert>
    <v-progress-linear v-else-if="pending" color="primary" indeterminate class="mb-4" />
    <BlogFeed v-else-if="blog" :blog="blog" :can-interact="isAuthenticated" />
  </PlatformPluginPageShell>
</template>
