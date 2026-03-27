import test from 'node:test'
import assert from 'node:assert/strict'
import { buildConversationPreview, getLatestMessage } from '../app/utils/inboxConversationPreview.js'

const legacyGetLatestMessage = (conversation) => {
  if (!conversation.messages.length) {
    return null
  }

  return [...conversation.messages].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0] ?? null
}

const legacyBuildConversationPreview = (conversation) => {
  const participants = conversation.participants
    .filter(participant => !participant.user.owner)
    .map(participant => ({
      id: participant.user.id,
      photo: participant.user.photo,
      label: `${participant.user.firstName} ${participant.user.lastName}`.trim() || 'Utilisateur',
    }))

  const title = participants[0]?.label ?? 'Conversation'
  const latestMessageAt = legacyGetLatestMessage(conversation)?.createdAt ?? conversation.createdAt

  return {
    id: conversation.id,
    name: title,
    excerpt: legacyGetLatestMessage(conversation)?.content ?? 'Aucun message',
    participants,
    unread: conversation.unreadMessagesCount,
    route: `/inbox/${conversation.id}`,
    latestMessageAt,
  }
}

test('getLatestMessage matches legacy ordering behavior', () => {
  const conversation = {
    id: 'conv-1',
    createdAt: '2024-01-01T00:00:00.000Z',
    unreadMessagesCount: 2,
    participants: [],
    messages: [
      { id: 'm1', content: 'older', createdAt: '2024-02-01T09:00:00.000Z' },
      { id: 'm2', content: 'newest', createdAt: '2024-02-01T11:00:00.000Z' },
      { id: 'm3', content: 'middle', createdAt: '2024-02-01T10:00:00.000Z' },
    ],
  }

  assert.deepEqual(getLatestMessage(conversation), legacyGetLatestMessage(conversation))
})

test('buildConversationPreview keeps same result as legacy implementation', () => {
  const conversation = {
    id: 'conv-2',
    createdAt: '2024-01-02T00:00:00.000Z',
    unreadMessagesCount: 1,
    participants: [
      {
        id: 'p-owner',
        user: {
          id: 'owner',
          firstName: 'Owner',
          lastName: 'User',
          photo: null,
          owner: true,
        },
      },
      {
        id: 'p-guest',
        user: {
          id: 'guest',
          firstName: 'Jane',
          lastName: 'Doe',
          photo: 'photo.png',
          owner: false,
        },
      },
    ],
    messages: [
      { id: 'm1', content: 'hello', createdAt: '2024-02-01T08:00:00.000Z' },
      { id: 'm2', content: 'latest hello', createdAt: '2024-02-01T12:00:00.000Z' },
    ],
  }

  assert.deepEqual(buildConversationPreview(conversation), legacyBuildConversationPreview(conversation))
})

test('buildConversationPreview handles empty messages exactly like legacy', () => {
  const conversation = {
    id: 'conv-3',
    createdAt: '2024-03-01T00:00:00.000Z',
    unreadMessagesCount: 0,
    participants: [],
    messages: [],
  }

  assert.deepEqual(buildConversationPreview(conversation), legacyBuildConversationPreview(conversation))
})

test('getLatestMessage uses API lastMessage when messages list is missing', () => {
  const conversation = {
    id: 'conv-4',
    createdAt: '2024-03-01T00:00:00.000Z',
    unreadMessagesCount: 1,
    participants: [],
    lastMessage: { id: 'm-last', content: 'preview from api', createdAt: '2024-03-03T12:00:00.000Z' },
  }

  assert.deepEqual(getLatestMessage(conversation), conversation.lastMessage)
})
