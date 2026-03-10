import type { NewProductForm } from '~/composables/useNewProductSubmit'

interface ProductCreated {
  slug: string
}

type SubmitProduct = (platformSlug: string, form: NewProductForm) => Promise<ProductCreated | null>
type Navigate = (target: string) => Promise<unknown> | unknown

export const submitAndRedirectNewProduct = async (
  platformSlug: string,
  form: NewProductForm,
  submit: SubmitProduct,
  navigate: Navigate,
) => {
  const createdProduct = await submit(platformSlug, form)
  if (!createdProduct) {
    return null
  }

  const redirectPath = `/platform/${platformSlug}/shop/products/${createdProduct.slug}/edit`
  await navigate(redirectPath)

  return redirectPath
}
