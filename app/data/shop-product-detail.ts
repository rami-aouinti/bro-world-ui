import productMainImage from '~/assets/img/products/product-details-1.jpg'
import productThumbnail2 from '~/assets/img/products/product-details-2.jpg'
import productThumbnail3 from '~/assets/img/products/product-details-3.jpg'
import productThumbnail4 from '~/assets/img/products/product-details-4.jpg'
import productThumbnail5 from '~/assets/img/products/product-details-5.jpg'
import productPlaceholder from '~/assets/img/products/product-12.jpg'

export interface ShopProductVariant {
  material: string[]
  color: string[]
  quantity: number[]
}

export interface ShopOtherProduct {
  id: number
  title: string
  price: number
  rating: number
  availability: number
}

export const shopProductGallery: string[] = [
  productMainImage || productPlaceholder,
  productThumbnail2,
  productThumbnail3,
  productThumbnail4,
  productThumbnail5,
]

export const shopProductVariants: ShopProductVariant = {
  material: ['Cotton Blend', 'Merino', 'Recycled Polyester'],
  color: ['Black', 'Sand', 'Ocean Blue', 'Forest Green'],
  quantity: [1, 2, 3, 4, 5],
}

export const shopOtherProducts: ShopOtherProduct[] = [
  { id: 101, title: 'Performance Zip Hoodie', price: 89, rating: 4.7, availability: 92 },
  { id: 102, title: 'Streetwear Joggers', price: 69, rating: 4.4, availability: 68 },
  { id: 103, title: 'City Essentials Tee', price: 39, rating: 4.2, availability: 84 },
  { id: 104, title: 'All Weather Shell', price: 129, rating: 4.8, availability: 57 },
  { id: 105, title: 'Relaxed Fit Crewneck', price: 59, rating: 4.5, availability: 73 },
]
