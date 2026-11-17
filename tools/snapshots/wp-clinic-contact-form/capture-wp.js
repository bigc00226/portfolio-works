/*
 * The REAL WordPress / Contact Form 7 screens of the wp-clinic-contact-form video, from WordPress itself (WordPress
 * Playground through tools/wp/playground.js), and the real HTML Contact Form 7 renders for the forms the video builds.
 *
 *   node tools/snapshots/wp-clinic-contact-form/capture-wp.js [shots folder]   → node tools/webp.js wp-clinic-contact-form
 *
 * Writes public/videos/wp-clinic-contact-form/js/wp-snapshot.js (window.WP_SNAPSHOT) and assets/wp/.
 * The forms (templates, mail settings) come from js/forms.js — the same text the video types — so what WordPress
 * shows / renders is exactly what is on screen.
 *
 * 1. 京橋ウェルネスクリニック (miyazawaclinic.net): plugin search → Contact Form 7 installed and activated (the real
 *    buttons), the Multi-Step add-on (its Freemius opt-in screen, skipped), the form editor for the input step and the
 *    confirm step, the mail tab (notification, auto-reply with the sender mistake and fixed). Front end: the input step
 *    rendered with Contact Form 7's automatic formatting on (p / br) and off, the validation errors of an empty submit,
 *    the confirm step after a real submit of the input step.
 * 2. かとう歯科 (kato-dental-clinic.net): its contact form (the live form's fields), the file field added, the mail
 *    attachments, the file size limit. Front end: the form with the file field, the error of a too large file.
 * Changed for the demo (besides tools/wp/playground.js' rules): the second site's screens get its own address.
 */
const fs = require('fs');
const path = require('path');
const WPC = require('../../wp/playground');

const ID = 'wp-clinic-contact-form';
const ROOT = path.resolve(__dirname, '../../..');
const DIR = path.join(ROOT, 'public/videos', ID);
const SHOTS = process.argv[2] || null;
const { log, wait } = WPC;
const W = {}; new Function('window', fs.readFileSync(path.join(DIR, 'js/forms.js'), 'utf8'))(W);
const F = W.FORMS;
const SITE_A = 'https://miyazawaclinic.net', SITE_B = 'https://kato-dental-clinic.net';

(async () => {
  const cap = await WPC.start({ id: ID, site: SITE_A, date: '2026-11-05', time: '14:14', shots: SHOTS });
  await cap.boot(WPC.blueprint({ title: '京橋ウェルネスクリニック', plugins: ['tablepress'], consts: { WPCF7_AUTOP: true } }));
  // the clinic's pages (the live site's titles / slugs) and a classic theme like the live one (its own slug)
  await cap.php(`$ids = [];
    foreach ( $data as $p ) { $ids[ $p['slug'] ] = wp_insert_post( [ 'post_type' => 'page', 'post_status' => 'publish', 'post_title' => $p['title'], 'post_name' => $p['slug'], 'post_parent' => $p['parent'] ? ( $ids[ $p['parent'] ] ?? 0 ) : 0 ] ); }
    wp_delete_post( 1, true ); wp_delete_post( 2, true ); wp_delete_post( 3, true );
    update_option( 'show_on_front', 'page' ); update_option( 'page_on_front', $ids['top'] ); return $ids;`, F.PAGES_A);
  await cap.files({
    'wp-content/themes/kyoubashi-wellness/style.css': '/*\nTheme Name: kyoubashi-wellness\n*/\n',
    'wp-content/themes/kyoubashi-wellness/index.php': "<?php get_header(); while ( have_posts() ) { the_post(); the_content(); } get_footer();\n",
    'wp-content/themes/kyoubashi-wellness/header.php': '<!DOCTYPE html><html <?php language_attributes(); ?>><head><meta charset="utf-8"><?php wp_head(); ?></head><body <?php body_class(); ?>>\n',
    'wp-content/themes/kyoubashi-wellness/footer.php': '<?php wp_footer(); ?></body></html>\n',
  });
  await cap.php("switch_theme( 'kyoubashi-wellness' ); return get_stylesheet();");

  // ---- 1. Contact Form 7: the plugin search, then the real install / activate buttons
  await cap.go('/wp-admin/plugin-install.php?s=Contact+Form+7&tab=search&type=term', '.plugin-card-contact-form-7');
  await cap.capture('plg-search');
  await cap.eval(() => document.querySelector('.plugin-card-contact-form-7 .install-now').click());
  await cap.settle('.plugin-card-contact-form-7 .activate-now', 120000);
  await cap.capture('plg-installed');
  const act = await cap.eval(() => document.querySelector('.plugin-card-contact-form-7 .activate-now').getAttribute('href'));
  await cap.go('/wp-admin/' + act.replace(/^.*wp-admin\//, '').replace(/&amp;/g, '&'), 'body').catch(() => null);
  await cap.go('/wp-admin/plugins.php?activate=true&plugin_status=all&paged=1&s=', '.wp-list-table');
  await cap.translations();
  await cap.go('/wp-admin/plugins.php?activate=true&plugin_status=all&paged=1&s=', '.wp-list-table');
  await cap.capture('plugins-cf7');

  // ---- the Multi-Step add-on (Webheadcoder) — its Freemius opt-in screen after activation, skipped
  await cap.go('/wp-admin/plugin-install.php?s=Contact+Form+7+Multi-Step&tab=search&type=term', '.plugin-card-contact-form-7-multi-step-module');
  await cap.capture('plg-search-ms');
  await cap.eval(() => document.querySelector('.plugin-card-contact-form-7-multi-step-module .install-now').click());
  await cap.settle('.plugin-card-contact-form-7-multi-step-module .activate-now', 120000);
  const act2 = await cap.eval(() => document.querySelector('.plugin-card-contact-form-7-multi-step-module .activate-now').getAttribute('href'));
  await cap.go('/wp-admin/' + act2.replace(/^.*wp-admin\//, '').replace(/&amp;/g, '&'), 'body').catch(() => null);
  await wait(2500);
  const where = await cap.eval(() => location.href.replace(/^.*wp-admin\//, '')).catch(() => '');
  log('after activating the add-on:', where);
  cap.data.optin = false;
  if (/contact-form-7-multi-step-module/.test(where) || await cap.eval(() => !!document.querySelector('#fs_connect, .fs-content')).catch(() => false)) {
    await cap.settle('#fs_connect, .fs-content', 30000).catch(() => null);
    await cap.capture('ms-optin');
    cap.data.optin = true;
    const skip = await cap.eval(() => { const s = document.querySelector('#skip_activation, .fs-actions #skip_activation, a#skip_activation, button#skip_activation'); if (s) { s.click(); return true; } return false; });
    log('skip clicked:', skip);
    await wait(4000);
  }
  await cap.translations();
  await cap.go('/wp-admin/plugins.php?activate=true&plugin_status=all&paged=1&s=', '.wp-list-table');
  await cap.capture('plugins-ms');

  // ---- the forms: list → new (input step) → saved
  await cap.go('/wp-admin/admin.php?page=wpcf7', '.wp-list-table');
  await cap.capture('cf7-list');
  await cap.go('/wp-admin/admin.php?page=wpcf7-new', '#wpcf7-form');
  await cap.capture('f1-new', { inputs: [['#title', 'title'], ['#wpcf7-form', 'form']] });
  const typeArea = (sel, text) => cap.eval((s, t) => { const e = document.querySelector(s); e.value = t; e.dispatchEvent(new Event('input', { bubbles: true })); e.dispatchEvent(new Event('change', { bubbles: true })); }, sel, text);
  const save = async (ready = '#wpcf7-admin-form-element') => {
    await cap.eval(() => { setTimeout(() => document.querySelector('#publishing-action input[name="wpcf7-save"], input[name="wpcf7-save"]').click(), 0); });
    await wait(2000);
    await cap.settle(ready, 90000);
  };
  await cap.type('#title', F.F1_TITLE);
  await typeArea('#wpcf7-form', F.F1_FORM);
  await save();
  const f1 = await cap.eval(() => ({ id: new URLSearchParams(location.search).get('post'), code: (document.querySelector('#wpcf7-shortcode') || {}).value || '' }));
  log('form 1', f1);
  cap.data.f1 = f1;
  await cap.capture('f1-saved');

  // ---- the confirm step: a second form (multiform / previous / multistep last_step send_email)
  await cap.go('/wp-admin/admin.php?page=wpcf7-new', '#wpcf7-form');
  await cap.capture('f2-new', { inputs: [['#title', 'title'], ['#wpcf7-form', 'form']] });
  await cap.type('#title', F.F2_TITLE);
  await typeArea('#wpcf7-form', F.F2_FORM);
  await save();
  const f2 = await cap.eval(() => ({ id: new URLSearchParams(location.search).get('post'), code: (document.querySelector('#wpcf7-shortcode') || {}).value || '' }));
  log('form 2', f2);
  cap.data.f2 = f2;
  await cap.capture('f2-saved');
  // the mail tab as a new form has it
  const tab = (name) => cap.eval((n) => { const b = document.querySelector(`#contact-form-editor-tabs [data-panel="${n}"]`); b.click(); window.scrollTo(0, 0); }, name);
  await tab('mail-panel');
  await wait(800);
  const MAIL_IN = [['#wpcf7-mail-recipient', 'm-to'], ['#wpcf7-mail-sender', 'm-from'], ['#wpcf7-mail-subject', 'm-subject'], ['#wpcf7-mail-additional-headers', 'm-headers'], ['#wpcf7-mail-body', 'm-body']];
  await cap.capture('f2-mail', { inputs: MAIL_IN });
  // the notification as typed on screen → saved (the add-on's documented warnings: the tags of the input step)
  for (const [sel, k] of MAIL_IN) await typeArea(sel, F.MAIL[k]);
  await save();
  await tab('mail-panel');
  await wait(800);
  await cap.capture('f2-mail-saved');
  cap.data.mailErrors = await cap.eval(() => [...document.querySelectorAll('#mail-panel .config-error, #mail-panel [class*="config-error"], .config-error')].map((e) => e.textContent.trim()).filter(Boolean));
  log('mail tab errors', cap.data.mailErrors);
  // Mail (2): the box ticked, the fields as a new form has them
  await cap.eval(() => { const c = document.querySelector('#wpcf7-mail-2-active'); if (!c.checked) c.click(); });
  await wait(600);
  await cap.eval(() => { const e = document.querySelector('#wpcf7-mail-2-active'); window.scrollTo(0, e.getBoundingClientRect().top + window.scrollY - 140); });
  await wait(500);
  const MAIL2_IN = [['#wpcf7-mail-2-recipient', 'm2-to'], ['#wpcf7-mail-2-sender', 'm2-from'], ['#wpcf7-mail-2-subject', 'm2-subject'], ['#wpcf7-mail-2-additional-headers', 'm2-headers'], ['#wpcf7-mail-2-body', 'm2-body']];
  await cap.capture('f2-mail2', { inputs: MAIL2_IN });
  // the auto-reply with the sender mistake (a Gmail address) → saved: Contact Form 7's own configuration error
  for (const [sel, k] of MAIL2_IN) await typeArea(sel, k === 'm2-from' ? F.MAIL2_BAD_FROM : F.MAIL2[k]);
  await save();
  await tab('mail-panel');
  await wait(600);
  await cap.eval(() => { const e = document.querySelector('#wpcf7-mail-2-sender'); window.scrollTo(0, e.getBoundingClientRect().top + window.scrollY - 260); });
  await wait(500);
  await cap.capture('f2-mail2-err', { inputs: [['#wpcf7-mail-2-sender', 'm2-from']] });
  cap.data.mail2Errors = await cap.eval(() => [...document.querySelectorAll('.config-error')].map((e) => e.textContent.trim()).filter(Boolean));
  log('mail 2 errors', cap.data.mail2Errors);
  await typeArea('#wpcf7-mail-2-sender', F.MAIL2['m2-from']);
  await save();
  await tab('mail-panel');
  await wait(600);
  await cap.eval(() => { const e = document.querySelector('#wpcf7-mail-2-sender'); window.scrollTo(0, e.getBoundingClientRect().top + window.scrollY - 260); });
  await wait(500);
  await cap.capture('f2-mail2-ok');

  // ---- the front end (data only): the forms as Contact Form 7 renders them
  const pageWith = (slug, title, code, parent = 0) => cap.php(`$id = wp_insert_post( [ 'post_type' => 'page', 'post_status' => 'publish', 'post_title' => $data['title'], 'post_name' => $data['slug'], 'post_parent' => $data['parent'], 'post_content' => $data['code'] ] ); return get_permalink( $id );`, { slug, title, code, parent });
  const contactId = await cap.php("return get_page_by_path( 'contact' )->ID;");
  const code1 = F.SHORTCODE(f1.code);
  await cap.php("$p = get_page_by_path( 'contact' ); wp_update_post( [ 'ID' => $p->ID, 'post_content' => $data ] ); return true;", code1);
  await pageWith('confirm', '入力内容の確認', F.SHORTCODE(f2.code), contactId);
  const front = async (rel, sel = '.wpcf7') => { await cap.go(rel, sel); await wait(1500); return cap.eval((s) => document.querySelector(s).outerHTML, sel); };
  cap.data.autopOn = await front('/contact/');
  await cap.php("file_put_contents( WP_CONTENT_DIR . '/mu-plugins/no-autop.php', \"<?php add_filter( 'wpcf7_autop_or_not', '__return_false' );\\n\" ); return true;");
  cap.data.input = await front('/contact/');
  // an empty submit → the validation errors as Contact Form 7 shows them
  await cap.eval(() => document.querySelector('.wpcf7 input[type="submit"]').click());
  await wait(4000);
  cap.data.invalid = await cap.eval(() => document.querySelector('.wpcf7').outerHTML);
  // the input step filled in → the confirm step (the add-on keeps the values in the browser)
  await cap.go('/contact/', '.wpcf7');
  await wait(1200);
  await cap.eval((v) => {
    const set = (n, val) => { const e = document.querySelector(`.wpcf7 [name="${n}"]`); e.value = val; e.dispatchEvent(new Event('input', { bubbles: true })); };
    set('your-name', v.name); set('your-email', v.email); set('symptoms', v.symptoms); set('request', v.request);
    document.querySelector(`.wpcf7 input[name="how-found[]"][value="${v.found}"]`).click();
    document.querySelector(`.wpcf7 input[name="wish"][value="${v.wish}"]`).click();
    document.querySelector('.wpcf7 input[type="submit"]').click();
  }, F.TEST);
  await wait(3000);
  await cap.settle('.wpcf7', 60000);
  await wait(2500);
  cap.data.confirmUrl = await cap.eval(() => location.pathname);
  cap.data.confirm = await cap.eval(() => document.querySelector('.wpcf7').outerHTML);
  log('confirm step at', cap.data.confirmUrl);

  // ---- 2. かとう歯科: the same WordPress becomes the second clinic's (its title, pages, its contact form)
  await cap.php(`update_option( 'blogname', 'かとう歯科' ); update_option( 'blogdescription', $data['tagline'] );
    foreach ( get_posts( [ 'post_type' => [ 'page', 'wpcf7_contact_form' ], 'numberposts' => -1, 'post_status' => 'any' ] ) as $p ) wp_delete_post( $p->ID, true );
    unlink( WP_CONTENT_DIR . '/mu-plugins/no-autop.php' );
    foreach ( $data['pages'] as $p ) wp_insert_post( [ 'post_type' => 'page', 'post_status' => 'publish', 'post_title' => $p['title'], 'post_name' => $p['slug'] ] );
    $f = WPCF7_ContactForm::get_template( [ 'title' => $data['title'] ] ); $f->set_properties( [ 'form' => $data['form'], 'mail' => array_merge( $f->prop( 'mail' ), $data['mail'] ) ] ); $id = $f->save();
    return [ 'id' => $id, 'hash' => $f->hash() ];`, { tagline: F.KATO_TAGLINE, pages: F.PAGES_B, title: F.K_TITLE, form: F.K_FORM, mail: F.K_MAIL });
  await cap.php("deactivate_plugins( [ 'contact-form-7-multi-step-module/contact-form-7-multi-step-module.php', 'tablepress/tablepress.php' ] ); return true;");
  await cap.go('/wp-admin/admin.php?page=wpcf7', '.wp-list-table');
  await cap.capture('k-list');
  const kid = await cap.eval(() => { const a = document.querySelector('.wp-list-table .row-title'); return new URL(a.href).searchParams.get('post'); });
  cap.data.k = { id: kid };
  await cap.go(`/wp-admin/admin.php?page=wpcf7&post=${kid}&action=edit`, '#wpcf7-form');
  await cap.capture('k-edit', { inputs: [['#wpcf7-form', 'form']] });
  await typeArea('#wpcf7-form', F.K_FORM_FILE);
  await save();
  await cap.capture('k-saved');
  cap.data.k.code = await cap.eval(() => (document.querySelector('#wpcf7-shortcode') || {}).value || '');
  await tab('mail-panel');
  await wait(600);
  await cap.eval(() => { const e = document.querySelector('#wpcf7-mail-attachments'); window.scrollTo(0, e.getBoundingClientRect().top + window.scrollY - 420); });
  await wait(400);
  await cap.capture('k-mail', { inputs: [['#wpcf7-mail-attachments', 'm-attach']] });
  await typeArea('#wpcf7-mail-attachments', F.K_ATTACH);
  await save();
  await tab('mail-panel');
  await wait(600);
  await cap.eval(() => { const e = document.querySelector('#wpcf7-mail-attachments'); window.scrollTo(0, e.getBoundingClientRect().top + window.scrollY - 420); });
  await wait(400);
  await cap.capture('k-mail-saved');
  // the front end: the form with the file field; a 4 MB photo → too large (the default limit, 1 MB)
  await cap.php("$p = get_page_by_path( 'contact' ); wp_update_post( [ 'ID' => $p->ID, 'post_content' => $data ] ); return true;", `[contact-form-7 id="${(cap.data.k.code.match(/id="([^"]+)"/) || [])[1]}" title="${F.K_TITLE}"]`);
  cap.data.kForm = await front('/contact/');
  const big = path.join(require('os').tmpdir(), 'IMG_4127.jpg');
  const sharp = require(path.join(ROOT, 'node_modules/sharp'));
  await sharp({ create: { width: 4032, height: 3024, channels: 3, noise: { type: 'gaussian', mean: 128, sigma: 60 } } }).jpeg({ quality: 92 }).toFile(big);
  log('test photo', (fs.statSync(big).size / 1048576).toFixed(1), 'MB');
  const fill = async () => {
    await cap.eval((v) => {
      const set = (n, val) => { const e = document.querySelector(`.wpcf7 [name="${n}"]`); if (e) { e.value = val; e.dispatchEvent(new Event('input', { bubbles: true })); } };
      set('your-name', v.name); set('your-email', v.email); set('textarea', v.text);
      const pc = document.querySelector('.wpcf7 input[name="policy[]"]'); if (pc && !pc.checked) pc.click();
    }, F.K_TEST);
    const input = await cap.frame.$('.wpcf7 input[type="file"]');
    await input.uploadFile(big);
    await cap.eval(() => document.querySelector('.wpcf7 input[type="submit"]').click());
    await wait(6000);
  };
  await fill();
  cap.data.kTooLarge = await cap.eval(() => document.querySelector('.wpcf7').outerHTML);
  // the limit raised (limit:10mb) → sent
  await cap.go(`/wp-admin/admin.php?page=wpcf7&post=${kid}&action=edit`, '#wpcf7-form');
  await typeArea('#wpcf7-form', F.K_FORM_FILE_10MB);
  await save();
  await cap.capture('k-saved-10mb');
  await cap.go('/contact/', '.wpcf7');
  await wait(1500);
  await fill();
  cap.data.kSent = await cap.eval(() => document.querySelector('.wpcf7').outerHTML);
  fs.rmSync(big, { force: true });

  const out = await cap.finish();
  // the second clinic's screens: its own address
  const file = path.join(DIR, 'js/wp-snapshot.js');
  for (const [k, p] of Object.entries(out.pages)) {
    if (!k.startsWith('k-')) continue;
    const fix = (s) => s.split(SITE_A).join(SITE_B).split(encodeURIComponent(SITE_A)).join(encodeURIComponent(SITE_B));
    p.html = fix(p.html); p.url = fix(p.url); p.title = fix(p.title);
  }
  for (const k of ['kForm', 'kTooLarge', 'kSent']) out.data[k] = out.data[k].split(SITE_A).join(SITE_B);
  fs.writeFileSync(file, `/* real WordPress screens (tools/snapshots/${ID}/capture-wp.js via tools/wp/playground.js, captured ${out.capturedAt}) — generated, do not edit */\nwindow.WP_SNAPSHOT = ` + JSON.stringify(out) + ';\n');
  log('done — now: node tools/webp.js ' + ID);
})().catch((e) => { console.error(e); process.exit(1); });
