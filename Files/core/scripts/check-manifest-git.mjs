import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const repoRoot = path.resolve(import.meta.dirname, '../../..');
const ref = process.argv[2] || 'HEAD';
const manifestJson = execSync(`git show ${ref}:Files/build/manifest.json`, {
  cwd: repoRoot,
  encoding: 'utf8',
  maxBuffer: 50 * 1024 * 1024,
});
const manifest = JSON.parse(manifestJson.replace(/^\uFEFF/, ''));
const paths = new Set();

for (const entry of Object.values(manifest)) {
  if (entry.file) paths.add(entry.file);
  if (Array.isArray(entry.css)) entry.css.forEach((c) => paths.add(c));
}

const missing = [];
for (const rel of paths) {
  const gitPath = `Files/build/${rel}`;
  try {
    execSync(`git cat-file -e ${ref}:${gitPath}`, { cwd: repoRoot, stdio: 'pipe' });
  } catch {
    missing.push(rel);
  }
}

if (!missing.length) {
  console.log(`OK ${ref}: ${paths.size} assets in git match manifest`);
  process.exit(0);
}

console.log(`MISSING ${missing.length}/${paths.size} for ${ref}:`);
missing.slice(0, 50).forEach((p) => console.log('  -', p));
if (missing.length > 50) console.log(`  ... and ${missing.length - 50} more`);
process.exit(1);
