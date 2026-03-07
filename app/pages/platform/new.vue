<script setup lang="ts">
import type { PluginRead } from '~/types/api/plugin'
import type { PlatformRead } from '~/types/api/platform'
import { usePlatformsApi } from '~/composables/api/usePlatformsApi'
import { usePluginsApi } from '~/composables/api/usePluginsApi'
import { useProfileApi } from '~/composables/api/useProfileApi'
import { useApplicationsStore } from '~/stores/applications'
import UiAside from '~/components/ui/layout/UiAside.vue'
import PlatformSplitLayout from "~/components/platform/PlatformSplitLayout.vue";
import UiStatChip from "~/components/ui/UiStatChip.vue";
import UiSectionHeader from "~/components/ui/UiSectionHeader.vue";

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
const loading = ref(true)
const creating = ref(false)
const errorMessage = ref('')

const availablePlatforms = ref<PlatformRead[]>([])
const availablePlugins = ref<PluginRead[]>([])
const selectedPlatformId = ref<string | null>(null)
const selectedPluginIds = ref<string[]>([])
const pluginConfigurations = reactive<Record<string, { cacheSeconds: number }>>({})

const form = reactive({
  title: '',
  description: '',
  photo: null as File | null,
  photoPreview: '',
  private: true,
  active: true,
  theme: 'light',
})

const canContinueToStep2 = computed(() => Boolean(form.title.trim()))
const canContinueToStep3 = computed(() => Boolean(selectedPlatformId.value))
const canCreate = computed(() => Boolean(canContinueToStep2.value && canContinueToStep3.value))

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

onMounted(() => {
  void loadWizardData()
})

const togglePlugin = (pluginId: string) => {
  if (selectedPluginIds.value.includes(pluginId)) {
    selectedPluginIds.value = selectedPluginIds.value.filter(id => id !== pluginId)
    delete pluginConfigurations[pluginId]
    return
  }

  selectedPluginIds.value = [...selectedPluginIds.value, pluginId]
  pluginConfigurations[pluginId] = {
    cacheSeconds: 120,
  }
}

const readFileAsDataUrl = (file: File) => new Promise<string>((resolve, reject) => {
  const reader = new FileReader()

  reader.onload = () => resolve(String(reader.result ?? ''))
  reader.onerror = () => reject(new Error('Failed to read file'))
  reader.readAsDataURL(file)
})

const onPhotoSelected = async (value: File | File[] | null) => {
  const file = Array.isArray(value) ? value[0] : value

  if (!file) {
    form.photo = null
    form.photoPreview = ''
    return
  }

  form.photo = file
  form.photoPreview = await readFileAsDataUrl(file)
}

const submit = async () => {
  if (!selectedPlatformId.value || !form.title.trim()) {
    return
  }

  creating.value = true
  errorMessage.value = ''

  try {
    const configurations = [
      {
        configurationKey: 'app.theme',
        configurationValue: {
          name: form.theme,
        },
      },
      {
        configurationKey: 'app.description',
        configurationValue: {
          text: form.description.trim(),
        },
      },
    ]

    const createdApplications = await profileApi.createApplication({
      platformId: selectedPlatformId.value,
      title: form.title.trim(),
      description: form.description.trim(),
      status: form.active ? 'active' : 'inactive',
      private: form.private,
      configurations,
      plugins: selectedPluginIds.value.map(pluginId => ({
        pluginId,
        configurations: [
          {
            configurationKey: 'plugin.cache.ttl',
            configurationValue: {
              seconds: pluginConfigurations[pluginId]?.cacheSeconds ?? 120,
            },
          },
        ],
      })),
    })

    const applicationId = Array.isArray(createdApplications)
      ? createdApplications[0]?.id
      : createdApplications?.id

    if (!applicationId) {
      throw new Error('Application ID missing in creation response')
    }

    if (form.photo) {
      await profileApi.uploadApplicationPhoto(applicationId, form.photo)
    }

    applicationsStore.items = []
    clearNuxtData('platform-applications')
    clearNuxtData('platform-applications-public')
    clearNuxtData('platform-applications-private')

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
  <PlatformSplitLayout>
    <template #sidebar>
      <h2 class="text-h6 mb-2">{{ t('platform.newPlatform.title') }}</h2>
      <p class="text-body-2 text-medium-emphasis mb-4">
        {{ t('platform.newPlatform.description') }}
      </p>

      <div class="platform-new__steps">
        <div class="platform-new__step" :class="{ 'platform-new__step--active': step === 1 }">
          <span>1</span>
          <small>{{ t('platform.wizard.steps.title') }}</small>
        </div>
        <div class="platform-new__step" :class="{ 'platform-new__step--active': step === 2 }">
          <span>2</span>
          <small>{{ t('platform.wizard.steps.platform') }}</small>
        </div>
        <div class="platform-new__step" :class="{ 'platform-new__step--active': step === 3 }">
          <span>3</span>
          <small>{{ t('platform.wizard.steps.plugins') }}</small>
        </div>
      </div>
    </template>

    <template>
      <div class="platform-new__layout">
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

        <v-card v-if="!loading" class="pa-5 bg-transparent">
          <template v-if="step === 1">
            <h2 class="text-h5 mb-4">{{ t('platform.wizard.titleStepTitle') }}</h2>

            <v-text-field v-model="form.title" :label="t('platform.wizard.fields.title')" density="comfortable" />
            <v-textarea
                v-model="form.description"
                :label="t('platform.wizard.fields.description')"
                rows="3"
                auto-grow
                class="mb-2"
            />
            <v-file-input
                :model-value="form.photo"
                :label="t('platform.wizard.fields.photo')"
                accept="image/*"
                prepend-icon="mdi-camera"
                show-size
                @update:model-value="onPhotoSelected"
            />
            <v-img
                v-if="form.photoPreview"
                :src="form.photoPreview"
                max-height="180"
                max-width="180"
                cover
                class="mb-4 rounded"
            />

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
                  :class="{ 'wizard-option--selected': selectedPluginIds.includes(plugin.id) }"
                  @click="togglePlugin(plugin.id)"
              >
                <img :src="plugin.photo || ''" :alt="plugin.name" class="wizard-option__photo">
                <div class="wizard-option__body">
                  <h3>{{ plugin.name }}</h3>
                  <p>{{ plugin.description }}</p>
                </div>
              </button>
            </div>

            <v-expansion-panels v-if="selectedPluginIds.length" class="mb-4" variant="accordion">
              <v-expansion-panel
                  v-for="plugin in availablePlugins.filter(item => selectedPluginIds.includes(item.id))"
                  :key="plugin.id"
              >
                <v-expansion-panel-title>
                  {{ plugin.name }} - {{ t('platform.wizard.fields.configuration') }}
                </v-expansion-panel-title>
                <v-expansion-panel-text>
                  <v-text-field
                      v-model.number="pluginConfigurations[plugin.id].cacheSeconds"
                      type="number"
                      min="1"
                      :label="t('platform.wizard.fields.cacheSeconds')"
                  />
                </v-expansion-panel-text>
              </v-expansion-panel>
            </v-expansion-panels>

            <div class="d-flex justify-space-between">
              <v-btn variant="outlined" @click="step = 2">{{ t('platform.wizard.prev') }}</v-btn>
              <v-btn color="primary" :disabled="!canCreate || creating" :loading="creating" @click="submit">
                {{ t('platform.wizard.create') }}
              </v-btn>
            </div>
          </template>
        </v-card>
      </div>
    </template>
  </PlatformSplitLayout>
</template>

<style scoped>

.platform-new__layout {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.platform-new__sidebar {
  min-width: 0;
}

.platform-new__steps {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.platform-new__step {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  opacity: 0.7;
}

.platform-new__step span {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: rgb(var(--v-theme-surface-variant));
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
}

.platform-new__step--active {
  opacity: 1;
  font-weight: 600;
}

.platform-new__content {
  min-width: 0;
}

.wizard-header {
  background: linear-gradient(90deg, #df1f7f, #ef3f8e);
  color: white;
  border-radius: 14px;
  display: flex;
  justify-content: space-around;
  padding: 1rem;
  margin-bottom: 1.5rem;
}

.wizard-step {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.4rem;
  opacity: 0.75;
}

.wizard-step span {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #304e79;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
}

.wizard-step--active {
  opacity: 1;
}

.wizard-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 1rem;
}

.wizard-option {
  border: 1px solid #c8cad8;
  border-radius: 12px;
  padding: 0.75rem;
  display: flex;
  gap: 0.75rem;
  text-align: left;
  background: white;
}

.wizard-option--selected {
  border-color: #df1f7f;
  box-shadow: 0 0 0 2px rgba(223, 31, 127, 0.2);
}

.wizard-option__photo {
  width: 52px;
  height: 52px;
  border-radius: 12px;
}

.wizard-option__body h3 {
  margin: 0;
  font-size: 1rem;
}

.wizard-option__body p {
  margin: 0.4rem 0 0;
  color: #5f6170;
  font-size: 0.9rem;
}

@media (max-width: 1200px) {
  .platform-new__layout {
    grid-template-columns: 1fr;
  }

  :deep(.ui-aside__card--sticky) {
    position: static;
  }
}
</style>
