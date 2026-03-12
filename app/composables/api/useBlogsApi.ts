import { useApiClient } from '../useApiClient'
import type { BlogMutationAcceptedResponse, BlogRead, BlogWithPagination } from '~/types/api/blog'
import type { ListResponse } from '~/types/api/common'

export const useBlogsApi = () => {
  const { apiFetch } = useApiClient()
  const basePath = '/api/v1/private/blogs'
  const publicBasePath = '/api/v1/public/blogs'

  return {
    getGeneral(isPublic = false, params?: { page?: number, limit?: number }) {
      const endpoint = isPublic ? `${publicBasePath}/general` : `${basePath}/general`
      return apiFetch<BlogWithPagination>(endpoint, {
        method: 'GET',
        query: {
          page: params?.page ?? 1,
          limit: params?.limit ?? 5,
        },
      })
    },
    getMyPosts(params?: { page?: number, limit?: number }) {
      return apiFetch<BlogWithPagination>('/api/v1/private/blog/posts/mine', {
        method: 'GET',
        query: {
          page: params?.page ?? 1,
          limit: params?.limit ?? 5,
        },
      })
    },
    getApplicationBlog(applicationSlug: string) {
      return apiFetch<BlogRead>(`/api/v1/blog/${applicationSlug}/feed`, { method: 'GET' })
    },

    getReactionTypes() {
      return apiFetch<ListResponse<string>>(`${publicBasePath}/reactions/types`, { method: 'GET' })
    },
    createPost(blogId: string, payload: {
      content?: string | null
      title?: string
      filePath?: string | null
      mediaUrls?: string[]
      sharedUrl?: string | null
      parentPostId?: string | null
      isPinned?: boolean
    }) {
      return apiFetch<BlogMutationAcceptedResponse>(`${basePath}/${blogId}/posts`, {
        method: 'POST',
        body: payload,
      })
    },
    deletePost(postId: string) {
      return apiFetch(`/api/v1/private/blog/posts/${postId}`, {
        method: 'DELETE',
      })
    },
    updatePost(postId: string, payload: { content?: string, filePath?: string | null }) {
      return apiFetch(`/api/v1/private/blog/posts/${postId}`, {
        method: 'PATCH',
        body: payload,
      })
    },

    createPostReaction(postId: string, payload: { type: string }) {
      return apiFetch<BlogMutationAcceptedResponse>(`/api/v1/private/blog/posts/${postId}/reactions`, {
        method: 'POST',
        body: payload,
      })
    },
    createComment(postId: string, payload: { content: string, parentCommentId: string | null }) {
      return apiFetch<BlogMutationAcceptedResponse>(`/api/v1/private/blog/posts/${postId}/comments`, {
        method: 'POST',
        body: payload,
      })
    },
    deleteComment(commentId: string) {
      return apiFetch(`/api/v1/private/blog/comments/${commentId}`, {
        method: 'DELETE',
      })
    },
    updateComment(commentId: string, payload: { content: string }) {
      return apiFetch(`/api/v1/private/blog/comments/${commentId}`, {
        method: 'PATCH',
        body: payload,
      })
    },
    createReaction(commentId: string, payload: { type: string }) {
      return apiFetch<BlogMutationAcceptedResponse>(`/api/v1/private/blog/comments/${commentId}/reactions`, {
        method: 'POST',
        body: payload,
      })
    },
    deleteReaction(reactionId: string) {
      return apiFetch(`/api/v1/private/blog/reactions/${reactionId}`, {
        method: 'DELETE',
      })
    },
    updateReaction(reactionId: string, payload: { type: string }) {
      return apiFetch(`/api/v1/private/blog/reactions/${reactionId}`, {
        method: 'PATCH',
        body: payload,
      })
    },
  }
}
