import { isAbsolute, relative, resolve, sep } from 'node:path';

export function toPortableDisplayPath(rootDir: string, filePath: string): string {
  const trimmed = filePath.trim();
  if (!trimmed) {
    return '';
  }

  const absolutePath = isAbsolute(trimmed) ? trimmed : resolve(rootDir, trimmed);
  const relativePath = relative(rootDir, absolutePath);
  if (!relativePath || relativePath.startsWith('..') || isAbsolute(relativePath)) {
    return trimmed;
  }

  return relativePath.split(sep).join('/');
}
