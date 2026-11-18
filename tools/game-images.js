/*
 * The images of the games (ゲーム tab): sample images now, AI-generated pictures later — and the prompt sheets.
 *   npm run game-images                    every game in public/games/ that has an images.json
 *   npm run game-images -- shogi nanpure   some games
 *   npm run game-images -- --samples       redraw every sample image (the generated pictures you added are kept)
 *
 * Each game lists its pictures in public/games/<id>/images.json (schema below). For every entry this tool:
 *   1. takes a picture you made with an AI tool and saved as  public/games/<id>/img/<name>.png | .jpg | .jpeg | .webp
 *      (any size): resizes it to the entry's w × h (cover crop; `fit: "contain"` keeps it whole), cuts out a plain background
 *      when the entry needs transparency (alpha: true) and the picture has none, and writes img/<name>.webp (the source is removed);
 *   2. otherwise, when img/<name>.webp is missing or is still a sample: draws the sample image (画像サンプル) in its place;
 *   3. writes docs/games/prompts/<id>.md — the prompt sheet (recommended tool, prompt, negative prompt, a prompt for any other tool)
 *      and docs/games/prompts/README.md — every game, how many pictures are still samples, which tools are used.
 * Each sample carries a marker in its EXIF (ImageDescription "game-images-sample:<hash of what it shows>"), so a picture you saved
 * over it is never mistaken for a sample, and a sample is redrawn when its size, colours or label change in images.json.
 *
 * images.json:
 * {
 *   "title": "縁側将棋",                       the game's name (heading of the prompt sheet)
 *   "style": "…",                             art direction shared by all pictures of the game (Japanese)
 *   "images": [{
 *     "name": "bg-room",                      → img/bg-room.webp
 *     "w": 1600, "h": 900,                    size used by the game (px)
 *     "kind": "bg",                           bg | key | cg | portrait | sprite | item | card | icon | tile | ui
 *     "alpha": false,                         transparent background needed (sprites, portraits, items)
 *     "shape": "rect",                        sample's shape when alpha: circle | ellipse | round | figure | card | rect
 *     "fit": "cover",                         how a generated picture of another size is fitted: cover (crop) | contain
 *     "colors": ["#6b4f2a", "#2b1d10"],       sample's colours (match the game's palette)
 *     "label": "背景：縁側のある和室",          shown on the sample, heading of the sheet
 *     "short": "和室",                        (optional) shorter label for small samples
 *     "use": "対局画面の背景",                  where the game shows it
 *     "ja": "…",                              what the picture shows, in Japanese
 *     "tool": "midjourney",                   recommended tool (keys of TOOLS below)
 *     "prompt": "…",                          prompt in that tool's own syntax (parameters included)
 *     "negative": "…",                        (optional) negative prompt / things to exclude
 *     "generic": "…",                         plain English prompt for any other tool
 *     "ref": "portrait-hina",                 (optional) name of another entry to use as the reference image (same character…)
 *     "notes": "…"                            (optional) tips (consistency, crop, how to cut out the background…)
 *   }]
 * }
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { ROOT, PUBLIC, CHROME, puppeteer } = require('./lib');

let sharp;
try { sharp = require('sharp'); } catch (e) { console.error('sharp がありません。`npm install` を実行してください。'); process.exit(1); }
// sharp keeps recently read files open (its cache); on Windows that blocks rewriting a sample it just inspected
sharp.cache(false);

/** the AI tools a prompt can be written for — name, where, and how to set the size / transparency */
const TOOLS = {
  midjourney: { name: 'Midjourney（v7）', url: 'https://www.midjourney.com/', size: '`--ar 16:9` などの縦横比パラメーターで指定（解像度はアップスケールで調整）', alpha: '透過はできないので、単色の背景で作って背景を切り抜きます（このツールが自動で切り抜きます）' },
  niji: { name: 'niji・journey（Midjourney の `--niji 6`）', url: 'https://nijijourney.com/', size: '`--ar 2:3` などの縦横比パラメーター', alpha: '透過はできないので、単色の背景で作って背景を切り抜きます（自動で切り抜きます）' },
  chatgpt: { name: 'ChatGPT（画像生成 / GPT Image）', url: 'https://chatgpt.com/', size: '「横長 1536×1024」「正方形 1024×1024」「縦長 1024×1536」から近いものを指示', alpha: '「背景を透明にした PNG で」と指示すると透過 PNG で出せます' },
  gemini: { name: 'Gemini（画像生成 / Imagen・Nano Banana）', url: 'https://gemini.google.com/', size: '縦横比を文章で指示（16:9 など）', alpha: '透過はできないので、単色の背景で作ります（自動で切り抜きます）。同じキャラクターの表情違いは、元の画像を添付して「この人物の表情だけを変えて」と頼むと揃います' },
  sdxl: { name: 'Stable Diffusion XL（ComfyUI / Fooocus / AUTOMATIC1111）', url: 'https://stability.ai/', size: '幅・高さを直接指定（SDXL は 1024×1024・1344×768・768×1344 など約 100 万画素で）', alpha: '単色の背景で作って切り抜くか、rembg 等の背景除去を使います' },
  flux: { name: 'FLUX.1（dev / pro）', url: 'https://bfl.ai/', size: '幅・高さを直接指定（64 の倍数）', alpha: '単色の背景で作って切り抜きます' },
  firefly: { name: 'Adobe Firefly（Image 4）', url: 'https://firefly.adobe.com/', size: '縦横比を画面で選択', alpha: '生成後に Photoshop / Adobe Express の「背景を削除」で透過にできます' },
  ideogram: { name: 'Ideogram（3.0）', url: 'https://ideogram.ai/', size: '縦横比を画面で選択', alpha: '「Transparent」背景の指定ができます（プランによる）' },
  recraft: { name: 'Recraft（V3）', url: 'https://www.recraft.ai/', size: '縦横比を画面で選択（ベクター / アイコンのスタイルが得意）', alpha: '背景の削除機能で透過にできます' },
  leonardo: { name: 'Leonardo.Ai（Phoenix）', url: 'https://leonardo.ai/', size: '幅・高さを画面で選択', alpha: '「Transparency」をオンにすると透過 PNG で出せます' },
};
const KINDS = { bg: '背景', key: 'キービジュアル', cg: 'イベント絵', portrait: '人物', sprite: 'スプライト', item: 'アイテム', card: 'カード', icon: 'アイコン', tile: 'タイル', ui: 'UI 部品' };
const SRC_EXT = ['.png', '.jpg', '.jpeg', '.webp'];

const GAMES = path.join(PUBLIC, 'games');
const DOCS = path.join(ROOT, 'docs', 'games', 'prompts');
const args = process.argv.slice(2);
const SAMPLES = args.includes('--samples');
const ids = args.filter((a) => !a.startsWith('--'));
const md5 = (buf) => crypto.createHash('md5').update(buf).digest('hex');
/** what the sample shows: redrawn when any of it changes */
const sampleKey = (im) => md5(JSON.stringify([im.w, im.h, !!im.alpha, im.shape, im.colors, im.label, im.short]));
const rel = (p) => path.relative(ROOT, p).split(path.sep).join('/');

function readSpec(id) {
  const f = path.join(GAMES, id, 'images.json');
  const spec = JSON.parse(fs.readFileSync(f, 'utf8'));
  const names = new Set();
  for (const im of spec.images || []) {
    for (const k of ['name', 'w', 'h', 'kind', 'label', 'use', 'tool', 'prompt', 'generic']) if (im[k] == null || im[k] === '') throw new Error(`${rel(f)}: "${im.name || '?'}" has no ${k}`);
    if (!/^[a-z0-9][a-z0-9-]*$/.test(im.name)) throw new Error(`${rel(f)}: name "${im.name}" — use a-z, 0-9 and -`);
    if (names.has(im.name)) throw new Error(`${rel(f)}: "${im.name}" is listed twice`);
    if (!TOOLS[im.tool]) throw new Error(`${rel(f)}: "${im.name}" — unknown tool "${im.tool}" (known: ${Object.keys(TOOLS).join(', ')})`);
    if (im.ref && !(spec.images || []).some((x) => x.name === im.ref)) throw new Error(`${rel(f)}: "${im.name}" — ref "${im.ref}" is not in the list`);
    names.add(im.name);
  }
  return spec;
}

/* ---------- the sample images: drawn by Chrome (canvas, the system's Japanese fonts), saved as WebP by sharp ---------- */
function drawSample(o) {
  /* runs in the page */
  const { w, h } = o;
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const g = c.getContext('2d');
  const [c1, c2] = o.colors && o.colors.length ? [o.colors[0], o.colors[1] || o.colors[0]] : ['#7a7f8c', '#3f4350'];
  const lum = (hex) => { const m = /^#?([0-9a-f]{6})$/i.exec(hex); if (!m) return 0.4; const n = parseInt(m[1], 16); return (0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255; };
  const dark = (lum(c1) + lum(c2)) / 2 < 0.62;
  const ink = dark ? '#ffffff' : '#2a2520';
  const m = Math.min(w, h);
  const font = (px, weight = 700) => `${weight} ${Math.max(8, Math.round(px))}px "Yu Gothic UI", "Yu Gothic", Meiryo, "Hiragino Sans", sans-serif`;
  const grad = () => { const gr = g.createLinearGradient(0, 0, w, h); gr.addColorStop(0, c1); gr.addColorStop(1, c2); return gr; };
  const stripes = (alpha) => {
    g.save(); g.globalAlpha = alpha; g.strokeStyle = dark ? '#ffffff' : '#000000'; g.lineWidth = Math.max(1, m / 60);
    const step = Math.max(8, m / 14);
    for (let x = -h; x < w + h; x += step) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x + h, h); g.stroke(); }
    g.restore();
  };
  const fitText = (text, px, maxW, weight) => { let s = px; g.font = font(s, weight); while (s > 8 && g.measureText(text).width > maxW) { s -= 1; g.font = font(s, weight); } return s; };
  const pathShape = (shape, x, y, ww, hh) => {
    g.beginPath();
    if (shape === 'circle' || shape === 'ellipse') g.ellipse(x + ww / 2, y + hh / 2, ww / 2, hh / 2, 0, 0, Math.PI * 2);
    else if (shape === 'round' || shape === 'card') g.roundRect(x, y, ww, hh, Math.min(ww, hh) * (shape === 'card' ? 0.08 : 0.18));
    else if (shape === 'figure') {
      // head and shoulders, the silhouette of a person
      const cx = x + ww / 2, headR = Math.min(ww * 0.2, hh * 0.15);
      g.arc(cx, y + hh * 0.08 + headR, headR, 0, Math.PI * 2);
      g.moveTo(x + ww * 0.12, y + hh);
      g.bezierCurveTo(x + ww * 0.12, y + hh * 0.42, x + ww * 0.88, y + hh * 0.42, x + ww * 0.88, y + hh);
      g.closePath();
    } else g.rect(x, y, ww, hh);
  };

  if (!o.alpha) {
    g.fillStyle = grad(); g.fillRect(0, 0, w, h);
    stripes(0.06);
    // a soft vignette, so the label reads
    const rg = g.createRadialGradient(w / 2, h / 2, m * 0.1, w / 2, h / 2, Math.max(w, h) * 0.7);
    rg.addColorStop(0, 'rgba(0,0,0,0)'); rg.addColorStop(1, dark ? 'rgba(0,0,0,.28)' : 'rgba(0,0,0,.08)');
    g.fillStyle = rg; g.fillRect(0, 0, w, h);
    if (m >= 48) {
      g.setLineDash([Math.max(4, m / 40), Math.max(3, m / 60)]);
      g.strokeStyle = dark ? 'rgba(255,255,255,.35)' : 'rgba(0,0,0,.22)'; g.lineWidth = Math.max(1, m / 220);
      const inset = Math.max(4, m * 0.03);
      g.strokeRect(inset, inset, w - inset * 2, h - inset * 2);
      g.setLineDash([]);
    }
  } else {
    const pad = Math.max(2, m * 0.04);
    pathShape(o.shape || 'round', pad, pad, w - pad * 2, h - pad * 2);
    g.save(); g.clip();
    g.fillStyle = grad(); g.fillRect(0, 0, w, h);
    stripes(0.08);
    g.restore();
    pathShape(o.shape || 'round', pad, pad, w - pad * 2, h - pad * 2);
    g.lineWidth = Math.max(1.5, m * 0.025); g.strokeStyle = 'rgba(255,255,255,.9)'; g.stroke();
    g.setLineDash([Math.max(3, m / 30), Math.max(2, m / 45)]);
    g.lineWidth = Math.max(1, m * 0.008); g.strokeStyle = dark ? 'rgba(255,255,255,.55)' : 'rgba(0,0,0,.3)';
    pathShape(o.shape || 'round', pad * 2.6, pad * 2.6, w - pad * 5.2, h - pad * 5.2); g.stroke();
    g.setLineDash([]);
  }

  // the text: badge 画像サンプル, the label, the size and file name
  g.textAlign = 'center'; g.textBaseline = 'middle';
  const cx = w / 2;
  const cy = o.alpha && o.shape === 'figure' ? h * 0.66 : h / 2;
  const maxW = (o.alpha ? 0.78 : 0.86) * w;
  const label = m < 150 && o.short ? o.short : o.label;
  // large pictures are often shown full-bleed behind the game's own title and buttons, scaled up and cropped on phones:
  // there a faint repeated watermark (画像サンプル · label · size · file) replaces the centred label, so it never covers
  // the game's text and stays readable whatever part of the picture is visible
  const wide = !o.alpha && m >= 300;
  if (wide) {
    const wm = Math.max(12, Math.round(m * 0.032));
    g.save();
    g.translate(w / 2, h / 2); g.rotate(-Math.PI / 14);
    g.font = font(wm, 700); g.fillStyle = dark ? 'rgba(255,255,255,.2)' : 'rgba(0,0,0,.14)';
    const text = `画像サンプル ・ ${o.label} ・ ${w}×${h} ${o.name}.webp`;
    const tw = g.measureText(text).width + wm * 4, th = wm * 4.2, R = Math.hypot(w, h) / 2 + tw;
    for (let y = -R, row = 0; y < R; y += th, row++) for (let x = -R + (row % 2) * tw / 2; x < R; x += tw) g.fillText(text, x, y);
    g.restore();
  }
  if (wide) {
    // (the watermark says it all)
  } else if (m < 72) {
    const s = fitText(o.short || o.label, m * 0.3, w * 0.86, 800);
    g.font = font(s, 800); g.fillStyle = ink;
    g.fillText(o.short || o.label, cx, cy);
  } else {
    const big = fitText(label, Math.min(m * 0.11, w * 0.06 + 10, 64), maxW, 800);
    const small = Math.max(9, Math.min(big * 0.5, 22));
    const badge = Math.max(10, Math.min(big * 0.55, 24));
    const gap = big * 0.5;
    // badge
    g.font = font(badge, 800);
    const bt = '画像サンプル', bw = g.measureText(bt).width + badge * 1.4, bh = badge * 1.7;
    const by = cy - big / 2 - gap - bh / 2;
    g.fillStyle = dark ? 'rgba(255,255,255,.92)' : 'rgba(40,34,28,.85)';
    g.beginPath(); g.roundRect(cx - bw / 2, by - bh / 2, bw, bh, bh / 2); g.fill();
    g.fillStyle = dark ? '#2a2520' : '#ffffff'; g.fillText(bt, cx, by + badge * 0.04);
    // label
    g.font = font(big, 800); g.fillStyle = ink;
    g.shadowColor = dark ? 'rgba(0,0,0,.45)' : 'rgba(255,255,255,.6)'; g.shadowBlur = big * 0.25;
    g.fillText(label, cx, cy);
    g.shadowBlur = 0;
    // size · file
    if (m >= 110) {
      g.font = font(small, 600); g.globalAlpha = 0.85;
      fitText(`${w} × ${h} ・ ${o.name}.webp`, small, maxW, 600);
      g.fillText(`${w} × ${h} ・ ${o.name}.webp`, cx, cy + big / 2 + gap + small / 2);
      g.globalAlpha = 1;
    }
  }
  return c.toDataURL('image/png');
}

/* ---------- a picture you generated → img/<name>.webp ---------- */
/** makes a plain background transparent: flood fill from the border, colours close to the corners' colour */
async function cutout(input) {
  const { data, info } = await sharp(input).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: W, height: H } = info;
  const px = (i) => [data[i * 4], data[i * 4 + 1], data[i * 4 + 2]];
  const corners = [0, W - 1, (H - 1) * W, H * W - 1].map(px);
  const bg = [0, 1, 2].map((k) => Math.round(corners.reduce((s, c) => s + c[k], 0) / 4));
  const spread = Math.max(...corners.map((c) => Math.hypot(c[0] - bg[0], c[1] - bg[1], c[2] - bg[2])));
  if (spread > 40) return null; // the corners differ: not a plain background
  const TOL = 42, dist = (i) => { const c = px(i); return Math.hypot(c[0] - bg[0], c[1] - bg[1], c[2] - bg[2]); };
  const seen = new Uint8Array(W * H), stack = [];
  for (let x = 0; x < W; x++) stack.push(x, (H - 1) * W + x);
  for (let y = 0; y < H; y++) stack.push(y * W, y * W + W - 1);
  while (stack.length) {
    const i = stack.pop();
    if (seen[i]) continue;
    const d = dist(i);
    if (d > TOL) continue;
    seen[i] = 1;
    data[i * 4 + 3] = d < TOL * 0.6 ? 0 : Math.round(255 * (d - TOL * 0.6) / (TOL * 0.4)); // soft edge
    const x = i % W, y = (i - x) / W;
    if (x > 0) stack.push(i - 1); if (x < W - 1) stack.push(i + 1);
    if (y > 0) stack.push(i - W); if (y < H - 1) stack.push(i + W);
  }
  return sharp(data, { raw: { width: W, height: H, channels: 4 } }).png().toBuffer();
}

async function importPicture(src, im, out) {
  let input = fs.readFileSync(src);
  const meta = await sharp(input).metadata();
  let cut = false;
  // needs transparency but every pixel is opaque (most tools cannot make transparent pictures): cut out the plain background
  if (im.alpha && (await sharp(input).stats()).isOpaque) { const c = await cutout(input); if (c) { input = c; cut = true; } }
  const fit = im.fit === 'contain' || im.alpha ? 'contain' : 'cover';
  const buf = await sharp(input)
    .resize(im.w, im.h, { fit, position: 'attention', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .webp(im.alpha ? { quality: 90, alphaQuality: 95 } : { quality: 84 })
    .toBuffer();
  fs.writeFileSync(out, buf);
  return `${meta.width}×${meta.height} → ${im.w}×${im.h}${cut ? '（背景を切り抜き）' : ''}`;
}

/* ---------- the prompt sheets ---------- */
const fence = (s) => '```text\n' + String(s).trim() + '\n```';
function sheet(id, spec, state) {
  const imgs = spec.images;
  const done = imgs.filter((im) => state[im.name] === 'art').length;
  const L = [];
  L.push(`# ${spec.title} ― 画像の生成プロンプト`, '');
  L.push(`ゲーム: \`public/games/${id}/\`（${imgs.length} 枚中 ${done} 枚が生成済み、${imgs.length - done} 枚が画像サンプル）。このファイルは \`npm run game-images\` が \`public/games/${id}/images.json\` から書き出します（直接編集しないでください）。`, '');
  if (spec.style) L.push('## 全体のアートディレクション', '', spec.style, '');
  L.push('## 差し替えの手順', '',
    `1. 下のプロンプトを、画像ごとの「おすすめのツール」（または「ほかのツール用」の英文を好きなツール）に入力して生成します。`,
    `2. できた画像を \`public/games/${id}/img/<ファイル名>.png\`（.jpg / .webp も可・サイズは自由）として保存します。`,
    `3. \`npm run game-images -- ${id}\` を実行すると、指定のサイズに合わせて WebP に変換し、画像サンプルと置き換えます（透過が必要な画像は、単色の背景を自動で切り抜きます）。`,
    `4. ゲームのカードのプレビュー画像も撮り直すときは \`npm run capture -- ${id}\`。`, '');
  L.push('## 画像の一覧', '', '| | ファイル | サイズ | 種類 | 用途 | おすすめのツール |', '|---|---|---|---|---|---|');
  for (const im of imgs) L.push(`| ${state[im.name] === 'art' ? '✅' : '⬜'} | [\`img/${im.name}.webp\`](#${im.name}) | ${im.w}×${im.h}${im.alpha ? '（透過）' : ''} | ${KINDS[im.kind] || im.kind} | ${im.use} | ${TOOLS[im.tool].name} |`);
  L.push('', '⬜ = 画像サンプルのまま　✅ = 生成した画像に差し替え済み', '');
  for (const im of imgs) {
    const t = TOOLS[im.tool];
    L.push(`<a id="${im.name}"></a>`, '', `## ${im.label}`, '');
    L.push(`- ファイル: \`public/games/${id}/img/${im.name}.webp\`（${im.w}×${im.h}px${im.alpha ? '・背景は透過' : ''}）`);
    L.push(`- 用途: ${im.use}`);
    if (im.ja) L.push(`- 内容: ${im.ja}`);
    L.push(`- おすすめのツール: [${t.name}](${t.url}) ― サイズ: ${t.size}${im.alpha ? `。透過: ${t.alpha}` : ''}`);
    if (im.ref) L.push(`- 参照画像: [\`img/${im.ref}.webp\`](#${im.ref}) を先に作り、それを参照画像として添付すると、絵柄・人物がそろいます`);
    if (im.notes) L.push(`- メモ: ${im.notes}`);
    L.push('', `**${t.name}用のプロンプト**`, '', fence(im.prompt));
    if (im.negative) L.push('', '**ネガティブプロンプト（入れたくないもの）**', '', fence(im.negative));
    L.push('', '**ほかのツール用（共通の英文プロンプト）**', '', fence(im.generic), '');
  }
  return L.join('\n');
}

function index(all) {
  const L = [];
  L.push('# ゲームの画像 ― 生成プロンプトの一覧', '');
  L.push('ゲームタブのゲームで使う画像は、いまはすべて「画像サンプル」です。各ゲームのシートにあるプロンプトで画像を生成し、`public/games/<id>/img/` に保存して `npm run game-images` を実行すると差し替わります。このファイルと各シートは `npm run game-images` が書き出します。', '');
  L.push('| ゲーム | 画像 | 生成済み | 使うツール |', '|---|---|---|---|');
  let total = 0, done = 0;
  const byTool = {};
  for (const { id, spec, state } of all) {
    const d = spec.images.filter((im) => state[im.name] === 'art').length;
    total += spec.images.length; done += d;
    const tools = [...new Set(spec.images.map((im) => im.tool))];
    spec.images.forEach((im) => { byTool[im.tool] = (byTool[im.tool] || 0) + 1; });
    L.push(`| [${spec.title}](${id}.md) | ${spec.images.length} 枚 | ${d} 枚 | ${tools.map((t) => TOOLS[t].name.replace(/（.*$/, '')).join('、')} |`);
  }
  L.push(`| **合計** | **${total} 枚** | **${done} 枚** | |`, '');
  L.push('## ツールごとの使い分け', '', '画像ごとに、向いているツールを「おすすめ」として選んでいます。ほかのツールで作りたいときは、各画像の「ほかのツール用（共通の英文プロンプト）」を使ってください。', '');
  L.push('| ツール | 枚数 | サイズの指定 | 透過が必要な画像 |', '|---|---|---|---|');
  for (const [k, t] of Object.entries(TOOLS)) if (byTool[k]) L.push(`| [${t.name}](${t.url}) | ${byTool[k]} 枚 | ${t.size} | ${t.alpha} |`);
  L.push('');
  return L.join('\n');
}

/** the sample marker this tool writes into the EXIF of each sample (ImageDescription): "game-images-sample:<sampleKey>" */
const MARK = 'game-images-sample:';
async function sampleMark(file) {
  const m = await sharp(file).metadata();
  if (!m.exif) return null;
  const hit = new RegExp(MARK + '([0-9a-f]{32})').exec(m.exif.toString('latin1'));
  return hit ? hit[1] : null;
}

(async () => {
  if (!fs.existsSync(GAMES)) { console.log('public/games/ がありません'); return; }
  const list = fs.readdirSync(GAMES).filter((d) => fs.existsSync(path.join(GAMES, d, 'images.json')) && (!ids.length || ids.includes(d)));
  const unknown = ids.filter((i) => !list.includes(i));
  if (unknown.length) { console.error('images.json がないゲーム:', unknown.join(', ')); process.exit(1); }
  let browser = null, page = null;
  const sampler = async () => {
    if (!page) {
      browser = await puppeteer().launch({ executablePath: CHROME, headless: 'new', args: ['--lang=ja-JP'] });
      page = await browser.newPage();
      await page.setContent('<!doctype html><meta charset="utf-8"><body></body>');
    }
    return page;
  };
  fs.mkdirSync(DOCS, { recursive: true });
  for (const id of list) {
    const spec = readSpec(id);
    const dir = path.join(GAMES, id, 'img');
    fs.mkdirSync(dir, { recursive: true });
    const state = {};
    let drawn = 0, imported = 0;
    for (const im of spec.images) {
      const out = path.join(dir, `${im.name}.webp`);
      const src = SRC_EXT.map((e) => path.join(dir, im.name + e)).find((f) => f !== out && fs.existsSync(f));
      if (src) {
        const how = await importPicture(src, im, out);
        fs.unlinkSync(src);
        state[im.name] = 'art'; imported++;
        console.log(`  ${id}/${im.name}: 生成した画像を取り込みました（${how}）`);
        continue;
      }
      const mark = fs.existsSync(out) ? await sampleMark(out) : null;
      // a .webp without the sample marker: a picture saved straight as webp — fit it when the size is off
      if (fs.existsSync(out) && !mark) {
        const meta = await sharp(out).metadata();
        if (meta.width !== im.w || meta.height !== im.h) {
          const tmp = out + '.src';
          fs.renameSync(out, tmp);
          const how = await importPicture(tmp, im, out);
          fs.unlinkSync(tmp);
          console.log(`  ${id}/${im.name}: サイズを合わせました（${how}）`);
        }
        state[im.name] = 'art';
        continue;
      }
      // missing, or a sample: (re)draw when asked or when what it shows changed
      if (!mark || SAMPLES || mark !== sampleKey(im)) {
        const p = await sampler();
        const dataUrl = await p.evaluate(drawSample, { name: im.name, w: im.w, h: im.h, alpha: !!im.alpha, shape: im.shape, colors: im.colors, label: im.label, short: im.short });
        const png = Buffer.from(dataUrl.split(',')[1], 'base64');
        const buf = await sharp(png)
          .webp(im.alpha ? { quality: 88, alphaQuality: 90 } : { quality: 82 })
          .withExif({ IFD0: { ImageDescription: MARK + sampleKey(im) } })
          .toBuffer();
        fs.writeFileSync(out, buf);
        drawn++;
      }
      state[im.name] = 'sample';
    }
    fs.writeFileSync(path.join(DOCS, `${id}.md`), sheet(id, spec, state));
    const samples = spec.images.filter((im) => state[im.name] === 'sample').length;
    console.log(`${id}: ${spec.images.length} 枚（画像サンプル ${samples}・生成済み ${spec.images.length - samples}）${drawn ? `、サンプルを ${drawn} 枚描画` : ''}${imported ? `、${imported} 枚取り込み` : ''}`);
  }
  if (browser) await browser.close();
  // the index covers every game (not only the ones given)
  const all = [];
  for (const id of fs.readdirSync(GAMES).filter((d) => fs.existsSync(path.join(GAMES, d, 'images.json')))) {
    const spec = readSpec(id);
    const state = {};
    for (const im of spec.images) {
      const out = path.join(GAMES, id, 'img', `${im.name}.webp`);
      state[im.name] = fs.existsSync(out) && !(await sampleMark(out)) ? 'art' : 'sample';
    }
    all.push({ id, spec, state });
  }
  fs.writeFileSync(path.join(DOCS, 'README.md'), index(all));
  console.log('wrote docs/games/prompts/');
})().catch((e) => { console.error(e.message || e); process.exit(1); });
