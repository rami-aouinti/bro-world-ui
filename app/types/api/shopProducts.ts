export interface ShopProductCreateSocials {
  shopifyHandle: string
  facebook: string
  instagram: string
}

export interface ShopProductCreatePayload {
  name: string
  price: number
  sku: string
  category: string
  sizes: string[]
  media: Array<{
    name: string
    type: string
    size: number
  }>
  description: string
  tags: string[]
  socials: ShopProductCreateSocials
}

export interface ShopProductCreateResponse {
  id: string
  slug: string
}
