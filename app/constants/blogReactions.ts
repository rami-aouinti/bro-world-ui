export const BLOG_REACTION_FALLBACK_TYPES = ['like', 'heart', 'laugh', 'celebrate'] as const

export const BLOG_REACTION_META: Record<string, { icon: string, color: string, label: string }> = {
  like: { icon: '👍', color: '#1877f2', label: 'J’aime' },
  heart: { icon: '❤️', color: '#f25268', label: 'J’adore' },
  laugh: { icon: '😂', color: '#f7b928', label: 'Haha' },
  celebrate: { icon: '🥳', color: '#f7b928', label: 'Bravo' },
}
