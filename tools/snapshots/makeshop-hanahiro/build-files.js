/*
 * Builds public/videos/makeshop-hanahiro/js/files.js from the shop's public pages (www.hanahiro-onlineshop.jp):
 *   FILES.ITEMS / CATS   the catalogue: the all-items list (names, tax-included prices, image files) and each category
 *                        page (which item is in which category)
 *   FILES.SCENE_HTML     the top page's BY SCENE block, as the shop serves it (typed / pasted in the video)
 *   FILES.files          the project folder shown in VS Code: the product CSV for 商品一括登録, design/top.html (the STYLE
 *                        block as served), docs/shop-rules.md (payment / delivery / fees from the shop's ご利用ガイド)
 * Run after `npm run snapshot -- makeshop-hanahiro` (the item images it refers to are the captured ones):
 *   node tools/snapshots/makeshop-hanahiro/build-files.js
 * Public GET requests only (no login, no cart, no forms).
 */
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..', '..', '..');
const VID = path.join(ROOT, 'public/videos/makeshop-hanahiro');
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36';
const BASE = 'https://www.hanahiro-onlineshop.jp';
const CATS = [
  ['birthday-anniversary', 'お誕生日・記念日', 'scene'], ['congratulatory', 'お祝い花', 'scene'], ['roses', 'バラの花', 'scene'], ['mothorchid', '胡蝶蘭', 'scene'],
  ['offering', 'お供え花', 'scene'], ['promotion-arewell', 'ご昇進・送別', 'scene'], ['express', 'お急ぎ便', 'scene'],
  ['arrangement', 'アレンジメント', 'style'], ['bouquets', '花束・ブーケ', 'style'], ['preserved', 'プリザーブドフラワー', 'style'], ['stands', 'スタンド花', 'style'],
  ['ct126', '観葉植物', 'style'], ['namabana', 'おまかせ生花', 'style'], ['ct278', 'Flower BASE（花瓶）', 'style'],
];
// the specific categories first (the big ones — お誕生日・記念日 / お祝い花 / プリザーブド — hold almost everything)
const PRI = ['mothorchid', 'roses', 'bouquets', 'stands', 'ct126', 'namabana', 'ct278', 'arrangement', 'express', 'offering', 'promotion-arewell', 'preserved', 'congratulatory', 'birthday-anniversary'];
const parse = (s) => [...s.matchAll(/<article>[\s\S]*?itemimages\/([^"]+)"[\s\S]*?alt="([^"]*)"[\s\S]*?class="price">\s*([^<]+?)\s*<\/p>[\s\S]*?\/view\/item\/(\d+)/g)]
  .map((m) => ({ code: m[4], name: m[2].trim(), price: Number(m[3].replace(/[^\d]/g, '')), file: m[1] }));

(async () => {
  const get = async (u) => (await fetch(BASE + u, { headers: { 'user-agent': UA } })).text();
  const items = parse(await get('/view/category/all_items'));
  const imgDir = path.join(VID, 'assets/site/makeshop-multi-images.akamaized.net/hanahiro8787/itemimages');
  const local = fs.existsSync(imgDir) ? fs.readdirSync(imgDir) : [];
  items.forEach((it) => {
    const f = local.find((x) => x.startsWith(it.file.replace(/\.[a-z]+$/i, '') + '.'));
    it.img = f ? `assets/site/makeshop-multi-images.akamaized.net/hanahiro8787/itemimages/${f}` : null;
    it.cats = [];
  });
  for (const [key] of CATS) parse(await get('/view/category/' + key)).forEach((x) => { const it = items.find((i) => i.code === x.code); if (it) it.cats.push(key); });
  items.forEach((it) => it.cats.sort((a, b) => PRI.indexOf(a) - PRI.indexOf(b)));

  // the top page's blocks, as served (tabs → 2 spaces, no blank lines)
  const home = (await get('/')).replace(/\r\n/g, '\n');
  const main = home.slice(home.indexOf('<main>'), home.indexOf('</main>'));
  const cut = (from) => { const a = main.indexOf(from); return main.slice(a, main.indexOf('<!-- =====', a)); };
  const tidy = (t) => t.replace(/\t/g, '  ').split('\n').map((l) => l.replace(/\s+$/, '')).filter((l) => l.trim()).join('\n').trim();
  const scene = tidy(cut('<section class="home-section-v2 home-section-v2--white">'));
  const style = tidy(cut('<section class="home-section-v2 home-section-v2--beige">'));

  const catName = Object.fromEntries(CATS.map(([k, n]) => [k, n]));
  const q = (s) => (/[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s);
  const stock = (it) => (it.code === '000000002016' ? 300 : 20); // not public: a stock count for the demo
  const csv = ['商品コード,商品名,販売価格（税込）,在庫数,カテゴリー,商品画像,表示']
    .concat(items.map((it) => [it.code, it.name, it.price, stock(it), it.cats.slice(0, 3).map((k) => catName[k]).join('|'), it.file, '表示'].map((x) => q(String(x))).join(','))).join('\n');
  const rules = [
    '# Hanahiro ONLINE SHOP 構築メモ（ご利用ガイドの内容）', '',
    '## お支払い', '- クレジットカード決済（VISA / MASTER / JCB / AMEX / ダイナース）', '- Amazon Pay', '- PayPay', '- 商品価格・送料は税込（消費税 10%）', '',
    '## お届け', '- 生花：ご注文の 4 日以降（17 時以降のご注文は翌日受付）', '- プリザーブドフラワー：ご注文受付後 5 日以降', '- 宅配便（クロネコヤマト）・都内一部は自社便', '',
    '## 送料（税込）', '| 地域 | 送料 |', '| --- | --- |', '| 東京都下 | 770円 |', '| 関東地区（茨城・栃木・群馬・埼玉・千葉・神奈川・山梨） | 1,100円 |',
    '| 上記以外の本州・四国 | 1,320円 |', '| 北海道・九州・沖縄本島・離島 | 1,815円 |', '',
    '## キャンセル', '- お届けの 5 日前まで',
  ].join('\n');
  const FILES = {
    ITEMS: items.map((it) => ({ code: it.code, name: it.name, price: it.price, img: it.img, cats: it.cats })),
    CATS: CATS.map(([key, name, group]) => ({ key, name, group })),
    SCENE_HTML: scene,
    files: {
      'data/products_hanahiro.csv': csv,
      'design/top.html': '<!-- トップページ：シーン別 / スタイル別のカテゴリー -->\n' + style + '\n',
      'docs/shop-rules.md': rules,
      'README.md': '# hanahiro-makeshop\n\nHanahiro ONLINE SHOP（makeshop）の構築用ファイル。\n\n- data/ 商品一括登録の CSV\n- design/ クリエイターモードのページ HTML\n- docs/ ご利用ガイドの内容（決済・配送・送料）\n',
    },
  };
  fs.writeFileSync(path.join(VID, 'js/files.js'), `/* The project folder of the Hanahiro build (VS Code) and the shop's catalogue — generated from the shop's public pages
   (the all-items and category lists, the top page as served) by tools/snapshots/makeshop-hanahiro/build-files.js; do not edit. */
window.FILES = ${JSON.stringify(FILES, null, 1)};
`);
  console.log('items', items.length, 'with image', items.filter((i) => i.img).length, '· scene', scene.split('\n').length, 'lines · style', style.split('\n').length, 'lines');
})();
