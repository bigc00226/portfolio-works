/*
 * The REAL WordPress / WooCommerce screens of the video wp-ninshu-woocommerce, captured from WordPress itself
 * (WordPress Playground via tools/wp/playground.js): WordPress 7.x in Japanese + WooCommerce + WooCommerce Stripe Gateway
 * (both from wordpress.org, with their Japanese language packs), set up like the shop:
 *   - the catalogue: the video's own data/products-woocommerce.csv (public/videos/…/js/files.js — the shop's real products)
 *     imported through WooCommerce's real CSV importer (upload → column mapping → import), the product images from the
 *     live shop (thumbnails), the pair price of 禅｜ぜん｜フリーカップ missing as in the CSV (then fixed in the editor)
 *   - the store address, shipping zones (the shop's real rates), bank transfer, accounts, orders — set through the real
 *     screens where the video shows them being set
 *   - the shop's plugin ninshu-shop (the video's own code): the order status 「発送済み」, first with the key 'shipped'
 *     (WooCommerce turns such an order into 支払い待ち — captured as it happens), then with 'wc-shipped'
 *
 *   node tools/snapshots/wp-ninshu-woocommerce/capture-wp.js [--shots=<folder>] [--until=<part>]
 *   → node tools/webp.js wp-ninshu-woocommerce   (fix-wp-snapshot.js runs at the end: the times → the video's clock)
 * Parts, in the order they are captured: setup, shipping, payments, accounts, import, products, orders
 * (--until stops after that part; for trying out).
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const WPC = require('../../wp/playground');

const ID = 'wp-ninshu-woocommerce';
const ROOT = path.resolve(__dirname, '../../..');
const DIR = path.join(ROOT, 'public/videos', ID);
const opt = (k) => { const a = process.argv.find((x) => x.startsWith(`--${k}=`)); return a ? a.slice(k.length + 3) : null; };
const UNTIL = opt('until');
const { wait, log } = WPC;

// the video's files (the CSV and the plugin, exactly as on screen)
const W = {};
new Function('window', fs.readFileSync(path.join(DIR, 'js/products-data.js'), 'utf8'))(W);
new Function('window', fs.readFileSync(path.join(DIR, 'js/files.js'), 'utf8'))(W);
const F = W.FILES;

const ADDRESS = { address: '中京区藤木町18-1', city: '京都市', postcode: '604-0992' };
const ZONES = [
  ['関西・中部・中国・四国', 1300, ['JP:JP16', 'JP:JP17', 'JP:JP18', 'JP:JP21', 'JP:JP22', 'JP:JP23', 'JP:JP24', 'JP:JP25', 'JP:JP26', 'JP:JP27', 'JP:JP28', 'JP:JP29', 'JP:JP30', 'JP:JP31', 'JP:JP32', 'JP:JP33', 'JP:JP34', 'JP:JP35', 'JP:JP36', 'JP:JP37', 'JP:JP38', 'JP:JP39']],
  ['関東・甲信越・九州', 1400, ['JP:JP08', 'JP:JP09', 'JP:JP10', 'JP:JP11', 'JP:JP12', 'JP:JP13', 'JP:JP14', 'JP:JP19', 'JP:JP15', 'JP:JP20', 'JP:JP40', 'JP:JP41', 'JP:JP42', 'JP:JP43', 'JP:JP44', 'JP:JP45', 'JP:JP46']],
  ['南東北', 1500, ['JP:JP04', 'JP:JP06', 'JP:JP07']],
  ['北東北', 1600, ['JP:JP02', 'JP:JP03', 'JP:JP05']],
  ['北海道・沖縄', 2100, ['JP:JP01', 'JP:JP47']],
];
const BANK = { name: '株式会社仁秀', number: '7416313', bank: '楽天銀行 第二営業支店（普通）' };
const CUSTOMERS = [
  { first: '美咲', last: '山本', email: 'misaki.y@example.jp', state: 'JP13', city: '世田谷区', addr: '太子堂1-2-3', pc: '154-0004' },
  { first: '大輔', last: '中村', email: 'd.nakamura@example.jp', state: 'JP27', city: '大阪市北区', addr: '梅田2-4-6', pc: '530-0001' },
  { first: '陽子', last: '佐藤', email: 'yoko.sato@example.jp', state: 'JP01', city: '札幌市中央区', addr: '北1条西3-1', pc: '060-0001' },
];

(async () => {
  const shots = opt('shots');
  const cap = await WPC.start({ id: ID, site: 'http://localhost:8888', date: '2026-11-04', time: '10:52', shots });
  const done = async (part) => { if (UNTIL === part) { await cap.finish(); process.exit(0); } };
  const go = (rel, ready) => cap.go(rel, ready);
  const php = (code, data) => cap.php(code, data);
  const click = async (sel) => { await cap.eval((s) => { const e = document.querySelector(s); if (!e) throw new Error('no ' + s); e.click(); }, sel); await wait(500); };

  /* ------------------------------------------------------------------ setup: WooCommerce + the store settings */
  await cap.boot(WPC.blueprint({
    title: '仁秀｜NINSHU', tagline: '世界遺産 仁和寺御用達の窯元 仁秀',
    plugins: ['woocommerce', 'woocommerce-gateway-stripe'],
    options: {
      woocommerce_onboarding_profile: { skipped: true }, woocommerce_task_list_hidden: 'yes', woocommerce_task_list_complete: 'yes',
      woocommerce_show_marketplace_suggestions: 'no', woocommerce_allow_tracking: 'no', woocommerce_coming_soon: 'no',
      woocommerce_default_country: 'JP:JP26', woocommerce_currency: 'JPY', woocommerce_price_num_decimals: '0', woocommerce_prices_include_tax: 'yes',
      woocommerce_store_address: '', woocommerce_store_city: '', woocommerce_store_postcode: '',
    },
  }));
  await cap.translations();
  // the shop's plugin as on screen at the start (header only, not active yet)
  await cap.files({ 'wp-content/plugins/ninshu-shop/ninshu-shop.php': F.PLUGIN(null) });
  // the site icon: the live shop's
  try {
    const ico = Buffer.from(await (await fetch('https://ninshu.com/ec/wp-content/uploads/2020/05/cropped-66c19942ab4ba346fdb64ccc04cde373-192x192.jpg')).arrayBuffer());
    const id = await cap.media('site-icon.jpg', ico, 'site-icon');
    await php("update_option( 'site_icon', $data ); return true;", id);
  } catch (e) { log('site icon:', e.message); }
  // WooCommerce's own notices / promotions a working shop has dismissed long ago
  await php("update_option( 'woocommerce_admin_notices', [] ); foreach ( [ 'wc_admin_dismissed_payments_promotion', 'woocommerce_marketplace_suggestions_dismissed' ] as $k ) update_user_meta( 1, $k, 'yes' ); return true;");

  await go('/wp-admin/plugins.php', '.wp-list-table');
  await cap.capture('plugins');
  await go('/wp-admin/admin.php?page=wc-settings', '#mainform');
  await cap.capture('general', { inputs: [['#woocommerce_store_address', 'address'], ['#woocommerce_store_city', 'city'], ['#woocommerce_store_postcode', 'postcode']] });
  await cap.type('#woocommerce_store_address', ADDRESS.address);
  await cap.type('#woocommerce_store_city', ADDRESS.city);
  await cap.type('#woocommerce_store_postcode', ADDRESS.postcode);
  await cap.eval(() => { setTimeout(() => document.querySelector('.woocommerce-save-button').click(), 0); });
  await wait(1500);
  await cap.settle('#mainform');
  await cap.capture('general-saved');
  await done('setup');

  /* ------------------------------------------------------------------ shipping: the shop's zones */
  await go('/wp-admin/admin.php?page=wc-settings&tab=shipping', '#mainform');
  await wait(2500);
  await cap.capture('shipping-empty');
  await go('/wp-admin/admin.php?page=wc-settings&tab=shipping&zone_id=new', '#mainform');
  await wait(2500);
  const REGION = '.woocommerce-tree-select-control__control-input';
  await cap.capture('zone-new', { inputs: [['#zone_name', 'zoneName'], [REGION, 'region']] });
  // zone 1 through the real screen: the name, the 22 prefectures picked in the region list (typed to narrow it), 保存
  const [z1name, z1cost, z1loc] = ZONES[0];
  const zoneIds = [];
  const mkZone = (name, locs, order) => php("$z = new WC_Shipping_Zone(); $z->set_zone_name( $data[0] ); $z->set_zone_order( $data[2] ); foreach ( $data[1] as $l ) $z->add_location( $l, 'state' ); $z->save(); return $z->get_id();", [name, locs, order]);
  const prefs = await php("$s = WC()->countries->get_states( 'JP' ); return array_map( fn( $c ) => $s[ substr( $c, 3 ) ], $data );", z1loc);
  log('zone 1 prefectures', prefs.join(' '));
  await cap.type('#zone_name', z1name);
  await cap.frame.focus(REGION);
  await wait(900);
  // the region list is open only while its box has the focus: blur() (the capture blurs the focused element) does
  // nothing while these states are captured, and no other box is turned into a look-alike (that would move the focus)
  const noBlur = (on) => cap.eval((on) => { if (on) { window.__blur0 = window.__blur0 || HTMLElement.prototype.blur; HTMLElement.prototype.blur = function () {}; } else if (window.__blur0) HTMLElement.prototype.blur = window.__blur0; }, on);
  await noBlur(true);
  await cap.capture('zone-new-focus', { inputs: [[REGION, 'region']] });
  const pick = async (name) => {
    const lab = await cap.eval((n) => { const l = [...document.querySelectorAll('.woocommerce-tree-select-control__tree label')].find((x) => x.textContent.startsWith(n + ',')); return l && l.htmlFor; }, name);
    if (!lab) throw new Error('region not in the list: ' + name);
    await (await cap.frame.$(`label[for="${lab}"]`)).click();
    await wait(600);
  };
  await cap.frame.page().keyboard.type(prefs[0], { delay: 80 });
  await wait(1500);
  await cap.capture('zone-new-pick', { inputs: [[REGION, 'region']] });
  await pick(prefs[0]);
  await cap.capture('zone-new-picked');
  await noBlur(false);
  for (const n of prefs.slice(1)) {
    await cap.frame.click(REGION, { clickCount: 3 });
    await cap.frame.page().keyboard.type(n, { delay: 30 });
    await wait(900);
    await pick(n);
  }
  await cap.frame.page().keyboard.press('Escape');
  await wait(800);
  await cap.capture('zone-new-all');
  await cap.eval(() => { setTimeout(() => document.querySelector('#submit').click(), 0); });
  await wait(5000);
  const z1id = await php("foreach ( WC_Shipping_Zones::get_zones() as $z ) if ( $z['zone_name'] === $data ) return [ $z['id'], count( $z['zone_locations'] ) ]; return [ 0, 0 ];", z1name);
  log('zone 1 saved', z1id);
  if (!z1id[0] || z1id[1] !== z1loc.length) throw new Error('zone 1 not saved with its 22 regions');
  zoneIds.push(z1id[0]);
  await go(`/wp-admin/admin.php?page=wc-settings&tab=shipping&zone_id=${zoneIds[0]}`, '#mainform');
  await wait(3000);
  await cap.capture('zone-1');
  await click('.wc-shipping-zone-add-method');
  await wait(2500);
  await cap.capture('zone-method');
  // flat rate: choose it, go on to its settings
  await cap.eval(() => { const opt = document.querySelector('input[value="flat_rate"], #flat_rate, [data-method="flat_rate"]'); if (opt) opt.click(); });
  await wait(800);
  await cap.capture('zone-method-flat');
  await cap.eval(() => { const b = document.querySelector('#btn-next, .wc-backbone-modal-main button.button-primary'); if (b) b.click(); });
  await wait(3000);
  await cap.capture('zone-flat', { inputs: [['#woocommerce_flat_rate_cost', 'cost']] });
  await cap.type('#woocommerce_flat_rate_cost', String(z1cost));
  await cap.eval(() => { const b = document.querySelector('#btn-ok, .wc-backbone-modal-main button.button-primary'); if (b) b.click(); });
  await wait(4000);
  await cap.capture('zone-1-flat');
  // free shipping (20,000 yen or more)
  await click('.wc-shipping-zone-add-method');
  await wait(2500);
  await cap.capture('zone-method-2');
  await cap.eval(() => { const opt = document.querySelector('input[value="free_shipping"], #free_shipping, [data-method="free_shipping"]'); if (opt) opt.click(); });
  await wait(800);
  await cap.capture('zone-method-free');
  await cap.eval(() => { const b = document.querySelector('#btn-next, .wc-backbone-modal-main button.button-primary'); if (b) b.click(); });
  await wait(3000);
  await cap.capture('zone-free-none');
  await cap.frame.select('#woocommerce_free_shipping_requires', 'min_amount');
  await wait(1200);
  await cap.capture('zone-free', { inputs: [['#woocommerce_free_shipping_min_amount', 'minAmount']] });
  await cap.type('#woocommerce_free_shipping_min_amount', '20000');
  await cap.eval(() => { const b = document.querySelector('#btn-ok, .wc-backbone-modal-main button.button-primary'); if (b) b.click(); });
  await wait(4000);
  await cap.capture('zone-1-done');
  // the other zones, set up the same way (the video skips over them) — 北海道・沖縄 at first without free shipping
  const method = (zid, type, settings) => php("$z = new WC_Shipping_Zone( $data[0] ); $iid = $z->add_shipping_method( $data[1] ); $m = WC_Shipping_Zones::get_shipping_method( $iid ); $opt = array_merge( (array) get_option( $m->get_instance_option_key(), [] ), $data[2] ); update_option( $m->get_instance_option_key(), $opt ); return $iid;", [zid, type, settings]);
  for (let i = 1; i < ZONES.length; i++) {
    const [name, cost, locs] = ZONES[i];
    const zid = await mkZone(name, locs, i);
    zoneIds.push(zid);
    await method(zid, 'flat_rate', { title: '定額送料', cost: String(cost) });
    if (i < ZONES.length - 1) await method(zid, 'free_shipping', { title: '送料無料', requires: 'min_amount', min_amount: '20000' });
  }
  await go('/wp-admin/admin.php?page=wc-settings&tab=shipping', '#mainform');
  await wait(3000);
  await cap.capture('zones-missing');
  // 北海道・沖縄: add free shipping through the real modal
  const z5 = zoneIds[ZONES.length - 1];
  await go(`/wp-admin/admin.php?page=wc-settings&tab=shipping&zone_id=${z5}`, '#mainform');
  await wait(3000);
  await cap.capture('zone-5');
  await click('.wc-shipping-zone-add-method');
  await wait(2500);
  await cap.capture('zone-5-method-0');
  await cap.eval(() => { const opt = document.querySelector('input[value="free_shipping"], #free_shipping, [data-method="free_shipping"]'); if (opt) opt.click(); });
  await wait(800);
  await cap.capture('zone-5-method');
  await cap.eval(() => { const b = document.querySelector('#btn-next, .wc-backbone-modal-main button.button-primary'); if (b) b.click(); });
  await wait(3000);
  await cap.capture('zone-5-free-none');
  await cap.frame.select('#woocommerce_free_shipping_requires', 'min_amount');
  await wait(1200);
  await cap.capture('zone-5-free', { inputs: [['#woocommerce_free_shipping_min_amount', 'minAmount']] });
  await cap.type('#woocommerce_free_shipping_min_amount', '20000');
  await wait(600);
  await cap.eval(() => { const b = document.querySelector('#btn-ok, .wc-backbone-modal-main button.button-primary'); if (b) b.click(); });
  await wait(4000);
  await cap.capture('zone-5-done');
  await go('/wp-admin/admin.php?page=wc-settings&tab=shipping', '#mainform');
  await wait(3000);
  await cap.capture('zones-fixed');
  cap.data.zones = zoneIds;
  await done('shipping');

  /* ------------------------------------------------------------------ payments: Stripe (connected by the shop) + bank transfer */
  await go('/wp-admin/admin.php?page=wc-settings&tab=checkout', '#wpbody-content');
  await wait(6000);
  // WooCommerce's WooPayments promotion: 「非表示」 (a working shop dismissed it)
  await cap.eval(() => { const b = [...document.querySelectorAll('button, a')].find((x) => x.textContent.trim() === '非表示'); if (b) b.click(); });
  await wait(2500);
  await cap.capture('payments');
  await go('/wp-admin/admin.php?page=wc-settings&tab=checkout&section=stripe', '#wpbody-content');
  await wait(6000);
  await cap.capture('stripe');
  await go('/wp-admin/admin.php?page=wc-settings&tab=checkout&path=/offline', '#wpbody-content');
  await wait(6000);
  await cap.capture('offline');
  // 直接銀行振込: its 「有効化」 button (what the screen does then — straight to the settings, or 「管理」 — is recorded)
  const before = await cap.eval(() => location.href);
  await cap.eval(() => {
    const t = [...document.querySelectorAll('*')].find((x) => x.children.length === 0 && x.textContent.trim() === '直接銀行振込（国際口座形式）');
    let b = null;
    for (let n = t; n && !b; n = n.parentElement) b = [...n.querySelectorAll('button, a')].find((x) => x.textContent.trim() === '有効化');
    if (!b) throw new Error('no 有効化 for bacs');
    b.click();
  });
  await wait(6000);
  const after = await cap.eval(() => location.href);
  cap.data.bacsFlow = after !== before && /section=bacs/.test(after) ? 'settings' : 'list';
  log('bacs 有効化 →', cap.data.bacsFlow, after);
  if (cap.data.bacsFlow === 'list') {
    await cap.capture('offline-enabled');
    await go('/wp-admin/admin.php?page=wc-settings&tab=checkout&section=bacs', '#wpbody-content');
    await wait(5000);
  }
  // the settings (React): enabled, then the account through 「+ アカウントを追加」
  const enabledBox = '.woocommerce-settings-payments input.components-checkbox-control__input, #inspector-checkbox-control-0';
  log('bacs enabled', await cap.eval((s) => { const c = document.querySelector(s); return c && c.checked; }, enabledBox));
  await cap.capture('bacs');
  await cap.eval(() => window.scrollTo(0, 99999));
  await wait(800);
  await cap.capture('bacs-bottom');
  await cap.eval(() => [...document.querySelectorAll('button')].find((x) => /アカウントを追加/.test(x.textContent)).click());
  await wait(1500);
  const byLabel = (t) => cap.eval((t) => { const l = [...document.querySelectorAll('.bank-account-modal label')].find((x) => x.textContent.replace('*', '').trim() === t); return l ? '#' + l.htmlFor : null; }, t);
  const bIds = { name: await byLabel('口座名義'), bank: await byLabel('銀行名'), num: await byLabel('口座番号') };
  log('bank modal', JSON.stringify(bIds));
  await cap.capture('bacs-modal', { inputs: [[bIds.name, 'accName'], [bIds.bank, 'bankName'], [bIds.num, 'accNumber']] });
  // (React inputs: the value through the native setter + an input event, as typing does)
  const setv = (sel, v) => cap.eval((sel, v) => { const el = document.querySelector(sel); Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(el, v); el.dispatchEvent(new Event('input', { bubbles: true })); }, sel, v);
  await setv(bIds.name, BANK.name);
  await setv(bIds.bank, BANK.bank);
  await setv(bIds.num, BANK.number);
  await wait(400);
  await cap.eval(() => [...document.querySelectorAll('.components-modal__frame button')].find((x) => x.textContent.trim() === '保存').click());
  await wait(1500);
  await cap.eval(() => window.scrollTo(0, 99999));
  await wait(500);
  await cap.capture('bacs-added');
  await cap.eval(() => [...document.querySelectorAll('button')].find((x) => x.textContent.trim() === '変更を保存').click());
  await wait(2500);
  await cap.capture('bacs-saved');
  log('bacs', JSON.stringify(await php("return [ get_option( 'woocommerce_bacs_accounts' ), get_option( 'woocommerce_bacs_settings' )['enabled'] ?? null ];")));
  await go('/wp-admin/admin.php?page=wc-settings&tab=checkout&path=/offline', '#wpbody-content');
  await wait(6000);
  await cap.capture('offline-done');
  await done('payments');

  /* ------------------------------------------------------------------ accounts */
  await go('/wp-admin/admin.php?page=wc-settings&tab=account', '#mainform');
  await cap.capture('accounts');
  await cap.eval(() => { for (const id of ['woocommerce_enable_signup_and_login_from_checkout', 'woocommerce_enable_checkout_login_reminder']) { const c = document.getElementById(id); if (c && !c.checked) c.click(); } });
  await cap.eval(() => { setTimeout(() => document.querySelector('.woocommerce-save-button').click(), 0); });
  await wait(1500);
  await cap.settle('#mainform');
  await cap.capture('accounts-saved');
  await done('accounts');

  /* ------------------------------------------------------------------ import: the real CSV importer */
  // with no products yet, 商品 opens WooCommerce's 「商品を追加」 page (WordPress redirects the empty list there)
  await go('/wp-admin/admin.php?page=wc-admin&path=%2Fadd-product&task=products&from=products-list', '#wpbody-content');
  await wait(7000);
  await cap.capture('products-empty');
  log('add-product links', JSON.stringify(await cap.eval(() => [...document.querySelectorAll('a, button')].filter((a) => /インポート|CSV|import/i.test(a.textContent + (a.getAttribute('href') || ''))).map((a) => [a.textContent.trim().slice(0, 50), a.getAttribute('href'), a.className.slice(0, 60)]))));
  await go('/wp-admin/edit.php?post_type=product&page=product_importer', '#upload');
  await cap.capture('import-upload');
  const csvFile = path.join(os.tmpdir(), 'products-woocommerce.csv');
  fs.writeFileSync(csvFile, F.CSV);
  const input = await cap.frame.$('#upload');
  await input.uploadFile(csvFile);
  await wait(800);
  await cap.capture('import-upload-chosen');
  await cap.eval(() => { setTimeout(() => document.querySelector('.woocommerce-importer button[type="submit"], button[name="save_step"]').click(), 0); });
  await wait(2000);
  await cap.settle('.wc-importer-mapping-table, .woocommerce-importer-mapping-table, select[name^="map_to"]');
  await cap.capture('import-mapping');
  // the import itself: WooCommerce's own importer (WC_Product_CSV_Importer) with the mapping the screen shows — run on
  // the server side (the screen's batched AJAX loop is very slow in the Playground's WebAssembly PHP); then the importer's
  // real 「完了しました」 screen with its counts
  const mapping = await cap.eval(() => Object.fromEntries([...document.querySelectorAll('select[name^="map_to"]')].map((s) => {
    const i = s.name.match(/\d+/)[0];
    const from = document.querySelector(`input[name="map_from[${i}]"]`);
    return [from ? from.value : i, s.value];
  })));
  log('mapping', JSON.stringify(mapping));
  // in batches, as the screen's own loop does (start_pos / lines → the importer's file position)
  await php("file_put_contents( wp_upload_dir()['basedir'] . '/products-woocommerce.csv', $data ); return true;", F.CSV);
  const res = { imported: 0, variations: 0, failed: 0, updated: 0, skipped: 0, errors: [] };
  for (let pos = 0, guard = 0; pos >= 0 && guard < 80; guard++) {
    const t0 = Date.now();
    const b = await php(`include_once WC_ABSPATH . 'includes/import/class-wc-product-csv-importer.php';
      $importer = new WC_Product_CSV_Importer( wp_upload_dir()['basedir'] . '/products-woocommerce.csv', [ 'mapping' => $data['mapping'], 'parse' => true, 'update_existing' => false, 'delimiter' => ',', 'prevent_timeouts' => false, 'start_pos' => $data['pos'], 'lines' => 12 ] );
      $r = $importer->import();
      return [ 'imported' => count( $r['imported'] ), 'variations' => count( $r['imported_variations'] ?? [] ), 'failed' => count( $r['failed'] ), 'updated' => count( $r['updated'] ), 'skipped' => count( $r['skipped'] ),
        'errors' => array_slice( array_map( fn( $e ) => $e->get_error_message(), $r['failed'] ), 0, 3 ), 'pos' => $importer->get_file_position(), 'pct' => $importer->get_percent_complete() ];`, { mapping, pos });
    for (const k of ['imported', 'variations', 'failed', 'updated', 'skipped']) res[k] += b[k];
    res.errors.push(...b.errors);
    log(`  import ${b.pct}% (+${b.imported}, ${((Date.now() - t0) / 1000).toFixed(1)} s)`);
    pos = b.pct >= 100 ? -1 : b.pos;
  }
  log('import', JSON.stringify(res));
  cap.data.import = res;
  // the categories get the live shop's slugs (the importer makes them from the Japanese names)
  await php("foreach ( $data as $name => $slug ) { $t = get_term_by( 'name', $name, 'product_cat' ); if ( $t ) wp_update_term( $t->term_id, 'product_cat', [ 'slug' => $slug ] ); } return true;", {
    'おちょこ': 'oc', 'お食い初め': 'fm', 'タンブラー': 'tb', 'フリーカップ': 'fc', 'フリー鉢': 'fh', '全ての商品': 'all', '大皿': 'lp', '客人碗': 'kj', '小鉢': 'sb',
    '急須 | 片口': 'tp', '抹茶': 'mt', '桐箱': 'kb', '茶筌立て・その他商品': 'others', '豆皿・平皿': 'mz', '風流抹茶碗': 'fr', '香炉｜インセンスホルダー': 'ih',
  });
  // 「完了しました」 (the importer's done step checks its nonce)
  const nonce = await php("return wp_create_nonce( 'woocommerce-csv-importer' );");
  await go(`/wp-admin/edit.php?post_type=product&page=product_importer&step=done&_wpnonce=${nonce}&products-imported=${res.imported}&products-imported-variations=${res.variations}&products-failed=${res.failed}&products-updated=${res.updated}&products-skipped=${res.skipped}`, '.woocommerce-importer');
  await wait(1200);
  await cap.capture('import-done');
  await done('import');

  /* ------------------------------------------------------------------ products: images, the list, the pair price */
  const ids = await php("$o = []; foreach ( wc_get_products( [ 'limit' => -1, 'status' => 'publish', 'type' => [ 'simple', 'variable' ], 'return' => 'objects' ] ) as $p ) $o[ $p->get_sku() ] = $p->get_id(); return $o;");
  log('products', Object.keys(ids).length);
  // which rows the lists show: all products (page 1) and the category フリーカップ
  await go('/wp-admin/edit.php?post_type=product', '#the-list');
  const page1 = await cap.eval(() => [...document.querySelectorAll('#the-list tr')].map((tr) => +tr.id.replace('post-', '')));
  const fcIds = await php("return wc_get_products( [ 'limit' => -1, 'category' => [ 'fc' ], 'return' => 'ids' ] );");
  const wanted = new Set([...page1, ...fcIds, ids[F.skuOf(F.PR.find((r) => r[2] === 'fc-zen'))]]);
  const bySku = Object.fromEntries(Object.entries(ids).map(([sku, id]) => [id, sku]));
  for (const pid of wanted) {
    const r = F.PR.find((x) => F.skuOf(x) === bySku[pid]);
    if (!r || !r[11]) continue;
    try {
      const buf = Buffer.from(await (await fetch(r[11])).arrayBuffer());
      const name = decodeURIComponent(r[11].split('/').pop()).replace(/-300x300(\.[a-z]+)$/i, '$1');
      const mid = await cap.media(name, buf, path.parse(name).name);
      await php('set_post_thumbnail( $data[0], $data[1] ); return true;', [pid, mid]);
    } catch (e) { log('image', r[2], e.message); }
  }
  await go('/wp-admin/edit.php?post_type=product', '#the-list');
  await cap.capture('products');
  await go('/wp-admin/edit.php?post_type=product&product_cat=fc', '#the-list');
  await cap.capture('products-fc');
  // 禅 フリーカップ: the variations tab, the pair variation open (its price empty)
  const zen = ids[F.skuOf(F.PR.find((r) => r[2] === 'fc-zen'))];
  await go(`/wp-admin/post.php?post=${zen}&action=edit`, '#woocommerce-product-data');
  await click('.variations_tab a');
  await wait(4000);
  await cap.eval(() => { const v = [...document.querySelectorAll('.woocommerce_variation')]; const pair = v.find((x) => /ペア/.test(x.querySelector('h3').textContent)); if (pair) { pair.querySelector('h3').click(); pair.querySelector('h3').scrollIntoView({ block: 'center' }); } });
  await wait(1500);
  const pairIdx = await cap.eval(() => { const v = [...document.querySelectorAll('.woocommerce_variation')]; return v.findIndex((x) => /ペア/.test(x.querySelector('h3').textContent)); });
  log('pair variation index', pairIdx);
  await cap.capture('product-edit', { inputs: [[`#variable_regular_price_${pairIdx}`, 'pairPrice']] });
  await cap.type(`#variable_regular_price_${pairIdx}`, String(F.PR.find((r) => r[2] === 'fc-zen')[6]));
  await click('.save-variation-changes');
  await wait(5000);
  await cap.eval(() => { setTimeout(() => document.getElementById('publish').click(), 0); });
  await wait(2000);
  await cap.settle('#message, .notice-success');
  await cap.capture('product-edit-saved');
  await go('/wp-admin/edit.php?post_type=product&product_cat=fc', '#the-list');
  await cap.capture('products-fc-fixed');
  cap.data.zen = zen;
  await done('products');

  /* ------------------------------------------------------------------ orders */
  const pid = (slug) => ids[F.skuOf(F.PR.find((r) => r[2] === slug))];
  const orderIds = await php(`$out = [];
    foreach ( $data as $o ) {
      $order = wc_create_order( [ 'status' => 'pending' ] );
      foreach ( $o['items'] as $it ) { $p = wc_get_product( $it[0] ); if ( $p->is_type( 'variable' ) ) { $v = $p->get_children(); $p = wc_get_product( end( $v ) ); } $order->add_product( $p, $it[1] ); }
      $c = $o['customer'];
      $addr = [ 'first_name' => $c['first'], 'last_name' => $c['last'], 'email' => $c['email'], 'phone' => '090-0000-0000', 'country' => 'JP', 'state' => $c['state'], 'city' => $c['city'], 'address_1' => $c['addr'], 'postcode' => $c['pc'] ];
      $order->set_address( $addr, 'billing' ); $order->set_address( $addr, 'shipping' );
      $ship = new WC_Order_Item_Shipping(); $ship->set_method_title( $o['shipTitle'] ); $ship->set_method_id( $o['shipId'] ); $ship->set_total( $o['ship'] ); $order->add_item( $ship );
      $order->set_payment_method( $o['pm'] ); $order->set_payment_method_title( $o['pmTitle'] );
      $order->set_date_created( $o['date'] ); $order->calculate_totals( false ); $order->save();
      $order->update_status( $o['status'] ); if ( $o['paid'] ) { $order->set_date_paid( $o['date'] ); $order->save(); }
      $out[] = $order->get_id();
    } return $out;`, [
    { customer: CUSTOMERS[0], items: [[pid('fc-zen'), 1], [pid('mt-sui'), 1]], ship: 1400, shipTitle: '定額送料', shipId: 'flat_rate', pm: 'stripe', pmTitle: 'クレジットカード（Stripe）', status: 'processing', paid: true, date: '2026-11-03T21:14:00+09:00' },
    { customer: CUSTOMERS[1], items: [[pid('lp-tsu1'), 1]], ship: 0, shipTitle: '送料無料', shipId: 'free_shipping', pm: 'bacs', pmTitle: '銀行振込', status: 'on-hold', paid: false, date: '2026-11-04T08:41:00+09:00' },
    { customer: CUSTOMERS[2], items: [[pid('oc-fug1'), 2]], ship: 2100, shipTitle: '定額送料', shipId: 'flat_rate', pm: 'stripe', pmTitle: 'クレジットカード（Stripe）', status: 'processing', paid: true, date: '2026-11-04T09:26:00+09:00' },
  ]);
  log('orders', orderIds);
  cap.data.orders = orderIds;
  await go('/wp-admin/admin.php?page=wc-orders', '#wpbody-content');
  await wait(2000);
  await cap.capture('orders');
  // the plugin as first typed (key 'shipped'), activated
  await cap.files({ 'wp-content/plugins/ninshu-shop/ninshu-shop.php': F.PLUGIN('shipped') });
  await php("activate_plugin( 'ninshu-shop/ninshu-shop.php' ); return is_plugin_active( 'ninshu-shop/ninshu-shop.php' );");
  const O = orderIds[0];
  await go(`/wp-admin/admin.php?page=wc-orders&action=edit&id=${O}`, '#order_status');
  await wait(1500);
  await cap.capture('order-edit');
  await cap.eval(() => { if (window.jQuery) window.jQuery('#order_status').select2('open'); });
  await wait(1200);
  await noBlur(true);
  await cap.capture('order-status-open');
  await noBlur(false);
  // 発送済み with the key 'shipped' → 更新: WooCommerce does not know the status
  await cap.eval(() => { const s = document.getElementById('order_status'); s.value = 'shipped'; if (window.jQuery) { window.jQuery(s).trigger('change'); window.jQuery(s).select2('close'); } });
  await wait(600);
  await cap.eval(() => { setTimeout(() => document.querySelector('button.save_order').click(), 0); });
  await wait(2000);
  await cap.settle('#order_status');
  await wait(1500);
  await cap.capture('order-bug');
  cap.data.bugStatus = await cap.eval(() => document.getElementById('order_status').value);
  // the fixed plugin ('wc-shipped'): the status is known now
  await cap.files({ 'wp-content/plugins/ninshu-shop/ninshu-shop.php': F.PLUGIN('wc-shipped') });
  await go(`/wp-admin/admin.php?page=wc-orders&action=edit&id=${O}`, '#order_status');
  await wait(1500);
  await cap.capture('order-edit-2', { inputs: [['#add_order_note', 'note']] });
  await cap.eval(() => { if (window.jQuery) window.jQuery('#order_status').select2('open'); });
  await wait(1200);
  await noBlur(true);
  await cap.capture('order-status-open-2');
  await noBlur(false);
  await cap.eval(() => { if (window.jQuery) window.jQuery('#order_status').select2('close'); });
  // the note (送り状番号) + 発送済み → 更新
  await php("$o = wc_get_order( $data ); $o->add_order_note( 'ヤマト運輸 送り状番号 4580-1123-0987 で発送しました。', 0, true ); return true;", O);
  await cap.eval(() => { const s = document.getElementById('order_status'); s.value = 'wc-shipped'; if (window.jQuery) window.jQuery(s).trigger('change'); });
  await cap.eval(() => { setTimeout(() => document.querySelector('button.save_order').click(), 0); });
  await wait(2000);
  await cap.settle('#order_status');
  await wait(1500);
  await cap.capture('order-shipped');
  await go('/wp-admin/admin.php?page=wc-orders', '#wpbody-content');
  await wait(2000);
  await cap.capture('orders-final');

  await cap.finish();
  require('./fix-wp-snapshot');   // the screens' times → the video's clock, the orders list as WooCommerce shows it then
})().catch((e) => { console.error(e); process.exit(1); });
