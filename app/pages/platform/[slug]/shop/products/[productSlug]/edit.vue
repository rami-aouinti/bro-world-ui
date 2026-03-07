<script setup lang="ts">
import PlatformSplitLayout from '~/components/platform/PlatformSplitLayout.vue'
import PlatformSidebarNav from '~/components/platform/PlatformSidebarNav.vue'
import ShopFormCard from '~/components/platform/shop/admin/ShopFormCard.vue'
import ShopPrimaryAction from '~/components/platform/shop/admin/ShopPrimaryAction.vue'
import ShopRichTextField from '~/components/platform/shop/admin/ShopRichTextField.vue'
import ShopSecondaryAction from '~/components/platform/shop/admin/ShopSecondaryAction.vue'
import ShopSectionTitle from '~/components/platform/shop/admin/ShopSectionTitle.vue'
import {
  shopAdminCategoryOptions,
  shopAdminCurrencyOptions,
  shopAdminProductsDemo,
  shopAdminSizeOptions,
} from '~/data/shop-admin-demo'
import { getShopNav } from '~/data/platform-nav'

definePageMeta({ public: true, requiresAuth: false, splitShell: false })

const route = useRoute()
const slug = computed(() => String(route.params.slug ?? ''))
const productSlug = computed(() => String(route.params.productSlug ?? ''))
const { isOwner } = usePlatformPermissions(slug)
const navItems = computed(() => getShopNav(slug.value, isOwner.value))

const productSeed = computed(() => {
  return shopAdminProductsDemo.find((item) => item.slug === productSlug.value) ?? shopAdminProductsDemo[0]
})

const productForm = reactive(structuredClone(productSeed.value))

watch(productSeed, (value) => {
  Object.assign(productForm, structuredClone(value))
})

const productImage = computed(
  () => new URL(`~/assets/img/products/${productForm.image}`, import.meta.url).href,
)

const isSaving = ref(false)
const showSavedSnackbar = ref(false)

const onSave = async () => {
  isSaving.value = true
  await new Promise((resolve) => setTimeout(resolve, 900))

  console.info('Mock save product', {
    platform: slug.value,
    product: productSlug.value,
    payload: productForm,
  })

  isSaving.value = false
  showSavedSnackbar.value = true
}
</script>

<template>
  <PlatformSplitLayout>
    <template #sidebar>
      <PlatformSidebarNav
        title="platform.shop.sidebar.title"
        subtitle="platform.common.sidebar.application"
        :subtitle-values="{ slug }"
        :items="navItems"
      />
    </template>

    <section>
      <ShopSectionTitle title="Edit Product" subtitle="Update catalog content, socials, and pricing metadata.">
        <template #actions>
          <ShopPrimaryAction :loading="isSaving" prepend-icon="mdi-content-save-outline" @click="onSave">
            Save
          </ShopPrimaryAction>
        </template>
      </ShopSectionTitle>

      <v-row>
        <v-col cols="12" md="4">
          <ShopFormCard class="h-100">
            <v-card-title class="text-subtitle-1 font-weight-bold">Product Image</v-card-title>
            <v-card-text class="d-flex flex-column ga-4">
              <v-img :src="productImage" :alt="productForm.imageAlt" height="220" cover rounded="lg" />

              <v-text-field
                v-model="productForm.imageAlt"
                label="Image alt text"
                variant="outlined"
                density="comfortable"
                hide-details="auto"
              />

              <div class="d-flex ga-2">
                <ShopSecondaryAction block prepend-icon="mdi-pencil-outline">Edit visual</ShopSecondaryAction>
                <ShopSecondaryAction block prepend-icon="mdi-delete-outline">Remove visual</ShopSecondaryAction>
              </div>
            </v-card-text>
          </ShopFormCard>
        </v-col>

        <v-col cols="12" md="8">
          <ShopFormCard class="h-100">
            <v-card-title class="text-subtitle-1 font-weight-bold">Product Information</v-card-title>
            <v-card-text>
              <v-row>
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="productForm.name"
                    label="Product name"
                    variant="outlined"
                    density="comfortable"
                    hide-details="auto"
                  />
                </v-col>
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="productForm.subtitle"
                    label="Subtitle"
                    variant="outlined"
                    density="comfortable"
                    hide-details="auto"
                  />
                </v-col>
                <v-col cols="12">
                  <ShopRichTextField
                    v-model="productForm.description"
                    label="Description"
                  />
                </v-col>
                <v-col cols="12" md="4">
                  <v-select
                    v-model="productForm.category"
                    :items="shopAdminCategoryOptions"
                    label="Category"
                    variant="outlined"
                    density="comfortable"
                    hide-details="auto"
                  />
                </v-col>
                <v-col cols="12" md="4">
                  <v-select
                    v-model="productForm.size"
                    :items="shopAdminSizeOptions"
                    label="Size"
                    variant="outlined"
                    density="comfortable"
                    hide-details="auto"
                  />
                </v-col>
                <v-col cols="12" md="4">
                  <v-text-field
                    v-model.number="productForm.weight"
                    type="number"
                    label="Weight (kg)"
                    variant="outlined"
                    density="comfortable"
                    hide-details="auto"
                  />
                </v-col>
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="productForm.sku"
                    label="SKU"
                    variant="outlined"
                    density="comfortable"
                    hide-details="auto"
                  />
                </v-col>
              </v-row>
            </v-card-text>
          </ShopFormCard>
        </v-col>

        <v-col cols="12" md="6">
          <ShopFormCard>
            <v-card-title class="text-subtitle-1 font-weight-bold">Socials</v-card-title>
            <v-card-text>
              <v-row>
                <v-col cols="12">
                  <v-text-field
                    v-model="productForm.socials.website"
                    label="Website"
                    variant="outlined"
                    density="comfortable"
                    hide-details="auto"
                    prepend-inner-icon="mdi-web"
                  />
                </v-col>
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="productForm.socials.instagram"
                    label="Instagram"
                    variant="outlined"
                    density="comfortable"
                    hide-details="auto"
                    prepend-inner-icon="mdi-instagram"
                  />
                </v-col>
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="productForm.socials.facebook"
                    label="Facebook"
                    variant="outlined"
                    density="comfortable"
                    hide-details="auto"
                    prepend-inner-icon="mdi-facebook"
                  />
                </v-col>
                <v-col cols="12">
                  <v-text-field
                    v-model="productForm.socials.tiktok"
                    label="TikTok"
                    variant="outlined"
                    density="comfortable"
                    hide-details="auto"
                    prepend-inner-icon="mdi-music"
                  />
                </v-col>
              </v-row>
            </v-card-text>
          </ShopFormCard>
        </v-col>

        <v-col cols="12" md="6">
          <ShopFormCard>
            <v-card-title class="text-subtitle-1 font-weight-bold">Pricing</v-card-title>
            <v-card-text>
              <v-row>
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model.number="productForm.pricing.price"
                    type="number"
                    label="Price"
                    variant="outlined"
                    density="comfortable"
                    hide-details="auto"
                  />
                </v-col>
                <v-col cols="12" md="6">
                  <v-select
                    v-model="productForm.pricing.currency"
                    :items="shopAdminCurrencyOptions"
                    label="Currency"
                    variant="outlined"
                    density="comfortable"
                    hide-details="auto"
                  />
                </v-col>
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model.number="productForm.pricing.compareAtPrice"
                    type="number"
                    label="Compare-at price"
                    variant="outlined"
                    density="comfortable"
                    hide-details="auto"
                  />
                </v-col>
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model.number="productForm.pricing.costPerItem"
                    type="number"
                    label="Cost per item"
                    variant="outlined"
                    density="comfortable"
                    hide-details="auto"
                  />
                </v-col>
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model.number="productForm.pricing.taxRate"
                    type="number"
                    label="Tax rate (%)"
                    variant="outlined"
                    density="comfortable"
                    hide-details="auto"
                  />
                </v-col>
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model.number="productForm.pricing.stock"
                    type="number"
                    label="Stock"
                    variant="outlined"
                    density="comfortable"
                    hide-details="auto"
                  />
                </v-col>
              </v-row>
            </v-card-text>
          </ShopFormCard>
        </v-col>
      </v-row>

      <v-snackbar v-model="showSavedSnackbar" color="success" location="bottom right" timeout="2600">
        Product updated successfully (mock).
      </v-snackbar>
    </section>
  </PlatformSplitLayout>
</template>
