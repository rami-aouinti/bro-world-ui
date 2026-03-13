import { writeFileSync } from 'node:fs'
import { cwd } from 'node:process'
import { collectDataImports } from './mock-data-policy.mjs'

const rootDir = cwd()
const scopedDirs = ['app/pages', 'app/composables']
const outputPath = 'docs/mock-data-usage.md'
const rows = collectDataImports(rootDir, scopedDirs)

const byImport = new Map()
for (const row of rows) {
  for (const imported of row.imports) {
    const files = byImport.get(imported) ?? []
    files.push(row.file)
    byImport.set(imported, files)
  }
}

const lines = []
lines.push('# Cartographie de l’usage de `app/data/**`')
lines.push('')
lines.push('- Périmètre scanné: `app/pages/**`, `app/composables/**`.')
lines.push('- Commande: `node scripts/map-mock-data-usage.mjs`.')
lines.push('- Total des fichiers consommateurs: ' + rows.length + '.')
lines.push('- Total des modules `~/data/*` importés: ' + byImport.size + '.')
lines.push('')

for (const [importPath, files] of [...byImport.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
  lines.push(`## ${importPath}`)
  lines.push('')
  for (const file of [...new Set(files)].sort()) {
    lines.push(`- \`${file}\``)
  }
  lines.push('')
}

writeFileSync(outputPath, lines.join('\n'))
console.log(`[mock-data-map] Wrote ${outputPath}`)
