export interface ShopAdminProductForm {
  slug: string
  image: string
  imageAlt: string
  name: string
  subtitle: string
  description: string
  category: string
  weight: number
  size: string
  sku: string
  socials: {
    website: string
    instagram: string
    facebook: string
    tiktok: string
  }
  pricing: {
    price: number
    compareAtPrice: number
    costPerItem: number
    currency: string
    taxRate: number
    stock: number
  }
}

export const shopAdminProductsDemo: ShopAdminProductForm[] = [
  {
    slug: 'smart-watch-pro',
    image: 'product-details-1.jpg',
    imageAlt: 'Smart Watch Pro sur fond sombre',
    name: 'Smart Watch Pro',
    subtitle: 'Montre connectée premium',
    description:
      'Montre connectée premium avec GPS multi-bandes, suivi santé avancé, et autonomie jusqu’à 7 jours.',
    category: 'tech',
    weight: 0.24,
    size: 'M',
    sku: 'SWP-001-M',
    socials: {
      website: 'https://bro-shop.demo/products/smart-watch-pro',
      instagram: '@broshop',
      facebook: 'facebook.com/broshop',
      tiktok: '@broshop',
    },
    pricing: {
      price: 199,
      compareAtPrice: 249,
      costPerItem: 118,
      currency: 'EUR',
      taxRate: 20,
      stock: 31,
    },
  },
  {
    slug: 'running-shoes-x',
    image: 'product-details-2.jpg',
    imageAlt: 'Running Shoes X sur une piste',
    name: 'Running Shoes X',
    subtitle: 'Chaussures running légères',
    description: 'Chaussures running légères pour route et trail, semelle anti-choc et mesh respirant.',
    category: 'sport',
    weight: 0.31,
    size: '42',
    sku: 'RSX-042',
    socials: {
      website: 'https://bro-shop.demo/products/running-shoes-x',
      instagram: '@bro.running',
      facebook: 'facebook.com/brorunning',
      tiktok: '@bro.running',
    },
    pricing: {
      price: 129,
      compareAtPrice: 149,
      costPerItem: 72,
      currency: 'EUR',
      taxRate: 20,
      stock: 42,
    },
  },
]

export const shopAdminCategoryOptions = ['tech', 'fashion', 'home', 'sport', 'beauty', 'kids']
export const shopAdminSizeOptions = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '40', '41', '42', '43']
export const shopAdminCurrencyOptions = ['EUR', 'USD', 'GBP']
