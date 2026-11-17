/*
 * Re-captures the real site a video shows, then converts the new images to WebP.
 *   npm run snapshot -- <id> [arguments for the capture script]
 *
 * Which capture script runs:
 *   tools/snapshots/<id>/update-snapshot.js   when the video has its own (STUDIO, Astro, makeshop, Next.js sites)
 *   tools/snapshot-store.js <id>              for a Shopify store (public/videos/<id>/js/config.js has `snapshot`)
 * Afterwards: tools/webp.js <id> (images → WebP, references rewritten). Then check the video with `npm run verify -- <id>`.
 */
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const { videos, videoDir } = require('./lib');

const [id, ...rest] = process.argv.slice(2);
const known = videos().map((v) => v.id);
if (!id || !known.includes(id)) {
  console.error(`usage: npm run snapshot -- <id>\nids: ${known.join(', ')}`);
  process.exit(1);
}
const own = path.join(__dirname, 'snapshots', id, 'update-snapshot.js');
const cfg = path.join(videoDir(id), 'js', 'config.js');
let script;
if (fs.existsSync(own)) script = [own, ...rest];
else if (fs.existsSync(cfg) && /\bsnapshot\s*:/.test(fs.readFileSync(cfg, 'utf8'))) script = [path.join(__dirname, 'snapshot-store.js'), id, ...rest];
else { console.error(`${id}: no capture script (tools/snapshots/${id}/update-snapshot.js) and no \`snapshot\` in its js/config.js`); process.exit(1); }

const run = (args) => {
  console.log(`> node ${args.map((a) => path.relative(process.cwd(), a) || a).join(' ')}`);
  const r = spawnSync(process.execPath, args, { stdio: 'inherit' });
  if (r.status) process.exit(r.status);
};
run(script);
run([path.join(__dirname, 'webp.js'), id]);
