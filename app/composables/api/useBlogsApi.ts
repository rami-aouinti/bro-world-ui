import { useApiClient } from '../useApiClient'
import type { BlogRead } from '~/types/api/blog'

export const useBlogsApi = () => {
  const { apiFetch } = useApiClient()
  const basePath = '/api/v1/blogs'

  return {
    getGeneral() {
      return apiFetch<BlogRead>(`${basePath}/general`, { method: 'GET' })
    },
    getApplicationBlog(applicationSlug: string) {
      return apiFetch<BlogRead>(`${basePath}/application/${applicationSlug}`, { method: 'GET' })
    },
  }
}
