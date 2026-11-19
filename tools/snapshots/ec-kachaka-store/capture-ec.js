/*
 * ec-kachaka-store — the real EC-CUBE 4.3.1-p1 screens of the video, captured from EC-CUBE running on this machine
 * (tools/eccube/capture.js · runtime.js: PHP 8.3 in WebAssembly, SQLite; a fresh copy in ../eccube-local/inst/ec-kachaka-store).
 *
 *   node tools/snapshots/ec-kachaka-store/capture-ec.js [--shots=<folder>]      (about 10–15 minutes)
 *   node tools/webp.js ec-kachaka-store
 *
 * What it does, in the order of the video:
 *   1. the shop's public data (shop-data.json, from the public pages of store.kachaka.life): shop name, 4 categories with
 *      the store's ids, 7 products with the store's ids / names / prices (tax included, 10 %, rounded down) / codes /
 *      colours / descriptions / images (../eccube-local/data/ec-kachaka-store/save_image, the public images at ≤ 1000 px);
 *      EC-CUBE's sample products / categories / news removed
 *   2. the default theme (front, dashboard, products, オーナーズストア > テンプレート)
 *   3. the template "kachaka" uploaded through the real form (kachaka.zip: app/ + html/assets copied from default) and selected
 *   4. the theme files of public/videos/ec-kachaka-store/js/files.js written step by step (THEME.*), each front page captured
 *      from EC-CUBE rendering them — including the stale header (APP_ENV=prod keeps compiled Twig until the cache is
 *      cleared: キャッシュ管理), the block お知らせバー made in ブロック管理, the layouts changed in レイアウト管理, the
 *      Twig syntax error (EC-CUBE's own error page + the line of its log), smartphone width before / after the CSS
 *   5. finish(): js/ec-snapshot.js + assets/ec
 * Only the local copy's admin / password is used (never a real shop's account).
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const vm = require('vm');
const { spawnSync } = require('child_process');
const ECC = require('../../eccube/capture');

const ROOT = path.resolve(__dirname, '../../..');
const VIDEO = path.join(ROOT, 'public/videos/ec-kachaka-store');
const DATA = JSON.parse(fs.readFileSync(path.join(__dirname, 'shop-data.json'), 'utf8'));
const IMAGES = path.resolve(ROOT, '../eccube-local/data/ec-kachaka-store/save_image');
const DESIGN = path.join(__dirname, 'theme/html/assets');           // Poppins, logo, icons (the design assets of the theme)
const arg = (k) => (process.argv.find((a) => a.startsWith(`--${k}=`)) || '').split('=').slice(1).join('=') || null;
const SHOTS = arg('shots');
if (SHOTS) fs.mkdirSync(SHOTS, { recursive: true });

// the theme files exactly as the video types them
const sb = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(VIDEO, 'js/files.js'), 'utf8'), sb);
const F = sb.window.FILES;

// the list comments of the public product list (/products/list)
const LIST_TEXT = {
  7: 'ソフトウェアの毎月のご利用料・機能改善のためのアップデート料',
  57: '市販の家具を載せられるコンパクトな台車です。\n小回りが効き、最小幅550mmの走行が可能です。',
  42: 'カバーパネルは付け外しが可能です。',
  41: 'カチャカシェルフ2段は1段にして使用することができます。',
  1: 'カチャカシェルフ3段は2段・1段にして使用することができます。',
};
const plain = (h) => String(h || '').replace(/<br\s*\/?>/gi, '\n').replace(/<\/(p|div|li)>/gi, '\n').replace(/<[^>]+>/g, '')
  .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/[ \t]+\n/g, '\n').replace(/\n{2,}/g, '\n').trim();
const SHOP = {
  ...DATA,
  products: DATA.products.map((p) => ({
    ...p,
    description_detail: plain(p.description_detail),
    description_list: LIST_TEXT[p.id] || null,
    // the colour of each code (…b… black / …h… white; the cover panels share one code)
    classCodes: p.classes.map((c) => (p.codes.length > 1 ? (p.codes.find((x) => (/ホワイト/.test(c) ? /h\d/ : /b\d/).test(x)) || p.codes[0]) : p.codes[0])),
  })),
};

const IMPORT = String.raw`
$c = $em->getConnection();
try { $c->executeStatement('PRAGMA foreign_keys = OFF'); } catch (\Throwable $e) {}
$now = new \DateTime('2026-09-01 10:00:00');
$Base = $em->getRepository(\Eccube\Entity\BaseInfo::class)->get();
$Base->setShopName($data['shop']['name']);
$Base->setCompanyName($data['shop']['company']);
// prices on the store are tax included (10 %); this shop rounds the tax down
$Rule = $em->getRepository(\Eccube\Entity\TaxRule::class)->find(1);
$Rule->setRoundingType($em->find(\Eccube\Entity\Master\RoundingType::class, 2));
$em->flush();
foreach (['dtb_product_tag', 'dtb_product_image', 'dtb_product_category', 'dtb_customer_favorite_product', 'dtb_cart_item', 'dtb_product_stock', 'dtb_product_class', 'dtb_product', 'dtb_class_category', 'dtb_class_name', 'dtb_category', 'dtb_news'] as $t) {
  try { $c->executeStatement("DELETE FROM $t"); } catch (\Throwable $e) {}
}
$em->clear();
$Member = $em->find(\Eccube\Entity\Member::class, 1);
$Status = $em->find(\Eccube\Entity\Master\ProductStatus::class, 1);
$SaleType = $em->find(\Eccube\Entity\Master\SaleType::class, 1);
$cats = [];
foreach ($data['categories'] as $row) {
  [$id, $name, $sort] = $row;
  $Cat = new \Eccube\Entity\Category();
  $Cat->setName($name)->setHierarchy(1)->setSortNo($sort)->setCreator($Member)->setCreateDate($now)->setUpdateDate($now);
  $em->persist($Cat);
  $cats[$id] = $Cat;
}
$em->flush();
$CN = new \Eccube\Entity\ClassName();
$CN->setName('カラー')->setSortNo(1)->setCreator($Member)->setCreateDate($now)->setUpdateDate($now);
$em->persist($CN);
$ccs = []; $s = 4;
foreach (['ホワイト', 'ブラック', 'ダークグレー', 'ライトグレー'] as $n) {
  $CC = new \Eccube\Entity\ClassCategory();
  $CC->setName($n)->setClassName($CN)->setSortNo($s--)->setVisible(true)->setCreator($Member)->setCreateDate($now)->setUpdateDate($now);
  $em->persist($CC);
  $ccs[$n] = $CC;
}
$em->flush();
$ex = function ($inc) { for ($p = (int) floor($inc / 1.1) - 3; $p <= $inc; $p++) { if ($p + (int) floor($p * 10 / 100) === (int) $inc) return $p; } return (int) round($inc / 1.1); };
$map = []; $catmap = []; $i = 0;
foreach ($data['products'] as $d) {
  $t = (clone $now)->modify('-' . ($i++ * 10) . ' minutes');
  $P = new \Eccube\Entity\Product();
  $P->setName($d['name'])->setDescriptionDetail($d['description_detail'])->setDescriptionList($d['description_list'])->setStatus($Status)->setCreator($Member)->setCreateDate($t)->setUpdateDate($t);
  $em->persist($P);
  $mk = function ($cc, $code, $stock, $visible) use ($em, $P, $SaleType, $Member, $t, $d, $ex) {
    $PC = new \Eccube\Entity\ProductClass();
    $PC->setProduct($P)->setSaleType($SaleType)->setCode($code)->setPrice02($ex($d['price']))->setStock($stock)->setStockUnlimited($stock === null)
      ->setVisible($visible)->setCreator($Member)->setCreateDate($t)->setUpdateDate($t)->setCurrencyCode('JPY');
    if ($cc) $PC->setClassCategory1($cc);
    $PS = new \Eccube\Entity\ProductStock();
    $PS->setProductClass($PC)->setStock($stock)->setCreator($Member)->setCreateDate($t)->setUpdateDate($t);
    $PC->setProductStock($PS);
    $P->addProductClass($PC);
    $em->persist($PC);
    $em->persist($PS);
  };
  if ($d['classes']) {
    $mk(null, $d['codes'][0], null, false);
    foreach ($d['classes'] as $k => $n) $mk($ccs[$n], $d['classCodes'][$k], $d['stock'] === 0 ? 0 : null, true);
  } else {
    $mk(null, $d['code'], $d['stock'], true);
  }
  $em->flush();
  $Cat = $cats[$d['category']];
  $PCat = new \Eccube\Entity\ProductCategory();
  $PCat->setProduct($P)->setProductId($P->getId())->setCategory($Cat)->setCategoryId($Cat->getId());
  $P->addProductCategory($PCat);
  $em->persist($PCat);
  foreach ($d['images'] as $k => $f) {
    $I = new \Eccube\Entity\ProductImage();
    $I->setFileName($f)->setSortNo($k + 1)->setProduct($P)->setCreator($Member)->setCreateDate($t);
    $P->addProductImage($I);
    $em->persist($I);
  }
  $em->flush();
  $map[$P->getId()] = $d['id'];
}
foreach ($cats as $id => $Cat) $catmap[$Cat->getId()] = $id;
$em->clear();
// the store's own ids (its URLs: /products/detail/1, /?#category_id_13 …): two steps, so no id is taken twice
$move = function ($map, $cols) use ($c) {
  foreach ([[0, 100000], [100000, 0]] as [$a, $b]) foreach ($map as $old => $new) foreach ($cols as [$tb, $col]) {
    $from = $a ? $old + $a : $old; $to = $b ? $old + $b : $new;
    $c->executeStatement("UPDATE $tb SET $col = ? WHERE $col = ?", [$to, $from]);
  }
};
$move($map, [['dtb_product', 'id'], ['dtb_product_class', 'product_id'], ['dtb_product_category', 'product_id'], ['dtb_product_image', 'product_id']]);
$move($catmap, [['dtb_category', 'id'], ['dtb_category', 'parent_category_id'], ['dtb_product_category', 'category_id']]);
return ['products' => $c->fetchAllAssociative('SELECT p.id, p.name, pc.product_code, pc.price02, pc.stock FROM dtb_product p JOIN dtb_product_class pc ON pc.product_id = p.id WHERE pc.visible = 1 ORDER BY p.id'),
  'categories' => $c->fetchAllAssociative('SELECT id, category_name, sort_no FROM dtb_category ORDER BY sort_no DESC')];
`;

const copyDir = (a, b) => { fs.mkdirSync(b, { recursive: true }); for (const e of fs.readdirSync(a, { withFileTypes: true })) { const s = path.join(a, e.name), d = path.join(b, e.name); if (e.isDirectory()) copyDir(s, d); else fs.copyFileSync(s, d); } };

// a copy made by an earlier run is reset (its database, .env, the theme folders, the cache) instead of copied anew
// (copying the whole EC-CUBE takes minutes); --fresh copies it anew
const INST = path.resolve(ROOT, '../eccube-local/inst/ec-kachaka-store');
const BASE = path.resolve(ROOT, '../eccube-local/inst/base');
const FRESH = process.argv.includes('--fresh') || !fs.existsSync(path.join(INST, 'var/eccube.db'));
if (!FRESH) {
  fs.copyFileSync(path.join(BASE, 'var/eccube.db'), path.join(INST, 'var/eccube.db'));
  fs.copyFileSync(path.join(BASE, '.env'), path.join(INST, '.env'));
  for (const d of ['app/template/kachaka', 'html/template/kachaka', 'var/cache/prod', 'var/log/prod']) fs.rmSync(path.join(INST, d), { recursive: true, force: true });
}

(async () => {
  const cap = await ECC.start({ id: 'ec-kachaka-store', version: 4, fresh: FRESH, site: 'http://localhost:8080', date: '2026-11-07', time: '10:24', shots: SHOTS });
  const { page } = cap;
  const W = (map) => cap.files(map);
  const front = async (rel, key, o = {}) => {
    await cap.go(rel, o.ready || 'body');
    if (key) await cap.capture(key, o);
    return page;
  };
  const check = async (what, fn, ...a) => { const r = await page.evaluate(fn, ...a); ECC.log(`check ${what}:`, JSON.stringify(r)); return r; };
  try {
    await page.setCacheEnabled(false);
    // 1. the shop's data
    copyDir(IMAGES, path.join(cap.instance, 'html/upload/save_image'));
    const imp = await cap.php(IMPORT, SHOP);
    ECC.log('imported', JSON.stringify(imp).slice(0, 900));
    await cap.console(['cache:clear', '--no-warmup']);

    // 2. the default theme
    await front('/', 'f-default');
    await front('/products/detail/1', 'f-default-detail');
    await cap.login();
    await cap.go('/admin', '.c-contentsArea');
    await cap.capture('a-dashboard');
    await cap.go('/admin/product', '.c-contentsArea');
    await cap.capture('a-products');
    await cap.go('/admin/store/template', '.c-contentsArea');
    await cap.capture('a-template');

    // 3. the template kachaka: upload (the real form) and select
    const stage = fs.mkdtempSync(path.join(os.tmpdir(), 'kachaka-theme-'));
    fs.mkdirSync(path.join(stage, 'app'), { recursive: true });
    copyDir(path.join(cap.instance, 'html/template/default/assets'), path.join(stage, 'html/assets'));
    const zip = path.join(stage, 'kachaka.zip');
    const tr = spawnSync('C:/Windows/System32/tar.exe', ['-a', '-c', '-f', zip, '-C', stage, 'app', 'html'], { encoding: 'utf8' });
    if (tr.status) throw new Error('tar: ' + tr.stderr);
    cap.data.zipSize = fs.statSync(zip).size;
    await cap.go('/admin/store/template/install', '#admin_template_code');
    await cap.capture('a-template-add', { inputs: [['#admin_template_code', 'code'], ['#admin_template_name', 'name']] });
    await cap.type('#admin_template_code', 'kachaka');
    await cap.type('#admin_template_name', 'kachaka Online Store');
    await (await page.$('#admin_template_file')).uploadFile(zip);
    await Promise.all([page.waitForNavigation({ waitUntil: 'load' }), page.click('form button[type=submit]')]);
    await cap.settle('.c-contentsArea');
    await cap.capture('a-template-added');
    const tplId = await page.evaluate(() => { const r = [...document.querySelectorAll('input[name=template]')].find((x) => /kachaka/.test(x.closest('tr').textContent)); return r && r.value; });
    cap.data.templateId = tplId;
    await page.click(`input[name=template][value="${tplId}"]`);
    await Promise.all([page.waitForNavigation({ waitUntil: 'load' }), page.click('form button[type=submit]')]);
    await cap.settle('.c-contentsArea');
    await cap.capture('a-template-saved');
    ECC.log('.env:', cap.read('.env').match(/ECCUBE_TEMPLATE_CODE=.*/)[0]);

    // 4. default_frame + kachaka.css, then the header / footer
    copyDir(DESIGN, path.join(cap.instance, 'html/template/kachaka/assets'));
    await W({ ...F.THEME.frame, ...F.THEME.css });
    await front('/', 'f-css');
    await W(F.THEME.header1);
    await front('/', 'f-header1');
    // header.twig once more (+ お問い合わせ): APP_ENV=prod still renders the compiled one
    await W(F.THEME.header2);
    await front('/', 'f-header-stale');
    await check('stale header items', () => document.querySelectorAll('.ec-headerNav__item').length);
    await cap.go('/admin/content/cache', '.c-contentsArea');
    await cap.capture('a-cache');
    const del = await page.evaluateHandle(() => [...document.querySelectorAll('button[type=submit], button.btn-ec-conversion')].find((b) => /削除/.test(b.textContent)) || document.querySelector('form button[type=submit]'));
    await Promise.all([page.waitForNavigation({ waitUntil: 'load' }), del.click()]);
    await cap.settle('.c-contentsArea');
    await cap.capture('a-cache-done');
    await front('/', 'f-header2');
    await check('header items after the cache', () => document.querySelectorAll('.ec-headerNav__item').length);

    // 5. ブロック管理: お知らせバー · レイアウト管理: the left column
    await cap.go('/admin/content/block', '.c-contentsArea');
    await cap.capture('a-blocks');
    await cap.go('/admin/content/block/new', '#block_name');
    await cap.capture('a-block-new', { inputs: [['#block_name', 'name'], ['#block_file_name', 'file']] });
    await cap.type('#block_name', 'お知らせバー');
    await cap.type('#block_file_name', 'header_news');
    await page.evaluate((src) => { const ed = window.ace.edit('editor'); ed.setValue(src, 1); ed.clearSelection(); ed.blur(); }, F.HEADER_NEWS);
    await cap.capture('a-block-filled', { inputs: [['#block_name', 'name'], ['#block_file_name', 'file']] });
    await Promise.all([page.waitForNavigation({ waitUntil: 'load' }), page.click('.c-conversionArea button[type=submit], form button.btn-ec-conversion')]);
    await cap.settle('.c-contentsArea');
    await cap.capture('a-block-saved');
    ECC.log('block file:', fs.existsSync(path.join(cap.instance, F.T + 'Block/header_news.twig')));
    await cap.go('/admin/content/layout', '.c-contentsArea');
    await cap.capture('a-layouts');
    const MOVE = (moves) => {
      const blocks = [...document.querySelectorAll('[id^="detail_box__layout_item"]')];
      const find = (name) => blocks.find((b) => (b.querySelector('input.name') || {}).value === name);
      for (const [name, sec, idx] of moves) {
        const b = find(name);
        if (!b) throw new Error('no block ' + name);
        const pos = document.getElementById('position_' + sec);
        const kids = [...pos.querySelectorAll('[id^="detail_box__layout_item"]')].filter((k) => k !== b);
        if (idx == null || idx >= kids.length) pos.appendChild(b); else kids[idx].parentNode.insertBefore(b, kids[idx]);
        pos.querySelectorAll('.target-placeholder').forEach((p) => p.remove());
      }
      document.querySelectorAll('[id^="position_"]').forEach((pos) => {
        const sec = pos.id.replace('position_', '');
        [...pos.querySelectorAll('[id^="detail_box__layout_item"]')].forEach((b, i) => { b.querySelector('.target-id').value = sec; b.querySelector('.block-row').value = i + 1; });
      });
      return blocks.length;
    };
    const saveLayout = async () => {
      const btn = await page.evaluateHandle(() => [...document.querySelectorAll('button[type=submit]')].find((b) => /登録/.test(b.textContent)));
      await Promise.all([page.waitForNavigation({ waitUntil: 'load' }), btn.click()]);
      await cap.settle('.c-contentsArea');
    };
    const head = [['お知らせバー', 3, 0], ['ロゴ', 0], ['カテゴリナビ(PC)', 5]];
    await cap.go('/admin/content/layout/1/edit', '#position_3');
    await cap.capture('a-layout1');
    await page.evaluate(MOVE, [...head, ['新入荷商品特集', 0], ['トピック', 0], ['新着商品', 0], ['カテゴリ', 0], ['新着情報', 0]]);
    await cap.capture('a-layout1-moved');
    await saveLayout();
    await cap.capture('a-layout1-saved');
    await cap.go('/admin/content/layout/2/edit', '#position_3');
    await page.evaluate(MOVE, head);
    await saveLayout();
    await cap.capture('a-layout2-saved');
    await W(F.THEME.catnav);
    await front('/', 'f-layout');
    await check('left column', () => !!document.querySelector('.ec-layoutRole__left .ec-categoryNaviRole__title') && !!document.querySelector('.ec-headerNewsRole'));

    // 6. index.twig: first without the inner {% endfor %} → EC-CUBE's error page, then fixed
    await W(F.THEME.indexBad);
    await front('/', 'f-error');
    const logDir = path.join(cap.instance, 'var/log/prod');
    const logs = fs.existsSync(logDir) ? fs.readdirSync(logDir).map((f) => path.join(logDir, f)).sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs) : [];
    for (const f of logs.filter((x) => /front-/.test(x)).concat(logs)) {
      const line = fs.readFileSync(f, 'utf8').split('\n').reverse().find((l) => /Unexpected \\?"endblock/.test(l));
      if (line) { cap.data.errorLog = { file: path.relative(cap.instance, f).replace(/\\/g, '/'), line: line.slice(0, 1200) }; break; }
    }
    ECC.log('error log:', JSON.stringify(cap.data.errorLog || logs.map((f) => path.basename(f))).slice(0, 600));
    await W(F.THEME.index);
    await front('/', 'f-top');

    // 7. list · detail
    await W(F.THEME.product);
    await front('/products/list', 'f-list');
    await front('/products/detail/1', 'f-detail');

    // 8. smartphone (390 × 844): the header before / after its CSS
    await cap.view({ width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 1 });
    await front('/', 's-top-bad');
    await W(F.THEME.sp);
    await front('/', 's-top');
    await front('/products/detail/1', 's-detail');
    await cap.view('max');

    // 9. into the cart (the real form post of the detail page)
    await front('/products/detail/1', null);
    await Promise.all([page.waitForNavigation({ waitUntil: 'load' }), page.click('button.add-cart')]);
    await cap.settle('body');
    await cap.capture('f-cart');
    await cap.go('/admin/store/template', '.c-contentsArea');
    await cap.capture('a-template-final');

    cap.data.products = imp.products;
    await cap.finish();
    fs.rmSync(stage, { recursive: true, force: true });
  } catch (e) {
    console.error(e);
    try { await page.screenshot({ path: path.join(SHOTS || os.tmpdir(), 'ec-kachaka-error.jpg'), type: 'jpeg', quality: 70 }); } catch (er) { /* closed */ }
    await cap.abort();
    process.exit(1);
  }
  process.exit(0);
})();
