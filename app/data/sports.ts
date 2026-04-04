export interface SportNavigationItem {
  key: string
  to: string
  icon: string
  image: string
}

export const sportNavigationItems: SportNavigationItem[] = [
  {
    key: 'app.navigation.afl',
    to: '/sport/afl',
    icon: 'mdi-football-australian',
    image: '/images/placeholders/platform-media-fallback.svg',
  },
  {
    key: 'app.navigation.baseball',
    to: '/sport/baseball',
    icon: 'mdi-baseball',
    image: '/images/placeholders/platform-media-fallback.svg',
  },
  {
    key: 'app.navigation.basketball',
    to: '/sport/basketball',
    icon: 'mdi-basketball',
    image: '/images/placeholders/platform-media-fallback.svg',
  },
  {
    key: 'app.navigation.football',
    to: '/sport/football',
    icon: 'mdi-soccer',
    image: '/images/placeholders/platform-media-fallback.svg',
  },
  {
    key: 'app.navigation.formula1',
    to: '/sport/formula-1',
    icon: 'mdi-racing-helmet',
    image: '/images/placeholders/platform-media-fallback.svg',
  },
  {
    key: 'app.navigation.handball',
    to: '/sport/handball',
    icon: 'mdi-handball',
    image: '/images/placeholders/platform-media-fallback.svg',
  },
  {
    key: 'app.navigation.hockey',
    to: '/sport/hockey',
    icon: 'mdi-hockey-puck',
    image: '/images/placeholders/platform-media-fallback.svg',
  },
  {
    key: 'app.navigation.mma',
    to: '/sport/mma',
    icon: 'mdi-boxing-glove',
    image: '/images/placeholders/platform-media-fallback.svg',
  },
  {
    key: 'app.navigation.nba',
    to: '/sport/nba',
    icon: 'mdi-basketball',
    image: '/images/placeholders/platform-media-fallback.svg',
  },
  {
    key: 'app.navigation.nfl',
    to: '/sport/nfl',
    icon: 'mdi-football',
    image: '/images/placeholders/platform-media-fallback.svg',
  },
  {
    key: 'app.navigation.rugby',
    to: '/sport/rugby',
    icon: 'mdi-football-rugby',
    image: '/images/placeholders/platform-media-fallback.svg',
  },
  {
    key: 'app.navigation.volleyball',
    to: '/sport/volleyball',
    icon: 'mdi-volleyball',
    image: '/images/placeholders/platform-media-fallback.svg',
  },
]
