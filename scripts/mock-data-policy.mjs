import { readFileSync, readdirSync, statSync } from 'node:fs'
import { extname, join, relative } from 'node:path'

const SOURCE_EXTENSIONS = new Set(['.ts', '.js', '.vue', '.mts', '.cts'])
const MOCK_DATA_PATTERNS = [
  /^~\/data\/platform-demo$/,
  /^~\/data\/platform-enhanced$/,
  /^~\/data\/settings-demo$/,
  /^~\/data\/shop-admin-demo$/,
  /^~\/data\/shop-orders$/,
  /^~\/data\/shop-product-detail$/,
  /^~\/data\/platform\/(shop|recruit|school|crm)$/,
]

const IMPORT_RE = /from\s+['\"]([^'\"]+)['\"]/g

function walk(dir, files = []) {
  for (const entry of readdirSync(dir)) {
    const fullPath = join(dir, entry)
    const stat = statSync(fullPath)

    if (stat.isDirectory()) {
      walk(fullPath, files)
      continue
    }

    if (SOURCE_EXTENSIONS.has(extname(entry))) {
      files.push(fullPath)
    }
  }

  return files
}

function extractDataImports(content) {
  const imports = []

  for (const match of content.matchAll(IMPORT_RE)) {
    const source = match[1]

    if (source.startsWith('~/data/')) {
      imports.push(source)
    }
  }

  return imports
}

function isMockImport(importPath) {
  return MOCK_DATA_PATTERNS.some(pattern => pattern.test(importPath))
}

export function collectDataImports(rootDir, scopedDirs) {
  const results = []

  for (const scopedDir of scopedDirs) {
    const files = walk(join(rootDir, scopedDir))

    for (const file of files) {
      const content = readFileSync(file, 'utf8')
      const imports = extractDataImports(content)

      if (!imports.length) {
        continue
      }

      results.push({
        file: relative(rootDir, file),
        imports,
        mockImports: imports.filter(isMockImport),
      })
    }
  }

  return results.sort((a, b) => a.file.localeCompare(b.file))
}

export function isMockDataEnabled() {
  const raw = process.env.NUXT_PUBLIC_USE_MOCK_DATA

  if (raw === undefined || raw === '') {
    return process.env.NODE_ENV !== 'production'
  }

  if (raw === 'true') return true
  if (raw === 'false') return false

  throw new Error('[mock-data] NUXT_PUBLIC_USE_MOCK_DATA must be either "true" or "false".')
}
