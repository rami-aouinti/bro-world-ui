import { getCrmNav, getRecruitNav, getSchoolNav, getShopNav } from '~/data/platform-nav'
import type { PlatformNavItem } from '~/data/platform-nav'

export const usePlatformPluginPage = () => {
  const route = useRoute()
  const slug = computed(() => String(route.params.slug ?? ''))
  const platformKey = computed(() => String(route.params.platformKey ?? '').toLowerCase())

  const { isOwner } = usePlatformPermissions(slug)
  const { isAuthenticated } = useAuth()

  const navItems = computed<PlatformNavItem[]>(() => {
    if (platformKey.value === 'shop') return getShopNav(slug.value, isOwner.value)
    if (platformKey.value === 'recruit') return getRecruitNav(slug.value, isOwner.value, isAuthenticated.value)
    if (platformKey.value === 'school') return getSchoolNav(slug.value, isOwner.value)
    return getCrmNav(slug.value, isOwner.value)
  })

  return {
    slug,
    platformKey,
    navItems,
    isOwner,
    isAuthenticated,
  }
}
