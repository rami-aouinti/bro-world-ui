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

  it('préserve les jeux de cartes déjà valides sans altération', () => {
    const apiCatalog: ApiGameCategory[] = [
      {
        id: 'arcade',
        nameKey: 'arcade.name',
        descriptionKey: 'arcade.description',
        img: '/arcade.webp',
        icon: 'mdi-rocket',
        subCategories: [
          {
            id: 'cards',
            nameKey: 'cards.name',
            descriptionKey: 'cards.description',
            img: '/cards.webp',
            icon: 'mdi-cards-outline',
            games: [
              {
                id: 'solitaire',
                key: 'solitaire',
                nameKey: 'gameCatalog.games.solitaire.name',
                descriptionKey: 'gameCatalog.games.solitaire.description',
                img: '/images/games/solitaire.webp',
                icon: 'mdi-cards-playing-outline',
                component: 'solitaire',
                supportedModes: ['ai'],
                developmentStatus: 'playable',
                mood: 'chill',
                visualStyle: 'classic',
                averageDuration: '8 min',
              },
              {
                id: 'hearts',
                key: 'hearts',
                nameKey: 'gameCatalog.games.hearts.name',
                descriptionKey: 'gameCatalog.games.hearts.description',
                img: '/images/games/hearts.webp',
                icon: 'mdi-cards-heart-outline',
                component: 'hearts',
                supportedModes: ['ai'],
                developmentStatus: 'playable',
                mood: 'strategy',
                visualStyle: 'classic',
                averageDuration: '15 min',
              },
              {
                id: 'spades',
                key: 'spades',
                nameKey: 'gameCatalog.games.spades.name',
                descriptionKey: 'gameCatalog.games.spades.description',
                img: '/images/games/spades.webp',
                icon: 'mdi-cards-spade-outline',
                component: 'spades',
                supportedModes: ['ai'],
                developmentStatus: 'playable',
                mood: 'competitive',
                visualStyle: 'classic',
                averageDuration: '18 min',
              },
            ],
          },
        ],
      },
    ]

    const mapped = mapGameCatalogFromApi(apiCatalog)
    const games = mapped[0]?.subCategories[0]?.games ?? []

    expect(games.map((game) => game.component)).toEqual(['solitaire', 'hearts', 'spades'])
    expect(games.map((game) => game.supportedModes)).toEqual([['ai'], ['ai'], ['ai']])
    expect(games.map((game) => game.developmentStatus)).toEqual(['playable', 'playable', 'playable'])
    expect(games.map((game) => game.mood)).toEqual(['chill', 'strategy', 'competitive'])
    expect(games.map((game) => game.visualStyle)).toEqual(['classic', 'classic', 'classic'])
    expect(games.map((game) => game.averageDuration)).toEqual(['8 min', '15 min', '18 min'])
  })

})
