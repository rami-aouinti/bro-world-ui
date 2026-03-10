<script setup lang="ts">
import PlatformSplitLayout from '~/components/platform/PlatformSplitLayout.vue'
import PlatformSidebarNav from '~/components/platform/PlatformSidebarNav.vue'
import ShopFormCard from '~/components/platform/shop/admin/ShopFormCard.vue'
import ShopImageUploader from '~/components/platform/shop/admin/ShopImageUploader.vue'
import ShopPrimaryAction from '~/components/platform/shop/admin/ShopPrimaryAction.vue'
import ShopRichTextField from '~/components/platform/shop/admin/ShopRichTextField.vue'
import ShopSecondaryAction from '~/components/platform/shop/admin/ShopSecondaryAction.vue'
import ShopSectionTitle from '~/components/platform/shop/admin/ShopSectionTitle.vue'
import UiEmptyState from '~/components/ui/state/UiEmptyState.vue'
import UiLoadingState from '~/components/ui/state/UiLoadingState.vue'
import UiStateAlert from '~/components/ui/state/UiStateAlert.vue'
import productDetails1 from '~/assets/img/products/product-details-1.jpg'
import productDetails2 from '~/assets/img/products/product-details-2.jpg'
import productDetails3 from '~/assets/img/products/product-details-3.jpg'
import productPlaceholder from '~/assets/img/products/product-12.jpg'
import { useNewProductSubmit } from '~/composables/useNewProductSubmit'
import type { NewProductForm } from '~/composables/useNewProductSubmit'
import { submitAndRedirectNewProduct } from '~/composables/newProductPageSubmit'
import { getShopNav } from '~/data/platform-nav'

definePageMeta({ public: true, requiresAuth: false, splitShell: false })

const route = useRoute()
const slug = computed(() => String(route.params.slug ?? ''))
const { isOwner } = usePlatformPermissions(slug)
const navItems = computed(() => getShopNav(slug.value, isOwner.value))
const { t } = useI18n()
const { submit, loading, error } = useNewProductSubmit()

const step = ref(1)
const uiStatus = ref<'ready' | 'empty'>('ready')

const stepSections = computed(() => [
  {
    title: t('platform.shop.newProduct.steps.productInfo'),
    caption: t('platform.shop.newProduct.form.name'),
    image: productDetails1,
  },
  {
    title: t('platform.shop.newProduct.steps.media'),
    caption: t('platform.shop.newProduct.form.description'),
    image: productDetails2,
  },
  {
    title: t('platform.shop.newProduct.steps.socials'),
    caption: t('platform.shop.newProduct.form.instagram'),
    image: productDetails3,
  },
  {
    title: t('platform.shop.newProduct.steps.pricing'),
    caption: t('platform.shop.newProduct.form.price'),
    image: productPlaceholder,
  },
])

const maxStep = computed(() => stepSections.value.length)
const isLastStep = computed(() => step.value === maxStep.value)

const categoryOptions = ['tech', 'fashion', 'home', 'sport', 'beauty', 'kids']
const sizeOptions = ['XS', 'S', 'M', 'L', 'XL', 'XXL']
const currencyOptions = ['EUR', 'USD', 'GBP']

const newProductForm = reactive<NewProductForm>({
  name: '',
  weight: null,
  description: '',
  category: null,
  sizes: [],
  images: [],
  socials: {
    shopifyHandle: '',
    facebook: '',
    instagram: '',
  },
  price: null,
  currency: 'EUR',
  sku: '',
  tags: [],
})

const prevStep = () => {
  step.value = Math.max(1, step.value - 1)
}

const nextStep = () => {
  step.value = Math.min(maxStep.value, step.value + 1)
}

const handleSubmit = async () => {
  await submitAndRedirectNewProduct(slug.value, newProductForm, submit, navigateTo)
}

const setEmptyDemo = () => {
  newProductForm.images = []
  newProductForm.description = ''
  uiStatus.value = 'empty'
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

    <section class="new-product-page platform-shop-admin-page">
      <ShopSectionTitle :title="t('platform.shop.newProduct.title')" :subtitle="t('platform.shop.newProduct.subtitle')" />


      <div class="platform-shop-admin-toolbar">
        <ShopSecondaryAction prepend-icon="mdi-reload" @click="uiStatus = 'ready'">
          {{ t('platform.filters.clear') }}
        </ShopSecondaryAction>
        <ShopSecondaryAction prepend-icon="mdi-database-off-outline" @click="setEmptyDemo">
          {{ t('platform.shop.common.buttons.filters') }}: Empty
        </ShopSecondaryAction>
      </div>

      <UiLoadingState
        v-if="loading"
        class="platform-shop-admin-state"
        variant="form"
        :message="t('platform.shop.newProduct.subtitle')"
      />

      <UiEmptyState
        v-else-if="uiStatus === 'empty'"
        class="platform-shop-admin-state"
        icon="mdi-package-variant-remove"
        :title="t('platform.shop.newProduct.title')"
        :description="t('platform.shop.newProduct.form.descriptionTodo')"
      >
        <template #action>
          <ShopPrimaryAction prepend-icon="mdi-refresh" @click="uiStatus = 'ready'">
            {{ t('platform.filters.clear') }}
          </ShopPrimaryAction>
        </template>
      </UiEmptyState>

      <UiStateAlert
        v-else-if="error"
        class="platform-shop-admin-state"
        type="error"
        :message="error"
      />

      <template v-else>
      <v-stepper v-model="step" flat class="new-product-stepper">
        <v-stepper-header class="new-product-stepper__header">
          <template v-for="(section, index) in stepSections" :key="section.title">
            <v-stepper-item
              :value="index + 1"
              :title="section.title"
              :subtitle="section.caption"
              editable
              complete-icon="mdi-check"
            />
            <v-divider v-if="index < stepSections.length - 1" class="mx-1" />
          </template>
        </v-stepper-header>
      </v-stepper>

      <ShopFormCard>
        <v-window v-model="step">
          <v-window-item :value="1">
            <v-card-text class="pa-6 pa-md-8">
              <v-row>
                <v-col cols="12" md="6">
                  <v-text-field v-model="newProductForm.name" :label="t('platform.shop.newProduct.form.name')" :aria-label="t('platform.shop.newProduct.form.name')" variant="outlined" />
                </v-col>
                <v-col cols="12" md="6">
                  <v-text-field
                    v-model.number="newProductForm.weight"
                    type="number"
                    :label="t('platform.shop.newProduct.form.weight')"
                    variant="outlined"
                  />
                </v-col>
                <v-col cols="12">
                  <ShopRichTextField
                    v-model="newProductForm.description"
                    :label="t('platform.shop.newProduct.form.description')" :aria-label="t('platform.shop.newProduct.form.description')"
                    :hint="t('platform.shop.newProduct.form.descriptionTodo')"
                    persistent-hint
                  />
                </v-col>
                <v-col cols="12" md="6">
                  <v-select
                    v-model="newProductForm.category"
                    :items="categoryOptions"
                    :label="t('platform.shop.newProduct.form.category')"
                    variant="outlined"
                  >
                    <template #item="{ props, item }">
                      <v-list-item v-bind="props" :title="t(`platform.shop.categories.${String(item.raw)}`)" />
                    </template>
                    <template #selection="{ item }">
                      {{ t(`platform.shop.categories.${String(item.raw)}`) }}
                    </template>
                  </v-select>
                </v-col>
                <v-col cols="12" md="6">
                  <v-select
                    v-model="newProductForm.sizes"
                    :items="sizeOptions"
                    :label="t('platform.shop.newProduct.form.sizes')"
                    variant="outlined"
                    chips
                    multiple
                  />
                </v-col>
              </v-row>
            </v-card-text>
          </v-window-item>

          <v-window-item :value="2">
            <v-card-text class="pa-6 pa-md-8">
              <ShopImageUploader v-model="newProductForm.images" :title="t('platform.shop.newProduct.steps.media')">
                <template #preview>
                  <v-img
                    :src="stepSections[1]?.image"
                    :alt="`${stepSections[1]?.title} preview`"
                    height="180"
                    cover
                    class="rounded-lg"
                  >
                    <template #error>
                      <v-img :src="productPlaceholder" :alt="`${stepSections[1]?.title} preview`" height="180" cover class="rounded-lg" />
                    </template>
                  </v-img>
                </template>
              </ShopImageUploader>
            </v-card-text>
          </v-window-item>

          <v-window-item :value="3">
            <v-card-text class="pa-6 pa-md-8">
              <v-row>
                <v-col cols="12" md="4">
                  <v-text-field
                    v-model="newProductForm.socials.shopifyHandle"
                    :label="t('platform.shop.newProduct.form.shopifyHandle')"
                    variant="outlined"
                  />
                </v-col>
                <v-col cols="12" md="4">
                  <v-text-field
                    v-model="newProductForm.socials.facebook"
                    :label="t('platform.shop.newProduct.form.facebook')"
                    variant="outlined"
                  />
                </v-col>
                <v-col cols="12" md="4">
                  <v-text-field
                    v-model="newProductForm.socials.instagram"
                    :label="t('platform.shop.newProduct.form.instagram')"
                    variant="outlined"
                  />
                </v-col>
              </v-row>
            </v-card-text>
          </v-window-item>

          <v-window-item :value="4">
            <v-card-text class="pa-6 pa-md-8">
              <v-row>
                <v-col cols="12" md="4">
                  <v-text-field
                    v-model.number="newProductForm.price"
                    type="number"
                    :label="t('platform.shop.newProduct.form.price')" :aria-label="t('platform.shop.newProduct.form.price')"
                    variant="outlined"
                  />
                </v-col>
                <v-col cols="12" md="4">
                  <v-select
                    v-model="newProductForm.currency"
                    :items="currencyOptions"
                    :label="t('platform.shop.newProduct.form.currency')"
                    variant="outlined"
                  />
                </v-col>
                <v-col cols="12" md="4">
                  <v-text-field
                    v-model="newProductForm.sku"
                    :label="t('platform.shop.newProduct.form.sku')"
                    variant="outlined"
                  />
                </v-col>
                <v-col cols="12">
                  <v-combobox
                    v-model="newProductForm.tags"
                    :label="t('platform.shop.newProduct.form.tags')"
                    variant="outlined"
                    chips
                    multiple
                  />
                </v-col>
              </v-row>
            </v-card-text>
          </v-window-item>
        </v-window>
      </ShopFormCard>

      <div class="shop-admin-actions-row">
        <ShopSecondaryAction :disabled="step <= 1" @click="prevStep">
          {{ t('platform.shop.newProduct.actions.prev') }}
        </ShopSecondaryAction>
        <ShopPrimaryAction v-if="!isLastStep" @click="nextStep">
          {{ t('platform.shop.newProduct.actions.next') }}
        </ShopPrimaryAction>
        <ShopPrimaryAction v-else @click="handleSubmit">
          {{ t('platform.shop.newProduct.actions.send') }}
        </ShopPrimaryAction>
      </div>
      </template>
    </section>
  </PlatformSplitLayout>
</template>

<style scoped>
.new-product-page {
  max-width: 1040px;
  margin: 0 auto;
  padding-bottom: 2rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.new-product-stepper {
  border-radius: 18px;
  overflow: hidden;
  margin-bottom: 1.25rem;
}

.new-product-stepper__header {
  background: linear-gradient(90deg, rgb(248 182 212 / 90%) 0%, rgb(244 114 182 / 85%) 100%);
  padding: 0.5rem;
}

.new-product-page :deep(.v-stepper-item--selected) {
  font-weight: 700;
}


@media (max-width: 960px) {
  .new-product-page {
    max-width: 100%;
  }

}
</style>
