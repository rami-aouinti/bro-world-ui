export type RecruitJobStatus = 'draft' | 'open' | 'paused' | 'closed'
export type RecruitJobCategory = 'engineering' | 'product' | 'design' | 'data' | 'operations'

export interface RecruitJob {
  id: string
  slug: string
  title: string
  location: string
  contractType: 'CDI' | 'CDD' | 'Freelance' | 'Internship'
  category: RecruitJobCategory
  status: RecruitJobStatus
  tags: string[]
  publishedAt: string
  updatedAt: string
}

export const recruitJobs: RecruitJob[] = [
  { id: 'job-001', slug: 'frontend-engineer', title: 'Frontend Engineer', location: 'Paris', contractType: 'CDI', category: 'engineering', status: 'open', tags: ['vue', 'typescript', 'ui'], publishedAt: '2026-01-10', updatedAt: '2026-02-05' },
  { id: 'job-002', slug: 'backend-engineer', title: 'Backend Engineer', location: 'Remote', contractType: 'CDI', category: 'engineering', status: 'open', tags: ['node', 'api', 'postgres'], publishedAt: '2026-01-08', updatedAt: '2026-01-29' },
  { id: 'job-003', slug: 'product-designer', title: 'Product Designer', location: 'Lyon', contractType: 'CDI', category: 'design', status: 'open', tags: ['ux', 'figma', 'design-system'], publishedAt: '2025-12-12', updatedAt: '2026-02-01' },
  { id: 'job-004', slug: 'data-analyst', title: 'Data Analyst', location: 'Nantes', contractType: 'Freelance', category: 'data', status: 'paused', tags: ['sql', 'bi', 'dashboard'], publishedAt: '2025-11-03', updatedAt: '2025-12-18' },
  { id: 'job-005', slug: 'devops-engineer', title: 'DevOps Engineer', location: 'Remote', contractType: 'CDI', category: 'operations', status: 'open', tags: ['kubernetes', 'aws', 'sre'], publishedAt: '2025-10-18', updatedAt: '2026-01-15' },
  { id: 'job-006', slug: 'qa-engineer', title: 'QA Engineer', location: 'Paris', contractType: 'CDD', category: 'engineering', status: 'draft', tags: ['cypress', 'quality', 'automation'], publishedAt: '2025-10-01', updatedAt: '2025-10-20' },
  { id: 'job-007', slug: 'product-manager', title: 'Product Manager', location: 'Bordeaux', contractType: 'CDI', category: 'product', status: 'open', tags: ['roadmap', 'discovery', 'agile'], publishedAt: '2025-09-06', updatedAt: '2026-02-11' },
  { id: 'job-008', slug: 'customer-success-manager', title: 'Customer Success Manager', location: 'Remote', contractType: 'CDI', category: 'operations', status: 'closed', tags: ['customer', 'onboarding', 'retention'], publishedAt: '2025-08-02', updatedAt: '2025-12-04' },
  { id: 'job-009', slug: 'fullstack-intern', title: 'Fullstack Intern', location: 'Paris', contractType: 'Internship', category: 'engineering', status: 'open', tags: ['react', 'node', 'learning'], publishedAt: '2026-02-15', updatedAt: '2026-02-22' },
]
