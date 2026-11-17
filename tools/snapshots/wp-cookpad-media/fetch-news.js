/*
 * The live おしらせ list (https://info.cookpad.com/news, all pages) as data for the import the video shows:
 *   node tools/snapshots/wp-cookpad-media/fetch-news.js   → news-data.json (title, date, category, link, image)
 * Public pages only, one request at a time with a pause.
 */
const fs = require('fs');
const path = require('path');
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36';
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const dec = (s) => s.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#0?39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&hellip;/g, '…').replace(/&#8211;/g, '–');
(async () => {
  const out = [];
  let last = 1;
  for (let p = 1; p <= last; p++) {
    const url = 'https://info.cookpad.com/news' + (p > 1 ? '/page/' + p : '');
    const h = await (await fetch(url, { headers: { 'user-agent': UA } })).text();
    if (p === 1) { const m = [...h.matchAll(/href="\/news\/page\/(\d+)"/g)].map((x) => +x[1]); last = Math.max(1, ...m); console.log('pages', last); }
    const list = h.slice(h.indexOf('<div class="list_news">'), h.indexOf('<div id="pager_news">'));
    for (const m of list.matchAll(/<li class="n"><a href="([^"]*)" title="([^"]*)" target="([^"]*)"[\s\S]*?<img src="([^"]*)"[\s\S]*?<ul class="tags">([\s\S]*?)<\/ul>[\s\S]*?<p class="date">([^<]*)<\/p>/g)) {
      const cats = [...m[5].matchAll(/<span>([^<]*)<\/span>/g)].map((x) => x[1]);
      out.push({ link: dec(m[1]), title: dec(m[2]), external: m[3] === '_blank', image: m[4], cats, date: m[6].trim().replace(/\./g, '-') });
    }
    if (p % 10 === 0) console.log(p, out.length);
    await wait(400);
  }
  fs.writeFileSync(path.join(__dirname, 'news-data.json'), JSON.stringify(out, null, 0));
  const c = {}; for (const o of out) for (const k of o.cats) c[k] = (c[k] || 0) + 1;
  console.log('items', out.length, 'external', out.filter((o) => o.external).length, JSON.stringify(c));
})();
