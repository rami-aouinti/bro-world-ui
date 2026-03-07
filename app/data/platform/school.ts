export type SchoolClassStatus = 'scheduled' | 'ongoing' | 'completed' | 'archived'
export type SchoolClassCategory = 'foundation' | 'advanced' | 'specialization'

export interface SchoolClass {
  id: string
  slug: string
  title: string
  level: number
  students: number
  instructor: string
  category: SchoolClassCategory
  status: SchoolClassStatus
  tags: string[]
  startDate: string
  endDate: string
  updatedAt: string
}

export const schoolClasses: SchoolClass[] = [
  { id: 'cls-001', slug: 'class-a', title: 'Classe A', level: 1, students: 24, instructor: 'Emma Laurent', category: 'foundation', status: 'ongoing', tags: ['python', 'data'], startDate: '2026-01-06', endDate: '2026-04-30', updatedAt: '2026-02-16' },
  { id: 'cls-002', slug: 'class-b', title: 'Classe B', level: 2, students: 19, instructor: 'Noah Martin', category: 'advanced', status: 'ongoing', tags: ['ux', 'research'], startDate: '2026-01-10', endDate: '2026-05-02', updatedAt: '2026-02-11' },
  { id: 'cls-003', slug: 'class-c', title: 'Classe C', level: 3, students: 21, instructor: 'Lina Bernard', category: 'specialization', status: 'scheduled', tags: ['product', 'strategy'], startDate: '2026-03-01', endDate: '2026-06-30', updatedAt: '2026-02-19' },
  { id: 'cls-004', slug: 'class-d', title: 'Classe D', level: 1, students: 26, instructor: 'Julien Rey', category: 'foundation', status: 'completed', tags: ['frontend', 'vue'], startDate: '2025-09-10', endDate: '2025-12-20', updatedAt: '2026-01-05' },
]
