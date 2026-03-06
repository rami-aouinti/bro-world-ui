<script setup lang="ts">
import type { PluginRead } from '~/types/api/plugin'
import type { PlatformRead } from '~/types/api/platform'
import { usePlatformsApi } from '~/composables/api/usePlatformsApi'
import { usePluginsApi } from '~/composables/api/usePluginsApi'
import { useProfileApi } from '~/composables/api/useProfileApi'
import { useApplicationsStore } from '~/stores/applications'

definePageMeta({
  public: false,
  requiresAuth: true,
})

const { t } = useI18n({ useScope: 'global' })
const router = useRouter()
const platformsApi = usePlatformsApi()
const pluginsApi = usePluginsApi()
const profileApi = useProfileApi()
const applicationsStore = useApplicationsStore()

const step = ref(1)
const loading = ref(false)
const creating = ref(false)
const errorMessage = ref('')

const availablePlatforms = ref<PlatformRead[]>([])
const availablePlugins = ref<PluginRead[]>([])
const selectedPlatformId = ref<string | null>(null)
const selectedPluginId = ref<string | null>(null)
const pluginCacheSeconds = ref<number>(120)

const form = reactive({
  title: '',
  private: true,
  active: true,
  theme: 'light',
})

const canContinueToStep2 = computed(() => Boolean(form.title.trim()))
const canContinueToStep3 = computed(() => Boolean(selectedPlatformId.value))
const canCreate = computed(() => Boolean(canContinueToStep2.value && canContinueToStep3.value && selectedPluginId.value))

const loadWizardData = async () => {
  loading.value = true
  errorMessage.value = ''

  try {
    const [platforms, plugins] = await Promise.all([
      platformsApi.listPublic(),
      pluginsApi.listPublic(),
    ])

    availablePlatforms.value = platforms
    availablePlugins.value = plugins
  }
  catch {
    errorMessage.value = t('platform.wizard.errors.load')
  }
  finally {
    loading.value = false
  }
}

await loadWizardData()

const submit = async () => {
  if (!selectedPlatformId.value || !selectedPluginId.value || !form.title.trim()) {
    return
  }

  creating.value = true
  errorMessage.value = ''

  try {
    await profileApi.createApplication({
      platformId: selectedPlatformId.value,
      title: form.title.trim(),
      status: form.active ? 'active' : 'inactive',
      private: form.private,
      configurations: [
        {
          configurationKey: 'app.theme',
          configurationValue: {
            name: form.theme,
          },
        },
      ],
      plugins: [
        {
          pluginId: selectedPluginId.value,
          configurations: [
            {
              configurationKey: 'plugin.cache.ttl',
              configurationValue: {
                seconds: pluginCacheSeconds.value,
              },
            },
          ],
        },
      ],
    })

    applicationsStore.items = []
    clearNuxtData('platform-applications')

    await router.push('/platform')
  }
  catch {
    errorMessage.value = t('platform.wizard.errors.create')
  }
  finally {
    creating.value = false
  }
}
</script>

<template>
  <section class="platform-new">
    <div class="wizard-header">
      <div class="wizard-step" :class="{ 'wizard-step--active': step === 1 }">
        <span>1</span>
        <small>{{ t('platform.wizard.steps.title') }}</small>
      </div>
      <div class="wizard-step" :class="{ 'wizard-step--active': step === 2 }">
        <span>2</span>
        <small>{{ t('platform.wizard.steps.platform') }}</small>
      </div>
      <div class="wizard-step" :class="{ 'wizard-step--active': step === 3 }">
        <span>3</span>
        <small>{{ t('platform.wizard.steps.plugins') }}</small>
      </div>
    </div>

    <v-alert v-if="errorMessage" type="error" variant="tonal" class="mb-4">{{ errorMessage }}</v-alert>

    <v-card v-if="!loading" class="pa-5">
      <template v-if="step === 1">
        <h2 class="text-h5 mb-4">{{ t('platform.wizard.titleStepTitle') }}</h2>

        <v-text-field v-model="form.title" :label="t('platform.wizard.fields.title')" density="comfortable" />

        <div class="d-flex justify-end">
          <v-btn :disabled="!canContinueToStep2" color="primary" @click="step = 2">{{ t('platform.wizard.next') }}</v-btn>
        </div>
      </template>

      <template v-else-if="step === 2">
        <h2 class="text-h5 mb-4">{{ t('platform.wizard.platformTitle') }}</h2>
        <div class="wizard-grid mb-4">
          <button
            v-for="platform in availablePlatforms"
            :key="platform.id"
            type="button"
            class="wizard-option"
            :class="{ 'wizard-option--selected': selectedPlatformId === platform.id }"
            @click="selectedPlatformId = platform.id"
          >
            <img :src="platform.photo || ''" :alt="platform.name" class="wizard-option__photo">
            <div class="wizard-option__body">
              <h3>{{ platform.name }}</h3>
              <p>{{ platform.description }}</p>
            </div>
          </button>
        </div>
        <v-checkbox v-model="form.private" :label="t('platform.wizard.fields.private')" />
        <v-checkbox v-model="form.active" :label="t('platform.wizard.fields.active')" />

        <v-select
          v-model="form.theme"
          :label="t('platform.wizard.fields.theme')"
          :items="[
            { title: 'Light', value: 'light' },
            { title: 'Dark', value: 'dark' },
          ]"
          item-title="title"
          item-value="value"
        />

        <div class="d-flex justify-space-between">
          <v-btn variant="outlined" @click="step = 1">{{ t('platform.wizard.prev') }}</v-btn>
          <v-btn :disabled="!canContinueToStep3" color="primary" @click="step = 3">{{ t('platform.wizard.next') }}</v-btn>
        </div>
      </template>

      <template v-else>
        <h2 class="text-h5 mb-4">{{ t('platform.wizard.pluginTitle') }}</h2>
        <div class="wizard-grid mb-4">
          <button
            v-for="plugin in availablePlugins"
            :key="plugin.id"
            type="button"
            class="wizard-option"
            :class="{ 'wizard-option--selected': selectedPluginId === plugin.id }"
            @click="selectedPluginId = plugin.id"
          >
            <img :src="plugin.photo || ''" :alt="plugin.name" class="wizard-option__photo">
            <div class="wizard-option__body">
              <h3>{{ plugin.name }}</h3>
              <p>{{ plugin.description }}</p>
            </div>
          </button>
        </div>

        <v-text-field
          v-if="selectedPluginId"
          v-model.number="pluginCacheSeconds"
          type="number"
          min="1"
          :label="t('platform.wizard.fields.cacheSeconds')"
        />

        <div class="d-flex justify-space-between">
          <v-btn variant="outlined" @click="step = 2">{{ t('platform.wizard.prev') }}</v-btn>
          <v-btn color="primary" :disabled="!canCreate || creating" :loading="creating" @click="submit">
            {{ t('platform.wizard.create') }}
          </v-btn>
        </div>
      </template>
    </v-card>
  </section>
</template>

<style scoped>
.platform-new { margin: 0 auto; padding: 1.5rem; }
.wizard-header { background: linear-gradient(90deg, #df1f7f, #ef3f8e); color: white; border-radius: 14px; display: flex; justify-content: space-around; padding: 1rem; margin-bottom: 1.5rem; }
.wizard-step { display: flex; flex-direction: column; align-items: center; gap: 0.4rem; opacity: 0.75; }
.wizard-step span { width: 32px; height: 32px; border-radius: 50%; background: #304e79; display: inline-flex; align-items: center; justify-content: center; font-weight: 700; }
.wizard-step--active { opacity: 1; }
.wizard-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 1rem; }
.wizard-option { border: 1px solid #c8cad8; border-radius: 12px; padding: 0.75rem; display: flex; gap: 0.75rem; text-align: left; background: white; }
.wizard-option--selected { border-color: #df1f7f; box-shadow: 0 0 0 2px rgba(223, 31, 127, 0.2); }
.wizard-option__photo { width: 52px; height: 52px; border-radius: 12px; }
.wizard-option__body h3 { margin: 0; font-size: 1rem; }
.wizard-option__body p { margin: 0.4rem 0 0; color: #5f6170; font-size: 0.9rem; }
</style>
