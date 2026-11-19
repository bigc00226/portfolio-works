/*
 * The source of the migration: the local EC-CUBE 3.0.18-p7 copy (setup-ec3.js → ../eccube-local/ec3-cagiana, PHP 7.4 in
 * WebAssembly, SQLite) with cagiana.jp's public data, its real admin screens, and the real backup the EC-CUBE 4 side imports.
 *
 *   node tools/snapshots/ec-cagiana-migration/capture-ec3.js [screenshot folder]
 *   → public/videos/ec-cagiana-migration/js/ec-snapshot.js (EC-CUBE 3 screens, assets/ec3/) and work/backup-*.tar.gz
 *   then capture-ec.js (EC-CUBE 4.3, merged into the same ec-snapshot.js)
 *
 *   data     the public data (shop-data.json: 43 categories with the live ids, 37 products with the live ids / names / codes /
 *            prices (税込 → 税抜, 10 %) / descriptions / pictures / 規格, the INFORMATION items as 新着情報) and invented
 *            members (見本 …, @example.com) with orders — written with EC-CUBE 3's own password encoding (sha256 + auth_magic)
 *   plugin   EC-CUBE's official "EC-CUBE4系移行用バックアッププラグイン(3.0系)" (github.com/EC-CUBE/data-backup-plugin-v3) installed
 *            with app/console plugin:develop install --path=… and enabled
 *   screens  admin login / home / plugins / products / product 103 / members / orders / the backup plugin
 *   backup   the plugin's バックアップ実行 (the real POST of its form) → work/backup-1.tar.gz; then one more member and order
 *            (the orders that come in before the switch-over) → work/backup-2.tar.gz (the 会員・受注のみ re-run on the day)
 */
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const ROOT = path.resolve(__dirname, '../../..');
const RT = require(path.join(ROOT, 'tools/eccube/runtime'));
const ECC = require(path.join(ROOT, 'tools/eccube/capture'));
const ID = 'ec-cagiana-migration';
const EC3 = path.join(RT.LOCAL, 'ec3-cagiana');
const WORK = path.join(__dirname, 'work');
const SHOTS = process.argv[2] || null;
const SHOP = JSON.parse(fs.readFileSync(path.join(__dirname, 'shop-data.json'), 'utf8'));
const MEMBERS = require('./members.js');
const TAR = path.join(process.env.SystemRoot || 'C:/Windows', 'System32', 'tar.exe');
const log = (...a) => console.log(`[${new Date().toLocaleTimeString('sv-SE')}]`, ...a);

const LOAD_PHP = String.raw`<?php
$data = json_decode(file_get_contents('/srv/eccube/var/cagiana-data.json'), true);
$cfg = \Symfony\Component\Yaml\Yaml::parse(file_get_contents('/srv/eccube/app/config/eccube/config.yml'));
$pdo = new PDO('sqlite:/srv/eccube/app/config/eccube/eccube.db');
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
$cols = [];
$ins = function ($t, $row) use ($pdo, &$cols) {
    if (!isset($cols[$t])) $cols[$t] = $pdo->query("PRAGMA table_info($t)")->fetchAll(PDO::FETCH_ASSOC);
    foreach ($cols[$t] as $c) {
        if (array_key_exists($c['name'], $row) || !$c['notnull'] || $c['dflt_value'] !== null || $c['pk']) continue;
        $row[$c['name']] = preg_match('/INT|NUMERIC|DECIMAL|SMALLINT|BOOL/i', $c['type']) ? 0 : (preg_match('/DATE|TIME/i', $c['type']) ? date('Y-m-d H:i:s') : '');
    }
    $k = array_keys($row);
    $st = $pdo->prepare("INSERT INTO $t (" . implode(',', $k) . ') VALUES (' . implode(',', array_fill(0, count($k), '?')) . ')');
    $st->execute(array_values($row));
    return (int) $pdo->lastInsertId();
};
$now = '2026-10-01 09:00:00';
$pdo->beginTransaction();
foreach (['dtb_product_category', 'dtb_product_image', 'dtb_product_tag', 'dtb_product_stock', 'dtb_customer_favorite_product', 'dtb_product_class', 'dtb_product',
          'dtb_class_category', 'dtb_class_name', 'dtb_category', 'dtb_category_count', 'dtb_category_total_count', 'dtb_news',
          'dtb_shipment_item', 'dtb_shipping', 'dtb_order_detail', 'dtb_mail_history', 'dtb_order', 'dtb_customer_address', 'dtb_customer'] as $t) {
    $pdo->exec("DELETE FROM $t");
}
// shop
$pdo->prepare("UPDATE dtb_base_info SET shop_name = ?, email01 = ?, email02 = ?, email03 = ?, email04 = ?, delivery_free_amount = NULL, update_date = ?")
    ->execute(['CAGIANA《カジーナ》', 'info@example.com', 'info@example.com', 'info@example.com', 'info@example.com', $now]);
$pdo->exec("UPDATE dtb_tax_rule SET tax_rate = 10, apply_date = '2019-10-01 00:00:00'");
$pdo->prepare("UPDATE dtb_delivery SET name = ?, service_name = ?, description = ? WHERE delivery_id = 1")->execute(['ヤマト運輸', '宅急便', '配送料無料']);
$pdo->exec("UPDATE dtb_delivery SET del_flg = 1 WHERE delivery_id <> 1");
$pdo->exec("UPDATE dtb_delivery_fee SET fee = 0");
$pdo->exec("UPDATE dtb_payment SET del_flg = 1 WHERE payment_method NOT IN ('銀行振込', '代金引換')");
// categories (rank: EC-CUBE lists the highest first)
$rank = 1000;
foreach ($data['categories'] as $top) {
    $ins('dtb_category', ['category_id' => $top['id'], 'category_name' => $top['name'], 'parent_category_id' => null, 'level' => 1, 'rank' => $rank--, 'creator_id' => 2, 'create_date' => $now, 'update_date' => $now, 'del_flg' => 0]);
    foreach ($top['children'] as $ch) $ins('dtb_category', ['category_id' => $ch['id'], 'category_name' => $ch['name'], 'parent_category_id' => $top['id'], 'level' => 2, 'rank' => $rank--, 'creator_id' => 2, 'create_date' => $now, 'update_date' => $now, 'del_flg' => 0]);
}
// 規格
foreach ($data['classNames'] as $cn) {
    $ins('dtb_class_name', ['class_name_id' => $cn['id'], 'name' => $cn['name'], 'rank' => $cn['id'], 'creator_id' => 2, 'create_date' => $now, 'update_date' => $now, 'del_flg' => 0]);
    $r = count($cn['cats']);
    foreach ($cn['cats'] as $cc) $ins('dtb_class_category', ['class_category_id' => $cc['id'], 'class_name_id' => $cn['id'], 'name' => $cc['name'], 'rank' => $r--, 'creator_id' => 2, 'create_date' => $now, 'update_date' => $now, 'del_flg' => 0]);
}
// products
$pc = [];
foreach ($data['products'] as $p) {
    $ins('dtb_product', ['product_id' => $p['id'], 'creator_id' => 2, 'status' => 1, 'name' => $p['name'], 'note' => null, 'description_list' => null, 'description_detail' => $p['description'],
        'search_word' => $p['maker'], 'free_area' => null, 'del_flg' => 0, 'create_date' => $p['created'], 'update_date' => $now]);
    foreach ($p['images'] as $i => $f) $ins('dtb_product_image', ['product_id' => $p['id'], 'creator_id' => 2, 'file_name' => $f, 'rank' => $i + 1, 'create_date' => $p['created']]);
    $r = 1;
    foreach ($p['categories'] as $cid) $ins('dtb_product_category', ['product_id' => $p['id'], 'category_id' => $cid, 'rank' => $r++]);
    $rows = $p['classes'] ?: [['cc1' => null, 'code' => $p['code'], 'price' => $p['price']]];
    if ($p['classes']) array_unshift($rows, ['cc1' => null, 'code' => null, 'price' => $p['price'], 'hidden' => true]);
    foreach ($rows as $row) {
        $id = $ins('dtb_product_class', ['product_id' => $p['id'], 'product_type_id' => 1, 'class_category_id1' => $row['cc1'], 'class_category_id2' => null, 'delivery_date_id' => null, 'creator_id' => 2,
            'product_code' => $row['code'], 'stock' => null, 'stock_unlimited' => 1, 'sale_limit' => null, 'price01' => null, 'price02' => (int) round($row['price'] / 1.1), 'delivery_fee' => null,
            'create_date' => $p['created'], 'update_date' => $now, 'del_flg' => empty($row['hidden']) ? 0 : 1]);
        $ins('dtb_product_stock', ['product_class_id' => $id, 'creator_id' => 2, 'stock' => null, 'create_date' => $p['created'], 'update_date' => $now]);
        $pc[$p['id']][$row['cc1'] ?? 0] = ['id' => $id, 'code' => $row['code'], 'price' => (int) round($row['price'] / 1.1)];
    }
}
// 新着情報
$r = count($data['news']);
foreach ($data['news'] as $n) $ins('dtb_news', ['news_date' => $n['date'], 'rank' => $r--, 'news_title' => $n['title'], 'news_comment' => $n['text'], 'news_url' => $n['url'], 'news_select' => 0, 'link_method' => 0, 'creator_id' => 2, 'create_date' => $n['date'], 'update_date' => $n['date'], 'del_flg' => 0]);
$pdo->commit();
$done = ['products' => count($data['products']), 'classes' => array_sum(array_map('count', $pc))];
file_put_contents('/srv/eccube/var/cagiana-pc.json', json_encode($pc));
echo json_encode($done), "\n";
`;

/** members and orders (invented) — also the later ones (stage 2): EC-CUBE 3's password = hash_hmac(sha256, pass:auth_magic, salt) */
const PEOPLE_PHP = String.raw`<?php
$in = json_decode(file_get_contents('/srv/eccube/var/cagiana-people.json'), true);
$pc = json_decode(file_get_contents('/srv/eccube/var/cagiana-pc.json'), true);
$prod = []; foreach (json_decode(file_get_contents('/srv/eccube/var/cagiana-data.json'), true)['products'] as $p) $prod[$p['id']] = $p;
$cfg = \Symfony\Component\Yaml\Yaml::parse(file_get_contents('/srv/eccube/app/config/eccube/config.yml'));
$pdo = new PDO('sqlite:/srv/eccube/app/config/eccube/eccube.db');
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
$cols = [];
$ins = function ($t, $row) use ($pdo, &$cols) {
    if (!isset($cols[$t])) $cols[$t] = $pdo->query("PRAGMA table_info($t)")->fetchAll(PDO::FETCH_ASSOC);
    foreach ($cols[$t] as $c) {
        if (array_key_exists($c['name'], $row) || !$c['notnull'] || $c['dflt_value'] !== null || $c['pk']) continue;
        $row[$c['name']] = preg_match('/INT|NUMERIC|DECIMAL|SMALLINT|BOOL/i', $c['type']) ? 0 : (preg_match('/DATE|TIME/i', $c['type']) ? date('Y-m-d H:i:s') : '');
    }
    $k = array_keys($row);
    $st = $pdo->prepare("INSERT INTO $t (" . implode(',', $k) . ') VALUES (' . implode(',', array_fill(0, count($k), '?')) . ')');
    $st->execute(array_values($row));
    return (int) $pdo->lastInsertId();
};
$pay = $pdo->query("SELECT payment_id, payment_method AS method, charge FROM dtb_payment WHERE del_flg = 0")->fetchAll(PDO::FETCH_ASSOC);
$payBy = []; foreach ($pay as $p) $payBy[$p['method']] = $p;
$cnames = $pdo->query("SELECT cc.class_category_id, cc.name AS cc, cn.name AS cn FROM dtb_class_category cc JOIN dtb_class_name cn ON cn.class_name_id = cc.class_name_id")->fetchAll(PDO::FETCH_ASSOC);
$ccBy = []; foreach ($cnames as $c) $ccBy[$c['class_category_id']] = $c;
$pdo->beginTransaction();
$custIds = [];
foreach ($in['members'] as $m) {
    $salt = substr(hash('sha256', 'salt-' . $m['email']), 0, 10);
    $ins('dtb_customer', ['customer_id' => $m['id'], 'status' => 2, 'sex' => $m['sex'], 'job' => null, 'pref' => $m['pref'], 'name01' => $m['name01'], 'name02' => $m['name02'], 'kana01' => $m['kana01'], 'kana02' => $m['kana02'],
        'company_name' => null, 'zip01' => substr($m['zip'], 0, 3), 'zip02' => substr($m['zip'], 3), 'zipcode' => $m['zip'], 'addr01' => $m['addr01'], 'addr02' => $m['addr02'], 'email' => $m['email'],
        'tel01' => '000', 'tel02' => '0000', 'tel03' => sprintf('%04d', $m['id']), 'birth' => $m['birth'], 'password' => hash_hmac('sha256', $m['password'] . ':' . $cfg['auth_magic'], $salt), 'salt' => $salt,
        'secret_key' => substr(hash('sha256', 'key-' . $m['email']), 0, 32), 'buy_times' => 0, 'buy_total' => 0, 'create_date' => $m['created'], 'update_date' => $m['created'], 'del_flg' => 0]);
}
foreach ($in['orders'] as $o) {
    $m = null; foreach ($in['allMembers'] as $x) if ($x['id'] == $o['customer']) $m = $x;
    $sub = 0; $tax = 0; $lines = [];
    foreach ($o['items'] as $it) {
        $row = $pc[$it['product']][$it['cc'] ?? 0] ?? array_values($pc[$it['product']])[0];
        $c = $it['cc'] ? $ccBy[$it['cc']] : null;
        $lines[] = ['p' => $prod[$it['product']], 'pc' => $row, 'c' => $c, 'q' => $it['q']];
        $sub += round($row['price'] * 1.1) * $it['q']; $tax += round($row['price'] * 0.1) * $it['q'];
    }
    $p = $payBy[$o['payment']];
    $charge = (int) $p['charge'];
    $total = $sub + $charge;
    $addr = ['name01' => $m['name01'], 'name02' => $m['name02'], 'kana01' => $m['kana01'], 'kana02' => $m['kana02'], 'zip01' => substr($m['zip'], 0, 3), 'zip02' => substr($m['zip'], 3), 'zipcode' => $m['zip'],
        'pref' => $m['pref'], 'addr01' => $m['addr01'], 'addr02' => $m['addr02'], 'tel01' => '000', 'tel02' => '0000', 'tel03' => sprintf('%04d', $m['id'])];
    $oid = $ins('dtb_order', ['order_id' => $o['id'], 'pre_order_id' => substr(hash('sha1', 'pre' . $o['id']), 0, 40), 'customer_id' => $m['id'], 'order_country_id' => null, 'order_sex' => $m['sex'], 'order_job' => null,
        'payment_id' => $p['payment_id'], 'device_type_id' => 10, 'message' => $o['message'] ?? null,
        'order_name01' => $addr['name01'], 'order_name02' => $addr['name02'], 'order_kana01' => $addr['kana01'], 'order_kana02' => $addr['kana02'], 'order_company_name' => null, 'order_email' => $m['email'],
        'order_tel01' => $addr['tel01'], 'order_tel02' => $addr['tel02'], 'order_tel03' => $addr['tel03'], 'order_zip01' => $addr['zip01'], 'order_zip02' => $addr['zip02'], 'order_zipcode' => $addr['zipcode'],
        'order_pref' => $addr['pref'], 'order_addr01' => $addr['addr01'], 'order_addr02' => $addr['addr02'], 'order_birth' => $m['birth'],
        'subtotal' => $sub, 'discount' => 0, 'delivery_fee_total' => 0, 'charge' => $charge, 'tax' => $tax, 'total' => $total, 'payment_total' => $total, 'payment_method' => $p['method'], 'note' => null,
        'create_date' => $o['date'], 'update_date' => $o['updated'] ?? $o['date'], 'order_date' => $o['date'], 'commit_date' => $o['shipped'] ?? null, 'payment_date' => $o['paid'] ?? null, 'del_flg' => 0, 'status' => $o['status']]);
    $sid = $ins('dtb_shipping', ['order_id' => $oid, 'shipping_country_id' => null, 'shipping_pref' => $addr['pref'], 'delivery_id' => 1, 'time_id' => null, 'fee_id' => null,
        'shipping_name01' => $addr['name01'], 'shipping_name02' => $addr['name02'], 'shipping_kana01' => $addr['kana01'], 'shipping_kana02' => $addr['kana02'], 'shipping_company_name' => null,
        'shipping_tel01' => $addr['tel01'], 'shipping_tel02' => $addr['tel02'], 'shipping_tel03' => $addr['tel03'], 'shipping_zip01' => $addr['zip01'], 'shipping_zip02' => $addr['zip02'], 'shipping_zipcode' => $addr['zipcode'],
        'shipping_addr01' => $addr['addr01'], 'shipping_addr02' => $addr['addr02'], 'shipping_delivery_name' => 'ヤマト運輸', 'shipping_delivery_time' => null, 'shipping_delivery_date' => null,
        'shipping_delivery_fee' => 0, 'shipping_commit_date' => $o['shipped'] ?? null, 'rank' => null, 'create_date' => $o['date'], 'update_date' => $o['date'], 'del_flg' => 0]);
    foreach ($lines as $l) {
        $common = ['order_id' => $oid, 'product_id' => $l['p']['id'], 'product_class_id' => $l['pc']['id'], 'product_name' => $l['p']['name'], 'product_code' => $l['pc']['code'],
            'class_name1' => $l['c'] ? $l['c']['cn'] : null, 'class_name2' => null, 'class_category_name1' => $l['c'] ? $l['c']['cc'] : null, 'class_category_name2' => null, 'price' => $l['pc']['price'], 'quantity' => $l['q']];
        $ins('dtb_order_detail', $common + ['tax_rate' => 10, 'tax_rule' => 1]);
        $ins('dtb_shipment_item', $common + ['shipping_id' => $sid]);
    }
    if ($o['status'] != 3) $pdo->prepare('UPDATE dtb_customer SET buy_times = buy_times + 1, buy_total = buy_total + ?, first_buy_date = COALESCE(first_buy_date, ?), last_buy_date = ? WHERE customer_id = ?')->execute([$total, $o['date'], $o['date'], $m['id']]);
}
$pdo->commit();
$q = fn ($s) => (int) $pdo->query($s)->fetchColumn();
echo json_encode(['products' => $q('SELECT count(*) FROM dtb_product WHERE del_flg = 0'), 'product_class' => $q('SELECT count(*) FROM dtb_product_class'), 'categories' => $q('SELECT count(*) FROM dtb_category'),
    'customers' => $q('SELECT count(*) FROM dtb_customer WHERE del_flg = 0'), 'orders' => $q('SELECT count(*) FROM dtb_order WHERE del_flg = 0'), 'images' => $q('SELECT count(*) FROM dtb_product_image'), 'news' => $q('SELECT count(*) FROM dtb_news')]), "\n";
`;

/** the shop data as EC-CUBE 3 rows: categories (golf shoes / leather goods with their live ids), 規格, products */
function shopRows() {
  const cats = SHOP.categories.map((c) => ({ ...c, children: [...c.children] }));
  const leather = cats.find((c) => c.name === 'レザーアイテム');
  if (leather) leather.id = 357;   // the live id (the category buttons of its products)
  const golf = cats.find((c) => c.id === 381);
  if (golf && !golf.children.some((c) => c.id === 293)) golf.children.push({ id: 293, name: 'ゴルフシューズ' });
  const known = new Set(cats.flatMap((c) => [c.id, ...c.children.map((x) => x.id)]));
  const classNames = [];
  const byLabel = {};
  const products = SHOP.products.map((p, i) => {
    let catIds = p.categories.map((c) => c.id).filter((id) => known.has(id));
    if (/ゴルフ|GOLF|スパイクレス/i.test(p.name + p.categories.map((c) => c.name).join('')) && !catIds.includes(293)) catIds = [293, ...catIds.filter((x) => x !== 381)];
    const parent = cats.find((c) => c.children.some((x) => catIds.includes(x.id)));
    if (parent && !catIds.includes(parent.id)) catIds.push(parent.id);
    let classes = null;
    if (p.class1.length) {
      const label = p.class1.some((o) => /^\d|cm/.test(o.name)) ? 'サイズ' : p.classLabel;
      if (!byLabel[label]) { byLabel[label] = { id: classNames.length + 1, name: label, cats: [] }; classNames.push(byLabel[label]); }
      const cn = byLabel[label];
      classes = p.class1.map((o) => {
        if (!cn.cats.some((c) => c.id === o.id)) cn.cats.push({ id: o.id, name: o.name });
        const v = p.classCategories && p.classCategories[o.id] && Object.values(p.classCategories[o.id])[0];
        return { cc1: o.id, code: (v && v.product_code) || p.code, price: v && v.price02 ? +String(v.price02).replace(/,/g, '') : p.price };
      });
    }
    const d = new Date(Date.UTC(2019, 0, 10) + (p.id * 5.3 + i) * 86400000);
    return { id: p.id, name: p.name, maker: p.maker, code: p.code.split(' ～ ')[0], price: p.price, description: p.description, images: p.images, categories: catIds, classes,
      created: d.toISOString().slice(0, 10) + ' 10:00:00' };
  });
  const news = SHOP.news.map((n, i) => {
    const m = /^(\d{4})\/(\d{2})/.exec(n.title);
    const date = m ? `${m[1]}-${m[2]}-01 10:00:00` : `2025-${String(12 - i).padStart(2, '0')}-01 10:00:00`;
    return { title: n.title, text: n.text, url: n.url, date };
  });
  return { categories: cats, classNames, products, news };
}

const sh = (args) => { const r = spawnSync(TAR, args, { encoding: 'utf8' }); if (r.status !== 0) throw new Error('tar ' + args.join(' ') + ': ' + r.stderr); return r.stdout; };

(async () => {
  fs.mkdirSync(WORK, { recursive: true });
  // ---------------------------------------------------------------- data
  const rows = shopRows();
  fs.writeFileSync(path.join(EC3, 'var/cagiana-data.json'), JSON.stringify(rows));
  const imgDir = path.join(EC3, 'html/upload/save_image');
  for (const f of fs.readdirSync(imgDir)) if (!f.startsWith('.')) fs.rmSync(path.join(imgDir, f), { force: true });
  for (const p of rows.products) for (const f of p.images) if (fs.existsSync(path.join(__dirname, 'img', f))) fs.copyFileSync(path.join(__dirname, 'img', f), path.join(imgDir, f));
  let r = await RT.runPhp(EC3, LOAD_PHP.replace('<?php', "<?php require '/srv/eccube/autoload.php';"));
  log('shop data', r.code, r.out.trim(), r.err.trim().slice(-400));
  if (r.code !== 0) throw new Error('load failed');
  fs.writeFileSync(path.join(EC3, 'var/cagiana-people.json'), JSON.stringify({ members: MEMBERS.members, orders: MEMBERS.orders, allMembers: MEMBERS.members }));
  r = await RT.runPhp(EC3, PEOPLE_PHP.replace('<?php', "<?php require '/srv/eccube/autoload.php';"));
  log('members / orders', r.code, r.out.trim(), r.err.trim().slice(-400));
  if (r.code !== 0) throw new Error('people failed');
  const counts1 = JSON.parse(r.out.trim().split('\n').pop());

  // ---------------------------------------------------------------- the backup plugin (official, EC-CUBE 3.0)
  const bkSrc = path.join(RT.LOCAL, 'dl3/plugins/bk/data-backup-plugin-v3-master');
  const bkTar = path.join(EC3, 'var/DataBackup3.tar.gz');
  if (!fs.existsSync(path.join(EC3, 'app/Plugin/DataBackup3'))) {
    sh(['-czf', bkTar, '-C', bkSrc, 'config.yml', 'PluginManager.php', 'Controller', 'Form', 'Resource', 'Service', 'ServiceProvider', 'backup', 'composer.json', 'README.md']);
    for (const args of [['plugin:develop', 'install', '--path=/srv/eccube/var/DataBackup3.tar.gz'], ['plugin:develop', 'enable', '--code=DataBackup3']]) {
      const c = await RT.consoleRun(EC3, args);
      log('app/console', args.join(' '), '→', c.code, (c.out + c.err).trim().slice(-300));
    }
  }

  // ---------------------------------------------------------------- the screens
  const cap = await ECC.start({ id: ID, version: 3, dir: EC3, assets: 'assets/ec3', site: 'http://localhost:8030', date: '2026-11-11', time: '10:12', shots: SHOTS, admin: '/admin' });
  const { page } = cap;
  const D = cap.data;
  D.ec3 = { counts: counts1, authMagic: fs.readFileSync(path.join(EC3, 'app/config/eccube/config.yml'), 'utf8').match(/auth_magic: (\S+)/)[1], version: '3.0.18-p7' };
  /** EC-CUBE 3's admin lists show results after the search (the empty search = everything) */
  const listAll = async (rel, ready) => {
    await cap.go(rel, 'body');
    const has = await page.evaluate((s) => !!document.querySelector(s), ready);
    if (!has) {
      await Promise.all([page.waitForNavigation({ waitUntil: 'load' }), page.evaluate(() => { const f = document.querySelector('#search_form') || document.querySelector('form'); const b = f.querySelector('button[type=submit]'); if (b) b.click(); else f.submit(); })]);
      await cap.settle('body');
    }
  };
  try {
    await cap.go('/admin/login', '#login_id');
    await cap.capture('ec3-login', { inputs: [['#login_id', 'login_id'], ['#password', 'password']] });
    await cap.login();
    await cap.capture('ec3-home');
    await cap.go('/admin/store/plugin', 'body');
    await cap.capture('ec3-plugins');
    await listAll('/admin/product', '#result_list__list, .search-result, table tbody tr');
    await cap.capture('ec3-products');
    await cap.go('/admin/product/product/103/edit', 'body');
    await cap.capture('ec3-product-103');
    await listAll('/admin/customer', '#result_list__list, table tbody tr');
    await cap.capture('ec3-customers');
    await listAll('/admin/order', '#result_list__list, table tbody tr');
    await cap.capture('ec3-orders');
    await cap.go('/admin/plugin/DataBackup3/config', 'form');
    await cap.capture('ec3-backup');
    /** the plugin's form, really posted: the tar.gz it sends back */
    const backup = async (file) => {
      await cap.go('/admin/plugin/DataBackup3/config', 'form');
      const b64 = await page.evaluate(async () => {
        const f = document.querySelector('form');
        const res = await fetch(f.action, { method: 'POST', body: new FormData(f), credentials: 'same-origin' });
        const buf = new Uint8Array(await res.arrayBuffer());
        let s = ''; for (let i = 0; i < buf.length; i += 0x8000) s += String.fromCharCode.apply(null, buf.subarray(i, i + 0x8000));
        return { b64: btoa(s), type: res.headers.get('content-type'), disp: res.headers.get('content-disposition') };
      });
      fs.writeFileSync(file, Buffer.from(b64.b64, 'base64'));
      log('backup', path.basename(file), b64.type, b64.disp, fs.statSync(file).size, 'bytes');
      return b64.disp;
    };
    D.backup1 = { disposition: await backup(path.join(WORK, 'backup-1.tar.gz')) };
    D.backup1.list = sh(['-tvzf', path.join(WORK, 'backup-1.tar.gz')]).trim().split(/\r?\n/);
    D.images = { count: fs.readdirSync(imgDir).filter((f) => !f.startsWith('.')).length, bytes: fs.readdirSync(imgDir).reduce((n, f) => n + fs.statSync(path.join(imgDir, f)).size, 0) };
    // the orders that come in before the switch-over (one new member, two orders), then the second backup
    fs.writeFileSync(path.join(EC3, 'var/cagiana-people.json'), JSON.stringify({ members: MEMBERS.later.members, orders: MEMBERS.later.orders, allMembers: [...MEMBERS.members, ...MEMBERS.later.members] }));
    r = await RT.runPhp(EC3, PEOPLE_PHP.replace('<?php', "<?php require '/srv/eccube/autoload.php';"));
    log('later members / orders', r.code, r.out.trim(), r.err.trim().slice(-300));
    D.ec3.counts2 = JSON.parse(r.out.trim().split('\n').pop());
    await listAll('/admin/order', '#result_list__list, table tbody tr');
    await cap.capture('ec3-orders-2');
    D.backup2 = { disposition: await backup(path.join(WORK, 'backup-2.tar.gz')) };
    await cap.finish();
    process.exit(0);
  } catch (e) {
    console.error(e);
    try { log('failed at', page.url(), (await page.evaluate(() => document.body.innerText.slice(0, 400))).replace(/\s+/g, ' ')); } catch (e2) { /* gone */ }
    await cap.abort();
    process.exit(1);
  }
})().catch((e) => { console.error(e); process.exit(1); });
