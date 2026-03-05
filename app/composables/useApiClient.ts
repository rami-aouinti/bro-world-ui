export const useApiClient = () => {
  const apiFetch = async <T>(url: string, options: Parameters<typeof $fetch<T>>[1] = {}) => {
    const normalizedUrl = url.replace(/^\/+/, '')

    return $fetch<T>(`/api/backend/${normalizedUrl}`, {
      ...options,
    })
  }

  return {
    apiFetch,
  }
}
