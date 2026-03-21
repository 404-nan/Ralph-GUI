import { readFileSync, existsSync } from 'node:fs';
import { join, extname } from 'node:path';

const DIST_DIR = join(process.cwd(), 'ui/dist');

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

export function resolveStaticFile(urlPath: string): { content: Buffer; contentType: string } | null {
  const safePath = urlPath.replace(/\.\./g, '').replace(/\/+/g, '/');
  const filePath = join(DIST_DIR, safePath === '/' ? 'index.html' : safePath);

  if (!filePath.startsWith(DIST_DIR)) return null;
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
  return `<!DOCTYPE html><html><body><h1>UI Not Built</h1><p>Run 'cd ui && npm run build' to build the UI.</p></body></html>`;
}
