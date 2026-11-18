// The real EC-CUBE 2 screens, PDFs and CSVs of the video ec-garage-forms (Garage — 帳票・PDF・CSV).
//
//   node tools/snapshots/ec-garage-forms/fetch-garage-data.js     (once: the shop's public data → data/garage.json + images)
//   node tools/snapshots/ec-garage-forms/capture-ec.js [--shots=<folder>]
//   node tools/webp.js ec-garage-forms
//
// EC-CUBE 2 (eccube2-weekly-20261110, the 2.25 line, PHP 8.3 in WebAssembly, SQLite) in ../eccube-local/inst/ec-garage-forms,
// started fresh each run (tools/eccube/capture.js). Then, as the video does it:
//   1. the shop's data: shop info and 特定商取引法 (from the live 特定商取引法 page), its categories, 25 products with their
//      colours / 品番 / prices / images (data/garage.json), its delivery and payment methods (ご利用ガイド); 8 fictional
//      customers and orders (2026/11/12–16)
//   2. 受注管理 and 帳票出力 → the default 納品書 PDF (EC-CUBE's own sample logo)
//   3. the Garage logo (logo.png) + SC_Fpdf_Ex as first typed (js/garage-src.js fpdf(1)) → PDF: the table off the page;
//      fpdf(2) → PDF with the 品番 column
//   4. LC_Page_Admin_Order_Pdf_Ex → 帳票出力 for three orders (PDF一括出力) → the three-page PDF
//   5. CSV出力項目設定 (受注) and 高度な設定: the 出荷指示 SQL — SQL確認 with dtb_order.deliv_date (the real SQLite error),
//      fixed, 登録, CSV出力 → the real CSV (Shift_JIS, decoded)
//   6. 商品登録CSV: the 新着商品 of the live site as EC-CUBE's product CSV — first without 在庫数 (the real error), then
//      with 在庫無制限フラグ → registered → 商品マスター
// Each PDF is opened in Chrome's own PDF viewer at the size of the video's browser page (1920×947) and captured:
// public/videos/ec-garage-forms/assets/pdf/*.pdf + *.png (→ webp), where the parts are on screen → js/ec-files.js.
const fs = require('fs');
const path = require('path');
const ECC = require('../../eccube/capture');
const SRC = require('../../../public/videos/ec-garage-forms/js/garage-src.js');
const G = require('./data/garage.json');

const ID = 'ec-garage-forms';
const VIDEO = path.resolve(__dirname, '../../../public/videos', ID);
const IMG = path.resolve(__dirname, '../../../../eccube-local/garage-img');
const SHOTS = (process.argv.find((a) => a.startsWith('--shots=')) || '').slice(8) || null;
const DAY = { y: 2026, m: 11, d: 16 };
const { log, wait } = ECC;

/* ------------------------------------------------------------------ the shop's data (public pages) */
const clean = (s) => String(s || '').replace(/【[^】]*】/g, '').trim();
const CATALOG = G.products.filter((p) => !p.fresh);
const FRESH = G.products.filter((p) => p.fresh);
// the 新着商品 → the shop's categories (the live site files them there)
const FRESH_CAT = { 179861: '133', 179812: '15', 179746: '16,18', 179736: '18,16', 179699: '133,20', 179589: '7', 179586: '7', 179578: '22' };
// the 商品部's sheet: the gNest rows' prices pasted from the price list with thousands separators (the first CSV: "143,000")
const PRICE_SHEET = new Set([179746, 179736, 179699]);

const PREF = { 東京都: 13, 神奈川県: 14, 埼玉県: 11, 千葉県: 12, 宮城県: 4, 大阪府: 27, 北海道: 1, 愛知県: 23 };
// fictional customers and orders (the products are the shop's; names, addresses, numbers are made up)
const CUSTOMERS = [
  { id: 1, company: '株式会社リーフ・プランニング', n1: '森下', n2: '彩', k1: 'モリシタ', k2: 'アヤ', zip: ['150', '0002'], pref: '東京都', a1: '渋谷区渋谷3-9-9', a2: 'リーフビル 6F', tel: ['03', '5468', '0000'] },
  { id: 2, company: '株式会社ミナトデザイン', n1: '石田', n2: '亮介', k1: 'イシダ', k2: 'リョウスケ', zip: ['108', '0022'], pref: '東京都', a1: '港区海岸3-2-1', a2: 'ミナト第2ビル 4F', tel: ['03', '6435', '0000'] },
  { id: 3, company: '北斗会計事務所', n1: '北村', n2: '敏行', k1: 'キタムラ', k2: 'トシユキ', zip: ['330', '0063'], pref: '埼玉県', a1: 'さいたま市浦和区高砂2-8-4', a2: '浦和センタービル 3F', tel: ['048', '829', '0000'] },
  { id: 4, company: '合同会社アオバ技研', n1: '青山', n2: '直人', k1: 'アオヤマ', k2: 'ナオト', zip: ['980', '0811'], pref: '宮城県', a1: '仙台市青葉区一番町1-6-2', a2: '一番町スクエア 8F', tel: ['022', '213', '0000'] },
  { id: 5, company: '株式会社カナメ建設', n1: '要', n2: '雅之', k1: 'カナメ', k2: 'マサユキ', zip: ['530', '0001'], pref: '大阪府', a1: '大阪市北区梅田1-11-4', a2: '梅田プレイス 12F', tel: ['06', '6345', '0000'] },
  { id: 6, company: '', n1: '佐藤', n2: '由美', k1: 'サトウ', k2: 'ユミ', zip: ['231', '0023'], pref: '神奈川県', a1: '横浜市中区山下町1-5', a2: 'ハーバーテラス 702', tel: ['045', '664', '0000'] },
  { id: 7, company: '', n1: '田中', n2: '健一', k1: 'タナカ', k2: 'ケンイチ', zip: ['273', '0005'], pref: '千葉県', a1: '船橋市本町4-2-8', a2: '', tel: ['047', '432', '0000'] },
  { id: 8, company: '株式会社ノースゲート', n1: '北原', n2: '早紀', k1: 'キタハラ', k2: 'サキ', zip: ['060', '0042'], pref: '北海道', a1: '札幌市中央区大通西5-8', a2: '大通ビル 9F', tel: ['011', '252', '0000'] },
];
// payment / delivery ids as seeded below
const ORDERS = [
  { id: 120481, c: 2, date: '2026-11-12 10:42:18', status: 5, pay: 5, deliv: 2, ship: '2026-11-14', items: [['632-505', 2], ['666-988', 2]] },
  { id: 120482, c: 6, date: '2026-11-13 08:15:51', status: 5, pay: 1, deliv: 1, ship: null, items: [['435-929', 1], ['439-102', 1]] },
  { id: 120483, c: 3, date: '2026-11-13 14:27:03', status: 6, pay: 2, deliv: 2, ship: '2026-11-19', items: [['428-995', 1], ['648-889', 2]] },
  { id: 120484, c: 4, date: '2026-11-14 11:03:44', status: 1, pay: 1, deliv: 1, ship: null, items: [['435-508', 4]] },
  { id: 120485, c: 5, date: '2026-11-14 16:48:09', status: 2, pay: 2, deliv: 2, ship: '2026-11-25', items: [['698-488', 1], ['15-495', 6]] },
  { id: 120486, c: 1, date: '2026-11-15 09:31:26', status: 1, pay: 5, deliv: 2, ship: '2026-11-20', items: [['797-047', 1], ['666-980', 4], ['436-962', 2]] },
  { id: 120487, c: 7, date: '2026-11-15 21:12:37', status: 1, pay: 3, deliv: 1, ship: null, items: [['439-102', 1], ['435-930', 1]] },
  { id: 120488, c: 8, date: '2026-11-16 08:52:10', status: 6, pay: 1, deliv: 2, ship: '2026-11-24', items: [['434-673', 1]] },
];

const SEED = String.raw`
$q = SC_Query_Ex::getSingletonInstance();
$q->begin();
foreach (['dtb_products', 'dtb_products_class', 'dtb_product_categories', 'dtb_category', 'dtb_category_count', 'dtb_category_total_count',
    'dtb_product_status', 'dtb_recommend_products', 'dtb_best_products', 'dtb_customer', 'dtb_order', 'dtb_order_detail', 'dtb_shipping',
    'dtb_shipment_item', 'dtb_deliv', 'dtb_delivfee', 'dtb_delivtime', 'dtb_payment', 'dtb_payment_options', 'dtb_maker', 'dtb_news'] as $t) {
    $q->delete($t);
}
$q->delete('dtb_classcategory', 'classcategory_id <> 0');
$q->delete('dtb_class', 'class_id <> 0');
$now = '2026-11-10 09:00:00';
$b = $data['base'];
$b['update_date'] = $now;
$q->update('dtb_baseinfo', $b, 'id = 1');

// categories (the shop's own ids)
$rank = count($data['cats']) + 1;
foreach ($data['cats'] as [$id, $name, $parent]) {
    $q->insert('dtb_category', ['category_id' => $id, 'category_name' => $name, 'parent_category_id' => $parent, 'level' => $parent ? 2 : 1,
        'rank' => $rank--, 'creator_id' => 2, 'create_date' => $now, 'update_date' => $now, 'del_flg' => 0]);
}
$q->insert('dtb_maker', ['maker_id' => 1, 'name' => 'Garage', 'rank' => 1, 'creator_id' => 2, 'create_date' => $now, 'update_date' => $now]);

// the colour (規格)
$q->insert('dtb_class', ['class_id' => 1, 'name' => 'カラー', 'rank' => 1, 'creator_id' => 2, 'create_date' => $now, 'update_date' => $now, 'del_flg' => 0]);
$cc = [];
$pcid = 1000;
foreach ($data['products'] as $p) {
    $q->insert('dtb_products', ['product_id' => $p['id'], 'name' => $p['name'], 'maker_id' => $p['brand'] === 'Garage' ? 1 : null, 'status' => 1,
        'comment3' => $p['words'], 'main_list_comment' => $p['desc'], 'main_comment' => $p['desc'], 'main_list_image' => $p['list'], 'main_image' => $p['main'],
        'main_large_image' => $p['main'], 'deliv_date_id' => 2, 'del_flg' => 0, 'creator_id' => 2, 'create_date' => $p['created'], 'update_date' => $p['created']]);
    $q->insert('dtb_product_categories', ['product_id' => $p['id'], 'category_id' => $p['cat'], 'rank' => 1]);
    $multi = count($p['variants']) > 1 || $p['variants'][0]['color'] !== '';
    foreach ($p['variants'] as $v) {
        $c1 = 0;
        if ($multi) {
            if (!isset($cc[$v['color']])) {
                $cc[$v['color']] = count($cc) + 1;
                $q->insert('dtb_classcategory', ['classcategory_id' => $cc[$v['color']], 'name' => $v['color'], 'class_id' => 1, 'rank' => 1000 - count($cc),
                    'creator_id' => 2, 'create_date' => $now, 'update_date' => $now, 'del_flg' => 0]);
            }
            $c1 = $cc[$v['color']];
        }
        $pcid++;
        $q->insert('dtb_products_class', ['product_class_id' => $pcid, 'product_id' => $p['id'], 'classcategory_id1' => $c1, 'classcategory_id2' => 0,
            'product_type_id' => 1, 'product_code' => $v['code'], 'stock' => $v['stock'], 'stock_unlimited' => $v['stock'] === null ? 1 : 0,
            'price01' => $v['price01'] ?: null, 'price02' => $v['price02'], 'point_rate' => 0, 'creator_id' => 2, 'create_date' => $now, 'update_date' => $now, 'del_flg' => 0]);
    }
}

// delivery and payment (ご利用ガイド): 宅配便 / 家具便, the six payment methods
foreach ($data['deliv'] as $i => $d) {
    $q->insert('dtb_deliv', ['deliv_id' => $i + 1, 'product_type_id' => 1, 'name' => $d[0], 'service_name' => $d[1], 'remark' => $d[2], 'confirm_url' => '',
        'rank' => 10 - $i, 'status' => 1, 'del_flg' => 0, 'creator_id' => 2, 'create_date' => $now, 'update_date' => $now]);
    for ($pref = 1; $pref <= 47; $pref++) {
        $q->insert('dtb_delivfee', ['deliv_id' => $i + 1, 'fee_id' => $pref, 'fee' => 800, 'pref' => $pref]);
    }
}
foreach ($data['payments'] as $i => $p) {
    $q->insert('dtb_payment', ['payment_id' => $i + 1, 'payment_method' => $p, 'charge' => 0, 'rank' => 10 - $i, 'fix' => 2, 'status' => 1, 'del_flg' => 0,
        'creator_id' => 2, 'create_date' => $now, 'update_date' => $now, 'upper_rule' => null, 'rule_max' => null]);
    foreach ([1, 2] as $d) {
        $q->insert('dtb_payment_options', ['deliv_id' => $d, 'payment_id' => $i + 1, 'rank' => $i + 1]);
    }
}

// customers and orders (fictional)
$cust = [];
foreach ($data['customers'] as $c) {
    $cust[$c['id']] = $c;
    $q->insert('dtb_customer', ['customer_id' => $c['id'], 'name01' => $c['n1'], 'name02' => $c['n2'], 'kana01' => $c['k1'], 'kana02' => $c['k2'],
        'company_name' => $c['company'], 'zip01' => $c['zip'][0], 'zip02' => $c['zip'][1], 'pref' => $c['prefId'], 'addr01' => $c['a1'], 'addr02' => $c['a2'],
        'email' => $c['email'], 'tel01' => $c['tel'][0], 'tel02' => $c['tel'][1], 'tel03' => $c['tel'][2], 'password' => 'x', 'salt' => 'x',
        'secret_key' => 'garage-demo-' . $c['id'], 'status' => 2, 'point' => 0, 'create_date' => $now, 'update_date' => $now, 'del_flg' => 0, 'mailmaga_flg' => 2]);
}
$rule = SC_Helper_TaxRule_Ex::getTaxRule();
$did = 1;
foreach ($data['orders'] as $o) {
    $c = $cust[$o['c']];
    $sub = 0; $tax = 0; $lines = [];
    foreach ($o['items'] as [$code, $qty]) {
        $pc = $q->getRow('pc.product_class_id, pc.product_id, pc.price02, p.name, cc.name AS color', 'dtb_products_class pc JOIN dtb_products p ON p.product_id = pc.product_id LEFT JOIN dtb_classcategory cc ON cc.classcategory_id = pc.classcategory_id1 AND pc.classcategory_id1 <> 0', 'pc.product_code = ?', [$code]);
        if (!$pc) { throw new Exception('no product ' . $code); }
        $t = SC_Helper_TaxRule_Ex::calcTax($pc['price02'], $rule['tax_rate'], $rule['calc_rule']);
        $sub += ($pc['price02'] + $t) * $qty; $tax += $t * $qty;
        $lines[] = [$pc, $code, $qty];
    }
    $fee = $sub >= 6600 ? 0 : 880;
    $pay = $data['payments'][$o['pay'] - 1];
    $q->insert('dtb_order', ['order_id' => $o['id'], 'customer_id' => $c['id'], 'message' => $o['message'] ?? null, 'order_name01' => $c['n1'], 'order_name02' => $c['n2'],
        'order_kana01' => $c['k1'], 'order_kana02' => $c['k2'], 'order_company_name' => $c['company'], 'order_email' => $c['email'],
        'order_tel01' => $c['tel'][0], 'order_tel02' => $c['tel'][1], 'order_tel03' => $c['tel'][2], 'order_zip01' => $c['zip'][0], 'order_zip02' => $c['zip'][1],
        'order_pref' => $c['prefId'], 'order_addr01' => $c['a1'], 'order_addr02' => $c['a2'], 'subtotal' => $sub, 'discount' => 0, 'deliv_id' => $o['deliv'],
        'deliv_fee' => $fee, 'charge' => 0, 'use_point' => 0, 'add_point' => 0, 'tax' => $tax, 'total' => $sub + $fee, 'payment_total' => $sub + $fee,
        'payment_id' => $o['pay'], 'payment_method' => $pay, 'status' => $o['status'], 'create_date' => $o['date'], 'update_date' => $o['date'],
        'commit_date' => $o['status'] == 5 ? $o['ship'] . ' 09:00:00' : null, 'payment_date' => in_array($o['status'], [5, 6]) ? $o['date'] : null, 'device_type_id' => 10, 'del_flg' => 0]);
    $q->insert('dtb_shipping', ['shipping_id' => 0, 'order_id' => $o['id'], 'shipping_name01' => $c['n1'], 'shipping_name02' => $c['n2'], 'shipping_kana01' => $c['k1'],
        'shipping_kana02' => $c['k2'], 'shipping_company_name' => $c['company'], 'shipping_tel01' => $c['tel'][0], 'shipping_tel02' => $c['tel'][1], 'shipping_tel03' => $c['tel'][2],
        'shipping_pref' => $c['prefId'], 'shipping_zip01' => $c['zip'][0], 'shipping_zip02' => $c['zip'][1], 'shipping_addr01' => $c['a1'], 'shipping_addr02' => $c['a2'],
        'shipping_date' => $o['ship'] ? $o['ship'] . ' 00:00:00' : null, 'shipping_time' => null, 'rank' => 1, 'create_date' => $o['date'], 'update_date' => $o['date'], 'del_flg' => 0]);
    foreach ($lines as [$pc, $code, $qty]) {
        $q->insert('dtb_order_detail', ['order_detail_id' => $did++, 'order_id' => $o['id'], 'product_id' => $pc['product_id'], 'product_class_id' => $pc['product_class_id'],
            'product_name' => $pc['name'], 'product_code' => $code, 'classcategory_name1' => $pc['color'], 'classcategory_name2' => null, 'price' => $pc['price02'],
            'quantity' => $qty, 'point_rate' => 0, 'tax_rate' => $rule['tax_rate'], 'tax_rule' => $rule['calc_rule']]);
        $q->insert('dtb_shipment_item', ['shipping_id' => 0, 'order_id' => $o['id'], 'product_class_id' => $pc['product_class_id'], 'product_name' => $pc['name'],
            'product_code' => $code, 'classcategory_name1' => $pc['color'], 'price' => $pc['price02'], 'quantity' => $qty]);
    }
}
// the sequences after the ids above
foreach (['dtb_products_product_id_seq' => 179830, 'dtb_products_class_product_class_id_seq' => $pcid, 'dtb_order_order_id_seq' => 120488,
    'dtb_order_detail_order_detail_id_seq' => $did, 'dtb_customer_customer_id_seq' => 8, 'dtb_category_category_id_seq' => 2005,
    'dtb_classcategory_classcategory_id_seq' => count($cc) + 1, 'dtb_class_class_id_seq' => 1, 'dtb_deliv_deliv_id_seq' => 2, 'dtb_payment_payment_id_seq' => 6] as $s => $v) {
    $q->query("INSERT INTO $s (sequence) VALUES ($v)");
}
$q->commit();
$objDb = new SC_Helper_DB_Ex();
$objDb->sfCountCategory();
return ['products' => $q->count('dtb_products'), 'classes' => $q->count('dtb_products_class'), 'orders' => $q->count('dtb_order'), 'colours' => count($cc)];
`;

function seedData() {
  const products = CATALOG.map((p, i) => {
    const vs = p.variants.length ? p.variants : [{ code: p.single.code, color: '', price01: 0, price02: p.single.price02, stock: null }];
    return { id: p.id, name: p.name, brand: p.brand, desc: clean(p.desc), list: path.basename(p.main).replace(/_main\./, '_list.'), main: path.basename(p.main), cat: p.cat,
      words: vs.map((v) => v.code).join(' '), variants: vs, created: `2026-${String(4 + (i % 7)).padStart(2, '0')}-${String(3 + i).padStart(2, '0')} 10:00:00` };
  });
  return {
    base: {
      shop_name: 'Garage（ガラージ）', shop_kana: 'ガラージ', shop_name_eng: 'Garage', company_name: 'プラス株式会社 ファニチャーカンパニー', company_kana: 'プラスカブシキガイシャ ファニチャーカンパニー',
      zip01: '150', zip02: '0013', pref: 13, addr01: '渋谷区恵比寿4-20-7', addr02: '恵比寿ガーデンプレイス センタープラザ2階',
      tel01: '0120', tel02: '33', tel03: '1753', business_hour: '平日 10:00～12:00、13:00～17:00（土日・祝祭日：定休）',
      email01: 'garage@plus.co.jp', email02: 'garage@plus.co.jp', email03: 'garage@plus.co.jp', email04: 'garage@plus.co.jp', free_rule: 6000,
      good_traded: 'オフィス家具・インテリア', message: '',
      law_company: 'プラス株式会社 ファニチャーカンパニー', law_manager: '稲木 研二', law_zip01: '150', law_zip02: '0013', law_pref: 13,
      law_addr01: '渋谷区恵比寿4-20-7', law_addr02: '恵比寿ガーデンプレイス センタープラザ2階', law_tel01: '0120', law_tel02: '33', law_tel03: '1753',
      law_email: 'garage@plus.co.jp', law_url: 'https://garage.plus.co.jp/',
      law_term01: '消費税・送料・組立てサービス料。', law_term02: '商品紹介ページをご覧ください。', law_term03: 'ご利用ガイド「お支払いについて」をご覧ください。',
      law_term04: 'ご利用ガイド「納品日・配送について」をご覧ください。', law_term05: 'ご利用ガイド「納品日・配送について」をご覧ください。', law_term06: 'ご利用ガイド「キャンセル・返品について」をご覧ください。',
    },
    cats: G.categories,
    products,
    deliv: [['宅配便', '福山通運・その他', '軒先・玄関渡し'], ['家具便（組立・開梱設置）', 'PLC（プラスロジスティクス）・提携配送業者', '組立・開梱設置付き']],
    payments: ['クレジットカード決済', '銀行振込', '代金引換', '個人向けあと払い ペイディ', '法人向け NP掛け払い', 'コンビニ払い'],
    customers: CUSTOMERS.map((c) => ({ ...c, prefId: PREF[c.pref], email: `demo${c.id}@example.jp` })),
    orders: ORDERS,
  };
}

/* ------------------------------------------------------------------ the product CSV (EC-CUBE's own format) */
async function productCsv(cap, stage) {
  const cols = await cap.php("$o = new SC_Helper_CSV_Ex(); return array_map(fn ($r) => $r['disp_name'], $o->sfGetCsvOutput(1, 'status = 1'));");
  const q = (v) => { v = v == null ? '' : String(v); return /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v; };
  const rows = FRESH.map((p) => {
    const v = p.variants[0];
    const val = {
      商品名: p.name, '表示ステータス(公開・非公開)': 1, '検索ワード(コメント3)': p.variants.map((x) => x.code).join(' '),
      '一覧-メインコメント': clean(p.desc), '一覧-メイン画像': path.basename(p.main).replace(/_main\./, '_list.'), '詳細-メインコメント': clean(p.desc),
      '詳細-メイン画像': path.basename(p.main), '詳細-メイン拡大画像': path.basename(p.main), 発送日目安ID: 2, 削除フラグ: 0, 商品種別ID: 1, 商品コード: v.code,
      在庫数: v.stock == null ? '' : v.stock, 在庫無制限フラグ: v.stock == null ? 1 : 0,
      通常価格: v.price01 || '', 販売価格: stage < 2 && PRICE_SHEET.has(p.id) ? v.price02.toLocaleString('en-US') : v.price02, ポイント付与率: 0,
      カテゴリID: FRESH_CAT[p.id],
    };
    return cols.map((c) => q(val[c] != null ? val[c] : '')).join(',');
  });
  return { cols, text: [cols.map(q).join(','), ...rows].join('\r\n') + '\r\n' };
}

/* ------------------------------------------------------------------ PDFs: EC-CUBE's 帳票出力, then Chrome's PDF viewer */
const PDFS = {};
async function pdfFrom(cap, name, fields) {
  // the 帳票出力 form on show (its hidden order ids, transactionid …) posted as the 作成する button does
  const r = await cap.eval(async (f) => {
    const form = document.querySelector('form[name="form1"]');
    const fd = new FormData(form);
    for (const [k, v] of Object.entries(f)) fd.set(k, v);
    const res = await fetch(form.getAttribute('action') || location.href, { method: 'POST', body: new URLSearchParams(fd), credentials: 'same-origin' });
    const b = new Uint8Array(await res.arrayBuffer());
    let s = '';
    for (let i = 0; i < b.length; i += 8192) s += String.fromCharCode.apply(null, b.subarray(i, i + 8192));
    return { type: res.headers.get('content-type'), b64: btoa(s) };
  }, fields);
  const buf = Buffer.from(r.b64, 'base64');
  if (!/pdf/.test(r.type || '') || buf.subarray(0, 4).toString() !== '%PDF') throw new Error(`${name}: not a PDF (${r.type}): ${buf.toString('utf8').slice(0, 600)}`);
  const dir = path.join(VIDEO, 'assets', 'pdf');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, name + '.pdf'), buf);
  log(`PDF ${name}.pdf — ${(buf.length / 1024).toFixed(0)} KB`);
  PDFS[name] = { pdf: `assets/pdf/${name}.pdf` };
}
async function pdfViews(cap) {
  const sharp = require(path.resolve(__dirname, '../../../node_modules/sharp'));
  const dir = path.join(VIDEO, 'assets', 'pdf');
  const out = {};
  const http = require('http');
  const srv = http.createServer((req, res) => {
    const k = new URL(req.url, 'http://x').searchParams.get('k');
    const file = k && path.join(dir, k + '.pdf');
    if (!file || !fs.existsSync(file)) { res.writeHead(404); res.end(); return; }
    res.writeHead(200, { 'Content-Type': 'application/pdf' });
    res.end(fs.readFileSync(file));
  });
  await new Promise((r) => srv.listen(0, '127.0.0.1', r));
  for (const name of Object.keys(PDFS)) {
    const v = await cap.browser.newPage();
    await v.setViewport({ width: 1920, height: 947 });
    await v.goto(`http://127.0.0.1:${srv.address().port}/admin/order/pdf.php?k=${name}`, { waitUntil: 'networkidle0' });
    await wait(3500);
    const shots = [['', null], ...(name === 'nouhin-multi' ? [['-p3', 'End']] : [])];
    for (const [suffix, key] of shots) {
      if (key) { await v.mouse.click(960, 520); await v.keyboard.press(key); await wait(2500); }
      const png = path.join(dir, `${name}${suffix}.png`);
      await v.screenshot({ path: png });
      // where the (first visible) page is: the white area in the middle of the grey viewer
      const { data, info } = await sharp(png).raw().toBuffer({ resolveWithObject: true });
      const white = (x, y) => { const i = (y * info.width + x) * info.channels; return data[i] > 248 && data[i + 1] > 248 && data[i + 2] > 248; };
      const y = Math.round(info.height * 0.55);
      let x0 = -1, x1 = -1;
      for (let x = 300; x < info.width; x++) if (white(x, y)) { if (x0 < 0) x0 = x; x1 = x; }
      let y0 = y; while (y0 > 0 && white(x0 + 4, y0 - 1)) y0--;
      out[name + suffix] = { img: `assets/pdf/${name}${suffix}.png`, pdf: PDFS[name].pdf, page: [x0, y0, x1 - x0 + 1] };
      if (SHOTS) fs.copyFileSync(png, path.join(SHOTS, `pdf-${name}${suffix}.png`));
    }
    await v.close();
  }
  srv.close();
  return out;
}

/* ------------------------------------------------------------------ run */
(async () => {
  if (SHOTS) fs.mkdirSync(SHOTS, { recursive: true });
  const cap = await ECC.start({ id: ID, version: 2, fresh: true, site: 'http://localhost:8080', date: '2026-11-16', time: '10:24', shots: SHOTS });
  const D = cap.data;
  try {
    // images of the shop (as uploaded to html/upload/save_image), then the data
    const save = path.join(cap.instance, 'html', 'upload', 'save_image');
    for (const f of fs.readdirSync(IMG)) if (/\.(jpe?g|png)$/i.test(f) && !/logo/.test(f)) fs.copyFileSync(path.join(IMG, f), path.join(save, f));
    log('seed:', JSON.stringify(await cap.php(SEED, seedData())));
    await cap.login();

    /* 1 — 受注管理, 帳票出力 (as installed) */
    await cap.go('/admin/order/index.php', 'form#search_form, form[name="search_form"]');
    await cap.eval(() => { const f = document.querySelector('form[name="search_form"]'); f.querySelector('[name="mode"]').value = 'search'; f.submit(); });
    await cap.settle('#order-search-result, table.list');
    await cap.capture('orders');
    const pdfForm = async (key, url, post) => {
      if (post) {
        await cap.go('/admin/order/index.php', 'body');
        await cap.eval((ids) => {
          const f = document.createElement('form'); f.method = 'post'; f.action = 'pdf.php';
          const add = (n, v) => { const i = document.createElement('input'); i.type = 'hidden'; i.name = n; i.value = v; f.appendChild(i); };
          add('transactionid', document.querySelector('input[name="transactionid"]').value); add('mode', 'pdf');
          ids.forEach((id) => add('pdf_order_id[]', id));
          document.body.appendChild(f); f.submit();
        }, post);
        await cap.settle('form[name="form1"] [name="title"]');
      } else await cap.go(url, 'form[name="form1"] [name="title"]');
      // the video's day as 発行日
      await cap.select('select[name="year"]', String(DAY.y)); await cap.select('select[name="month"]', String(DAY.m)); await cap.select('select[name="day"]', String(DAY.d));
      if (key) await cap.capture(key);
    };
    const MAKE = { year: String(DAY.y), month: String(DAY.m), day: String(DAY.d), download: '0', mode: 'confirm', type: '0', disp_point: '1' };
    await cap.view({ width: 1920, height: 947 });
    await pdfForm('pdf-form', '/admin/order/pdf.php?order_id=120486');
    await pdfFrom(cap, 'nouhin-default', MAKE);

    /* 2 — the logo, SC_Fpdf_Ex as first typed, then fixed */
    fs.copyFileSync(path.join(IMG, 'logo_garage.png'), path.join(cap.instance, SRC.LOGO));
    await cap.files({ [SRC.FPDF_PATH]: SRC.fpdf(1) });
    await pdfForm(null, '/admin/order/pdf.php?order_id=120486');
    await pdfFrom(cap, 'nouhin-wide', MAKE);
    await cap.files({ [SRC.FPDF_PATH]: SRC.fpdf(2) });
    await pdfForm(null, '/admin/order/pdf.php?order_id=120486');
    await pdfFrom(cap, 'nouhin-col', MAKE);

    /* 3 — the defaults (LC_Page_Admin_Order_Pdf_Ex), three orders at once */
    await cap.files({ [SRC.PDF_PAGE_PATH]: SRC.PDF_PAGE });
    await cap.go('/admin/order/index.php', 'body');
    await cap.eval(() => { const f = document.querySelector('form[name="search_form"]'); f.querySelector('[name="mode"]').value = 'search'; f.submit(); });
    await cap.settle('table.list');
    await pdfForm('pdf-form-multi', null, ['120486', '120487', '120488']);
    await pdfFrom(cap, 'nouhin-multi', MAKE);

    /* 4 — CSV出力項目設定 (受注), 高度な設定: the 出荷指示 SQL */
    await cap.view('max');
    await cap.go('/admin/contents/csv.php?tpl_subno_csv=order', 'body');
    await cap.capture('csv-order');
    await cap.go('/admin/contents/csv_sql.php', 'textarea[name="csv_sql"]');
    await cap.capture('csvsql', { inputs: [['input[name="sql_name"]', 'sql_name'], ['textarea[name="csv_sql"]', 'csv_sql']] });
    const fill = async (stage) => {
      await cap.type('input[name="sql_name"]', '出荷指示（PLC）');
      await cap.eval((q) => { document.querySelector('textarea[name="csv_sql"]').value = q; }, SRC.sqlBody(stage));
    };
    const submit = async (mode, ready) => {
      await Promise.all([cap.page.waitForNavigation({ waitUntil: 'load', timeout: 300000 }),
        cap.eval((m) => { const f = document.form1; f.mode.value = m; f.target = '_self'; f.submit(); }, mode)]);
      await cap.settle(ready);
    };
    await fill(1);
    // SQL確認 (a popup in EC-CUBE; here in the same tab)
    await submit('preview', 'body');
    await cap.capture('csvsql-check');
    D['csvsql-check'] = await cap.eval(() => document.body.innerText.trim().slice(-200));
    log('SQL確認:', JSON.stringify(D['csvsql-check']));
    await cap.go('/admin/contents/csv_sql.php', 'textarea[name="csv_sql"]');
    await fill(1);
    await submit('confirm', 'textarea[name="csv_sql"]');
    await cap.capture('csvsql-saved');
    const sqlId = await cap.eval(() => document.querySelector('input[name="sql_id"]') && document.querySelector('input[name="sql_id"]').value);
    // CSV出力 with deliv_date: the page EC-CUBE shows
    await Promise.all([cap.page.waitForNavigation({ waitUntil: 'load', timeout: 300000 }).catch(() => null),
      cap.eval((id) => { const f = document.form1; f.mode.value = 'csv_output'; f.csv_output_id.value = id; f.target = '_self'; f.submit(); }, sqlId)]);
    await wait(1500);
    await cap.capture('csvsql-fail');
    D['csvsql-fail'] = await cap.eval(() => document.body.innerText.trim().slice(0, 1200));
    log('CSV出力 (deliv_date):', cap.page.url(), JSON.stringify(D['csvsql-fail']).slice(0, 500));
    // EC-CUBE's error log (the last entry: this CSV出力) and what SQLite itself says about the SQL
    const elog = fs.readFileSync(path.join(cap.instance, 'data', 'logs', 'error.log'), 'utf8').split(/\r?\n(?=\d{4}\/\d{2}\/\d{2} \d{2}:\d{2}:\d{2} \[)/);
    D.errorLog = elog.filter((e) => /DB処理でエラー/.test(e)).pop().split(/\r?\n/).slice(0, 7);
    D.sqliteMsg = await cap.php("$db = new SQLite3(DB_NAME); $r = @$db->prepare($data); return $r ? 'ok' : $db->lastErrorMsg();", 'SELECT ' + SRC.sqlBody(1));
    log('error.log:', JSON.stringify(D.errorLog).slice(0, 400), '— SQLite:', D.sqliteMsg);
    await cap.go('/admin/contents/csv_sql.php?sql_id=' + sqlId, 'textarea[name="csv_sql"]');
    await fill(2);
    await submit('confirm', 'textarea[name="csv_sql"]');
    await cap.capture('csvsql-saved2');
    const csv = await cap.eval(async () => {
      const f = document.form1;
      const id = [...document.querySelectorAll('a[name="csv"]')].map((a) => (a.getAttribute('onclick') || '').match(/csv_output_id',\s*(\d+)/)).filter(Boolean).map((m) => m[1])[0];
      const fd = new FormData(f); fd.set('mode', 'csv_output'); fd.set('csv_output_id', id);
      const res = await fetch(location.pathname, { method: 'POST', body: new URLSearchParams(fd), credentials: 'same-origin' });
      const b = new Uint8Array(await res.arrayBuffer());
      return { id, type: res.headers.get('content-type'), disp: res.headers.get('content-disposition'), sjis: new TextDecoder('shift_jis').decode(b), bytes: b.length };
    });
    log('CSV', csv.id, csv.type, csv.disp, csv.bytes, 'bytes');
    D.shipCsv = { text: csv.sjis, file: ((csv.disp || '').match(/filename="?([^";]+)/) || [])[1] || 'contents.csv', bytes: csv.bytes };

    /* 5 — 商品登録CSV: the 新着商品 */
    const upload = async (key, stage) => {
      const { text, cols } = await productCsv(cap, stage);
      D[`productCsv${stage}`] = text;
      D.productCols = cols;
      // Shift_JIS, as EC-CUBE 2 reads it (the editor saves it as Shift_JIS)
      const tmp = path.join(cap.instance, 'var', `garage-new-${stage}.csv`);
      fs.writeFileSync(tmp + '.utf8', text);
      await cap.php(`file_put_contents('${'/srv/eccube/var/'}garage-new-${stage}.csv', mb_convert_encoding(file_get_contents('/srv/eccube/var/garage-new-${stage}.csv.utf8'), 'SJIS-win', 'UTF-8')); return true;`);
      await cap.go('/admin/products/upload_csv.php', 'input[name="csv_file"]');
      if (stage === 1) await cap.capture('upload');
      const input = await cap.page.$('input[name="csv_file"]');
      await input.uploadFile(tmp);
      await Promise.all([cap.page.waitForNavigation({ waitUntil: 'load', timeout: 300000 }),
        cap.eval(() => { const f = document.form1; f.mode.value = 'csv_upload'; f.submit(); })]);
      await wait(800);
      log('upload →', cap.page.url(), JSON.stringify(await cap.eval(() => document.body.innerText.slice(0, 300))));
      await cap.capture(key);
      D[key] = await cap.eval(() => document.body.innerText.trim().slice(0, 1500));
      log(key, JSON.stringify(D[key]).slice(0, 400));
    };
    await upload('upload-err', 1);
    await upload('upload-done', 2);
    await cap.go('/admin/products/index.php', 'form[name="search_form"]');
    await cap.eval(() => { const f = document.querySelector('form[name="search_form"]'); f.querySelector('[name="mode"]').value = 'search'; f.submit(); });
    await cap.settle('table.list, #products-search-result, form');
    await cap.capture('products');

    D.pdf = await pdfViews(cap);
    D.orders = ORDERS.map((o) => ({ id: o.id, status: o.status }));
    await cap.finish();
  } catch (e) {
    console.error(e);
    await cap.abort();
    process.exit(1);
  }
  process.exit(0);
})();
