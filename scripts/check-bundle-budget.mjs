#!/usr/bin/env node
import { promises as fs } from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);

function getArg(flag, fallback) {
  const index = args.indexOf(flag);
  if (index === -1) return fallback;
  return args[index + 1] ?? fallback;
}

const rootDir = getArg('--dir', path.resolve('.output/public/_nuxt'));
const budgetsPath = getArg('--budgets', path.resolve('perf/bundle-budgets.json'));
const outputPath = getArg('--output', '');
const enforce = args.includes('--enforce');

async function listFiles(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = await Promise.all(entries.map(async (entry) => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) return listFiles(fullPath);
    return fullPath;
  }));

  return files.flat();
}

function formatKb(bytes) {
  return `${(bytes / 1024).toFixed(1)} KiB`;
}

const budgets = JSON.parse(await fs.readFile(budgetsPath, 'utf8'));

let files = [];
try {
  files = await listFiles(rootDir);
} catch {
  console.error(`Unable to read bundle directory: ${rootDir}`);
  process.exit(1);
}

const jsFiles = files.filter((file) => file.endsWith('.js'));
const cssFiles = files.filter((file) => file.endsWith('.css'));

const sumSizes = async (collection) => {
  let sum = 0;
  for (const file of collection) {
    const stat = await fs.stat(file);
    sum += stat.size;
  }
  return sum;
};

const initialJsBytes = await sumSizes(jsFiles);
const initialCssBytes = await sumSizes(cssFiles);

const report = {
  initialJsBytes,
  initialCssBytes,
  jsFiles: jsFiles.length,
  cssFiles: cssFiles.length,
  budgets: {
    initialJsBytes: budgets.initialJsBytes,
    initialCssBytes: budgets.initialCssBytes
  }
};

if (outputPath) {
  await fs.writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
}

console.log('Bundle budget report');
console.log(`- Initial JS: ${formatKb(initialJsBytes)} (${jsFiles.length} files)`);
console.log(`- Initial CSS: ${formatKb(initialCssBytes)} (${cssFiles.length} files)`);
console.log(`- Budget JS: ${formatKb(budgets.initialJsBytes)}`);
console.log(`- Budget CSS: ${formatKb(budgets.initialCssBytes)}`);

const errors = [];
if (initialJsBytes > budgets.initialJsBytes) {
  errors.push(`Initial JS budget exceeded by ${formatKb(initialJsBytes - budgets.initialJsBytes)}`);
}
if (initialCssBytes > budgets.initialCssBytes) {
  errors.push(`Initial CSS budget exceeded by ${formatKb(initialCssBytes - budgets.initialCssBytes)}`);
}

if (errors.length > 0) {
  for (const error of errors) {
    console.error(`❌ ${error}`);
  }
  if (enforce) {
    process.exit(1);
  }
}
