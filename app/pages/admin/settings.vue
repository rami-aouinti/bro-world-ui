<script setup lang="ts">
import UiCard from '~/components/ui/UiCard.vue'
import UiSectionHeader from '~/components/ui/UiSectionHeader.vue'

definePageMeta({
  layout: 'admin',
  middleware: ['role'],
  requiredPermissions: ['admin.access'],
})

const { t } = useI18n()
const isPageLoading = ref(true)

onMounted(() => {
  isPageLoading.value = false
})

const form = reactive({
  siteName: 'Bro World',
  description: 'Plateforme communautaire et outils d\'administration.',
})

const saved = ref(false)

const saveSettings = () => {
  saved.value = true
}
</script>

<template>
  <div class="admin-page-content">
    <template v-if="isPageLoading">
      <v-skeleton-loader type="heading, text" class="mb-4" />
      <v-row>
        <v-col v-for="index in 4" :key="`admin-skeleton-${index}`" cols="12" md="6">
          <v-card rounded="lg" class="pa-4">
            <v-skeleton-loader type="list-item-avatar-two-line, button" />
          </v-card>
        </v-col>
      </v-row>
    </template>

    <template v-else>
      <UiSectionHeader
        :title="t('admin.settings.title')"
        :subtitle="t('admin.settings.description')"
      />

    <UiCard rounded="lg" compact>
      <v-form @submit.prevent="saveSettings">
        <v-row>
          <v-col cols="12">
            <v-text-field
              v-model="form.siteName"
              :label="t('admin.settings.form.siteName')"
              variant="outlined"
            />
          </v-col>

          <v-col cols="12">
            <v-textarea
              v-model="form.description"
              :label="t('admin.settings.form.description')"
              variant="outlined"
              rows="4"
            />
          </v-col>

          <v-col cols="12" class="d-flex align-center ga-3">
            <v-btn type="submit" color="primary" prepend-icon="mdi-content-save-outline">
              {{ t('admin.common.save') }}
            </v-btn>

            <span v-if="saved" class="text-success text-body-2">
              {{ t('admin.settings.form.saved') }}
            </span>
          </v-col>
        </v-row>
      </v-form>
    </UiCard>
      </template>
  </div>
</template>
