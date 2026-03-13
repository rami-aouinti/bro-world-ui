import { cwd } from 'node:process'
import { collectDataImports, isMockDataEnabled } from './mock-data-policy.mjs'

const rootDir = cwd()
const scopedDirs = ['app/pages', 'app/composables']
const importsMap = collectDataImports(rootDir, scopedDirs)
const hasMockData = importsMap.some(entry => entry.mockImports.length > 0)

if (!hasMockData) {
  console.log('[mock-data-guard] No ~/data imports found in app/pages and app/composables.')
  process.exit(0)
}

if (isMockDataEnabled()) {
  console.log('[mock-data-guard] Mock data mode enabled (NUXT_PUBLIC_USE_MOCK_DATA=true). Guard skipped.')
  process.exit(0)
}

console.error('[mock-data-guard] Mock data imports are forbidden when NUXT_PUBLIC_USE_MOCK_DATA=false.')
for (const entry of importsMap.filter(item => item.mockImports.length > 0)) {
  console.error(`- ${entry.file}`)
  for (const mockImport of entry.mockImports) {
    console.error(`  • ${mockImport}`)
  }
}
process.exit(1)
