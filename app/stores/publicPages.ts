import { defineStore } from 'pinia'
import { usePagePublicApi } from '~/composables/api/usePageApi'
import type { AboutPagePayload, ContactPagePayload, FaqPagePayload, HomePagePayload } from '~/types/api/page'

export const usePublicPagesStore = defineStore('public-pages', () => {
  const api = usePagePublicApi()
  const homeByLanguage = ref<Partial<Record<'en' | 'fr', HomePagePayload>>>({})
  const aboutByLanguage = ref<Partial<Record<'en' | 'fr', AboutPagePayload>>>({})
  const contactByLanguage = ref<Partial<Record<'en' | 'fr', ContactPagePayload>>>({})
  const faqByLanguage = ref<Partial<Record<'en' | 'fr', FaqPagePayload>>>({})

  const toLanguageCode = (locale: string): 'en' | 'fr' => locale.toLowerCase().startsWith('fr') ? 'fr' : 'en'

  const loadHome = async (locale: string) => {
    const code = toLanguageCode(locale)
    if (!homeByLanguage.value[code]) {
      homeByLanguage.value[code] = await api.getHome(code)
    }
    return homeByLanguage.value[code]!
  }

  const loadAbout = async (locale: string) => {
    const code = toLanguageCode(locale)
    if (!aboutByLanguage.value[code]) {
      aboutByLanguage.value[code] = await api.getAbout(code)
    }
    return aboutByLanguage.value[code]!
  }

  const loadContact = async (locale: string) => {
    const code = toLanguageCode(locale)
    if (!contactByLanguage.value[code]) {
      contactByLanguage.value[code] = await api.getContact(code)
    }
    return contactByLanguage.value[code]!
  }

  const loadFaq = async (locale: string) => {
    const code = toLanguageCode(locale)
    if (!faqByLanguage.value[code]) {
      faqByLanguage.value[code] = await api.getFaq(code)
    }
    return faqByLanguage.value[code]!
  }

  return {
    homeByLanguage,
    aboutByLanguage,
    contactByLanguage,
    faqByLanguage,
    loadHome,
    loadAbout,
    loadContact,
    loadFaq,
  }
})

