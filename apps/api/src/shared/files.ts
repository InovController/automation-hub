import { readdir } from 'node:fs/promises';
import { basename, extname, join } from 'node:path';

export function sanitizeFileName(value: string) {
  return value.replace(/[<>:"/\\|?*\u0000-\u001F]/g, '-').replace(/\s+/g, ' ').trim();
}

export function toUserFileName(value: string) {
  const clean = sanitizeFileName(value || 'arquivo');
  const withoutPrefixes = clean.replace(/^(?:\d{13}-[a-z0-9]{6}-)+/i, '');
  return withoutPrefixes || clean;
}

export function uniqueStoredFileName(originalName: string) {
  const clean = sanitizeFileName(originalName || 'arquivo');
  const extension = extname(clean);
  const name = basename(clean, extension);
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${name}${extension}`;
}

export async function listFilesRecursively(root: string): Promise<string[]> {
  const entries = await readdir(root, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const fullPath = join(root, entry.name);
      if (entry.isDirectory()) {
        return listFilesRecursively(fullPath);
      }

      return [fullPath];
    }),
  );

  return files.flat();
}
