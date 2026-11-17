/*
 * Converts the images of the site to WebP and rewrites every reference to them.
 *   npm run webp                        everything under public/ (video assets, thumbnails, icons, cursors)
 *   npm run webp -- nissin-store        one video's folder (several ids are fine) — tools/snapshot.js runs this after a capture
 *   npm run webp -- --dry               only report what would change
 *
 * - Wider than 1920 px (a CMS's full-size uploads) → scaled to 1920 px wide: the videos never draw wider than that.
 * - JPEG / AVIF → lossy WebP (quality 80). PNG → lossless or lossy (quality 86), whichever is right for the picture:
 *   lossless when it is at most 15 % larger (logos, UI graphics), lossy otherwise (photos saved as PNG).
 *   GIF → WebP (animated GIFs stay animated). Files that already hold WebP data under another extension are renamed.
 * - The new file is <name>.webp next to the old one (<name>.<ext>.webp when two images would get the same name).
 * - References are rewritten in every text file under public/ (HTML, JS — including the captured snapshots —, CSS, JSON,
 *   SVG) when they point at a converted file: relative to the file, to the video's folder (the snapshots' base), or to public/.
 *   Paths that do not point at a local file are left alone — e.g. the image paths inside the source code a video types.
 * - Kept as they are: favicons (public/shared/favicons, public/thumbs/sites/*-icon.*, *-logo.*) — they are shown as favicons.
 * A reference to an image an earlier run already converted (the file is gone, its .webp is there) is repaired as well.
 * Prints the paths that look like local images but could not be resolved (built at run time, e.g. `${name}.png`):
 * check those by hand, then `npm run verify` reports any image a video still cannot load.
 */
const fs = require('fs');
const path = require('path');
const { PUBLIC, ROOT, videoDir } = require('./lib');

let sharp;
try { sharp = require('sharp'); } catch (e) { console.error('sharp がありません。`npm install` を実行してください。'); process.exit(1); }

const DRY = process.argv.includes('--dry');
const ids = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const RASTER = /\.(jpe?g|png|gif|avif)$/i;
const TEXT = /\.(html?|m?js|css|json|svg|xml|webmanifest)$/i;
const KEEP = [path.join(PUBLIC, 'shared', 'favicons') + path.sep];
const keep = (f) => KEEP.some((k) => f.startsWith(k)) || /[\\/]thumbs[\\/]sites[\\/][^\\/]+-(icon|logo)\.[a-z]+$/i.test(f);

const walk = (d) => (fs.existsSync(d) ? fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)])) : []);
const kindOf = (buf) => {
  const h = buf.subarray(0, 12);
  if (h.toString('ascii', 0, 4) === 'RIFF' && h.toString('ascii', 8, 12) === 'WEBP') return 'webp';
  if (h[0] === 0xff && h[1] === 0xd8) return 'jpeg';
  if (h.toString('hex', 0, 4) === '89504e47') return 'png';
  if (h.toString('ascii', 0, 3) === 'GIF') return 'gif';
  if (h.toString('ascii', 4, 8) === 'ftyp') return 'avif';
  return 'other';
};

/** the videos draw at most 1920 px wide (1 px per pixel): wider originals (a CMS's full-size uploads) are scaled down to that */
const MAX_W = 1920;
async function encode(file) {
  let buf = fs.readFileSync(file);
  const kind = kindOf(buf);
  if (kind === 'other') return null;
  const wide = kind !== 'gif' && ((await sharp(buf, { limitInputPixels: false }).metadata()).width || 0) > MAX_W;
  if (wide) buf = await sharp(buf, { limitInputPixels: false }).resize({ width: MAX_W }).toFormat(kind === 'png' ? 'png' : 'webp', kind === 'png' ? {} : { quality: 82 }).toBuffer();
  if (kind === 'webp') return { data: buf, how: wide ? 'scaled to 1920 px' : 'renamed (already WebP)' };
  const opts = { limitInputPixels: false, animated: kind === 'gif' };
  if (kind === 'png') {
    const [lossless, lossy] = await Promise.all([
      sharp(buf, opts).webp({ lossless: true, effort: 5 }).toBuffer(),
      sharp(buf, opts).webp({ quality: 86, alphaQuality: 92, effort: 5, smartSubsample: true }).toBuffer(),
    ]);
    return lossless.length <= lossy.length * 1.15 ? { data: lossless, how: 'lossless' } : { data: lossy, how: 'lossy q86' };
  }
  if (kind === 'gif') {
    const data = await sharp(buf, opts).webp({ lossless: true, effort: 5 }).toBuffer();
    return { data, how: 'lossless' };
  }
  const data = await sharp(buf, opts).webp({ quality: 80, effort: 5, smartSubsample: true }).toBuffer();
  return { data, how: 'lossy q80' };
}

(async () => {
  const roots = ids.length ? ids.map(videoDir) : [PUBLIC];
  for (const r of roots) if (!fs.existsSync(r)) { console.error('not found: ' + path.relative(ROOT, r)); process.exit(1); }
  const files = roots.flatMap(walk).filter((f) => RASTER.test(f) && !keep(f));

  // plan: old → new (unique names). A <name>.webp that already exists next to the file is the same picture in the
  // site's own WebP (a <picture> with avif / webp / jpg sources): the references move to it and nothing is encoded.
  const plan = new Map();
  const alias = new Set();
  const used = new Set();
  for (const f of files) {
    let to = f.replace(RASTER, '.webp');
    if (fs.existsSync(to)) {
      const [a, b] = await Promise.all([sharp(f, { limitInputPixels: false }).metadata(), sharp(to).metadata()]).catch(() => [{}, {}]);
      if (a.width && a.width === b.width && a.height === b.height) { plan.set(f, to); alias.add(f); continue; }
      to = f + '.webp';
    } else if (used.has(to.toLowerCase())) to = f + '.webp';
    used.add(to.toLowerCase());
    plan.set(f, to);
  }
  console.log(`${files.length} images to convert${DRY ? ' (dry run)' : ''}`);

  // encode (4 at a time)
  let before = 0, after = 0, done = 0;
  const failed = [];
  const queue = [...plan.keys()].filter((f) => !alias.has(f));
  for (const f of alias) before += fs.statSync(f).size;
  await Promise.all(Array.from({ length: 4 }, async () => {
    for (let f; (f = queue.shift());) {
      try {
        const r = await encode(f);
        if (!r) { failed.push(`${path.relative(ROOT, f)} (not an image)`); plan.delete(f); continue; }
        before += fs.statSync(f).size; after += r.data.length;
        if (!DRY) fs.writeFileSync(plan.get(f), r.data);
      } catch (e) { failed.push(`${path.relative(ROOT, f)} (${e.message})`); plan.delete(f); }
      if (++done % 200 === 0) console.log(`  ${done} / ${files.length}`);
    }
  }));

  // rewrite references in the text files: a video's images are only referenced from its own folder; shared images and
  // thumbnails from anywhere under public/
  const byPath = new Map([...plan].map(([a, b]) => [path.normalize(a).toLowerCase(), b]));
  // A path ends at one of these characters (& too: inside HTML entities, url(&#34;…&#34;)) and is made of anything else.
  // Found from its extension backwards, so the scan stays linear on the multi-MB snapshots.
  const STOP = new Set([...' \t\r\n"\'`()<>,;=\\|{}*&']);
  const EXT = /\.(?:jpe?g|png|gif|avif)(?=[\s"'`()<>,;?#&\\]|$)/gi;
  const replaceRefs = (src, fn) => {
    let out = '', last = 0;
    for (const m of src.matchAll(EXT)) {
      const end = m.index + m[0].length;
      let start = m.index;
      while (start > last && !STOP.has(src[start - 1])) start--;
      if (start === m.index) continue;
      out += src.slice(last, start) + fn(src.slice(start, end));
      last = end;
    }
    return last ? out + src.slice(last) : src;
  };
  const unresolved = new Map();
  let changedFiles = 0, changedRefs = 0, repaired = 0;
  for (const t of (ids.length ? roots : [PUBLIC]).flatMap(walk).filter((f) => TEXT.test(f))) {
    const src = fs.readFileSync(t, 'utf8');
    const m = path.relative(PUBLIC, t).split(path.sep);
    const videoRoot = roots.find((r) => r !== PUBLIC && t.startsWith(r + path.sep)) || (m[0] === 'videos' ? path.join(PUBLIC, 'videos', m[1]) : path.join(PUBLIC, 'videos', '_'));
    let n = 0;
    const out = replaceRefs(src, (ref) => {
      if (/^(https?:|data:|blob:)?\/\//i.test(ref) || /^(https?|data|blob):/i.test(ref)) return ref;
      let clean = ref.replace(/&amp;/g, '&');
      try { clean = decodeURI(clean); } catch (e) { /* keep as is */ }
      const bases = clean.startsWith('/') ? [PUBLIC] : [path.dirname(t), videoRoot];
      for (const b of bases) {
        const abs = path.normalize(path.join(b, clean));
        const to = byPath.get(abs.toLowerCase());
        if (to) { n++; return to.endsWith(path.basename(clean) + '.webp') ? ref + '.webp' : ref.replace(RASTER, '.webp'); }
        // converted by an earlier run: the image is gone and its .webp is there (a reference that run could not see)
        if ((abs.startsWith(PUBLIC) || roots.some((r) => abs.startsWith(r))) && !fs.existsSync(abs) && fs.existsSync(abs.replace(RASTER, '.webp'))) { n++; repaired++; return ref.replace(RASTER, '.webp'); }
      }
      if (/[a-z0-9_-]\.(jpe?g|png|gif|avif)$/i.test(clean) && !/^\$\{|^\./.test(path.basename(clean))) {
        const k = path.relative(ROOT, t);
        if (!unresolved.has(k)) unresolved.set(k, new Set());
        unresolved.get(k).add(ref.length > 90 ? '…' + ref.slice(-90) : ref);
      }
      return ref;
    });
    if (n) { changedFiles++; changedRefs += n; if (!DRY) fs.writeFileSync(t, out); }
  }

  if (!DRY) for (const f of plan.keys()) fs.rmSync(f);
  const mb = (b) => (b / 1048576).toFixed(1) + ' MB';
  console.log(`converted ${plan.size} images: ${mb(before)} → ${mb(after)} (${before ? Math.round((1 - after / before) * 100) : 0} % smaller)`);
  console.log(`rewrote ${changedRefs} references in ${changedFiles} files${repaired ? ` (${repaired} of them to images an earlier run converted)` : ''}`);
  if (failed.length) console.log('could not convert:\n  ' + failed.join('\n  '));
  if (unresolved.size) {
    console.log('image paths that do not point at a file (built at run time, remote, or text shown on screen) — check by hand:');
    for (const [k, set] of unresolved) console.log(`  ${k}: ${[...set].slice(0, 6).join('  ')}${set.size > 6 ? `  (+${set.size - 6})` : ''}`);
  }
})().catch((e) => { console.error(e); process.exit(1); });
