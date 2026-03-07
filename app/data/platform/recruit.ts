export type RecruitJobStatus = 'draft' | 'open' | 'paused' | 'closed'
export type RecruitContractType = 'CDI' | 'CDD' | 'Freelance' | 'Internship'

export interface RecruitSalary {
  min: number
  max: number
  currency: 'EUR'
  period: 'year' | 'day'
}

export interface RecruitCompany {
  name: string
  logo: string
  sector: string
  size: string
}

export interface RecruitJob {
  id: string
  slug: string
  title: string
  company: RecruitCompany
  location: string
  contractType: RecruitContractType
  workMode: 'Onsite' | 'Hybrid' | 'Remote'
  schedule: string
  salary: RecruitSalary
  postedAtLabel: string
  summary: string
  matchScore: number
  badges: string[]
  tags: string[]
  missionTitle: string
  missionDescription: string
  responsibilities: string[]
  profile: string[]
  benefits: string[]
}

export const recruitJobs: RecruitJob[] = [
  {
    id: 'job-001',
    slug: 'senior-fullstack-entwickler-php-laravel-react-vue-typescript',
    title: 'Senior Full Stack Entwickler (m/w/d) - PHP/Laravel, React/Vue.js/Typescript',
    company: {
      name: 'Aveyara Software GmbH',
      logo: 'AS',
      sector: 'IT & Tech',
      size: '11-50 Mitarbeiter',
    },
    location: 'Stuttgart',
    contractType: 'CDI',
    workMode: 'Hybrid',
    schedule: 'Vollzeit',
    salary: { min: 50000, max: 80000, currency: 'EUR', period: 'year' },
    postedAtLabel: 'vor 1 Woche',
    summary: 'Wir suchen einen leidenschaftlichen Fullstack-Entwickler mit Expertise in PHP, Laravel, React und Typescript.',
    matchScore: 86,
    badges: ['Bewerbungs-Update verfügbar', 'Sei einer der ersten Bewerber', 'Schnelle Bewerbung'],
    tags: ['PHP', 'Laravel', 'React', 'Vue.js', 'Typescript', 'PostgreSQL', 'Docker'],
    missionTitle: 'Deine Mission:',
    missionDescription: 'Wir suchen einen leidenschaftlichen Fullstack-Entwickler, der unser Team mit seiner Expertise in PHP, Laravel, React und Typescript bereichert. Gemeinsam entwickeln wir innovative Softwarelösungen, die den öffentlichen Sektor modernisieren und treiben die Digitalisierung der Verwaltung voran.',
    responsibilities: [
      'Innovation gestalten: Entwickle maßgeschneiderte Softwarelösungen, die öffentliche Prozesse optimieren und die digitale Transformation vorantreiben.',
      'Architektur weiterentwickeln: Arbeite an der gesamten Softwarearchitektur, von Frontend und Backend über Datenbanken bis hin zu Caches.',
      'Agilität leben: Optimiere kontinuierlich unseren agilen Entwicklungsprozess und trage zu einer effizienten Zusammenarbeit bei.',
      'Qualität sichern: Stelle hohe Codequalität durch aktive Teilnahme an Code Reviews und automatisierten Tests sicher.',
      'Wachsen und lernen: Profitiere von regelmäßigen Weiterbildungsmöglichkeiten und entfalte dein Potenzial im Team.',
    ],
    profile: [
      'Abgeschlossenes Studium in Informatik oder eine vergleichbare Qualifikation.',
      'Fundierte Kenntnisse in PHP und modernen PHP-Frameworks, idealerweise Laravel.',
      'Erfahrung mit PostgreSQL und der Konzeption & Entwicklung von REST APIs.',
      'Kenntnisse in Container-Technologien wie Docker.',
      'Kenntnisse in Typescript, React, Vue.js.',
      'Erfahrung mit automatisierten Tests und agiler Entwicklung.',
      'Sehr gute Deutsch- und Englischkenntnisse.',
    ],
    benefits: [
      'Sinnstiftende Arbeit: Gestalte die Zukunft des öffentlichen Sektors mit.',
      'Innovatives Umfeld: Arbeite mit modernen Technologien wie PHP 8.2+, Laravel, React und Vue.js.',
      'Flexibilität: Ausgewogene Work-Life-Balance mit hybriden Arbeitszeiten.',
      'Entwicklung: Gezielte Weiterbildungen und Konferenzbesuche.',
      'Teamspirit: Kollegiales Team mit offener Feedbackkultur.',
      'Top-Ausstattung: Leistungsstarker Laptop für deinen Alltag.',
    ],
  },
  {
    id: 'job-002',
    slug: 'senior-webentwickler-php-rest-docker-ci-cd',
    title: 'Senior Webentwickler - PHP / REST / Docker / CI CD (m/w/d)',
    company: {
      name: 'WERTGARANTIE Group',
      logo: 'WG',
      sector: 'Versicherung',
      size: '1000+ Mitarbeiter',
    },
    location: 'Hannover',
    contractType: 'CDI',
    workMode: 'Hybrid',
    schedule: 'Vollzeit',
    salary: { min: 40000, max: 57000, currency: 'EUR', period: 'year' },
    postedAtLabel: 'vor 3 Tagen',
    summary: 'Mit Technologien wie REST, PHP, SQL und Docker bist du bestens vertraut und entwickelst performante Services.',
    matchScore: 79,
    badges: ['Schnelle Bewerbung'],
    tags: ['REST', 'PHP', 'SQL', 'PostgreSQL', 'Docker', 'CI/CD'],
    missionTitle: 'Deine Mission:',
    missionDescription: 'Als Senior Webentwickler entwickelst du skalierbare REST-Services und stärkst die API-Landschaft für digitale Versicherungsprodukte.',
    responsibilities: [
      'Du entwickelst robuste Backend-Services mit PHP.',
      'Du optimierst bestehende APIs und Datenbankabfragen.',
      'Du stellst Qualität durch Tests und CI/CD sicher.',
    ],
    profile: [
      'Mehrjährige Erfahrung in der Backend-Entwicklung mit PHP.',
      'Sicherer Umgang mit SQL-Datenbanken.',
      'Erfahrung mit Docker und Deployment-Prozessen.',
    ],
    benefits: [
      'Flexible Arbeitszeiten und Homeoffice-Anteil.',
      'Strukturiertes Onboarding.',
      'Individuelle Weiterbildung.',
    ],
  },
  {
    id: 'job-003',
    slug: 'php-developer-hamburg',
    title: 'PHP Developer (m/w/d)',
    company: {
      name: 'CLP Trading GmbH',
      logo: 'CLP',
      sector: 'Handel',
      size: '201-500 Mitarbeiter',
    },
    location: 'Hamburg',
    contractType: 'CDI',
    workMode: 'Onsite',
    schedule: 'Vollzeit',
    salary: { min: 50000, max: 75000, currency: 'EUR', period: 'year' },
    postedAtLabel: 'vor 1 Tag',
    summary: 'Du arbeitest in einem cross-funktionalen Team an Webanwendungen und internen Plattformdiensten.',
    matchScore: 74,
    badges: ['Schnelle Bewerbung'],
    tags: ['MySQL', 'PHP', 'Entwicklung', 'Webanwendung'],
    missionTitle: 'Deine Mission:',
    missionDescription: 'Du baust und betreibst moderne PHP-Applikationen für ein wachsendes Handelsunternehmen.',
    responsibilities: [
      'Weiterentwicklung bestehender Module.',
      'Implementierung neuer Features.',
      'Technische Zusammenarbeit mit Product und QA.',
    ],
    profile: [
      'Erfahrung mit PHP und MySQL.',
      'Strukturierte und selbstständige Arbeitsweise.',
      'Teamfähigkeit und klare Kommunikation.',
    ],
    benefits: [
      'Mitarbeit in einem stabilen Marktumfeld.',
      'Klare Roadmap und realistische Delivery-Ziele.',
      'Moderne Arbeitsausstattung.',
    ],
  },
]

export const formatRecruitSalary = (salary: RecruitSalary): string => {
  const format = new Intl.NumberFormat('de-DE')
  const unit = salary.period === 'year' ? '€/Jahr' : '€/Tag'
  return `${format.format(salary.min)} - ${format.format(salary.max)} ${unit}`
}
