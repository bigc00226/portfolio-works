/*
 * Builds public/videos/makeshop-lafayette/js/files.js from the shop's public pages (www.lafayettecrew.jp):
 *   FILES.BRANDS / ITEM_CATS   the two category trees of the shop's menu (ブランドから探す / アイテムから探す)
 *   FILES.LFYT_SUBS            the LFYT brand's child categories with their item counts (the brand page)
 *   FILES.ITEMS                the LFYT brand list (names, tax-included prices, images) and FILES.NEW the 新着 list
 *   FILES.LFYT_TOTAL           "全 N 件" of the LFYT brand page
 *   FILES.files                the project folder shown in VS Code (the shop's rules from its guide pages)
 * Run after `npm run snapshot -- makeshop-lafayette` (the images it refers to are the captured ones):
 *   node tools/snapshots/makeshop-lafayette/build-files.js
 * Public GET requests only (no login, no cart, no forms).
 */
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..', '..', '..');
const VID = path.join(ROOT, 'public/videos/makeshop-lafayette');
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36';
const BASE = 'https://www.lafayettecrew.jp';
const ITEM_CATS = [['new_arrival', '新着から探す'], ['tshirts', 'Tシャツ/カットソー'], ['tops', 'トップス'], ['ct1277', 'パーカー'], ['jacket', 'ジャケット/アウター'], ['pants', 'ロングパンツ'], ['shorts', 'ハーフパンツ'], ['shoes', 'シューズ'], ['headwear', '帽子'], ['bag', 'バッグ'], ['fashion_goods', '小物/雑貨'], ['ct1271', '音楽/本']];
const BRAND_KEYS = ['lafayette', 'carhartt', 'newera', 'adidas', 'puma', 'gramicci', 'evisu', 'haight', 'nike', 'timberland', 'columbia', 'liberaiders'];

const parse = (s) => [...s.matchAll(/<div class="itemBox"[\s\S]*?\/view\/item\/(\d+)[\s\S]*?itemimages\/([^"]+)"[\s\S]*?class="ttl"[^>]*><span>([^<]+)<\/span>[\s\S]*?class="num">([^<]+)</g)]
  .map((m) => ({ code: m[1], file: m[2], name: m[3].trim(), price: Number(m[4].replace(/[^\d]/g, '')) }));
(async () => {
  const get = async (u) => (await fetch(BASE + u, { headers: { 'user-agent': UA } })).text();
  const home = await get('/');
  const brands = BRAND_KEYS.map((k) => { const m = home.match(new RegExp(`href="/view/category/${k}"[^>]*>([^<]+)<`)); return { key: k, name: (m ? m[1] : k).trim() }; });
  const brandPage = await get('/view/category/lafayette');
  const subs = [...brandPage.matchAll(/<a href="\/view\/category\/(lafayette_[a-z]+)" itemprop="url">([^<]+)<span class="child-category-count">\((\d+)\)<\/span>/g)].map((m) => ({ key: m[1], name: m[2].trim(), n: +m[3] }));
  const total = +((brandPage.match(/list-head-count">全(?:<span>)?(\d+)/) || [])[1] || 0);
  const imgDir = path.join(VID, 'assets/site/makeshop-multi-images.akamaized.net/lafayette/itemimages');
  const local = fs.existsSync(imgDir) ? fs.readdirSync(imgDir) : [];
  const withImg = (it) => { const f = local.find((x) => x.startsWith(it.file.replace(/\.[a-z]+$/i, '') + '.')); return { ...it, img: f ? `assets/site/makeshop-multi-images.akamaized.net/lafayette/itemimages/${f}` : null }; };
  const items = parse(brandPage).map(withImg);
  const news = parse(await get('/view/category/new_arrival')).map(withImg);
  const rules = [
    '# Lafayette 公式通販サイト 構築メモ（ご利用ガイド・会員特典・お支払い方法の内容）', '',
    '## 会員', '- ご購入額の 1% をポイント還元・新規会員登録で 500 ポイント', '- 会員ランク 5 段階（直近 1 年の累計購入金額・毎月 1 日に確定）で最大 10% 還元', '- ポイントの有効期限：最後に配送を行った日から 1 年', '',
    '## お支払い', '- クレジットカード（VISA / Master Card / Diners Club / AMEX / JCB・3D セキュア）', '- クロネコ代金後払い（手数料 209 円）', '- 楽天ペイ / LINE Pay / Paidy / キャリア決済 / Amazon Pay', '',
    '## 配送・送料（税込・ヤマト運輸）', '| 地域 | 送料 |', '| --- | --- |', '| 関東・信越・南東北・北陸・中部 | 600円 |', '| 北東北・関西 | 700円 |', '| 中国 | 800円 |', '| 四国 | 900円 |', '| 北海道・九州 | 1,000円 |', '| 沖縄 | 1,100円 |',
    '- 11,000 円以上（税込）で送料無料', '- 店舗受け取りあり', '- ご注文から 3 営業日以内に発送',
    '', '## 新作の販売開始', '- LFYT 2026 A/W：キルティング風のダイヤステッチのスウェットなど 3 型　11/21(土) 11:00 販売開始',
  ].join('\n');
  const FILES = {
    BRANDS: brands, ITEM_CATS: ITEM_CATS.map(([key, name]) => ({ key, name })), LFYT_SUBS: subs, LFYT_TOTAL: total,
    ITEMS: items, NEW: news,
    files: {
      'docs/shop-rules.md': rules,
      'README.md': '# lafayette-makeshop\n\nLafayette 公式通販サイト（makeshop）の構築・カスタマイズ用のメモ。\n\n- docs/shop-rules.md 会員・決済・配送・新作の販売開始\n',
    },
  };
  fs.writeFileSync(path.join(VID, 'js/files.js'), `/* The Lafayette shop's catalogue and category trees — generated from its public pages by
   tools/snapshots/makeshop-lafayette/build-files.js; do not edit. */
window.FILES = ${JSON.stringify(FILES, null, 1)};
`);
  console.log('brands', brands.map((b) => b.name).join(' | '));
  console.log('subs', subs.map((s) => `${s.name}(${s.n})`).join(' '), 'total', total);
  console.log('items', items.length, 'img', items.filter((i) => i.img).length, '· new', news.length, 'img', news.filter((i) => i.img).length);
  console.log(items.slice(0, 3).map((i) => `${i.code} ${i.name} ${i.price}`).join('\n'));
})();
