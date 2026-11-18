/*
 * The real EC-CUBE screens and outputs of the ec-chokunavi-maintenance video (サーバー・セキュリティ・保守), from EC-CUBE itself
 * (tools/eccube/capture.js: EC-CUBE 4.3.1-p1 on PHP 8.3 in WebAssembly, SQLite, in ../eccube-local/inst/ec-chokunavi-maintenance,
 * shown as the staging copy http://localhost:8080).
 *
 *   node tools/snapshots/ec-chokunavi-maintenance/capture-ec.js [screenshot folder]      (30–40 min; one Chrome + one EC-CUBE)
 *   → node tools/webp.js ec-chokunavi-maintenance
 *
 * Before: scrape-shop.js (shop-data.json, pictures in ../eccube-local/data/ec-chokunavi-maintenance/save_image).
 * The copy is made fresh, then:
 *   setup    the staging copy starts at EC-CUBE 4.3.1: the files the 4.3.1-p1 security release changed (GitHub compare 4.3.1...4.3.1-p1:
 *            Constant.php, TwoFactorAuthController.php, TwoFactorAuthListener.php, TwoFactorAuthService.php, package(-lock).json) are put
 *            back to their 4.3.1 versions (raw.githubusercontent.com/…/refs/tags/4.3.1 — a branch is also named 4.3.1 and has the fix). 販促品直ナビ's public data (shop info, the 15 top
 *            categories with the live ids, 18 products with the live ids, names, codes, descriptions, specs, variants and unit prices,
 *            one picture each), 送料 1,000 円・30,000 円以上無料, 銀行振込. No customers / orders (staging keeps no personal data).
 *            TRUSTED_PROXIES=127.0.0.1 (production sits behind a load balancer). Securitychecker42's receiver → a local stub (the check
 *            result is not sent to ec-cube.net). Login attempts from documentation addresses (X-Forwarded-For) for ログイン履歴, their
 *            dates moved into the past week.
 *   ch2      ログイン → ホーム → システム情報 (4.3.1) → プラグイン一覧 → ログイン履歴 → ログ表示 → 商品一覧
 *   ch3      セキュリティ管理 (警告：管理画面URL が admin) → Securitychecker42 installed + enabled (PluginService) → セキュリティチェック → 結果
 *   ch4      メンバー管理 → 新規登録 (ops01・2段階認証) → admin の 2段階認証 ON → セキュリティ管理 (管理画面URL・許可IP) → the new login,
 *            403 from another address, /admin 404, the lockout (5 failures), admin's 2FA setup (QR → code) → ホーム
 *   ch6      backup (VACUUM INTO, tar), the staged loss, the restore, counts, 商品一覧・商品一覧 (front) after the restore
 *   ch7      2FA bypass on 4.3.1 (/two_factor_auth/set without the code), メンテナンス管理 → the 503 page, the 4.3.1-p1 files,
 *            cache:clear, システム情報 (4.3.1-p1), the bypass closed, メンテナンス off → the shop again
 * Outputs (bin/console, EC-CUBE's logs, HTTP statuses, the backups) are kept in EC_SNAPSHOT.data.
 */
const fs = require('fs');
const path = require('path');
const http = require('http');
const crypto = require('crypto');
const { spawnSync } = require('child_process');
const ROOT = path.resolve(__dirname, '../../..');
const ECC = require(path.join(ROOT, 'tools/eccube/capture'));
const ID = 'ec-chokunavi-maintenance';
const SHOTS = process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : null;
const SHOP = JSON.parse(fs.readFileSync(path.join(__dirname, 'shop-data.json'), 'utf8'));
const DATA_DIR = path.resolve(ROOT, '../eccube-local/data', ID);
const IMG = path.join(DATA_DIR, 'save_image');
const BASE = path.resolve(ROOT, '../eccube-local/inst/base');
const log = (...a) => console.log(`[${new Date().toLocaleTimeString('sv-SE')}]`, ...a);
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

const ROUTE = 'mng_7f3k2q';                         // the new admin route (EC-CUBE allows w+ only)                          // the new admin route
const OFFICE = '203.0.113.24';                       // the office's fixed address (documentation range)
const OTHER = '198.51.100.23';                       // somebody else (documentation range)
const STAFF = { id: 'ops01', pass: 'Navi-ops-2026-1117' };
const PATCHED = ['src/Eccube/Common/Constant.php', 'src/Eccube/Controller/Admin/Setting/System/TwoFactorAuthController.php',
  'src/Eccube/EventListener/TwoFactorAuthListener.php', 'src/Eccube/Service/TwoFactorAuthService.php'];

/* ---------------------------------------------------------------- TOTP (RFC 6238, what an authenticator app shows) */
function b32(s) {
  const A = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let bits = '';
  for (const ch of String(s).replace(/=+$/, '').toUpperCase()) { const v = A.indexOf(ch); if (v >= 0) bits += v.toString(2).padStart(5, '0'); }
  const out = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) out.push(parseInt(bits.slice(i, i + 8), 2));
  return Buffer.from(out);
}
function totp(secret) {
  const b = Buffer.alloc(8);
  b.writeBigUInt64BE(BigInt(Math.floor(Date.now() / 30000)));
  const h = crypto.createHmac('sha1', b32(secret)).update(b).digest();
  const o = h[h.length - 1] & 15;
  return String((h.readUInt32BE(o) & 0x7fffffff) % 1000000).padStart(6, '0');
}

const SETUP_PHP = String.raw`
$conn = $em->getConnection();
$now = new \DateTime();
foreach (['dtb_product_category', 'dtb_product_tag', 'dtb_product_image', 'dtb_product_stock', 'dtb_customer_favorite_product', 'dtb_cart_item', 'dtb_cart',
          'dtb_product_class', 'dtb_product', 'dtb_class_category', 'dtb_class_name', 'dtb_category', 'dtb_tag', 'dtb_news', 'dtb_login_history'] as $t) {
    $conn->executeStatement("DELETE FROM $t");
}
$conn->executeStatement('DELETE FROM dtb_tax_rule WHERE product_class_id IS NOT NULL');
foreach ($conn->fetchFirstColumn("SELECT name FROM sqlite_master WHERE type = 'table' AND name LIKE 'plg_securitychecker%'") as $t) $conn->executeStatement("DROP TABLE $t");
foreach ([\Eccube\Entity\Category::class, \Eccube\Entity\Product::class] as $cls) {
    $md = $em->getClassMetadata($cls);
    $md->setIdGeneratorType(\Doctrine\ORM\Mapping\ClassMetadata::GENERATOR_TYPE_NONE);
    $md->setIdGenerator(new \Doctrine\ORM\Id\AssignedGenerator());
}
$setId = function ($obj, $id) { $r = new \ReflectionProperty(get_class($obj), 'id'); $r->setAccessible(true); $r->setValue($obj, $id); };
$Member = $em->getRepository(\Eccube\Entity\Member::class)->find(1);
$Pref = fn ($id) => $em->getRepository(\Eccube\Entity\Master\Pref::class)->find($id);

$B = $em->getRepository(\Eccube\Entity\BaseInfo::class)->get();
$B->setShopName('販促品直ナビ')->setShopNameEng('CHOKUNAVI')->setCompanyName('敷島産業株式会社')->setPostalCode('1030013')->setPref($Pref(13))
  ->setAddr01('中央区日本橋人形町')->setAddr02('2丁目35-12 人形町アムフラット 3F')->setPhoneNumber('0368108775')
  ->setEmail01('staging@example.com')->setEmail02('staging@example.com')->setEmail03('staging@example.com')->setEmail04('staging@example.com')
  ->setDeliveryFreeAmount('30000')->setDeliveryFreeQuantity(null)->setOptionProductDeliveryFee(false)->setOptionCustomerActivate(true);

$cats = [];
$sort = 1000;
foreach ($data['categories'] as $c0) {
    $c = new \Eccube\Entity\Category();
    $setId($c, (int) $c0['id']);
    $c->setName($c0['name'])->setHierarchy(1)->setSortNo($sort--)->setCreator($Member)->setCreateDate($now)->setUpdateDate($now);
    $em->persist($c);
    $cats[(int) $c0['id']] = $c;
}
$em->flush();

$CN = (new \Eccube\Entity\ClassName())->setName('カラー・仕様')->setSortNo(1)->setCreator($Member)->setCreateDate($now)->setUpdateDate($now);
$em->persist($CN);
$ccs = [];
$ccSort = 1;
$SaleType = $em->getRepository(\Eccube\Entity\Master\SaleType::class)->find(1);
$Show = $em->getRepository(\Eccube\Entity\Master\ProductStatus::class)->find(1);
$made = 0;
foreach ($data['products'] as $p) {
    $P = new \Eccube\Entity\Product();
    $setId($P, $p['id']);
    $P->setName($p['name'])->setStatus($Show)->setDescriptionDetail($p['detail'])->setDescriptionList($p['list'])->setSearchWord($p['code'])
      ->setCreator($Member)->setCreateDate($now)->setUpdateDate($now);
    $em->persist($P);
    $pc = (new \Eccube\Entity\ProductCategory())->setProduct($P)->setCategory($cats[$p['cat']])->setProductId($p['id'])->setCategoryId($p['cat']);
    $P->addProductCategory($pc);
    $em->persist($pc);
    if ($p['file']) {
        $pi = (new \Eccube\Entity\ProductImage())->setProduct($P)->setFileName($p['file'])->setSortNo(1)->setCreator($Member)->setCreateDate($now);
        $P->addProductImage($pi);
        $em->persist($pi);
    }
    $rows = count($p['classes']) > 1 ? array_merge([null], $p['classes']) : [$p['classes'][0] + ['single' => true]];
    foreach ($rows as $i => $v) {
        $PC = new \Eccube\Entity\ProductClass();
        $PC->setProduct($P)->setSaleType($SaleType)->setStockUnlimited(true)->setStock(null)->setCreator($Member)->setCreateDate($now)->setUpdateDate($now)
           ->setCurrencyCode('JPY')->setCode($p['code'])->setDeliveryFee(null);
        if ($v === null) {
            $PC->setVisible(false)->setPrice02($p['classes'][0]['price']);
        } else {
            $PC->setVisible(true)->setPrice02($v['price'])->setSaleLimit(null);
            if (empty($v['single'])) {
                $nm = $v['name'];
                if (!isset($ccs[$nm])) {
                    $ccs[$nm] = (new \Eccube\Entity\ClassCategory())->setName($nm)->setClassName($CN)->setSortNo($ccSort++)->setVisible(true)->setCreator($Member)->setCreateDate($now)->setUpdateDate($now);
                    $em->persist($ccs[$nm]);
                }
                $PC->setClassCategory1($ccs[$nm]);
            }
        }
        $PS = (new \Eccube\Entity\ProductStock())->setProductClass($PC)->setStock(null)->setCreator($Member)->setCreateDate($now)->setUpdateDate($now);
        $PC->setProductStock($PS);
        $P->addProductClass($PC);
        $em->persist($PC);
        $em->persist($PS);
    }
    $made++;
}
$em->flush();

// 配送：宅配便 1,000 円（沖縄 4,000 円）、30,000 円以上で無料（BaseInfo）
$D = $em->getRepository(\Eccube\Entity\Delivery::class)->find(1);
$D->setName('宅配便')->setServiceName('宅配便')->setDescription('メーカーから発送します')->setConfirmUrl(null);
foreach ($em->getRepository(\Eccube\Entity\DeliveryFee::class)->findBy(['Delivery' => $D]) as $F) $F->setFee($F->getPref()->getId() == 47 ? '4000' : '1000');
$D2 = $em->getRepository(\Eccube\Entity\Delivery::class)->find(2);
if ($D2) $D2->setVisible(false);
$em->flush();
$conn->executeStatement('DELETE FROM dtb_payment_option WHERE payment_id <> 3 OR delivery_id <> 1');
$conn->executeStatement('DELETE FROM dtb_payment WHERE id <> 3');
$G = $em->getRepository(\Eccube\Entity\Payment::class)->find(3);
$G->setMethod('銀行振込（前払い）')->setCharge('0')->setRuleMin('0')->setRuleMax(null)->setVisible(true)->setSortNo(1);
$em->flush();
return ['products' => $made, 'categories' => count($cats), 'classCategories' => count($ccs)];
`;

/* Securitychecker42's install + enable, as eccube:plugin:enable does them, without the Owners Store dependency query (exec()) */
const INSTALL_PHP = String.raw`
$app = new \Symfony\Bundle\FrameworkBundle\Console\Application($kernel);
$cmd = $app->find('eccube:plugin:enable');
$ps = (new \ReflectionProperty($cmd, 'pluginService'))->getValue($cmd);
$repo = (new \ReflectionProperty($cmd, 'pluginRepository'))->getValue($cmd);
$pc = (new \ReflectionProperty(\Eccube\Service\PluginService::class, 'pluginContext'))->getValue($ps);
$pc->setCode($data);
$pc->setInstall();
$dir = $ps->calcPluginDir($data);
$ps->checkPluginArchiveContent($dir);
$config = $ps->readConfig($dir);
$ps->copyAssets($data);
$ps->postInstall($config, $config['source']);
$em->clear();
$ps->enable($repo->findByCode($data));
return $em->getConnection()->fetchAllAssociative("SELECT code, name, version, enabled, initialized FROM dtb_plugin WHERE code = ?", [$data]);`;

const CONSOLE_PHP = String.raw`
$app = new \Symfony\Bundle\FrameworkBundle\Console\Application($kernel);
$app->setAutoExit(false);
$out = new \Symfony\Component\Console\Output\BufferedOutput();
try { $code = $app->run(new \Symfony\Component\Console\Input\ArrayInput($data), $out); } catch (\Throwable $e) { $code = 1; $err = get_class($e) . ': ' . $e->getMessage(); }
return ['code' => $code, 'out' => $out->fetch(), 'err' => $err ?? null];`;

/** the newest lines of each EC-CUBE log (var/log/prod/*.log) */
function logTails(dir, n = 12) {
  const d = path.join(dir, 'var/log/prod');
  if (!fs.existsSync(d)) return {};
  const out = {};
  for (const f of fs.readdirSync(d).filter((x) => x.endsWith('.log'))) {
    const lines = fs.readFileSync(path.join(d, f), 'utf8').split('\n').filter((l) => l.trim());
    out[f] = { size: fs.statSync(path.join(d, f)).size, count: lines.length, tail: lines.slice(-n) };
  }
  return out;
}

(async () => {
  // ---------------------------------------------------------------- the 4.3.1 files (before the security release)
  const OLD = path.join(DATA_DIR, '431');
  fs.mkdirSync(OLD, { recursive: true });
  for (const f of PATCHED) {
    const dst = path.join(OLD, f);
    if (fs.existsSync(dst)) continue;
    const r = await fetch(`https://raw.githubusercontent.com/EC-CUBE/ec-cube/refs/tags/4.3.1/${f}`);
    if (!r.ok) throw new Error(`4.3.1 ${f}: HTTP ${r.status}`);
    fs.mkdirSync(path.dirname(dst), { recursive: true });
    fs.writeFileSync(dst, Buffer.from(await r.arrayBuffer()));
  }
  // the stub for Securitychecker42's result receiver (nothing leaves this machine)
  const received = [];
  const stub = http.createServer((req, res) => { let b = ''; req.on('data', (c) => (b += c)); req.on('end', () => { received.push({ url: req.url, bytes: b.length }); res.end('OK'); }); });
  await new Promise((r) => stub.listen(0, '127.0.0.1', r));
  const STUB = `http://127.0.0.1:${stub.address().port}/info/security/receiver.php`;

  const cap = await ECC.start({ id: ID, version: 4, fresh: true, site: 'http://localhost:8080', date: '2026-11-17', time: '10:16', shots: SHOTS });
  const { page } = cap;
  const D = cap.data;
  const I = (rel) => path.join(cap.instance, rel);
  let ADM = '/admin';
  const show = (s) => String(s || '').replace(new RegExp(cap.origin.replace(/[.:/]/g, '\\$&'), 'g'), 'http://localhost:8080').replace(/127\.0\.0\.1:\d{4,5}/g, 'localhost:8080')
    .replace(/\/srv\/eccube/g, '/var/www/html').replace(/\r/g, '');
  const wipeCache = () => { try { fs.rmSync(I('var/cache/prod'), { recursive: true, force: true }); } catch (e) { log('cache dir:', e.message); } };
  const cacheClear = async () => { const out = await cap.console(['cache:clear', '--no-warmup']); wipeCache(); return out; };
  const dbConsole = async (input) => { const r = await cap.php(CONSOLE_PHP, input); log(`console ${JSON.stringify(input)} → ${r.code}`, (r.out || '').slice(-300), r.err || ''); return r; };
  const nav = async (fn, ready = 'body', ...args) => { await Promise.all([page.waitForNavigation({ waitUntil: 'load', timeout: 600000 }), page.evaluate(fn, ...args)]); await cap.settle(ready); };
  const url = () => page.url().replace(cap.origin, '');
  const version = () => cap.php('return \\Eccube\\Common\\Constant::VERSION;');
  const xff = async (ip) => { await page.setExtraHTTPHeaders(ip ? { 'X-Forwarded-For': ip } : {}); };
  /** the 2FA page draws its QR code into a canvas (not kept by the capture): the same picture as an <img> */
  const qrToImg = () => page.evaluate(() => document.querySelectorAll('#qrcode canvas').forEach((c) => { const i = document.createElement('img'); i.src = c.toDataURL('image/png'); i.width = c.width; i.height = c.height; i.style.cssText = c.style.cssText; c.replaceWith(i); }));
  const bullets = (n = 12) => page.evaluate((k) => document.querySelectorAll('input[type=password]').forEach((i) => { i.type = 'text'; i.value = '●'.repeat(k); i.style.letterSpacing = '1px'; }), n);
  async function submitLogin(user, pass) {
    await cap.go(ADM + '/login', 'body');
    if (!(await page.$('#login_id'))) return url();
    await cap.type('#login_id', user);
    await cap.type('#password', pass);
    // a request can hang in PHP in WebAssembly (seen once after the 403 page): then EC-CUBE is restarted and the login sent again
    for (let k = 0; ; k++) {
      let timer;
      const r = await Promise.race([
        Promise.all([page.waitForNavigation({ waitUntil: 'load', timeout: 600000 }), page.click('button[type=submit]')]).then(() => 'ok', (e) => 'error ' + e.message),
        new Promise((res) => { timer = setTimeout(() => res('timeout'), 150000); }),
      ]);
      clearTimeout(timer);
      if (r === 'ok') break;
      if (k === 2) throw new Error('login hung: ' + r);
      log('  login hung (' + r + ') → EC-CUBE restarted');
      await page.goto('about:blank').catch(() => {});
      await cacheClear();
      await cap.go(ADM + '/login', 'body');
      if (!(await page.$('#login_id'))) return url();
      await cap.type('#login_id', user);
      await cap.type('#password', pass);
    }
    await wait(700);
    return url();
  }
  /** the 2FA code screen (auth or set): the code an authenticator app would show now */
  async function passTfa() {
    const u = url();
    if (!/two_factor_auth\/(auth|set)/.test(u)) return u;
    for (let k = 0; k < 4; k++) {
      // not in the last seconds of a 30-second step (the code would change on the way)
      while (Date.now() % 30000 > 26000) await wait(500);
      const keyEl = await page.$('input[type=hidden][id$="auth_key"]');
      const key = keyEl ? await page.evaluate((e) => e.value, keyEl) : D.tfaKey;
      // the code put into the box directly (typing into it after a capture lost the text once)
      const sent = await page.evaluate((code) => {
        const i = document.querySelector('input[id$="device_token"]');
        i.value = code;
        const k = document.querySelector('input[type=hidden][id$="auth_key"]');
        return { token: i.value, key: k ? k.value.length : null, form: !!i.form };
      }, totp(key));
      log('  2FA sending', JSON.stringify(sent));
      await nav(() => document.querySelector('input[id$="device_token"]').form.submit());
      log('2FA', u, '→', url(), keyEl ? 'set' : 'auth');
      if (!/two_factor_auth\/(auth|set)/.test(url())) return url();
      log('  2FA failed:', (await page.evaluate(() => document.body.innerText.replace(/\s+/g, ' ').slice(0, 300))));
      await cap.go(url().replace(/\?.*$/, ''), 'body');
    }
    throw new Error('2FA did not pass');
  }
  const adminLogin = async () => { const u = await submitLogin('admin', 'password'); if (/two_factor_auth/.test(u)) await passTfa(); return url(); };
  const status = async (p, ip) => { const r = await fetch(cap.origin + p, { headers: ip ? { 'X-Forwarded-For': ip } : {}, redirect: 'manual' }); await r.arrayBuffer(); return { status: r.status, location: r.headers.get('location') ? show(r.headers.get('location')) : null }; };

  try {
    // ---------------------------------------------------------------- setup
    for (const f of PATCHED) fs.copyFileSync(path.join(OLD, f), I(f));
    for (const f of ['package.json', 'package-lock.json']) fs.writeFileSync(I(f), fs.readFileSync(I(f), 'utf8').replace(/("version": )"4\.3\.1-p1"/g, '$1"4.3.1"'));
    const sc = I('app/Plugin/Securitychecker42/Resource/config/services.yaml');
    fs.writeFileSync(sc, fs.readFileSync(sc, 'utf8').replace(/securitychecker42_receiver: ".*"/, `securitychecker42_receiver: "${STUB}"`));
    const envFile = I('.env');
    fs.writeFileSync(envFile, fs.readFileSync(envFile, 'utf8').replace(/\s*$/, '\n') + 'TRUSTED_PROXIES=127.0.0.1\n');
    const dest = I('html/upload/save_image');
    fs.mkdirSync(dest, { recursive: true });
    for (const f of fs.readdirSync(IMG)) fs.copyFileSync(path.join(IMG, f), path.join(dest, f));
    const NAMED = SHOP.categories.filter((c) => c.name);
    const products = SHOP.products.filter((p) => p.classes.length && p.classes[0].price > 0).map((p) => {
      const min = (p.spec.find((s) => s[0] === '最小注文数') || [])[1];
      const spec = p.spec.filter((s) => s[0] !== '商品コード').map(([k, v]) => `■${k}：${v.replace(/\n/g, ' ／ ')}`).join('\n');
      return { id: p.id, cat: p.cat, name: p.name, code: p.code.split(' ')[0], file: p.file, classes: p.classes,
        list: min ? `最小注文数 ${min}` : '', detail: `${p.desc}\n\n${spec}` };
    });
    D.setup = await cap.php(SETUP_PHP, { categories: NAMED, products });
    log('setup', JSON.stringify(D.setup));
    D.cacheOut0 = show(await cacheClear());
    D.version0 = await version();
    log('version', D.version0);

    // login history: attempts at the default /admin from elsewhere, the office's own logins (dates moved into the past week below)
    const tries = [[OTHER, 'admin', 'admin123'], [OTHER, 'admin', 'password1'], [OTHER, 'administrator', 'admin'], ['203.0.113.77', 'eccube', 'eccube'],
      [OFFICE, 'admin', 'password'], ['203.0.113.77', 'admin', 'qwerty'], [OTHER, 'test', 'test'], [OFFICE, 'admin', 'password'], ['203.0.113.77', 'root', 'root'], [OTHER, 'admin', 'Admin2024'], [OFFICE, 'admin', 'password']];
    for (const [ip, u, p] of tries) { await xff(ip); await submitLogin(u, p); if (/\/admin\/?$|\/admin\/(?!login)/.test(url())) await cap.go(ADM + '/logout', 'body'); }
    await xff(null);
    const when = ['2026-11-10 02:13:41', '2026-11-10 02:13:58', '2026-11-11 03:41:07', '2026-11-12 23:52:30', '2026-11-13 09:12:44', '2026-11-14 01:08:19',
      '2026-11-15 04:27:51', '2026-11-16 09:05:12', '2026-11-16 22:47:03', '2026-11-17 03:31:26'];
    D.history = await cap.php(String.raw`
      $rows = $em->getRepository(\Eccube\Entity\LoginHistory::class)->findBy([], ['id' => 'ASC']);
      $out = [];
      foreach ($rows as $i => $h) {
        if (!isset($data[$i])) { $em->remove($h); continue; }
        $d = new \DateTime($data[$i], new \DateTimeZone('Asia/Tokyo'));
        $h->setCreateDate($d)->setUpdateDate($d);
        $out[] = [$h->getUserName(), $h->getClientIp(), $h->getStatus() ? $h->getStatus()->getName() : null, $data[$i]];
      }
      $em->flush();
      return $out;`, when);
    log('history', JSON.stringify(D.history));

    // ---------------------------------------------------------------- ch2: the health check
    await cap.go(ADM + '/login', '#login_id');
    await bullets(8);
    await cap.capture('login', { inputs: [['#login_id', 'login_id']] });
    await adminLogin();
    await cap.go(ADM, '.c-contentsArea');
    await cap.capture('home-0');
    await cap.go(ADM + '/setting/system/system', '.c-contentsArea');
    await cap.capture('system-0');
    await cap.go(ADM + '/store/plugin', '.c-contentsArea');
    await cap.capture('plugins-0');
    await cap.go(ADM + '/setting/system/login_history', '.c-contentsArea');
    await cap.capture('loginhist');
    await cap.go(ADM + '/setting/system/log', '.c-contentsArea');
    await cap.capture('log-0');
    await cap.go(ADM + '/product', '.c-contentsArea');
    await cap.capture('products-0');
    D.logs0 = logTails(cap.instance, 14);
    D.headersLocal = await (async () => { const r = await fetch(cap.origin + '/'); await r.arrayBuffer(); return [...r.headers].map(([k, v]) => `${k}: ${show(v)}`); })();

    // ---------------------------------------------------------------- ch3: security check
    await cap.go(ADM + '/setting/system/security', '.c-contentsArea');
    await cap.capture('security-0');
    D.install = await cap.php(INSTALL_PHP, 'Securitychecker42');
    log('Securitychecker42', JSON.stringify(D.install));
    D.cacheOut1 = show(await cacheClear());
    await adminLogin();
    await cap.go(ADM + '/store/plugin', '.c-contentsArea');
    await cap.capture('plugins-1');
    await cap.go(ADM + '/store/plugin/Securitychecker4/config', '.c-contentsArea');
    await cap.capture('sc-0');
    const t0 = Date.now();
    await page.evaluate(() => { const c = document.querySelector('input[type=checkbox][id$="tools_agreement"]'); if (c) c.checked = true; });
    await nav(() => { const c = document.querySelector('input[type=checkbox][id$="tools_agreement"]'); const f = (c && c.form) || document.querySelector('form#form1') || document.querySelector('.c-contentsArea form'); f.submit(); }, '.c-contentsArea');
    D.checkSeconds = Math.round((Date.now() - t0) / 1000);
    log('security check', D.checkSeconds, 's', url());
    await cap.capture('sc-1');
    D.checkResult = await cap.php("return json_decode($em->getConnection()->fetchOne('SELECT check_result FROM plg_securitychecker42_config'), true);").catch((e) => ({ error: e.message }));
    D.received = received;

    // ---------------------------------------------------------------- ch4: members, 2FA, the admin route, allowed addresses, lockout
    await cap.go(ADM + '/setting/system/member', '.c-contentsArea');
    await cap.capture('members-0');
    await cap.go(ADM + '/setting/system/member/new', '.c-contentsArea');
    await page.evaluate(() => {
      const sel = document.querySelector('select[id$="_Authority"]'); if (sel && sel.options.length > 1) sel.value = sel.options[1].value;
      const w = document.querySelector('input[type=radio][id$="_Work_1"], input[type=radio][name$="[Work]"][value="1"]'); if (w) w.checked = true;
      const sw = document.querySelector('select[id$="_Work"]'); if (sw) sw.value = '1';
    });
    await cap.type('input[id$="_plain_password_first"]', STAFF.pass);
    await cap.type('input[id$="_plain_password_second"]', STAFF.pass);
    D.memberForm = await page.evaluate(() => [...document.querySelectorAll('form input, form select')].map((e) => `${e.type}#${e.id}`));
    log('member form', D.memberForm.join(' '));
    await page.evaluate(() => document.querySelectorAll('input[type=password]').forEach((i) => { i.dataset.real = i.value; }));
    await bullets(18);
    await cap.capture('member-new', { inputs: [['input[id$="_name"]', 'm_name'], ['input[id$="_department"]', 'm_dept'], ['input[id$="_login_id"]', 'm_login']] });
    await page.evaluate(() => document.querySelectorAll('input[data-real]').forEach((i) => { i.type = 'password'; i.value = i.dataset.real; }));
    await page.evaluate((id) => { const v = (sel, x) => { document.querySelector(sel).value = x; }; v('input[id$="_name"]', '運営担当'); v('input[id$="_department"]', 'EC 運営'); v('input[id$="_login_id"]', id); }, STAFF.id);
    await page.evaluate(() => { const c = document.querySelector('input[type=checkbox][id$="two_factor_auth_enabled"]'); if (c) c.checked = true; });
    await nav(() => document.querySelector('input[id$="_login_id"]').form.submit(), '.c-contentsArea');
    log('member saved →', url());
    await cap.go(ADM + '/setting/system/member', '.c-contentsArea');
    await cap.capture('members-1');
    await cap.go(ADM + '/setting/system/member/1/edit', '.c-contentsArea');
    await cap.capture('member-edit');
    await page.evaluate(() => { const c = document.querySelector('input[type=checkbox][id$="two_factor_auth_enabled"]'); if (c) c.checked = true; });
    await nav(() => document.querySelector('input[type=checkbox][id$="two_factor_auth_enabled"]').form.submit(), 'body');
    log('admin 2FA on →', url());
    // admin's own 2FA is now required: EC-CUBE goes straight to the set-up screen (QR code → the code)
    if (!/two_factor_auth\/set/.test(url())) await cap.go(ADM + '/two_factor_auth/set', 'body');
    D.tfaSetUrl = show(url());
    await qrToImg();
    await cap.capture('tfa-set', { inputs: [['input[id$="device_token"]', 'code']] });
    await passTfa();
    D.tfaKey = await cap.php("return $em->getConnection()->fetchOne('SELECT two_factor_auth_key FROM dtb_member WHERE id = 1');");
    log('admin 2FA key set', !!D.tfaKey, url());
    await cap.go(ADM, '.c-contentsArea');
    await cap.capture('home-1');
    D.members = await cap.php("return $em->getConnection()->fetchAllAssociative('SELECT id, login_id, name, department, two_factor_auth_enabled FROM dtb_member ORDER BY id');");
    // the admin route and allowed addresses (セキュリティ管理, the real form)
    await cap.go(ADM + '/setting/system/security', 'body');
    if (/two_factor_auth/.test(url())) { await passTfa(); await cap.go(ADM + '/setting/system/security', '.c-contentsArea'); }
    D.env0 = show(fs.readFileSync(envFile, 'utf8'));
    await cap.capture('security-form', { inputs: [['input[id$="admin_route_dir"]', 'route'], ['textarea[id$="admin_allow_hosts"]', 'allow']] });
    // values put in directly (typing into a box right after capturing it did not always land)
    await page.evaluate((r, v) => { document.querySelector('input[id$="admin_route_dir"]').value = r; document.querySelector('textarea[id$="admin_allow_hosts"]').value = v; }, ROUTE, `127.0.0.1\n${OFFICE}`);
    await nav(() => document.querySelector('input[id$="admin_route_dir"]').form.submit(), 'body');
    log('security saved →', url());
    if (!url().includes(ROUTE)) throw new Error('the admin route was not changed: ' + url() + ' ' + (await page.evaluate(() => document.body.innerText.replace(/s+/g, ' ').slice(0, 300))));
    D.env1 = show(fs.readFileSync(envFile, 'utf8'));
    ADM = '/' + ROUTE;
    D.cacheOut2 = show(await cacheClear());
    await cap.go(ADM + '/login', '#login_id');
    await bullets(8);
    await cap.capture('login-new', { inputs: [['#login_id', 'login_id']] });
    D.status = {
      office: await status(ADM + '/login', OFFICE),
      other: await status(ADM + '/login', OTHER),
      local: await status(ADM + '/login'),
      oldAdmin: await status('/admin/login'),
      front: await status('/'),
    };
    log('status', JSON.stringify(D.status));
    await xff(OTHER);
    await cap.go(ADM + '/login', 'body');
    await cap.capture('denied');
    await xff(null);
    await cap.go('/admin/login', 'body');
    await cap.capture('old-admin');
    await page.goto('about:blank');
    D.cacheOut2b = show(await cacheClear());   // a fresh EC-CUBE before the login attempts
    // lockout: ops01 — five wrong passwords, then the right one
    D.lockout = [];
    for (let i = 0; i < 5; i++) { await submitLogin(STAFF.id, 'wrong-pass-' + i); D.lockout.push(await page.evaluate(() => (document.querySelector('.text-danger, .alert, .ec-errorMessage, #login_form .error, form .text-danger') || {}).textContent || '')); }
    await submitLogin(STAFF.id, STAFF.pass);
    D.lockout.push(await page.evaluate(() => (document.querySelector('.text-danger, .alert, .ec-errorMessage, form .text-danger') || {}).textContent || ''));
    log('lockout', JSON.stringify(D.lockout.map((s) => s.trim())));
    await bullets(8);
    await cap.capture('lockout');
    // admin again at the new URL: password, then the code
    await cap.go(ADM + '/logout', 'body');
    await adminLogin();
    log('admin login →', url());
    await cap.go(ADM + '/setting/system/security', '.c-contentsArea');
    await cap.capture('security-1');
    await cap.go(ADM + '/setting/system/login_history', '.c-contentsArea');
    await cap.capture('loginhist-1');

    // ---------------------------------------------------------------- ch5: files (the real .env and EC-CUBE's own nginx sample)
    D.nginxSample = fs.readFileSync(I('nginx.conf.sample'), 'utf8');
    D.monolog = fs.readFileSync(I('app/config/eccube/packages/prod/monolog.yml'), 'utf8');
    D.securityYaml = fs.readFileSync(I('app/config/eccube/packages/security.yaml'), 'utf8').split('\n').slice(30, 75).join('\n');
    D.eccubeYaml = fs.readFileSync(I('app/config/eccube/packages/eccube.yaml'), 'utf8').split('\n').filter((l) => /password_(min|max|pattern)|login_throttling|2fa_/.test(l)).join('\n');

    // ---------------------------------------------------------------- ch6: backup and restore test
    fs.mkdirSync(I('var/backup'), { recursive: true });
    const SQL = (sql) => dbConsole({ command: 'dbal:run-sql', sql });
    D.count0 = show((await SQL("SELECT (SELECT COUNT(*) FROM dtb_product) AS products, (SELECT COUNT(*) FROM dtb_product_class) AS product_classes, (SELECT COUNT(*) FROM dtb_category) AS categories, (SELECT COUNT(*) FROM dtb_member) AS members, (SELECT COUNT(*) FROM dtb_plugin WHERE enabled = 1) AS plugins")).out);
    D.vacuum = await SQL("VACUUM INTO '/srv/eccube/var/backup/eccube-20261117.db'");
    D.vacuum.out = show(D.vacuum.out);
    const dbBak = I('var/backup/eccube-20261117.db');
    D.dbBak = { size: fs.statSync(dbBak).size, sha256: crypto.createHash('sha256').update(fs.readFileSync(dbBak)).digest('hex') };
    const tarArgs = ['-czvf', 'var/backup/files-20261117.tar.gz', '.env', 'app/Customize', 'app/PluginData', 'app/template', 'html/upload', 'html/user_data'];
    const tr = spawnSync('tar', tarArgs, { cwd: cap.instance, encoding: 'utf8' });
    D.tar = { code: tr.status, lines: (tr.stdout + tr.stderr).split(/\r?\n/).filter(Boolean) };
    const tgz = I('var/backup/files-20261117.tar.gz');
    D.tarBak = { size: fs.statSync(tgz).size, sha256: crypto.createHash('sha256').update(fs.readFileSync(tgz)).digest('hex') };
    log('backup', JSON.stringify(D.dbBak), JSON.stringify(D.tarBak), D.tar.lines.length, 'entries');
    // the staged loss: the database and the product pictures
    fs.rmSync(I('var/eccube.db'));
    const pics = fs.readdirSync(dest);
    for (const f of pics) fs.rmSync(path.join(dest, f));
    D.lost = { pictures: pics.length };
    D.lostStatus = await status('/products/list');
    log('lost: front', JSON.stringify(D.lostStatus));
    // the restore
    fs.copyFileSync(dbBak, I('var/eccube.db'));
    const xr = spawnSync('tar', ['-xzvf', 'var/backup/files-20261117.tar.gz', 'html/upload'], { cwd: cap.instance, encoding: 'utf8' });
    D.untar = { code: xr.status, lines: (xr.stdout + xr.stderr).split(/\r?\n/).filter(Boolean) };
    D.restoredPictures = fs.readdirSync(dest).length;
    D.cacheOut3 = show(await cacheClear());
    D.count1 = show((await SQL("SELECT (SELECT COUNT(*) FROM dtb_product) AS products, (SELECT COUNT(*) FROM dtb_product_class) AS product_classes, (SELECT COUNT(*) FROM dtb_category) AS categories, (SELECT COUNT(*) FROM dtb_member) AS members, (SELECT COUNT(*) FROM dtb_plugin WHERE enabled = 1) AS plugins")).out);
    D.integrity = show((await SQL('PRAGMA integrity_check')).out);
    await adminLogin();
    await cap.go(ADM + '/product', '.c-contentsArea');
    await cap.capture('products-restored');
    await cap.go('/products/list?category_id=9', '.ec-shelfRole, body');
    await cap.capture('front-restored');

    // ---------------------------------------------------------------- ch7: the 2FA bypass on 4.3.1, maintenance, the 4.3.1-p1 files
    await cap.go(ADM + '/logout', 'body');
    await page.deleteCookie(...(await page.cookies()));
    await submitLogin('admin', 'password');
    D.vulnAuthUrl = show(url());
    await cap.capture('vuln-auth', { inputs: [['input[id$="device_token"]', 'code']] });
    await cap.go(ADM + '/two_factor_auth/set', 'body');
    D.vulnSetUrl = show(url());
    log('4.3.1 /set →', D.vulnSetUrl);
    await qrToImg();
    await cap.capture('vuln-set', { inputs: [['input[id$="device_token"]', 'code']] });
    await cap.go(ADM + '/two_factor_auth/auth', 'body');
    await passTfa();
    // メンテナンス管理
    await cap.go(ADM + '/content/maintenance', '.c-contentsArea');
    await cap.capture('maint-0');
    await nav(() => document.querySelector('.c-contentsArea form button[type=submit]').form.submit(), '.c-contentsArea');
    await cap.capture('maint-1');
    D.maintFile = fs.existsSync(I('.maintenance')) ? fs.readFileSync(I('.maintenance'), 'utf8') : null;
    D.maintStatus = await status('/products/list');
    D.maintAdmin = await status(ADM + '/login');
    log('maintenance', D.maintFile, JSON.stringify(D.maintStatus));
    const saved = await page.cookies();
    await page.deleteCookie(...saved.filter((c) => c.name === 'maintenance_token'));
    await cap.go('/products/list?category_id=9', 'body');
    await cap.capture('front-503');
    await page.setCookie(...saved.filter((c) => c.name === 'maintenance_token'));
    await cap.go('/products/list?category_id=9', 'body');
    await cap.capture('front-admin-view');
    // the security release: the four PHP files of 4.3.1-p1 (EC-CUBE's own, from the installed 4.3.1-p1) and the version in package(-lock).json
    for (const f of PATCHED) fs.copyFileSync(path.join(BASE, f), I(f));
    for (const f of ['package.json', 'package-lock.json']) fs.copyFileSync(path.join(BASE, f), I(f));
    D.patchCheck = PATCHED.map((f) => [f, crypto.createHash('sha256').update(fs.readFileSync(I(f))).digest('hex').slice(0, 12)]);
    D.cacheOut4 = show(await cacheClear());
    D.version1 = await version();
    log('version', D.version1);
    await adminLogin();
    await cap.go(ADM + '/setting/system/system', '.c-contentsArea');
    await cap.capture('system-1');
    await cap.go(ADM + '/logout', 'body');
    const keep = (await page.cookies()).filter((c) => c.name === 'maintenance_token');
    await page.deleteCookie(...(await page.cookies()));
    await page.setCookie(...keep);
    await submitLogin('admin', 'password');
    await cap.go(ADM + '/two_factor_auth/set', 'body');
    D.fixedSetUrl = show(url());
    log('4.3.1-p1 /set →', D.fixedSetUrl);
    await cap.capture('vuln-fixed', { inputs: [['input[id$="device_token"]', 'code']] });
    await passTfa();
    await cap.go(ADM + '/content/maintenance', '.c-contentsArea');
    await nav(() => document.querySelector('.c-contentsArea form button[type=submit]').form.submit(), '.c-contentsArea');
    await cap.capture('maint-2');
    D.maintFile2 = fs.existsSync(I('.maintenance'));
    await page.deleteCookie(...(await page.cookies()).filter((c) => c.name === 'maintenance_token'));
    await cap.go('/products/list?category_id=9', '.ec-shelfRole, body');
    await cap.capture('front-1');
    D.frontStatus = await status('/products/list');
    D.logs1 = logTails(cap.instance, 20);
    D.logFiles = fs.readdirSync(I('var/log/prod')).map((f) => [f, fs.statSync(I('var/log/prod/' + f)).size]);

    stub.close();
    await cap.finish();
    process.exit(0);
  } catch (e) {
    console.error(e);
    try { await page.screenshot({ path: path.join(SHOTS || DATA_DIR, 'error.png') }); } catch (e2) { /* closed */ }
    log('at', page.url());
    stub.close();
    await cap.abort();
    process.exit(1);
  }
})();
