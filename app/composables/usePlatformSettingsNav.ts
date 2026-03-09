import type { ComputedRef } from 'vue'

export function usePlatformSettingsNav<TNavItem>(
  buildNav: (slug: string, isOwner: boolean) => TNavItem[],
): {
  slug: ComputedRef<string>
  navItems: ComputedRef<TNavItem[]>
} {
  const route = useRoute()
  const slug = computed(() => String(route.params.slug ?? ''))
  const { isOwner } = usePlatformPermissions(slug)
  const navItems = computed(() => buildNav(slug.value, isOwner.value))

  return { slug, navItems }
}
