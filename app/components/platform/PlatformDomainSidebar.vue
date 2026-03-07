<script setup lang="ts">
import UiSectionHeader from '~/components/ui/UiSectionHeader.vue'

const props = defineProps<{
  domain: 'crm' | 'shop' | 'recruit' | 'school'
  slug: string
}>()

const route = useRoute()
const { smAndDown } = useDisplay()

const isCollapsed = ref(false)

watch(
  smAndDown,
  (mobile) => {
    isCollapsed.value = mobile
  },
  { immediate: true },
)

const domainTitle = computed(() => {
  const labels = {
    crm: 'CRM',
    shop: 'Shop',
    recruit: 'Recruit',
    school: 'School',
  }

  return labels[props.domain]
})

const crmItems = computed(() => [
  { label: 'Dashboard', to: `/platform/${props.slug}/crm/dashboard` },
  { label: 'Companies', to: `/platform/${props.slug}/crm/companies` },
  { label: 'Projects', to: `/platform/${props.slug}/crm/projects` },
  { label: 'Sprint', to: `/platform/${props.slug}/crm/sprint` },
  { label: 'Calendar', to: `/platform/${props.slug}/crm/calendar` },
  { label: 'Setting', to: `/platform/${props.slug}/crm/settings` },
  { label: 'Billing', to: `/platform/${props.slug}/crm/billing` },
])

const shopCategories = computed(() => [
  { slug: 'apparel', label: 'Apparel', products: ['hoodie-bro', 'urban-tee'] },
  { slug: 'office', label: 'Office', products: ['ergonomic-chair', 'smart-desk'] },
  { slug: 'electronics', label: 'Electronics', products: ['noise-cancelling-headphones', 'streaming-cam'] },
])

const schoolItems = computed(() => [
  { label: 'Classes', to: `/platform/${props.slug}/school/home` },
  { label: 'Settings', to: `/platform/${props.slug}/school/settings` },
  { label: 'Certificates', to: `/platform/${props.slug}/school/certificates` },
])

const recruitFilters = ref({
  contracts: ['CDI', 'CDD'],
  locations: ['Paris'],
  remote: true,
  seniority: ['Mid', 'Senior'],
})

const contractOptions = ['CDI', 'CDD', 'Freelance', 'Internship']
const locationOptions = ['Paris', 'Lyon', 'Marseille', 'Remote EU']
const seniorityOptions = ['Junior', 'Mid', 'Senior', 'Lead']

const isRouteActive = (to: string) => route.path === to
const isRouteInSection = (pathPrefix: string) => route.path.startsWith(pathPrefix)
</script>

<template>
  <div class="platform-domain-sidebar">
    <div class="platform-domain-sidebar__top">
      <UiSectionHeader :title="domainTitle" :subtitle="`Application ${slug}`" dense />
      <v-btn
        v-if="smAndDown"
        class="platform-domain-sidebar__toggle"
        variant="text"
        size="small"
        :prepend-icon="isCollapsed ? 'mdi-chevron-down' : 'mdi-chevron-up'"
        @click="isCollapsed = !isCollapsed"
      >
        {{ isCollapsed ? 'Afficher' : 'Réduire' }}
      </v-btn>
    </div>

    <v-expand-transition>
      <div v-show="!isCollapsed" class="platform-domain-sidebar__content">
        <template v-if="domain === 'crm'">
          <v-list nav density="comfortable" class="bg-transparent pa-0">
            <v-list-item
              v-for="item in crmItems"
              :key="item.to"
              :title="item.label"
              :to="item.to"
              rounded="lg"
              :active="isRouteActive(item.to)"
            />
          </v-list>
        </template>

        <template v-else-if="domain === 'shop'">
          <v-list nav density="compact" class="bg-transparent pa-0">
            <v-list-group
              v-for="category in shopCategories"
              :key="category.slug"
              :value="category.slug"
            >
              <template #activator="{ props: activatorProps }">
                <v-list-item
                  v-bind="activatorProps"
                  :title="category.label"
                  :active="isRouteInSection(`/platform/${slug}/shop/${category.slug}`)"
                />
              </template>

              <v-list-item
                :to="`/platform/${slug}/shop/${category.slug}/products`"
                title="Produits"
                :active="isRouteActive(`/platform/${slug}/shop/${category.slug}/products`)"
              />
              <v-list-item
                v-for="product in category.products"
                :key="product"
                class="pl-6"
                :to="`/platform/${slug}/shop/${category.slug}/product/${product}`"
                :title="product"
                :active="isRouteActive(`/platform/${slug}/shop/${category.slug}/product/${product}`)"
              />
            </v-list-group>
          </v-list>
        </template>

        <template v-else-if="domain === 'recruit'">
          <v-card variant="text" class="pa-0">
            <div class="text-subtitle-2 mb-2">Filtres</div>
            <v-select
              v-model="recruitFilters.contracts"
              :items="contractOptions"
              label="Type de contrat"
              density="compact"
              hide-details
              multiple
              chips
            />
            <v-select
              v-model="recruitFilters.locations"
              :items="locationOptions"
              label="Localisation"
              class="mt-3"
              density="compact"
              hide-details
              multiple
              chips
            />
            <v-switch
              v-model="recruitFilters.remote"
              class="mt-2"
              color="primary"
              label="Remote"
              hide-details
              density="compact"
            />
            <v-select
              v-model="recruitFilters.seniority"
              :items="seniorityOptions"
              label="Séniorité"
              class="mt-2"
              density="compact"
              hide-details
              multiple
              chips
            />
          </v-card>
        </template>

        <template v-else>
          <v-list nav density="comfortable" class="bg-transparent pa-0">
            <v-list-item
              v-for="item in schoolItems"
              :key="item.to"
              :title="item.label"
              :to="item.to"
              rounded="lg"
              :active="isRouteActive(item.to)"
            />
          </v-list>
        </template>
      </div>
    </v-expand-transition>
  </div>
</template>

<style scoped>
.platform-domain-sidebar__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}

.platform-domain-sidebar__toggle {
  flex-shrink: 0;
}
</style>
