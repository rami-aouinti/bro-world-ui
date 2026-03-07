<script setup lang="ts">
import UiListCard from '~/components/ui/UiListCard.vue'
import UiPageShell from '~/components/ui/page/UiPageShell.vue'
import UiStateEmptyState from '~/components/ui/state/UiEmptyState.vue'
import UiStatChip from '~/components/ui/UiStatChip.vue'

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
  <UiPageShell
    title="Notifications"
    eyebrow="Centre de notifications"
    icon="mdi-bell-ring-outline"
    subtitle="Suivez les activités importantes et gardez votre équipe synchronisée."
    max-width="1100"
  >
    <template #actions>
      <v-btn
        color="primary"
        variant="outlined"
        prepend-icon="mdi-check-all"
        class="w-100 w-md-auto"
        :disabled="!unreadNotifications.length"
        @click="markAllAsRead"
      >
        Tout marquer comme lu
      </v-btn>
    </template>

    <v-row>
      <v-col cols="12" md="6">
        <UiListCard>
          <div class="d-flex align-center justify-space-between mb-4">
            <h2 class="text-subtitle-1 font-weight-bold mb-0">Non lues</h2>
            <UiStatChip :value="unreadNotifications.length" color="primary" />
          </div>

          <template v-if="unreadNotifications.length">
            <v-list class="bg-transparent pa-0" lines="two">
              <v-list-item
                v-for="item in unreadNotifications"
                :key="item.id"
                class="notifications-page__item px-0 rounded-lg"
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
        </UiListCard>
      </v-col>

      <v-col cols="12" md="6">
        <UiListCard>
          <div class="d-flex align-center justify-space-between mb-4">
            <h2 class="text-subtitle-1 font-weight-bold mb-0">Déjà lues</h2>
            <UiStatChip :value="readNotifications.length" color="info" />
          </div>

          <v-list class="bg-transparent pa-0" lines="two">
            <v-list-item
              v-for="item in readNotifications"
              :key="item.id"
              class="notifications-page__item px-0 rounded-lg"
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
        </UiListCard>
      </v-col>
    </v-row>
  </UiPageShell>
</template>

<style scoped>
.notifications-page__item {
  transition: background-color 0.2s ease;
}

.notifications-page__item + .notifications-page__item {
  border-top: 1px solid rgba(var(--v-theme-on-surface), 0.08);
}

.notifications-page__item:hover,
.notifications-page__item:focus-within {
  background-color: rgba(var(--v-theme-primary), 0.06);
}
</style>
