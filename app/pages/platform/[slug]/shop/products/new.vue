<script setup lang="ts">
import PlatformSplitLayout from '~/components/platform/PlatformSplitLayout.vue'
import PlatformSidebarNav from '~/components/platform/PlatformSidebarNav.vue'
import ShopImageDropzone from '~/components/platform/ShopImageDropzone.vue'
import { getShopNav } from '~/data/platform-nav'

definePageMeta({ public: true, requiresAuth: false, splitShell: false })

interface NewProductForm {
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

const route = useRoute()
const slug = computed(() => String(route.params.slug ?? ''))
const { isOwner } = usePlatformPermissions(slug)
const navItems = computed(() => getShopNav(slug.value, isOwner.value))
const { t } = useI18n()

const step = ref(1)

const stepSections = computed(() => [
  {
    title: t('platform.shop.newProduct.steps.productInfo'),
    caption: t('platform.shop.newProduct.form.name'),
    image: '/images/platform-media/shop-premium-hoodie.svg',
  },
  {
    title: t('platform.shop.newProduct.steps.media'),
    caption: t('platform.shop.newProduct.form.description'),
    image: '/images/platform-media/shop-desk-setup-kit.svg',
  },
  {
    title: t('platform.shop.newProduct.steps.socials'),
    caption: t('platform.shop.newProduct.form.instagram'),
    image: '/images/platform-media/shop-sport-pack.svg',
  },
  {
    title: t('platform.shop.newProduct.steps.pricing'),
    caption: t('platform.shop.newProduct.form.price'),
    image: '/images/placeholders/platform-media-fallback.svg',
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
  console.info('TODO: wire backend submission for new product', {
    slug: slug.value,
    payload: newProductForm,
  })
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

    <section class="new-product-page">
      <div class="mb-6">
        <h1 class="text-h5 font-weight-bold mb-2">{{ t('platform.shop.newProduct.title') }}</h1>
        <p class="text-body-2 text-medium-emphasis">{{ t('platform.shop.newProduct.subtitle') }}</p>
      </div>

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

      <v-card class="new-product-form-card" rounded="xl" elevation="0">
        <v-window v-model="step">
          <v-window-item :value="1">
            <v-card-text class="pa-6 pa-md-8">
              <v-row>
                <v-col cols="12" md="6">
                  <v-text-field v-model="newProductForm.name" :label="t('platform.shop.newProduct.form.name')" variant="outlined" />
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
                  <v-textarea
                    v-model="newProductForm.description"
                    :label="t('platform.shop.newProduct.form.description')"
                    variant="outlined"
                    rows="4"
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
              <v-row>
                <v-col cols="12" md="7">
                  <ShopImageDropzone v-model="newProductForm.images" />
                </v-col>
                <v-col cols="12" md="5">
                  <v-sheet class="pa-4 rounded-lg media-preview-sheet" border>
                    <p class="text-subtitle-2 mb-3">{{ t('platform.shop.newProduct.steps.media') }}</p>
                    <v-img
                      :src="stepSections[1]?.image"
                      :alt="stepSections[1]?.title"
                      height="180"
                      cover
                      class="rounded-lg"
                    />
                  </v-sheet>
                </v-col>
              </v-row>
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
                    :label="t('platform.shop.newProduct.form.price')"
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
      </v-card>

      <div class="new-product-actions">
        <v-btn variant="outlined" :disabled="step <= 1" @click="prevStep">
          {{ t('platform.shop.newProduct.actions.prev') }}
        </v-btn>
        <v-btn v-if="!isLastStep" color="primary" @click="nextStep">
          {{ t('platform.shop.newProduct.actions.next') }}
        </v-btn>
        <v-btn v-else color="primary" @click="handleSubmit">
          {{ t('platform.shop.newProduct.actions.send') }}
        </v-btn>
      </div>
    </section>
  </PlatformSplitLayout>
</template>

<style scoped>
.new-product-page {
  max-width: 1040px;
  margin: 0 auto;
  padding-bottom: 2rem;
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

.new-product-form-card {
  border: 1px solid rgb(var(--v-theme-outline-variant));
  border-radius: 24px;
}

.media-preview-sheet {
  background: rgb(var(--v-theme-surface-bright));
}

.new-product-actions {
  display: flex;
  justify-content: space-between;
  gap: 0.75rem;
  margin-top: 1.5rem;
}

@media (max-width: 960px) {
  .new-product-page {
    max-width: 100%;
  }

  .new-product-actions {
    flex-direction: column;
  }

  .new-product-actions :deep(.v-btn) {
    width: 100%;
  }
}
</style>
