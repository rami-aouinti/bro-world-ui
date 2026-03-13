<script setup lang="ts">
import type { BlogAuthor, BlogComment, BlogPost, BlogRead, BlogReaction } from '~/types/api/blog'
import BlogSummaryCard from '~/components/plugins/BlogSummaryCard.vue'
import BlogCommentItem from '~/components/plugins/BlogCommentItem.vue'
import UiAvatar from '~/components/ui/UiAvatar.vue'
import { useBlogsStore } from '~/stores/blogs'
import { useAuthSessionStore } from '~/stores/authSession'
import { useStoriesStore } from '~/stores/stories'
import { BLOG_REACTION_FALLBACK_TYPES, BLOG_REACTION_META } from '~/constants/blogReactions'

const props = withDefaults(defineProps<{
  blog: BlogRead
  showSummary?: boolean
  showCreatePost?: boolean
  canInteract?: boolean
}>(), {
  showSummary: true,
  showCreatePost: true,
  canInteract: true,
})

const blogsStore = useBlogsStore()
const storiesStore = useStoriesStore()
const authSession = useAuthSessionStore()
const actionError = ref('')
const creatingPost = ref(false)
const newPostContent = ref('')
const newPostFilePath = ref('')
const newPostImageFiles = ref<string[]>([])
const createPostDialog = ref(false)
const showEmojiMenu = ref(false)
const showPostOptionsDialog = ref(false)
const postPhotoInput = ref<HTMLInputElement | null>(null)
const postModalPhotoInput = ref<HTMLInputElement | null>(null)
const postVideoInput = ref<HTMLInputElement | null>(null)
const showVideoChoiceDialog = ref(false)
const showVideoRecorderDialog = ref(false)
const showVideoReviewDialog = ref(false)
const recordingVideo = ref(false)
const capturedVideo = ref('')
const recorderPreview = ref<HTMLVideoElement | null>(null)
let recorderStream: MediaStream | null = null
let mediaRecorder: MediaRecorder | null = null
let recordedChunks: Blob[] = []
const commentDrafts = ref<Record<string, string>>({})
const commentAttachmentPath = ref<Record<string, string | null>>({})
const commentPhotoInput = ref<Record<string, HTMLInputElement | null>>({})
const postReactionPicker = ref<Record<string, boolean>>({})
const expandedComments = ref<Record<string, boolean>>({})

const editPostDialog = ref(false)
const deletePostDialog = ref(false)
const activePost = ref<BlogRead['posts'][number] | null>(null)
const editPostContent = ref('')
const editPostFilePath = ref('')
const sharePostDialog = ref(false)
const shareAuthorsDialog = ref(false)
const sharePostTarget = ref<BlogRead['posts'][number] | null>(null)
const shareDraftContent = ref('')
const shareAuthors = ref<BlogAuthor[]>([])
const storyPhotoInput = ref<HTMLInputElement | null>(null)

const stories = computed(() => storiesStore.stories)
const isLoadingStories = computed(() => storiesStore.loading)
const ownStoryIds = computed(() => {
  const ownerGroup = stories.value.find(storyGroup => storyGroup.owner)
  return new Set((ownerGroup?.stories ?? []).map(story => story.id))
})

const postAuthorName = (post: BlogRead['posts'][number]) => `${post.author?.firstName ?? 'Unknown'} ${post.author?.lastName ?? 'User'}`.trim()
const currentUserName = computed(() => {
  const firstName = authSession.profile?.firstName?.trim() ?? ''
  return firstName || 'there'
})
const currentUserDisplayName = computed(() => {
  const first = authSession.profile?.firstName?.trim() ?? ''
  const last = authSession.profile?.lastName?.trim() ?? ''
  return `${first} ${last}`.trim() || 'You'
})
const composerEmojis = ['😀', '😍', '🔥', '🎉', '💡', '🚀']
const postQuickActions = [
  { key: 'photo', icon: 'mdi-image-multiple', label: 'Foto/Video', color: '#42c96f' },
  { key: 'tag', icon: 'mdi-account-plus', label: 'Personen markieren', color: '#2d8cff' },
  { key: 'emoji', icon: 'mdi-emoticon-happy-outline', label: 'Gefühl/Aktivität', color: '#f6c244' },
  { key: 'more', icon: 'mdi-dots-horizontal', label: 'Mehr', color: '#8b9098' },
]
const postAllOptions = [
  { icon: 'mdi-image-multiple', label: 'Foto/Video', color: '#42c96f' },
  { icon: 'mdi-account-plus', label: 'Personen markieren', color: '#2d8cff' },
  { icon: 'mdi-emoticon-happy-outline', label: 'Gefühl/Aktivität', color: '#f6c244' },
  { icon: 'mdi-map-marker', label: 'Ort hinzufügen', color: '#ff5d47' },
  { icon: 'mdi-gif', label: 'GIF', color: '#35d0c4' },
  { icon: 'mdi-video-outline', label: 'Live-Video', color: '#ff2f67' },
  { icon: 'mdi-flag-outline', label: 'Lebensereignis', color: '#33a8ff' },
  { icon: 'mdi-heart-circle-outline', label: 'Spenden sammeln', color: '#ff72bb' },
]
const postAuthorProfilePath = (post: BlogRead['posts'][number]) => {
  const username = post.author?.username?.trim()
  return username ? `/user/${encodeURIComponent(username)}/profile` : undefined
}
const reactionAuthorProfilePath = (username?: string) => {
  const normalized = username?.trim()
  return normalized ? `/user/${encodeURIComponent(normalized)}/profile` : undefined
}
const countComments = (comments: BlogComment[]): number => comments.reduce((total, comment) => total + 1 + countComments(comment.children), 0)

const reactionMeta = BLOG_REACTION_META

const availableReactionTypes = computed(() => {
  const types = blogsStore.reactionTypes?.length ? blogsStore.reactionTypes : [...BLOG_REACTION_FALLBACK_TYPES]
  return types.filter(type => reactionMeta[type])
})

const currentUserPostReaction = (post: BlogRead['posts'][number]) => post.reactions?.find(reaction => reaction.isAuthor)

const isCurrentUserReaction = (post: BlogRead['posts'][number], type: string) => currentUserPostReaction(post)?.type === type

const postReactionSummary = (reactions: BlogReaction[] = []) => {
  const map = new Map<string, number>()
  reactions.forEach((reaction) => {
    map.set(reaction.type, (map.get(reaction.type) ?? 0) + 1)
  })

  return Array.from(map.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
}

const groupedPostReactions = (reactions: BlogReaction[] = []) => {
  const grouped = new Map<string, BlogReaction[]>()
  reactions.forEach((reaction) => {
    const current = grouped.get(reaction.type) ?? []
    current.push(reaction)
    grouped.set(reaction.type, current)
  })

  return Array.from(grouped.entries()).map(([type, reactionList]) => ({
    type,
    reactions: reactionList,
  }))
}

const postReactionCount = (reactions: BlogReaction[] = []) => reactions.length

const isImageFile = (filePath: string | null): boolean => Boolean(filePath && (/^data:image\//i.test(filePath) || /\.(png|jpe?g|gif|webp|bmp|svg)(\?.*)?$/i.test(filePath)))
const isVideoFile = (filePath: string): boolean => /^data:video\//i.test(filePath) || /\.(mp4|webm|mov|m4v|avi|mkv)(\?.*)?$/i.test(filePath)
const stripAttachmentMarkers = (content: string) => content.replace(/\s*\[📎[^\]]+\]/g, '').trim()
const normalizeMediaUrls = (post: BlogPost) => post.mediaUrls?.filter(Boolean) ?? []
const extractUrlsFromText = (content?: string | null) => {
  if (!content) {
    return []
  }

  const urlPattern = /(https?:\/\/[^\s<]+|www\.[^\s<]+|(?:[\w-]+\.)+[\w-]{2,}(?:\/[^\s<]*)?)/gi
  const matches = content.match(urlPattern) ?? []
  return matches
    .map(rawUrl => trimTrailingPunctuation(rawUrl).cleanUrl.trim())
    .filter(Boolean)
}

const getYoutubeEmbedUrl = (rawUrl?: string | null) => {
  if (!rawUrl) {
    return ''
  }

  try {
    const normalized = buildSafeUrl(rawUrl)
    const parsed = new URL(normalized)
    const host = parsed.hostname.replace(/^www\./i, '').toLowerCase()
    let videoId = ''

    if (host === 'youtu.be') {
      videoId = parsed.pathname.split('/').filter(Boolean)[0] ?? ''
    }
    else if (host === 'youtube.com' || host.endsWith('.youtube.com')) {
      if (parsed.pathname === '/watch') {
        videoId = parsed.searchParams.get('v') ?? ''
      }
      else if (parsed.pathname.startsWith('/shorts/')) {
        videoId = parsed.pathname.split('/')[2] ?? ''
      }
      else if (parsed.pathname.startsWith('/embed/')) {
        videoId = parsed.pathname.split('/')[2] ?? ''
      }
    }

    if (!videoId) {
      return ''
    }

    return `https://www.youtube.com/embed/${videoId}`
  }
  catch {
    return ''
  }
}

const findPostPreviewUrl = (post: BlogPost) => {
  const shared = post.sharedUrl?.trim()
  if (shared) {
    return shared
  }

  return extractUrlsFromText(post.content)[0] ?? ''
}

const composerDetectedSharedUrl = computed(() => extractUrlsFromText(newPostContent.value)[0] ?? '')
const composerYoutubeEmbedUrl = computed(() => getYoutubeEmbedUrl(composerDetectedSharedUrl.value))
const composerVideoUrl = computed(() => {
  const url = composerDetectedSharedUrl.value
  return url && isVideoFile(url) ? buildSafeUrl(url) : ''
})

const postYoutubeEmbedUrl = (post: BlogPost) => getYoutubeEmbedUrl(findPostPreviewUrl(post))
const postSharedVideoUrl = (post: BlogPost) => {
  const url = findPostPreviewUrl(post)
  if (!url || getYoutubeEmbedUrl(url)) {
    return ''
  }

  return isVideoFile(url) ? buildSafeUrl(url) : ''
}

const normalizedSharedUrl = (post: BlogPost) => {
  const value = findPostPreviewUrl(post)
  if (!value) {
    return ''
  }

  return /^https?:\/\//i.test(value) ? value : `https://${value}`
}

const escapeHtml = (text: string) => text
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#39;')

function trimTrailingPunctuation(url: string) {
  const trailing = /[),.!?:;]+$/
  const punctuation = url.match(trailing)?.[0] ?? ''
  const cleanUrl = punctuation ? url.slice(0, -punctuation.length) : url

  return { cleanUrl, punctuation }
}

function buildSafeUrl(url: string) {
  if (/^https?:\/\//i.test(url)) {
    return url
  }

  return `https://${url}`
}

const formatPostContentAsHtml = (content: string) => {
  const escapedContent = escapeHtml(content)
  const urlPattern = /(https?:\/\/[^\s<]+|www\.[^\s<]+|(?:[\w-]+\.)+[\w-]{2,}(?:\/[^\s<]*)?)/gi

  const linkifiedContent = escapedContent.replace(urlPattern, (rawUrl) => {
    const { cleanUrl, punctuation } = trimTrailingPunctuation(rawUrl)
    if (!cleanUrl) {
      return rawUrl
    }

    const href = escapeHtml(buildSafeUrl(cleanUrl))
    const label = escapeHtml(cleanUrl)

    return `<a href="${href}" target="_blank" rel="noopener noreferrer" class="text-primary text-decoration-underline">${label}</a>${punctuation}`
  })

  return linkifiedContent.replace(/\n/g, '<br>')
}

const formatRelativeTime = (dateInput?: string | null) => {
  if (!dateInput) {
    return ''
  }

  const date = new Date(dateInput)
  if (Number.isNaN(date.getTime())) {
    return ''
  }

  const diffSeconds = Math.round((date.getTime() - Date.now()) / 1000)
  const formatter = new Intl.RelativeTimeFormat('fr', { numeric: 'auto' })

  if (Math.abs(diffSeconds) < 60) {
    return formatter.format(diffSeconds, 'second')
  }

  const diffMinutes = Math.round(diffSeconds / 60)
  if (Math.abs(diffMinutes) < 60) {
    return formatter.format(diffMinutes, 'minute')
  }

  const diffHours = Math.round(diffMinutes / 60)
  if (Math.abs(diffHours) < 24) {
    return formatter.format(diffHours, 'hour')
  }

  const diffDays = Math.round(diffHours / 24)
  if (Math.abs(diffDays) < 7) {
    return formatter.format(diffDays, 'day')
  }

  const diffWeeks = Math.round(diffDays / 7)
  if (Math.abs(diffWeeks) < 5) {
    return formatter.format(diffWeeks, 'week')
  }

  const diffMonths = Math.round(diffDays / 30)
  if (Math.abs(diffMonths) < 12) {
    return formatter.format(diffMonths, 'month')
  }

  const diffYears = Math.round(diffDays / 365)
  return formatter.format(diffYears, 'year')
}

onMounted(() => {
  void blogsStore.fetchReactionTypes()
  void storiesStore.fetchStories()
})

onUnmounted(() => {
  stopRecorderStream()
})

const runAction = async (action: () => Promise<unknown>) => {
  try {
    actionError.value = ''
    await action()
  }
  catch (error) {
    console.error(error)
    actionError.value = 'An action failed. Check the submitted data.'
  }
}

const openCreatePostDialog = (seedText?: string) => {
  if (seedText) {
    const spacer = newPostContent.value.trim().length ? ' ' : ''
    newPostContent.value = `${newPostContent.value}${spacer}${seedText}`.trim()
  }
  createPostDialog.value = true
  showEmojiMenu.value = false
}

const triggerPhotoPicker = () => {
  if (!props.canInteract) {
    return
  }

  postPhotoInput.value?.click()
}

const triggerStoryPicker = () => {
  if (!props.canInteract) {
    return
  }

  storyPhotoInput.value?.click()
}

const triggerModalPhotoPicker = () => {
  if (!props.canInteract) {
    return
  }

  postModalPhotoInput.value?.click()
}

const readFilesAsDataUrls = async (files: File[]) => Promise.all(files.map(file => new Promise<string>((resolve, reject) => {
  const reader = new FileReader()
  reader.onload = () => resolve(String(reader.result ?? ''))
  reader.onerror = () => reject(new Error('Unable to read file'))
  reader.readAsDataURL(file)
})))

const handleStorySelected = async (event: Event) => {
  if (!props.canInteract) {
    return
  }

  const input = event.target as HTMLInputElement
  const file = input.files?.[0]

  if (!file) {
    return
  }

  if (!file.type.startsWith('image/')) {
    actionError.value = 'Veuillez choisir une image pour la story.'
    input.value = ''
    return
  }

  try {
    const [imageUrl] = await readFilesAsDataUrls([file])
    if (!imageUrl) {
      return
    }

    await runAction(() => storiesStore.createStory(imageUrl))
  }
  finally {
    input.value = ''
  }
}

const removeStory = async (storyId: string) => {
  await runAction(() => storiesStore.deleteStory(storyId))
}

const handlePhotoSelected = async (event: Event) => {
  const target = event.target as HTMLInputElement
  const files = target.files ? Array.from(target.files) : []
  if (!files.length) {
    return
  }

  const dataUrls = await readFilesAsDataUrls(files)
  newPostImageFiles.value = [...newPostImageFiles.value, ...dataUrls]
  newPostFilePath.value = newPostImageFiles.value[0] ?? ''
  openCreatePostDialog()
  target.value = ''
}

const removeImageAt = (index: number) => {
  newPostImageFiles.value.splice(index, 1)
  newPostFilePath.value = newPostImageFiles.value[0] ?? ''
}

const openVideoChoiceDialog = () => {
  if (!props.canInteract) {
    return
  }

  showVideoChoiceDialog.value = true
}

const triggerVideoPicker = () => {
  postVideoInput.value?.click()
}

const stopRecorderStream = () => {
  recorderStream?.getTracks().forEach(track => track.stop())
  recorderStream = null
  mediaRecorder = null
}

const openVideoRecorder = async () => {
  showVideoChoiceDialog.value = false
  showVideoRecorderDialog.value = true
  recordedChunks = []

  recorderStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
  if (recorderPreview.value) {
    recorderPreview.value.srcObject = recorderStream
    await recorderPreview.value.play()
  }
}

const startVideoRecording = () => {
  if (!recorderStream) {
    return
  }

  recordedChunks = []
  mediaRecorder = new MediaRecorder(recorderStream)
  mediaRecorder.ondataavailable = (event) => {
    if (event.data.size > 0) {
      recordedChunks.push(event.data)
    }
  }
  mediaRecorder.onstop = async () => {
    const videoBlob = new Blob(recordedChunks, { type: 'video/webm' })
    capturedVideo.value = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(String(reader.result ?? ''))
      reader.onerror = () => reject(new Error('Unable to read video'))
      reader.readAsDataURL(videoBlob)
    })
    showVideoRecorderDialog.value = false
    showVideoReviewDialog.value = true
    stopRecorderStream()
  }

  mediaRecorder.start()
  recordingVideo.value = true
}

const stopVideoRecording = () => {
  if (mediaRecorder && recordingVideo.value) {
    mediaRecorder.stop()
  }
  recordingVideo.value = false
}

const cancelVideoFlow = () => {
  recordingVideo.value = false
  capturedVideo.value = ''
  showVideoChoiceDialog.value = false
  showVideoRecorderDialog.value = false
  showVideoReviewDialog.value = false
  stopRecorderStream()
}

const confirmVideoUpload = () => {
  if (capturedVideo.value) {
    newPostFilePath.value = capturedVideo.value
    newPostImageFiles.value = []
  }
  cancelVideoFlow()
  openCreatePostDialog('🎥')
}

const handleVideoSelected = async (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) {
    return
  }

  newPostFilePath.value = (await readFilesAsDataUrls([file]))[0] ?? ''
  newPostImageFiles.value = []
  showVideoChoiceDialog.value = false
  openCreatePostDialog('🎥')
  target.value = ''
}

const handleQuickAction = (actionKey: string) => {
  if (actionKey === 'photo') {
    triggerModalPhotoPicker()
    return
  }

  if (actionKey === 'tag') {
    openCreatePostDialog('@friend')
    return
  }

  if (actionKey === 'emoji') {
    openCreatePostDialog('😊')
    return
  }

  showPostOptionsDialog.value = true
}

const submitPost = async (blogId: string) => {
  if (!props.canInteract) {
    return
  }

  const content = newPostContent.value.trim()
  if (!content) {
    return
  }

  creatingPost.value = true
  await runAction(() => blogsStore.createPost(blogId, {
    content,
    filePath: newPostFilePath.value.trim() || null,
  }))
  creatingPost.value = false
  newPostContent.value = ''
  newPostFilePath.value = ''
  newPostImageFiles.value = []
  createPostDialog.value = false
  showPostOptionsDialog.value = false
}

const createComment = async (payload: { postId: string, parentCommentId: string | null, content: string }) => {
  if (!props.canInteract) {
    return
  }

  const content = stripAttachmentMarkers(payload.content)
  const filePath = commentAttachmentPath.value[payload.postId] ?? null
  if (!content && !filePath) {
    return
  }

  await runAction(() => blogsStore.createComment(payload.postId, {
    content: content || ' ',
    parentCommentId: payload.parentCommentId,
    filePath,
  }))

  commentAttachmentPath.value[payload.postId] = null
}

const createRootComment = async (postId: string) => {
  if (!props.canInteract) {
    return
  }

  const draft = (commentDrafts.value[postId] ?? '').trim()
  if (!draft && !commentAttachmentPath.value[postId]) {
    return
  }

  await createComment({
    postId,
    parentCommentId: null,
    content: draft,
  })
  commentDrafts.value[postId] = ''
  commentAttachmentPath.value[postId] = null
}

const insertCommentEmoji = (postId: string, emoji: string) => {
  const current = commentDrafts.value[postId] ?? ''
  commentDrafts.value[postId] = `${current}${emoji}`
}

const triggerCommentPhotoPicker = (postId: string) => {
  if (!props.canInteract) {
    return
  }

  commentPhotoInput.value[postId]?.click()
}

const handleCommentPhotoSelect = async (postId: string, event: Event) => {
  const target = event.target as HTMLInputElement
  if (!target.files?.length) {
    return
  }

  const selectedFile = Array.from(target.files)[0]
  if (!selectedFile) {
    return
  }

  const [attachmentPath] = await readFilesAsDataUrls([selectedFile])
  if (!attachmentPath) {
    return
  }

  commentAttachmentPath.value[postId] = attachmentPath
  const current = stripAttachmentMarkers(commentDrafts.value[postId] ?? '')
  commentDrafts.value[postId] = current ? `${current} [📎 ${selectedFile.name}]` : `[📎 ${selectedFile.name}]`
  target.value = ''
}

const addPostReaction = async (post: BlogRead['posts'][number], type: string) => {
  if (!props.canInteract) {
    return
  }

  const ownReaction = currentUserPostReaction(post)
  if (ownReaction?.type === type) {
    await runAction(() => blogsStore.deleteReaction(ownReaction.id))
  }
  else if (ownReaction) {
    await runAction(() => blogsStore.updateReaction(ownReaction.id, { type }))
  }
  else {
    await runAction(() => blogsStore.createPostReaction(post.id, { type }))
  }

  postReactionPicker.value[post.id] = false
}

const deletePostReaction = async (reactionId: string) => {
  if (!props.canInteract) {
    return
  }

  await runAction(() => blogsStore.deleteReaction(reactionId))
}

const handlePostReactionButtonClick = async (post: BlogRead['posts'][number]) => {
  const ownReaction = currentUserPostReaction(post)

  if (ownReaction) {
    await deletePostReaction(ownReaction.id)
    return
  }

  postReactionPicker.value[post.id] = !postReactionPicker.value[post.id]
}

const toggleComments = (postId: string) => {
  expandedComments.value[postId] = !expandedComments.value[postId]
}

const openEditPostDialog = (post: BlogRead['posts'][number]) => {
  activePost.value = post
  editPostContent.value = post.content ?? ''
  editPostFilePath.value = post.filePath ?? ''
  editPostDialog.value = true
}

const openDeletePostDialog = (post: BlogRead['posts'][number]) => {
  activePost.value = post
  deletePostDialog.value = true
}

const confirmEditPost = async () => {
  if (!activePost.value || !editPostContent.value.trim()) {
    return
  }

  await runAction(() => blogsStore.updatePost(activePost.value!.id, {
    content: editPostContent.value.trim(),
    filePath: editPostFilePath.value.trim() || null,
  }))
  editPostDialog.value = false
}

const confirmDeletePost = async () => {
  if (!activePost.value) {
    return
  }

  await runAction(() => blogsStore.deletePost(activePost.value!.id))
  deletePostDialog.value = false
}

const openSharePostDialog = (post: BlogRead['posts'][number]) => {
  sharePostTarget.value = post
  shareDraftContent.value = ''
  sharePostDialog.value = true
}

const openShareAuthorsDialog = (post: BlogRead['posts'][number]) => {
  shareAuthors.value = post.children?.authors ?? []
  shareAuthorsDialog.value = true
}

const submitSharePost = async () => {
  if (!sharePostTarget.value || !props.canInteract) {
    return
  }

  await runAction(() => blogsStore.createPost(blog.id, {
    content: shareDraftContent.value.trim() || null,
    parentPostId: sharePostTarget.value!.id,
    sharedUrl: findPostPreviewUrl(sharePostTarget.value!),
  }))
  sharePostDialog.value = false
  shareDraftContent.value = ''
}
</script>

<template>
  <BlogSummaryCard v-if="showSummary" :blog="blog" />

  <v-card v-if="showCreatePost" rounded="xl" class="mb-6 pa-4 create-post-card">
    <input
      ref="postPhotoInput"
      type="file"
      accept="image/*"
      multiple
      class="d-none"
      @change="handlePhotoSelected"
    >
    <input
      ref="postVideoInput"
      type="file"
      accept="video/*"
      class="d-none"
      @change="handleVideoSelected"
    >
    <div class="d-flex align-center ga-3">
      <UiAvatar
        :src="authSession.profile?.photo ?? undefined"
        :name="`${authSession.profile?.firstName ?? ''} ${authSession.profile?.lastName ?? ''}`.trim() || 'User'"
        size="md"
      />
      <button
        type="button"
        class="create-post-trigger text-left"
        :disabled="!canInteract"
        @click="openCreatePostDialog()"
      >
        Was machst du gerade, {{ currentUserName }}?
      </button>
      <v-btn icon="mdi-video-outline" variant="text" :disabled="!canInteract" @click="openVideoChoiceDialog" />
      <v-btn icon="mdi-image-outline" variant="text" :disabled="!canInteract" @click="triggerPhotoPicker" />
      <v-menu v-model="showEmojiMenu" location="bottom end">
        <template #activator="{ props: menuProps }">
          <v-btn icon="mdi-emoticon-happy-outline" variant="text" :disabled="!canInteract" v-bind="menuProps" />
        </template>
        <v-list density="compact" class="emoji-menu-list">
          <v-list-item
            v-for="emoji in composerEmojis"
            :key="emoji"
            @click="openCreatePostDialog(emoji)"
          >
            <v-list-item-title class="text-h6">{{ emoji }}</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>
    </div>
    <v-alert v-if="!canInteract" type="info" variant="tonal" class="mt-3">Sign in to publish, comment, and react.</v-alert>
    <v-alert v-if="actionError" type="error" variant="tonal" class="mt-3">{{ actionError }}</v-alert>
  </v-card>


  <v-card class="mb-6 pa-4" rounded="xl" variant="outlined">
    <input
      ref="storyPhotoInput"
      type="file"
      accept="image/*"
      class="d-none"
      @change="handleStorySelected"
    >

    <div class="d-flex align-center justify-space-between ga-3 mb-3 flex-wrap">
      <div class="text-subtitle-1 font-weight-bold">Stories</div>
      <v-btn
        color="primary"
        prepend-icon="mdi-plus"
        :loading="storiesStore.actionLoading"
        :disabled="!canInteract"
        @click="triggerStoryPicker"
      >
        Ajouter une story
      </v-btn>
    </div>

    <div v-if="isLoadingStories" class="d-flex justify-center py-3">
      <v-progress-circular indeterminate color="primary" size="22" />
    </div>

    <div v-else-if="stories.length" class="d-flex ga-3 stories-strip">
      <v-sheet
        v-for="group in stories"
        :key="group.user.id"
        class="story-group pa-2"
        rounded="lg"
        variant="tonal"
      >
        <div class="d-flex align-center ga-2 mb-2">
          <UiAvatar :src="group.user.photo ?? undefined" :name="group.user.username" size="xs" />
          <span class="text-caption font-weight-medium">{{ group.user.username }}</span>
        </div>

        <div class="d-flex ga-2">
          <div v-for="story in group.stories" :key="story.id" class="story-item position-relative">
            <v-img :src="story.imageUrl" width="90" height="120" cover class="rounded-lg" />
            <v-btn
              v-if="ownStoryIds.has(story.id)"
              icon="mdi-delete"
              size="x-small"
              color="error"
              class="story-delete-btn"
              @click="removeStory(story.id)"
            />
          </div>
        </div>
      </v-sheet>
    </div>

    <v-alert v-else type="info" variant="tonal" density="comfortable">
      No story available at the moment.
    </v-alert>
  </v-card>

  <v-dialog v-model="createPostDialog" max-width="720">
    <v-card rounded="xl" class="pa-2">
      <v-card-title class="text-h5 text-center font-weight-bold position-relative pr-12">
        Beitrag erstellen
        <v-btn icon="mdi-close" variant="text" class="close-dialog-btn" @click="createPostDialog = false" />
      </v-card-title>
      <v-card-text>
        <input
          ref="postModalPhotoInput"
          type="file"
          accept="image/*"
          multiple
          class="d-none"
          @change="handlePhotoSelected"
        >
        <div class="d-flex align-center ga-3 mb-4">
          <UiAvatar
            :src="authSession.profile?.photo ?? undefined"
            :name="`${authSession.profile?.firstName ?? ''} ${authSession.profile?.lastName ?? ''}`.trim() || 'User'"
            size="md"
          />
          <div class="text-subtitle-1 font-weight-bold">
            {{ `${authSession.profile?.firstName ?? ''} ${authSession.profile?.lastName ?? ''}`.trim() || 'User' }}
          </div>
        </div>
        <v-textarea
          v-model="newPostContent"
          rows="6"
          variant="plain"
          auto-grow
          hide-details
          class="mb-3"
          :placeholder="`Was machst du gerade, ${currentUserName}?`"
          :disabled="!canInteract"
        />

        <div v-if="newPostImageFiles.length" class="mb-3 image-preview-grid">
          <div v-for="(imageSrc, index) in newPostImageFiles" :key="`${imageSrc}-${index}`" class="image-preview-item">
            <v-img :src="imageSrc" height="150" cover class="rounded-lg" />
            <v-btn
              icon="mdi-close"
              size="x-small"
              color="error"
              class="image-remove-btn"
              @click="removeImageAt(index)"
            />
          </div>
        </div>

        <video v-else-if="newPostFilePath" :src="newPostFilePath" controls class="w-100 rounded-lg mb-3" />

        <iframe
          v-else-if="composerYoutubeEmbedUrl"
          :src="composerYoutubeEmbedUrl"
          title="YouTube preview"
          class="w-100 rounded-lg mb-3 youtube-embed"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowfullscreen
        />

        <video
          v-else-if="composerVideoUrl"
          :src="composerVideoUrl"
          controls
          class="w-100 rounded-lg mb-3"
        />

        <v-sheet rounded="lg" variant="outlined" class="pa-3 mb-3 add-to-post-sheet">
          <div class="d-flex align-center justify-space-between flex-wrap ga-3">
            <div class="text-subtitle-1 font-weight-bold">Füge noch etwas zu deinem Beitrag hinzu</div>
            <div class="d-flex align-center ga-2">
              <v-btn
                v-for="action in postQuickActions"
                :key="action.key"
                icon
                variant="text"
                :disabled="!canInteract"
                @click="handleQuickAction(action.key)"
              >
                <v-icon :icon="action.icon" :color="action.color" />
              </v-btn>
            </div>
          </div>
        </v-sheet>

        <v-btn block color="primary" :loading="creatingPost" :disabled="!canInteract || !newPostContent.trim()" @click="submitPost(blog.id)">Posten</v-btn>
      </v-card-text>
    </v-card>
  </v-dialog>

  <v-dialog v-model="showVideoChoiceDialog" max-width="520">
    <v-card rounded="xl">
      <v-card-title class="d-flex align-center justify-space-between">Video
        <v-btn icon="mdi-close" variant="text" @click="cancelVideoFlow" />
      </v-card-title>
      <v-card-text class="d-flex flex-column ga-3">
        <v-btn variant="outlined" prepend-icon="mdi-video-plus" @click="triggerVideoPicker">Add a video</v-btn>
        <v-btn variant="outlined" prepend-icon="mdi-camera-outline" @click="openVideoRecorder">Open camera and record</v-btn>
      </v-card-text>
    </v-card>
  </v-dialog>

  <v-dialog v-model="showVideoRecorderDialog" max-width="760" persistent>
    <v-card rounded="xl">
      <v-card-title class="d-flex align-center justify-space-between">Video recording
        <v-btn icon="mdi-close" variant="text" @click="cancelVideoFlow" />
      </v-card-title>
      <v-card-text>
        <video ref="recorderPreview" autoplay muted playsinline class="w-100 rounded-lg mb-3" />
        <div class="d-flex justify-end ga-2">
          <v-btn v-if="!recordingVideo" color="error" @click="startVideoRecording">Start</v-btn>
          <v-btn v-else color="primary" @click="stopVideoRecording">Terminer</v-btn>
        </div>
      </v-card-text>
    </v-card>
  </v-dialog>

  <v-dialog v-model="showVideoReviewDialog" max-width="760">
    <v-card rounded="xl">
      <v-card-title class="d-flex align-center justify-space-between">Upload video now?
        <v-btn icon="mdi-close" variant="text" @click="cancelVideoFlow" />
      </v-card-title>
      <v-card-text>
        <video v-if="capturedVideo" :src="capturedVideo" controls class="w-100 rounded-lg" />
      </v-card-text>
      <v-card-actions class="justify-end">
        <v-btn variant="text" @click="cancelVideoFlow">Cancel</v-btn>
        <v-btn color="primary" @click="confirmVideoUpload">Upload</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <v-dialog v-model="showPostOptionsDialog" max-width="760">
    <v-card rounded="xl">
      <v-card-title class="d-flex align-center ga-3 py-4">
        <v-btn icon="mdi-arrow-left" variant="text" @click="showPostOptionsDialog = false" />
        <span>Füge noch etwas zu deinem Beitrag hinzu</span>
      </v-card-title>
      <v-divider />
      <v-card-text>
        <v-row>
          <v-col v-for="option in postAllOptions" :key="option.label" cols="12" sm="6">
            <v-btn
              block
              variant="text"
              class="justify-start text-none option-btn"
              @click="showPostOptionsDialog = false"
            >
              <v-icon :icon="option.icon" :color="option.color" class="mr-3" />
              {{ option.label }}
            </v-btn>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>
  </v-dialog>

  <v-row v-if="blog?.posts">
    <v-col v-for="post in blog?.posts" :key="post.id" cols="12">
      <v-card rounded="xl" class="h-100 blog-post-card">
        <v-card-title class="d-flex align-center justify-space-between ga-3 flex-wrap pb-2">
          <div class="d-flex align-center ga-3">
            <NuxtLink v-if="postAuthorProfilePath(post)" :to="postAuthorProfilePath(post)" class="avatar-link">
              <UiAvatar :src="post.author?.photo ?? undefined" :name="postAuthorName(post)" size="md" />
            </NuxtLink>
            <UiAvatar v-else :src="post.author?.photo ?? undefined" :name="postAuthorName(post)" size="md" />
            <div>
              <NuxtLink
                v-if="postAuthorProfilePath(post)"
                :to="postAuthorProfilePath(post)"
                class="text-subtitle-1 font-weight-bold text-decoration-none text-primary"
              >
                {{ postAuthorName(post) }}
              </NuxtLink>
              <div v-else class="text-subtitle-1 font-weight-bold">{{ postAuthorName(post) }}</div>
              <div v-if="formatRelativeTime(post.createdAt)" class="text-caption text-medium-emphasis">{{ formatRelativeTime(post.createdAt) }}</div>
            </div>
          </div>

          <v-menu v-if="post.isAuthor" location="bottom end">
            <template #activator="{ props: menuProps }">
              <v-btn icon="mdi-dots-vertical" size="small" variant="text" v-bind="menuProps" />
            </template>
            <v-list density="compact" nav>
              <v-list-item prepend-icon="mdi-pencil" title="Edit" @click="openEditPostDialog(post)" />
              <v-list-item prepend-icon="mdi-delete" title="Delete" base-color="error" @click="openDeletePostDialog(post)" />
            </v-list>
          </v-menu>
        </v-card-title>

        <v-card-text>
          <h3 v-if="post.title" class="text-h6 mb-2">{{ post.title }}</h3>
          <p v-if="post.content" class="mb-4 text-body-1" v-html="formatPostContentAsHtml(post.content)" />

          <div v-if="post.filePath" class="mb-4">
            <v-img
              v-if="isImageFile(post.filePath)"
              :src="post.filePath"
              max-height="500"
              cover
              class="rounded-xl"
            />

            <video
              v-else-if="isVideoFile(post.filePath)"
              :src="post.filePath"
              controls
              class="w-100 rounded-xl"
              style="max-height: 500px;"
            />

            <v-card v-else variant="outlined" rounded="lg" class="pa-3 d-inline-flex align-center ga-2">
              <v-icon icon="mdi-paperclip" />
              <a :href="post.filePath" target="_blank" rel="noopener" class="text-primary text-decoration-underline">View attachment</a>
            </v-card>
          </div>

          <div v-if="normalizeMediaUrls(post).length" class="mb-4 d-flex flex-column ga-3">
            <template v-for="mediaUrl in normalizeMediaUrls(post)" :key="mediaUrl">
              <v-img
                v-if="!isVideoFile(mediaUrl)"
                :src="mediaUrl"
                max-height="500"
                cover
                class="rounded-xl"
              />
              <video v-else :src="mediaUrl" controls class="w-100 rounded-xl" style="max-height: 500px;" />
            </template>
          </div>

          <v-card v-if="normalizedSharedUrl(post)" variant="outlined" rounded="lg" class="mb-4 pa-3">
            <iframe
              v-if="postYoutubeEmbedUrl(post)"
              :src="postYoutubeEmbedUrl(post)"
              title="YouTube video"
              class="w-100 rounded-lg mb-3 youtube-embed"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowfullscreen
            />
            <video v-else-if="postSharedVideoUrl(post)" :src="postSharedVideoUrl(post)" controls class="w-100 rounded-lg mb-3" />
            <a :href="normalizedSharedUrl(post)" target="_blank" rel="noopener noreferrer" class="text-primary text-decoration-underline">{{ normalizedSharedUrl(post) }}</a>
          </v-card>

          <div class="d-flex align-center justify-space-between text-medium-emphasis text-body-2 mb-3 stats-row">
            <div class="d-flex align-center ga-2">
              <div class="d-flex align-center ga-1">
                <span
                  v-for="[type] in postReactionSummary(post.reactions ?? [])"
                  :key="type"
                  class="reaction-badge reaction-badge--stacked"
                >
                  {{ reactionMeta[type]?.icon ?? '👍' }}
                </span>
              </div>
              <span v-if="postReactionCount(post.reactions ?? []) > 0">{{ postReactionCount(post.reactions ?? []) }}</span>
              <v-menu
                  v-model="postReactionPicker[post.id]"
                  open-on-hover
                  location="top"
                  :close-on-content-click="false"
                  content-class="reaction-hover-menu"
              >
                <template #activator="{ props: menuProps }">
                  <v-btn
                      variant="text"
                      type="button"
                      :disabled="!canInteract"
                      v-bind="menuProps"
                      @click.stop.prevent="handlePostReactionButtonClick(post)"
                  >
                    <span class="reaction-action-icon">{{ reactionMeta[currentUserPostReaction(post)?.type ?? 'like']?.icon ?? '👍' }}</span>
                  </v-btn>
                </template>
                <div class="reaction-hover-content pa-3">
                  <div class="reaction-picker mb-3">
                    <button
                        v-for="type in availableReactionTypes"
                        :key="type"
                        class="reaction-emoji"
                        :class="{ 'reaction-emoji--active': isCurrentUserReaction(post, type) }"
                        type="button"
                        :title="reactionMeta[type]?.label"
                        @click="addPostReaction(post, type)"
                    >
                      {{ reactionMeta[type]?.icon ?? '👍' }}
                    </button>
                  </div>
                  <div
                      v-for="group in groupedPostReactions(post.reactions ?? [])"
                      :key="group.type"
                      class="d-flex align-center justify-space-between ga-3 mb-2"
                  >
                    <div class="d-flex align-center ga-2">
                      <span class="text-body-2">{{ reactionMeta[group.type]?.icon ?? '👍' }}</span>
                      <span class="text-caption text-medium-emphasis">{{ reactionMeta[group.type]?.label ?? group.type }}</span>
                    </div>
                    <div class="d-flex align-center ga-1 flex-wrap justify-end">
                      <NuxtLink
                          v-for="reaction in group.reactions"
                          :key="reaction.id"
                          :to="reactionAuthorProfilePath(reaction.author?.username)"
                          class="avatar-link"
                      >
                        <UiAvatar
                            :src="reaction.author?.photo ?? undefined"
                            :name="`${reaction.author?.firstName ?? ''} ${reaction.author?.lastName ?? ''}`.trim() || 'Unknown User'"
                            size="xs"
                        />
                      </NuxtLink>
                    </div>
                  </div>
                </div>
              </v-menu>
            </div>

            <div class="d-flex align-center ga-3">
              <span v-if="countComments(post.comments) > 0" class="d-inline-flex align-center ga-1">{{ countComments(post.comments) }}
                <v-icon icon="mdi-comment-outline" @click="toggleComments(post.id)" size="18" />
              </span>
              <span class="d-inline-flex align-center ga-1">
                <v-btn
                  icon="mdi-share-outline"
                  size="x-small"
                  variant="text"
                  :disabled="!canInteract"
                  @click="openSharePostDialog(post)"
                />
                <v-btn
                  v-if="(post.children?.count ?? 0) > 0"
                  variant="text"
                  size="small"
                  class="px-1"
                  @click="openShareAuthorsDialog(post)"
                >
                  {{ post.children?.count }}
                </v-btn>
              </span>
            </div>
          </div>
          <v-divider class="mb-3" />
          <div v-if="post.comments?.length && expandedComments[post.id]" class="d-flex flex-column ga-4 mb-3">
            <BlogCommentItem
              v-for="comment in post.comments"
              :key="comment.id"
              :comment="comment"
              :post-id="post.id"
              :can-interact="canInteract"
              @add-comment="createComment"
              @edit-comment="canInteract ? runAction(() => blogsStore.updateComment($event.commentId, { content: $event.content })) : undefined"
              @delete-comment="canInteract ? runAction(() => blogsStore.deleteComment($event)) : undefined"
              @add-reaction="canInteract ? runAction(() => blogsStore.createReaction($event.commentId, { type: $event.type })) : undefined"
              @update-reaction="canInteract ? runAction(() => blogsStore.updateReaction($event.reactionId, { type: $event.type })) : undefined"
              @delete-reaction="canInteract ? runAction(() => blogsStore.deleteReaction($event)) : undefined"
            />
          </div>

          <div class="comment-composer d-flex ga-2 align-start">
            <UiAvatar
              :src="authSession.profile?.photo ?? undefined"
              :name="currentUserDisplayName"
              size="sm"
              class="comment-composer-avatar"
            />
            <div class="comment-composer-panel flex-grow-1">
              <v-text-field
                v-model="commentDrafts[post.id]"
                density="comfortable"
                variant="plain"
                hide-details
                single-line
                class="comment-composer-input"
                :placeholder="`${currentUserDisplayName} kommentieren`"
                :disabled="!canInteract"
                @keydown.enter.prevent="createRootComment(post.id)"
              />

              <div v-if="commentAttachmentPath[post.id]" class="mb-2">
                <img
                  v-if="isImageFile(commentAttachmentPath[post.id])"
                  :src="commentAttachmentPath[post.id] ?? undefined"
                  alt="Attachment preview"
                  class="comment-attachment-preview"
                >
                <a v-else :href="commentAttachmentPath[post.id] ?? undefined" target="_blank" rel="noopener" class="text-primary text-decoration-underline">View attachment</a>
              </div>
              <div class="comment-composer-actions">
                <v-btn
                  icon="mdi-sticker-emoji"
                  size="small"
                  variant="text"
                  color="grey"
                  :disabled="!canInteract"
                  title="Mit Avatar-Sticker kommentieren"
                />
                <v-menu location="top start">
                  <template #activator="{ props: menuProps }">
                    <v-btn
                      icon="mdi-emoticon-outline"
                      size="small"
                      variant="text"
                      color="grey"
                      :disabled="!canInteract"
                      title="Emoji hinzufügen"
                      v-bind="menuProps"
                    />
                  </template>
                  <v-card rounded="lg" class="pa-2">
                    <div class="d-flex ga-1">
                      <v-btn
                        v-for="emoji in composerEmojis"
                        :key="`comment-${post.id}-${emoji}`"
                        size="small"
                        variant="text"
                        @click="insertCommentEmoji(post.id, emoji)"
                      >
                        {{ emoji }}
                      </v-btn>
                    </div>
                  </v-card>
                </v-menu>
                <v-btn
                  icon="mdi-camera-outline"
                  size="small"
                  variant="text"
                  color="grey"
                  :disabled="!canInteract"
                  title="Foto oder Video anhängen"
                  @click="triggerCommentPhotoPicker(post.id)"
                />
                <input
                  :ref="(el) => { commentPhotoInput[post.id] = el as HTMLInputElement | null }"
                  type="file"
                  class="d-none"
                  accept="image/*,video/*"
                  multiple
                  @change="handleCommentPhotoSelect(post.id, $event)"
                >
                <v-btn
                  icon="mdi-gif"
                  size="small"
                  variant="text"
                  color="grey"
                  :disabled="!canInteract"
                  title="GIF hinzufügen"
                />
                <v-btn
                  icon="mdi-palette-outline"
                  size="small"
                  variant="text"
                  color="grey"
                  :disabled="!canInteract"
                  title="Effekte"
                />
                <v-spacer />
                <v-btn
                  icon="mdi-send"
                  size="small"
                  variant="text"
                  color="primary"
                  :disabled="!canInteract || !(commentDrafts[post.id] ?? '').trim()"
                  title="Envoyer"
                  @click="createRootComment(post.id)"
                />
              </div>
            </div>
          </div>
        </v-card-text>
      </v-card>
    </v-col>
  </v-row>

  <v-dialog v-model="editPostDialog" max-width="680">
    <v-card rounded="xl">
      <v-card-title>Edit post</v-card-title>
      <v-card-text>
        <v-textarea v-model="editPostContent" rows="4" variant="solo-filled" class="mb-3" />
        <v-text-field v-model="editPostFilePath" variant="solo-filled" placeholder="URL image/fichier (optionnel)" />
      </v-card-text>
      <v-card-actions class="justify-end">
        <v-btn variant="text" @click="editPostDialog = false">Cancel</v-btn>
        <v-btn color="primary" @click="confirmEditPost">Enregistrer</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <v-dialog v-model="deletePostDialog" max-width="420">
    <v-card rounded="xl">
      <v-card-title>Delete le post</v-card-title>
      <v-card-text>This action is irreversible.</v-card-text>
      <v-card-actions class="justify-end">
        <v-btn variant="text" @click="deletePostDialog = false">Cancel</v-btn>
        <v-btn color="error" @click="confirmDeletePost">Delete</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <v-dialog v-model="sharePostDialog" max-width="760">
    <v-card rounded="xl">
      <v-card-title>Partager ce post</v-card-title>
      <v-card-text>
        <v-card v-if="sharePostTarget" variant="tonal" rounded="lg" class="mb-4 pa-4">
          <div class="text-subtitle-1 font-weight-bold mb-1">{{ sharePostTarget.title || 'Post' }}</div>
          <div v-if="sharePostTarget.content" class="text-body-2" v-html="formatPostContentAsHtml(sharePostTarget.content)" />
        </v-card>
        <v-textarea
          v-model="shareDraftContent"
          variant="solo-filled"
          rows="4"
          label="Votre message (optionnel)"
          :disabled="!canInteract"
        />
      </v-card-text>
      <v-card-actions class="justify-end">
        <v-btn variant="text" @click="sharePostDialog = false">Cancel</v-btn>
        <v-btn color="primary" :disabled="!canInteract" @click="submitSharePost">Partager</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <v-dialog v-model="shareAuthorsDialog" max-width="560">
    <v-card rounded="xl">
      <v-card-title>Users who shared</v-card-title>
      <v-card-text>
        <v-list>
          <v-list-item v-for="author in shareAuthors" :key="`${author.id ?? author.username ?? author.firstName}-${author.lastName}`" class="px-0">
            <template #prepend>
              <UiAvatar
                :src="author.photo ?? undefined"
                :name="`${author.firstName} ${author.lastName}`.trim()"
                size="sm"
              />
            </template>
            <v-list-item-title>{{ `${author.firstName} ${author.lastName}`.trim() }}</v-list-item-title>
            <v-list-item-subtitle v-if="author.username">@{{ author.username }}</v-list-item-subtitle>
          </v-list-item>
        </v-list>
      </v-card-text>
      <v-card-actions class="justify-end">
        <v-btn variant="text" @click="shareAuthorsDialog = false">Fermer</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<style scoped>
.stats-row {
  min-height: 24px;
}

.avatar-link {
  text-decoration: none;
}

.youtube-embed {
  border: 0;
  min-height: 320px;
}

.reaction-badge {
  margin-inline-end: -8px;
  width: 22px;
  height: 22px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
}


.reaction-badge--stacked:last-child {
  margin-inline-end: 0;
}

.post-actions-row {
  border-top: 1px solid rgba(var(--v-theme-on-surface), 0.12);
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.12);
  padding: 6px 0;
}

.post-action-btn {
  flex: 1;
  min-height: 36px;
  border-radius: 8px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: rgba(var(--v-theme-on-surface), 0.72);
  font-weight: 600;
}

.post-action-btn:hover {
  background: rgba(var(--v-theme-on-surface), 0.08);
}

.reaction-picker {
  display: inline-flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  border-radius: 999px;
  padding: 6px 8px;
  background: rgba(var(--v-theme-surface-variant), 0.35);
  border: 1px solid rgba(var(--v-theme-on-surface), 0.15);
}

.reaction-emoji {
  font-size: 22px;
  line-height: 1;
  transition: transform 0.15s ease;
}

.reaction-emoji:hover {
  transform: translateY(-2px) scale(1.08);
}

.reaction-emoji--active {
  transform: scale(1.2);
}

.reaction-action-icon {
  font-size: 20px;
  line-height: 1;
}

.reaction-hover-content {
  min-width: 220px;
  border-radius: 14px;
  backdrop-filter: blur(8px);
  background: rgba(22, 22, 24, 0.95);
  border: 1px solid rgba(255, 255, 255, 0.14);
}

.reaction-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border-radius: 999px;
  padding: 4px 8px;
  border: 1px solid rgba(255, 255, 255, 0.18);
}

.create-post-trigger {
  flex: 1;
  min-height: 48px;
  border-radius: 999px;
  padding: 0 18px;
  border: 0;
  color: rgba(var(--v-theme-on-surface), 0.72);
  background: rgba(var(--v-theme-on-surface), 0.08);
}

.create-post-trigger:hover {
  background: rgba(var(--v-theme-on-surface), 0.16);
}

.create-post-trigger:disabled {
  opacity: 0.6;
}

.emoji-menu-list :deep(.v-list-item) {
  min-height: 40px;
}

.add-to-post-sheet {
  border-width: 1px;
  border-style: solid;
  border-color: rgba(var(--v-theme-on-surface), 0.2);
}

.option-btn {
  min-height: 46px;
  font-weight: 600;
}

.close-dialog-btn {
  position: absolute;
  top: 6px;
  right: 6px;
}

.image-preview-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
  gap: 10px;
}

.image-preview-item {
  position: relative;
}

.image-remove-btn {
  position: absolute;
  top: 6px;
  right: 6px;
}


.stories-strip {
  overflow-x: auto;
  padding-bottom: 4px;
}

.story-group {
  min-width: 220px;
}

.story-delete-btn {
  position: absolute;
  top: 4px;
  right: 4px;
}

.comment-composer {
  padding-top: 4px;
}

.comment-composer-avatar {
  margin-top: 6px;
}

.comment-composer-panel {
  border-radius: 20px;
  background: rgba(var(--v-theme-on-surface), 0.06);
  border: 1px solid rgba(var(--v-theme-on-surface), 0.1);
  padding: 6px 12px 8px;
}

.comment-composer-input :deep(.v-field) {
  box-shadow: none;
  background: transparent;
}

.comment-composer-input :deep(.v-field__input) {
  min-height: 32px;
  padding-top: 2px;
  color: rgba(var(--v-theme-on-surface), 0.92);
}

.comment-composer-actions {
  display: flex;
  align-items: center;
  gap: 2px;
  min-height: 34px;
}

.comment-composer-actions :deep(.v-btn) {
  border-radius: 50%;
}

.comment-attachment-preview {
  display: block;
  max-width: min(100%, 280px);
  border-radius: 10px;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.15);
}

</style>
