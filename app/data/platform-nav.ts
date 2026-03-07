import { shopCategories, type NavItem } from '~/data/platform-demo'

export type NavSection = 'overview' | 'sales' | 'operations' | 'support' | 'catalog' | 'admin'
export type NavRights = 'public' | 'owner'

export interface PlatformNavItem extends NavItem {
  badge?: string
  section?: NavSection
  rights?: NavRights
  featureFlag?: string
}

type PlatformName = 'crm' | 'shop' | 'recruit' | 'school'

const platformFeatureFlags: Record<PlatformName, Record<string, boolean>> = {
  crm: {
    dashboard: true,
    companies: true,
    projects: true,
    contacts: true,
    reports: true,
    automation: true,
    tickets: true,
    sprint: true,
    calendar: true,
    settings: true,
    billing: true,
    admin: true,
  },
  shop: {
    home: true,
    categories: true,
    promotions: true,
    customers: true,
    reviews: true,
    checkout: true,
    orders: true,
    payment: true,
    tickets: true,
    admin: true,
  },
  recruit: {
    jobs: true,
    candidates: true,
    interviews: true,
    tickets: true,
    admin: true,
  },
  school: {
    classes: true,
    students: true,
    teachers: true,
    timetable: true,
    settings: true,
    certificates: true,
    tickets: true,
    admin: true,
  },
}

const hasAccess = (item: PlatformNavItem, isOwner: boolean) => (item.rights !== 'owner' || isOwner)

const isFeatureEnabled = (platform: PlatformName, item: PlatformNavItem) => {
  if (!item.featureFlag) return true
  return platformFeatureFlags[platform][item.featureFlag] !== false
}

const resolveNav = (platform: PlatformName, nav: PlatformNavItem[], isOwner: boolean) => nav.filter((item) => hasAccess(item, isOwner) && isFeatureEnabled(platform, item))

export const getCrmNav = (slug: string, isOwner = false): PlatformNavItem[] => {
  const base = `/platform/${slug}/crm`
  return resolveNav('crm', [
    { title: 'Dashboard', icon: 'mdi-view-dashboard-outline', to: `${base}/home`, section: 'overview', featureFlag: 'dashboard' },
    { title: 'Companies', icon: 'mdi-office-building-outline', to: `${base}/companies`, section: 'sales', featureFlag: 'companies' },
    { title: 'Projects', icon: 'mdi-briefcase-outline', to: `${base}/projects`, section: 'operations', featureFlag: 'projects' },
    { title: 'Contacts', icon: 'mdi-account-group-outline', to: `${base}/contacts`, section: 'sales', featureFlag: 'contacts' },
    { title: 'Reports', icon: 'mdi-chart-line', to: `${base}/reports`, section: 'overview', featureFlag: 'reports', badge: 'NEW' },
    { title: 'Automation', icon: 'mdi-robot-outline', to: `${base}/automation`, section: 'operations', featureFlag: 'automation' },
    { title: 'Sprint', icon: 'mdi-run-fast', to: `${base}/sprint`, section: 'operations', featureFlag: 'sprint' },
    { title: 'Calendar', icon: 'mdi-calendar-month-outline', to: `${base}/calendar`, section: 'operations', featureFlag: 'calendar' },
    { title: 'Settings', icon: 'mdi-cog-outline', to: `${base}/settings`, section: 'operations', featureFlag: 'settings' },
    { title: 'Billing', icon: 'mdi-credit-card-outline', to: `${base}/billing`, section: 'operations', featureFlag: 'billing' },
    { title: 'Tickets', icon: 'mdi-ticket-confirmation-outline', to: `${base}/tickets`, section: 'support', featureFlag: 'tickets' },
    { title: 'Admin', icon: 'mdi-shield-crown-outline', to: `${base}/admin`, section: 'admin', rights: 'owner', featureFlag: 'admin' },
  ], isOwner)
}

export const getShopNav = (slug: string, isOwner = false): PlatformNavItem[] => {
  const base = `/platform/${slug}/shop`
  return resolveNav('shop', [
    { title: 'Accueil shop', icon: 'mdi-storefront-outline', to: `${base}/home`, section: 'overview', featureFlag: 'home' },
    ...shopCategories.map<PlatformNavItem>((category) => ({ title: category, icon: 'mdi-shape-outline', to: `${base}/${category}/products`, section: 'catalog', featureFlag: 'categories' })),
    { title: 'Promotions', icon: 'mdi-sale-outline', to: `${base}/promotions`, section: 'sales', featureFlag: 'promotions', badge: 'HOT' },
    { title: 'Customers', icon: 'mdi-account-group-outline', to: `${base}/customers`, section: 'sales', featureFlag: 'customers' },
    { title: 'Reviews', icon: 'mdi-star-outline', to: `${base}/reviews`, section: 'support', featureFlag: 'reviews' },
    { title: 'Checkout', icon: 'mdi-cart-outline', to: `${base}/checkout`, section: 'sales', featureFlag: 'checkout' },
    { title: 'Orders', icon: 'mdi-package-variant-closed', to: `${base}/orders`, section: 'operations', featureFlag: 'orders' },
    { title: 'Payment', icon: 'mdi-cash-fast', to: `${base}/payment`, section: 'operations', featureFlag: 'payment' },
    { title: 'Tickets', icon: 'mdi-ticket-confirmation-outline', to: `${base}/tickets`, section: 'support', featureFlag: 'tickets' },
    { title: 'Admin', icon: 'mdi-shield-crown-outline', to: `${base}/admin`, section: 'admin', rights: 'owner', featureFlag: 'admin' },
  ], isOwner)
}

export const getRecruitNav = (slug: string, isOwner = false): PlatformNavItem[] => {
  const base = `/platform/${slug}/recruit`
  return resolveNav('recruit', [
    { title: 'Jobs', icon: 'mdi-briefcase-search-outline', to: `${base}/home`, section: 'overview', featureFlag: 'jobs' },
    { title: 'Candidates', icon: 'mdi-account-tie-outline', to: `${base}/candidates`, section: 'operations', featureFlag: 'candidates' },
    { title: 'Interviews', icon: 'mdi-calendar-account-outline', to: `${base}/interviews`, section: 'operations', featureFlag: 'interviews' },
    { title: 'Tickets', icon: 'mdi-ticket-confirmation-outline', to: `${base}/tickets`, section: 'support', featureFlag: 'tickets' },
    { title: 'Admin', icon: 'mdi-shield-crown-outline', to: `${base}/admin`, section: 'admin', rights: 'owner', featureFlag: 'admin' },
  ], isOwner)
}

export const getSchoolNav = (slug: string, isOwner = false): PlatformNavItem[] => {
  const base = `/platform/${slug}/school`
  return resolveNav('school', [
    { title: 'Classes', icon: 'mdi-google-classroom', to: `${base}/home`, section: 'overview', featureFlag: 'classes' },
    { title: 'Students', icon: 'mdi-account-school-outline', to: `${base}/students`, section: 'operations', featureFlag: 'students' },
    { title: 'Teachers', icon: 'mdi-teach', to: `${base}/teachers`, section: 'operations', featureFlag: 'teachers' },
    { title: 'Timetable', icon: 'mdi-calendar-clock-outline', to: `${base}/timetable`, section: 'operations', featureFlag: 'timetable' },
    { title: 'Settings', icon: 'mdi-cog-outline', to: `${base}/settings`, section: 'operations', featureFlag: 'settings' },
    { title: 'Certificates', icon: 'mdi-certificate-outline', to: `${base}/certificates`, section: 'operations', featureFlag: 'certificates' },
    { title: 'Tickets', icon: 'mdi-ticket-confirmation-outline', to: `${base}/tickets`, section: 'support', featureFlag: 'tickets' },
    { title: 'Admin', icon: 'mdi-shield-crown-outline', to: `${base}/admin`, section: 'admin', rights: 'owner', featureFlag: 'admin' },
  ], isOwner)
}
