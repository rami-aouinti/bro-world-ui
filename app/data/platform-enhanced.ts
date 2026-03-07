export interface TicketItem {
  id: string
  title: string
  priority: 'P0' | 'P1' | 'P2'
  owner: string
  eta: string
  description: string
}

export interface MediaCardItem {
  id: string
  title: string
  subtitle: string
  image: string
  chips: string[]
  metric?: string
}

export const crmTickets: TicketItem[] = [
  { id: 'crm-t-01', title: 'Automatiser séquences email', priority: 'P0', owner: 'RevOps', eta: '5 jours', description: 'Déclencheurs onboarding, relances devis, renouvellements.' },
  { id: 'crm-t-02', title: 'Rapports forecast avancés', priority: 'P1', owner: 'Finance', eta: '8 jours', description: 'Prévision MRR/ARR et risques churn avec scoring.' },
  { id: 'crm-t-03', title: 'Vue 360 contacts', priority: 'P1', owner: 'Sales', eta: '6 jours', description: 'Historique interactions, deals actifs, tickets support.' },
]

export const shopCatalogMedia: MediaCardItem[] = [
  { id: 'shop-m-01', title: 'Premium Hoodie', subtitle: 'Collection Winter 2026', image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=1200&q=80&auto=format&fit=crop', chips: ['fashion', 'best seller'], metric: '4.8/5' },
  { id: 'shop-m-02', title: 'Desk Setup Kit', subtitle: 'Office comfort bundle', image: 'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?w=1200&q=80&auto=format&fit=crop', chips: ['office', 'bundle'], metric: '€189' },
  { id: 'shop-m-03', title: 'Sport Performance Pack', subtitle: 'Top ventes sport', image: 'https://images.unsplash.com/photo-1518459031867-a89b944bffe4?w=1200&q=80&auto=format&fit=crop', chips: ['sport', 'new'], metric: '+22%' },
]

export const recruitCandidates: MediaCardItem[] = [
  { id: 'cand-01', title: 'Camille R.', subtitle: 'Senior Frontend Engineer · Paris', image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=800&q=80&auto=format&fit=crop', chips: ['Vue', 'Nuxt', 'Lead'], metric: 'Score 92' },
  { id: 'cand-02', title: 'Nadia K.', subtitle: 'Product Designer · Remote', image: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=800&q=80&auto=format&fit=crop', chips: ['UX', 'Figma', 'DesignOps'], metric: 'Score 88' },
  { id: 'cand-03', title: 'Yanis M.', subtitle: 'Data Analyst · Lyon', image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80&auto=format&fit=crop', chips: ['SQL', 'BI', 'A/B test'], metric: 'Score 84' },
]

export const schoolCampusMedia: MediaCardItem[] = [
  { id: 'sch-01', title: 'STEM Lab', subtitle: 'Nouveau laboratoire IA', image: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?w=1200&q=80&auto=format&fit=crop', chips: ['Innovation', 'AI'], metric: '48 places' },
  { id: 'sch-02', title: 'Library Hub', subtitle: 'Ressources numériques', image: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=1200&q=80&auto=format&fit=crop', chips: ['Books', 'Digital'], metric: '24/7' },
  { id: 'sch-03', title: 'Sports Center', subtitle: 'Programme bien-être', image: 'https://images.unsplash.com/photo-1571260899304-425eee4c7efc?w=1200&q=80&auto=format&fit=crop', chips: ['Fitness', 'Health'], metric: '12 activités' },
]

export const platformProposals: Record<'crm' | 'shop' | 'recruit' | 'school', TicketItem[]> = {
  crm: crmTickets,
  shop: [
    { id: 'shop-t-01', title: 'Programme fidélité avancé', priority: 'P0', owner: 'Growth', eta: '7 jours', description: 'Points, tiers VIP, wallet remises.' },
    { id: 'shop-t-02', title: 'Module avis vidéo', priority: 'P1', owner: 'CX', eta: '4 jours', description: 'UGC clients + modération intelligente.' },
    { id: 'shop-t-03', title: 'Upsell IA checkout', priority: 'P2', owner: 'Product', eta: '9 jours', description: 'Reco dynamique selon panier et profil.' },
  ],
  recruit: [
    { id: 'rec-t-01', title: 'Pipeline interviews kanban', priority: 'P0', owner: 'TA Team', eta: '5 jours', description: 'Screening > Interview > Offer > Hired.' },
    { id: 'rec-t-02', title: 'Scoring CV automatique', priority: 'P1', owner: 'Data', eta: '10 jours', description: 'Score compétences + expérience + fit.' },
    { id: 'rec-t-03', title: 'Portail candidat', priority: 'P2', owner: 'Recruit Ops', eta: '12 jours', description: 'Suivi statut et feedback transparents.' },
  ],
  school: [
    { id: 'sch-t-01', title: 'Bulletins temps réel', priority: 'P0', owner: 'Academic Ops', eta: '8 jours', description: 'Notes, absences, progression et alertes.' },
    { id: 'sch-t-02', title: 'Planning intelligent', priority: 'P1', owner: 'Direction', eta: '6 jours', description: 'Affectation salles/profs selon contraintes.' },
    { id: 'sch-t-03', title: 'Portail parents', priority: 'P2', owner: 'School IT', eta: '11 jours', description: 'Communication classe, notifications, docs.' },
  ],
}
