/*
 * The real EC-CUBE screens of the ec-l-meal-payment video, captured from EC-CUBE itself (tools/eccube/capture.js:
 * EC-CUBE 4.3.1-p1 on PHP 8.3 in WebAssembly, SQLite, in ../eccube-local/inst/ec-l-meal-payment, shown as the
 * developer's http://localhost:8080).
 *
 *   node tools/snapshots/ec-l-meal-payment/capture-ec.js [screenshot folder]      (15–25 min; one Chrome + one EC-CUBE)
 *   → node tools/webp.js ec-l-meal-payment
 *
 * Before: scrape-shop.js (shop-data.json and the pictures in ../eccube-local/data/ec-l-meal-payment/save_image).
 * The copy is made fresh, then:
 *   setup    EC-CUBE 4.3's bundled plugins removed (not the shop's); ライフミール's public data: shop info and 特定商取引法に
 *            基づく表記, the MENU categories with the live ids, 20 menu items (names, descriptions, メニュー詳細, 栄養価,
 *            pictures, 種類 as tags), the plans of /shopping/plan (7食 3,640 円 … 8回まとめ買い 20食 63,200 円) and the
 *            freezer rental (LM-FREEZER, 0 円), food at 8 % (商品別税率), 冷凍便 980 円 / 沖縄 1,480 円, GMO後払い;
 *            a test customer (invented)
 *   stage 0  支払方法一覧 (GMO後払い only), GMO後払い's edit form → 利用条件 〜55,000 円 saved for real
 *   stage 1  the plugin (js/payment-src.js) installed and enabled with bin/console → プラグイン一覧, 支払方法一覧,
 *            配送方法 (取扱支払方法 ticked and saved); a card order: cart → 注文手続き → card form → 確認 → 注文する
 *            → 購入エラー (the token is not posted from the confirm page) + EC-CUBE's own log lines
 *   stage 2  the confirm page's snippet → the same order completes → 受注一覧 (入金済み), 受注登録, メール通知 (the mail)
 *   stage 3  the freezer rule (PurchaseFlow) → 冷凍庫 + GMO後払い: the warning, then card: ordered; 8回まとめ買い 20食
 *            (63,200 円): GMO後払い not offered (利用条件); a GMO後払い order → 受注一覧 (入金済み / 新規受付)
 * Console outputs and log lines the video prints are kept in EC_SNAPSHOT.data.
 */
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '../../..');
const ECC = require(path.join(ROOT, 'tools/eccube/capture'));
const SRC = require(path.join(ROOT, 'public/videos/ec-l-meal-payment/js/payment-src.js'));
const ID = 'ec-l-meal-payment';
const SHOTS = process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : null;
const SHOP = JSON.parse(fs.readFileSync(path.join(__dirname, 'shop-data.json'), 'utf8'));
const IMG = path.resolve(ROOT, '../eccube-local/data/ec-l-meal-payment/save_image');
const log = (...a) => console.log(`[${new Date().toLocaleTimeString('sv-SE')}]`, ...a);
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

/** 税抜 price that gives the live 税込 price at 8 % rounded up (EC-CUBE's 切り上げ) */
const ex8 = (incl) => { for (let p = Math.floor(incl / 1.08) - 3; p <= incl; p++) if (p + Math.ceil(Math.round(p * 8) / 100 - 1e-9) === incl) return p; throw new Error('no price for ' + incl); };
const MEAL = SHOP.products.find((p) => p.id === 248) || SHOP.products[0];
const PLAN_TEXT = '送料はどのセットも共通で1回980円（沖縄県を除く）。お届けの間隔は1週間・2週間・3週間・4週間に1回から選べます。スキップや停止はマイページからいつでも可能です（次回お届け日の5日前まで）。';
const PLANS = [
  { id: 1, name: 'お得便 スタートプラン 7食', code: 'LM-P07', incl: 3640, cat: 6, text: '7食セット（1食あたり￥520・税込）。まずはお試しのスタートプラン。' },
  { id: 2, name: 'お得便 10食プラン', code: 'LM-P10', incl: 5100, cat: 6, text: '10食セット（1食あたり￥510・税込）。' },
  { id: 3, name: '【初回限定】お得便 10食プラン', code: 'LM-P10-FIRST', incl: 1900, cat: 6, text: '初回限定！10食セットが1食あたり￥190（税込）。2回目以降は10食プラン（1食あたり￥510）でお届けします。' },
  { id: 4, name: 'お得便 20食プラン', code: 'LM-P20', incl: 9800, cat: 6, text: '20食セット（1食あたり￥490・税込）。' },
  { id: 5, name: '8回まとめ買い 10食プラン', code: 'LM-M10', incl: 34188, cat: 6, text: '10食セット8回分のまとめ買い（1食あたり￥427・税込）。8回分のお届け後は自動更新です。' },
  { id: 6, name: '8回まとめ買い 20食プラン', code: 'LM-M20', incl: 63200, cat: 6, text: '20食セット8回分のまとめ買い（1食あたり￥395・税込）。8回分のお届け後は自動更新です。' },
  { id: 7, name: '保存用冷凍庫 無料レンタル', code: 'LM-FREEZER', incl: 0, cat: 7, freezer: true, text: 'ライフミールの定期購入（10食または20食セット・各月1回以上のお届け）をクレジットカード決済でお申込みのお客様に、保存用冷凍庫を無料でレンタルします（【ライフミール】冷凍庫無料レンタルキャンペーン）。' },
];
const TRADE_LAW = [
  ['販売業者', '株式会社シルバーライフ'],
  ['運営責任者', '増山　弘和'],
  ['住所', '〒160-0023 東京都新宿区西新宿4-32-4'],
  ['電話番号', '03-6747-5084<br>月～金（祝日を除く）10:00～12:00／13:00～17:00'],
  ['メールアドレス', 'lifemeal-support@magokoro-uketsuke.jp'],
  ['URL', 'https://l-meal.com/'],
  ['商品代金以外の必要料金', '配送料は下記のようになっております。<br>沖縄県以外: 980円<br>沖縄県: 1,480円'],
  ['注文方法', 'オンラインストア、もしくはお電話にて受け付けております。'],
  ['支払方法', 'クレジットカード、GMO後払い、Amazon Pay でのお支払いです。<br>クレジットカード決済：VISA、Mastercard、JCB、AMEX、Dinersが利用可能です。'],
  ['返品・交換について', '商品の性質上、お客様ご都合による返品・交換は原則としてお受けできません。'],
];

const SETUP_PHP = String.raw`
$conn = $em->getConnection();
$now = new \DateTime();
foreach (['dtb_product_category', 'dtb_product_tag', 'dtb_product_image', 'dtb_product_stock', 'dtb_customer_favorite_product', 'dtb_cart_item', 'dtb_cart',
          'dtb_product_class', 'dtb_product', 'dtb_class_category', 'dtb_class_name', 'dtb_category', 'dtb_tag', 'dtb_news', 'dtb_plugin'] as $t) {
    $conn->executeStatement("DELETE FROM $t");
}
$conn->executeStatement('DELETE FROM dtb_tax_rule WHERE product_class_id IS NOT NULL');
// the bundled plugins' own tables (their folders are removed: Doctrine could not read e.g. Api42's oauth2_* column types)
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

// shop info
$B = $em->getRepository(\Eccube\Entity\BaseInfo::class)->get();
$B->setShopName('ライフミール')->setCompanyName('株式会社シルバーライフ')->setPostalCode('1600023')->setPref($Pref(13))
  ->setAddr01('新宿区西新宿')->setAddr02('4-32-4')->setPhoneNumber('0367475084')
  ->setEmail01('lifemeal-support@magokoro-uketsuke.jp')->setEmail02('lifemeal-support@magokoro-uketsuke.jp')->setEmail03('lifemeal-support@magokoro-uketsuke.jp')->setEmail04('lifemeal-support@magokoro-uketsuke.jp')
  ->setDeliveryFreeAmount(null)->setDeliveryFreeQuantity(null)->setOptionCustomerActivate(false)->setOptionProductTaxRule(true);

// 特定商取引法に基づく表記 (EC-CUBE 4.3's own table)
$laws = $em->getRepository(\Eccube\Entity\TradeLaw::class)->findBy([], ['sortNo' => 'ASC']);
foreach ($laws as $i => $L) {
    $L->setName($data['law'][$i][0] ?? null)->setDescription($data['law'][$i][1] ?? null)->setDisplayOrderScreen(false);
}

// categories: the MENU's (live ids 1–5) and the plans
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

$tags = [];
$ts = 1;
$SaleType = $em->getRepository(\Eccube\Entity\Master\SaleType::class)->find(1);
$Show = $em->getRepository(\Eccube\Entity\Master\ProductStatus::class)->find(1);
$Ceil = $em->getRepository(\Eccube\Entity\Master\RoundingType::class)->find(3);
$made = 0;
foreach ($data['products'] as $p) {
    $P = new \Eccube\Entity\Product();
    $setId($P, $p['id']);
    $P->setName($p['name'])->setStatus($Show)->setDescriptionDetail($p['detail'])->setDescriptionList($p['list'] ?? null)
      ->setFreeArea($p['free'] ?? null)->setCreator($Member)->setCreateDate($now)->setUpdateDate($now);
    $em->persist($P);
    $pc = (new \Eccube\Entity\ProductCategory())->setProduct($P)->setCategory($cats[$p['cat']])->setProductId($p['id'])->setCategoryId($p['cat']);
    $P->addProductCategory($pc);
    $em->persist($pc);
    foreach (($p['tags'] ?? []) as $t) {
        if (!isset($tags[$t])) { $tags[$t] = (new \Eccube\Entity\Tag())->setName($t)->setSortNo($ts++); $em->persist($tags[$t]); }
        $pt = (new \Eccube\Entity\ProductTag())->setProduct($P)->setTag($tags[$t])->setCreator($Member)->setCreateDate($now);
        $P->addProductTag($pt);
        $em->persist($pt);
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
    if (empty($p['freezer'])) {
        // food: 軽減税率 8 % (商品別税率), the live prices are 8 % rounded up
        $T = new \Eccube\Entity\TaxRule();
        $T->setProductClass($PC);
        $T->setProduct($P);
        $T->setTaxRate('8');
        $T->setTaxAdjust('0');
        $T->setRoundingType($Ceil);
        $T->setApplyDate(new \DateTime('2019-10-01 00:00:00'));
        $T->setCreator($Member);
        $T->setCreateDate($now);
        $T->setUpdateDate($now);
        $PC->setTaxRule($T);
        $em->persist($T);
    }
    $made++;
}
$em->flush();

// delivery: 冷凍便 980 円 (沖縄 1,480 円); the second sample delivery removed
$D = $em->getRepository(\Eccube\Entity\Delivery::class)->find(1);
$D->setName('ライフミール 冷凍便')->setServiceName('冷凍便')->setDescription('冷凍でお届けします')->setConfirmUrl(null);
foreach ($em->getRepository(\Eccube\Entity\DeliveryFee::class)->findBy(['Delivery' => $D]) as $F) $F->setFee($F->getPref()->getId() === 47 ? '1480' : '980');
$D2 = $em->getRepository(\Eccube\Entity\Delivery::class)->find(2);
if ($D2) $D2->setVisible(false);
$em->flush();

// payments: GMO後払い only (the shop's card payment is what the video builds; Amazon Pay is out of its scope)
$conn->executeStatement('DELETE FROM dtb_payment_option WHERE payment_id <> 4 OR delivery_id <> 1');
$conn->executeStatement('DELETE FROM dtb_payment WHERE id <> 4');
$G = $em->getRepository(\Eccube\Entity\Payment::class)->find(4);
$G->setMethod('GMO後払い')->setCharge('330')->setRuleMin('0')->setRuleMax(null)->setVisible(true)->setSortNo(1);
$em->flush();

// a test customer (invented; the video's test orders)
$C = new \Eccube\Entity\Customer();
$C->setName01('テスト')->setName02('花子')->setKana01('テスト')->setKana02('ハナコ')->setEmail('hanako.test@example.com')
  ->setPostalCode('1600023')->setPref($Pref(13))->setAddr01('新宿区西新宿')->setAddr02('1-1-1 テストビル 3F')->setPhoneNumber('0300000000')
  ->setPassword(password_hash('lmeal-test-2026', PASSWORD_BCRYPT))->setSalt(null)->setSecretKey(bin2hex(random_bytes(16)))
  ->setStatus($em->getRepository(\Eccube\Entity\Master\CustomerStatus::class)->find(2))->setPoint('0')->setCreateDate($now)->setUpdateDate($now);
$em->persist($C);
$em->flush();
return ['products' => $made, 'categories' => count($cats), 'customer' => $C->getId(), 'payments' => $conn->fetchAllAssociative('SELECT id, payment_method, charge, rule_max FROM dtb_payment')];
`;

/** a bin/console command run in the server's PHP with EC-CUBE booted (its .env loaded) — $data: the command's input */
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

(async () => {
  const cap = await ECC.start({ id: ID, version: 4, fresh: true, site: 'http://localhost:8080', date: '2026-09-24', time: '10:20', shots: SHOTS });
  const { page } = cap;
  const D = cap.data;
  /*
   * bin/console cache:clear (EC-CUBE's own output for the video), then var/cache/prod removed for real: under PHP in
   * WebAssembly on Windows, cache:clear leaves the web's compiled container (Eccube_KernelProdContainer) in place, so a
   * new event subscription / PurchaseFlow validator would not be seen. The server is idle (restarted by cap.console).
   */
  const wipeCache = () => { try { fs.rmSync(path.join(cap.instance, 'var/cache/prod'), { recursive: true, force: true }); } catch (e) { log('cache dir:', e.message); } };
  const cacheClear = async () => { const out = await cap.console(['cache:clear', '--no-warmup']); wipeCache(); return out; };
  // bin/console commands that need the database run in the server's PHP with EC-CUBE booted (its .env loaded)
  const dbConsole = async (input) => {
    const r = await cap.php(String.raw`
$app = new \Symfony\Bundle\FrameworkBundle\Console\Application($kernel);
$app->setAutoExit(false);
$out = new \Symfony\Component\Console\Output\BufferedOutput();
$code = $app->run(new \Symfony\Component\Console\Input\ArrayInput($data), $out);
return ['code' => $code, 'out' => $out->fetch()];`, input);
    log(`console ${JSON.stringify(input)} → ${r.code}`, r.out.slice(-300));
    if (r.code !== 0) throw new Error(r.out.slice(-2500));
    return r.out;
  };
  /*
   * eccube:plugin:install / enable run for real in the server's PHP; at their end they start bin/console cache:clear as a
   * sub-process (PluginCommandTrait::clearCache), which PHP in WebAssembly cannot (proc_open): that cache:clear is run
   * with cap.console instead and its own output joined where the command prints it, then the command's success line.
   */
  const pluginConsole = async (command, ok) => {
    const r = await cap.php(CONSOLE_PHP, { command, '--code': 'LmealPayment' });
    const RUN = 'Run bin/console cache:clear --no-warmup...';
    const i = r.out.indexOf(RUN);
    log(`console ${command} → ${r.code}`, r.out.slice(0, 300));
    if (r.code !== 0 && !(i >= 0 && /Unable to launch a new process/.test(r.out))) throw new Error(r.out.slice(-2500));
    const cc = await cacheClear();
    return (i >= 0 ? r.out.slice(0, i + RUN.length) : r.out.replace(/\s+$/, '')) + '\n' + cc.replace(/^\n+/, '').replace(/\s+$/, '') + '\n\n [OK] ' + ok + '\n';
  };
  const adminLogin = async () => { await cap.go('/admin/login', 'body'); if (await page.$('#login_id')) await cap.login(); };
  const frontLogin = async () => {
    await cap.go('/mypage/login', 'body');
    if (!(await page.$('#login_email'))) return;
    await cap.type('#login_email', 'hanako.test@example.com');
    await cap.type('#login_pass', 'lmeal-test-2026');
    await nav(() => document.querySelector('#login_email').form.submit());
  };
  const nav = async (fn, ready = 'body', ...args) => { await Promise.all([page.waitForNavigation({ waitUntil: 'load', timeout: 180000 }), page.evaluate(fn, ...args)]); await cap.settle(ready); };
  const addCart = async (id) => {
    await cap.go('/products/detail/' + id, '#form1');
    await nav(() => document.querySelector('#form1').submit());
  };
  const toShopping = async () => {
    await cap.go('/cart', '.ec-cartRole');
    await nav(() => { location.href = document.querySelector('a.ec-blockBtn--action[href*="cart/buystep"]').href; }, '#shopping-form');
  };
  /** the 注文手続き page's payment radio (EC-CUBE submits the form to shopping_redirect_to on change) */
  const choosePayment = async (name) => {
    const idx = await page.evaluate((n) => {
      const rs = [...document.querySelectorAll('#shopping-form input[type=radio][name$="[Payment]"]')];
      const i = rs.findIndex((x) => (x.closest('div') || x.parentElement).textContent.includes(n));
      return i < 0 ? null : (rs[i].checked ? -1 : i);
    }, name);
    if (idx === null) throw new Error('no payment ' + name);
    if (idx === -1) return;
    await nav((i) => { const r = document.querySelectorAll('#shopping-form input[type=radio][name$="[Payment]"]')[i]; r.checked = true; $(r).trigger('change'); }, '#shopping-form', idx);
  };
  const paymentNames = () => page.evaluate(() => [...document.querySelectorAll('#shopping-form input[type=radio][name$="[Payment]"]')].map((x) => (x.closest('div') || x.parentElement).textContent.replace(/\s+/g, ' ').trim()));
  const CARD_INPUTS = [['#lmeal-card-number', 'card_number'], ['#lmeal-card-exp', 'card_exp'], ['#lmeal-card-cvc', 'card_cvc'], ['#lmeal-card-name', 'card_name']];
  const fillCard = async () => {
    const T = SRC.TEST_CARD;
    await cap.type('#lmeal-card-number', T.number);
    await cap.type('#lmeal-card-exp', T.exp);
    await cap.type('#lmeal-card-cvc', T.cvc);
    await cap.type('#lmeal-card-name', T.name);
  };
  const confirmBtn = () => nav(() => document.querySelector('#shopping-form button.ec-blockBtn--action').click());
  const lastOrder = () => cap.php("$o = $em->getRepository(\\Eccube\\Entity\\Order::class)->findOneBy([], ['id' => 'DESC']); return ['id' => $o->getId(), 'no' => $o->getOrderNo(), 'status' => $o->getOrderStatus()->getName(), 'total' => (int) $o->getPaymentTotal(), 'payment' => $o->getPaymentMethod(), 'note' => $o->getNote()];");
  try {
    // ---------------------------------------------------------------- setup: the shop's public data
    const dest = path.join(cap.instance, 'html/upload/save_image');
    fs.mkdirSync(dest, { recursive: true });
    for (const f of fs.readdirSync(IMG)) fs.copyFileSync(path.join(IMG, f), path.join(dest, f));
    const meals = SHOP.products.map((p) => {
      const n = p.nutrition || {};
      const nut = ['カロリー', 'たんぱく質', '糖質', '脂質', '食塩相当量'].filter((k) => n[k]).map((k) => `${k} ${n[k]}`).join(' / ');
      return { id: p.id, name: p.name, cat: p.category, price: ex8(520), tags: [p.typeName].filter(Boolean), files: p.files,
        detail: `${p.description}\n\n【メニュー詳細】\n${p.menu}\n\n【お弁当1個あたりの栄養価】\n${nut}`, list: p.description };
    });
    const plans = PLANS.map((p) => ({ id: p.id, name: p.name, cat: p.cat, code: p.code, price: p.freezer ? 0 : ex8(p.incl), freezer: !!p.freezer,
      files: [p.freezer ? 'lmeal_freezer.png' : MEAL.files[0]], detail: p.freezer ? p.text : `${p.text}\n${PLAN_TEXT}`, list: p.text }));
    const data = { categories: { ...SHOP.categories, 6: 'お得便プラン', 7: 'オプション' }, products: [...plans, ...meals], law: TRADE_LAW };
    // EC-CUBE 4.3's bundled plugins (registered, never installed — not the shop's): folders removed before EC-CUBE first
    // boots this copy (its container maps every plugin folder's entities), unregistered by SETUP_PHP
    for (const d of ['app/Plugin', 'html/plugin']) {
      const dd = path.join(cap.instance, d);
      if (fs.existsSync(dd)) for (const x of fs.readdirSync(dd)) fs.rmSync(path.join(dd, x), { recursive: true, force: true });
    }
    fs.rmSync(path.join(cap.instance, 'var/cache/prod'), { recursive: true, force: true });
    log('setup', JSON.stringify(await cap.php(SETUP_PHP, data)));
    await cacheClear();

    // ---------------------------------------------------------------- stage 0: 支払方法, GMO後払い's 利用条件
    await cap.login();
    await cap.go('/admin/setting/shop/payment', '.c-contentsArea');
    await cap.capture('pay-list-0');
    await cap.go('/admin/setting/shop/payment/4/edit', 'form');
    D.payForm = await page.evaluate(() => [...document.querySelectorAll('form input[type=text], form input[type=number]')].map((e) => e.id));
    log('payment form', D.payForm.join(' '));
    await cap.capture('pay-gmo', { inputs: [['#payment_register_charge', 'charge'], ['#payment_register_rule_min', 'rule_min'], ['#payment_register_rule_max', 'rule_max']] });
    await cap.type('#payment_register_charge', '0');
    await cap.type('#payment_register_rule_max', '55000');
    await nav(() => document.querySelector('#payment_register_charge').form.querySelector('button[type=submit]').click(), '.c-contentsArea');
    await cap.capture('pay-gmo-saved');
    D.gmo = await cap.php("$p = $em->getRepository(\\Eccube\\Entity\\Payment::class)->find(4); return [$p->getMethod(), $p->getCharge(), $p->getRuleMin(), $p->getRuleMax()];");
    log('gmo', JSON.stringify(D.gmo));

    // ---------------------------------------------------------------- stage 1: the plugin
    await cap.files(SRC.files(1));
    D.installOut = await pluginConsole('eccube:plugin:install', 'Installed.');
    D.enableOut = await pluginConsole('eccube:plugin:enable', 'Plugin Enabled.');
    D.plugin = await cap.php("return $em->getConnection()->fetchAllAssociative('SELECT code, name, version, enabled, initialized FROM dtb_plugin');");
    log('plugin', JSON.stringify(D.plugin));
    if (!D.plugin.some((p) => p.code === 'LmealPayment' && +p.enabled === 1)) throw new Error('LmealPayment is not enabled');
    await adminLogin();
    await cap.go('/admin/store/plugin', '.c-contentsArea');
    await cap.capture('plugins');
    await cap.go('/admin/setting/shop/payment', '.c-contentsArea');
    await cap.capture('pay-list-1');
    D.cardPayment = await cap.php("$p = $em->getRepository(\\Eccube\\Entity\\Payment::class)->findOneBy(['method' => 'クレジットカード決済']); return ['id' => $p->getId(), 'sort' => $p->getSortNo(), 'class' => $p->getMethodClass()];");
    log('card payment', JSON.stringify(D.cardPayment));
    await cap.go('/admin/setting/shop/delivery/1/edit', 'form');
    D.delivPayments = await page.evaluate(() => [...document.querySelectorAll('input[type=checkbox][name*="payments"]')].map((e) => [e.id, e.value, e.checked, (e.closest('label') || e.parentElement).textContent.trim()]));
    log('delivery payments', JSON.stringify(D.delivPayments));
    await page.evaluate(() => { const e = document.querySelector('input[type=checkbox][name*="payments"]'); if (e) e.scrollIntoView({ block: 'center' }); });
    await cap.capture('deliv');
    await page.evaluate((id) => { const e = [...document.querySelectorAll('input[type=checkbox][name*="payments"]')].find((x) => x.value === String(id)); if (e && !e.checked) e.click(); }, D.cardPayment.id);
    await nav(() => { const c = document.querySelector('input[type=checkbox][name*="payments"]'); c.form.submit(); }, '.c-contentsArea');
    await page.evaluate(() => { const e = document.querySelector('input[type=checkbox][name*="payments"]'); if (e) e.scrollIntoView({ block: 'center' }); });
    await cap.capture('deliv-saved');

    // the front: a card order (stage 1 fails at checkout)
    await frontLogin();
    await cap.go('/products/detail/2', '#form1');
    await cap.capture('product-2');
    await nav(() => document.querySelector('#form1').submit());
    await cap.go('/cart', '.ec-cartRole');
    await cap.capture('cart-1');
    await toShopping();
    D.payNames1 = await paymentNames();
    log('payments on 注文手続き', JSON.stringify(D.payNames1));
    await choosePayment('GMO後払い');
    await cap.capture('shop-1');
    await choosePayment('クレジットカード決済');
    D.tokenField = await page.evaluate(() => { const t = document.querySelector('[id$="lmeal_card_token"]'); return t ? [t.id, t.name] : null; });
    log('token field', JSON.stringify(D.tokenField));
    await page.evaluate(() => { const e = document.querySelector('#lmeal-card'); if (e) e.scrollIntoView({ block: 'center' }); });
    await cap.capture('shop-card', { inputs: CARD_INPUTS });
    await fillCard();
    await confirmBtn();
    await cap.capture('confirm-1');
    await confirmBtn();
    await cap.capture('error-1');
    D.errorLog = logLines(cap.instance, /カード決済|PaymentMethod::checkoutのエラー/, 4);
    log('log', JSON.stringify(D.errorLog).slice(0, 600));

    // ---------------------------------------------------------------- stage 2: the token on the confirm page
    await cap.files(SRC.files(2));
    await cacheClear();
    await frontLogin();
    await toShopping();
    await choosePayment('クレジットカード決済');
    await fillCard();
    await confirmBtn();
    await cap.capture('confirm-2');
    D.confirmToken = await page.evaluate(() => { const t = document.querySelector('[id$="lmeal_card_token"]'); return t ? [t.getAttribute('form'), t.value.replace(/_[0-9a-f]{16}$/, '_…')] : null; });
    await confirmBtn();
    await cap.capture('complete');
    D.order1 = await lastOrder();
    log('order 1', JSON.stringify(D.order1));
    D.okLog = logLines(cap.instance, /カード決済/, 2);
    await adminLogin();
    await cap.go('/admin/order', '.c-contentsArea');
    await cap.capture('orders-1');
    await cap.go(`/admin/order/${D.order1.id}/edit`, '.c-contentsArea');
    await cap.capture('order-edit');
    await page.evaluate(() => { const e = document.querySelector('#order_note, textarea[name*="[note]"]'); if (e) e.scrollIntoView({ block: 'center' }); });
    await cap.capture('order-edit-note');
    try {
      await cap.go(`/admin/order/${D.order1.id}/mail`, 'form');
      const sel = await page.evaluate(() => { const s = document.querySelector('select[name*="template"]'); return s ? s.id : null; });
      if (sel) {
        await page.evaluate((id) => { const s = document.getElementById(id); const o = [...s.options].find((x) => /注文受付/.test(x.textContent)); s.value = o.value; $(s).trigger('change'); }, sel);
        await wait(4000);
        await cap.capture('order-mail');
        await nav(() => { const b = [...document.querySelectorAll('button')].find((x) => /確認/.test(x.textContent)); b.click(); }, '.c-contentsArea');
        await cap.capture('order-mail-confirm');
      }
    } catch (e) { log('mail preview skipped:', e.message.slice(0, 200)); }

    // ---------------------------------------------------------------- stage 3: 冷凍庫レンタル → card only; 利用条件
    await cap.files(SRC.files(3));
    await cacheClear();
    await frontLogin();
    await addCart(2);
    await addCart(7);
    await cap.go('/cart', '.ec-cartRole');
    await cap.capture('cart-freezer');
    await toShopping();
    await choosePayment('GMO後払い');
    await cap.capture('shop-freezer-warn');
    D.warn = await page.evaluate(() => [...document.querySelectorAll('.ec-alert-warning, .ec-alert-danger')].map((e) => e.textContent.replace(/\s+/g, ' ').trim()));
    log('warning', JSON.stringify(D.warn));
    await choosePayment('クレジットカード決済');
    await page.evaluate(() => { const e = document.querySelector('#lmeal-card'); if (e) e.scrollIntoView({ block: 'center' }); });
    await cap.capture('shop-freezer-card');
    await fillCard();
    await confirmBtn();
    await confirmBtn();
    await cap.capture('complete-freezer');
    D.order2 = await lastOrder();
    log('order 2', JSON.stringify(D.order2));
    // 8回まとめ買い 20食 (63,200 円): over GMO後払い's 55,000 円
    await addCart(6);
    await toShopping();
    D.payNamesLimit = await paymentNames();
    log('payments for 63,200 円', JSON.stringify(D.payNamesLimit));
    await page.evaluate(() => { const e = document.querySelector('#shopping-form .ec-orderPayment'); if (e) e.scrollIntoView({ block: 'center' }); });
    await cap.capture('shop-limit');
    await cap.go('/cart', '.ec-cartRole');
    for (let k = 0; k < 6 && (await page.$('.ec-cartRow__delColumn a')); k++) await nav(() => document.querySelector('.ec-cartRow__delColumn a').click(), 'body');
    D.cartLeft = await page.evaluate(() => document.querySelectorAll('.ec-cartRow__delColumn a').length);
    log('cart rows left', D.cartLeft);
    // a GMO後払い order (20食プラン 9,800 円)
    await addCart(4);
    await toShopping();
    await choosePayment('GMO後払い');
    await confirmBtn();
    await confirmBtn();
    D.order3 = await lastOrder();
    log('order 3', JSON.stringify(D.order3));
    await adminLogin();
    await cap.go('/admin/order', '.c-contentsArea');
    await cap.capture('orders-2');
    D.src = { files: Object.keys(SRC.files(3)) };
    await cap.finish();
    process.exit(0);   // the PHP runtime keeps handles open after finish()
  } catch (e) {
    console.error(e);
    await cap.abort();
    process.exit(1);
  }
})();
