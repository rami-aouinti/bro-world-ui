import { sportNavigationItems } from '~/data/sports'

export type SportSection = 'overview' | 'players' | 'games' | 'teams'

interface Translator {
  (key: string): string
}

interface TranslationChecker {
  (key: string): boolean
}

const fallbackLabel = (slug: string) => slug
  .split('-')
  .filter(Boolean)
  .map(part => part.charAt(0).toUpperCase() + part.slice(1))
  .join(' ')

const metricSeed = (value: string) => value
  .split('')
  .reduce((total, char) => total + char.charCodeAt(0), 0)

export const getSportContext = (sportSlug: string, t: Translator, te: TranslationChecker) => {
  const item = sportNavigationItems.find(entry => entry.to === `/sport/${sportSlug}`)
  const label = item && te(item.key) ? t(item.key) : fallbackLabel(sportSlug)
  const seed = metricSeed(sportSlug)

  return {
    slug: sportSlug,
    label,
    icon: item?.icon ?? 'mdi-trophy-outline',
    metrics: [
      {
        label: te('app.navigation.players') ? t('app.navigation.players') : 'Players',
        value: `${120 + (seed % 180)}`,
      },
      {
        label: te('app.navigation.games') ? t('app.navigation.games') : 'Games',
        value: `${20 + (seed % 60)}`,
      },
      {
        label: te('app.navigation.teams') ? t('app.navigation.teams') : 'Teams',
        value: `${8 + (seed % 24)}`,
      },
    ],
  }
}

export const buildSportSectionRoute = (sportSlug: string, section: SportSection) => {
  if (section === 'overview') {
    return `/sport/${sportSlug}`
  }

  return `/sport/${sportSlug}/${section}`
}
