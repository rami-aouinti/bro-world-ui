<script setup lang="ts">
import PlatformSplitLayout from '~/components/platform/PlatformSplitLayout.vue'
import PlatformSidebarNav from '~/components/platform/PlatformSidebarNav.vue'
import ShopFormCard from '~/components/platform/shop/admin/ShopFormCard.vue'
import ShopPrimaryAction from '~/components/platform/shop/admin/ShopPrimaryAction.vue'
import ShopRichTextField from '~/components/platform/shop/admin/ShopRichTextField.vue'
import ShopSecondaryAction from '~/components/platform/shop/admin/ShopSecondaryAction.vue'
import ShopSectionTitle from '~/components/platform/shop/admin/ShopSectionTitle.vue'
import productPlaceholder from '~/assets/img/products/product-12.jpg'
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
const { t } = useI18n()

const productSeed = computed(() => {
  return shopAdminProductsDemo.find((item) => item.slug === productSlug.value) ?? shopAdminProductsDemo[0]
})

const productForm = reactive(structuredClone(productSeed.value))

watch(productSeed, (value) => {
  Object.assign(productForm, structuredClone(value))
})

const productImage = computed(() => productForm.image || productPlaceholder)

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
      <ShopSectionTitle :title="t('platform.shop.editProduct.title')" :subtitle="t('platform.shop.editProduct.subtitle')">
        <template #actions>
          <ShopPrimaryAction :loading="isSaving" prepend-icon="mdi-content-save-outline" @click="onSave">
            {{ t('platform.shop.common.buttons.save') }}
          </ShopPrimaryAction>
        </template>
      </ShopSectionTitle>

      <v-row>
        <v-col cols="12" md="4">
          <ShopFormCard class="h-100">
            <v-card-title class="text-subtitle-1 font-weight-bold">{{ t('platform.shop.editProduct.sections.productImage') }}</v-card-title>
            <v-card-text class="d-flex flex-column ga-4">
              <v-img :src="productImage" :alt="productForm.imageAlt" height="220" cover rounded="lg">
                <template #error>
                  <v-img :src="productPlaceholder" :alt="productForm.imageAlt" height="220" cover rounded="lg" />
                </template>
              </v-img>

              <v-text-field
                v-model="productForm.imageAlt"
                 :label="t('platform.shop.editProduct.form.imageAltText')"
                variant="outlined"
                density="comfortable"
                hide-details="auto"
              />

              <div class="d-flex ga-2">
                <ShopSecondaryAction block prepend-icon="mdi-pencil-outline">{{ t('platform.shop.common.buttons.editVisual') }}</ShopSecondaryAction>
                <ShopSecondaryAction block prepend-icon="mdi-delete-outline">{{ t('platform.shop.common.buttons.removeVisual') }}</ShopSecondaryAction>
              </div>
            </v-card-text>
          </ShopFormCard>
        </v-col>

        <v-col cols="12" md="8">
          <ShopFormCard class="h-100">
            <v-card-title class="text-subtitle-1 font-weight-bold">{{ t('platform.shop.editProduct.sections.productInformation') }}</v-card-title>
            <v-card-text>
              <v-row>
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="productForm.name"
                     :label="t('platform.shop.editProduct.form.productName')"
                    variant="outlined"
                    density="comfortable"
                    hide-details="auto"
                  />
                </v-col>
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="productForm.subtitle"
                     :label="t('platform.shop.editProduct.form.subtitle')"
                    variant="outlined"
                    density="comfortable"
                    hide-details="auto"
                  />
                </v-col>
                <v-col cols="12">
                  <ShopRichTextField
                    v-model="productForm.description"
                     :label="t('platform.shop.editProduct.form.description')"
                  />
                </v-col>
                <v-col cols="12" md="4">
                  <v-select
                    v-model="productForm.category"
                    :items="shopAdminCategoryOptions"
                     :label="t('platform.shop.editProduct.form.category')"
                    variant="outlined"
                    density="comfortable"
                    hide-details="auto"
                  />
                </v-col>
                <v-col cols="12" md="4">
                  <v-select
                    v-model="productForm.size"
                    :items="shopAdminSizeOptions"
                     :label="t('platform.shop.editProduct.form.size')"
                    variant="outlined"
                    density="comfortable"
                    hide-details="auto"
                  />
                </v-col>
                <v-col cols="12" md="4">
                  <v-text-field
                    v-model.number="productForm.weight"
                    type="number"
                     :label="t('platform.shop.editProduct.form.weight')"
                    variant="outlined"
                    density="comfortable"
                    hide-details="auto"
                  />
                </v-col>
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="productForm.sku"
                     :label="t('platform.shop.editProduct.form.sku')"
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
            <v-card-title class="text-subtitle-1 font-weight-bold">{{ t('platform.shop.editProduct.sections.socials') }}</v-card-title>
            <v-card-text>
              <v-row>
                <v-col cols="12">
                  <v-text-field
                    v-model="productForm.socials.website"
                     :label="t('platform.shop.editProduct.form.website')"
                    variant="outlined"
                    density="comfortable"
                    hide-details="auto"
                    prepend-inner-icon="mdi-web"
                  />
                </v-col>
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="productForm.socials.instagram"
                     :label="t('platform.shop.editProduct.form.instagram')"
                    variant="outlined"
                    density="comfortable"
                    hide-details="auto"
                    prepend-inner-icon="mdi-instagram"
                  />
                </v-col>
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model="productForm.socials.facebook"
                     :label="t('platform.shop.editProduct.form.facebook')"
                    variant="outlined"
                    density="comfortable"
                    hide-details="auto"
                    prepend-inner-icon="mdi-facebook"
                  />
                </v-col>
                <v-col cols="12">
                  <v-text-field
                    v-model="productForm.socials.tiktok"
                     :label="t('platform.shop.editProduct.form.tiktok')"
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
            <v-card-title class="text-subtitle-1 font-weight-bold">{{ t('platform.shop.editProduct.sections.pricing') }}</v-card-title>
            <v-card-text>
              <v-row>
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model.number="productForm.pricing.price"
                    type="number"
                     :label="t('platform.shop.editProduct.form.price')"
                    variant="outlined"
                    density="comfortable"
                    hide-details="auto"
                  />
                </v-col>
                <v-col cols="12" md="6">
                  <v-select
                    v-model="productForm.pricing.currency"
                    :items="shopAdminCurrencyOptions"
                     :label="t('platform.shop.editProduct.form.currency')"
                    variant="outlined"
                    density="comfortable"
                    hide-details="auto"
                  />
                </v-col>
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model.number="productForm.pricing.compareAtPrice"
                    type="number"
                     :label="t('platform.shop.editProduct.form.compareAtPrice')"
                    variant="outlined"
                    density="comfortable"
                    hide-details="auto"
                  />
                </v-col>
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model.number="productForm.pricing.costPerItem"
                    type="number"
                     :label="t('platform.shop.editProduct.form.costPerItem')"
                    variant="outlined"
                    density="comfortable"
                    hide-details="auto"
                  />
                </v-col>
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model.number="productForm.pricing.taxRate"
                    type="number"
                     :label="t('platform.shop.editProduct.form.taxRate')"
                    variant="outlined"
                    density="comfortable"
                    hide-details="auto"
                  />
                </v-col>
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model.number="productForm.pricing.stock"
                    type="number"
                     :label="t('platform.shop.editProduct.form.stock')"
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
        {{ t('platform.shop.editProduct.saveSuccess') }}
      </v-snackbar>
    </section>
  </PlatformSplitLayout>
</template>
