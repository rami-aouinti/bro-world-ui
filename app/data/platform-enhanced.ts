import type { PlatformSectionItem } from '~/data/platform-demo'

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
  { id: 'shop-m-01', title: 'Premium Hoodie', subtitle: 'Collection Winter 2026', image: '/images/platform-media/shop-premium-hoodie.svg', chips: ['fashion', 'best seller'], metric: '4.8/5' },
  { id: 'shop-m-02', title: 'Desk Setup Kit', subtitle: 'Office comfort bundle', image: '/images/platform-media/shop-desk-setup-kit.svg', chips: ['office', 'bundle'], metric: '€189' },
  { id: 'shop-m-03', title: 'Sport Performance Pack', subtitle: 'Top ventes sport', image: '/images/platform-media/shop-sport-pack.svg', chips: ['sport', 'new'], metric: '+22%' },
]

export const recruitCandidates: MediaCardItem[] = [
  { id: 'cand-01', title: 'Camille R.', subtitle: 'Senior Frontend Engineer · Paris', image: '/images/platform-media/recruit-camille.svg', chips: ['Vue', 'Nuxt', 'Lead'], metric: 'Score 92' },
  { id: 'cand-02', title: 'Nadia K.', subtitle: 'Product Designer · Remote', image: '/images/platform-media/recruit-nadia.svg', chips: ['UX', 'Figma', 'DesignOps'], metric: 'Score 88' },
  { id: 'cand-03', title: 'Yanis M.', subtitle: 'Data Analyst · Lyon', image: '/images/platform-media/recruit-yanis.svg', chips: ['SQL', 'BI', 'A/B test'], metric: 'Score 84' },
]

export const schoolCampusMedia: MediaCardItem[] = [
  { id: 'sch-01', title: 'STEM Lab', subtitle: 'Nouveau laboratoire IA', image: '/images/platform-media/school-stem-lab.svg', chips: ['Innovation', 'AI'], metric: '48 places' },
  { id: 'sch-02', title: 'Library Hub', subtitle: 'Ressources numériques', image: '/images/platform-media/school-library-hub.svg', chips: ['Books', 'Digital'], metric: '24/7' },
  { id: 'sch-03', title: 'Sports Center', subtitle: 'Programme bien-être', image: '/images/platform-media/school-sports-center.svg', chips: ['Fitness', 'Health'], metric: '12 activités' },
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

export const crmSettingsSections: Record<'routing' | 'automation' | 'governance', PlatformSectionItem[]> = {
  routing: [
    { id: 'crm-r1', title: 'Round-robin B2B', description: 'Distribution automatique des leads inbound par territoire.', owner: 'Sales Ops', status: 'Actif', metrics: [{ label: 'SLA', value: '8 min', tone: 'success' }, { label: 'Capacité', value: '92%', tone: 'primary' }] },
    { id: 'crm-r2', title: 'Règles comptes stratégiques', description: 'Priorisation ABM vers les account executives seniors.', owner: 'Head of Sales', status: 'En revue', metrics: [{ label: 'Couverts', value: '124 comptes', tone: 'info' }] },
  ],
  automation: [
    { id: 'crm-a1', title: 'Relance devis J+3', description: 'Envoi multi-canal selon score de closing.', owner: 'RevOps', status: 'Actif', metrics: [{ label: 'Taux réponse', value: '+18%', tone: 'success' }] },
    { id: 'crm-a2', title: 'Renewal health-check', description: 'Détection risque churn avec déclenchement CSM.', owner: 'Customer Success', status: 'Actif', metrics: [{ label: 'Comptes suivis', value: '73', tone: 'primary' }] },
  ],
  governance: [
    { id: 'crm-g1', title: 'Conservation PII', description: 'Purge auto des données inactives > 24 mois.', owner: 'DPO', status: 'Conforme', metrics: [{ label: 'Dernier audit', value: 'il y a 12 j', tone: 'info' }] },
  ],
}

export const shopPaymentSections: Record<'checkout' | 'providers' | 'fraud', PlatformSectionItem[]> = {
  checkout: [
    { id: 'sh-c1', title: 'Tunnel mobile', description: 'Optimisation en 3 étapes pour panier < 120€.', status: 'Actif', metrics: [{ label: 'Conversion', value: '4.9%', tone: 'success' }, { label: 'Abandon', value: '32%', tone: 'warning' }] },
    { id: 'sh-c2', title: 'Paiement express', description: 'One-click pour clients récurrents connectés.', status: 'Pilote', metrics: [{ label: 'Adoption', value: '38%', tone: 'primary' }] },
  ],
  providers: [
    { id: 'sh-p1', title: 'Stripe EU', description: 'Provider principal cartes + wallets.', status: '99.98% uptime', metrics: [{ label: 'Coût', value: '1.4% + 0.25€', tone: 'info' }] },
    { id: 'sh-p2', title: 'Adyen fallback', description: 'Routage intelligent sur erreur PSP primaire.', status: 'Actif', metrics: [{ label: 'Failover', value: '< 300ms', tone: 'success' }] },
  ],
  fraud: [
    { id: 'sh-f1', title: 'Règle 3DS adaptative', description: 'Déclenchement selon score risque et pays.', status: 'Actif', metrics: [{ label: 'Chargebacks', value: '0.31%', tone: 'success' }] },
  ],
}

export const schoolSettingsSections: Record<'calendar' | 'permissions' | 'certificates', PlatformSectionItem[]> = {
  calendar: [
    { id: 'sc-cal1', title: 'Année scolaire 2026', description: 'Découpage trimestres, examens blancs et conseils de classe.', owner: 'Direction pédagogique', status: 'Publié', metrics: [{ label: 'Jours ouvrés', value: '172', tone: 'info' }] },
    { id: 'sc-cal2', title: 'Sessions rattrapage', description: 'Créneaux dédiés et salles réservées.', owner: 'Scolarité', status: 'Brouillon', metrics: [{ label: 'Sessions', value: '6', tone: 'warning' }] },
  ],
  permissions: [
    { id: 'sc-perm1', title: 'Rôle enseignant', description: 'Accès notes, absences, ressources de classe.', owner: 'IT School', status: 'Actif', metrics: [{ label: 'Utilisateurs', value: '84', tone: 'primary' }] },
    { id: 'sc-perm2', title: 'Portail parent', description: 'Consultation bulletins et signature électronique.', owner: 'Vie scolaire', status: 'Déploiement', metrics: [{ label: 'Activation', value: '67%', tone: 'success' }] },
  ],
  certificates: [
    { id: 'sc-cert1', title: 'Template diplôme officiel', description: 'Version bilingue avec QR de vérification.', owner: 'Administration', status: 'Validé', metrics: [{ label: 'Dernière MAJ', value: '02/03/2026', tone: 'info' }] },
  ],
}

export const recruitAdminSections: Record<'pipeline' | 'interviews' | 'offers', PlatformSectionItem[]> = {
  pipeline: [
    { id: 'rec-p1', title: 'Funnel Engineering', description: 'Suivi sourcing > screening > final panel.', owner: 'Talent Acquisition', status: 'Actif', metrics: [{ label: 'Candidats', value: '126', tone: 'primary' }, { label: 'Time-to-screen', value: '2.1 j', tone: 'success' }] },
    { id: 'rec-p2', title: 'Pipeline Product', description: 'Rôles design & PM sur 2 squads prioritaires.', owner: 'Hiring Managers', status: 'Attention', metrics: [{ label: 'Besoins ouverts', value: '7', tone: 'warning' }] },
  ],
  interviews: [
    { id: 'rec-i1', title: 'Panel Frontend', description: 'Comité hebdo avec scorecards harmonisées.', owner: 'Tech Leads', status: 'Actif', metrics: [{ label: 'No-show', value: '4%', tone: 'success' }] },
    { id: 'rec-i2', title: 'Calibration interviewers', description: 'Formation anti-biais et grille compétences.', owner: 'People Ops', status: 'Planifié', metrics: [{ label: 'Participants', value: '24', tone: 'info' }] },
  ],
  offers: [
    { id: 'rec-o1', title: 'Pack offres senior', description: 'Workflow approval compensation + signature.', owner: 'HRBP', status: 'Actif', metrics: [{ label: 'Offer acceptance', value: '81%', tone: 'success' }] },
  ],
}
