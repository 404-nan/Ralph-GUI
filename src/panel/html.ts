import { existsSync, readFileSync } from 'node:fs';
import { dirname, extname, join, normalize, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const MODULE_DIR = dirname(fileURLToPath(import.meta.url));
const PACKAGE_ROOT = resolve(MODULE_DIR, '..', '..');
const DIST_CANDIDATES = [
  join(PACKAGE_ROOT, 'dist', 'panel-ui'),
  join(PACKAGE_ROOT, 'ui', 'dist'),
];

const MIME_TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

function findPanelDistDir(): string | null {
  for (const candidate of DIST_CANDIDATES) {
    if (existsSync(candidate)) {
      return candidate;
    }
  }
  return null;
}

export function resolveStaticFile(urlPath: string): { content: Buffer; contentType: string } | null {
  const distDir = findPanelDistDir();
  if (!distDir) {
    return null;
  }

  const safePath = normalize(urlPath.replace(/\\/g, '/')).replace(/^(\.\.(\/|\\|$))+/, '');
  const filePath = join(distDir, safePath === '/' ? 'index.html' : safePath);

  if (!filePath.startsWith(distDir)) return null;
  if (!existsSync(filePath)) return null;

  const ext = extname(filePath);
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  try {
    return { content: readFileSync(filePath), contentType };
  } catch {
    return null;
  }
}

export function renderPanelHtml(): string {
  const result = resolveStaticFile('/');
  if (result) return result.content.toString('utf-8');
  return `<!DOCTYPE html><html><body><h1>UI Not Built</h1><p>Build the panel UI so Ralph can serve dist/panel-ui or ui/dist.</p></body></html>`;
}
