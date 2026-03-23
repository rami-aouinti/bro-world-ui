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

export interface ShopRouteContext {
  slug: string
  category?: string
  productSlug?: string
  orderId?: string
}

export const getShopRoute = (route: 'home' | 'newProduct' | 'productEdit' | 'orderDetail', context: ShopRouteContext) => {
  const base = `/platform/${context.slug}/shop`

  if (route === 'home') return `${base}/home`
  if (route === 'newProduct') return `${base}/products/new`
  if (route === 'productEdit') return `${base}/products/${context.productSlug}/edit`

  return `${base}/orders/${context.orderId}`
}

const platformFeatureFlags: Record<PlatformName, Record<string, boolean>> = {
  crm: {
    dashboard: true,
    companies: true,
    projects: true,
    workflow: true,
    workflowProjects: true,
    workflowRepositories: true,
    workflowIssues: true,
    workflowPullRequests: true,
    workflowBranches: true,
    tasks: true,
    kanaban: true,
    contacts: true,
    reports: true,
    automation: true,
    tickets: true,
    sprint: true,
    calendar: true,
    settings: true,
    admin: true,
  },
  shop: {
    home: true,
    categories: true,
    newProduct: true,
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
    myJobs: true,
    myApplications: true,
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

const resolveNavItem = (platform: PlatformName, item: PlatformNavItem, isOwner: boolean): PlatformNavItem | null => {
  if (!hasAccess(item, isOwner) || !isFeatureEnabled(platform, item)) return null

  if (!item.children?.length) return item

  const children = item.children
    .map((child) => resolveNavItem(platform, child as PlatformNavItem, isOwner))
    .filter((child): child is PlatformNavItem => child !== null)

  return { ...item, children }
}

const resolveNav = (platform: PlatformName, nav: PlatformNavItem[], isOwner: boolean) =>
  nav
    .map((item) => resolveNavItem(platform, item, isOwner))
    .filter((item): item is PlatformNavItem => item !== null)

export const getCrmNav = (slug: string, isOwner = false): PlatformNavItem[] => {
  const base = `/platform/${slug}/crm`
  return resolveNav('crm', [
    { title: 'platform.crm.nav.home', icon: 'mdi-view-dashboard-outline', to: `${base}/home`, section: 'overview', featureFlag: 'dashboard' },
    { title: 'platform.crm.nav.projects', icon: 'mdi-briefcase-outline', to: `${base}/projects`, section: 'operations', featureFlag: 'projects' },
    { title: 'Kanaban', icon: 'mdi-robot-outline', to: `${base}/kanaban`, section: 'operations', featureFlag: 'kanaban' },
    { title: 'platform.crm.nav.tasks', icon: 'mdi-format-list-bulleted-square', to: `${base}/tasks`, section: 'operations', featureFlag: 'tasks' },
    { title: 'platform.crm.nav.sprint', icon: 'mdi-run-fast', to: `${base}/sprint`, section: 'operations', featureFlag: 'sprint' },
    {
      title: 'platform.crm.nav.workflow',
      icon: 'mdi-source-branch',
      to: `${base}/workflow/projects`,
      section: 'operations',
      featureFlag: 'workflow',
      children: [
        { title: 'platform.crm.nav.workflowProjects', icon: 'mdi-briefcase-outline', to: `${base}/workflow/projects`, featureFlag: 'workflowProjects' },
        { title: 'platform.crm.nav.workflowRepositories', icon: 'mdi-source-repository', to: `${base}/workflow/repositories`, featureFlag: 'workflowRepositories' },
        { title: 'platform.crm.nav.workflowIssues', icon: 'mdi-alert-circle-outline', to: `${base}/workflow/issues`, featureFlag: 'workflowIssues' },
        { title: 'platform.crm.nav.workflowPullRequests', icon: 'mdi-source-pull', to: `${base}/workflow/pull-requests`, featureFlag: 'workflowPullRequests' },
        { title: 'platform.crm.nav.workflowBranches', icon: 'mdi-source-branch', to: `${base}/workflow/branches`, featureFlag: 'workflowBranches' },
      ],
    },
    { title: 'platform.crm.nav.calendar', icon: 'mdi-calendar-month-outline', to: `${base}/calendar`, section: 'operations', featureFlag: 'calendar' },
    { title: 'platform.crm.nav.settings', icon: 'mdi-cog-outline', to: `${base}/settings`, section: 'operations', featureFlag: 'settings' },
    { title: 'platform.common.nav.admin', icon: 'mdi-shield-outline', to: `${base}/admin`, section: 'admin', rights: 'owner', featureFlag: 'admin' },
  ], isOwner)
}

export const getShopNav = (slug: string, isOwner = false): PlatformNavItem[] => {
  const base = `/platform/${slug}/shop`
  return resolveNav('shop', [
    { title: 'platform.shop.nav.home', icon: 'mdi-storefront-outline', to: getShopRoute('home', { slug }), section: 'overview', featureFlag: 'home' },
    { title: 'platform.shop.nav.newProduct', icon: 'mdi-plus-box-outline', to: getShopRoute('newProduct', { slug }), section: 'catalog', rights: 'owner', featureFlag: 'newProduct' },
    ...shopCategories.map<PlatformNavItem>((category) => ({ title: `platform.shop.categories.${category}`, icon: 'mdi-shape-outline', to: `${base}/${category}/products`, section: 'catalog', featureFlag: 'categories' })),
    { title: 'platform.shop.nav.promotions', icon: 'mdi-sale-outline', to: `${base}/promotions`, section: 'sales', featureFlag: 'promotions', badge: 'HOT' },
    { title: 'platform.shop.nav.customers', icon: 'mdi-account-group-outline', to: `${base}/customers`, section: 'sales', featureFlag: 'customers' },
    { title: 'platform.shop.nav.reviews', icon: 'mdi-star-outline', to: `${base}/reviews`, section: 'support', featureFlag: 'reviews' },
    { title: 'platform.shop.nav.checkout', icon: 'mdi-cart-outline', to: `${base}/checkout`, section: 'sales', featureFlag: 'checkout' },
    { title: 'platform.shop.nav.orders', icon: 'mdi-package-variant-closed', to: `${base}/orders`, section: 'operations', featureFlag: 'orders' },
    { title: 'platform.shop.nav.payment', icon: 'mdi-cash-fast', to: `${base}/payment`, section: 'operations', featureFlag: 'payment' },
    { title: 'platform.shop.nav.tickets', icon: 'mdi-ticket-confirmation-outline', to: `${base}/tickets`, section: 'support', featureFlag: 'tickets' },
    { title: 'platform.common.nav.admin', icon: 'mdi-shield-crown-outline', to: `${base}/admin`, section: 'admin', rights: 'owner', featureFlag: 'admin' },
  ], isOwner)
}

export const getCalendarNav = (): PlatformNavItem[] => {
  return []
}

export const getRecruitNav = (slug: string, isOwner = false, isAuthenticated = false): PlatformNavItem[] => {
  const base = `/platform/${slug}/recruit`

  const privateItems: PlatformNavItem[] = isAuthenticated
    ? [
        { title: 'platform.recruit.nav.myJobs', icon: 'mdi-briefcase-account-outline', to: `${base}/my-jobs`, section: 'overview', featureFlag: 'myJobs' },
        { title: 'platform.recruit.nav.myApplications', icon: 'mdi-file-outline', to: `${base}/my-applications`, section: 'overview', featureFlag: 'myApplications' },
      ]
    : []

  return resolveNav('recruit', [
    { title: 'platform.recruit.home.actions.createJob', icon: 'mdi-plus-outline', to: `${base}/new`, section: 'overview', featureFlag: 'plus' },
    { title: 'platform.recruit.nav.home', icon: 'mdi-briefcase-search-outline', to: `${base}/home`, section: 'overview', featureFlag: 'jobs' },
    ...privateItems,
    { title: 'platform.recruit.nav.candidates', icon: 'mdi-account-tie-outline', to: `${base}/candidates`, section: 'operations', featureFlag: 'candidates' },
    { title: 'platform.recruit.nav.interviews', icon: 'mdi-calendar-account-outline', to: `${base}/interviews`, section: 'operations', featureFlag: 'interviews' },
    { title: 'platform.recruit.nav.tickets', icon: 'mdi-ticket-confirmation-outline', to: `${base}/tickets`, section: 'support', featureFlag: 'tickets' },
    { title: 'platform.common.nav.admin', icon: 'mdi-shield-crown-outline', to: `${base}/admin`, section: 'admin', rights: 'owner', featureFlag: 'admin' },
  ], isOwner)
}

export const getSchoolNav = (slug: string, isOwner = false): PlatformNavItem[] => {
  const base = `/platform/${slug}/school`
  return resolveNav('school', [
    { title: 'platform.school.nav.home', icon: 'mdi-google-classroom', to: `${base}/home`, section: 'overview', featureFlag: 'classes' },
    { title: 'platform.school.nav.students', icon: 'mdi-account-school-outline', to: `${base}/students`, section: 'operations', featureFlag: 'students' },
    { title: 'platform.school.nav.teachers', icon: 'mdi-teach', to: `${base}/teachers`, section: 'operations', featureFlag: 'teachers' },
    { title: 'platform.school.nav.timetable', icon: 'mdi-calendar-clock-outline', to: `${base}/timetable`, section: 'operations', featureFlag: 'timetable' },
    { title: 'platform.school.nav.settings', icon: 'mdi-cog-outline', to: `${base}/settings`, section: 'operations', featureFlag: 'settings' },
    { title: 'platform.school.nav.certificates', icon: 'mdi-certificate-outline', to: `${base}/certificates`, section: 'operations', featureFlag: 'certificates' },
    { title: 'platform.school.nav.tickets', icon: 'mdi-ticket-confirmation-outline', to: `${base}/tickets`, section: 'support', featureFlag: 'tickets' },
    { title: 'platform.common.nav.admin', icon: 'mdi-shield-crown-outline', to: `${base}/admin`, section: 'admin', rights: 'owner', featureFlag: 'admin' },
  ], isOwner)
}
