import { buildListQuery } from './query'
import { useApiClient } from '../useApiClient'
import type { CountResponse, IdsResponse, ListQueryParams, PaginatedResponse, QueryParams, UUID } from '~/types/api/common'
import type { AboutPagePayload, ContactPagePayload, FaqPagePayload, HomePagePayload, PageEntityRead } from '~/types/api/page'

const languageCode = (locale: string) => locale.toLowerCase().startsWith('fr') ? 'fr' : 'en'

const usePageManagementApi = (resource: 'home' | 'about' | 'contact' | 'faq') => {
  const { apiFetch } = useApiClient()
  const basePath = `/api/v1/page/${resource}`

  return {
    list(query: ListQueryParams = {}, extraQuery: QueryParams = {}) {
      return apiFetch<PaginatedResponse<PageEntityRead> | PageEntityRead[]>(basePath, {
        method: 'GET',
        query: buildListQuery(query, extraQuery),
      })
    },
    count(query: ListQueryParams = {}, extraQuery: QueryParams = {}) {
      return apiFetch<CountResponse>(`${basePath}/count`, {
        method: 'GET',
        query: buildListQuery(query, extraQuery),
      })
    },
    ids(query: ListQueryParams = {}, extraQuery: QueryParams = {}) {
      return apiFetch<IdsResponse>(`${basePath}/ids`, {
        method: 'GET',
        query: buildListQuery(query, extraQuery),
      })
    },
    getById(id: UUID) {
      return apiFetch<PageEntityRead>(`${basePath}/${id}`, { method: 'GET' })
    },
    create(payload: Record<string, unknown>) {
      return apiFetch<PageEntityRead>(basePath, { method: 'POST', body: payload })
    },
    update(id: UUID, payload: Record<string, unknown>) {
      return apiFetch<PageEntityRead>(`${basePath}/${id}`, { method: 'PUT', body: payload })
    },
    patch(id: UUID, payload: Record<string, unknown>) {
      return apiFetch<PageEntityRead>(`${basePath}/${id}`, { method: 'PATCH', body: payload })
    },
    delete(id: UUID) {
      return apiFetch<void>(`${basePath}/${id}`, { method: 'DELETE' })
    },
  }
}

export const usePagePublicApi = () => {
  const { apiFetch } = useApiClient()

  return {
    getHome(locale: string) {
      return apiFetch<HomePagePayload>(`/api/v1/page/public/home/${languageCode(locale)}`, { method: 'GET' })
    },
    getAbout(locale: string) {
      return apiFetch<AboutPagePayload>(`/api/v1/page/public/about/${languageCode(locale)}`, { method: 'GET' })
    },
    getContact(locale: string) {
      return apiFetch<ContactPagePayload>(`/api/v1/page/public/contact/${languageCode(locale)}`, { method: 'GET' })
    },
    getFaq(locale: string) {
      return apiFetch<FaqPagePayload>(`/api/v1/page/public/faq/${languageCode(locale)}`, { method: 'GET' })
    },
  }
}

export const useHomePageManagementApi = () => usePageManagementApi('home')
export const useAboutPageManagementApi = () => usePageManagementApi('about')
export const useContactPageManagementApi = () => usePageManagementApi('contact')
export const useFaqPageManagementApi = () => usePageManagementApi('faq')

