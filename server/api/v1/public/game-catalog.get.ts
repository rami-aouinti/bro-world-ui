import type { ApiGameCategory } from '~/types/game'

const PUBLIC_GAME_CATALOG: ApiGameCategory[] = [
  {
    id: 'arcade',
    key: 'arcade',
    nameKey: 'gameCatalog.category.arcade.name',
    descriptionKey: 'gameCatalog.category.arcade.description',
    img: '/images/games/categories/arcade.webp',
    icon: 'mdi-rocket-launch-outline',
    subCategories: [
      {
        id: 'reflex',
        key: 'reflex',
        nameKey: 'gameCatalog.subCategory.reflex.name',
        descriptionKey: 'gameCatalog.subCategory.reflex.description',
        img: '/images/games/subcategories/reflex.webp',
        icon: 'mdi-lightning-bolt-outline',
        games: [
          {
            id: 'flappy-rocket',
            key: 'flappy-rocket',
            nameKey: 'gameCatalog.games.flappyRocket.name',
            descriptionKey: 'gameCatalog.games.flappyRocket.description',
            img: '/images/games/flappy-rocket.webp',
            icon: 'mdi-rocket-outline',
            component: 'flappy-rocket',
            supportedModes: ['ai'],
            developmentStatus: 'playable',
          },
        ],
      },
    ],
  },
]

export default defineEventHandler(() => PUBLIC_GAME_CATALOG)
