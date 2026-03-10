import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mapCreateProductErrorMessage, useShopProductsApi } from '~/composables/api/useShopProductsApi'

const apiFetchMock = vi.fn()
vi.mock('~/composables/useApiClient', () => ({
  useApiClient: () => ({ apiFetch: apiFetchMock }),
}))

describe('useShopProductsApi', () => {
  beforeEach(() => {
    apiFetchMock.mockReset()
  })

  it('creates product via POST endpoint', async () => {
    apiFetchMock.mockResolvedValue({ id: '1', slug: 'created' })

    const api = useShopProductsApi()
    const payload = {
      name: 'T-shirt',
      price: 29,
      sku: 'TS-001',
      category: 'fashion',
      sizes: ['M'],
      media: [{ name: 'pic.jpg', type: 'image/jpeg', size: 2000 }],
      description: 'desc',
      tags: ['new'],
      socials: { shopifyHandle: '', facebook: '', instagram: '' },
    }

    await api.createProduct('shop-slug', payload)

    expect(apiFetchMock).toHaveBeenCalledWith('/api/v1/shop/platforms/shop-slug/products', {
      method: 'POST',
      body: payload,
    })
  })

  it('maps backend errors', () => {
    expect(mapCreateProductErrorMessage(400)).toContain('invalides')
    expect(mapCreateProductErrorMessage(401)).toContain('connecté')
    expect(mapCreateProductErrorMessage(409)).toContain('SKU')
    expect(mapCreateProductErrorMessage(500)).toContain('serveur')
  })
})
