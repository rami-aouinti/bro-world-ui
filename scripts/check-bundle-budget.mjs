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

async function readJsonIfExists(filePath) {
  try {
    const raw = await fs.readFile(filePath, 'utf8');
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function collectInitialAssetsFromManifest(manifest) {
  if (!manifest || typeof manifest !== 'object' || Array.isArray(manifest)) {
    return null;
  }

  const entries = Object.values(manifest).filter((chunk) => chunk?.isEntry && typeof chunk?.file === 'string');
  if (entries.length === 0) {
    return null;
  }

  const jsAssets = new Set();
  const cssAssets = new Set();
  const visited = new Set();
  const values = Object.values(manifest);

  const byFile = new Map(values
    .filter((chunk) => typeof chunk?.file === 'string')
    .map((chunk) => [chunk.file, chunk]));

  const byKey = new Map(Object.entries(manifest));

  function visitChunk(target) {
    if (!target || typeof target !== 'object' || typeof target.file !== 'string') return;
    if (visited.has(target.file)) return;
    visited.add(target.file);

    if (target.file.endsWith('.js')) {
      jsAssets.add(target.file);
    } else if (target.file.endsWith('.css')) {
      cssAssets.add(target.file);
    }

    for (const cssFile of target.css || []) {
      if (typeof cssFile === 'string') {
        cssAssets.add(cssFile);
      }
    }

    for (const importRef of target.imports || []) {
      if (typeof importRef !== 'string') continue;
      const imported = byKey.get(importRef) || byFile.get(importRef);
      visitChunk(imported);
    }
  }

  for (const entry of entries) {
    visitChunk(entry);
  }

  return {
    jsAssets: [...jsAssets],
    cssAssets: [...cssAssets]
  };
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

const manifestPath = path.join(rootDir, 'manifest.json');
const manifest = await readJsonIfExists(manifestPath);
const manifestAssets = collectInitialAssetsFromManifest(manifest);

const selectedJsFiles = manifestAssets
  ? manifestAssets.jsAssets.map((file) => path.join(rootDir, file)).filter((file) => jsFiles.includes(file))
  : jsFiles;

const selectedCssFiles = manifestAssets
  ? manifestAssets.cssAssets.map((file) => path.join(rootDir, file)).filter((file) => cssFiles.includes(file))
  : cssFiles;

const sumSizes = async (collection) => {
  let sum = 0;
  for (const file of collection) {
    const stat = await fs.stat(file);
    sum += stat.size;
  }
  return sum;
};

const initialJsBytes = await sumSizes(selectedJsFiles);
const initialCssBytes = await sumSizes(selectedCssFiles);

const report = {
  initialJsBytes,
  initialCssBytes,
  jsFiles: selectedJsFiles.length,
  cssFiles: selectedCssFiles.length,
  budgets: {
    initialJsBytes: budgets.initialJsBytes,
    initialCssBytes: budgets.initialCssBytes
  }
};

if (outputPath) {
  await fs.writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
}

console.log('Bundle budget report');
if (manifestAssets) {
  console.log(`- Source: ${path.relative(process.cwd(), manifestPath)}`);
}
console.log(`- Initial JS: ${formatKb(initialJsBytes)} (${selectedJsFiles.length} files)`);
console.log(`- Initial CSS: ${formatKb(initialCssBytes)} (${selectedCssFiles.length} files)`);
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
