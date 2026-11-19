/*
 * The real EC-CUBE screens of the ec-kuretake-btob video, captured from EC-CUBE itself (tools/eccube/capture.js:
 * EC-CUBE 4.3.1-p1 on PHP 8.3 in WebAssembly, SQLite, in ../eccube-local/inst/ec-kuretake-btob, shown as the
 * developer's http://localhost:8080).
 *
 *   node tools/snapshots/ec-kuretake-btob/capture-ec.js [--shots=<folder>]      (20–35 min; one Chrome + one EC-CUBE)
 *   → node tools/webp.js ec-kuretake-btob
 *
 * Before: scrape-shop.js (shop-data.json and the pictures in ../eccube-local/data/ec-kuretake-btob/save_image),
 * build-core.js (js/eccube-core.js). The copy is made fresh, then, in the order of the video:
 *   setup    the bundled plugins removed; 呉竹 BtoBオンライン注文サイト's public data: shop info, 特定商取引法に基づく表記,
 *            the category tree with the live ids (all top categories, 5 sub categories), 28 products with the live
 *            product ids / 品番 / names / 型・色 / 定価 / 特徴 / pictures, news up to 2026-09; delivery 佐川急便, 銀行振込;
 *            three existing 取引先 (invented, example.com) — 仮会員機能 off (the state before the work)
 *   stage 0  the shop as it is (guest: list with cart buttons), admin products
 *   stage 1  CustomerTrait / ProductTrait / admin forms → eccube:generate:proxies → doctrine:schema:update (the real SQL)
 *            → 会員登録 (取引先情報 at the bottom), 商品登録 (発注単位 typed and saved)
 *   stage 2  基本設定: 仮会員機能 on (saved for real); 会社名 required, approval subscriber, templates → 新規会員登録
 *            typed for real → 確認 → 仮登録完了; the login fails (仮会員); 会員一覧 → 取引先情報 + 本会員 → saved
 *            (the 本登録完了 mail: EC-CUBE's log)
 *   stage 3  卸価格 (the first version) + templates: guest detail / list, the signed-in 取引先 (掛率 60 %): list, detail,
 *            カートに入れる → cart; admin 商品一覧: the 販売価格 of 清書用墨滴 overwritten with the 卸価格 (the bug)
 *   stage 4  the fix; 販売価格 restored in 商品登録 (typed); the cart again; 商品一覧 right
 *   stage 5  OrderUnitValidator: 美文字筆ぺん 中字 × 3 → the cart says 10 個単位 and makes it 10
 *   stage 6  支払方法 掛け払い（請求書払い） added (typed); OrderTypeExtension; ご注文手続き: no 掛け払い (配送方法 not ticked —
 *            the mistake) → 配送方法 ticked → 掛け払い → 確認 → 完了; another 取引先 without 掛け払い: only 銀行振込
 *   stage 7  受注管理: the orders (会社名), the 掛け払い order
 * Console outputs and log lines the video prints are kept in EC_SNAPSHOT.data.
 */
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '../../..');
const ECC = require(path.join(ROOT, 'tools/eccube/capture'));
const SRC = require(path.join(ROOT, 'public/videos/ec-kuretake-btob/js/b2b-src.js'));
const CORE = require(path.join(ROOT, 'public/videos/ec-kuretake-btob/js/eccube-core.js'));
const ID = 'ec-kuretake-btob';
const arg = (k) => (process.argv.find((a) => a.startsWith(`--${k}=`)) || '').split('=').slice(1).join('=') || null;
const SHOTS = arg('shots');
if (SHOTS) fs.mkdirSync(SHOTS, { recursive: true });
const SHOP = JSON.parse(fs.readFileSync(path.join(__dirname, 'shop-data.json'), 'utf8'));
const IMG = path.resolve(ROOT, '../eccube-local/data/ec-kuretake-btob/save_image');
const log = (...a) => console.log(`[${new Date().toLocaleTimeString('sv-SE')}]`, ...a);
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const A = SRC.ACCOUNTS;

// the products: the live ones, without licensed character goods and the assorted set
const SKIP = [55294, 55296, 55246];
const SUBS = [3, 128, 68, 66, 136];
const products = SHOP.products.filter((p) => !SKIP.includes(p.id)).map((p, i) => {
  const s = p.spec || {};
  const feat = (s['商品特徴'] || '').trim();
  const lines = [feat, '', ...['商品サイズ', '外装サイズ', '素材', 'インキ', '原産国'].filter((k) => s[k]).map((k) => `${k}：${s[k].split('\n')[0]}`), p.jan ? `JANコード：${p.jan}` : ''].filter((x, j, a) => x || (j > 0 && a[j - 1]));
  return { id: p.id, name: `${p.name} ${p.type || ''}`.trim(), code: p.code, price: p.price, unit: p.unit, cat: p.category, file: p.file, detail: lines.join('\n').trim(), list: p.type || null, n: i };
});
const parentOf = Object.fromEntries(SHOP.categories.map((c) => [c.id, c.parent]));
const cats = SHOP.categories.filter((c) => !c.parent || SUBS.includes(c.id));
const NEWS = SHOP.news.filter((n) => n.date && n.date < '2026-11-10').slice(0, 3).map((n) => ({ ...n, body: n.body.split('\n').filter((l) => l.trim() && !/TEL|FAX|奈良市|南京終町/.test(l)).slice(0, 6).join('\n') }));
const LAW = SHOP.law.filter(([k]) => !/代表/.test(k)).map(([k, v]) => [k, v.replace(/\n{2,}/g, '\n')]);
const EXISTING = [
  { ...A.existing, invoice: false },
  { company: '合同会社あおば書房（テスト）', name01: 'テスト', name02: '次郎', kana01: 'テスト', kana02: 'ジロウ', email: 'aoba.test@example.com', zip: '6048001', pref: 26, addr01: '京都市中京区', addr02: '4-4', tel: '0750000000', code: 'T-11872', business: '雑貨店・書店', rate: 62, invoice: true },
  { company: '株式会社ならやま商事（テスト）', name01: 'テスト', name02: '三郎', kana01: 'テスト', kana02: 'サブロウ', email: 'narayama.test@example.com', zip: '6300001', pref: 29, addr01: '奈良市', addr02: '5-5', tel: '0742000001', code: 'T-09114', business: '文具卸・雑貨卸', rate: 58, invoice: true },
];

const SETUP_PHP = String.raw`
$conn = $em->getConnection();
$now = new \DateTime('2026-09-28 10:00:00');
foreach (['dtb_product_category', 'dtb_product_tag', 'dtb_product_image', 'dtb_product_stock', 'dtb_customer_favorite_product', 'dtb_cart_item', 'dtb_cart',
          'dtb_product_class', 'dtb_product', 'dtb_class_category', 'dtb_class_name', 'dtb_category', 'dtb_tag', 'dtb_news', 'dtb_plugin', 'dtb_customer_address', 'dtb_customer'] as $t) {
    $conn->executeStatement("DELETE FROM $t");
}
$conn->executeStatement('DELETE FROM dtb_tax_rule WHERE product_class_id IS NOT NULL');
foreach ($conn->fetchFirstColumn("SELECT name FROM sqlite_master WHERE type = 'table' AND (substr(name, 1, 4) = 'plg_' OR substr(name, 1, 7) = 'oauth2_')") as $t) {
    $conn->executeStatement("DROP TABLE $t");
}
foreach ([\Eccube\Entity\Category::class, \Eccube\Entity\Product::class] as $cls) {
    $md = $em->getClassMetadata($cls);
    $md->setIdGeneratorType(\Doctrine\ORM\Mapping\ClassMetadata::GENERATOR_TYPE_NONE);
    $md->setIdGenerator(new \Doctrine\ORM\Id\AssignedGenerator());
}
$setId = function ($obj, $id) { $r = new \ReflectionProperty(get_class($obj), 'id'); $r->setAccessible(true); $r->setValue($obj, $id); };
$Member = $em->getRepository(\Eccube\Entity\Member::class)->find(1);
$Pref = fn ($id) => $em->getRepository(\Eccube\Entity\Master\Pref::class)->find($id);

$B = $em->getRepository(\Eccube\Entity\BaseInfo::class)->get();
$activateBefore = $B->isOptionCustomerActivate();
$B->setShopName('呉竹 BtoBオンライン注文サイト')->setCompanyName('株式会社呉竹')->setPostalCode('6308670')->setPref($Pref(29))
  ->setAddr01('奈良市南京終町')->setAddr02('7-576')
  ->setEmail01('b2b.weborder@kuretake.co.jp')->setEmail02('b2b.weborder@kuretake.co.jp')->setEmail03('b2b.weborder@kuretake.co.jp')->setEmail04('b2b.weborder@kuretake.co.jp')
  ->setDeliveryFreeAmount(null)->setDeliveryFreeQuantity(null)->setOptionCustomerActivate(false)->setOptionFavoriteProduct(true);
$laws = $em->getRepository(\Eccube\Entity\TradeLaw::class)->findBy([], ['sortNo' => 'ASC']);
foreach ($laws as $i => $L) {
    $L->setName($data['law'][$i][0] ?? null)->setDescription($data['law'][$i][1] ?? null)->setDisplayOrderScreen(false);
}

$cats = [];
$sort = 1000;
foreach ($data['categories'] as $c0) {
    $c = new \Eccube\Entity\Category();
    $setId($c, (int) $c0['id']);
    $c->setName($c0['name'])->setHierarchy($c0['parent'] ? 2 : 1)->setSortNo($sort--)->setCreator($Member)->setCreateDate($now)->setUpdateDate($now);
    if ($c0['parent']) $c->setParent($cats[(int) $c0['parent']]);
    $em->persist($c);
    $cats[(int) $c0['id']] = $c;
}
$em->flush();

$SaleType = $em->getRepository(\Eccube\Entity\Master\SaleType::class)->find(1);
$Show = $em->getRepository(\Eccube\Entity\Master\ProductStatus::class)->find(1);
foreach ($data['products'] as $p) {
    $t = (clone $now)->modify('-' . ($p['n'] * 7) . ' minutes');
    $P = new \Eccube\Entity\Product();
    $setId($P, $p['id']);
    $P->setName($p['name'])->setStatus($Show)->setDescriptionDetail($p['detail'])->setDescriptionList($p['list'])
      ->setCreator($Member)->setCreateDate($t)->setUpdateDate($t);
    $em->persist($P);
    foreach (array_unique(array_filter([(int) $p['cat'], (int) ($data['parent'][$p['cat']] ?? 0)])) as $cid) {
        $pc = (new \Eccube\Entity\ProductCategory())->setProduct($P)->setCategory($cats[$cid])->setProductId($p['id'])->setCategoryId($cid);
        $P->addProductCategory($pc);
        $em->persist($pc);
    }
    if ($p['file']) {
        $pi = (new \Eccube\Entity\ProductImage())->setProduct($P)->setFileName($p['file'])->setSortNo(1)->setCreator($Member)->setCreateDate($t);
        $P->addProductImage($pi);
        $em->persist($pi);
    }
    // 定価 (tax excluded) = 通常価格 and 販売価格 (what a 取引先 without a 掛率 pays)
    $PC = new \Eccube\Entity\ProductClass();
    $PC->setProduct($P)->setSaleType($SaleType)->setPrice01((string) $p['price'])->setPrice02((string) $p['price'])->setVisible(true)->setStockUnlimited(true)->setStock(null)
       ->setCode($p['code'])->setCreator($Member)->setCreateDate($t)->setUpdateDate($t)->setCurrencyCode('JPY');
    $PS = (new \Eccube\Entity\ProductStock())->setProductClass($PC)->setStock(null)->setCreator($Member)->setCreateDate($t)->setUpdateDate($t);
    $PC->setProductStock($PS);
    $P->addProductClass($PC);
    $em->persist($PC);
    $em->persist($PS);
}
$em->flush();

foreach ($data['news'] as $i => $n) {
    $N = new \Eccube\Entity\News();
    $N->setTitle($n['title'])->setDescription(nl2br($n['body']))->setPublishDate(new \DateTime($n['date'] . ' 09:00:00'))->setVisible(true)
      ->setCreator($Member)->setCreateDate($now)->setUpdateDate($now);
    $em->persist($N);
}

// delivery: 佐川急便 (送料は個別契約: 0 円); payment: 銀行振込 only (掛け払い is added in the video)
$D = $em->getRepository(\Eccube\Entity\Delivery::class)->find(1);
$D->setName('佐川急便')->setServiceName('佐川急便')->setDescription('ご注文日から3営業日後以内を目安に発送')->setConfirmUrl(null);
foreach ($em->getRepository(\Eccube\Entity\DeliveryFee::class)->findBy(['Delivery' => $D]) as $F) $F->setFee('0');
$D2 = $em->getRepository(\Eccube\Entity\Delivery::class)->find(2);
if ($D2) $D2->setVisible(false);
$em->flush();
$conn->executeStatement('DELETE FROM dtb_payment_option WHERE payment_id <> 3 OR delivery_id <> 1');
$conn->executeStatement('DELETE FROM dtb_payment WHERE id <> 3');
$Bank = $em->getRepository(\Eccube\Entity\Payment::class)->find(3);
$Bank->setMethod('銀行振込')->setCharge('0')->setRuleMin('0')->setRuleMax(null)->setVisible(true)->setSortNo(1);
$em->flush();

// existing 取引先 (invented)
$ids = [];
foreach ($data['customers'] as $k => $a) {
    $C = new \Eccube\Entity\Customer();
    $C->setName01($a['name01'])->setName02($a['name02'])->setKana01($a['kana01'])->setKana02($a['kana02'])->setCompanyName($a['company'])->setEmail($a['email'])
      ->setPostalCode($a['zip'])->setPref($Pref($a['pref']))->setAddr01($a['addr01'])->setAddr02($a['addr02'])->setPhoneNumber($a['tel'])
      ->setPassword(password_hash('kuretake-test-2026', PASSWORD_BCRYPT))->setSalt(null)->setSecretKey(bin2hex(random_bytes(16)))
      ->setStatus($em->getRepository(\Eccube\Entity\Master\CustomerStatus::class)->find(2))->setPoint('0')
      ->setCreateDate((clone $now)->modify('-' . (40 - $k * 9) . ' days'))->setUpdateDate($now);
    $em->persist($C);
    $em->flush();
    $ids[] = $C->getId();
}
return ['activateBefore' => $activateBefore, 'products' => count($data['products']), 'categories' => count($cats), 'customers' => $ids,
  'payments' => $conn->fetchAllAssociative('SELECT id, payment_method FROM dtb_payment')];
`;

function logLines(dir, re, n = 3) {
  const d = path.join(dir, 'var/log/prod');
  if (!fs.existsSync(d)) return { file: '', lines: [] };
  const files = fs.readdirSync(d).map((f) => path.join(d, f)).sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs);
  for (const f of files) {
    const lines = fs.readFileSync(f, 'utf8').split('\n').filter((l) => re.test(l));
    if (lines.length) return { file: path.relative(dir, f).replace(/\\/g, '/'), lines: lines.slice(-n) };
  }
  return { file: '', lines: [] };
}

(async () => {
  const cap = await ECC.start({ id: ID, version: 4, fresh: true, site: 'http://localhost:8080', date: '2026-11-10', time: '10:20', shots: SHOTS });
  const { page } = cap;
  const D = cap.data;
  const nav = async (fn, ready = 'body', arg2) => { await Promise.all([page.waitForNavigation({ waitUntil: 'load', timeout: 600000 }), page.evaluate(fn, arg2)]); await cap.settle(ready); };
  const cacheClear = async () => { await cap.console(['cache:clear', '--no-warmup']); fs.rmSync(path.join(cap.instance, 'var/cache/prod'), { recursive: true, force: true }); };
  const dbConsole = async (input) => {
    const r = await cap.php(String.raw`
$app = new \Symfony\Bundle\FrameworkBundle\Console\Application($kernel);
$app->setAutoExit(false);
$out = new \Symfony\Component\Console\Output\BufferedOutput();
$code = $app->run(new \Symfony\Component\Console\Input\ArrayInput($data), $out);
return ['code' => $code, 'out' => $out->fetch()];`, input);
    log(`console ${JSON.stringify(input)} → ${r.code}`, r.out.slice(0, 600));
    if (r.code !== 0) throw new Error(r.out.slice(-2500));
    return r.out;
  };
  const adminGo = async (rel, ready = '.c-contentsArea') => {
    await cap.go(rel, 'body');
    if (page.url().includes('/admin/login')) { log('signed out — login again'); await cap.login(); await cap.go(rel, 'body'); }
    await cap.settle(ready, 300000);
  };
  const center = (sel) => page.evaluate((s) => { const e = document.querySelector(s); if (e) e.scrollIntoView({ block: 'center' }); return !!e; }, sel);
  const frontLogin = async (email, pass) => {
    await cap.go('/logout', 'body');
    await cap.go('/mypage/login', '#login_email');
    await cap.type('#login_email', email);
    await cap.type('#login_pass', pass);
    await nav(() => document.querySelector('#login_email').form.submit());
  };
  const ajaxAdd = async (id, qty, key) => {
    await cap.go('/products/detail/' + id, '#form1');
    await cap.type('#quantity', String(qty));
    await page.click('button.add-cart');
    await page.waitForFunction(() => { const m = document.querySelector('.ec-modal'); return m && getComputedStyle(m).display !== 'none'; }, { timeout: 300000 }).catch(() => log('no modal'));
    await wait(1500);
    D['modal' + id] = await page.evaluate(() => (document.querySelector('.ec-modal') || {}).textContent || '').then((t) => t.replace(/\s+/g, ' ').trim());
    if (key) await cap.capture(key);
  };
  const toShopping = async () => {
    await cap.go('/cart', '.ec-cartRole');
    await nav(() => { location.href = document.querySelector('a.ec-blockBtn--action[href*="cart/buystep"]').href; }, '#shopping-form');
  };
  const paymentNames = () => page.evaluate(() => [...document.querySelectorAll('#shopping-form input[type=radio][name$="[Payment]"]')].map((x) => (x.closest('div') || x.parentElement).textContent.replace(/\s+/g, ' ').trim()));
  const choosePayment = async (name) => {
    const cur = await page.evaluate((n) => {
      const r = [...document.querySelectorAll('#shopping-form input[type=radio][name$="[Payment]"]')].find((x) => (x.closest('div') || x.parentElement).textContent.includes(n));
      return r ? (r.checked ? 'checked' : r.id) : null;
    }, name);
    if (!cur) throw new Error('no payment ' + name);
    if (cur === 'checked') return;
    await nav((idd) => { const r = document.getElementById(idd); r.checked = true; window.$(r).trigger('change'); }, '#shopping-form', cur);
  };
  const confirmBtn = () => nav(() => document.querySelector('#shopping-form button.ec-blockBtn--action').click());
  const dbPrice = (id) => cap.php("return $em->getConnection()->fetchAssociative('SELECT price01, price02 FROM dtb_product_class WHERE product_id = ?', [$data]);", id);
  const ids = (sel) => page.evaluate((s) => [...document.querySelectorAll(s)].map((e) => e.id || e.name), sel);
  try {
    // ---------------------------------------------------------------- setup
    const dest = path.join(cap.instance, 'html/upload/save_image');
    fs.mkdirSync(dest, { recursive: true });
    for (const f of fs.readdirSync(IMG)) fs.copyFileSync(path.join(IMG, f), path.join(dest, f));
    for (const d of ['app/Plugin', 'html/plugin']) {
      const dd = path.join(cap.instance, d);
      if (fs.existsSync(dd)) for (const x of fs.readdirSync(dd)) fs.rmSync(path.join(dd, x), { recursive: true, force: true });
    }
    fs.rmSync(path.join(cap.instance, 'var/cache/prod'), { recursive: true, force: true });
    D.setup = await cap.php(SETUP_PHP, { categories: cats, parent: parentOf, products, news: NEWS, law: LAW, customers: EXISTING });
    log('setup', JSON.stringify(D.setup));
    await cacheClear();

    // ---------------------------------------------------------------- stage 0: the shop as it is
    await cap.go('/', 'body');
    await cap.capture('f-top-0');
    await cap.go('/products/list?category_id=128', '.ec-shelfGrid');
    await cap.capture('f-list-0');
    await cap.login();
    await adminGo('/admin/product');
    await cap.capture('a-products-0');
    await adminGo('/admin/customer');
    await cap.capture('a-customers-0');

    // ---------------------------------------------------------------- stage 1: 取引先情報 (entities, admin forms)
    await cap.files(SRC.files(1, CORE));
    D.proxies = await cap.console(['eccube:generate:proxies']);
    await cacheClear();
    D.schemaDump = await dbConsole({ command: 'doctrine:schema:update', '--dump-sql': true });
    D.schemaForce = await dbConsole({ command: 'doctrine:schema:update', '--force': true });
    // the existing 取引先's data (as in the 基幹 system) and the 発注単位 of every product but the one the video types
    D.b2bData = await cap.php(String.raw`
foreach ($data['customers'] as $a) {
    $C = $em->getRepository(\Eccube\Entity\Customer::class)->findOneBy(['email' => $a['email']]);
    $C->setCustomerCode($a['code'])->setBusinessType($a['business'])->setWholesaleRate($a['rate'])->setInvoicePayment($a['invoice']);
}
foreach ($data['units'] as $id => $u) {
    $P = $em->getRepository(\Eccube\Entity\Product::class)->find($id);
    if ($P) $P->setOrderUnit($u);
}
$em->flush();
return $em->getConnection()->fetchAllAssociative('SELECT id, company_name, customer_code, wholesale_rate, invoice_payment FROM dtb_customer');`,
    { customers: EXISTING, units: Object.fromEntries(products.filter((p) => p.id !== 991).map((p) => [p.id, p.unit])) });
    log('b2b data', JSON.stringify(D.b2bData));
    const minato = D.b2bData.find((c) => /みなと/.test(c.company_name));
    await adminGo(`/admin/customer/${minato.id}/edit`, '#admin_customer_customer_code');
    D.custIds = await ids('#customer_form input, #customer_form select, form input[id^=admin_customer], form select[id^=admin_customer]');
    log('customer form', D.custIds.join(' '));
    await center('#admin_customer_customer_code');
    await cap.capture('a-customer-ext');
    await adminGo('/admin/product/product/991/edit', '#admin_product_order_unit');
    D.prodIds = await ids('form input[id^=admin_product]');
    await center('#admin_product_order_unit');
    await cap.capture('a-product-991', { inputs: [['#admin_product_order_unit', 'order_unit']] });
    await cap.type('#admin_product_order_unit', '10');
    await nav(() => document.querySelector('#form1').submit(), '#admin_product_order_unit');
    await center('#admin_product_order_unit');
    await cap.capture('a-product-991-saved');
    D.unit991 = await cap.php("return $em->getRepository(\\Eccube\\Entity\\Product::class)->find(991)->getOrderUnit();");
    log('unit 991', D.unit991);

    // ---------------------------------------------------------------- stage 2: 会員登録の承認制
    await adminGo('/admin/setting/shop', '#shop_master_option_customer_activate');
    await center('#shop_master_option_customer_activate');
    await cap.capture('a-shop');
    await page.evaluate(() => { const e = document.querySelector('#shop_master_option_customer_activate'); if (!e.checked) e.click(); });
    await nav(() => document.querySelector('#shop_master_option_customer_activate').form.submit(), '#shop_master_option_customer_activate');
    await center('#shop_master_option_customer_activate');
    await cap.capture('a-shop-saved');
    await cap.files(SRC.files(2, CORE));
    await cacheClear();
    await cap.go('/entry', '#entry_company_name');
    D.entryIds = await ids('form input, form select');
    log('entry form', D.entryIds.join(' '));
    const ap = A.applicant;
    // the fields the video does not type are filled first (they are in the captured screen)
    await cap.type('#entry_kana_kana01', ap.kana01);
    await cap.type('#entry_kana_kana02', ap.kana02);
    await cap.type('#entry_postal_code', ap.zip);
    await page.select('#entry_address_pref', String(ap.pref));
    await cap.type('#entry_address_addr01', ap.addr01);
    await cap.type('#entry_address_addr02', ap.addr02);
    await cap.type('#entry_phone_number', ap.tel);
    const ENTRY_INPUTS = [['#entry_company_name', 'company'], ['#entry_name_name01', 'name01'], ['#entry_name_name02', 'name02'], ['#entry_email_first', 'email1'], ['#entry_email_second', 'email2'], ['#entry_plain_password_first', 'pass1'], ['#entry_plain_password_second', 'pass2']];
    await page.evaluate(() => window.scrollTo(0, 0));
    await cap.capture('f-entry', { inputs: ENTRY_INPUTS });
    await cap.type('#entry_company_name', ap.company);
    await cap.type('#entry_name_name01', ap.name01);
    await cap.type('#entry_name_name02', ap.name02);
    await cap.type('#entry_email_first', ap.email);
    await cap.type('#entry_email_second', ap.email);
    await cap.type('#entry_plain_password_first', ap.pass);
    await cap.type('#entry_plain_password_second', ap.pass);
    await page.evaluate(() => { const c = document.querySelector('#entry_user_policy_check'); if (c && !c.checked) c.click(); });
    await nav(() => { const f = document.querySelector('#entry_company_name').form; const b = f.querySelector('button[type=submit][name=mode][value=confirm], button.ec-blockBtn--action'); if (b) b.click(); else f.submit(); }, 'body');
    await cap.capture('f-entry-confirm');
    await nav(() => { const b = [...document.querySelectorAll('button[type=submit]')].find((x) => /登録/.test(x.textContent)); b.click(); }, 'body');
    await cap.capture('f-entry-complete');
    D.applicant = await cap.php("$c = $em->getRepository(\\Eccube\\Entity\\Customer::class)->findOneBy(['email' => $data]); return $c ? ['id' => $c->getId(), 'status' => $c->getStatus()->getName(), 'company' => $c->getCompanyName()] : null;", ap.email);
    log('applicant', JSON.stringify(D.applicant));
    D.entryLog = logLines(cap.instance, /仮会員登録メール|会員登録/, 3);
    await cap.go('/mypage/login', '#login_email');
    await cap.capture('f-login', { inputs: [['#login_email', 'email'], ['#login_pass', 'pass']] });
    await cap.type('#login_email', ap.email);
    await cap.type('#login_pass', ap.pass);
    await nav(() => document.querySelector('#login_email').form.submit());
    await cap.capture('f-login-fail');
    // the admin approves
    await adminGo('/admin/customer');
    await cap.capture('a-customers');
    await adminGo(`/admin/customer/${D.applicant.id}/edit`, '#admin_customer_customer_code');
    const CUST_INPUTS = [['#admin_customer_customer_code', 'code'], ['#admin_customer_wholesale_rate', 'rate']];
    await cap.capture('a-customer-new');
    await center('#admin_customer_customer_code');
    await cap.capture('a-customer-new-b2b', { inputs: CUST_INPUTS });
    await cap.type('#admin_customer_customer_code', ap.code);
    await page.select('#admin_customer_business_type', ap.business);
    await cap.type('#admin_customer_wholesale_rate', String(ap.rate));
    await page.evaluate(() => { const r = document.querySelector('#admin_customer_invoice_payment_1') || [...document.querySelectorAll('input[name*="[invoice_payment]"]')].pop(); r.click(); });
    D.statusOptions = await page.evaluate(() => { const s = document.querySelector('#admin_customer_status'); return s ? [s.tagName, ...[...(s.options || s.querySelectorAll('input'))].map((o) => (o.value + ':' + (o.textContent || o.nextSibling && o.nextSibling.textContent || '').trim()))] : null; });
    log('status options', JSON.stringify(D.statusOptions));
    await page.evaluate(() => {
      const s = document.querySelector('#admin_customer_status');
      if (s && s.tagName === 'SELECT') { s.value = '2'; s.dispatchEvent(new Event('change', { bubbles: true })); } else { const r = document.querySelector('#admin_customer_status_1') || [...document.querySelectorAll('input[name*="[status]"]')].find((x) => x.value === '2'); if (r) r.click(); }
    });
    await center('#admin_customer_customer_code');
    await cap.capture('a-customer-new-filled');
    await nav(() => document.querySelector('#admin_customer_customer_code').form.submit(), '#admin_customer_customer_code');
    await cap.capture('a-customer-approved');
    await center('#admin_customer_customer_code');
    await cap.capture('a-customer-approved-b2b');
    D.approved = await cap.php("$c = $em->getRepository(\\Eccube\\Entity\\Customer::class)->findOneBy(['email' => $data]); return ['status' => $c->getStatus()->getName(), 'code' => $c->getCustomerCode(), 'rate' => $c->getWholesaleRate(), 'invoice' => $c->isInvoicePayment(), 'business' => $c->getBusinessType()];", ap.email);
    log('approved', JSON.stringify(D.approved));
    D.approveLog = logLines(cap.instance, /取引先を承認|会員登録完了メール/, 3);
    log('approve log', JSON.stringify(D.approveLog).slice(0, 500));

    // ---------------------------------------------------------------- stage 3: 卸価格 (first version) + templates
    await cap.files(SRC.files(3, CORE));
    await cacheClear();
    await cap.go('/logout', 'body');
    await cap.go('/products/detail/286', '.ec-productRole');
    await cap.capture('f-detail-guest');
    await cap.go('/products/list?category_id=128', '.ec-shelfGrid');
    await cap.capture('f-list-guest');
    await cap.go('/cart', 'body');
    D.guestCart = page.url();
    log('guest /cart →', D.guestCart);
    await frontLogin(ap.email, ap.pass);
    await cap.capture('f-home-member');
    await cap.go('/products/list?category_id=128', '.ec-shelfGrid');
    await cap.capture('f-list-member');
    await cap.go('/products/detail/286', '#form1');
    await cap.capture('f-detail-member', { inputs: [['#quantity', 'qty']] });
    await ajaxAdd(286, 10, 'f-detail-286-modal');
    await cap.go('/cart', '.ec-cartRole');
    await cap.capture('f-cart-1');
    D.price286bug = await dbPrice(286);
    log('db price 286 after the cart (bug):', JSON.stringify(D.price286bug));
    await adminGo('/admin/product');
    await cap.capture('a-products-bug');
    D.sqlBug = await cap.php("return $em->getConnection()->fetchAllAssociative('SELECT p.id, p.name, pc.product_code, pc.price01, pc.price02 FROM dtb_product p JOIN dtb_product_class pc ON pc.product_id = p.id WHERE pc.price01 <> pc.price02');");
    log('rows with price01 <> price02', JSON.stringify(D.sqlBug));

    // ---------------------------------------------------------------- stage 4: the fix, the master restored
    await cap.files(SRC.files(4, CORE));
    await cacheClear();
    await adminGo('/admin/product/product/286/edit', '#admin_product_class_price02');
    await center('#admin_product_class_price02');
    await cap.capture('a-product-286', { inputs: [['#admin_product_class_price02', 'price02']] });
    await cap.type('#admin_product_class_price02', '450');
    await nav(() => document.querySelector('#form1').submit(), '#admin_product_class_price02');
    await center('#admin_product_class_price02');
    await cap.capture('a-product-286-saved');
    await frontLogin(ap.email, ap.pass);
    await cap.go('/cart', '.ec-cartRole');
    await cap.capture('f-cart-2');
    D.price286fixed = await dbPrice(286);
    log('db price 286 after the fix:', JSON.stringify(D.price286fixed));
    await adminGo('/admin/product');
    await cap.capture('a-products-ok');

    // ---------------------------------------------------------------- stage 5: 発注単位
    await cap.files(SRC.files(5, CORE));
    await cacheClear();
    await frontLogin(ap.email, ap.pass);
    await cap.go('/products/detail/991', '#form1');
    await cap.capture('f-detail-991', { inputs: [['#quantity', 'qty']] });
    await ajaxAdd(991, 3, 'f-detail-991-modal');
    await cap.go('/cart', '.ec-cartRole');
    await cap.capture('f-cart-unit');
    D.cartLines = await page.evaluate(() => [...document.querySelectorAll('.ec-cartRow')].map((r) => r.textContent.replace(/\s+/g, ' ').trim()).slice(0, 4));
    log('cart', JSON.stringify(D.cartLines));

    // ---------------------------------------------------------------- stage 6: 掛け払い
    await adminGo('/admin/setting/shop/payment');
    await cap.capture('a-payments');
    await adminGo('/admin/setting/shop/payment/new', '#payment_register_method');
    await cap.capture('a-payment-new', { inputs: [['#payment_register_method', 'method'], ['#payment_register_charge', 'charge']] });
    await cap.type('#payment_register_method', '掛け払い（請求書払い）');
    await cap.type('#payment_register_charge', '0');
    await nav(() => document.querySelector('#payment_register_method').form.querySelector('button[type=submit]').click(), '.c-contentsArea');
    await cap.capture('a-payment-saved');
    await cap.files(SRC.files(6, CORE));
    await cacheClear();
    await frontLogin(ap.email, ap.pass);
    await toShopping();
    D.payNamesNoDeliv = await paymentNames();
    log('payments before the delivery setting', JSON.stringify(D.payNamesNoDeliv));
    await center('.ec-orderPayment');
    await cap.capture('f-shopping-nokake');
    await adminGo('/admin/setting/shop/delivery/1/edit', 'form');
    D.delivPayments = await page.evaluate(() => [...document.querySelectorAll('input[type=checkbox][name*="payments"]')].map((e) => [e.id, e.value, e.checked, (e.closest('label') || e.parentElement).textContent.trim()]));
    log('delivery payments', JSON.stringify(D.delivPayments));
    await page.evaluate(() => { const e = document.querySelector('input[type=checkbox][name*="payments"]'); if (e) e.scrollIntoView({ block: 'center' }); });
    await cap.capture('a-delivery');
    await page.evaluate(() => { [...document.querySelectorAll('input[type=checkbox][name*="payments"]')].forEach((e) => { if (!e.checked) e.click(); }); });
    D.delivInvalid = await page.evaluate(() => { const f = document.querySelector('input[type=checkbox][name*="payments"]').form; return [...f.elements].filter((e) => e.willValidate && !e.checkValidity()).map((e) => `${e.name}=${JSON.stringify(e.value)} ${e.validationMessage}`); });
    log('delivery form invalid fields', JSON.stringify(D.delivInvalid));
    // the form as the 登録 button sends it (HTML5 checks are the browser's; EC-CUBE validates on the server)
    await nav(() => { const f = document.querySelector('input[type=checkbox][name*="payments"]').form; f.submit(); }, '.c-contentsArea');
    D.delivFlash = await page.evaluate(() => [...document.querySelectorAll('.alert, .invalid-feedback, .form-error-message')].map((e) => e.textContent.replace(/\s+/g, ' ').trim()).filter(Boolean));
    log('delivery saved:', JSON.stringify(D.delivFlash), JSON.stringify(await cap.php("return $em->getConnection()->fetchAllAssociative('SELECT payment_id FROM dtb_payment_option WHERE delivery_id = 1');")));
    await page.evaluate(() => { const e = document.querySelector('input[type=checkbox][name*="payments"]'); if (e) e.scrollIntoView({ block: 'center' }); });
    await cap.capture('a-delivery-saved');
    await frontLogin(ap.email, ap.pass);
    await toShopping();
    D.payNames1 = await paymentNames();
    log('payments (approved 取引先)', JSON.stringify(D.payNames1));
    await cap.capture('f-shopping-1');
    await choosePayment('掛け払い');
    await center('.ec-orderPayment');
    await cap.capture('f-shopping-kake');
    await confirmBtn();
    await cap.capture('f-confirm');
    await confirmBtn();
    await cap.capture('f-complete');
    D.order1 = await cap.php("$o = $em->getRepository(\\Eccube\\Entity\\Order::class)->findOneBy([], ['id' => 'DESC']); return ['id' => $o->getId(), 'no' => $o->getOrderNo(), 'company' => $o->getCompanyName(), 'payment' => $o->getPaymentMethod(), 'total' => (int) $o->getPaymentTotal(), 'status' => $o->getOrderStatus()->getName(), 'items' => array_map(fn ($i) => [$i->getProductName(), (int) $i->getPrice(), (int) $i->getQuantity()], $o->getProductOrderItems())];");
    log('order 1', JSON.stringify(D.order1));
    // a 取引先 without 掛け払い
    await frontLogin(A.existing.email, A.existing.pass);
    await ajaxAdd(286, 20, null);
    await toShopping();
    D.payNames2 = await paymentNames();
    log('payments (みなと文具)', JSON.stringify(D.payNames2));
    await center('.ec-orderPayment');
    await cap.capture('f-shopping-minato');
    await choosePayment('銀行振込');
    await confirmBtn();
    await confirmBtn();
    D.order2 = await cap.php("$o = $em->getRepository(\\Eccube\\Entity\\Order::class)->findOneBy([], ['id' => 'DESC']); return ['id' => $o->getId(), 'company' => $o->getCompanyName(), 'payment' => $o->getPaymentMethod(), 'total' => (int) $o->getPaymentTotal()];");
    log('order 2', JSON.stringify(D.order2));

    // ---------------------------------------------------------------- stage 7: 受注管理
    await adminGo('/admin/order');
    await cap.capture('a-orders');
    await adminGo(`/admin/order/${D.order1.id}/edit`);
    await cap.capture('a-order-edit');
    await center('#order_CompanyName, #order_company_name, [id$="company_name"]');
    await cap.capture('a-order-edit-company');
    await page.evaluate(() => { const e = document.querySelector('#table-form-field, .c-orderItemList, #order-product'); if (e) e.scrollIntoView({ block: 'center' }); });
    await cap.capture('a-order-edit-items');
    D.src = { files: Object.keys(SRC.files(6, CORE)) };
    await cap.finish();
  } catch (e) {
    console.error(e);
    try { if (SHOTS) await page.screenshot({ path: path.join(SHOTS, 'ec-kuretake-error.jpg'), type: 'jpeg', quality: 70 }); } catch (er) { /* closed */ }
    await cap.abort();
    process.exit(1);
  }
  process.exit(0);
})();
