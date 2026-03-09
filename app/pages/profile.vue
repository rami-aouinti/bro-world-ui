<script setup lang="ts">
import PlatformSplitLayout from "~/components/platform/PlatformSplitLayout.vue";

definePageMeta({
  public: true,
  requiresAuth: false,
})

import kalVisualAvatar from '~/assets/img/kal-visuals-square.jpg'
import marieAvatar from '~/assets/img/marie.jpg'
import ivanaAvatar from '~/assets/img/ivana-square.jpg'
import team4Avatar from '~/assets/img/team-4.jpg'
import homeDecor1 from '~/assets/img/home-decor-1.jpg'
import homeDecor2 from '~/assets/img/home-decor-2.jpg'
import homeDecor3 from '~/assets/img/home-decor-3.jpg'
import homeDecor4 from '~/assets/img/home-decor-4.jpg'

const accountSettings = [
  { text: 'Email me when someone follows me', switchState: true },
  { text: 'Email me when someone answers on...', switchState: false },
  { text: 'Email me when someone mentions me...', switchState: true },
]

const applicationSettings = [
  { text: 'New launches and projects', switchState: false },
  { text: 'Monthly product updates', switchState: true },
  { text: 'Subscribe to newsletter', switchState: false },
]

const conversations = [
  { avatar: kalVisualAvatar, user: 'Sophie B.', message: 'Hi! I need more information..' },
  { avatar: marieAvatar, user: 'Anne Marie', message: 'Awesome work, can you..' },
  { avatar: ivanaAvatar, user: 'Ivanna', message: 'About files I can..' },
  { avatar: team4Avatar, user: 'Peterson', message: 'Have a great afternoon..' },
]

const cards = [
  {
    image: homeDecor1,
    title: 'Project #2',
    style: 'Modern',
    description: 'As Uber works through a huge amount of internal management turmoil.',
  },
  {
    image: homeDecor2,
    title: 'Project #1',
    style: 'Scandinavian',
    description: 'Music is something that every person has his or her own specific opinion about.',
  },
  {
    image: homeDecor3,
    title: 'Project #3',
    style: 'Minimalist',
    description: 'Different people have different taste, and various types of music.',
  },
  {
    image: homeDecor4,
    title: 'Project #4',
    style: 'Gothic',
    description: 'Why would anyone pick blue over pink? Pink is obviously a better color.',
  },
]

const { initSession } = useAuth()
const authSession = useAuthSessionStore()

await initSession()

const profile = computed(() => authSession.profile)
const fullName = computed(() => {
  if (!profile.value) return 'Guest User'
  return `${profile.value.firstName} ${profile.value.lastName}`.trim()
})
const phone = computed(() => profile.value?.timezone || '—')
const email = computed(() => profile.value?.email || '—')
const locationLabel = computed(() => profile.value?.locale || profile.value?.language || '—')
const profileDescription = computed(() => {
  if (!profile.value) return 'Connectez-vous pour afficher les informations de profil détaillées.'
  return `Profil de ${fullName.value} (@${profile.value.username}).`
})
</script>

<template>
  <PlatformSplitLayout>
    <template #sidebar>
      <h6 class="mb-4 text-h6 font-weight-bold">Profile Information</h6>
      <p class="text-body-1 mb-4 text-medium-emphasis">
        {{ profileDescription }}
      </p>
      <v-divider class="mb-4" />
      <v-list class="pa-0 bg-transparent">
        <v-list-item class="px-0"><strong>Full Name:</strong>&nbsp; {{ fullName }}</v-list-item>
        <v-list-item class="px-0"><strong>Timezone:</strong>&nbsp; {{ phone }}</v-list-item>
        <v-list-item class="px-0"><strong>Email:</strong>&nbsp; {{ email }}</v-list-item>
        <v-list-item class="px-0"><strong>Location:</strong>&nbsp; {{ locationLabel }}</v-list-item>
      </v-list>
    </template>
    <section>
      <v-row>
        <v-col cols="12" md="6">
          <v-card class="h-100 pa-5" elevation="2" rounded="xl">
            <h6 class="mb-4 text-h6 font-weight-bold">Platform Settings</h6>

            <h6 class="text-uppercase text-body-2 font-weight-bold mb-3 text-medium-emphasis">Account</h6>
            <v-list class="pa-0 mb-4 bg-transparent">
              <v-list-item v-for="setting in accountSettings" :key="setting.text" :ripple="false" class="px-0 py-1">
                <template #append>
                  <v-switch v-model="setting.switchState" hide-details inset color="primary" />
                </template>
                <v-list-item-title class="text-body-1">{{ setting.text }}</v-list-item-title>
              </v-list-item>
            </v-list>

            <h6 class="text-uppercase text-body-2 font-weight-bold mb-3 text-medium-emphasis">Application</h6>
            <v-list class="pa-0 bg-transparent">
              <v-list-item
                  v-for="setting in applicationSettings"
                  :key="setting.text"
                  :ripple="false"
                  class="px-0 py-1"
              >
                <template #append>
                  <v-switch v-model="setting.switchState" hide-details inset color="primary" />
                </template>
                <v-list-item-title class="text-body-1">{{ setting.text }}</v-list-item-title>
              </v-list-item>
            </v-list>
          </v-card>
        </v-col>

        <v-col cols="12" md="6">
          <v-card class="h-100 pa-5" elevation="2" rounded="xl">
            <h6 class="mb-4 text-h6 font-weight-bold">Conversations</h6>
            <v-list class="pa-0 bg-transparent">
              <v-list-item v-for="conversation in conversations" :key="conversation.user" class="px-0 mb-2">
                <template #prepend>
                  <v-avatar size="44" class="me-3">
                    <v-img :src="conversation.avatar" alt="avatar"/>
                  </v-avatar>
                </template>
                <v-list-item-title class="font-weight-bold">{{ conversation.user }}</v-list-item-title>
                <v-list-item-subtitle>{{ conversation.message }}</v-list-item-subtitle>
                <template #append>
                  <v-btn variant="text" color="primary" class="font-weight-bold">Reply</v-btn>
                </template>
              </v-list-item>
            </v-list>
          </v-card>
        </v-col>

        <v-col cols="12">
          <v-card class="pa-5 mt-2" elevation="2" rounded="xl">
            <h6 class="text-h6 mb-1 font-weight-bold">Projects</h6>
            <p class="text-body-2 text-medium-emphasis mb-4">Architects design houses</p>
            <v-row>
              <v-col v-for="card in cards" :key="card.title" cols="12" sm="6" xl="3">
                <v-card variant="text" class="h-100">
                  <v-img :src="card.image" height="160" cover class="rounded-lg mb-3" />
                  <p class="text-body-2 mb-1">{{ card.title }}</p>
                  <h5 class="text-h5 mb-2 font-weight-bold">{{ card.style }}</h5>
                  <p class="text-body-2 text-medium-emphasis mb-3">{{ card.description }}</p>
                  <v-btn color="primary" variant="outlined" class="font-weight-bold">View Project</v-btn>
                </v-card>
              </v-col>
            </v-row>
          </v-card>
        </v-col>
      </v-row>
    </section>
  </PlatformSplitLayout>
</template>
