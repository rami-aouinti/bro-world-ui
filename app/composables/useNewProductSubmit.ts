import type { ShopProductCreatePayload } from '~/types/api/shopProducts'
import { ShopProductsApiError, useShopProductsApi } from '~/composables/api/useShopProductsApi'

export interface NewProductForm {
  name: string
  weight: number | null
  description: string
  category: string | null
  sizes: string[]
  images: File[]
  socials: {
    shopifyHandle: string
    facebook: string
    instagram: string
  }
  price: number | null
  currency: string
  sku: string
  tags: string[]
}

const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024

const buildPayload = (form: NewProductForm): ShopProductCreatePayload => ({
  name: form.name.trim(),
  price: Number(form.price),
  sku: form.sku.trim(),
  category: String(form.category),
  sizes: form.sizes,
  media: form.images.map((image) => ({
    name: image.name,
    type: image.type,
    size: image.size,
  })),
  description: form.description.trim(),
  tags: form.tags,
  socials: {
    shopifyHandle: form.socials.shopifyHandle.trim(),
    facebook: form.socials.facebook.trim(),
    instagram: form.socials.instagram.trim(),
  },
})

export const validateNewProductForm = (form: NewProductForm): string | null => {
  if (!form.name.trim()) {
    return 'Le nom du produit est requis.'
  }

  if (!form.category) {
    return 'La catégorie est requise.'
  }

  if (!form.sku.trim()) {
    return 'Le SKU est requis.'
  }

  if (!form.price || form.price <= 0) {
    return 'Le prix doit être supérieur à 0.'
  }

  const oversizedImage = form.images.find((image) => image.size > MAX_IMAGE_SIZE_BYTES)
  if (oversizedImage) {
    return `L'image "${oversizedImage.name}" dépasse la taille maximale de 5MB.`
  }

  return null
}

export const useNewProductSubmit = () => {
  const { createProduct } = useShopProductsApi()

  const loading = ref(false)
  const error = ref<string | null>(null)

  const submit = async (platformSlug: string, form: NewProductForm) => {
    error.value = null
    const validationError = validateNewProductForm(form)

    if (validationError) {
      error.value = validationError
      return null
    }

    loading.value = true
    try {
      return await createProduct(platformSlug, buildPayload(form))
    }
    catch (apiError: unknown) {
      if (apiError instanceof ShopProductsApiError) {
        error.value = apiError.message
      }
      else {
        error.value = 'Impossible de créer le produit pour le moment.'
      }
      return null
    }
    finally {
      loading.value = false
    }
  }

  return {
    loading,
    error,
    submit,
  }
}
