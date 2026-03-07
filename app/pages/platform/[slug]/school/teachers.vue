<script setup lang="ts">
import PlatformSidebarNav from '~/components/platform/PlatformSidebarNav.vue'
import PlatformSplitLayout from '~/components/platform/PlatformSplitLayout.vue'
import PlatformHeroHeader from '~/components/platform/sections/PlatformHeroHeader.vue'
import type { NavItem } from '~/data/platform-demo'
import { getSchoolNav } from '~/data/platform-nav'

definePageMeta({ public: true, requiresAuth: false })
const route = useRoute()
const slug = computed(() => String(route.params.slug ?? ''))
const teachers = [
  { name: 'Emma Laurent', speciality: 'Data & Python', classes: 5, score: '4.9/5' },
  { name: 'Noah Martin', speciality: 'UX Research', classes: 3, score: '4.7/5' },
  { name: 'Lina Bernard', speciality: 'Product Strategy', classes: 4, score: '4.8/5' },
]
const navItems = computed(() => getSchoolNav(slug.value, false))
</script>

<template>
  <PlatformSplitLayout>
    <template #sidebar><PlatformSidebarNav title="School Teachers" :subtitle="`Application ${slug}`" :items="navItems" /></template>
    <section>
      <PlatformHeroHeader title="Teacher Hub" subtitle="Charge pédagogique, performance et satisfaction élèves" cta="Affecter classe" />
      <v-row>
        <v-col v-for="teacher in teachers" :key="teacher.name" cols="12" md="4">
          <v-card rounded="xl" variant="outlined">
            <v-card-text>
              <p class="font-weight-bold">{{ teacher.name }}</p>
              <p class="text-body-2 text-medium-emphasis">{{ teacher.speciality }}</p>
              <div class="d-flex justify-space-between mt-3">
                <v-chip size="small" variant="tonal" color="primary">{{ teacher.classes }} classes</v-chip>
                <v-chip size="small" variant="outlined">{{ teacher.score }}</v-chip>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </section>
  </PlatformSplitLayout>
</template>
