/*
 * The real EC-CUBE screens of the ec-daikoku-plugin video, captured from EC-CUBE itself (tools/eccube/capture.js:
 * EC-CUBE 4.3.1-p1 on PHP 8.3 in WebAssembly, SQLite, in ../eccube-local/inst/ec-daikoku-plugin, shown as the
 * developer's http://localhost:8080).
 *
 *   node tools/snapshots/ec-daikoku-plugin/capture-ec.js [screenshot folder]      (20–35 min; one Chrome + one EC-CUBE)
 *   → node tools/webp.js ec-daikoku-plugin
 *
 * Before: scrape-shop.js (shop-data.json and the pictures in ../eccube-local/data/ec-daikoku-plugin/save_image).
 * The copy is made fresh, then:
 *   setup    EC-CUBE 4.3's bundled plugins removed (not the shop's); あみだ池大黒オンラインショップ's public data: shop info,
 *            the categories with the live ids, 18 products (names, prices, descriptions, specs, pictures, codes),
 *            ヤマト運輸 with the live fees, 7,000 円 送料無料, 銀行振込 / 代金引換 (200 円); a test customer (invented)
 *   stage 0  today: the のし request goes into the 注文手続き's お問い合わせ欄 → the order's お問い合わせ in the admin
 *   stage 1  bin/console eccube:plugin:generate (the real skeleton) → the plugin's admin side (js/gift-src.js files(1))
 *            installed / enabled with bin/console → プラグイン一覧, のし・ギフト › 基本設定 (saved), 表書き一覧 (御年賀 added)
 *   stage 2  the order side written into the installed plugin → 注文手続き: システムエラー (the traits are not in the
 *            proxies) + EC-CUBE's log line → eccube:generate:proxies, doctrine:schema:update → 商品登録 のし対応 (saved) →
 *            注文手続き with のし, the 表書き error, 確認, ご注文完了
 *   stage 3  受注登録 (のし per お届け先) and the 注文受付メール (メール通知)
 *   stage 4  PluginManager's 配送CSV items: 無効化 in the admin (注文手続き without のし) → 有効化 → CSV出力項目設定 → 配送CSV
 *   stage 5  DaikokuGift-1.0.0.zip (tools/snapshots/ec-daikoku-plugin/DaikokuGift-1.0.0.zip) → 無効化 → 削除 (the real
 *            modal) → 独自プラグインのアップロード of the zip → 有効化 → 表書き一覧 (the defaults again) → 注文手続き
 * Console outputs, log lines, the CSV and the checks are kept in EC_SNAPSHOT.data.
 */
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const ROOT = path.resolve(__dirname, '../../..');
const ECC = require(path.join(ROOT, 'tools/eccube/capture'));
const SRC = require(path.join(ROOT, 'public/videos/ec-daikoku-plugin/js/gift-src.js'));
const ID = 'ec-daikoku-plugin';
const SHOTS = process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : null;
const SHOP = JSON.parse(fs.readFileSync(path.join(__dirname, 'shop-data.json'), 'utf8'));
const IMG = path.resolve(ROOT, '../eccube-local/data/ec-daikoku-plugin/save_image');
const ZIP = path.join(__dirname, `${SRC.CODE}-${SRC.VERSION}.zip`);
const log = (...a) => console.log(`[${new Date().toLocaleTimeString('sv-SE')}]`, ...a);
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

const GIFT = [290, 293, 294, 296, 297, 298, 299, 300];   // 進物用おこし (live category 44)
const MESSAGE = 'のしは内のしで、表書きは「御歳暮」、名入れは「田中」でお願いします。';
const GUIDE = '包装商品のため、のしはご指定がない限り「外のし」となります。';
const NEW_TITLE = '御年賀';
const CUSTOMER = { email: 'taro.test@example.com', pass: 'daikoku-test-2026' };
// ヤマト運輸 (送料, 税込) by prefecture — the live shop's table
const FEE = (pref) => (pref === 1 ? 1320 : pref <= 7 ? 990 : pref <= 15 || pref === 19 || pref === 20 ? 825 : pref >= 40 && pref <= 46 ? 825 : pref === 47 ? 1870 : 770);

const SETUP_PHP = String.raw`
$conn = $em->getConnection();
$now = new \DateTime();
foreach (['dtb_product_category', 'dtb_product_tag', 'dtb_product_image', 'dtb_product_stock', 'dtb_customer_favorite_product', 'dtb_cart_item', 'dtb_cart',
          'dtb_product_class', 'dtb_product', 'dtb_class_category', 'dtb_class_name', 'dtb_category', 'dtb_tag', 'dtb_news', 'dtb_plugin'] as $t) {
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
$B->setShopName('あみだ池大黒オンラインショップ')->setCompanyName('株式会社あみだ池大黒')->setPostalCode('5500014')->setPref($Pref(27))
  ->setAddr01('大阪市西区北堀江')->setAddr02('3-11-26')->setPhoneNumber('0120361854')
  ->setEmail01('helpdesk@daikoku.ne.jp')->setEmail02('helpdesk@daikoku.ne.jp')->setEmail03('helpdesk@daikoku.ne.jp')->setEmail04('helpdesk@daikoku.ne.jp')
  ->setDeliveryFreeAmount('7000')->setDeliveryFreeQuantity(null)->setOptionCustomerActivate(false)->setOptionProductTaxRule(true);

$cats = [];
$sort = 100;
foreach ($data['categories'] as $id => $name) {
    $c = new \Eccube\Entity\Category();
    $setId($c, (int) $id);
    $c->setName($name)->setHierarchy(1)->setSortNo($sort--)->setCreator($Member)->setCreateDate($now)->setUpdateDate($now);
    $em->persist($c);
    $cats[(int) $id] = $c;
}
$em->flush();

$SaleType = $em->getRepository(\Eccube\Entity\Master\SaleType::class)->find(1);
$Show = $em->getRepository(\Eccube\Entity\Master\ProductStatus::class)->find(1);
$Floor = $em->getRepository(\Eccube\Entity\Master\RoundingType::class)->find(2);
$made = 0;
foreach ($data['products'] as $p) {
    $P = new \Eccube\Entity\Product();
    $setId($P, $p['id']);
    $P->setName($p['name'])->setStatus($Show)->setDescriptionDetail($p['detail'])->setDescriptionList($p['list'] ?? null)
      ->setFreeArea($p['free'] ?? null)->setCreator($Member)->setCreateDate($now)->setUpdateDate($now);
    $em->persist($P);
    foreach ($p['cats'] as $cid) {
        $pc = (new \Eccube\Entity\ProductCategory())->setProduct($P)->setCategory($cats[$cid])->setProductId($p['id'])->setCategoryId($cid);
        $P->addProductCategory($pc);
        $em->persist($pc);
    }
    foreach ($p['files'] as $i => $f) {
        $pi = (new \Eccube\Entity\ProductImage())->setProduct($P)->setFileName($f)->setSortNo($i + 1)->setCreator($Member)->setCreateDate($now);
        $P->addProductImage($pi);
        $em->persist($pi);
    }
    $PC = new \Eccube\Entity\ProductClass();
    $PC->setProduct($P)->setSaleType($SaleType)->setPrice02($p['price'])->setVisible(true)->setStockUnlimited(true)->setStock(null)
       ->setCode($p['code'] ?? null)->setCreator($Member)->setCreateDate($now)->setUpdateDate($now)->setCurrencyCode('JPY');
    $PS = (new \Eccube\Entity\ProductStock())->setProductClass($PC)->setStock(null)->setCreator($Member)->setCreateDate($now)->setUpdateDate($now);
    $PC->setProductStock($PS);
    $P->addProductClass($PC);
    $em->persist($PC);
    $em->persist($PS);
    if ($p['food']) {
        // お菓子：軽減税率 8 %（商品別税率）、公開中の税込価格は 8 % の切り捨て
        $T = new \Eccube\Entity\TaxRule();
        $T->setProductClass($PC)->setProduct($P)->setTaxRate('8')->setTaxAdjust('0')->setRoundingType($Floor)
          ->setApplyDate(new \DateTime('2019-10-01 00:00:00'))->setCreator($Member)->setCreateDate($now)->setUpdateDate($now);
        $PC->setTaxRule($T);
        $em->persist($T);
    }
    $made++;
}
$em->flush();

// ヤマト運輸 (the live fees), the second sample delivery hidden
$D = $em->getRepository(\Eccube\Entity\Delivery::class)->find(1);
$D->setName('ヤマト運輸')->setServiceName('宅急便')->setDescription('ヤマト運輸でお届けします')->setConfirmUrl('https://toi.kuronekoyamato.co.jp/cgi-bin/tneko');
foreach ($em->getRepository(\Eccube\Entity\DeliveryFee::class)->findBy(['Delivery' => $D]) as $F) $F->setFee((string) $data['fees'][$F->getPref()->getId()]);
$D2 = $em->getRepository(\Eccube\Entity\Delivery::class)->find(2);
if ($D2) $D2->setVisible(false);
$em->flush();

// payments: 銀行振込 · 代金引換 (200 円)
$conn->executeStatement('DELETE FROM dtb_payment_option WHERE payment_id NOT IN (3, 4) OR delivery_id <> 1');
$conn->executeStatement('DELETE FROM dtb_payment WHERE id NOT IN (3, 4)');
$em->getRepository(\Eccube\Entity\Payment::class)->find(3)->setMethod('銀行振込')->setCharge('0')->setSortNo(2);
$em->getRepository(\Eccube\Entity\Payment::class)->find(4)->setMethod('代金引換')->setCharge('200')->setSortNo(1);
$em->flush();

// a test customer (invented)
$C = new \Eccube\Entity\Customer();
$C->setName01('テスト')->setName02('太郎')->setKana01('テスト')->setKana02('タロウ')->setEmail($data['customer']['email'])
  ->setPostalCode('5500014')->setPref($Pref(27))->setAddr01('大阪市西区北堀江')->setAddr02('1-1-1 テストビル 2F')->setPhoneNumber('0600000000')
  ->setPassword(password_hash($data['customer']['pass'], PASSWORD_BCRYPT))->setSalt(null)->setSecretKey(bin2hex(random_bytes(16)))
  ->setStatus($em->getRepository(\Eccube\Entity\Master\CustomerStatus::class)->find(2))->setPoint('0')->setCreateDate($now)->setUpdateDate($now);
$em->persist($C);
$em->flush();
return ['products' => $made, 'categories' => count($cats), 'customer' => $C->getId()];
`;

/** bin/console in the server's PHP with EC-CUBE booted (its .env loaded) — $data: the command's input */
const CONSOLE_PHP = String.raw`
$app = new \Symfony\Bundle\FrameworkBundle\Console\Application($kernel);
$app->setAutoExit(false);
$out = new \Symfony\Component\Console\Output\BufferedOutput();
$code = $app->run(new \Symfony\Component\Console\Input\ArrayInput($data), $out);
return ['code' => $code, 'out' => $out->fetch()];`;

/** the newest lines of EC-CUBE's own logs (var/log/prod/*.log) that match */
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
/** every file under a folder → { relative path: text } */
function readTree(dir, base = dir, out = {}) {
  if (!fs.existsSync(dir)) return out;
  for (const n of fs.readdirSync(dir)) {
    const f = path.join(dir, n);
    if (fs.statSync(f).isDirectory()) readTree(f, base, out);
    else out[path.relative(base, f).replace(/\\/g, '/')] = fs.readFileSync(f, 'utf8');
  }
  return out;
}

(async () => {
  const cap = await ECC.start({ id: ID, version: 4, fresh: true, site: 'http://localhost:8080', date: '2026-11-03', time: '10:20', shots: SHOTS });
  const { page } = cap;
  const D = cap.data;
  const PDIR = path.join(cap.instance, 'app/Plugin', SRC.CODE);
  const wipeCache = () => { try { fs.rmSync(path.join(cap.instance, 'var/cache/prod'), { recursive: true, force: true }); } catch (e) { log('cache dir:', e.message); } };
  const cacheClear = async () => { const out = await cap.console(['cache:clear', '--no-warmup']); wipeCache(); return out; };
  /* eccube:plugin:install / enable in the server's PHP; their own cache:clear sub-process cannot start under WebAssembly:
     run with cap.console and its output joined where the command prints it (as in ec-l-meal-payment) */
  const pluginConsole = async (command, ok) => {
    const r = await cap.php(CONSOLE_PHP, { command, '--code': SRC.CODE });
    const RUN = 'Run bin/console cache:clear --no-warmup...';
    const i = r.out.indexOf(RUN);
    log(`console ${command} → ${r.code}`, r.out.slice(0, 400));
    if (r.code !== 0 && !(i >= 0 && /Unable to launch a new process/.test(r.out))) throw new Error(r.out.slice(-2500));
    const cc = await cacheClear();
    return (i >= 0 ? r.out.slice(0, i + RUN.length) : r.out.replace(/\s+$/, '')) + '\n' + cc.replace(/^\n+/, '').replace(/\s+$/, '') + '\n\n [OK] ' + ok + '\n';
  };
  const nav = async (fn, ready = 'body', ...args) => { await Promise.all([page.waitForNavigation({ waitUntil: 'load', timeout: 600000 }), page.evaluate(fn, ...args)]); await cap.settle(ready); };
  const adminLogin = async () => { await cap.go('/admin/login', 'body'); if (await page.$('#login_id')) await cap.login(); };
  const frontLogin = async () => {
    await cap.go('/mypage/login', 'body');
    if (!(await page.$('#login_email'))) return;
    await cap.type('#login_email', CUSTOMER.email);
    await cap.type('#login_pass', CUSTOMER.pass);
    await nav(() => document.querySelector('#login_email').form.submit());
  };
  const addCart = async (id) => { await cap.go('/products/detail/' + id, '#form1'); await nav(() => document.querySelector('#form1').submit()); };
  const toShopping = async (ready = '#shopping-form') => {
    await cap.go('/cart', '.ec-cartRole');
    await nav(() => { location.href = document.querySelector('a.ec-blockBtn--action[href*="cart/buystep"]').href; }, ready);
  };
  const emptyCart = async () => {
    await cap.go('/cart', '.ec-cartRole');
    for (let k = 0; k < 8 && (await page.$('.ec-cartRow__delColumn a')); k++) await nav(() => document.querySelector('.ec-cartRow__delColumn a').click(), 'body');
  };
  const scrollTo = (sel, block = 'center') => page.evaluate((s, b) => { const e = document.querySelector(s); if (e) e.scrollIntoView({ block: b }); return !!e; }, sel, block);
  const confirmBtn = () => nav(() => document.querySelector('#shopping-form button.ec-blockBtn--action').click());
  const lastOrder = () => cap.php("$o = $em->getRepository(\\Eccube\\Entity\\Order::class)->findOneBy([], ['id' => 'DESC']); return ['id' => $o->getId(), 'no' => $o->getOrderNo(), 'status' => $o->getOrderStatus()->getName(), 'total' => (int) $o->getPaymentTotal(), 'message' => $o->getMessage()];");
  const pluginRow = () => cap.php("return $em->getConnection()->fetchAllAssociative('SELECT id, code, name, version, enabled, initialized FROM dtb_plugin');");
  const plgTables = () => cap.php("return $em->getConnection()->fetchFirstColumn(\"SELECT name FROM sqlite_master WHERE type = 'table' AND substr(name, 1, 4) = 'plg_'\");");
  /** an action of the プラグイン一覧 (the row's icon: enable / disable), then the cache as the CLI would leave it */
  const afterAction = async (what) => {
    const body = await page.evaluate(() => document.body ? document.body.innerText.slice(0, 600) : '').catch(() => '');
    D['response_' + what] = body;
    log(what, 'response:', body.replace(/\s+/g, ' ').slice(0, 300));
    // EC-CUBE turns the maintenance mode on for a plugin operation and off when the request terminates
    // (SystemService::disableMaintenanceEvent): wait for that, as the browser's redirect would
    const mf = path.join(cap.instance, '.maintenance');
    for (let k = 0; k < 30 && fs.existsSync(mf); k++) await wait(500);
    if (fs.existsSync(mf)) {
      D['maintenance_' + what] = fs.readFileSync(mf, 'utf8').split(':')[0];
      log('maintenance file left:', D['maintenance_' + what]);
      if (/^auto_maintenance/.test(D['maintenance_' + what])) {
        fs.rmSync(mf);
        // the server's PHP keeps the file in its stat cache: restart it (bin/console cache:clear does) before the next page
        if (!(await page.$('.c-contentsArea'))) { await cap.console(['cache:clear', '--no-warmup']); wipeCache(); await adminLogin(); }   // the restart loses the admin session
      }
    }
    if (!(await page.$('.c-contentsArea'))) await cap.go('/admin/store/plugin', '.c-contentsArea');   // a real redirect already shows the list
  };
  const clickNav = async (fn, ...args) => {
    await Promise.all([page.waitForNavigation({ waitUntil: 'load', timeout: 600000 }), page.evaluate(fn, ...args)]);
    await wait(1500);
  };
  const pluginAction = async (kind) => {
    await adminLogin();
    await cap.go('/admin/store/plugin', '.c-contentsArea');
    const ok = await page.$(`a[href*="/store/plugin/"][href$="/${kind}"]`);
    if (!ok) throw new Error('no ' + kind + ' link');
    await clickNav((k) => document.querySelector(`a[href*="/store/plugin/"][href$="/${k}"]`).click(), kind);
    await afterAction(kind);
    D['alert_' + kind] = await page.evaluate(() => [...document.querySelectorAll('.alert')].map((e) => e.textContent.replace(/\s+/g, ' ').trim()));
    log(kind, JSON.stringify(D['alert_' + kind]), JSON.stringify(await pluginRow()));
  };
  try {
    // ---------------------------------------------------------------- setup: the shop's public data
    const dest = path.join(cap.instance, 'html/upload/save_image');
    fs.mkdirSync(dest, { recursive: true });
    for (const f of fs.readdirSync(IMG)) fs.copyFileSync(path.join(IMG, f), path.join(dest, f));
    const products = SHOP.products.map((p) => {
      const desc = p.desc.replace(/\n\n/g, '\n').trim();
      const spec = p.spec.map(([k, v]) => `【${k}】\n${v.replace(/\n\n/g, '\n')}`).join('\n');
      const food = p.category !== 64;
      const cats = [...new Set([...(GIFT.includes(p.id) ? [44] : []), p.category])];
      return { id: p.id, name: p.name.replace(/\u3000/g, ' '), price: p.priceEx, code: p.code, files: p.files, food, cats,
        detail: `${desc}\n\n${spec}`, list: desc.split('\n')[0] };
    });
    for (const p of SHOP.products) if (p.category !== 64 && Math.floor(p.priceEx * 1.08 + 1e-9) !== p.price) log('price mismatch', p.id, p.priceEx, p.price);
    const fees = {};
    for (let i = 1; i <= 47; i++) fees[i] = FEE(i);
    const data = { categories: { ...SHOP.categories, 44: '進物用おこし' }, products, fees, customer: CUSTOMER };
    for (const d of ['app/Plugin', 'html/plugin']) {
      const dd = path.join(cap.instance, d);
      if (fs.existsSync(dd)) for (const x of fs.readdirSync(dd)) fs.rmSync(path.join(dd, x), { recursive: true, force: true });
    }
    wipeCache();
    log('setup', JSON.stringify(await cap.php(SETUP_PHP, data)));
    await cacheClear();

    // ---------------------------------------------------------------- stage 0: the のし request in the お問い合わせ欄
    await frontLogin();
    await addCart(290);
    await toShopping();
    await scrollTo('.ec-orderDelivery', 'start');
    await cap.capture('shop-0');
    await scrollTo('textarea[name*="[message]"]');
    await cap.type('textarea[name*="[message]"]', MESSAGE);
    await cap.capture('shop-0-msg');
    await confirmBtn();
    await confirmBtn();
    D.order1 = await lastOrder();
    log('order 1', JSON.stringify(D.order1));
    await cap.login();
    await cap.go(`/admin/order/${D.order1.id}/edit`, '.c-contentsArea');
    await page.evaluate(() => { const e = [...document.querySelectorAll('.col-3')].find((x) => /お問い合わせ/.test(x.textContent)); if (e) e.scrollIntoView({ block: 'center' }); });
    await cap.capture('order-0');

    // ---------------------------------------------------------------- stage 1: the skeleton, the admin side
    D.generateOut = await cap.console(['eccube:plugin:generate', SRC.NAME, SRC.CODE, SRC.VERSION]);
    const made = readTree(PDIR);
    D.scaffold = Object.keys(made).sort();
    D.scaffoldDiff = D.scaffold.filter((k) => made[k].replace(/\r\n/g, '\n') !== (SRC.SCAFFOLD[k] || '').replace(/\r\n/g, '\n'));
    log('generated', D.scaffold.length, 'files; differ from gift-src.js SCAFFOLD:', JSON.stringify(D.scaffoldDiff));
    await cap.files(SRC.files(1));
    D.installOut = await pluginConsole('eccube:plugin:install', 'Installed.');
    D.enableOut = await pluginConsole('eccube:plugin:enable', 'Plugin Enabled.');
    D.plugin1 = await pluginRow();
    D.tables1 = await plgTables();
    log('plugin', JSON.stringify(D.plugin1), JSON.stringify(D.tables1));
    if (!D.plugin1.some((p) => p.code === SRC.CODE && +p.enabled === 1)) throw new Error('not enabled');
    await adminLogin();
    await cap.go('/admin/store/plugin', '.c-contentsArea');
    await cap.capture('plugins-1');
    await cap.go('/admin/daikoku_gift/config', 'form');
    await cap.capture('gift-config', { inputs: [['#config_guide_text', 'guide_text']] });
    await cap.type('#config_guide_text', GUIDE);
    await nav(() => document.querySelector('#config_guide_text').form.submit(), '.c-contentsArea');
    await cap.capture('gift-config-saved');
    await cap.go('/admin/daikoku_gift/noshi_title', 'form');
    await cap.capture('noshi-list', { inputs: [['#noshi_title_name', 'title_name']] });
    await cap.type('#noshi_title_name', NEW_TITLE);
    await nav(() => document.querySelector('#noshi_title_name').form.submit(), '.c-contentsArea');
    await cap.capture('noshi-list-saved');
    D.titles = await cap.php("return $em->getConnection()->fetchAllAssociative('SELECT id, name, mizuhiki, sort_no, visible FROM plg_daikoku_gift_noshi_title ORDER BY sort_no');");

    // ---------------------------------------------------------------- stage 2: the order side → システムエラー → proxies
    await cap.files(SRC.files(2));
    await cacheClear();
    await frontLogin();
    await addCart(290);
    await addCart(144);
    await toShopping('body');
    D.errorTitle = await page.evaluate(() => document.title);
    await cap.capture('shop-error');
    D.errorLog = logLines(cap.instance, /CRITICAL|noshi_/, 3);
    log('error', D.errorTitle, JSON.stringify(D.errorLog).slice(0, 700));
    D.proxiesOut = await cap.console(['eccube:generate:proxies']);
    D.schemaOut = await cap.console(['doctrine:schema:update', '--dump-sql', '--force']);
    log('proxies', D.proxiesOut.slice(-300), 'schema', D.schemaOut.slice(-800));
    D.ccOut = await cacheClear();
    await adminLogin();
    await cap.go('/admin/product/product/290/edit', '.c-contentsArea');
    log('のし対応 field:', !!(await page.$('#admin_product_noshi_enabled')));
    await scrollTo('#admin_product_noshi_enabled');
    await cap.capture('product-edit');
    await page.evaluate(() => { const c = document.querySelector('#admin_product_noshi_enabled'); c.checked = true; });
    await nav(() => document.querySelector('#admin_product_noshi_enabled').form.submit(), '.c-contentsArea');
    await scrollTo('#admin_product_noshi_enabled');
    await cap.capture('product-saved');
    const noshiIds = SHOP.products.filter((p) => p.noshi).map((p) => p.id);
    D.noshiProducts = await cap.php("foreach ($data as $id) { $em->find(\\Eccube\\Entity\\Product::class, $id)->setNoshiEnabled(true); } $em->flush(); return $em->getConnection()->fetchFirstColumn('SELECT id FROM dtb_product WHERE daikoku_noshi_enabled = 1');", noshiIds);
    log('のし対応', JSON.stringify(D.noshiProducts));
    await frontLogin();
    await toShopping();
    const NAME = '[id$="Shippings_0_noshi_name"]';
    const TYPE = '[id$="Shippings_0_noshi_type"]';
    const TITLE = '[id$="Shippings_0_noshi_title"]';
    D.noshiIds = await page.evaluate((a, b, c) => [a, b, c].map((s) => { const e = document.querySelector(s); return e && e.id; }), TYPE, TITLE, NAME);
    log('noshi fields', JSON.stringify(D.noshiIds));
    await scrollTo('#daikoku-noshi-0');
    await cap.capture('shop-noshi', { inputs: [['#' + D.noshiIds[2], 'noshi_name']] });
    await cap.select(TYPE, SRC.TEST.type);
    await confirmBtn();
    await scrollTo('#daikoku-noshi-0');
    D.noshiError = await page.evaluate(() => [...document.querySelectorAll('#daikoku-noshi-0 .ec-errorMessage, #daikoku-noshi-0 .invalid-feedback, #daikoku-noshi-0 .form-error-message')].map((e) => e.textContent.trim()));
    log('noshi error', JSON.stringify(D.noshiError), page.url());
    await cap.capture('shop-noshi-error', { inputs: [['#' + D.noshiIds[2], 'noshi_name']] });
    await cap.select(TYPE, SRC.TEST.type);
    await cap.select(TITLE, SRC.TEST.title);
    await cap.type(NAME, SRC.TEST.name);
    await confirmBtn();
    await scrollTo('.ec-orderDelivery__noshi');
    await cap.capture('confirm-noshi');
    await confirmBtn();
    await cap.capture('complete-noshi');
    D.order2 = await lastOrder();
    D.shipping2 = await cap.php("return $em->getConnection()->fetchAllAssociative('SELECT id, order_id, daikoku_noshi_type, daikoku_noshi_title, daikoku_noshi_name FROM dtb_shipping ORDER BY id DESC LIMIT 1');");
    log('order 2', JSON.stringify(D.order2), JSON.stringify(D.shipping2));

    // ---------------------------------------------------------------- stage 3: 受注登録, メール
    await cap.files(SRC.files(3));
    await cacheClear();
    await adminLogin();
    await cap.go(`/admin/order/${D.order2.id}/edit`, '.c-contentsArea');
    await scrollTo('[id$="Shipping_noshi_type"]');
    await cap.capture('order-edit-noshi');
    try {
      await cap.go(`/admin/order/${D.order2.id}/mail`, 'form');
      const sel = await page.evaluate(() => { const s = document.querySelector('select[name*="template"]'); return s ? s.id : null; });
      if (sel) {
        await nav((id) => { const s = document.getElementById(id); const o = [...s.options].find((x) => /注文受付/.test(x.textContent)); s.value = o.value; $(s).trigger('change'); }, 'form', sel);
        await nav(() => document.querySelector('button[name=mode][value=confirm]').click(), '.c-contentsArea');
        await cap.capture('mail-noshi');
        D.mailLine = await page.evaluate(() => { const m = /のし：[^\n]*/.exec(document.body.innerText); return m && m[0]; });
        log('mail', D.mailLine);
      }
    } catch (e) { log('mail preview skipped:', e.message.slice(0, 200)); }

    // ---------------------------------------------------------------- stage 4: 無効化 / 有効化, 配送CSV
    await cap.files(SRC.files(4));
    await cacheClear();
    await pluginAction('disable');
    await cap.capture('plugins-disabled');
    await cacheClear();
    D.keptData = await cap.php("return $em->getConnection()->fetchAllAssociative('SELECT id, daikoku_noshi_type, daikoku_noshi_title, daikoku_noshi_name FROM dtb_shipping WHERE daikoku_noshi_type IS NOT NULL');");
    log('kept', JSON.stringify(D.keptData));
    await frontLogin();
    await addCart(290);
    await toShopping();
    await scrollTo('.ec-orderDelivery__actions');
    await cap.capture('shop-disabled');
    await pluginAction('enable');
    await cap.capture('plugins-enabled');
    await cacheClear();
    await adminLogin();
    await cap.go('/admin/setting/shop/csv/4', '.c-contentsArea');
    await page.evaluate(() => {
      const s = [...document.querySelectorAll('select[multiple]')].find((x) => [...x.options].some((o) => /のし/.test(o.textContent)));
      if (s) { [...s.options].forEach((o) => { o.selected = /のし/.test(o.textContent); }); s.scrollTop = s.scrollHeight; s.scrollIntoView({ block: 'center' }); }
    });
    await cap.capture('csv-setting');
    D.csvItems = await page.evaluate(() => [...document.querySelectorAll('select[multiple] option')].filter((o) => /のし/.test(o.textContent)).map((o) => o.textContent.trim()));
    await cap.go('/admin/order', '.c-contentsArea');
    await cap.capture('orders');
    D.csv = await page.evaluate(async () => {
      const r = await fetch('/admin/order/export/shipping', { credentials: 'same-origin' });
      const b = new Uint8Array(await r.arrayBuffer());
      return { status: r.status, type: r.headers.get('content-type'), disp: r.headers.get('content-disposition'), bytes: Array.from(b) };
    });
    D.csv.text = new TextDecoder(/utf-?8/i.test(D.csv.type || '') ? 'utf-8' : 'shift_jis').decode(Uint8Array.from(D.csv.bytes));
    D.csv.size = D.csv.bytes.length;
    delete D.csv.bytes;
    log('csv', D.csv.status, D.csv.disp, D.csv.text.split('\n').slice(0, 3).join(' / ').slice(0, 600));

    // ---------------------------------------------------------------- stage 5: the zip, 削除, 独自プラグインのアップロード
    const entries = fs.readdirSync(PDIR).filter((n) => n !== '.github');
    fs.rmSync(ZIP, { force: true });
    const tr = spawnSync('C:/Windows/System32/tar.exe', ['-a', '-c', '-f', ZIP, '-C', PDIR, ...entries], { encoding: 'utf8' });
    if (tr.status !== 0) throw new Error('tar: ' + tr.stderr);
    D.zip = { name: path.basename(ZIP), size: fs.statSync(ZIP).size, entries, list: spawnSync('C:/Windows/System32/tar.exe', ['-t', '-f', ZIP], { encoding: 'utf8' }).stdout.split(/\r?\n/).filter(Boolean) };
    log('zip', D.zip.size, D.zip.list.length, 'entries');
    await pluginAction('disable');
    await cacheClear();
    await adminLogin();
    await cap.go('/admin/store/plugin', '.c-contentsArea');
    await page.click('a[data-bs-target="#localPluginDeleteModal"]');
    await page.waitForSelector('#localPluginDeleteModal.show');
    await wait(900);
    await cap.capture('plugins-uninstall-modal');
    await clickNav(() => document.querySelector('#localPluginDeleteModal a.btn-ec-delete').click());
    await afterAction('uninstall');
    D.alert_uninstall = await page.evaluate(() => [...document.querySelectorAll('.alert')].map((e) => e.textContent.replace(/\s+/g, ' ').trim()));
    await cap.capture('plugins-uninstalled');
    await cacheClear();
    D.afterUninstall = { plugin: await pluginRow(), tables: await plgTables(), folder: fs.existsSync(PDIR),
      shippingCols: await cap.php("return array_values(array_filter(array_column($em->getConnection()->fetchAllAssociative('PRAGMA table_info(dtb_shipping)'), 'name'), fn ($c) => str_starts_with($c, 'daikoku_')));"),
      csv: await cap.php("return $em->getConnection()->fetchFirstColumn(\"SELECT disp_name FROM dtb_csv WHERE disp_name LIKE 'のし%'\");") };
    log('after uninstall', JSON.stringify(D.afterUninstall), JSON.stringify(D.alert_uninstall));
    await adminLogin();
    await cap.go('/admin/store/plugin/install', 'form');
    await cap.capture('plugin-upload');
    await (await page.$('#plugin_local_install_plugin_archive')).uploadFile(ZIP);
    await clickNav(() => document.querySelector('#plugin_local_install_plugin_archive').form.submit());
    await afterAction('install');
    D.alert_install = await page.evaluate(() => [...document.querySelectorAll('.alert')].map((e) => e.textContent.replace(/\s+/g, ' ').trim()));
    await cap.capture('plugins-installed');
    log('installed', JSON.stringify(D.alert_install), JSON.stringify(await pluginRow()));
    await cacheClear();
    await pluginAction('enable');
    await cap.capture('plugins-final');
    await cacheClear();
    const back = readTree(PDIR);
    const want = SRC.files(4);
    D.zipCheck = Object.keys(want).filter((k) => !k.includes('/.github/')).map((k) => k.replace(SRC.PLUGIN, ''))
      .filter((k) => (back[k] || '').replace(/\r\n/g, '\n') !== want[SRC.PLUGIN + k].replace(/\r\n/g, '\n'));
    log('zip → folder differs:', JSON.stringify(D.zipCheck));
    await adminLogin();
    await cap.go('/admin/daikoku_gift/noshi_title', 'form');
    await cap.capture('noshi-list-final');
    D.afterReinstall = { shippingCols: await cap.php("return array_values(array_filter(array_column($em->getConnection()->fetchAllAssociative('PRAGMA table_info(dtb_shipping)'), 'name'), fn ($c) => str_starts_with($c, 'daikoku_')));"),
      noshiProducts: await cap.php("return $em->getConnection()->fetchFirstColumn('SELECT id FROM dtb_product WHERE daikoku_noshi_enabled = 1');"),
      shipping: await cap.php("return $em->getConnection()->fetchAllAssociative('SELECT id, daikoku_noshi_type, daikoku_noshi_title, daikoku_noshi_name FROM dtb_shipping WHERE id = 3');") };
    log('after reinstall', JSON.stringify(D.afterReinstall));
    await cap.go('/admin/product/product/290/edit', '.c-contentsArea');
    await scrollTo('#admin_product_noshi_enabled');
    await cap.capture('product-reset');
    D.noshiProducts2 = await cap.php("foreach ($data as $id) { $em->find(\\Eccube\\Entity\\Product::class, $id)->setNoshiEnabled(true); } $em->flush(); return $em->getConnection()->fetchFirstColumn('SELECT id FROM dtb_product WHERE daikoku_noshi_enabled = 1');", noshiIds);
    await frontLogin();
    await toShopping();
    await scrollTo('#daikoku-noshi-0');
    await cap.capture('shop-final');
    D.final = await pluginRow();
    await cap.finish();
    process.exit(0);
  } catch (e) {
    console.error(e);
    try { if (SHOTS) await page.screenshot({ path: path.join(SHOTS, 'ec-error.jpg'), type: 'jpeg', quality: 70 }); } catch (e2) { /* closed */ }
    await cap.abort();
    process.exit(1);
  }
})();
