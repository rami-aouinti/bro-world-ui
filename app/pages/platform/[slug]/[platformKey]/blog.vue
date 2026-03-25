<script setup lang="ts">
import BlogFeed from '~/components/plugins/BlogFeed.vue'
import { useBlogsApi } from '~/composables/api/useBlogsApi'
import { usePlatformPluginPage } from '~/composables/platform/usePlatformPluginPage'

definePageMeta({ public: true, requiresAuth: false })

const { slug, navItems, isAuthenticated } = usePlatformPluginPage()
const { t } = useI18n()
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
    <v-alert v-if="error" type="error" variant="tonal" class="mb-4">{{ t('platform.errors.blogLoad') }}</v-alert>
    <v-skeleton-loader v-else-if="pending" type="image, article@2" class="mb-4" />
    <BlogFeed v-else-if="blog" :blog="blog" :show-stories="isAuthenticated" :can-interact="isAuthenticated" />
  </PlatformPluginPageShell>
</template>
