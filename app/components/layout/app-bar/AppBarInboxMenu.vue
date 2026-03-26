<script setup lang="ts">
import { computed, ref } from 'vue'
import ConversationAvatarGroup from '~/components/inbox/ConversationAvatarGroup.vue'
import { buildConversationPreview } from '~/utils/inboxConversationPreview'
import { useInboxStore } from '~/stores/inbox'

interface InboxConversationPreview {
  id: string
  name: string
  excerpt: string
  participants: Array<{ id: string, photo: string | null, label: string }>
  unread: number
  route: string
  latestMessageAt: string
}

const { t, locale } = useI18n({ useScope: 'global' })
const isInboxMenuOpen = ref(false)
const inboxStore = useInboxStore()

const inboxConversationsSummary = computed(() => inboxStore.conversationsSummary)
const inboxConversationsPreview = computed<InboxConversationPreview[]>(() => (inboxConversationsSummary.value?.items ?? [])
  .map(buildConversationPreview)
  .sort((a, b) => new Date(b.latestMessageAt).getTime() - new Date(a.latestMessageAt).getTime())
  .slice(0, 3))

const inboxUnreadCount = computed(() => inboxConversationsPreview.value.reduce((total, item) => total + item.unread, 0))

const truncateText = (value: string | null | undefined, maxLength = 20) => {
  if (!value) {
    return ''
  }

  return value.length > maxLength ? `${value.slice(0, maxLength).trimEnd()}...` : value
}

const formatRelativeTime = (value: string | null | undefined) => {
  if (!value) {
    return ''
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return ''
  }

  const diffMs = date.getTime() - Date.now()
  const absDiffMs = Math.abs(diffMs)
  const minute = 60 * 1000
  const hour = 60 * minute
  const day = 24 * hour
  const rtf = new Intl.RelativeTimeFormat(locale.value, { numeric: 'auto' })

  if (absDiffMs < hour) {
    return rtf.format(Math.round(diffMs / minute), 'minute')
  }

  if (absDiffMs < day) {
    return rtf.format(Math.round(diffMs / hour), 'hour')
  }

  return rtf.format(Math.round(diffMs / day), 'day')
}
</script>

<template>
  <v-menu location="bottom end" v-model="isInboxMenuOpen">
    <template #activator="{ props }">
      <v-btn
        icon
        variant="text"
        class="app-bar__icon-btn"
        v-bind="props"
        :aria-label="t('app.navigation.inbox')"
      >
        <v-badge :model-value="inboxUnreadCount > 0" :content="inboxUnreadCount" color="primary" offset-x="2" offset-y="2">
          <v-icon icon="mdi-message-processing-outline" />
        </v-badge>
      </v-btn>
    </template>

    <v-list class="py-1 app-bar__menu" min-width="320">
      <v-list-item
        v-for="conversation in inboxConversationsPreview"
        :key="conversation.id"
        :to="conversation.route"
        rounded="lg"
        class="mx-2 my-1 app-bar__message-item"
      >
        <template #prepend>
          <div class="d-flex align-center mt-6">
            <ConversationAvatarGroup :participants="conversation.participants" :size="72" />
          </div>
        </template>

        <div class="app-bar__message-content">
          <v-list-item-title class="font-weight-medium text-truncate">{{ truncateText(conversation.name) }}</v-list-item-title>
          <v-list-item-subtitle class="text-truncate">{{ truncateText(conversation.excerpt) }}</v-list-item-subtitle>
        </div>

        <template #append>
          <div class="app-bar__message-meta text-caption text-medium-emphasis">
            <span class="mx-auto">{{ formatRelativeTime(conversation.latestMessageAt) }}</span>
            <v-badge
              v-if="conversation.unread"
              :content="conversation.unread"
              color="primary"
              inline
            />
          </div>
        </template>
      </v-list-item>

      <v-list-item
        to="/inbox"
        rounded="lg"
        class="mx-2 my-1 text-primary"
        :title="t('app.common.showAll')"
        prepend-icon="mdi-arrow-right"
      />
    </v-list>
  </v-menu>
</template>
