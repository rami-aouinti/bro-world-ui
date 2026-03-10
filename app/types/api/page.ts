export interface PageHero {
  badge: string
  title: string
  subtitle: string
  primaryCta: string
  secondaryCta: string
}

export interface HomePagePayload {
  featuresTitle: string
  metricsTitle: string
  stepsTitle: string
  stepLabelPrefix: string
  hero: PageHero & { benefits: string[] }
  featureCards: Array<{ icon: string, title: string, description: string }>
  metrics: Array<{ value: string, label: string }>
  steps: Array<{ title: string, description: string, icon: string }>
  cta: {
    title: string
    description: string
    primaryAction: string
    secondaryAction: string
  }
}

export interface AboutPagePayload {
  hero: PageHero & { paragraphs: string[], bullets: string[] }
  metricsTitle: string
  missionCards: Array<{
    title: string
    description: string
    paragraphs: string[]
    bullets: string[]
    icon: string
  }>
  metrics: Array<{ value: string, label: string, context: string, icon: string }>
  timelineTitle: string
  timeline: Array<{
    title: string
    period: string
    description: string
    highlights: string[]
    icon: string
  }>
  cta: {
    title: string
    description: string
    primaryAction: string
    secondaryAction: string
  }
}

export interface ContactPagePayload {
  title: string
  hero: PageHero
  channels: Array<{ label: string, value: string, details: string, icon: string }>
  availability: {
    title: string
    description: string
    windows: Array<{ label: string, value: string }>
    escalationTitle: string
    escalationBullets: string[]
  }
  form: {
    title: string
    description: string
    fields: {
      firstName: string
      lastName: string
      email: string
      topic: string
      message: string
      messagePlaceholder: string
    }
    topics: Array<{ value: string, label: string }>
    privacyNote: string
    submit: string
    reset: string
  }
  cta: {
    title: string
    description: string
    actions: Array<{ label: string, variant: 'primary' | 'outlined' }>
  }
}

export interface FaqPagePayload {
  hero: PageHero
  search: { label: string, placeholder: string }
  categories: Array<{ key: string, label: string, color: string, description: string }>
  items: Array<{
    category: string
    question: string
    answer: string
    detailsParagraphs: string[]
    bullets: string[]
  }>
  emptyState: {
    title: string
    description: string
    suggestion: string
  }
}

export type PageEntityRead = {
  id: string
  languageCode?: 'en' | 'fr'
  [key: string]: unknown
}

