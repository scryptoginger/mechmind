#!/usr/bin/env node
// Post-build for `expo export --platform web`.
//
// Expo's web export emits a minimal index.html that doesn't reference our
// PWA manifest, and it doesn't copy files from public/. This script:
//   1. Copies every file under public/ into dist/ at the same path.
//   2. Injects <link rel="manifest"> + a theme-color meta into dist/index.html.
//
// Idempotent — safe to re-run.

import { promises as fs } from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const ROOT = process.cwd();
const PUBLIC_DIR = path.join(ROOT, 'public');
const DIST_DIR = path.join(ROOT, 'dist');

async function exists(p) {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

async function copyDir(src, dst) {
  await fs.mkdir(dst, { recursive: true });
  const entries = await fs.readdir(src, { withFileTypes: true });
  for (const entry of entries) {
    const s = path.join(src, entry.name);
    const d = path.join(dst, entry.name);
    if (entry.isDirectory()) {
      await copyDir(s, d);
    } else {
      await fs.copyFile(s, d);
    }
  }
}

async function injectManifest() {
  const indexPath = path.join(DIST_DIR, 'index.html');
  if (!(await exists(indexPath))) {
    console.warn('[postbuild] dist/index.html not found — did expo export run?');
    return;
  }
  let html = await fs.readFile(indexPath, 'utf8');
  if (html.includes('rel="manifest"')) {
    return; // already injected
  }
  const inject = [
    '<link rel="manifest" href="/manifest.webmanifest">',
    '<meta name="theme-color" content="#0b0f14">',
    '<meta name="apple-mobile-web-app-capable" content="yes">',
    '<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">',
    '<meta name="apple-mobile-web-app-title" content="MechMind">',
  ].join('\n    ');
  html = html.replace('</head>', `    ${inject}\n  </head>`);
  await fs.writeFile(indexPath, html, 'utf8');
  console.log('[postbuild] injected manifest + PWA meta tags into dist/index.html');
}

async function main() {
  if (!(await exists(DIST_DIR))) {
    console.error('[postbuild] dist/ does not exist — run `expo export` first.');
    process.exit(1);
  }
  if (await exists(PUBLIC_DIR)) {
    await copyDir(PUBLIC_DIR, DIST_DIR);
    console.log('[postbuild] copied public/ → dist/');
  }
  await injectManifest();
}

main().catch((e) => {
  console.error('[postbuild] failed:', e);
  process.exit(1);
});
