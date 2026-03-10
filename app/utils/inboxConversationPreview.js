/**
 * @typedef {import('~/types/api/chat').PrivateChatConversation} PrivateChatConversation
 * @typedef {import('~/types/api/chat').PrivateChatMessage} PrivateChatMessage
 */

/**
 * @param {PrivateChatConversation} conversation
 * @returns {PrivateChatMessage | null}
 */
export const getLatestMessage = (conversation) => conversation.messages.reduce(
  (latest, message) => {
    if (!latest) {
      return message
    }

    return new Date(message.createdAt).getTime() > new Date(latest.createdAt).getTime() ? message : latest
  },
  null,
)

/**
 * @param {PrivateChatConversation} conversation
 */
export const buildConversationPreview = (conversation) => {
  const participants = conversation.participants
    .filter(participant => !participant.user.owner)
    .map(participant => ({
      id: participant.user.id,
      photo: participant.user.photo,
      label: `${participant.user.firstName} ${participant.user.lastName}`.trim() || 'Utilisateur',
    }))

  const title = participants[0]?.label ?? 'Conversation'
  const latest = getLatestMessage(conversation)

  return {
    id: conversation.id,
    name: title,
    excerpt: latest?.content ?? 'Aucun message',
    participants,
    unread: conversation.unreadMessagesCount,
    route: `/inbox/${conversation.id}`,
    latestMessageAt: latest?.createdAt ?? conversation.createdAt,
  }
}
