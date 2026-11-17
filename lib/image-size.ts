/*
 * Width / height of a WebP file in public/ (read from its header at build time), so next/image gets the exact size
 * and the hover-scroll speed of the site previews is known before the image loads.
 */
import 'server-only';
import fs from 'node:fs';
import path from 'node:path';

const cache = new Map<string, { width: number; height: number } | null>();

export function webpSize(publicPath: string): { width: number; height: number } | null {
  if (cache.has(publicPath)) return cache.get(publicPath)!;
  let size: { width: number; height: number } | null = null;
  try {
    const fd = fs.openSync(path.join(process.cwd(), 'public', publicPath), 'r');
    const b = Buffer.alloc(30);
    fs.readSync(fd, b, 0, 30, 0);
    fs.closeSync(fd);
    if (b.toString('ascii', 0, 4) === 'RIFF' && b.toString('ascii', 8, 12) === 'WEBP') {
      const kind = b.toString('ascii', 12, 16);
      if (kind === 'VP8 ') size = { width: b.readUInt16LE(26) & 0x3fff, height: b.readUInt16LE(28) & 0x3fff };
      else if (kind === 'VP8L') { const v = b.readUInt32LE(21); size = { width: (v & 0x3fff) + 1, height: ((v >> 14) & 0x3fff) + 1 }; }
      else if (kind === 'VP8X') size = { width: b.readUIntLE(24, 3) + 1, height: b.readUIntLE(27, 3) + 1 };
    }
  } catch {
    size = null;
  }
  cache.set(publicPath, size);
  return size;
}
