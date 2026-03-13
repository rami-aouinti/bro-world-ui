#!/usr/bin/env node
import { promises as fs } from 'node:fs';

const [basePath, headPath, outputPath] = process.argv.slice(2);

if (!basePath || !headPath || !outputPath) {
  console.error('Usage: node scripts/create-bundle-diff.mjs <base.json> <head.json> <output.md>');
  process.exit(1);
}

const base = JSON.parse(await fs.readFile(basePath, 'utf8'));
const head = JSON.parse(await fs.readFile(headPath, 'utf8'));

function format(bytes) {
  return `${(bytes / 1024).toFixed(1)} KiB`;
}

function delta(baseValue, headValue) {
  const diff = headValue - baseValue;
  const sign = diff > 0 ? '+' : '';
  return `${sign}${format(diff)}`;
}

const markdown = [
  '## Bundle diff',
  '',
  '| Metric | Base | PR | Delta |',
  '| --- | ---: | ---: | ---: |',
  `| Initial JS | ${format(base.initialJsBytes)} | ${format(head.initialJsBytes)} | ${delta(base.initialJsBytes, head.initialJsBytes)} |`,
  `| Initial CSS | ${format(base.initialCssBytes)} | ${format(head.initialCssBytes)} | ${delta(base.initialCssBytes, head.initialCssBytes)} |`,
  '',
  `Budgets: JS ≤ ${format(head.budgets.initialJsBytes)}, CSS ≤ ${format(head.budgets.initialCssBytes)}.`
].join('\n');

await fs.writeFile(outputPath, `${markdown}\n`, 'utf8');
console.log(markdown);
