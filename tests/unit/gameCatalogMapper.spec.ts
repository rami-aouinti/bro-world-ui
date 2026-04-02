import { describe, expect, it } from 'vitest'
import { mapGameCatalogFromApi } from '~/app/utils/gameCatalogMapper'
import type { ApiGameCategory } from '~/app/types/game'

describe('gameCatalogMapper', () => {
  it('mappe solo vers ai et marque playable si component + modes sont présents', () => {
    const apiCatalog: ApiGameCategory[] = [
      {
        id: 'arcade',
        nameKey: 'arcade.name',
        descriptionKey: 'arcade.description',
        img: '/arcade.webp',
        icon: 'mdi-rocket',
        subCategories: [
          {
            id: 'reflex',
            nameKey: 'reflex.name',
            descriptionKey: 'reflex.description',
            img: '/reflex.webp',
            icon: 'mdi-lightning-bolt',
            games: [
              {
                id: 'flappy-rocket',
                nameKey: 'flappy.name',
                descriptionKey: 'flappy.description',
                img: '/flappy.webp',
                icon: 'mdi-rocket-outline',
                component: 'flappy-rocket',
                supportedModes: ['solo'],
              },
            ],
          },
        ],
      },
    ]

    const mapped = mapGameCatalogFromApi(apiCatalog)
    const game = mapped[0]?.subCategories[0]?.games[0]

    expect(game?.supportedModes).toEqual(['ai'])
    expect(game?.availableModes).toEqual(['ai'])
    expect(game?.developmentStatus).toBe('playable')
  })
})
