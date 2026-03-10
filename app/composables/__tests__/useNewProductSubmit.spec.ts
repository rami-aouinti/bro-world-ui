import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ShopProductsApiError } from '~/composables/api/useShopProductsApi'
import type { NewProductForm } from '~/composables/useNewProductSubmit'
import { useNewProductSubmit } from '~/composables/useNewProductSubmit'
import { submitAndRedirectNewProduct } from '~/composables/newProductPageSubmit'

const createProductMock = vi.fn()
vi.mock('~/composables/api/useShopProductsApi', async (importOriginal) => {
  const mod = await importOriginal<typeof import('~/composables/api/useShopProductsApi')>()
  return {
    ...mod,
    useShopProductsApi: () => ({ createProduct: createProductMock }),
  }
})

const makeForm = (): NewProductForm => ({
  name: 'Produit',
  weight: null,
  description: 'Description',
  category: 'tech',
  sizes: ['M'],
  images: [new File(['ok'], 'image.jpg', { type: 'image/jpeg' })],
  socials: { shopifyHandle: '', facebook: '', instagram: '' },
  price: 12,
  currency: 'EUR',
  sku: 'SKU-1',
  tags: ['new'],
})

describe('useNewProductSubmit + page submit behavior', () => {
  beforeEach(() => {
    createProductMock.mockReset()
  })

  it('success submit', async () => {
    createProductMock.mockResolvedValue({ id: '1', slug: 'created' })
    const { submit, error } = useNewProductSubmit()

    const result = await submit('platform', makeForm())

    expect(result?.slug).toBe('created')
    expect(error.value).toBeNull()
  })

  it('validation error', async () => {
    const form = makeForm()
    form.price = 0
    const { submit, error } = useNewProductSubmit()

    const result = await submit('platform', form)

    expect(result).toBeNull()
    expect(error.value).toContain('supérieur à 0')
    expect(createProductMock).not.toHaveBeenCalled()
  })

  it('backend error', async () => {
    createProductMock.mockRejectedValue(new ShopProductsApiError(409, 'Un produit avec ce SKU existe déjà.'))
    const { submit, error } = useNewProductSubmit()

    const result = await submit('platform', makeForm())

    expect(result).toBeNull()
    expect(error.value).toContain('SKU')
  })

  it('component submit behavior redirects only on success', async () => {
    const submitMock = vi.fn().mockResolvedValue({ slug: 'ok' })
    const navigateMock = vi.fn().mockResolvedValue(undefined)

    const redirectPath = await submitAndRedirectNewProduct('platform', makeForm(), submitMock, navigateMock)

    expect(redirectPath).toBe('/platform/platform/shop/products/ok/edit')
    expect(navigateMock).toHaveBeenCalledWith('/platform/platform/shop/products/ok/edit')
  })
})
