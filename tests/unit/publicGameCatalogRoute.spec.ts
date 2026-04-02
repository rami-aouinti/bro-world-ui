import { describe, expect, it } from 'vitest'

describe('public game catalog route', () => {
  it('retourne flappy rocket en mode playable', async () => {
    ;(globalThis as any).defineEventHandler = (handler: unknown) => handler

    const module = await import('~/server/api/v1/public/game-catalog.get')
    const handler = module.default as () => any[]
    const payload = handler()

    const games = payload.flatMap(category =>
      category.subCategories.flatMap((subCategory: any) => subCategory.games),
    )
    const flappy = games.find((game: any) => game.component === 'flappy-rocket')

    expect(flappy).toBeTruthy()
    expect(flappy.supportedModes).toEqual(['ai'])
    expect(flappy.developmentStatus).toBe('playable')
  })

  it('range les jeux de cartes dans la sous-catégorie cards', async () => {
    ;(globalThis as any).defineEventHandler = (handler: unknown) => handler

    const module = await import('~/server/api/v1/public/game-catalog.get')
    const handler = module.default as () => any[]
    const payload = handler()

    const cardsSubCategory = payload
      .flatMap(category => category.subCategories)
      .find((subCategory: any) => subCategory.id === 'cards')

    expect(cardsSubCategory).toBeTruthy()
    expect(cardsSubCategory.games.map((game: any) => game.component)).toEqual([
      'solitaire',
      'hearts',
      'spades',
    ])
    expect(cardsSubCategory.games.every((game: any) => game.developmentStatus === 'playable')).toBe(true)
    expect(cardsSubCategory.games.map((game: any) => game.supportedModes)).toEqual([
      ['ai'],
      ['ai'],
      ['ai'],
    ])
  })
})
