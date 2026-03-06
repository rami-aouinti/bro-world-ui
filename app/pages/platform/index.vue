<script setup lang="ts">
definePageMeta({
  public: true,
  requiresAuth: false,
})

const { t } = useI18n()
const router = useRouter()
const { isAuthenticated, initSession } = useAuth()
const applicationsStore = useApplicationsStore()

await initSession()
await useAsyncData('platform-applications-public', () => applicationsStore.fetchPublic())

const goToNewPlatform = () => {
  if (isAuthenticated.value) {
    router.push('/platform/new')
    return
  }

  router.push('/login')
}

const getInitials = (name: string) => {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  return parts.slice(0, 2).map(part => part[0]?.toUpperCase() ?? '').join('') || 'AP'
}
</script>

<template>
  <section class="platform-page">
    <div class="platform-page__grid">
      <article class="platform-page__card platform-page__card--new" role="button" tabindex="0" @click="goToNewPlatform">
        <div class="platform-page__add-icon">+</div>
        <h2 class="platform-page__new-title">
          {{ isAuthenticated ? t('platform.newPlatform.title') : t('platform.newPlatform.connectTitle') }}
        </h2>
        <p class="platform-page__new-description">
          {{ isAuthenticated ? t('platform.newPlatform.description') : t('platform.newPlatform.connectDescription') }}
        </p>
      </article>

      <article
        v-for="card in applicationsStore.items"
        :key="card.id"
        class="platform-page__card"
      >
        <v-btn
          class="platform-page__card-dot"
          icon="mdi-dots-vertical"
          variant="text"
          density="compact"
        />

        <div class="platform-page__card-top">
          <div class="platform-page__card-brand">
            <div class="platform-page__logo">{{ getInitials(card.platformName) }}</div>
            <div>
              <h2 class="platform-page__card-title">{{ card.title }}</h2>
              <v-chip
                :color="card.status === 'active' ? 'success' : undefined"
                variant="tonal"
                size="small"
                class="text-capitalize"
              >
                {{ card.status === 'active' ? t('platform.status.active') : t('platform.status.inactive') }}
              </v-chip>
            </div>
          </div>
        </div>

        <p class="platform-page__card-description">{{ card.platformName }}</p>
      </article>
    </div>

    <button type="button" class="platform-page__assistant" :aria-label="t('platform.assistant')">
      <v-icon icon="mdi-message-outline" size="22" />
      <v-icon icon="mdi-format-list-bulleted" size="22" />
    </button>
  </section>
</template>

<style scoped>
.platform-page {
  padding: 1.25rem 0.75rem 2rem;
}

.platform-page__grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.75rem 1.5rem;
}

.platform-page__card {
  position: relative;
  background: #ededee;
  border-radius: 12px;
  border: 1px solid #d2d2d5;
  box-shadow: 0 3px 10px rgba(15, 23, 42, 0.12);
  padding: 1.7rem;
  min-height: 250px;
  display: flex;
  flex-direction: column;
}

.platform-page__card-dot {
  position: absolute;
  right: 0.7rem;
  top: 0.7rem;
}

.platform-page__card--new {
  border: 3px dashed #2f3033;
  align-items: center;
  justify-content: center;
  text-align: center;
  cursor: pointer;
}

.platform-page__add-icon {
  width: 70px;
  height: 70px;
  border-radius: 999px;
  border: 6px solid #e82f7d;
  color: #e82f7d;
  display: grid;
  place-items: center;
  font-size: 3.2rem;
  line-height: 1;
  margin-bottom: 1.3rem;
}

.platform-page__new-title,
.platform-page__card-title {
  font-size: 1.6rem;
  line-height: 1.2;
  font-weight: 700;
  color: #25262c;
}

.platform-page__new-title {
  margin-bottom: 1rem;
}

.platform-page__new-description,
.platform-page__card-description {
  color: #55565c;
  font-size: 1.08rem;
  line-height: 1.45;
}

.platform-page__card-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
}

.platform-page__card-brand {
  display: flex;
  gap: 1rem;
}

.platform-page__logo {
  width: 76px;
  height: 76px;
  border-radius: 12px;
  color: white;
  background: #5955e0;
  font-size: 2rem;
  display: grid;
  place-items: center;
  font-weight: 600;
}

.platform-page__card-description {
  margin-top: 1.2rem;
}

.platform-page__assistant {
  position: fixed;
  right: 12px;
  top: 58%;
  transform: translateY(-50%);
  width: 48px;
  height: 90px;
  border-radius: 24px;
  border: 2px solid #0f1014;
  background: #1e2025;
  color: #fff;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.45rem;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
}
</style>
