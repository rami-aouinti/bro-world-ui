import { useApiClient } from '../useApiClient'
import type { BlogMutationAcceptedResponse, BlogRead, BlogWithPagination } from '~/types/api/blog'
import type { ListResponse } from '~/types/api/common'

export const useBlogsApi = () => {
  const { apiFetch } = useApiClient()
  const basePath = '/api/v1/blogs'

  return {
    getGeneral(isPublic = false, params?: { page?: number, limit?: number }) {
      const endpoint = isPublic ? `${basePath}/general/public` : `${basePath}/general`
      return apiFetch<BlogWithPagination>(endpoint, {
        method: 'GET',
        query: {
          page: params?.page ?? 1,
          limit: params?.limit ?? 5,
        },
      })
    },
    getApplicationBlog(applicationSlug: string) {
      return apiFetch<BlogRead>(`${basePath}/application/${applicationSlug}`, { method: 'GET' })
    },

    getReactionTypes() {
      return apiFetch<ListResponse<string>>(`${basePath}/reactions/types`, { method: 'GET' })
    },
    createPost(blogId: string, payload: { content: string, filePath?: string | null }) {
      return apiFetch<BlogMutationAcceptedResponse>(`${basePath}/${blogId}/posts`, {
        method: 'POST',
        body: payload,
      })
    },
    deletePost(postId: string) {
      return apiFetch(`/api/v1/blog/posts/${postId}`, {
        method: 'DELETE',
      })
    },
    updatePost(postId: string, payload: { content?: string, filePath?: string | null }) {
      return apiFetch(`/api/v1/blog/posts/${postId}`, {
        method: 'PATCH',
        body: payload,
      })
    },

    createPostReaction(postId: string, payload: { type: string }) {
      return apiFetch<BlogMutationAcceptedResponse>(`/api/v1/blog/posts/${postId}/reactions`, {
        method: 'POST',
        body: payload,
      })
    },
    createComment(postId: string, payload: { content: string, parentCommentId: string | null }) {
      return apiFetch<BlogMutationAcceptedResponse>(`/api/v1/blog/posts/${postId}/comments`, {
        method: 'POST',
        body: payload,
      })
    },
    deleteComment(commentId: string) {
      return apiFetch(`/api/v1/blog/comments/${commentId}`, {
        method: 'DELETE',
      })
    },
    updateComment(commentId: string, payload: { content: string }) {
      return apiFetch(`/api/v1/blog/comments/${commentId}`, {
        method: 'PATCH',
        body: payload,
      })
    },
    createReaction(commentId: string, payload: { type: string }) {
      return apiFetch<BlogMutationAcceptedResponse>(`/api/v1/blog/comments/${commentId}/reactions`, {
        method: 'POST',
        body: payload,
      })
    },
    deleteReaction(reactionId: string) {
      return apiFetch(`/api/v1/blog/reactions/${reactionId}`, {
        method: 'DELETE',
      })
    },
    updateReaction(reactionId: string, payload: { type: string }) {
      return apiFetch(`/api/v1/blog/reactions/${reactionId}`, {
        method: 'PATCH',
        body: payload,
      })
    },
  }
}
