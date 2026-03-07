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
const stepLabels = computed(() => [
  t('platform.shop.newProduct.steps.productInfo'),
  t('platform.shop.newProduct.steps.media'),
  t('platform.shop.newProduct.steps.socials'),
  t('platform.shop.newProduct.steps.pricing'),
])

const maxStep = computed(() => stepLabels.value.length)

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

    <section>
      <h1 class="text-h5 font-weight-bold mb-2">{{ t('platform.shop.newProduct.title') }}</h1>
      <p class="text-body-2 text-medium-emphasis mb-6">{{ t('platform.shop.newProduct.subtitle') }}</p>

      <v-stepper v-model="step" :items="stepLabels" alt-labels editable class="mb-6" />

      <v-window v-model="step">
        <v-window-item :value="1">
          <v-card rounded="xl" variant="outlined">
            <v-card-text>
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
          </v-card>
        </v-window-item>

        <v-window-item :value="2">
          <v-card rounded="xl" variant="outlined">
            <v-card-text>
              <ShopImageDropzone v-model="newProductForm.images" />
            </v-card-text>
          </v-card>
        </v-window-item>

        <v-window-item :value="3">
          <v-card rounded="xl" variant="outlined">
            <v-card-text>
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
          </v-card>
        </v-window-item>

        <v-window-item :value="4">
          <v-card rounded="xl" variant="outlined">
            <v-card-text>
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
          </v-card>
        </v-window-item>
      </v-window>

      <div class="d-flex justify-space-between mt-6">
        <v-btn variant="outlined" :disabled="step <= 1" @click="prevStep">{{ t('platform.shop.newProduct.actions.prev') }}</v-btn>
        <div class="d-flex ga-2">
          <v-btn v-if="step < maxStep" color="primary" @click="nextStep">{{ t('platform.shop.newProduct.actions.next') }}</v-btn>
          <v-btn v-else color="primary" @click="handleSubmit">{{ t('platform.shop.newProduct.actions.send') }}</v-btn>
        </div>
      </div>
    </section>
  </PlatformSplitLayout>
</template>
