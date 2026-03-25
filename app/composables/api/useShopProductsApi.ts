import { useApiClient } from '../useApiClient'
import { normalizeErrorResponse } from './responseNormalizer'
import type { ShopProductCreatePayload, ShopProductCreateResponse } from '~/types/api/shopProducts'

export class ShopProductsApiError extends Error {
  statusCode: number

  constructor(statusCode: number, message: string) {
    super(message)
    this.name = 'ShopProductsApiError'
    this.statusCode = statusCode
  }
}

export const mapCreateProductErrorMessage = (statusCode: number): string => {
  switch (statusCode) {
    case 400:
      return 'Les informations du produit sont invalides. Vérifiez les champs obligatoires.'
    case 401:
      return 'Vous devez être connecté pour créer un produit.'
    case 409:
      return 'Un produit avec ce SKU existe déjà.'
    case 500:
      return 'Une erreur serveur est survenue. Réessayez plus tard.'
    default:
      return 'Impossible de créer le produit pour le moment.'
  }
}

export const useShopProductsApi = () => {
  const { apiFetch } = useApiClient()

  const createProduct = async (platformSlug: string, payload: ShopProductCreatePayload) => {
    try {
      return await apiFetch<ShopProductCreateResponse>(`/api/v1/shop/platforms/${platformSlug}/products`, {
        method: 'POST',
        body: payload,
      })
    }
    catch (error: unknown) {
      const statusCode = normalizeErrorResponse(error).status ?? 500
      throw new ShopProductsApiError(statusCode, mapCreateProductErrorMessage(statusCode))
    }
  }

  return {
    createProduct,
  }
}
