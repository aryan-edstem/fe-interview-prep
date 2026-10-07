#!/usr/bin/env node
// Captures full-page PNGs of app routes for PR descriptions.
//
//   pnpm screenshots cart               -> docs/screenshots/cart.png
//   pnpm screenshots home cart feed     -> one PNG per route (`home` is `/`)
//   pnpm screenshots cart --name=cart-empty --width=1280
//
// Routes are bare slugs, not `/cart`: Git Bash rewrites a leading `/` into a Windows path.
// Starts its own Vite dev server on a free port, so it works from any worktree.
// One-time setup per machine: `pnpm exec playwright install chromium`.
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';
import { createServer } from 'vite';

const args = process.argv.slice(2);
const flags = Object.fromEntries(
  args.filter((a) => a.startsWith('--')).map((a) => a.slice(2).split('=')),
);
const routes = args.filter((a) => !a.startsWith('--'));
if (routes.length === 0) {
  console.error('Usage: pnpm screenshots <route> [<route>...] [--name=<file>] [--width=<px>]');
  process.exit(1);
}
if (flags.name && routes.length > 1) {
  console.error('--name only applies when capturing a single route');
  process.exit(1);
}

const outDir = path.resolve('docs/screenshots');
await mkdir(outDir, { recursive: true });

const server = await createServer({ server: { port: 0 }, logLevel: 'error' });
await server.listen();
const base = server.resolvedUrls.local[0];
const browser = await chromium.launch();

try {
  const page = await browser.newPage({
    viewport: { width: Number(flags.width ?? 1280), height: 800 },
  });
  for (const route of routes) {
    const slug = route.replace(/^\/+|\/+$/g, '');
    const target = slug === 'home' ? '' : slug;
    await page.goto(new URL(target, base).href, { waitUntil: 'networkidle' });
    const name = flags.name ?? (slug.replace(/\//g, '-') || 'home');
    const file = path.join(outDir, `${name}.png`);
    await page.screenshot({ path: file, fullPage: true });
    console.log(`saved ${path.relative(process.cwd(), file)}`);
  }
} finally {
  await browser.close();
  await server.close();
}
