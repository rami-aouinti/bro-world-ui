<script setup lang="ts">
import { computed, ref } from 'vue'
import UiAvatar from '~/components/ui/UiAvatar.vue'

const props = defineProps<{
  canAccessAdmin: boolean
  canLogout: boolean
}>()

const emit = defineEmits<{
  logout: []
}>()

const { t } = useI18n({ useScope: 'global' })
const { isAuthenticated } = useAuth()
const authSession = useAuthSessionStore()

const isProfileMenuOpen = ref(false)

const profileName = computed(() => {
  const profile = authSession.profile
  if (!profile) {
    return ''
  }

  return `${profile.firstName} ${profile.lastName}`.trim() || profile.username
})

const profilePhoto = computed(() => authSession.profile?.photo || authSession.userSnapshot?.photo || undefined)
</script>

<template>
  <v-menu location="bottom end" v-model="isProfileMenuOpen">
    <template #activator="{ props: menuProps }">
      <v-btn
        v-bind="menuProps"
        variant="text"
        class="app-bar-profile-menu__trigger"
        min-width="0"
        :aria-label="t('app.navigation.profile')"
      >
        <UiAvatar :src="profilePhoto" size="sm" :name="profileName" status="online" />
      </v-btn>
    </template>

    <v-list class="py-1 app-bar__menu" min-width="220">
      <template v-if="isAuthenticated">
        <v-list-item to="/profile" :title="t('app.navigation.profile')" prepend-icon="mdi-account-outline" rounded="lg" class="mx-2 my-1" />
        <v-list-item to="/settings" :title="t('app.navigation.settings')" prepend-icon="mdi-cog-outline" rounded="lg" class="mx-2 my-1" />
        <v-list-item to="/about" :title="t('app.navigation.about')" prepend-icon="mdi-information-outline" rounded="lg" class="mx-2 my-1" />
        <v-list-item to="/contact" :title="t('app.navigation.contact')" prepend-icon="mdi-email-outline" rounded="lg" class="mx-2 my-1" />
        <v-list-item to="/faq" :title="t('app.navigation.faq')" prepend-icon="mdi-frequently-asked-questions" rounded="lg" class="mx-2 my-1" />
        <v-list-item
          v-if="props.canAccessAdmin"
          to="/admin"
          :title="t('app.navigation.admin')"
          prepend-icon="mdi-shield-account-outline"
          rounded="lg"
          class="mx-2 my-1"
        />
        <v-list-item
          v-if="props.canLogout"
          :title="t('profile.logout')"
          prepend-icon="mdi-logout"
          rounded="lg"
          class="mx-2 my-1"
          @click="emit('logout')"
        />
      </template>
      <template v-else>
        <v-list-item to="/login" :title="t('app.navigation.login')" prepend-icon="mdi-login" rounded="lg" class="mx-2 my-1" />
        <v-list-item to="/register" :title="t('app.navigation.register')" prepend-icon="mdi-account-plus-outline" rounded="lg" class="mx-2 my-1" />
        <v-list-item to="/about" :title="t('app.navigation.about')" prepend-icon="mdi-information-outline" rounded="lg" class="mx-2 my-1" />
        <v-list-item to="/contact" :title="t('app.navigation.contact')" prepend-icon="mdi-email-outline" rounded="lg" class="mx-2 my-1" />
        <v-list-item to="/faq" :title="t('app.navigation.faq')" prepend-icon="mdi-frequently-asked-questions" rounded="lg" class="mx-2 my-1" />
      </template>
    </v-list>
  </v-menu>
</template>

<style scoped>
.app-bar-profile-menu__trigger {
  width: 40px;
  height: 40px;
  padding: 0;
  border-radius: 999px;
}
</style>
