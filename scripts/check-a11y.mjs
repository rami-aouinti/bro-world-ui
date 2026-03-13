import { readdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'

const roots = [
  'app/components/ui',
  'app/components/platform',
  'app/pages',
]

const files = []

const walk = async (dir) => {
  const entries = await readdir(dir, { withFileTypes: true })
  for (const entry of entries) {
    const fullPath = join(dir, entry.name)
    if (entry.isDirectory()) {
      await walk(fullPath)
    }
    else if (entry.isFile() && entry.name.endsWith('.vue')) {
      files.push(fullPath)
    }
  }
}

for (const root of roots) {
  await walk(root)
}

const issues = []

for (const file of files) {
  const source = await readFile(file, 'utf8')

  const tagRegex = /<v-btn\b[\s\S]*?(?:\/>|<\/v-btn>)/g
  for (const match of source.matchAll(tagRegex)) {
    const tag = match[0]
    const isIconOnly = /(?:^|\s)icon(?:\s*=|\s|>)/.test(tag) && !/<\/v-btn>/.test(tag)
    if (isIconOnly && !/\baria-label\s*=/.test(tag)) {
      issues.push(`${file}: icon-only v-btn missing aria-label`)
    }
  }

  for (const match of source.matchAll(/<v-dialog\b[\s\S]*?>/g)) {
    const tag = match[0]
    if (!/\bretain-focus\b/.test(tag)) {
      issues.push(`${file}: v-dialog should set retain-focus`)
    }
  }
}

if (issues.length) {
  console.error('A11y checks failed:\n' + issues.join('\n'))
  process.exit(1)
}

console.log(`A11y checks passed for ${files.length} files.`)
