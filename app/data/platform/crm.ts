export type CrmEntityStatus = 'lead' | 'active' | 'at-risk' | 'inactive'
export type CrmEntityCategory = 'industry' | 'saas' | 'energy' | 'retail'

export interface CrmCompany {
  id: string
  slug: string
  name: string
  owner: string
  annualRevenueEur: number
  category: CrmEntityCategory
  status: CrmEntityStatus
  tags: string[]
  createdAt: string
  updatedAt: string
}

export type CrmProjectStatus = 'kickoff' | 'in-progress' | 'planning' | 'done'

export interface CrmProject {
  id: string
  slug: string
  title: string
  companySlug: string
  dueDate: string
  category: 'delivery' | 'migration' | 'campaign'
  status: CrmProjectStatus
  tags: string[]
  createdAt: string
  updatedAt: string
}

export const crmCompanies: CrmCompany[] = [
  { id: 'crm-co-001', slug: 'novatek', name: 'Novatek', owner: 'Rania', annualRevenueEur: 1200000, category: 'industry', status: 'active', tags: ['enterprise', 'upsell'], createdAt: '2024-04-02', updatedAt: '2026-02-08' },
  { id: 'crm-co-002', slug: 'cloudware', name: 'Cloudware', owner: 'Paul', annualRevenueEur: 860000, category: 'saas', status: 'active', tags: ['saas', 'renewal'], createdAt: '2024-05-18', updatedAt: '2026-01-21' },
  { id: 'crm-co-003', slug: 'greenline', name: 'Greenline', owner: 'Mehdi', annualRevenueEur: 540000, category: 'energy', status: 'at-risk', tags: ['churn-risk', 'energy'], createdAt: '2024-09-06', updatedAt: '2026-02-14' },
  { id: 'crm-co-004', slug: 'retaily', name: 'Retaily', owner: 'Sonia', annualRevenueEur: 430000, category: 'retail', status: 'lead', tags: ['prospect', 'retail'], createdAt: '2026-01-04', updatedAt: '2026-02-17' },
]

export const crmProjects: CrmProject[] = [
  { id: 'crm-prj-001', slug: 'onboarding-erp', title: 'Onboarding ERP', companySlug: 'novatek', dueDate: '2026-06-18', category: 'delivery', status: 'kickoff', tags: ['erp', 'onboarding'], createdAt: '2026-01-05', updatedAt: '2026-02-01' },
  { id: 'crm-prj-002', slug: 'migration-crm', title: 'Migration CRM', companySlug: 'cloudware', dueDate: '2026-06-30', category: 'migration', status: 'in-progress', tags: ['migration', 'crm'], createdAt: '2025-12-15', updatedAt: '2026-02-10' },
  { id: 'crm-prj-003', slug: 'campagne-q3', title: 'Campagne Q3', companySlug: 'greenline', dueDate: '2026-07-12', category: 'campaign', status: 'planning', tags: ['marketing', 'q3'], createdAt: '2026-01-20', updatedAt: '2026-02-13' },
  { id: 'crm-prj-004', slug: 'support-rollout', title: 'Support Rollout', companySlug: 'retaily', dueDate: '2026-05-04', category: 'delivery', status: 'done', tags: ['support', 'rollout'], createdAt: '2025-10-11', updatedAt: '2026-01-31' },
]
