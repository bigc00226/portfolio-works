// The three quotes (御見積書) of the 「カンタン見積もり」 scene as real PDFs, shown in Chrome's own PDF viewer.
//
//   node tools/snapshots/kanademono-business/build-quote-pdfs.js        (then: node tools/webp.js kanademono-business)
//
// 1. Each quote is laid out in HTML from the video's data (js/files.js — the store's own products and prices, with
//    the snapshot loaded so the 【B2B】割引表記なし tag keeps the chair at its fixed price) and printed to a PDF by
//    Chrome (A4, Noto Sans JP embedded): assets/pdf/quote-D1023.pdf / D1024 / D1025.
// 2. Each PDF is opened in Chrome's built-in PDF viewer (the installed Chrome, headless) at the size of the browser's
//    page area in the video (1920×947), and the viewer is captured as it draws it — toolbar, thumbnail sidebar,
//    the rendered page: assets/pdf/quote-D10xx.png (→ .webp).
// 3. Where the parts the cursor points at (table, first unit price, amount box, total, note) end up on screen is
//    measured and written with the file names to js/quote-pdfs.js (window.QUOTE_PDFS).
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const puppeteer = require('puppeteer-core');
const sharp = require('sharp');

const ROOT = path.resolve(__dirname, '../../../public/videos/kanademono-business'); // the video's folder
const CHROME = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const VIEW = { width: 1920, height: 947 }; // the browser's page area in the video (#brContent)

// the video's data, as the page computes it
const ctx = { window: {}, console };
vm.createContext(ctx);
for (const f of ['config.js', 'site-snapshot.js', 'files.js']) vm.runInContext(fs.readFileSync(path.join(ROOT, 'js', f), 'utf8'), ctx);
const F = ctx.window.FILES;
const DESK = F.QUOTE[0];
const yen = (v) => '¥' + Math.round(Number(v)).toLocaleString('ja-JP');
const tax = (v) => Math.floor((v * 10) / 110);
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const QUOTES = [
  { no: 'D1023', b2b: false },
  { no: 'D1024', b2b: true },
  { no: 'D1025', b2b: true, items: [{ ...DESK, qty: 1 }], lead: `商品「${DESK.name}」` },
];

function quoteHtml(q) {
  const items = q.items || F.QUOTE;
  const unit = (it) => (q.b2b ? it.b2b : it.price);
  const total = items.reduce((a, it) => a + unit(it) * it.qty, 0);
  const rows = items.map((it, i) => `<tr><td class="c">${i + 1}</td><td>${esc(it.name)}</td><td class="n">${it.qty}</td><td class="n"${i === 0 ? ' data-spot="price1"' : ''}>${yen(unit(it))}</td><td class="n">${yen(unit(it) * it.qty)}</td></tr>`).join('');
  return `<!DOCTYPE html><html lang="ja"><head><meta charset="utf-8"><title>quote-${q.no}.pdf</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;700&display=block">
<style>
  @page { size: A4; margin: 0; }
  * { box-sizing: border-box; }
  html, body { margin: 0; }
  body { width: 210mm; padding: 16mm 17mm 14mm; font: 9.6pt/1.6 "Noto Sans JP", sans-serif; color: #1f1f1f; }
  .head { display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 1.6pt solid #1f1f1f; padding-bottom: 9pt; }
  h1 { margin: 0; font-size: 21pt; font-weight: 500; letter-spacing: .5em; }
  .no { text-align: right; font-size: 8.4pt; line-height: 1.7; color: #444; }
  .parties { display: flex; justify-content: space-between; align-items: flex-start; margin-top: 18pt; }
  .to b { display: block; min-width: 82mm; font-size: 13pt; font-weight: 500; border-bottom: .8pt solid #1f1f1f; padding-bottom: 3pt; }
  .to span { display: block; margin-top: 5pt; }
  .from { text-align: right; font-size: 8.4pt; line-height: 1.7; color: #444; }
  .from b { font-size: 10.5pt; color: #1f1f1f; font-weight: 700; letter-spacing: .04em; }
  .lead { margin: 20pt 0 10pt; }
  .sum { display: flex; justify-content: space-between; align-items: baseline; width: 98mm; border: 1.4pt solid #1f1f1f; padding: 7pt 11pt; }
  .sum b { font-size: 17pt; font-weight: 700; }
  table { width: 100%; border-collapse: collapse; margin-top: 15pt; font-size: 8.6pt; }
  th { background: #f0f0f0; font-weight: 500; text-align: left; padding: 5pt 6pt; border: .6pt solid #c8c8c8; }
  td { padding: 6.5pt 6pt; border: .6pt solid #c8c8c8; vertical-align: top; }
  .n { text-align: right; white-space: nowrap; }
  .c { text-align: center; width: 9mm; }
  .tot { margin: 10pt 0 0 auto; width: 70mm; }
  .tot div { display: flex; justify-content: space-between; padding: 3pt 0; border-bottom: .6pt solid #d6d6d6; }
  .tot .g { font-size: 11.5pt; font-weight: 700; border-bottom: 1.4pt solid #1f1f1f; }
  .note { margin-top: 18pt; font-size: 8pt; color: #555; line-height: 1.75; }
</style></head><body>
  <div class="head"><h1>御見積書</h1><div class="no">見積番号 ${esc(q.no)}<br>発行日 2026年9月15日<br>有効期限 2026年10月15日</div></div>
  <div class="parties">
    <div class="to"><b>${esc(F.COMPANY)} 御中</b><span>ご担当：山田 太郎 様</span></div>
    <div class="from"><b>KANADEMONO for BUSINESS</b><br>株式会社KANADEMONO<br>b2b@kanademono.design</div>
  </div>
  <p class="lead">下記のとおりお見積もり申し上げます。<br>${q.lead ? esc(q.lead) : `スタイリング「${esc(F.STYLING)}」`}</p>
  <div class="sum" data-spot="sum"><span>お見積金額（税込）</span><b>${yen(total)}</b></div>
  <table data-spot="table"><thead><tr><th class="c">No</th><th>品名</th><th class="n">数量</th><th class="n">単価（税込）</th><th class="n">金額</th></tr></thead><tbody>${rows}</tbody></table>
  <div class="tot"><div><span>小計</span><b>${yen(total)}</b></div><div><span>うち消費税（10%）</span><b>${yen(tax(total))}</b></div><div class="g" data-spot="total"><span>合計</span><b>${yen(total)}</b></div></div>
  <p class="note" data-spot="note">${q.b2b ? '価格：法人卸価格（カタログ「法人卸 15%OFF」）。お支払い：請求書払い（30 日以内）。' : '価格：通常価格。'}<br>合計 25 万円以上のご注文は組み立て配送（有償）を承ります。</p>
</body></html>`;
}

/** the white page in the captured viewer (right of the thumbnail sidebar) */
async function pageRect(png) {
  const { data, info } = await sharp(png).raw().toBuffer({ resolveWithObject: true });
  const white = (x, y) => { const i = (y * info.width + x) * info.channels; return data[i] > 250 && data[i + 1] > 250 && data[i + 2] > 250; };
  const y = Math.round(info.height * 0.6);
  let x0 = -1, x1 = -1;
  for (let x = 320; x < info.width; x++) if (white(x, y)) { if (x0 < 0) x0 = x; x1 = x; }
  const xm = x0 + 8; // down the page's blank left margin
  let y0 = y; while (y0 > 0 && white(xm, y0 - 1)) y0--;
  let y1 = y; while (y1 < info.height - 1 && white(xm, y1 + 1)) y1++;
  return { x: x0, y: y0, w: x1 - x0 + 1, bottom: y1 };
}

(async () => {
  const dir = path.join(ROOT, 'assets', 'pdf');
  fs.mkdirSync(dir, { recursive: true });
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--lang=ja-JP', '--hide-scrollbars'] });
  const out = {};
  for (const q of QUOTES) {
    const name = `quote-${q.no}`;
    // 1. the PDF
    const doc = await browser.newPage();
    await doc.setViewport({ width: 794, height: 1123 });
    await doc.setContent(quoteHtml(q), { waitUntil: 'load', timeout: 120000 });
    await doc.evaluate(() => document.fonts.ready);
    await doc.emulateMediaType('print');
    const spots = await doc.evaluate(() => Object.fromEntries([...document.querySelectorAll('[data-spot]')].map((e) => { const r = e.getBoundingClientRect(); return [e.dataset.spot, [r.left, r.top, r.width, r.height]]; })));
    const pdfFile = path.join(dir, `${name}.pdf`);
    await doc.pdf({ path: pdfFile, format: 'A4', printBackground: true, margin: { top: 0, right: 0, bottom: 0, left: 0 } });
    await doc.close();
    // 2. Chrome's PDF viewer showing it
    const v = await browser.newPage();
    await v.setViewport(VIEW);
    await v.goto('file:///' + pdfFile.replace(/\\/g, '/'), { waitUntil: 'networkidle0' });
    await new Promise((r) => setTimeout(r, 3500));
    const png = path.join(dir, `${name}.png`);
    await v.screenshot({ path: png });
    await v.close();
    // 3. where the parts are on screen (page drawn at the viewer's zoom: page width / A4 width in CSS px)
    const pr = await pageRect(png);
    const k = pr.w / 793.7;
    out[q.no] = {
      img: `assets/pdf/${name}.webp`, pdf: `assets/pdf/${name}.pdf`, file: `${name}.pdf`, page: [pr.x, pr.y, pr.w],
      spots: Object.fromEntries(Object.entries(spots).map(([s, [x, y, w, h]]) => [s, [pr.x + x * k, pr.y + y * k, w * k, h * k].map((n) => Math.round(n))])),
    };
    console.log(name, (fs.statSync(pdfFile).size / 1024).toFixed(0) + ' KB pdf, page on screen at', pr, 'zoom', k.toFixed(3));
  }
  await browser.close();
  fs.writeFileSync(path.join(ROOT, 'js', 'quote-pdfs.js'), `/* The quotes as real PDFs (assets/pdf/*.pdf) and Chrome's PDF viewer showing them (assets/pdf/*.webp, 1920×947),
   with where the table / amount / total / note are on screen. Generated by tools/snapshots/kanademono-business/build-quote-pdfs.js — do not edit */
window.QUOTE_PDFS = ${JSON.stringify(out, null, 2)};\n`);
  console.log('wrote js/quote-pdfs.js');
})().catch((e) => { console.error(e); process.exit(1); });
