<script setup lang="ts">
import UiCard from '~/components/ui/UiCard.vue'
import UiSectionHeader from '~/components/ui/UiSectionHeader.vue'

definePageMeta({
  layout: 'admin',
  middleware: ['role'],
  requiredPermissions: ['admin.access'],
})

const { t } = useI18n()

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
  </div>
</template>
