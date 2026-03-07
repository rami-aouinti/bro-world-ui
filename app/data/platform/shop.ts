export type ShopProductStatus = 'active' | 'draft' | 'out-of-stock' | 'archived'
export type ShopCategory = 'apparel' | 'office' | 'electronics'

export interface ShopProduct {
  id: string
  slug: string
  sku: string
  title: string
  category: ShopCategory
  status: ShopProductStatus
  priceEur: number
  stock: number
  tags: string[]
  publishedAt: string
  updatedAt: string
}

export interface ShopCategorySummary {
  id: string
  slug: ShopCategory
  title: string
  status: 'active' | 'inactive'
  tags: string[]
  updatedAt: string
}

export const shopCategories: ShopCategorySummary[] = [
  { id: 'cat-001', slug: 'apparel', title: 'Apparel', status: 'active', tags: ['textile', 'branding'], updatedAt: '2026-02-02' },
  { id: 'cat-002', slug: 'office', title: 'Office', status: 'active', tags: ['workspace', 'productivity'], updatedAt: '2026-01-18' },
  { id: 'cat-003', slug: 'electronics', title: 'Electronics', status: 'active', tags: ['devices', 'premium'], updatedAt: '2026-02-10' },
]

export const shopProducts: ShopProduct[] = [
  { id: 'prd-001', slug: 'starter-pack', sku: 'SKU-001', title: 'Starter pack', category: 'office', status: 'active', priceEur: 29, stock: 42, tags: ['best-seller', 'starter'], publishedAt: '2025-11-20', updatedAt: '2026-02-01' },
  { id: 'prd-002', slug: 'pro-bundle', sku: 'SKU-002', title: 'Pro bundle', category: 'electronics', status: 'active', priceEur: 79, stock: 28, tags: ['bundle', 'premium'], publishedAt: '2025-12-09', updatedAt: '2026-02-14' },
  { id: 'prd-003', slug: 'enterprise-kit', sku: 'SKU-003', title: 'Enterprise kit', category: 'electronics', status: 'active', priceEur: 149, stock: 15, tags: ['enterprise', 'kit'], publishedAt: '2025-10-01', updatedAt: '2026-01-27' },
  { id: 'prd-004', slug: 'hoodie-team', sku: 'SKU-004', title: 'Team hoodie', category: 'apparel', status: 'active', priceEur: 59, stock: 68, tags: ['winter', 'branding'], publishedAt: '2025-09-14', updatedAt: '2026-01-16' },
  { id: 'prd-005', slug: 'smart-notebook', sku: 'SKU-005', title: 'Smart notebook', category: 'office', status: 'out-of-stock', priceEur: 39, stock: 0, tags: ['paperless', 'office'], publishedAt: '2025-08-20', updatedAt: '2026-02-20' },
  { id: 'prd-006', slug: 'wireless-dock', sku: 'SKU-006', title: 'Wireless dock', category: 'electronics', status: 'draft', priceEur: 99, stock: 10, tags: ['dock', 'accessory'], publishedAt: '2026-02-18', updatedAt: '2026-02-19' },
  { id: 'prd-007', slug: 'minimal-tshirt', sku: 'SKU-007', title: 'Minimal t-shirt', category: 'apparel', status: 'active', priceEur: 24, stock: 120, tags: ['summer', 'cotton'], publishedAt: '2025-07-09', updatedAt: '2026-01-08' },
]
