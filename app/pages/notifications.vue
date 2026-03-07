<script setup lang="ts">
import UiStateEmptyState from '~/components/ui/state/UiEmptyState.vue'
definePageMeta({
  public: false,
  requiresAuth: true,
})

const unreadNotifications = ref([
  {
    id: 1,
    title: 'Nouveau commentaire sur votre post',
    message: 'Marie a répondu à la discussion “Roadmap produit”.',
    time: 'Il y a 5 min',
    color: 'primary',
  },
  {
    id: 2,
    title: 'Demande d’accès approuvée',
    message: 'Votre accès au workspace “Analytics” est actif.',
    time: 'Il y a 25 min',
    color: 'success',
  },
])

const readNotifications = ref([
  {
    id: 3,
    title: 'Rapport hebdomadaire disponible',
    message: 'Le rapport KPI de la semaine est prêt.',
    time: 'Hier',
    color: 'info',
  },
  {
    id: 4,
    title: 'Maintenance planifiée',
    message: 'Une maintenance est prévue samedi à 23h.',
    time: 'Il y a 2 jours',
    color: 'warning',
  },
])

const markAsRead = (id: number) => {
  const index = unreadNotifications.value.findIndex(item => item.id === id)

  if (index === -1) {
    return
  }

  const [notification] = unreadNotifications.value.splice(index, 1)
  readNotifications.value.unshift(notification)
}

const markAllAsRead = () => {
  if (!unreadNotifications.value.length) {
    return
  }

  readNotifications.value = [...unreadNotifications.value, ...readNotifications.value]
  unreadNotifications.value = []
}
</script>

<template>
  <UiPageSection max-width="1100">
    <v-card class="pa-6 pa-md-8 mb-6 rounded-xl elevation-2">
      <div class="d-flex align-start justify-space-between ga-4 flex-wrap">
        <div>
          <p class="text-overline text-primary mb-2">Centre de notifications</p>
          <h1 class="text-h4 font-weight-bold mb-2 d-flex align-center ga-2">
            <v-icon icon="mdi-bell-ring-outline" color="primary" />
            Notifications
          </h1>
          <p class="text-body-1 text-medium-emphasis mb-0">
            Suivez les activités importantes et gardez votre équipe synchronisée.
          </p>
        </div>

        <v-btn
          color="primary"
          variant="outlined"
          prepend-icon="mdi-check-all"
          :disabled="!unreadNotifications.length"
          @click="markAllAsRead"
        >
          Tout marquer comme lu
        </v-btn>
      </div>
    </v-card>

    <v-row>
      <v-col cols="12" md="6">
        <v-card class="pa-5 rounded-xl elevation-1 h-100">
          <div class="d-flex align-center justify-space-between mb-4">
            <h2 class="text-subtitle-1 font-weight-bold mb-0">Non lues</h2>
            <v-badge :content="unreadNotifications.length" color="primary" inline />
          </div>

          <template v-if="unreadNotifications.length">
            <v-list class="bg-transparent pa-0" lines="two">
              <v-list-item
                v-for="item in unreadNotifications"
                :key="item.id"
                class="notifications-page__item px-0"
              >
                <template #prepend>
                  <v-avatar :color="item.color" variant="tonal" size="34">
                    <v-icon icon="mdi-bell" size="18" />
                  </v-avatar>
                </template>

                <v-list-item-title class="font-weight-medium">{{ item.title }}</v-list-item-title>
                <v-list-item-subtitle>{{ item.message }}</v-list-item-subtitle>

                <template #append>
                  <div class="d-flex flex-column align-end ga-2">
                    <span class="text-caption text-medium-emphasis">{{ item.time }}</span>
                    <v-btn
                      size="small"
                      variant="text"
                      color="primary"
                      prepend-icon="mdi-check"
                      @click="markAsRead(item.id)"
                    >
                      Marquer lu
                    </v-btn>
                  </div>
                </template>
              </v-list-item>
            </v-list>
          </template>

          <UiStateEmptyState
            v-else
            title="Aucune notification non lue"
            description="Vous êtes à jour. Revenez plus tard pour voir les nouveautés."
            icon="mdi-bell-check-outline"
          >
            <template #action>
              <v-btn variant="outlined" prepend-icon="mdi-cog-outline">Gérer les préférences</v-btn>
            </template>
          </UiStateEmptyState>
        </v-card>
      </v-col>

      <v-col cols="12" md="6">
        <v-card class="pa-5 rounded-xl elevation-1 h-100">
          <div class="d-flex align-center justify-space-between mb-4">
            <h2 class="text-subtitle-1 font-weight-bold mb-0">Déjà lues</h2>
            <v-chip size="small" variant="tonal">{{ readNotifications.length }}</v-chip>
          </div>

          <v-list class="bg-transparent pa-0" lines="two">
            <v-list-item
              v-for="item in readNotifications"
              :key="item.id"
              class="notifications-page__item px-0"
            >
              <template #prepend>
                <v-avatar :color="item.color" variant="tonal" size="34">
                  <v-icon icon="mdi-bell-outline" size="18" />
                </v-avatar>
              </template>

              <v-list-item-title class="font-weight-medium">{{ item.title }}</v-list-item-title>
              <v-list-item-subtitle>{{ item.message }}</v-list-item-subtitle>

              <template #append>
                <span class="text-caption text-medium-emphasis">{{ item.time }}</span>
              </template>
            </v-list-item>
          </v-list>
        </v-card>
      </v-col>
    </v-row>
  </UiPageSection>
</template>

<style scoped>
.notifications-page__item + .notifications-page__item {
  border-top: 1px solid rgba(var(--v-theme-on-surface), 0.08);
}
</style>
