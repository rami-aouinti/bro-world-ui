<script setup lang="ts">
import UiAvatar from '~/components/ui/UiAvatar.vue'

interface Props {
  firstName?: string
  lastName?: string
  username?: string
  photo?: string
  fallbackLabel?: string
  profilePath?: string
}

const props = withDefaults(defineProps<Props>(), {
  firstName: '',
  lastName: '',
  username: '',
  photo: '',
  fallbackLabel: '—',
  profilePath: undefined,
})

const fullName = computed(() => {
  const name = `${props.firstName} ${props.lastName}`.trim()
  return name || props.username || props.fallbackLabel
})

const profilePath = computed(() => {
  if (props.profilePath) {
    return props.profilePath
  }

  if (props.username) {
    return `/user/${props.username}/profile`
  }

  return undefined
})

const canNavigate = computed(() => Boolean(profilePath.value))
</script>

<template>
  <component
    :is="canNavigate ? 'NuxtLink' : 'div'"
    :to="profilePath"
    class="user-identity"
    :class="{ 'user-identity--clickable': canNavigate }"
  >
    <UiAvatar :src="photo || undefined" :name="fullName" size="xs" />
    <span class="user-identity__name">{{ fullName }}</span>
  </component>
</template>

<style scoped>
.user-identity {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  color: #2e2f37;
  text-decoration: none;
}

.user-identity--clickable {
  transition: transform 0.2s ease, color 0.2s ease;
}

.user-identity--clickable:hover {
  color: #5054d8;
  transform: translateX(2px);
}

.user-identity__name {
  font-size: 0.95rem;
  font-weight: 600;
}
</style>
