/*
 * The real EC-CUBE screens of the ec-koyama-kyugu video, captured from EC-CUBE itself (tools/eccube/capture.js:
 * EC-CUBE 4.3.1-p1 on PHP 8.3 in WebAssembly, SQLite — the same database EC-CUBE's own docker-compose.yml uses — in
 * ../eccube-local/inst/ec-koyama-kyugu, shown as the developer's http://localhost:8080).
 *
 *   node tools/snapshots/ec-koyama-kyugu/capture-ec.js [screenshot folder]
 *   → node tools/webp.js ec-koyama-kyugu
 *
 * Before: scrape-shop.js (shop-data.json: the live shop's public categories / products) and build-theme.js (theme/: the
 * shop's front theme rebuilt from its public HTML, its stylesheets and pictures saved in theme/html (copied into the local EC-CUBE by capture-ec.js)).
 * The copy is made fresh, then:
 *   setup    (EC-CUBE 4.3's bundled plugins unregistered — never installed, not in the shop) the shop's public data: shop info (特定商取引法に基づく表記), the category tree with the live ids, 21 products
 *            with the live ids, names, prices (税込 → 税抜), 規格, descriptions, pictures, 送料 sizes as tags (送料A …),
 *            the delivery fees of ご購入ガイド (C size, ヤマト運輸), 送料無料 15,000 円, payments 郵便振替 / 銀行振込; a test
 *            customer (invented). Stock counts are invented (the live pages only say in stock / sold out).
 *   stage 0  the shop as it is: admin login, home, products, shop settings (送料無料条件), the product page of 清芳 前煤竹
 *   stage 1  ProductTrait + eccube:generate:proxies, no schema update → the product page's real system error (+ the log)
 *   stage 2  doctrine:schema:update (the real SQL) + the admin form extension → 商品登録 with 受注生産 / 納期の目安,
 *            switched on and saved for real
 *   stage 3  the Twig function + the template + CSS → the product pages with the badge (受注生産 / 在庫あり / 残りわずか)
 *   stage 4  the delivery fee rule (PurchaseFlow) → the cart (still 「送料無料」) and the checkout (送料 1,980 円)
 *   stage 5  the cart's EventSubscriber → the cart (あと 32,600 円), the order placed, 受注一覧 / 受注登録 in the admin
 * Every console output the video prints (proxies, schema update SQL, the error log line) is kept in EC_SNAPSHOT.data.
 */
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '../../..');
const ECC = require(path.join(ROOT, 'tools/eccube/capture'));
const SRC = require(path.join(ROOT, 'public/videos/ec-koyama-kyugu/js/customize-src.js'));
const ID = 'ec-koyama-kyugu';
const SHOTS = process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : null;
const SHOP = JSON.parse(fs.readFileSync(path.join(__dirname, 'shop-data.json'), 'utf8'));
const THEME = path.join(__dirname, 'theme');
const LIVE = 'https://www.koyama-kyugu.com';
const log = (...a) => console.log(`[${new Date().toLocaleTimeString('sv-SE')}]`, ...a);
const readTheme = (p) => fs.readFileSync(path.join(THEME, p), 'utf8');

// the delivery fees of ご購入ガイド (都道府県別配送料金, C サイズ) by prefecture id (1 北海道 … 47 沖縄)
const FEE_C = (() => {
  const zones = [[[1], 2350], [[2, 3, 4, 5, 6, 7], 2080], [[8, 9, 10, 11, 12, 13, 14], 1980], [[15, 16, 17, 18, 19, 20, 21, 22, 23], 1980],
    [[24, 25, 26, 27, 28, 29, 30], 2080], [[31, 32, 33, 34, 35], 2200], [[36, 37, 38, 39], 2200], [[40, 41, 42, 43, 44, 45, 46], 2350], [[47], 4680]];
  const m = {};
  for (const [ids, fee] of zones) for (const i of ids) m[i] = fee;
  return m;
})();
// stock in the copy (invented: the live pages only tell in stock / sold out)
const STOCK = { 139: 2, 6: 1, 344: 2, 343: 3, 93: 4 };
// 受注生産 (made to order: orderable without stock — 在庫数無制限, as a made-to-order item is set up in EC-CUBE)
const UNLIMITED = [7, 10, 319];

const SETUP_PHP = String.raw`

$conn = $em->getConnection();
$now = new \DateTime();
// the sample data of a fresh install
foreach (['dtb_product_category', 'dtb_product_tag', 'dtb_product_image', 'dtb_product_stock', 'dtb_customer_favorite_product', 'dtb_cart_item', 'dtb_cart',
          'dtb_product_class', 'dtb_product', 'dtb_class_category', 'dtb_class_name', 'dtb_category', 'dtb_tag', 'dtb_news',
          // EC-CUBE 4.3's bundled plugins (registered, never installed): the shop's copy has none of them
          'dtb_plugin'] as $t) {
    $conn->executeStatement("DELETE FROM $t");
}
foreach ([\Eccube\Entity\Category::class, \Eccube\Entity\Product::class] as $cls) {
    $md = $em->getClassMetadata($cls);
    $md->setIdGeneratorType(\Doctrine\ORM\Mapping\ClassMetadata::GENERATOR_TYPE_NONE);
    $md->setIdGenerator(new \Doctrine\ORM\Id\AssignedGenerator());
}
$setId = function ($obj, $id) { $r = new \ReflectionProperty(get_parent_class($obj) && property_exists(get_parent_class($obj), 'id') ? get_parent_class($obj) : get_class($obj), 'id'); $r->setAccessible(true); $r->setValue($obj, $id); };
$Member = $em->getRepository(\Eccube\Entity\Member::class)->find(1);
$Pref = fn ($id) => $em->getRepository(\Eccube\Entity\Master\Pref::class)->find($id);

// shop info (特定商取引法に基づく表記)
$B = $em->getRepository(\Eccube\Entity\BaseInfo::class)->get();
$B->setShopName('小山弓具公式オンラインショップ')->setCompanyName('株式会社小山弓具')->setPostalCode('1010041')->setPref($Pref(13))
  ->setAddr01('千代田区神田須田町')->setAddr02('1-6')->setPhoneNumber('0332562001')
  ->setEmail01('kk_netshop@koyama-kyugu.com')->setEmail02('kk_netshop@koyama-kyugu.com')->setEmail03('kk_netshop@koyama-kyugu.com')->setEmail04('kk_netshop@koyama-kyugu.com')
  ->setDeliveryFreeAmount('15000')->setDeliveryFreeQuantity(null)->setOptionCustomerActivate(false);

// categories with the live ids (sort_no: EC-CUBE lists the highest first)
$cats = [];
$sort = 1000;
$mk = function ($id, $name, $Parent) use (&$cats, &$sort, $em, $setId, $Member, $now) {
    if (isset($cats[$id])) return $cats[$id];
    $c = new \Eccube\Entity\Category();
    $setId($c, $id);
    $c->setName($name)->setParent($Parent)->setHierarchy($Parent ? $Parent->getHierarchy() + 1 : 1)->setSortNo($sort--)->setCreator($Member)->setCreateDate($now)->setUpdateDate($now);
    if ($Parent) $Parent->addChild($c);
    $em->persist($c);
    return $cats[$id] = $c;
};
foreach ($data['categories'] as $top) {
    $T = $mk($top['id'], $top['name'], null);
    foreach ($top['children'] as $ch) $mk($ch['id'], $ch['name'], $T);
}
$em->flush();

// tags: the 送料 sizes the live pages show under the price
$tags = [];
$ts = 1;
foreach ($data['products'] as $p) foreach ($p['ship'] as $t) if (!isset($tags[$t])) {
    $tg = (new \Eccube\Entity\Tag())->setName($t)->setSortNo($ts++);
    $em->persist($tg);
    $tags[$t] = $tg;
}

$SaleType = $em->getRepository(\Eccube\Entity\Master\SaleType::class)->find(1);
$Show = $em->getRepository(\Eccube\Entity\Master\ProductStatus::class)->find(1);
$classNames = [];
$cn = 1;
$className = function ($name) use (&$classNames, &$cn, $em, $Member, $now) {
    if (!isset($classNames[$name])) {
        $c = (new \Eccube\Entity\ClassName())->setName($name)->setSortNo($cn++)->setCreator($Member)->setCreateDate($now)->setUpdateDate($now);
        $em->persist($c);
        $classNames[$name] = ['entity' => $c, 'cats' => [], 'sort' => 1];
    }
    return $classNames[$name];
};
$classCat = function ($axis, $name) use (&$classNames, $className, $em, $Member, $now) {
    $className($axis);
    if (!isset($classNames[$axis]['cats'][$name])) {
        $cc = (new \Eccube\Entity\ClassCategory())->setName($name)->setClassName($classNames[$axis]['entity'])->setSortNo($classNames[$axis]['sort']++)->setVisible(true)->setCreator($Member)->setCreateDate($now)->setUpdateDate($now);
        $em->persist($cc);
        $classNames[$axis]['cats'][$name] = $cc;
    }
    return $classNames[$axis]['cats'][$name];
};
$num = fn ($s) => (int) str_replace(',', '', (string) $s);

$made = 0;
foreach ($data['products'] as $p) {
    $P = new \Eccube\Entity\Product();
    $setId($P, $p['id']);
    $P->setName($p['name'])->setStatus($Show)->setDescriptionDetail($p['description'])->setDescriptionList($p['note'] ?: null)->setFreeArea($p['free'] ?: null)
      ->setSearchWord(null)->setCreator($Member)->setCreateDate($now)->setUpdateDate($now);
    $em->persist($P);
    // categories: the breadcrumb of the live page (a child with its parents, as the admin form saves them)
    $ids = array_values(array_unique(array_merge(array_column($p['crumbs'], 'id'), [$p['category']])));
    $prev = null;
    foreach ($p['crumbs'] as $c) { $prev = $cats[$c['id']] ?? $mk($c['id'], $c['name'], $prev); }
    foreach ($ids as $cid) {
        if (!isset($cats[$cid])) continue;
        $pc = (new \Eccube\Entity\ProductCategory())->setProduct($P)->setCategory($cats[$cid])->setProductId($p['id'])->setCategoryId($cid);
        $P->addProductCategory($pc);
        $em->persist($pc);
    }
    foreach ($p['ship'] as $t) {
        $pt = (new \Eccube\Entity\ProductTag())->setProduct($P)->setTag($tags[$t])->setCreator($Member)->setCreateDate($now);
        $P->addProductTag($pt);
        $em->persist($pt);
    }
    foreach ($p['files'] as $i => $f) {
        $pi = (new \Eccube\Entity\ProductImage())->setProduct($P)->setFileName($f)->setSortNo($i + 1)->setCreator($Member)->setCreateDate($now);
        $P->addProductImage($pi);
        $em->persist($pi);
    }
    // 規格: the combinations of the live page's eccube.classCategories (prices without tax, stock found or not)
    $rows = [];
    $c1names = [];
    foreach ($p['class1'] as $o) $c1names[$o['id']] = $o['name'];
    foreach (($p['classes'] ?: []) as $k1 => $set) {
        foreach ($set as $k2 => $v) {
            if (!isset($v['price02'])) continue;
            $rows[] = ['c1' => $c1names[$k1] ?? null, 'c2' => ($v['classcategory_id2'] ?? '') !== '' ? $v['name'] : null, 'price' => $num($v['price02']), 'stock' => !empty($v['stock_find'])];
        }
    }
    if (!$rows) $rows[] = ['c1' => null, 'c2' => null, 'price' => (int) round($num($p['price']) / 1.1), 'stock' => !$p['soldOut']];
    $hasClass = $rows[0]['c1'] !== null;
    $n = count($rows);
    foreach ($rows as $i => $r) {
        $PC = new \Eccube\Entity\ProductClass();
        $PC->setProduct($P)->setSaleType($SaleType)->setPrice02($r['price'])->setVisible(true)->setStockUnlimited(false)
           ->setCode(null)->setCreator($Member)->setCreateDate($now)->setUpdateDate($now)->setCurrencyCode('JPY');
        if ($hasClass) {
            $PC->setClassCategory1($classCat($p['classLabels'][0], $r['c1']));
            if ($r['c2'] !== null) $PC->setClassCategory2($classCat($p['classLabels'][1], $r['c2']));
        }
        $stock = !$r['stock'] ? 0 : (isset($data['stock'][$p['id']]) ? max(1, (int) ceil($data['stock'][$p['id']] / $n)) : 6);
        if (isset($data['stock'][$p['id']]) && $data['stock'][$p['id']] <= 3) $stock = $i === 0 ? $data['stock'][$p['id']] : 0;
        if (in_array($p['id'], $data['unlimited'], true) && $r['stock']) { $PC->setStockUnlimited(true); $stock = null; }
        $PC->setStock($stock);
        $PS = (new \Eccube\Entity\ProductStock())->setProductClass($PC)->setStock($stock)->setCreator($Member)->setCreateDate($now)->setUpdateDate($now);
        $PC->setProductStock($PS);
        $P->addProductClass($PC);
        $em->persist($PC);
        $em->persist($PS);
    }
    // the hidden "no class" row EC-CUBE keeps for products with 規格
    if ($hasClass) {
        $PC = new \Eccube\Entity\ProductClass();
        $PC->setProduct($P)->setSaleType($SaleType)->setPrice02($rows[0]['price'])->setVisible(false)->setStockUnlimited(false)->setStock(0)
           ->setCreator($Member)->setCreateDate($now)->setUpdateDate($now)->setCurrencyCode('JPY');
        $PS = (new \Eccube\Entity\ProductStock())->setProductClass($PC)->setStock(0)->setCreator($Member)->setCreateDate($now)->setUpdateDate($now);
        $PC->setProductStock($PS);
        $P->addProductClass($PC);
        $em->persist($PC);
        $em->persist($PS);
    }
    $made++;
}
$em->flush();

// deliveries: ヤマト運輸 (C サイズの料金) — the second sample delivery hidden; payments 郵便振替・銀行振込
$D = $em->getRepository(\Eccube\Entity\Delivery::class)->find(1);
$D->setName('ヤマト運輸')->setServiceName('宅配便')->setDescription('通常はヤマト運輸、一部大型商品は西濃運輸・佐川急便・福山通運でお届けします')->setConfirmUrl('https://toi.kuronekoyamato.co.jp/cgi-bin/tneko');
foreach ($em->getRepository(\Eccube\Entity\DeliveryFee::class)->findBy(['Delivery' => $D]) as $F) $F->setFee($data['fees'][$F->getPref()->getId()]);
$D2 = $em->getRepository(\Eccube\Entity\Delivery::class)->find(2);
if ($D2) $D2->setVisible(false);
foreach ($em->getRepository(\Eccube\Entity\Payment::class)->findAll() as $Pay) {
    $Pay->setVisible(in_array($Pay->getMethod(), ['郵便振替', '銀行振込'], true));
    $Pay->setCharge('0');
}

// a test customer (invented; the video's test order)
$C = new \Eccube\Entity\Customer();
$C->setName01('テスト')->setName02('太郎')->setKana01('テスト')->setKana02('タロウ')->setEmail('test-order@example.com')
  ->setPostalCode('1010041')->setPref($Pref(13))->setAddr01('千代田区神田須田町')->setAddr02('1-1-1 テストビル 3F')->setPhoneNumber('0300000000')
  ->setPassword(password_hash('koyama-test-2026', PASSWORD_BCRYPT))->setSalt(null)->setSecretKey(bin2hex(random_bytes(16)))
  ->setStatus($em->getRepository(\Eccube\Entity\Master\CustomerStatus::class)->find(2))->setPoint('0')->setCreateDate($now)->setUpdateDate($now);
$em->persist($C);
$em->flush();
return ['products' => $made, 'categories' => count($cats), 'tags' => count($tags), 'customer' => $C->getId()];
`;

async function download(dir) {
  const files = {};
  const dest = path.join(dir, 'html/upload/save_image');
  fs.mkdirSync(dest, { recursive: true });
  for (const p of SHOP.products) {
    files[p.id] = [];
    for (const src of p.images) {
      const name = path.basename(src);
      const f = path.join(dest, name);
      if (!fs.existsSync(f)) {
        const r = await fetch(LIVE + src);
        if (!r.ok) { log('image', src, r.status); continue; }
        fs.writeFileSync(f, Buffer.from(await r.arrayBuffer()));
      }
      files[p.id].push(name);
    }
  }
  return files;
}

/** the newest lines of EC-CUBE's own log (var/log/prod/*.log) that match */
function logLines(dir, re) {
  const d = path.join(dir, 'var/log/prod');
  if (!fs.existsSync(d)) return [];
  const files = fs.readdirSync(d).map((f) => path.join(d, f)).sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs);
  for (const f of files) {
    const lines = fs.readFileSync(f, 'utf8').split('\n').filter((l) => re.test(l));
    if (lines.length) return { file: path.relative(dir, f).replace(/\\/g, '/'), lines: lines.slice(-2) };
  }
  return [];
}

(async () => {
  const cap = await ECC.start({ id: ID, version: 4, fresh: true, site: 'http://localhost:8080', date: '2026-11-06', time: '10:24', shots: SHOTS });
  const { page } = cap;
  const D = cap.data;
  const stageFiles = async (stage) => {
    const base = { detail: readTheme('app/template/default/Product/detail.twig'), css: D.cssBase };
    await cap.files({
      ...SRC.files(stage),
      'app/template/default/Product/detail.twig': SRC.detail(base.detail, stage),
      'html/user_data/assets/css/customize.css': SRC.css(base.css, stage),
    });
  };
  // cache:clear, then the cache folder removed too: on this PHP (WebAssembly, Node's file system) cache:clear can leave the
  // compiled container of the web requests (Eccube_KernelProdContainer) behind, and the server would keep the old services
  /** an admin screen; signs in again when EC-CUBE sends the browser to the login form (after a cache clear) */
  const adminGo = async (rel, ready) => {
    await cap.go(rel, 'body');
    if (page.url().includes('/admin/login')) { log('signed out — login again'); await cap.login(); await cap.go(rel, 'body'); }
    await cap.settle(ready, 300000);
  };
  const cacheClear = async () => { await cap.console(['cache:clear', '--no-warmup']); fs.rmSync(path.join(cap.instance, 'var/cache/prod'), { recursive: true, force: true }); };
  /*
   * bin/console commands that need the database: run in the server's PHP with EC-CUBE booted (its .env loaded).
   * (cap.console passes APP_ENV, and EC-CUBE's bin/console then skips .env — DATABASE_URL would be empty.)
   */
  const dbConsole = async (input) => {
    const r = await cap.php(String.raw`
$app = new \Symfony\Bundle\FrameworkBundle\Console\Application($kernel);
$app->setAutoExit(false);
$out = new \Symfony\Component\Console\Output\BufferedOutput();
$code = $app->run(new \Symfony\Component\Console\Input\ArrayInput($data), $out);
return ['code' => $code, 'out' => $out->fetch()];`, input);
    log(`console ${JSON.stringify(input)} → ${r.code}`);
    if (r.code !== 0) throw new Error(r.out.slice(-2500));
    return r.out;
  };
  try {
    // ---------------------------------------------------------------- setup: the shop's public data, the theme
    // the theme's stylesheets / pictures (theme/html, same paths as on the live site)
    fs.cpSync(path.join(THEME, 'html'), path.join(cap.instance, 'html'), { recursive: true });
    const files = await download(cap.instance);
    const data = { categories: SHOP.categories, products: SHOP.products.map((p) => ({ ...p, files: files[p.id] })), fees: FEE_C, stock: STOCK, unlimited: UNLIMITED };
    log('setup', JSON.stringify(await cap.php(SETUP_PHP, data)));
    D.cssBase = cap.read('html/user_data/assets/css/customize.css');
    await cap.files({ 'app/template/default/default_frame.twig': readTheme('app/template/default/default_frame.twig') });
    await stageFiles(0);
    await cacheClear();

    // ---------------------------------------------------------------- stage 0
    await cap.go('/admin/login', '#login_id');
    await cap.capture('admin-login', { inputs: [['#login_id', 'login_id'], ['#password', 'password']] });
    await cap.login();
    await cap.capture('admin-home');
    await cap.go('/admin/product', '.c-contentsArea');
    await cap.capture('admin-products');
    await cap.go('/admin/setting/shop', '#shop_master_delivery_free_amount');
    await page.evaluate(() => { const e = document.querySelector('#shop_master_delivery_free_amount'); e.scrollIntoView({ block: 'center' }); });
    await cap.capture('admin-shop');
    await cap.go('/products/detail/7', '.detailWrap');
    await cap.capture('front-7');

    // ---------------------------------------------------------------- stage 1: the entity extended, no schema update
    await stageFiles(1);
    D.proxies = await cap.console(['eccube:generate:proxies']);
    await cacheClear();
    await cap.go('/products/detail/7', 'body');
    await cap.capture('front-error');
    D.errorLog = logLines(cap.instance, /made_to_order/);
    log('error log', JSON.stringify(D.errorLog).slice(0, 400));

    // ---------------------------------------------------------------- stage 2: schema update, the admin form
    D.schemaDump = await dbConsole({ command: 'doctrine:schema:update', '--dump-sql': true });
    D.schemaForce = await dbConsole({ command: 'doctrine:schema:update', '--force': true });
    await stageFiles(2);
    await cacheClear();
    await adminGo('/admin/product/product/7/edit', '#admin_product_lead_time');
    await page.evaluate(() => document.querySelector('#admin_product_lead_time').scrollIntoView({ block: 'center' }));
    await cap.capture('admin-product-7', { inputs: [['#admin_product_lead_time', 'lead_time']] });
    D.toggleHtml = await page.evaluate(() => { const e = document.querySelector('#admin_product_made_to_order'); const w = e && e.closest('div'); return w ? w.outerHTML : ''; });
    await page.evaluate(() => { const e = document.querySelector('#admin_product_made_to_order'); if (e && !e.checked) e.click(); });
    await cap.type('#admin_product_lead_time', '約1年');
    await Promise.all([page.waitForNavigation({ waitUntil: 'load' }), page.evaluate(() => document.querySelector('#form1').submit())]);
    await cap.settle('#admin_product_lead_time');
    await page.evaluate(() => document.querySelector('#admin_product_lead_time').scrollIntoView({ block: 'center' }));
    await cap.capture('admin-product-7-saved');
    D.saved = await cap.php("$p = $em->getRepository(\\Eccube\\Entity\\Product::class)->find(7); return [$p->isMadeToOrder(), $p->getLeadTime()];");
    // the other 受注生産 products as the live descriptions give their lead time
    D.others = await cap.php("$r = $em->getRepository(\\Eccube\\Entity\\Product::class); foreach ($data as $id => $t) { $r->find($id)->setMadeToOrder(true)->setLeadTime($t); } $em->flush(); return count($data);", { 10: '約2年', 319: '約8～9ヶ月' });

    // ---------------------------------------------------------------- stage 3: the badge
    await stageFiles(3);
    await cacheClear();
    for (const id of [7, 93, 139]) {
      await cap.go('/products/detail/' + id, '.detailWrap');
      await cap.capture('front-' + id + (id === 7 ? '-badge' : ''));
    }

    // ---------------------------------------------------------------- stage 4: the delivery fee rule
    await stageFiles(4);
    await cacheClear();
    const frontLogin = async () => {
      await cap.go('/mypage/login', '#login_email');
      await cap.type('#login_email', 'test-order@example.com');
      await cap.type('#login_pass', 'koyama-test-2026');
      await Promise.all([page.waitForNavigation({ waitUntil: 'load' }), page.evaluate(() => document.querySelector('#login_email').form.submit())]);
      await cap.settle('body');
    };
    /** a product into the cart through its real form: the first in-stock 規格 of the page's own eccube.classCategories */
    const addCart = async (id) => {
      await cap.go('/products/detail/' + id, '#form1');
      const pick = await page.evaluate(() => {
        const cc = (window.eccube && window.eccube.classCategories) || {};
        for (const [c1, set] of Object.entries(cc)) {
          if (c1.startsWith('__')) continue;
          for (const [k2, v] of Object.entries(set)) if (v && v.stock_find && v.product_class_id) return { c1, c2: v.classcategory_id2 || '', pc: v.product_class_id };
        }
        return null;
      });
      await page.evaluate((p) => {
        const set = (sel, val) => {
          const s = document.querySelector(sel);
          if (!s || val === '' || val == null) return;
          if (![...s.options].some((o) => o.value === String(val))) s.add(new Option(String(val), String(val)));
          s.value = String(val);
        };
        if (p) { set('#classcategory_id1', p.c1); set('#classcategory_id2', p.c2); const pc = document.querySelector('#ProductClass'); if (pc) pc.value = p.pc; }
      }, pick);
      log('add to cart', id, JSON.stringify(pick));
      await Promise.all([page.waitForNavigation({ waitUntil: 'load' }), page.evaluate(() => document.querySelector('#form1').submit())]);
      await cap.settle('body');
    };
    await frontLogin();
    await addCart(93);
    await addCart(139);
    await cap.go('/cart', '.ec-cartRole');
    await cap.capture('cart-1');
    await Promise.all([page.waitForNavigation({ waitUntil: 'load' }), page.evaluate(() => { location.href = document.querySelector('a.ec-blockBtn--action[href*="cart/buystep"]').href; })]);
    await cap.settle('#shopping-form');
    await cap.capture('shopping-1');
    D.fee1 = await page.evaluate(() => [...document.querySelectorAll('.ec-totalBox__spec')].map((e) => e.textContent.replace(/\s+/g, ' ').trim()));

    // ---------------------------------------------------------------- stage 5: the cart page's message, the order
    await stageFiles(5);
    await cacheClear();
    await frontLogin();
    await cap.go('/cart', '.ec-cartRole');
    await cap.capture('cart-2');
    await Promise.all([page.waitForNavigation({ waitUntil: 'load' }), page.evaluate(() => { location.href = document.querySelector('a.ec-blockBtn--action[href*="cart/buystep"]').href; })]);
    await cap.settle('#shopping-form');
    await cap.capture('shopping-2');
    await Promise.all([page.waitForNavigation({ waitUntil: 'load' }), page.evaluate(() => document.querySelector('#shopping-form button[type=submit].ec-blockBtn--action, #shopping-form .ec-totalRole button.ec-blockBtn--action').click())]);
    await cap.settle('body');
    await cap.capture('confirm');
    await Promise.all([page.waitForNavigation({ waitUntil: 'load' }), page.evaluate(() => document.querySelector('#shopping-form button.ec-blockBtn--action').click())]);
    await cap.settle('body');
    await cap.capture('complete');
    D.order = await cap.php("$o = $em->getRepository(\\Eccube\\Entity\\Order::class)->findOneBy([], ['id' => 'DESC']); return ['id' => $o->getId(), 'no' => $o->getOrderNo(), 'total' => (int) $o->getPaymentTotal(), 'fee' => (int) $o->getDeliveryFeeTotal(), 'subtotal' => (int) $o->getSubtotal()];");
    log('order', JSON.stringify(D.order));
    await adminGo('/admin/order', '.c-contentsArea');
    await cap.capture('admin-orders');
    await adminGo(`/admin/order/${D.order.id}/edit`, '.c-contentsArea');
    await cap.capture('admin-order-edit');
    D.badgeTwig = SRC.BADGE;
    await cap.finish();
    process.exit(0);   // PHP in WebAssembly keeps Node alive after finish()
  } catch (e) {
    console.error(e);
    try { log('failed at', page.url(), (await page.evaluate(() => document.body.innerText.slice(0, 300))).replace(/\s+/g, ' ')); } catch (e2) { /* gone */ }
    await cap.abort();
    process.exit(1);
  }
})();
