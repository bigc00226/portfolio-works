/*
 * The real WordPress screens of the wp-f-masanobu-members video, captured from WordPress itself (tools/wp/playground.js:
 * WordPress Playground — real WordPress + PHP in the browser, Japanese, no account).
 *
 *   node tools/snapshots/wp-f-masanobu-members/capture-wp.js [screenshot folder]   → node tools/webp.js wp-f-masanobu-members
 *
 * The site is set up like the video's wp-env (http://localhost:8888): 福岡正信自然農園 official site, WooCommerce,
 * Japanized for WooCommerce (よみがな on), B2BKing (the free core from wordpress.org — the live site runs B2BKing Pro), the
 * theme "fmasanobu_shop" written from the files the video shows (public/videos/wp-f-masanobu-members/js/files.js),
 * the shop's 伊予柑マーマレード (name / price as on the live site), invented customers.
 * Every step the video shows is done for real in WordPress before its screen is captured, in the video's order:
 *   1. WooCommerce › 設定 › アカウントとプライバシー: registration on the マイアカウント page on, the password link off, saved
 *   2. the theme's registration code (inc/account.php, stage 1) → a real registration through the form on /account/?register=1
 *      (logged out); WooCommerce logs the new member in: the member's マイアカウント is read (front-end data)
 *   3. ユーザー → the member's 編集 screen with the 会員情報 rows (stage 2: the wrong meta key → 「—」), fixed (stage 3)
 *   4. the マイページ code (stage 4): /account/member-status/ answers 404 until 設定 › パーマリンク is saved (checked)
 *   5. B2BKing: the group 卸会員 created through its editor, the group price on the product, the member moved into it
 *   6. Members searched / installed / activated through プラグインを追加, the role 卸会員 added through its form, the page
 *      卸会員さま専用ページ (a draft the shop wrote) published with コンテンツの権限 = 卸会員; as the member: the page answers
 *      Members' message (the member has the B2BKing group but not the role) → the role added on the user screen → the page
 * Changed for the demo (tools/wp/playground.js): the Playground address → http://localhost:8888, the capture date →
 * 2026-11-11 (the video's clock), the text boxes the video types into → look-alike boxes.
 */
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '../../..');
const WPC = require(path.join(ROOT, 'tools/wp/playground'));
const ID = 'wp-f-masanobu-members';
const DIR = path.join(ROOT, 'public/videos', ID);
const SHOTS = process.argv[2] || null;
const { log, wait } = WPC;

const W = {};
new Function('window', fs.readFileSync(path.join(DIR, 'js/files.js'), 'utf8'))(W);
const FL = W.FILES;
const T = FL.T;
/** the theme's files at a stage of inc/account.php (member-status.php from stage 4) */
const theme = (stage) => {
  const f = {};
  for (const [k, v] of Object.entries(FL.files)) if (k.startsWith(T) && !/member-status\.php$/.test(k)) f[k] = v;
  f[T + 'inc/account.php'] = FL.ACCOUNT(stage);
  if (stage >= 4) f[T + 'woocommerce/myaccount/member-status.php'] = FL.files[T + 'woocommerce/myaccount/member-status.php'];
  return f;
};

/** the member the video registers (invented; blurred in the video) */
const MEMBER = {
  billing_last_name: '森田', billing_first_name: '由紀', billing_yomigana_last_name: 'もりた', billing_yomigana_first_name: 'ゆき',
  billing_company: 'カフェ こもれび', billing_postcode: '631-0033', billing_state: 'JP29', billing_city: '奈良市', billing_address_1: 'あやめ池南 1-2-3',
  billing_phone: '0742-00-0000', email: 'komorebi.morita@example.jp', password: 'Komorebi#2026-nara', birth_year: '1986', birth_month: '4', birth_day: '12', gender: '女性',
};
/** customers registered before (invented) */
const CUSTOMERS = [
  ['佐藤', '美穂', 'sato.miho', '2025-03-14 09:12:00'], ['高橋', '健一', 'takahashi.k', '2025-05-02 21:40:00'], ['中村', '彩', 'aya.nakamura', '2025-08-19 12:05:00'],
  ['小林', '直樹', 'kobayashi.naoki', '2025-11-30 18:22:00'], ['山本', '恵子', 'k.yamamoto', '2026-02-11 08:47:00'], ['井上', '大輔', 'inoue.daisuke', '2026-06-25 22:13:00'],
  ['木村', '紗希', 'saki.kimura', '2026-09-08 10:31:00'], ['林', '智子', 'tomoko.hayashi', '2026-10-27 19:55:00'],
];
const PRODUCTS = [
  ['伊予柑マーマレード', 'iyokanmarmalade', '1620'], ['自然の細道 原木しいたけ（パウダー）※お試し版', 'driedshiitake-powder', '756'],
  ['［限定］自然に抱かれし”森林山椒（パウダー）” ※お試し版', 'japanese-pepper-powder', '648'], ['はるみジュース -ノンフローズン 2026歳時記-', 'product-38566', '2700'],
];
/** 卸会員さま専用ページ: the shop's draft (texts from the live 卸売りについて page) */
const WHOLESALE_PAGE = [
  '<!-- wp:paragraph -->\n<p>卸会員さま向けのご案内です。卸価格（税込）は、ログイン中の商品ページに表示されます。</p>\n<!-- /wp:paragraph -->',
  '<!-- wp:heading -->\n<h2 class="wp-block-heading">納期について</h2>\n<!-- /wp:heading -->',
  '<!-- wp:paragraph -->\n<p>商品・数量ごとに異なりますが、発送準備までに1週間～1ヶ月程度のお時間がかかってまいりますので、納期に余裕を持ってお早めにご注文ください。</p>\n<!-- /wp:paragraph -->',
  '<!-- wp:heading -->\n<h2 class="wp-block-heading">ギフトボックス・熨斗について</h2>\n<!-- /wp:heading -->',
  '<!-- wp:paragraph -->\n<p>ギフト商品、手提げ袋(有料)もご用意しております。またラッピング、熨斗がけ等のご要望もお知らせください。</p>\n<!-- /wp:paragraph -->',
  '<!-- wp:heading -->\n<h2 class="wp-block-heading">送付について</h2>\n<!-- /wp:heading -->',
  '<!-- wp:paragraph -->\n<p>送付先がまとめて1箇所の場合や、個別の場合等、送料についても別途見積もりいたしますので、ご要望をお知らせください。</p>\n<!-- /wp:paragraph -->',
].join('\n\n');

(async () => {
  const cap = await WPC.start({ id: ID, site: 'http://localhost:8888', date: '2026-11-11', time: '13:36', shots: SHOTS, serverPath: '/var/www/html/wp-content/' });
  const php = (code, data) => cap.php(code, data);
  const go = (rel, ready, o) => cap.go(rel, ready, o);
  const clickJs = async (sel) => { await cap.eval((s) => { const e = document.querySelector(s); if (!e) throw new Error('no ' + s); setTimeout(() => e.click(), 0); }, sel); await wait(600); };
  const status = (rel) => cap.eval(async (u) => (await fetch(u, { credentials: 'include' })).status, cap.origin + rel);
  const front = {};
  /** the member's 「ログアウト」 (WooCommerce's customer-logout link): it logs out and redirects to /account/ (its login form) */
  const logoutMember = async (href) => {
    await cap.eval((u) => { setTimeout(() => { location.href = u; }, 0); }, href);
    await wait(1500);
    await cap.settle('form.login', 60000).catch((e) => log('logout:', e.message));
  };
  cap.data.front = front;

  await cap.boot(WPC.blueprint({
    title: '福岡正信自然農園 official site', tagline: '自然農法 わら一本の革命',
    plugins: ['woocommerce', 'woocommerce-for-japan', 'b2bking-wholesale-for-woocommerce'],
    options: {
      woocommerce_onboarding_profile: { skipped: true }, woocommerce_task_list_hidden: 'yes', woocommerce_task_list_complete: 'yes',
      woocommerce_show_marketplace_suggestions: 'no', woocommerce_allow_tracking: 'no', woocommerce_coming_soon: 'no',
      woocommerce_default_country: 'JP:JP29', woocommerce_currency: 'JPY', woocommerce_price_num_decimals: '0', woocommerce_prices_include_tax: 'yes',
      woocommerce_enable_myaccount_registration: 'no', woocommerce_registration_generate_password: 'yes',
      // the live form: 会社名 (オプション), 電話 required
      woocommerce_checkout_company_field: 'optional', woocommerce_checkout_phone_field: 'required', woocommerce_checkout_address_2_field: 'optional',
      'wc4jp-yomigana': '1', 'wc4jp-yomigana-required': '1',
    },
  }));
  await cap.translations();

  // the theme (stage 0: inc/account.php with its header only), the shop's pages, products, customers
  await cap.files(theme(0));
  // Japanized for WooCommerce's promotion notice (Paidy …, picked at random on every screen): a working shop dismissed it long ago
  await cap.files({ 'wp-content/mu-plugins/demo-notices.php': [
    '<?php',
    "add_action( 'admin_head', function () {",
    '\tglobal $wp_filter;',
    "\tif ( empty( $wp_filter['admin_notices'] ) ) return;",
    "\tforeach ( $wp_filter['admin_notices']->callbacks as $prio => $cbs ) foreach ( $cbs as $cb ) if ( is_array( $cb['function'] ) && 'admin_jp4wc_promotion' === $cb['function'][1] ) remove_action( 'admin_notices', $cb['function'], $prio );",
    "\techo '<style>#pr_jp4wc_promotion { display: none !important; }</style>';",
    '} );',
    '',
  ].join('\n') });
  const setup = await php(`
    switch_theme( 'fmasanobu_shop' );
    foreach ( [ 1, 2 ] as $id ) wp_delete_post( $id, true );
    $acc = (int) get_option( 'woocommerce_myaccount_page_id' );
    wp_update_post( [ 'ID' => $acc, 'post_name' => 'account', 'post_title' => 'マイアカウント', 'post_date' => '2020-12-01 10:00:00' ] );
    $bp = wp_insert_post( [ 'post_type' => 'page', 'post_status' => 'publish', 'post_title' => '卸売りについて', 'post_name' => 'big-purchase', 'post_date' => '2021-04-01 10:00:00' ] );
    // the shop's classic cart / checkout (shortcodes, as the live site's theme uses them): Japanized for WooCommerce adds
    // its よみがな fields to the classic address fields only
    foreach ( [ 'cart' => '[woocommerce_cart]', 'checkout' => '[woocommerce_checkout]' ] as $pg => $sc ) wp_update_post( [ 'ID' => wc_get_page_id( $pg ), 'post_content' => "<!-- wp:shortcode -->\\n$sc\\n<!-- /wp:shortcode -->" ] );
    // B2BKing's user-type dropdown on the registration form: off (the live form has none — wholesale is applied for on /big-purchase)
    update_option( 'b2bking_registration_roles_dropdown_setting', 0 );
    $p = [];
    foreach ( $data['products'] as $x ) { $pr = new WC_Product_Simple(); $pr->set_name( $x[0] ); $pr->set_slug( $x[1] ); $pr->set_regular_price( $x[2] ); $pr->set_status( 'publish' ); $p[ $x[1] ] = $pr->save(); }
    foreach ( $data['customers'] as $c ) {
      $uid = wp_insert_user( [ 'user_login' => $c[2], 'user_email' => $c[2] . '@example.jp', 'user_pass' => wp_generate_password(), 'role' => 'customer', 'first_name' => $c[1], 'last_name' => $c[0], 'display_name' => $c[0] . $c[1], 'user_registered' => get_gmt_from_date( $c[3] ) ] );
      update_user_meta( $uid, 'billing_last_name', $c[0] ); update_user_meta( $uid, 'billing_first_name', $c[1] ); update_user_meta( $uid, 'billing_country', 'JP' );
    }
    update_option( 'woocommerce_admin_notices', [] );
    foreach ( [ 'wc_admin_dismissed_payments_promotion', 'woocommerce_marketplace_suggestions_dismissed' ] as $k ) update_user_meta( 1, $k, 'yes' );
    update_user_meta( 1, 'show_welcome_panel', 0 );
    update_user_meta( 1, $GLOBALS['wpdb']->get_blog_prefix() . 'persisted_preferences', [ 'core' => [ 'welcomeGuide' => false, 'isComplementaryAreaVisible' => true, 'enableChoosePatternModal' => false ], 'core/edit-post' => [ 'welcomeGuide' => false, 'metaBoxesMainOpenHeight' => 420 ], '_modified' => gmdate( 'c' ) ] );
    $promo = '';
    flush_rewrite_rules();
    return [ 'account' => $acc, 'bigpurchase' => $bp, 'products' => $p, 'promo' => $promo, 'theme' => get_stylesheet() ];`, { products: PRODUCTS, customers: CUSTOMERS });
  log('setup', JSON.stringify(setup));
  cap.data.setup = setup;
  cap.info.theme = 'fmasanobu_shop';

  /* ------------------------------------------------------------ 1. dashboard, WooCommerce › アカウントとプライバシー */
  await go('/wp-admin/', '#wpadminbar');
  await cap.capture('dashboard');
  await go('/wp-admin/admin.php?page=wc-settings&tab=account', '#mainform');
  await wait(1500);
  await cap.capture('wc-account');
  await cap.eval(() => {
    const on = document.getElementById('woocommerce_enable_myaccount_registration'); if (on && !on.checked) on.click();
    const pw = document.getElementById('woocommerce_registration_generate_password'); if (pw && pw.checked) pw.click();
  });
  await clickJs('.woocommerce-save-button');
  await wait(1500);
  await cap.settle('#mainform');
  await wait(1200);
  await cap.capture('wc-account-saved');
  log('account options', JSON.stringify(await php("return [ get_option( 'woocommerce_enable_myaccount_registration' ), get_option( 'woocommerce_registration_generate_password' ) ];")));

  /* ------------------------------------------------------------ 2. the registration code → a real registration */
  await cap.files(theme(1));
  await php('wp_logout(); return true;').catch(() => null);
  await go('/account/?register=1', 'form.register');
  front.registerFields = await cap.eval(() => [...document.querySelectorAll('form.register [name]')].map((e) => e.name + ':' + e.type).join(' '));
  log('register form', front.registerFields);
  for (const [k, v] of Object.entries(MEMBER)) {
    if (k === 'billing_state') { await cap.frame.select('#billing_state', v); continue; }
    if (k === 'gender') { await cap.eval((val) => { const r = [...document.querySelectorAll('input[name="gender"]')].find((x) => x.value === val); if (r) r.click(); }, v); continue; }
    const id = k === 'email' ? '#reg_email' : k === 'password' ? '#reg_password' : '#' + k;
    if (!(await cap.eval((q) => !!document.querySelector(q), id))) { log('  (no field ' + id + ')'); continue; }
    await cap.type(id, v);
  }
  await wait(800);
  await clickJs('button[name="register"]');
  await wait(2000);
  await cap.settle('.woocommerce-MyAccount-navigation', 90000).catch(async (e) => {
    log('registration failed:', await cap.eval(() => (document.querySelector('.woocommerce-error, .woocommerce-notices-wrapper') || document.body).innerText.slice(0, 600)).catch(() => '?'));
    throw e;
  });
  front.dashA = await cap.eval(() => document.querySelector('.woocommerce').outerHTML);
  const memberId = await cap.eval(() => +((document.body.className.match(/\buser-(\d+)\b/) || [])[1] || 0));
  const logoutA = await cap.eval(() => { const a = document.querySelector('.woocommerce-MyAccount-navigation-link--customer-logout a'); return a && a.getAttribute('href'); });
  log('registered member', memberId, 'logout', logoutA);
  await logoutMember(logoutA);
  await cap.login();
  const meta = await php("$u = get_user_by( 'email', $data ); return [ 'id' => $u->ID, 'meta' => array_map( fn( $v ) => $v[0], array_intersect_key( get_user_meta( $u->ID ), array_flip( [ 'billing_last_name', 'billing_yomigana_last_name', 'billing_company', 'billing_postcode', 'billing_state', 'billing_city', 'billing_phone', 'birth_year', 'birth_month', 'birth_day', 'gender', 'first_name', 'last_name' ] ) ) ) ];", MEMBER.email);
  log('member meta', JSON.stringify(meta));
  cap.data.member = { id: meta.id, login: (await php("return get_userdata( (int) $data )->user_login;", meta.id)) };

  /* ------------------------------------------------------------ 3. ユーザー → 会員情報 (wrong key → fixed) */
  await cap.files(theme(2));
  await go('/wp-admin/users.php', '.wp-list-table');
  await cap.capture('users');
  await go(`/wp-admin/user-edit.php?user_id=${meta.id}`, '#your-profile');
  await cap.capture('user-edit-bad');
  await cap.files(theme(3));
  await go(`/wp-admin/user-edit.php?user_id=${meta.id}`, '#your-profile');
  await cap.capture('user-edit-fixed');
  log('会員情報', await cap.eval(() => { const h = [...document.querySelectorAll('#your-profile h2')].find((x) => /会員情報/.test(x.textContent)); return h ? h.nextElementSibling.innerText.replace(/\s+/g, ' ') : 'none'; }));

  /* ------------------------------------------------------------ 4. マイページ: the endpoint, パーマリンク */
  await cap.files(theme(4));
  log('member-status before saving permalinks', await status('/account/member-status/'));
  await go('/wp-admin/options-permalink.php', '#wpbody-content form');
  await cap.capture('permalinks');
  await clickJs('#submit');
  await wait(1500);
  await cap.settle('#wpbody-content form');
  await cap.capture('permalinks-saved');
  log('member-status after saving permalinks', await status('/account/member-status/'));

  /* ------------------------------------------------------------ 5. B2BKing: the group, the group price, the member */
  await go('/wp-admin/edit.php?post_type=b2bking_group', '#wpbody-content');
  await wait(1200);
  await cap.capture('b2b-groups');
  await go('/wp-admin/post-new.php?post_type=b2bking_group', '#title');
  await wait(1200);
  await cap.capture('b2b-group-new', { inputs: [['#title', 'groupTitle']] });
  await cap.type('#title', '卸会員');
  await clickJs('#publish');
  await wait(2000);
  await cap.settle('#post');
  await wait(1000);
  const groupId = await cap.eval(() => +document.querySelector('#post_ID').value);
  cap.data.group = groupId;
  await cap.capture('b2b-group-saved');
  await go('/wp-admin/edit.php?post_type=b2bking_group', '#wpbody-content');
  await wait(1000);
  await cap.capture('b2b-groups-2');
  log('group', groupId);

  const pid = setup.products.iyokanmarmalade;
  const PRICE = `#b2bking_regular_product_price_group_${groupId}`;
  await go(`/wp-admin/post.php?post=${pid}&action=edit`, '#woocommerce-product-data');
  await wait(2000);
  await cap.eval((sel) => { const e = document.querySelector(sel); if (e) e.scrollIntoView({ block: 'center' }); }, PRICE);
  await wait(800);
  await cap.capture('product-edit', { inputs: [[PRICE, 'groupPrice']] });
  log('b2b price fields', await cap.eval(() => [...document.querySelectorAll('[name^="b2bking_"][name*="price"]')].map((e) => e.name).join(' ')));
  await cap.type(PRICE, '1458');
  await clickJs('#publish');
  await wait(2000);
  await cap.settle('#woocommerce-product-data');
  await wait(1000);
  await cap.eval((sel) => { const e = document.querySelector(sel); if (e) e.scrollIntoView({ block: 'center' }); }, PRICE);
  await cap.capture('product-saved');
  log('group price saved', await php("return get_post_meta( (int) $data[0], 'b2bking_regular_product_price_group_' . $data[1], true );", [pid, groupId]));

  await go(`/wp-admin/user-edit.php?user_id=${meta.id}`, '#your-profile');
  await cap.eval(() => { const e = document.querySelector('#b2bking_customergroup'); if (e) e.scrollIntoView({ block: 'center' }); });
  await wait(800);
  await cap.capture('user-edit-b2b');
  front.groupOptions = await cap.eval(() => [...document.querySelectorAll('#b2bking_customergroup option')].map((o) => [o.value, o.textContent.trim()]));
  log('group options', JSON.stringify(front.groupOptions));
  await cap.frame.select('#b2bking_customergroup', String(groupId));
  await clickJs('#submit');
  await wait(2000);
  await cap.settle('#your-profile');
  await wait(800);
  await cap.capture('user-b2b-saved');
  log('member b2b', JSON.stringify(await php("return [ get_user_meta( (int) $data, 'b2bking_b2buser', true ), get_user_meta( (int) $data, 'b2bking_customergroup', true ) ];", meta.id)));

  /* ------------------------------------------------------------ 6. Members: install, the role, the page, the member's role */
  await go('/wp-admin/plugin-install.php?s=Members&tab=search&type=term', '.plugin-card');
  await wait(2500);
  await cap.capture('plugin-search', { settle: 1200 });
  await cap.eval(() => document.querySelector('.plugin-card-members .install-now').click());
  for (let i = 0; i < 120; i++) { await wait(1000); if (await cap.eval(() => !!document.querySelector('.plugin-card-members .activate-now'))) break; }
  await wait(1500);
  await cap.capture('plugin-installed', { settle: 800 });
  await cap.translations();
  const actUrl = await cap.eval(() => document.querySelector('.plugin-card-members .activate-now').getAttribute('href'));
  await go('/wp-admin/' + actUrl.replace(/^.*wp-admin\//, '').replace(/&amp;/g, '&'), '#wpadminbar', { redirect: true }).catch(() => null);
  await go('/wp-admin/plugins.php?activate=true', '.wp-list-table.plugins');
  await cap.capture('plugins');
  cap.info.plugins = await php("$p = []; foreach ( get_plugins() as $f => $d ) if ( is_plugin_active( $f ) ) $p[ dirname( $f ) ] = $d['Version']; return $p;");

  await go('/wp-admin/admin.php?page=roles', '#wpbody-content');
  await wait(1000);
  await cap.capture('roles');
  await go('/wp-admin/admin.php?page=members', '#wpbody-content form');
  await wait(1000);
  const roleForm = await cap.eval(() => [...document.querySelectorAll('#wpbody-content form input, #wpbody-content form button')].filter((e) => e.type !== 'checkbox').map((e) => `${e.tagName}#${e.id}[${e.name}](${e.type})`).join(' '));
  log('role form', roleForm);
  await cap.capture('role-new', { inputs: [['input[name="role_name"]', 'roleName']] });
  // the role name; the slug (Members makes it from the name — a Japanese name gives none): 「Role: Edit」 → wholesale_member
  await cap.type('input[name="role_name"]', '卸会員');
  await cap.eval(() => {
    const b = [...document.querySelectorAll('#wpbody-content button, #wpbody-content a')].find((x) => /^\s*(Edit|編集)\s*$/.test(x.textContent) && x.closest('form'));
    if (b) b.click();
  });
  await wait(800);
  log('slug box', await cap.eval(() => { const r = document.querySelector('input[name="role"]'); return r ? `${r.offsetWidth}x${r.offsetHeight} value=${r.value}` : 'none'; }));
  await cap.capture('role-new-slug', { inputs: [['input[name="role"]', 'roleSlug']] });
  await cap.eval(() => { const r = document.querySelector('input[name="role"]'); r.value = 'wholesale_member'; r.dispatchEvent(new Event('input', { bubbles: true })); });
  await cap.eval(() => { const c = document.querySelector('input[name="grant-caps[]"][value="read"]'); if (c && !c.checked) c.click(); });
  await wait(500);
  await cap.capture('role-new-filled');
  await cap.eval(() => { const b = document.querySelector('#publish, #wpbody-content form [type="submit"].button-primary, #wpbody-content form [type="submit"]'); setTimeout(() => b.click(), 0); });
  await wait(2500);
  await cap.settle('#wpbody-content form');
  await wait(800);
  await cap.capture('role-saved');
  log('role', JSON.stringify(await php("$r = get_role( 'wholesale_member' ); return $r ? $r->capabilities : null;")));

  // the page the shop drafted → コンテンツの権限 = 卸会員 → 公開
  const pageId = await php("return wp_insert_post( [ 'post_type' => 'page', 'post_status' => 'draft', 'post_title' => '卸会員さま専用ページ', 'post_name' => 'wholesale', 'post_content' => $data, 'post_date' => '2026-11-10 16:40:00' ] );", WHOLESALE_PAGE);
  cap.data.page = pageId;
  await go(`/wp-admin/post.php?post=${pageId}&action=edit`, 'iframe[name="editor-canvas"]');
  await wait(5000);
  // Members 3.x: the panel 「Content Permissions (Members)」 in the document sidebar (saved through its REST route on change)
  await cap.eval(() => { const t = [...document.querySelectorAll('.editor-sidebar__panel-tabs button, [role="tab"]')].find((b) => /^\s*(ページ|Page)\s*$/.test(b.textContent)); if (t) t.click(); });
  await wait(800);
  await cap.eval(() => { const p = document.querySelector('.members-cp-document-panel'); if (p && !p.classList.contains('is-opened')) p.querySelector('.components-panel__body-toggle').click(); });
  await wait(1000);
  await cap.eval(() => { const p = document.querySelector('.members-cp-document-panel'); if (p) p.scrollIntoView({ block: 'start' }); });
  front.panel = await cap.eval(() => { const p = document.querySelector('.members-cp-document-panel'); return p ? p.innerText.replace(/\s+/g, ' ').slice(0, 400) : 'none'; });
  log('members panel', front.panel);
  await cap.capture('page-edit', { settle: 1200 });
  await cap.eval(() => {
    const c = [...document.querySelectorAll('.members-cp-document-panel .components-checkbox-control')].find((x) => /卸会員/.test(x.textContent));
    const i = c && c.querySelector('input[type="checkbox"]');
    if (i && !i.checked) i.click();
  });
  for (let i = 0; i < 20; i++) { await wait(500); if (await cap.eval(() => /Saved|保存しました/.test((document.querySelector('.members-cp-save-status') || {}).textContent || ''))) break; }
  await wait(600);
  await cap.capture('page-edit-checked', { settle: 600 });
  await cap.eval(() => document.querySelector('.editor-post-publish-panel__toggle').click());
  await wait(2500);
  await cap.eval(() => document.querySelector('.editor-post-publish-panel .editor-post-publish-button').click());
  for (let i = 0; i < 60; i++) { await wait(500); if (await cap.eval(() => !!document.querySelector('.post-publish-panel__postpublish'))) break; }
  await wait(3000);
  await cap.capture('page-published', { settle: 1000 });
  log('page access', JSON.stringify(await php("return [ get_post_status( (int) $data ), get_post_meta( (int) $data, '_members_access_role' ), get_permalink( (int) $data ) ];", pageId)));

  /* ------------------------------------------------------------ the member's pages (B): マイページ, 会員ステータス, the price, the page */
  const asMember = async (fn) => {
    await php('wp_logout(); return true;').catch(() => null);
    await go('/account/', 'form.login');
    await cap.type('#username', MEMBER.email);
    await cap.type('#password', MEMBER.password);
    await clickJs('button[name="login"]');
    await wait(2500);
    const ok = await cap.settle('.woocommerce-MyAccount-navigation', 30000).then(() => true, () => false);
    if (!ok) {
      // the form's answer (logged), then the member's session set by WordPress itself (wp_set_auth_cookie) as admin
      log('member login form:', await cap.eval(() => document.body.innerText.replace(/\s+/g, ' ').slice(0, 500)).catch(() => '?'));
      await cap.login();
      await php('wp_set_auth_cookie( (int) $data, false ); return true;', meta.id);
      await go('/account/', '.woocommerce-MyAccount-navigation');
    }
    await fn();
    const out = await cap.eval(() => { const a = document.querySelector('.woocommerce-MyAccount-navigation-link--customer-logout a'); return a && a.getAttribute('href'); });
    if (out) await logoutMember(out);
    await cap.login();
  };
  const html = (sel) => cap.eval((s) => { const e = document.querySelector(s); return e ? e.outerHTML : null; }, sel);
  await asMember(async () => {
    front.dashB = await html('.woocommerce');
    await go('/account/member-status/', '.woocommerce-MyAccount-content');
    front.status = await html('.woocommerce');
    front.statusTitle = await cap.eval(() => document.title);
    await go('/product/iyokanmarmalade/', '.product');
    front.price = await html('.summary .price, .product .price');
    await go('/wholesale/', 'body');
    front.deniedStatus = await cap.eval(() => document.title);
    front.denied = await html('.cm-txtcontents__body, main');
    await go('/account/', '.woocommerce-MyAccount-navigation');
  });
  log('front B', JSON.stringify({ price: front.price, denied: (front.denied || '').slice(0, 400), status: (front.status || '').slice(0, 300) }));

  // the role on the user screen (Members: several roles per user)
  await go(`/wp-admin/user-edit.php?user_id=${meta.id}`, '#your-profile');
  await cap.eval(() => { const e = document.querySelector('input[name="members_user_roles[]"], .members-user-roles, #role'); if (e) e.scrollIntoView({ block: 'center' }); });
  await wait(800);
  log('role ui', await cap.eval(() => [...document.querySelectorAll('input[name="members_user_roles[]"]')].map((c) => c.value + (c.checked ? '*' : '')).join(' ') || 'none'));
  await cap.capture('user-edit-roles');
  await cap.eval(() => { const c = document.querySelector('input[name="members_user_roles[]"][value="wholesale_member"]'); if (c && !c.checked) c.click(); });
  await clickJs('#submit');
  await wait(2000);
  await cap.settle('#your-profile');
  await wait(800);
  await cap.eval(() => { const e = document.querySelector('input[name="members_user_roles[]"]'); if (e) e.scrollIntoView({ block: 'center' }); });
  await cap.capture('user-roles-saved');
  log('member roles', JSON.stringify(await php('return get_userdata( (int) $data )->roles;', meta.id)));

  await asMember(async () => {
    await go('/wholesale/', 'body');
    front.allowed = await html('.cm-txtcontents__body, main');
    front.allowedTitle = await cap.eval(() => document.title);
    await go('/account/', '.woocommerce-MyAccount-navigation');
  });
  log('front C', (front.allowed || '').slice(0, 300));

  await go('/wp-admin/users.php', '.wp-list-table');
  await cap.finish();
})().catch((e) => { console.error(e); process.exit(1); });
