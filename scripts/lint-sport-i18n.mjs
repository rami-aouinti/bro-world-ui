import { readFile } from 'node:fs/promises'
import path from 'node:path'

const TARGET_GLOBS = [
  'app/pages/sport/[sport]/games.vue',
  'app/pages/sport/football/world-cup/index.vue',
  'app/components/sport/SportGameDetailsPanel.vue',
  'app/components/sport/SportLeaguesList.vue',
  'app/components/sport/SportStandingsPanel.vue',
  'app/components/sport/SportTeamPanel.vue',
  'app/components/sport/sportContext.ts',
]

const forbiddenLiterals = [
  "'Players'", "'Games'", "'Teams'",
  "'Aucun match sélectionné'", "'Aucune équipe sélectionnée'",
  "'Unknown team'", "'Unknown league'", "'Loading...'",
]

const hardcodedTemplate = />(\s*[A-Za-zÀ-ÿ][^<{\n]*?)</g

function isAllowedTemplateText(text) {
  const value = text.trim()
  if (!value) return true
  if (value.startsWith('{{') || value.includes('{{')) return true
  if (/^[-–—•@#:.()]+$/.test(value)) return true
  return false
}

const errors = []

for (const relFile of TARGET_GLOBS) {
  const fullPath = path.resolve(relFile)
  const content = await readFile(fullPath, 'utf8')

  for (const literal of forbiddenLiterals) {
    if (content.includes(literal)) {
      errors.push(`${relFile}: forbidden readable fallback ${literal}`)
    }
  }

  if (relFile.endsWith('.vue')) {
    const template = content.match(/<template>[\s\S]*<\/template>/)?.[0] || ''
    for (const match of template.matchAll(hardcodedTemplate)) {
      const text = match[1]
      if (!isAllowedTemplateText(text)) {
        errors.push(`${relFile}: hardcoded UI text node "${text.trim()}"`)
      }
    }
  }
}

if (errors.length) {
  console.error('sport i18n lint failed:')
  for (const error of errors) {
    console.error(`- ${error}`)
  }
  process.exit(1)
}

console.log('sport i18n lint passed.')
