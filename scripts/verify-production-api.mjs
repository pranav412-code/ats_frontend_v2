/**
 * Post-build guard: production bundles must call the Render backend, not localhost.
 * Run automatically via `npm run build:production`.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const DIST = join(process.cwd(), 'dist');
const RENDER_HOST = 'resume-craft-backend-1r57.onrender.com';
const LOCAL_HOST = 'localhost:8001';

function collectJsFiles(dir) {
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...collectJsFiles(p));
    else if (entry.name.endsWith('.js')) out.push(p);
  }
  return out;
}

const files = collectJsFiles(DIST);
if (files.length === 0) {
  console.error('verify-production-api: no JS files in dist/ — run vite build first');
  process.exit(1);
}

let hasRender = false;
let hasLocal = false;

for (const file of files) {
  const text = readFileSync(file, 'utf8');
  if (text.includes(RENDER_HOST)) hasRender = true;
  if (text.includes(LOCAL_HOST)) hasLocal = true;
}

if (hasLocal) {
  console.error(
    'verify-production-api: FAILED — dist/ still references localhost:8001.\n' +
      'Production build must set VITE_API_URL to the Render backend.',
  );
  process.exit(1);
}

if (!hasRender) {
  console.error(
    'verify-production-api: FAILED — dist/ does not reference the Render backend.\n' +
      `Expected host: ${RENDER_HOST}`,
  );
  process.exit(1);
}

console.log(`verify-production-api: OK — bundle targets ${RENDER_HOST}`);
