export interface NavItem {
  title: string
  icon: string
  to: string
  subtitle?: string
  badge?: string
  section?: string
  rights?: 'public' | 'owner'
  featureFlag?: string
}

export interface StatItem {
  label: string
  value: string
  trend?: string
  color?: string
}

export interface Company {
  id: string
  name: string
  sector: string
  size: string
  status: 'Active' | 'Prospect' | 'Paused'
}

export interface Product {
  slug: string
  title: string
  category: string
  price: number
  rating: number
  stock: number
  cover: string
  description: string
}

export interface Job {
  slug: string
  title: string
  company: string
  type: 'CDI' | 'Freelance' | 'Internship' | 'CDD'
  location: string
  remote: boolean
  salary: string
  tags: string[]
  postedAt: string
  summary: string
}

export interface SchoolClass {
  id: string
  name: string
  level: string
  teacher: string
  students: number
  room: string
}

export const crmStats: StatItem[] = [
  { label: 'Pipeline', value: '€ 284k', trend: '+12%', color: 'primary' },
  { label: 'Deals gagnés', value: '41', trend: '+8%', color: 'success' },
  { label: 'Cycle moyen', value: '23 jours', trend: '-3j', color: 'info' },
  { label: 'NPS clients', value: '68', trend: '+4', color: 'warning' },
]

export const crmCompanies: Company[] = [
  { id: 'cmp-01', name: 'Nova Retail', sector: 'E-commerce', size: '200-500', status: 'Active' },
  { id: 'cmp-02', name: 'Atlas Fintech', sector: 'Finance', size: '50-200', status: 'Prospect' },
  { id: 'cmp-03', name: 'GreenGrid', sector: 'Energy', size: '500+', status: 'Active' },
  { id: 'cmp-04', name: 'Blue Freight', sector: 'Logistique', size: '200-500', status: 'Paused' },
  { id: 'cmp-05', name: 'Pixel Forge', sector: 'SaaS', size: '10-50', status: 'Prospect' },
  { id: 'cmp-06', name: 'Mondo Health', sector: 'Health', size: '500+', status: 'Active' },
]

export const crmProjects = [
  { id: 'prj-01', title: 'Migration CRM v2', owner: 'Alice', progress: 72 },
  { id: 'prj-02', title: 'Playbook outbound', owner: 'Karim', progress: 38 },
  { id: 'prj-03', title: 'RevOps dashboard', owner: 'Sofia', progress: 90 },
  { id: 'prj-04', title: 'Automatisation renewals', owner: 'Malo', progress: 57 },
]

export const shopCategories = ['tech', 'fashion', 'home', 'sport', 'beauty', 'kids']

export const shopProducts: Product[] = [
  { slug: 'smart-watch-pro', title: 'Smart Watch Pro', category: 'tech', price: 199, rating: 4.6, stock: 31, cover: '⌚', description: 'Montre connectée premium avec GPS et suivi santé.' },
  { slug: 'noise-cancel-headphones', title: 'Noise Cancel Headphones', category: 'tech', price: 149, rating: 4.4, stock: 18, cover: '🎧', description: 'Casque ANC longue autonomie et son studio.' },
  { slug: 'urban-hoodie', title: 'Urban Hoodie', category: 'fashion', price: 59, rating: 4.2, stock: 87, cover: '🧥', description: 'Hoodie oversize coton bio ultra confortable.' },
  { slug: 'running-shoes-x', title: 'Running Shoes X', category: 'sport', price: 129, rating: 4.8, stock: 42, cover: '👟', description: 'Chaussures running légères pour route et trail.' },
  { slug: 'aroma-lamp', title: 'Aroma Lamp', category: 'home', price: 39, rating: 4.1, stock: 66, cover: '💡', description: 'Lampe design avec diffusion d’huiles essentielles.' },
  { slug: 'daily-skin-kit', title: 'Daily Skin Kit', category: 'beauty', price: 79, rating: 4.5, stock: 54, cover: '🧴', description: 'Routine skincare matin/soir pour peau mixte.' },
  { slug: 'kids-learning-tablet', title: 'Kids Learning Tablet', category: 'kids', price: 119, rating: 4.3, stock: 24, cover: '🧒', description: 'Tablette éducative avec apps pédagogiques.' },
  { slug: 'yoga-mat-premium', title: 'Yoga Mat Premium', category: 'sport', price: 45, rating: 4.7, stock: 73, cover: '🧘', description: 'Tapis anti-dérapant haute densité, eco-friendly.' },
]

export const recruitJobs: Job[] = [
  { slug: 'senior-frontend-engineer', title: 'Senior Frontend Engineer', company: 'Nova Retail', type: 'CDI', location: 'Paris', remote: true, salary: '60k - 75k', tags: ['Vue', 'Nuxt', 'Design System'], postedAt: '2j', summary: 'Concevoir une expérience e-commerce performante et accessible.' },
  { slug: 'product-designer-ii', title: 'Product Designer II', company: 'Atlas Fintech', type: 'CDI', location: 'Lyon', remote: true, salary: '50k - 62k', tags: ['UX', 'Figma', 'Design Ops'], postedAt: '4j', summary: 'Structurer un design language pour des produits financiers.' },
  { slug: 'talent-acquisition-partner', title: 'Talent Acquisition Partner', company: 'GreenGrid', type: 'CDD', location: 'Bordeaux', remote: false, salary: '42k - 50k', tags: ['Sourcing', 'Employer Brand'], postedAt: '1w', summary: 'Accélérer les recrutements tech et opérations.' },
  { slug: 'data-analyst-growth', title: 'Data Analyst Growth', company: 'Pixel Forge', type: 'Freelance', location: 'Remote EU', remote: true, salary: '450€/j', tags: ['SQL', 'BI', 'Experimentation'], postedAt: '6j', summary: 'Piloter les analyses conversion et rétention produit.' },
]

export const schoolClasses: SchoolClass[] = [
  { id: 'cls-101', name: 'Mathématiques avancées', level: 'Terminale', teacher: 'Mme Bernard', students: 28, room: 'B-201' },
  { id: 'cls-102', name: 'Physique appliquée', level: 'Première', teacher: 'M. Martin', students: 31, room: 'A-108' },
  { id: 'cls-103', name: 'Histoire globale', level: 'Seconde', teacher: 'Mme Diallo', students: 26, room: 'C-305' },
  { id: 'cls-104', name: 'Informatique', level: 'Terminale', teacher: 'M. Girard', students: 24, room: 'Lab-2' },
  { id: 'cls-105', name: 'Littérature', level: 'Première', teacher: 'Mme Costa', students: 30, room: 'B-112' },
]
