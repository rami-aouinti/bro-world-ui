export interface PrivateChatUser {
  id: string
  firstName: string
  lastName: string
  photo: string | null
  owner: boolean
}

export interface PrivateChatParticipant {
  id: string
  user: PrivateChatUser
}

export interface PrivateChatReaction {
  id: string
  userId: string | Record<string, never>
  reaction: string
}

export interface PrivateChatAttachment {
  name: string
  attachmentType: string
}

export interface PrivateChatMessage {
  id: string
  content: string
  sender: PrivateChatUser
  attachments: PrivateChatAttachment | PrivateChatAttachment[]
  read: boolean
  readAt: string | null
  createdAt: string
  reactions: PrivateChatReaction[]
}

export interface PrivateChatConversation {
  id: string
  chatId: string
  type?: string | null
  title?: string | null
  participants: PrivateChatParticipant[]
  messages?: PrivateChatMessage[]
  lastMessage?: PrivateChatMessage | null
  lastMessageAt?: string | null
  archivedAt?: string | null
  unreadMessagesCount: number
  createdAt: string
}

export interface PrivateConversationsResponse {
  items: PrivateChatConversation[]
  pagination: {
    page: number
    limit: number
    totalItems: number
    totalPages: number
  }
  filters: unknown[]
}

export interface PrivateConversationMessagesResponse {
  conversationId: string
  items: PrivateChatMessage[]
}

export interface UpdatePrivateConversationPayload {
  [key: string]: unknown
}

export interface CreatePrivateMessagePayload {
  content: string
  [key: string]: unknown
}

export interface UpdatePrivateMessagePayload {
  [key: string]: unknown
}

export interface CreatePrivateReactionPayload {
  reaction: string
}

export interface UpdatePrivateReactionPayload {
  reaction: string
}
