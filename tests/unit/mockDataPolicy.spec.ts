import { describe, expect, it } from 'vitest'
import { resolve } from 'node:path'

const root = resolve(process.cwd(), 'tests/fixtures/mock-data-guard')

describe('mock data policy', async () => {
  const { collectDataImports, isMockDataEnabled } = await import('../../scripts/mock-data-policy.mjs')

  it('collects ~/data imports from pages and composables', () => {
    const entries = collectDataImports(root, ['app/pages', 'app/composables'])

    expect(entries).toHaveLength(2)
    expect(entries.find(entry => entry.file.endsWith('prod-page.vue'))?.mockImports).toEqual(['~/data/platform-demo'])
    expect(entries.find(entry => entry.file.endsWith('useNav.ts'))?.mockImports).toEqual([])
  })

  it('defaults mock mode to true outside production', () => {
    const current = process.env.NUXT_PUBLIC_USE_MOCK_DATA
    const nodeEnv = process.env.NODE_ENV
    delete process.env.NUXT_PUBLIC_USE_MOCK_DATA
    process.env.NODE_ENV = 'development'

    expect(isMockDataEnabled()).toBe(true)

    process.env.NUXT_PUBLIC_USE_MOCK_DATA = current
    process.env.NODE_ENV = nodeEnv
  })
})
