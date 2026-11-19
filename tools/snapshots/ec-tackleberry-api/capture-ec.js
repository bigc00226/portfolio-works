/*
 * The real EC-CUBE screens and Web API exchanges of the ec-tackleberry-api video, from EC-CUBE itself (tools/eccube/capture.js:
 * EC-CUBE 4.3.1-p1 on PHP 8.3 in WebAssembly, SQLite, in ../eccube-local/inst/ec-tackleberry-api, shown as the developer's
 * http://localhost:8080) and the store-link (store-link/, the reconstructed in-store stock system's side) really running against it.
 *
 *   node tools/snapshots/ec-tackleberry-api/capture-ec.js [screenshot folder]      (20–30 min; one Chrome + one EC-CUBE + store-link)
 *   → node tools/webp.js ec-tackleberry-api
 *
 * Before: scrape-shop.js (shop-data.json, pictures in ../eccube-local/data/ec-tackleberry-api/save_image), build-src.js (js/link-src.js).
 * The copy is made fresh, then:
 *   setup    ＠ベリーネット's public data: shop info, categories (大分類 with the live ids 1–7, 中分類), 18 used rods / reels (live ids,
 *            names, ランク, 商品の状態, メーカー, 規格・品番, the stores' 13-digit codes, prices, one picture each), 販売種別 中古品 / 新品,
 *            送料 per item (ロッド 2,090 / リール 880 円), one payment; a test customer (invented). Api42's leftover tables dropped
 *   ch1      商品一覧 (在庫 1)
 *   ch2      プラグイン一覧 (Web API 無効) → Api42 installed and enabled through EC-CUBE's own PluginService (postInstall + enable: what
 *            eccube:plugin:enable does, without its dependency query to the Owners Store package API, which needs exec()) → cache:clear →
 *            プラグイン一覧 (有効); eccube:api:dump-schema
 *   ch3      OAuth管理 → 新規登録 (redirect URI, read / write) → the list; store-link authorize → the admin's 認可 screen → 許可 →
 *            store-link /callback (code → token)
 *   ch4      store-link stock with update-stock.graphql v1 (stock_unlimited missing: GraphQL's error) → fixed → 商品一覧 (在庫 0), a sold-out page
 *   ch5      WebHook管理 → 新規登録 → order A (the receiver reads the signature header with capital letters: 401, EC-CUBE's log) →
 *            the fix → order B (200, 出荷指示) → 受注一覧
 *   ch6      store-link ship (updateShipped, 出荷完了メール) → 受注一覧 (発送済み), 受注登録 (出荷日・お問い合わせ番号)
 *   ch7      the access token expired (its expiry set in the past) → orders: refreshed for real, the catch-up finds order A;
 *            list-clients / update-client are run too (not in the video: the admin's client already has refresh_token)
 * Outputs (store-link, bin/console, EC-CUBE's log) are kept in EC_SNAPSHOT.data with 127.0.0.1:<port> → localhost:8080 and the
 * clock moved to the video's.
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { spawn } = require('child_process');
const ROOT = path.resolve(__dirname, '../../..');
const ECC = require(path.join(ROOT, 'tools/eccube/capture'));
const SRC = require(path.join(ROOT, 'public/videos/ec-tackleberry-api/js/link-src.js'));
const ID = 'ec-tackleberry-api';
const SHOTS = process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : null;
const SHOP = JSON.parse(fs.readFileSync(path.join(__dirname, 'shop-data.json'), 'utf8'));
const IMG = path.resolve(ROOT, '../eccube-local/data/ec-tackleberry-api/save_image');
const RUN = path.resolve(ROOT, '../eccube-local/data/ec-tackleberry-api/run');
const log = (...a) => console.log(`[${new Date().toLocaleTimeString('sv-SE')}]`, ...a);
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

const P = (code) => SHOP.products.find((p) => p.code === code);
const SOLD = ['4023351010975', '3461086007708'];      // シェリー CR62L・15イグジスト 2508PE：店頭で売れる
const HOLD = '3921052011431';                        // アンタレス RH：店頭で取置中（在庫 0）→ 取置解除
const ORDER_A = '3461086007739';                     // 23エアリティ PC LT2500-H：WebHook が 401 の注文
const ORDER_B = '3881057013567';                     // ロキサーニSP 2500SH：出荷まで進む注文
const CUSTOMER = { email: 'taro.test@example.com', pass: 'berry-test-2026' };
const WEBHOOK_SECRET = crypto.createHash('sha256').update('ec-tackleberry-api webhook').digest('hex').slice(0, 40);
const store = (code) => code.slice(0, 3);
const kind = (p) => (p.cats[0] === 'ロッド' ? 'rod' : 'reel');

const SETUP_PHP = String.raw`
$conn = $em->getConnection();
$now = new \DateTime();
foreach (['dtb_product_category', 'dtb_product_tag', 'dtb_product_image', 'dtb_product_stock', 'dtb_customer_favorite_product', 'dtb_cart_item', 'dtb_cart',
          'dtb_product_class', 'dtb_product', 'dtb_class_category', 'dtb_class_name', 'dtb_category', 'dtb_tag', 'dtb_news'] as $t) {
    $conn->executeStatement("DELETE FROM $t");
}
$conn->executeStatement('DELETE FROM dtb_tax_rule WHERE product_class_id IS NOT NULL');
// Api42's tables from the base install (made before the plugin is installed: its schema update must create them itself)
foreach (['oauth2_authorization_code', 'oauth2_refresh_token', 'oauth2_access_token', 'oauth2_client', 'plg_api_webhook'] as $t) $conn->executeStatement("DROP TABLE IF EXISTS $t");
foreach ([\Eccube\Entity\Category::class, \Eccube\Entity\Product::class] as $cls) {
    $md = $em->getClassMetadata($cls);
    $md->setIdGeneratorType(\Doctrine\ORM\Mapping\ClassMetadata::GENERATOR_TYPE_NONE);
    $md->setIdGenerator(new \Doctrine\ORM\Id\AssignedGenerator());
}
$setId = function ($obj, $id) { $r = new \ReflectionProperty(get_class($obj), 'id'); $r->setAccessible(true); $r->setValue($obj, $id); };
$Member = $em->getRepository(\Eccube\Entity\Member::class)->find(1);
$Pref = fn ($id) => $em->getRepository(\Eccube\Entity\Master\Pref::class)->find($id);

$B = $em->getRepository(\Eccube\Entity\BaseInfo::class)->get();
$B->setShopName('＠ベリーネット')->setShopNameEng('@BERRY NET')->setCompanyName('株式会社タックルベリー')->setPostalCode('2510055')->setPref($Pref(14))
  ->setAddr01('藤沢市南藤沢')->setAddr02('16-16 FDIビル2F')->setPhoneNumber('0466520877')
  ->setEmail01('b-net-dev@example.com')->setEmail02('b-net-dev@example.com')->setEmail03('b-net-dev@example.com')->setEmail04('b-net-dev@example.com')
  ->setDeliveryFreeAmount(null)->setDeliveryFreeQuantity(null)->setOptionProductDeliveryFee(true)->setOptionCustomerActivate(false);

// 販売種別：中古品・新品（the live site's sale_type 1 / 2）
$conn->executeStatement("UPDATE mtb_sale_type SET name = '中古品' WHERE id = 1");
$conn->executeStatement("UPDATE mtb_sale_type SET name = '新品' WHERE id = 2");

// categories: 大分類 (live ids) and the 中分類 of the products
$cats = [];
$sort = 1000;
foreach ($data['categories'] as $c0) {
    $c = new \Eccube\Entity\Category();
    $setId($c, (int) $c0['id']);
    $c->setName($c0['name'])->setHierarchy($c0['parent'] ? 2 : 1)->setSortNo($sort--)->setCreator($Member)->setCreateDate($now)->setUpdateDate($now);
    if ($c0['parent']) { $c->setParent($cats[$c0['parent']]); $cats[$c0['parent']]->addChild($c); }
    $em->persist($c);
    $cats[(int) $c0['id']] = $c;
    $em->flush();
}

$tags = [];
$ts = 1;
$SaleType = $em->getRepository(\Eccube\Entity\Master\SaleType::class)->find(1);
$Show = $em->getRepository(\Eccube\Entity\Master\ProductStatus::class)->find(1);
$made = 0;
foreach ($data['products'] as $p) {
    $P = new \Eccube\Entity\Product();
    $setId($P, $p['id']);
    $P->setName($p['name'])->setStatus($Show)->setDescriptionDetail($p['detail'])->setDescriptionList($p['list'])->setSearchWord($p['maker'])
      ->setCreator($Member)->setCreateDate($now)->setUpdateDate($now);
    $em->persist($P);
    foreach ($p['cats'] as $cid) {
        $pc = (new \Eccube\Entity\ProductCategory())->setProduct($P)->setCategory($cats[$cid])->setProductId($p['id'])->setCategoryId($cid);
        $P->addProductCategory($pc);
        $em->persist($pc);
    }
    $t = $p['tag'];
    if (!isset($tags[$t])) { $tags[$t] = (new \Eccube\Entity\Tag())->setName($t)->setSortNo($ts++); $em->persist($tags[$t]); }
    $pt = (new \Eccube\Entity\ProductTag())->setProduct($P)->setTag($tags[$t])->setCreator($Member)->setCreateDate($now);
    $P->addProductTag($pt);
    $em->persist($pt);
    foreach ($p['files'] as $i => $f) {
        $pi = (new \Eccube\Entity\ProductImage())->setProduct($P)->setFileName($f)->setSortNo($i + 1)->setCreator($Member)->setCreateDate($now);
        $P->addProductImage($pi);
        $em->persist($pi);
    }
    $PC = new \Eccube\Entity\ProductClass();
    $PC->setProduct($P)->setSaleType($SaleType)->setPrice01($p['price01'])->setPrice02($p['price02'])->setVisible(true)->setStockUnlimited(false)->setStock($p['stock'])
       ->setSaleLimit(1)->setDeliveryFee($p['fee'])->setCode($p['code'])->setCreator($Member)->setCreateDate($now)->setUpdateDate($now)->setCurrencyCode('JPY');
    $PS = (new \Eccube\Entity\ProductStock())->setProductClass($PC)->setStock($p['stock'])->setCreator($Member)->setCreateDate($now)->setUpdateDate($now);
    $PC->setProductStock($PS);
    $P->addProductClass($PC);
    $em->persist($PC);
    $em->persist($PS);
    $made++;
}
$em->flush();

// delivery: 宅配便（中古品）— the per-item 送料 (ロッド 2,090 円・リール 880 円) is the product's 送料
$D = $em->getRepository(\Eccube\Entity\Delivery::class)->find(1);
$D->setName('宅配便（中古品）')->setServiceName('宅配便')->setDescription('在庫店舗から発送します')->setConfirmUrl(null);
foreach ($em->getRepository(\Eccube\Entity\DeliveryFee::class)->findBy(['Delivery' => $D]) as $F) $F->setFee('0');
$D2 = $em->getRepository(\Eccube\Entity\Delivery::class)->find(2);
if ($D2) $D2->setVisible(false);
$em->flush();
$conn->executeStatement('DELETE FROM dtb_payment_option WHERE payment_id <> 3 OR delivery_id <> 1');
$conn->executeStatement('DELETE FROM dtb_payment WHERE id <> 3');
$G = $em->getRepository(\Eccube\Entity\Payment::class)->find(3);
$G->setMethod('コンビニ・ATM・インターネットバンキング決済')->setCharge('0')->setRuleMin('0')->setRuleMax(null)->setVisible(true)->setSortNo(1);
$em->flush();

// a test customer (invented; the video's test orders)
$C = new \Eccube\Entity\Customer();
$C->setName01('テスト')->setName02('太郎')->setKana01('テスト')->setKana02('タロウ')->setEmail($data['customer']['email'])
  ->setPostalCode('2510055')->setPref($Pref(14))->setAddr01('藤沢市南藤沢')->setAddr02('1-1-1 テストビル 3F')->setPhoneNumber('0400000000')
  ->setPassword(password_hash($data['customer']['pass'], PASSWORD_BCRYPT))->setSalt(null)->setSecretKey(bin2hex(random_bytes(16)))
  ->setStatus($em->getRepository(\Eccube\Entity\Master\CustomerStatus::class)->find(2))->setPoint('0')->setCreateDate($now)->setUpdateDate($now);
$em->persist($C);
$em->flush();
return ['products' => $made, 'categories' => count($cats), 'customer' => $C->getId()];
`;

/*
 * Api42's install + enable, as eccube:plugin:enable does them (PluginService::postInstall — the schema update for its entities, the
 * oauth2_* and plg_api_webhook tables — then enable()), but without installWithCode's dependency query: that asks the Owners Store
 * package API through Composer, which runs exec() (no processes in PHP in WebAssembly). Api42 needs no other plugin.
 */
const INSTALL_PHP = String.raw`
$app = new \Symfony\Bundle\FrameworkBundle\Console\Application($kernel);
$cmd = $app->find('eccube:plugin:enable');
$ps = (new \ReflectionProperty($cmd, 'pluginService'))->getValue($cmd);
$repo = (new \ReflectionProperty($cmd, 'pluginRepository'))->getValue($cmd);
$pc = (new \ReflectionProperty(\Eccube\Service\PluginService::class, 'pluginContext'))->getValue($ps);
$pc->setCode('Api42');
$pc->setInstall();
$dir = $ps->calcPluginDir('Api42');
$ps->checkPluginArchiveContent($dir);
$config = $ps->readConfig($dir);
$ps->copyAssets('Api42');
$ps->postInstall($config, $config['source']);
$em->clear();
$ps->enable($repo->findByCode('Api42'));
return $em->getConnection()->fetchAllAssociative("SELECT code, name, version, enabled, initialized FROM dtb_plugin WHERE code = 'Api42'");`;

const CONSOLE_PHP = String.raw`
$app = new \Symfony\Bundle\FrameworkBundle\Console\Application($kernel);
$app->setAutoExit(false);
$out = new \Symfony\Component\Console\Output\BufferedOutput();
// eccube:api:dump-schema prints the schema, then fails on its own return type (execute() returns null, Symfony 6 wants an int): kept
try { $code = $app->run(new \Symfony\Component\Console\Input\ArrayInput($data), $out); } catch (\Throwable $e) { $code = 1; $err = get_class($e) . ': ' . $e->getMessage(); }
return ['code' => $code, 'out' => $out->fetch(), 'err' => $err ?? null];`;

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

/** the store-link's [HH:MM:SS] (and EC-CUBE's log times) moved to the video's clock: the first at `base`, the rest keep their spacing */
function retime(lines, base) {
  const [bh, bm] = base.split(':').map(Number);
  let t0 = null;
  const fmt = (s) => { const h = Math.floor(s / 3600) % 24, m = Math.floor(s / 60) % 60, x = s % 60; return [h, m, x].map((n) => String(n).padStart(2, '0')).join(':'); };
  return lines.map((l) => l.replace(/(\d{4}-\d{2}-\d{2}T)?(\d{2}):(\d{2}):(\d{2})(\.\d+)?/, (all, d, h, m, s, frac) => {
    const t = +h * 3600 + +m * 60 + +s;
    if (t0 == null) t0 = t;
    return (d ? '2026-11-14T' : '') + fmt(bh * 3600 + bm * 60 + (t - t0 + 86400) % 86400 + (t0 % 60)) + (frac || '');
  }));
}

(async () => {
  const cap = await ECC.start({ id: ID, version: 4, fresh: true, site: 'http://localhost:8080', date: '2026-11-14', time: '10:08', shots: SHOTS });
  const { page } = cap;
  const D = cap.data;
  const show = (s) => String(s || '').replace(new RegExp(cap.origin.replace(/[.:/]/g, '\\$&'), 'g'), 'http://localhost:8080').replace(/127\.0\.0\.1:\d{4}/g, 'localhost:8080')
    .replace(/\/srv\/eccube/g, '/var/www/html').replace(/\r/g, '');
  const wipeCache = () => { try { fs.rmSync(path.join(cap.instance, 'var/cache/prod'), { recursive: true, force: true }); } catch (e) { log('cache dir:', e.message); } };
  const cacheClear = async () => { const out = await cap.console(['cache:clear', '--no-warmup']); wipeCache(); return out; };
  const dbConsole = async (input) => {
    const r = await cap.php(CONSOLE_PHP, input);
    log(`console ${JSON.stringify(input)} → ${r.code}`, r.out.slice(-400));
    return r;
  };
  const adminLogin = async () => { await cap.go('/admin/login', 'body'); if (await page.$('#login_id')) await cap.login(); };
  const nav = async (fn, ready = 'body', ...args) => { await Promise.all([page.waitForNavigation({ waitUntil: 'load', timeout: 300000 }), page.evaluate(fn, ...args)]); await cap.settle(ready); };
  const frontLogin = async () => {
    await cap.go('/mypage/login', 'body');
    if (!(await page.$('#login_email'))) return;
    await cap.type('#login_email', CUSTOMER.email);
    await cap.type('#login_pass', CUSTOMER.pass);
    await nav(() => document.querySelector('#login_email').form.submit());
  };
  const confirmBtn = () => nav(() => document.querySelector('#shopping-form button.ec-blockBtn--action').click(), 'body');
  const lastOrder = () => cap.php("$o = $em->getRepository(\\Eccube\\Entity\\Order::class)->findOneBy([], ['id' => 'DESC']); $s = $o->getShippings()->first(); return ['id' => $o->getId(), 'no' => $o->getOrderNo(), 'status' => $o->getOrderStatus()->getName(), 'total' => (int) $o->getPaymentTotal(), 'shipping' => $s ? $s->getId() : null, 'tracking' => $s ? $s->getTrackingNumber() : null, 'shipped' => $s && $s->getShippingDate() ? $s->getShippingDate()->format('c') : null];");
  const stockOf = (codes) => cap.php("$r = []; foreach ($data as $c) { $pc = $em->getRepository(\\Eccube\\Entity\\ProductClass::class)->findOneBy(['code' => $c]); $r[$c] = $pc ? $pc->getStock() : null; } return $r;", codes);

  // ---------------------------------------------------------------- the store-link, really running (reconstructed in-store side)
  let serveProc = null;
  const serveOut = [];
  const writeLink = (stage, stockFixed = true) => {
    fs.writeFileSync(path.join(RUN, 'link.mjs'), SRC.link[stage]);
    fs.writeFileSync(path.join(RUN, 'graphql/update-stock.graphql'), stockFixed ? SRC.files['graphql/update-stock.graphql'] : SRC.stockV1);
  };
  const runLink = (args) => new Promise((resolve) => {
    const ch = spawn(process.execPath, ['link.mjs', ...args], { cwd: RUN });
    let out = '';
    ch.stdout.on('data', (b) => (out += b));
    ch.stderr.on('data', (b) => (out += b));
    ch.on('close', (code) => { log(`store-link ${args.join(' ')} → ${code}\n${out.trim()}`); resolve({ code, out: out.trim() }); });
  });
  const startServe = async () => {
    if (serveProc) { serveProc.kill(); await wait(500); }
    serveProc = spawn(process.execPath, ['link.mjs', 'serve'], { cwd: RUN });
    const take = (b) => String(b).split('\n').filter((l) => l.trim()).forEach((l) => { serveOut.push(l); log('[serve]', l); });
    serveProc.stdout.on('data', take);
    serveProc.stderr.on('data', take);
    for (let i = 0; i < 40 && !serveOut.some((l) => /store-link http/.test(l)); i++) await wait(250);
  };
  const serveSince = (n) => serveOut.slice(n).map(show);
  const waitServe = async (re, n0, ms = 120000) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { if (serveOut.slice(n0).some((l) => re.test(l))) return true; await wait(500); } return false; };

  try {
    // ---------------------------------------------------------------- setup: the shop's public data
    const dest = path.join(cap.instance, 'html/upload/save_image');
    fs.mkdirSync(dest, { recursive: true });
    for (const f of fs.readdirSync(IMG)) fs.copyFileSync(path.join(IMG, f), path.join(dest, f));
    const TOPS = [[1, 'ロッド'], [2, 'リール'], [3, 'ルアー・フライ'], [4, '雑品'], [5, 'その他用品'], [7, 'アウトドア']];
    const subs = [];
    for (const p of SHOP.products) { const top = TOPS.find((t) => t[1] === p.cats[0]); if (p.cats[1] && p.cats[1] !== 'その他' && !subs.some((s) => s.name === p.cats[1])) subs.push({ name: p.cats[1], parent: top[0] }); }
    subs.forEach((s, i) => { s.id = s.parent * 100 + i + 1; });
    const categories = [...TOPS.map(([id, name]) => ({ id, name, parent: null })), ...subs];
    const products = SHOP.products.map((p) => {
      const top = TOPS.find((t) => t[1] === p.cats[0])[0];
      const sub = subs.find((s) => s.name === p.cats[1]);
      return { id: p.id, name: p.name, code: p.code, price01: p.price01, price02: p.price02, fee: kind(p) === 'rod' ? 2090 : 880, stock: p.code === HOLD ? 0 : 1,
        maker: p.maker, tag: `ランク${p.rank}`, files: p.files, cats: sub ? [top, sub.id] : [top], list: `ランク ${p.rank}／${p.maker}`,
        detail: `${p.state}\n\n商品ランク：${p.rank}\nメーカー名：${p.maker}\n規格・品番：${p.model}` };
    });
    log('setup', JSON.stringify(await cap.php(SETUP_PHP, { categories, products, customer: CUSTOMER })));
    await cacheClear();
    // the store-link's working copy: the final files, the stage written per chapter
    fs.rmSync(RUN, { recursive: true, force: true });
    for (const [f, t] of Object.entries(SRC.files)) { fs.mkdirSync(path.dirname(path.join(RUN, f)), { recursive: true }); fs.writeFileSync(path.join(RUN, f), t); }
    fs.mkdirSync(path.join(RUN, 'data'), { recursive: true });
    fs.mkdirSync(path.join(RUN, 'pos'), { recursive: true });
    const shelf = {};
    const ledger = ['商品コード,店舗,棚番', ...SHOP.products.map((p) => { const s = store(p.code); shelf[s] = (shelf[s] || 0) + 1; return `${p.code},${s},${kind(p) === 'rod' ? 'R' : 'L'}-${String(10 + shelf[s] * 3).padStart(2, '0')}`; })].join('\n') + '\n';
    fs.writeFileSync(path.join(RUN, 'data/ledger.csv'), ledger);
    D.ledger = ledger;

    // ---------------------------------------------------------------- ch1: 商品一覧
    await cap.login();
    await cap.go('/admin/product', '.c-contentsArea');
    await cap.capture('products-0');

    // ---------------------------------------------------------------- ch2: Api42
    await cap.go('/admin/store/plugin', '.c-contentsArea');
    await cap.capture('plugins-0');
    D.install = await cap.php(INSTALL_PHP);
    log('Api42', JSON.stringify(D.install));
    if (!D.install.some((p) => +p.enabled === 1)) throw new Error('Api42 is not enabled');
    D.cacheOut = show(await cacheClear());
    await adminLogin();
    await cap.go('/admin/store/plugin', '.c-contentsArea');
    await cap.capture('plugins-1');
    const ds = await dbConsole({ command: 'eccube:api:dump-schema' });
    D.schema = ds.out;
    D.schemaErr = ds.err;

    // ---------------------------------------------------------------- ch3: OAuth client, authorize
    await cap.go('/admin/api/oauth', '.c-contentsArea');
    await cap.capture('oauth-0');
    await cap.go('/admin/api/oauth/new', 'form');
    D.oauthForm = await page.evaluate(() => [...document.querySelectorAll('form input, form select')].map((e) => `${e.type}#${e.id}=${e.type === 'checkbox' ? e.value : ''}`));
    log('oauth form', D.oauthForm.join(' '));
    const client = await page.evaluate(() => ({ id: document.querySelector('input[id$="_identifier"]').value, secret: document.querySelector('input[id$="_secret"]').value }));
    D.client = client;
    await cap.capture('oauth-new', { inputs: [['input[id$="_redirect_uris"]', 'redirect']] });
    await cap.type('input[id$="_redirect_uris"]', 'http://localhost:3100/callback');
    await page.evaluate(() => document.querySelectorAll('input[type=checkbox][id*="scopes"]').forEach((c) => { c.checked = true; }));
    await nav(() => document.querySelector('input[id$="_redirect_uris"]').form.querySelector('button[type=submit]').click(), '.c-contentsArea');
    await cap.capture('oauth-list');
    D.clients0 = show((await dbConsole({ command: 'league:oauth2-server:list-clients' })).out);
    fs.writeFileSync(path.join(RUN, '.env'), SRC.files['.env.example'].replace('EC_URL=http://localhost:8080', `EC_URL=${cap.origin}`)
      .replace('CLIENT_ID=', `CLIENT_ID=${client.id}`).replace('CLIENT_SECRET=', `CLIENT_SECRET=${client.secret}`).replace('WEBHOOK_SECRET=', `WEBHOOK_SECRET=${WEBHOOK_SECRET}`));
    D.webhookSecret = WEBHOOK_SECRET;
    writeLink(1, false);
    await startServe();
    const auth = await runLink(['authorize']);
    D.authorizeUrl = show(auth.out);
    await page.goto(auth.out.trim(), { waitUntil: 'load' });
    await cap.settle('body');
    if (await page.$('#login_id')) { await cap.login(); await page.goto(auth.out.trim(), { waitUntil: 'load' }); await cap.settle('body'); }
    await cap.capture('authorize');
    let n0 = serveOut.length;
    await nav(() => [...document.querySelectorAll('button, input[type=submit]')].find((b) => /approve/.test(b.name || b.id)).click(), 'body');
    await waitServe(/認可 OK|Error|失敗/, n0);
    await cap.capture('callback');
    D.callback = retime(serveSince(n0), '10:22');
    D.token = JSON.parse(fs.readFileSync(path.join(RUN, 'var/token.json'), 'utf8'));
    D.token = { token_type: D.token.token_type, expires_in: D.token.expires_in, access_token: D.token.access_token.slice(0, 60) + '…', refresh_token: D.token.refresh_token.slice(0, 40) + '…' };

    // ---------------------------------------------------------------- ch4: stock (POS → updateProductStock)
    const sales = ['日時,店舗,商品コード,区分,在庫数',
      `2026-11-14 09:52:14,${store(SOLD[0])},${SOLD[0]},店頭販売,0`,
      `2026-11-14 10:07:41,${store(SOLD[1])},${SOLD[1]},店頭販売,0`,
      `2026-11-14 10:21:05,${store(HOLD)},${HOLD},取置解除,1`].join('\n') + '\n';
    fs.writeFileSync(path.join(RUN, 'pos/sales-20261114-1030.csv'), sales);
    D.sales = sales;
    D.stock0 = await stockOf([...SOLD, HOLD]);
    D.stockRun1 = retime(show((await runLink(['stock', 'pos/sales-20261114-1030.csv'])).out).split('\n'), '10:31');
    writeLink(1, true);
    D.stockRun2 = retime(show((await runLink(['stock', 'pos/sales-20261114-1030.csv'])).out).split('\n'), '10:35');
    D.stock1 = await stockOf([...SOLD, HOLD]);
    log('stock', JSON.stringify(D.stock0), '→', JSON.stringify(D.stock1));
    await cap.go('/admin/product', '.c-contentsArea');
    await cap.capture('products-1');
    await cap.go('/products/detail/' + P(SOLD[1]).id, '.ec-productRole');
    await cap.capture('front-soldout');

    // ---------------------------------------------------------------- ch5: WebHook
    await cap.go('/admin/api/webhook', '.c-contentsArea');
    await cap.capture('webhook-0');
    const newHref = await page.evaluate(() => { const a = [...document.querySelectorAll('a')].find((x) => /webhook\/new/.test(x.href)); return a && a.getAttribute('href'); });
    await cap.go(newHref ? new URL(newHref, cap.origin).pathname : '/admin/api/webhook/new', 'form');
    D.webhookForm = await page.evaluate(() => [...document.querySelectorAll('form input')].map((e) => `${e.type}#${e.id}`));
    log('webhook form', D.webhookForm.join(' '));
    await cap.capture('webhook-new', { inputs: [['input[id$="_payload_url"]', 'payload'], ['input[id$="_secret"]', 'secret']] });
    await cap.type('input[id$="_payload_url"]', 'http://localhost:3100/webhook');
    await cap.type('input[id$="_secret"]', WEBHOOK_SECRET);
    await page.evaluate(() => { const c = document.querySelector('input[type=checkbox][id$="_enabled"]'); if (c) c.checked = true; });
    await nav(() => document.querySelector('input[id$="_payload_url"]').form.querySelector('button[type=submit]').click(), '.c-contentsArea');
    await cap.capture('webhook-list');
    D.webhooks = await cap.php("return $em->getConnection()->fetchAllAssociative('SELECT id, payload_url, enabled FROM plg_api_webhook');");
    log('webhooks', JSON.stringify(D.webhooks));
    writeLink(2);
    await startServe();
    // order A (the receiver's mistake: 401)
    await frontLogin();
    await cap.go('/products/detail/' + P(ORDER_A).id, '#form1');
    await cap.capture('product-a');
    n0 = serveOut.length;
    await nav(() => document.querySelector('#form1').submit());
    await cap.go('/cart', '.ec-cartRole');
    await nav(() => { location.href = document.querySelector('a.ec-blockBtn--action[href*="cart/buystep"]').href; }, '#shopping-form');
    await cap.capture('shopping-a');
    await confirmBtn();
    await cap.capture('confirm-a');
    await confirmBtn();
    await cap.capture('complete-a');
    D.orderA = await lastOrder();
    await waitServe(/401/, n0, 20000);
    await wait(1500);
    D.hookA = retime(serveSince(n0), '10:47');
    D.hookLog = logLines(cap.instance, /webhook|WebHook/, 4);
    D.hookLog.lines = retime(D.hookLog.lines.map(show), '10:47');
    log('order A', JSON.stringify(D.orderA), D.hookA.join(' | '));
    // the fix, order B
    writeLink(3);
    await startServe();
    n0 = serveOut.length;
    await cap.go('/products/detail/' + P(ORDER_B).id, '#form1');
    await cap.capture('product-b');
    await nav(() => document.querySelector('#form1').submit());
    await cap.go('/cart', '.ec-cartRole');
    await nav(() => { location.href = document.querySelector('a.ec-blockBtn--action[href*="cart/buystep"]').href; }, '#shopping-form');
    await confirmBtn();
    await confirmBtn();
    await cap.capture('complete-b');
    D.orderB = await lastOrder();
    await waitServe(/出荷指示|失敗/, n0, 60000);
    await wait(1500);
    D.hookB = retime(serveSince(n0), '10:52');
    D.picking = fs.existsSync(path.join(RUN, 'outbox')) ? Object.fromEntries(fs.readdirSync(path.join(RUN, 'outbox')).map((f) => [f, fs.readFileSync(path.join(RUN, 'outbox', f), 'utf8')])) : {};
    log('order B', JSON.stringify(D.orderB), D.hookB.join(' | '));
    await adminLogin();
    await cap.go('/admin/order', '.c-contentsArea');
    await cap.capture('orders-1');

    // ---------------------------------------------------------------- ch6: ship (updateShipped)
    const shipped = ['受注番号,出荷ID,店舗,配送業者,お問い合わせ番号', `${D.orderB.no},${D.orderB.shipping},${store(ORDER_B)},ヤマト運輸,4419-6203-7751`].join('\n') + '\n';
    fs.writeFileSync(path.join(RUN, 'pos/shipped-20261114-1140.csv'), shipped);
    D.shipped = shipped;
    D.shipRun = retime(show((await runLink(['ship', 'pos/shipped-20261114-1140.csv'])).out).split('\n'), '11:41');
    D.orderB2 = await cap.php("$o = $em->getRepository(\\Eccube\\Entity\\Order::class)->find($data); $s = $o->getShippings()->first(); return ['status' => $o->getOrderStatus()->getName(), 'tracking' => $s->getTrackingNumber(), 'shipped' => $s->getShippingDate() ? $s->getShippingDate()->format('c') : null, 'mails' => count($o->getMailHistories())];", D.orderB.id);
    log('order B after ship', JSON.stringify(D.orderB2));
    await cap.go('/admin/order', '.c-contentsArea');
    await cap.capture('orders-2');
    await cap.go(`/admin/order/${D.orderB.id}/edit`, '.c-contentsArea');
    await cap.capture('order-edit-b');

    // ---------------------------------------------------------------- ch7: refresh token, update-client, the catch-up
    writeLink(4);
    const tf = path.join(RUN, 'var/token.json');
    const tok = JSON.parse(fs.readFileSync(tf, 'utf8'));
    tok.expires_at = Date.now() - 1000;   // an hour on: the access token has expired
    fs.writeFileSync(tf, JSON.stringify(tok, null, 2));
    D.ordersRun1 = retime(show((await runLink(['orders'])).out).split('\n'), '11:55');
    D.clientsBefore = show((await dbConsole({ command: 'league:oauth2-server:list-clients' })).out);
    D.updateClient = show((await dbConsole({ command: 'league:oauth2-server:update-client', identifier: client.id, '--add-grant-type': ['refresh_token'] })).out);
    D.clientsAfter = show((await dbConsole({ command: 'league:oauth2-server:list-clients' })).out);
    D.ordersRun2 = retime(show((await runLink(['orders'])).out).split('\n'), '11:58');
    D.picking2 = fs.existsSync(path.join(RUN, 'outbox')) ? Object.fromEntries(fs.readdirSync(path.join(RUN, 'outbox')).map((f) => [f, fs.readFileSync(path.join(RUN, 'outbox', f), 'utf8')])) : {};
    D.linkLog = fs.existsSync(path.join(RUN, 'logs')) ? fs.readdirSync(path.join(RUN, 'logs')).map((f) => fs.readFileSync(path.join(RUN, 'logs', f), 'utf8')).join('') : '';
    await cap.go('/admin/order', '.c-contentsArea');
    await cap.capture('orders-3');

    if (serveProc) serveProc.kill();
    await cap.finish();
    process.exit(0);   // the PHP runtime keeps handles open after finish()
  } catch (e) {
    console.error(e);
    if (serveProc) serveProc.kill();
    await cap.abort();
    process.exit(1);
  }
})();
