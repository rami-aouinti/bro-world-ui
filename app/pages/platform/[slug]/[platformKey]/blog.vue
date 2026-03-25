<script setup lang="ts">
import BlogFeed from '~/components/plugins/BlogFeed.vue'
import { useBlogsApi } from '~/composables/api/useBlogsApi'
import { usePlatformPluginPage } from '~/composables/platform/usePlatformPluginPage'
import type { BlogRead } from '~/types/api/blog'

definePageMeta({ public: true, requiresAuth: false })

const { slug, navItems, isAuthenticated } = usePlatformPluginPage()
const { t } = useI18n()
const blogsApi = useBlogsApi()

const blog = ref<BlogRead | null>(null)
const pending = ref(false)
const error = ref<unknown>(null)
let blogController: AbortController | null = null

const isAbortError = (err: unknown) => err instanceof DOMException && err.name === 'AbortError'

const loadBlog = async () => {
  blogController?.abort()
  const controller = new AbortController()
  blogController = controller

  pending.value = true
  error.value = null

  try {
    const response = await blogsApi.getApplicationBlog(slug.value, { signal: controller.signal })

    if (blogController === controller) {
      blog.value = response
    }
  }
  catch (loadError: unknown) {
    if (!isAbortError(loadError) && blogController === controller) {
      error.value = loadError
    }
  }
  finally {
    if (blogController === controller) {
      pending.value = false
    }
  }
}

watch(slug, () => {
  void loadBlog()
}, { immediate: true })

onBeforeUnmount(() => {
  blogController?.abort()
})
</script>

<template>
  <PlatformPluginPageShell title="Blog" :slug="slug" :nav-items="navItems">
    <v-alert v-if="error" type="error" variant="tonal" class="mb-4">{{ t('platform.errors.blogLoad') }}</v-alert>
    <v-skeleton-loader v-else-if="pending" type="image, article@2" class="mb-4" />
    <BlogFeed v-else-if="blog" :blog="blog" :show-stories="isAuthenticated" :can-interact="isAuthenticated" />
  </PlatformPluginPageShell>
</template>
