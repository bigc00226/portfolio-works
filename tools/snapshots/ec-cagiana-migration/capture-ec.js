/*
 * The target of the migration: EC-CUBE 4.3.1-p1 (tools/eccube/capture.js: PHP 8.3 in WebAssembly, SQLite, a fresh copy in
 * ../eccube-local/inst/ec-cagiana-migration, shown as the developer's http://localhost:8080). Run after capture-ec3.js (it
 * makes work/backup-1.tar.gz and backup-2.tar.gz with the EC-CUBE 3 backup plugin); the screens are merged into the same
 * public/videos/ec-cagiana-migration/js/ec-snapshot.js.
 *
 *   node tools/snapshots/ec-cagiana-migration/capture-ec.js [screenshot folder]   → node tools/webp.js ec-cagiana-migration
 *
 * Everything below really runs, in this order (the video's order):
 *   1  the data migration plugin "データ移行プラグイン for EC-CUBE4" (DataMigration42 — the 4.3 version, github.com/chihiro-adachi/
 *      data-migration-plugin branch 4.2) into app/Plugin, its composer.json "require" (pear/archive_tar, wapmorgan/unified-archive,
 *      nobuhiko/bulk-insert-query + their own) from their GitHub releases into vendor/ and Composer's autoload, then
 *      bin/console eccube:plugin:install / enable --code=DataMigration42
 *   2  backup-1.tar.gz uploaded through the plugin's own form → on SQLite its PostgreSQL branch fails (the real システムエラー and
 *      log line) → js/migrate-src.js's patch (else → elseif postgresql, setIdSeq only for PostgreSQL) → .env ECCUBE_AUTH_MAGIC =
 *      EC-CUBE 3's auth_magic → uploaded again: members, admin, products, categories, orders migrated
 *   3  the counts (bin/console dbal:run-sql), the admin lists and records, a migrated member's login with the old password
 *   4  the product pictures copied from EC-CUBE 3's html/upload/save_image; the cagiana theme (build-theme.js) registered and
 *      chosen (.env ECCUBE_TEMPLATE_CODE)
 *   5  the old URLs checked (status codes), LegacyUrlSubscriber (js/migrate-src.js) → checked again
 *   6  backup-2.tar.gz with 「会員と受注データのみ移行する」 (the switch-over day's delta)
 */
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const ROOT = path.resolve(__dirname, '../../..');
const RT = require(path.join(ROOT, 'tools/eccube/runtime'));
const ECC = require(path.join(ROOT, 'tools/eccube/capture'));
const SRC = require(path.join(ROOT, 'public/videos/ec-cagiana-migration/js/migrate-src.js'));
const MEMBERS = require('./members.js');
const ID = 'ec-cagiana-migration';
const EC3 = path.join(RT.LOCAL, 'ec3-cagiana');
const WORK = path.join(__dirname, 'work');
const THEME = path.join(__dirname, 'theme');
const PLUGIN_SRC = path.join(RT.LOCAL, 'dl3/plugins/dm/data-migration-plugin-4.2');
const DEPS = path.join(RT.LOCAL, 'dl3/deps');
const SHOTS = process.argv[2] || null;
const SHOP = JSON.parse(fs.readFileSync(path.join(__dirname, 'shop-data.json'), 'utf8'));
const TAR = path.join(process.env.SystemRoot || 'C:/Windows', 'System32', 'tar.exe');
const log = (...a) => console.log(`[${new Date().toLocaleTimeString('sv-SE')}]`, ...a);
const DEP_NAMES = ['pear/archive_tar', 'pear/pear-core-minimal', 'pear/console_getopt', 'pear/pear_exception', 'wapmorgan/unified-archive', 'nobuhiko/bulk-insert-query'];

/** the plugin's composer "require": each package's latest stable (unified-archive ^1.1) from Packagist → GitHub archive */
async function deps(inst) {
  const out = [];
  for (const name of DEP_NAMES) {
    const meta = await (await fetch(`https://repo.packagist.org/p2/${name}.json`)).json();
    const list = meta.packages[name];
    const v = list.find((x) => (name === 'wapmorgan/unified-archive' ? /^1\.1\./.test(x.version) : !/dev|alpha|beta|RC/i.test(x.version)));
    const zip = path.join(DEPS, `${name.replace('/', '-')}-${v.version}.zip`);
    fs.mkdirSync(DEPS, { recursive: true });
    if (!fs.existsSync(zip)) fs.writeFileSync(zip, Buffer.from(await (await fetch(v.dist.url, { headers: { 'User-Agent': 'eccube-local' } })).arrayBuffer()));
    const tmp = path.join(DEPS, 'x', name.replace('/', '-'));
    fs.rmSync(tmp, { recursive: true, force: true });
    fs.mkdirSync(tmp, { recursive: true });
    spawnSync(TAR, ['-xf', zip, '-C', tmp]);
    const top = fs.readdirSync(tmp)[0];
    const to = path.join(inst, 'vendor', name);
    fs.rmSync(to, { recursive: true, force: true });
    fs.cpSync(path.join(tmp, top), to, { recursive: true });
    out.push({ name, version: v.version.replace(/^v/, ''), ref: v.dist.reference.slice(0, 10) });
  }
  // what Composer would register for them (psr-4 / psr-0 / PEAR's include path), added to its autoload "files"
  const auto = `<?php
// eccube-local: the packages DataMigration42's composer.json requires (${out.map((d) => `${d.name} ${d.version}`).join(', ')}), registered as Composer would
spl_autoload_register(function ($class) {
    $v = __DIR__ . '/..';
    foreach (['wapmorgan\\\\UnifiedArchive\\\\' => '/wapmorgan/unified-archive/src/', 'nobuhiko\\\\BulkInsertQuery\\\\' => '/nobuhiko/bulk-insert-query/src/'] as $p => $d) {
        if (strncmp($class, $p, strlen($p)) === 0 && is_file($f = $v . $d . str_replace('\\\\', '/', substr($class, strlen($p))) . '.php')) { require $f; return; }
    }
    foreach (['Archive_Tar' => '/pear/archive_tar/', 'Console_' => '/pear/console_getopt/', 'PEAR_Exception' => '/pear/pear_exception/', 'PEAR' => '/pear/pear-core-minimal/src/', 'System' => '/pear/pear-core-minimal/src/', 'OS_' => '/pear/pear-core-minimal/src/'] as $p => $d) {
        if (strncmp($class, $p, strlen($p)) === 0 && is_file($f = $v . $d . str_replace('_', '/', $class) . '.php')) { require $f; return; }
    }
});
set_include_path(get_include_path() . PATH_SEPARATOR . __DIR__ . '/../pear/archive_tar' . PATH_SEPARATOR . __DIR__ . '/../pear/pear-core-minimal/src' . PATH_SEPARATOR . __DIR__ . '/../pear/console_getopt' . PATH_SEPARATOR . __DIR__ . '/../pear/pear_exception');
`;
  fs.mkdirSync(path.join(inst, 'vendor/eccube-local'), { recursive: true });
  fs.writeFileSync(path.join(inst, 'vendor/eccube-local/datamigration-autoload.php'), auto);
  const C = path.join(inst, 'vendor/composer');
  const key = 'eccubelocaldatamigration00000000';
  let stat = fs.readFileSync(path.join(C, 'autoload_static.php'), 'utf8');
  let files = fs.readFileSync(path.join(C, 'autoload_files.php'), 'utf8');
  if (!stat.includes(key)) stat = stat.replace('public static $files = array (\n', `public static $files = array (\n        '${key}' => __DIR__ . '/..' . '/eccube-local/datamigration-autoload.php',\n`);
  if (!files.includes(key)) files = files.replace('return array(\n', `return array(\n    '${key}' => $vendorDir . '/eccube-local/datamigration-autoload.php',\n`);
  fs.writeFileSync(path.join(C, 'autoload_static.php'), stat);
  fs.writeFileSync(path.join(C, 'autoload_files.php'), files);
  if (!stat.includes(key) || !files.includes(key)) throw new Error('autoload files not updated');
  return out;
}

function setEnv(inst, kv) {
  const f = path.join(inst, '.env');
  let s = fs.readFileSync(f, 'utf8');
  for (const [k, v] of Object.entries(kv)) {
    const re = new RegExp(`^${k}=.*$`, 'm');
    s = re.test(s) ? s.replace(re, () => `${k}=${v}`) : s + `\n${k}=${v}\n`;
  }
  fs.writeFileSync(f, s);
}
/** the newest lines of EC-CUBE's own log (var/log/prod/*.log) that match */
function logLines(dir, re) {
  const d = path.join(dir, 'var/log/prod');
  if (!fs.existsSync(d)) return { file: '', lines: [] };
  const files = fs.readdirSync(d).map((f) => path.join(d, f)).sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs);
  for (const f of files) {
    const lines = fs.readFileSync(f, 'utf8').split('\n').filter((l) => re.test(l));
    if (lines.length) return { file: path.relative(dir, f).replace(/\\/g, '/'), lines: lines.slice(-2) };
  }
  return { file: '', lines: [] };
}
/** the old shop's URLs (EC-CUBE 3): products, categories, the standard pages, the shop top /ec, two pictures */
function oldUrls() {
  const prods = SHOP.products.map((p) => `/products/detail/${p.id}`);
  const cats = [...new Set(SHOP.categories.flatMap((c) => c.children.map((x) => x.id)).concat([6, 381, 398, 258]))].map((id) => `/products/list?category_id=${id}`);
  const pages = ['/', '/ec', '/products/list', '/cart', '/mypage/login', '/entry', '/contact', '/help/about', '/help/guide', '/help/privacy', '/help/tradelaw', '/help/agreement'];
  const imgs = SHOP.products.find((p) => p.id === 103).images.slice(0, 2).map((f) => `/html/upload/save_image/${f}`);
  return [...pages, ...prods, ...cats, ...imgs];
}

(async () => {
  for (const f of ['backup-1.tar.gz', 'backup-2.tar.gz']) if (!fs.existsSync(path.join(WORK, f))) throw new Error('run capture-ec3.js first: ' + f);
  const ec3Magic = fs.readFileSync(path.join(EC3, 'app/config/eccube/config.yml'), 'utf8').match(/auth_magic: (\S+)/)[1];
  const cap = await ECC.start({ id: ID, version: 4, fresh: true, site: 'http://localhost:8080', date: '2026-11-11', time: '13:24', shots: SHOTS, merge: true, assets: 'assets/ec' });
  const { page } = cap;
  const D = cap.data;
  const inst = cap.instance;
  const cacheClear = async () => { try { await cap.console(['cache:clear', '--no-warmup']); } catch (e) { log('cache:clear', e.message.slice(0, 200)); } fs.rmSync(path.join(inst, 'var/cache/prod'), { recursive: true, force: true }); };
  const adminGo = async (rel, ready = 'body') => {
    await cap.go(rel, 'body');
    if (page.url().includes('/admin/login')) { log('signed out — login again'); await cap.login(); await cap.go(rel, 'body'); }
    await cap.settle(ready, 300000);
  };
  const dbConsole = async (input) => {
    const r = await cap.php(String.raw`
$app = new \Symfony\Bundle\FrameworkBundle\Console\Application($kernel);
$app->setAutoExit(false);
$out = new \Symfony\Component\Console\Output\BufferedOutput();
$code = $app->run(new \Symfony\Component\Console\Input\ArrayInput($data), $out);
return ['code' => $code, 'out' => $out->fetch()];`, input);
    log(`console ${JSON.stringify(input).slice(0, 120)} → ${r.code}`);
    return r.out;
  };
  const counts = () => cap.php(String.raw`$c = $em->getConnection(); $q = fn ($s) => (int) $c->fetchOne($s);
return ['products' => $q('SELECT COUNT(*) FROM dtb_product'), 'product_class' => $q('SELECT COUNT(*) FROM dtb_product_class'), 'categories' => $q('SELECT COUNT(*) FROM dtb_category'),
  'images' => $q('SELECT COUNT(*) FROM dtb_product_image'), 'customers' => $q('SELECT COUNT(*) FROM dtb_customer'), 'orders' => $q('SELECT COUNT(*) FROM dtb_order'), 'members' => $q('SELECT COUNT(*) FROM dtb_member')];`);
  const upload = async (file, deltaOnly) => {
    await adminGo('/admin/data_migration42/config', 'input[type=file]');
    const input = await page.$('input[type=file]');
    await input.uploadFile(file);
    if (deltaOnly) await page.evaluate(() => { const c = document.querySelector('#upload-form input[type=checkbox]'); if (c && !c.checked) c.click(); });
    await Promise.all([page.waitForNavigation({ waitUntil: 'load', timeout: 900000 }), page.evaluate(() => { const b = document.querySelector('#upload-button') || document.querySelector('#upload-form button[type=submit]'); b.click(); })]);
    await cap.settle('body');
    log('after upload:', page.url(), (await page.evaluate(() => document.title)));
  };
  const memberLogin = async () => {
    await cap.go('/mypage/login', '#login_email');
    await cap.type('#login_email', 'sample02@example.com');
    await cap.type('#login_pass', MEMBERS.PASS);
    await Promise.all([page.waitForNavigation({ waitUntil: 'load' }), page.evaluate(() => document.querySelector('#login_email').form.submit())]);
    await cap.settle('body');
  };
  try {
    // ---------------------------------------------------------------- 0: the fresh EC-CUBE 4.3 (bundled plugins: registered, never installed → unregistered)
    await cap.php("$em->getConnection()->executeStatement('DELETE FROM dtb_plugin'); return true;");
    await cap.go('/admin/login', '#login_id');
    await cap.capture('admin-login', { inputs: [['#login_id', 'login_id'], ['#password', 'password']] });
    await cap.login();
    await cap.capture('admin-home');
    D.before = await counts();

    // ---------------------------------------------------------------- 1: the plugin and its libraries
    fs.cpSync(PLUGIN_SRC, path.join(inst, 'app/Plugin/DataMigration42'), { recursive: true, filter: (s) => !/[\\/](Tests|doc|\.github)([\\/]|$)/.test(s.slice(PLUGIN_SRC.length)) });
    D.deps = await deps(inst);
    log('deps', JSON.stringify(D.deps));
    for (const args of [['eccube:plugin:install', '--code=DataMigration42'], ['eccube:plugin:enable', '--code=DataMigration42']]) {
      try { D[args[0].split(':').pop()] = await cap.console(args); } catch (e) { D[args[0].split(':').pop()] = e.message.replace(/^console [^\n]*failed:\n/, ''); log(args.join(' '), '(reported a failure — the cache:clear sub-process)', e.message.slice(-300)); }
    }
    D.pluginState = await cap.php("$p = $em->getRepository(\\Eccube\\Entity\\Plugin::class)->findOneBy(['code' => 'DataMigration42']); return $p ? ['installed' => $p->isInitialized(), 'enabled' => $p->isEnabled(), 'version' => $p->getVersion(), 'name' => $p->getName()] : null;");
    log('plugin', JSON.stringify(D.pluginState));
    await cacheClear();
    await adminGo('/admin/store/plugin', '.c-contentsArea');
    await cap.capture('admin-plugins');
    await adminGo('/admin/data_migration42/config', 'input[type=file]');
    await cap.capture('dm-config');

    // ---------------------------------------------------------------- 2: the migration — first on SQLite as the plugin is
    await upload(path.join(WORK, 'backup-1.tar.gz'));
    await cap.capture('dm-error');
    D.errorLog = logLines(inst, /session_replication_role|SQLSTATE/);
    log('error log', JSON.stringify(D.errorLog).slice(0, 500));
    const ctl = path.join(inst, SRC.PLUGIN);
    const patched = SRC.patch(fs.readFileSync(ctl, 'utf8'));
    fs.writeFileSync(ctl, patched.src);
    D.patch = { elses: patched.elses };
    log('patched', patched.elses, 'else branches + setIdSeq');
    setEnv(inst, { ECCUBE_AUTH_MAGIC: ec3Magic });
    D.authMagic = ec3Magic;
    await cacheClear();
    await upload(path.join(WORK, 'backup-1.tar.gz'));
    if (page.url().includes('/admin/login')) {
      await cap.capture('admin-login-2', { inputs: [['#login_id', 'login_id'], ['#password', 'password']] });
      await cap.login();
    }
    await cap.capture('dm-done');
    D.after = await counts();
    // 基本設定 is not part of the plugin's data (dtb_base_info): the shop name as on the old site
    D.shop = await cap.php("$b = $em->getRepository(\\Eccube\\Entity\\BaseInfo::class)->get(); $b->setShopName('CAGIANA《カジーナ》'); $em->flush(); return $b->getShopName();");
    log('counts', JSON.stringify(D.before), '→', JSON.stringify(D.after));
    D.countSql = await dbConsole({ command: 'dbal:run-sql', sql: 'SELECT (SELECT COUNT(*) FROM dtb_product) AS products, (SELECT COUNT(*) FROM dtb_category) AS categories, (SELECT COUNT(*) FROM dtb_customer) AS customers, (SELECT COUNT(*) FROM dtb_order) AS orders' });
    log(D.countSql);

    // ---------------------------------------------------------------- 3: the lists and records in the new admin, a member's login
    await adminGo('/admin/product', '.c-contentsArea');
    await cap.capture('admin-products');
    await adminGo('/admin/product/product/103/edit', '.c-contentsArea');
    await cap.capture('admin-product-103');
    await adminGo('/admin/customer', '.c-contentsArea');
    await cap.capture('admin-customers');
    await adminGo('/admin/order', '.c-contentsArea');
    await cap.capture('admin-orders');
    await adminGo('/admin/order/7/edit', '.c-contentsArea');
    await cap.capture('admin-order-7');
    D.order7 = await cap.php("$o = $em->getRepository(\\Eccube\\Entity\\Order::class)->find(7); return $o ? ['no' => $o->getOrderNo(), 'total' => (int) $o->getPaymentTotal(), 'status' => (string) $o->getOrderStatus(), 'items' => array_map(fn ($i) => [$i->getProductName(), (string) $i->getClassCategoryName1(), (int) $i->getPrice(), (int) $i->getQuantity(), (string) $i->getOrderItemType()], $o->getOrderItems()->toArray())] : null;");
    log('order 7', JSON.stringify(D.order7));
    await cap.go('/products/detail/103', 'body');
    await cap.capture('front-103-noimg');
    await cap.go('/mypage/login', '#login_email');
    await cap.capture('front-login', { inputs: [['#login_email', 'login_email'], ['#login_pass', 'login_pass']] });
    await memberLogin();
    await cap.capture('front-top-member');
    await cap.go('/mypage/', 'body');
    await cap.capture('front-mypage');

    // ---------------------------------------------------------------- 4: the pictures, the theme
    const from = path.join(EC3, 'html/upload/save_image'), to = path.join(inst, 'html/upload/save_image');
    let n = 0;
    for (const f of fs.readdirSync(from)) if (!f.startsWith('.')) { fs.copyFileSync(path.join(from, f), path.join(to, f)); n++; }
    D.imagesCopied = n;
    await cap.go('/products/detail/103', 'body');
    await cap.capture('front-103-img');
    fs.cpSync(path.join(THEME, 'app'), path.join(inst, 'app'), { recursive: true });
    fs.cpSync(path.join(THEME, 'html'), path.join(inst, 'html'), { recursive: true });
    await cap.php("$c = $em->getConnection(); if (!$c->fetchOne(\"SELECT COUNT(*) FROM dtb_template WHERE template_code = 'cagiana'\")) { $c->insert('dtb_template', ['device_type_id' => 10, 'template_code' => 'cagiana', 'template_name' => 'CAGIANA', 'create_date' => date('Y-m-d H:i:s'), 'update_date' => date('Y-m-d H:i:s'), 'discriminator_type' => 'template']); } return true;");
    setEnv(inst, { ECCUBE_TEMPLATE_CODE: 'cagiana' });
    await cacheClear();
    await cap.go('/products/detail/103', '#item_detail');
    await cap.capture('front-103-theme');
    await cap.go('/products/list', 'body');
    await cap.capture('front-list-theme');
    await adminGo('/admin/store/template', '.c-contentsArea');   // テンプレート一覧 (CAGIANA chosen)
    await cap.capture('admin-templates');

    // ---------------------------------------------------------------- 5: the old URLs
    const check = async () => {
      const out = [];
      for (const u of oldUrls()) {
        const r = await fetch(cap.origin + u, { redirect: 'manual' });
        out.push([r.status, (r.headers.get('location') || '').replace(cap.origin, 'http://localhost:8080'), u]);
      }
      return out;
    };
    D.urlList = oldUrls();
    D.urls1 = await check();
    log('urls before', JSON.stringify(D.urls1.filter((x) => x[0] !== 200)));
    await cap.files({ [SRC.SUBSCRIBER_PATH]: SRC.SUBSCRIBER });
    await cacheClear();
    D.urls2 = await check();
    log('urls after', JSON.stringify(D.urls2.filter((x) => x[0] !== 200)));
    await cap.go('/help/guide', 'body');
    await cap.capture('front-guide');

    // ---------------------------------------------------------------- 6: the switch-over day: members and orders only
    await adminGo('/admin/data_migration42/config', 'input[type=file]');
    await page.evaluate(() => { const c = document.querySelector('#upload-form input[type=checkbox]'); if (c && !c.checked) c.click(); });
    await cap.capture('dm-delta');
    await upload(path.join(WORK, 'backup-2.tar.gz'), true);
    if (page.url().includes('/admin/login')) await cap.login();
    await cap.capture('dm-delta-done');
    D.after2 = await counts();
    await adminGo('/admin/order', '.c-contentsArea');
    await cap.capture('admin-orders-2');
    log('counts after delta', JSON.stringify(D.after2));
    await cap.finish();
    process.exit(0);
  } catch (e) {
    console.error(e);
    try { log('failed at', page.url(), (await page.evaluate(() => document.body.innerText.slice(0, 500))).replace(/\s+/g, ' ')); } catch (e2) { /* gone */ }
    await cap.abort();
    process.exit(1);
  }
})().catch((e) => { console.error(e); process.exit(1); });
