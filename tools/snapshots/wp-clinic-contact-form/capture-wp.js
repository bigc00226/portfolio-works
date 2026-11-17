/*
 * The REAL WordPress / Contact Form 7 screens of the wp-clinic-contact-form video, from WordPress itself (WordPress
 * Playground through tools/wp/playground.js), and the real HTML Contact Form 7 renders for the forms the video builds.
 *
 *   node tools/snapshots/wp-clinic-contact-form/capture-wp.js [shots folder]   → node tools/webp.js wp-clinic-contact-form
 *
 * Writes public/videos/wp-clinic-contact-form/js/wp-snapshot.js (window.WP_SNAPSHOT) and assets/wp/.
 * The forms (template, mail settings) come from public/videos/wp-clinic-contact-form/js/forms.js — the text the video
 * types — so what WordPress shows and what Contact Form 7 renders is exactly what is on screen.
 *
 * 1. 京橋ウェルネスクリニック (miyazawaclinic.net, TablePress active as on the live site): the plugin search, Contact
 *    Form 7 installed and activated with the real buttons, the form list, a new form, the checkbox tag generator, the
 *    saved form (its shortcode shown), the mail tab (the notification: the visitor's address as the sender → the
 *    configuration error → fixed), Mail (2) (the auto-reply → the unsafe-mail warning), the reCAPTCHA integration (keys
 *    made up, saved) and the form saved again (the warning gone). Front end (data only): the form rendered with
 *    Contact Form 7's automatic formatting on and off, the validation errors of an empty submit.
 * 2. かとう歯科 (kato-dental-clinic.net): its contact form (the live form's fields), the file field added, the mail
 *    attachments, the file size limit raised. Front end: the form with the file field, the error of a 3.8 MB phone photo (the default limit, 1 MB).
 * Changed for the demo (besides tools/wp/playground.js' rules): the second clinic's screens get its own address;
 * Contact Form 7's "sender in the site's domain" check sees the clinic's domain (the Playground runs on its own host).
 */
const fs = require('fs');
const os = require('os');
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
  const cap = await WPC.start({ id: ID, site: SITE_A, date: '2026-11-05', time: '14:16', shots: SHOTS });
  await cap.boot(WPC.blueprint({ title: '京橋ウェルネスクリニック', plugins: ['tablepress'] }));
  // the Playground's frame sometimes answers "could not connect" right after booting: retry
  const php = async (code, data) => {
    for (let i = 0; ; i++) {
      try { return await cap.php(code, data); } catch (e) { if (i > 5 || !/could not connect|PHP failed \(404\)|reloading/i.test(e.message)) throw e; log('  php retry', i + 1); await wait(4000); await cap.go('/wp-admin/', '#wpadminbar').catch(() => null); }
    }
  };
  await wait(3000);
  // the clinic's pages (the live site's titles / slugs) and its theme's slug
  await php(`$ids = [];
    foreach ( $data as $p ) { $ids[ $p['slug'] ] = wp_insert_post( [ 'post_type' => 'page', 'post_status' => 'publish', 'post_title' => $p['title'], 'post_name' => $p['slug'], 'post_parent' => $p['parent'] ? ( $ids[ $p['parent'] ] ?? 0 ) : 0 ] ); }
    foreach ( [ 1, 2, 3 ] as $x ) wp_delete_post( $x, true );
    update_option( 'show_on_front', 'page' ); update_option( 'page_on_front', $ids['top'] ); return $ids;`, F.PAGES_A);
  await cap.files({
    'wp-content/themes/kyoubashi-wellness/style.css': '/*\nTheme Name: kyoubashi-wellness\n*/\n',
    'wp-content/themes/kyoubashi-wellness/index.php': "<?php get_header(); while ( have_posts() ) { the_post(); the_content(); } get_footer();\n",
    'wp-content/themes/kyoubashi-wellness/header.php': '<!DOCTYPE html><html <?php language_attributes(); ?>><head><meta charset="utf-8"><?php wp_head(); ?></head><body <?php body_class(); ?>>\n',
    'wp-content/themes/kyoubashi-wellness/footer.php': '<?php wp_footer(); ?></body></html>\n',
  });
  await php("switch_theme( 'kyoubashi-wellness' ); return get_stylesheet();");
  // Contact Form 7 checks that the sender belongs to the site's domain (home_url's host) and makes its default sender
  // (wordpress@<domain>) from it: the Playground runs on another host, so for those two only, the clinic's own domain
  // (as on the live site — noreply@miyazawaclinic.net is in-domain there)
  await cap.files({ 'wp-content/mu-plugins/demo-domain.php': `<?php
add_filter( 'home_url', function ( $url, $path ) {
	foreach ( debug_backtrace( DEBUG_BACKTRACE_IGNORE_ARGS, 12 ) as $f ) {
		if ( in_array( $f['function'] ?? '', [ 'wpcf7_is_email_in_site_domain', 'from_email' ], true ) ) return get_option( 'demo_domain' ) . '/' . ltrim( (string) $path, '/' );
	}
	return $url;
}, 10, 2 );
` });
  await php('update_option( "demo_domain", $data ); return true;', SITE_A);
  // the Playground's sample plugin (the plugin list shows what the live site shows: Contact Form 7, TablePress)
  await php("@unlink( WP_PLUGIN_DIR . '/hello.php' ); return ! file_exists( WP_PLUGIN_DIR . '/hello.php' );");
  // TablePress (on the live site) asks for its opt-in once: skipped long ago on a working site
  await cap.go('/wp-admin/admin.php?page=tablepress', 'body').catch(() => null);
  await wait(2500);
  if (await cap.eval(() => !!document.querySelector('#skip_activation')).catch(() => false)) { await cap.eval(() => document.querySelector('#skip_activation').click()); await wait(4000); log('TablePress opt-in skipped'); }

  // ---- 1. Contact Form 7: the plugin search, then the real install / activate buttons
  await cap.go('/wp-admin/plugin-install.php', '#search-plugins');
  await cap.capture('plg-add', { inputs: [['#search-plugins', 'q']] });
  await cap.go('/wp-admin/plugin-install.php?s=Contact+Form+7&tab=search&type=term', '.plugin-card-contact-form-7');
  await cap.capture('plg-search');
  await cap.eval(() => document.querySelector('.plugin-card-contact-form-7 .install-now').click());
  await cap.settle('.plugin-card-contact-form-7 .activate-now', 120000);
  await cap.capture('plg-installed');
  const act = await cap.eval(() => document.querySelector('.plugin-card-contact-form-7 .activate-now').getAttribute('href'));
  await cap.go('/wp-admin/' + act.replace(/^.*wp-admin\//, '').replace(/&amp;/g, '&'), 'body').catch(() => null);
  await cap.translations();
  await cap.go('/wp-admin/plugins.php?activate=true&plugin_status=all&paged=1&s=', '.wp-list-table');
  await cap.capture('plugins-cf7');

  // ---- the form: list → new → the checkbox tag generator → saved
  const step = (s) => log('  ' + s);
  const typeArea = (sel, text) => cap.eval((s, t) => { const e = document.querySelector(s); if (!e) throw new Error('no field ' + s + ' at ' + location.href); e.value = t; e.dispatchEvent(new Event('input', { bubbles: true })); e.dispatchEvent(new Event('change', { bubbles: true })); }, sel, text);
  const save = async () => {
    step('save');
    await cap.eval(() => { const b = document.querySelector('#publishing-action [name="wpcf7-save"]') || document.querySelector('[name="wpcf7-save"]'); if (!b) throw new Error('no save button at ' + location.href); setTimeout(() => b.click(), 0); });
    await wait(2500);
    await cap.settle('#wpcf7-admin-form-element', 90000);
  };
  const tab = (name) => { step('tab ' + name); return cap.eval((n) => { const b = document.querySelector(`#contact-form-editor-tabs [data-panel="${n}"]`); if (!b) throw new Error('no tab ' + n + ' at ' + location.href + ' — ' + document.title); b.click(); window.scrollTo(0, 0); }, name); };
  const scrollTo = (sel, off) => cap.eval((s, o) => { const e = document.querySelector(s); window.scrollTo(0, e.getBoundingClientRect().top + window.scrollY - o); }, sel, off);

  await cap.go('/wp-admin/admin.php?page=wpcf7', '.wp-list-table');
  await cap.capture('cf7-list');
  await cap.go('/wp-admin/admin.php?page=wpcf7-new', '#wpcf7-form');
  await cap.capture('f1-new', { inputs: [['#title', 'title'], ['#wpcf7-form', 'form']] });
  // the checkbox tag generator (the dialog the template's checkbox-344 comes from)
  step('tag generator');
  await cap.eval(() => { const b = [...document.querySelectorAll('#tag-generator-list button, #tag-generator-list a')].find((x) => /チェックボックス/.test(x.textContent)); b.click(); });
  await wait(1200);
  const dlg = await cap.eval(() => {
    const d = [...document.querySelectorAll('dialog[open], .tag-generator-dialog, [role="dialog"]')].find((x) => x.offsetParent || x.open);
    if (!d) return null;
    const name = d.querySelector('input[name="name"], [data-tag-part="name"]');
    if (name) { name.value = 'checkbox-344'; name.dispatchEvent(new Event('input', { bubbles: true })); name.dispatchEvent(new Event('change', { bubbles: true })); }
    const req = d.querySelector('input[name="required"], [data-tag-part="type-suffix"]');
    if (req && req.type === 'checkbox' && !req.checked) req.click();
    return { fields: [...d.querySelectorAll('input, textarea, select')].map((e) => `${e.tagName} ${e.name || e.id} [${e.type}] ${String(e.value).slice(0, 40)}`) };
  });
  log('dialog', JSON.stringify(dlg && dlg.fields));
  const optSel = await cap.eval(() => { const d = document.querySelector('dialog[open]'); const t = d && d.querySelector('textarea'); if (t) t.id = t.id || 'demo-tg-values'; return t ? '#' + t.id : null; });
  await cap.capture('f1-tg', { inputs: optSel ? [[optSel, 'tg-values']] : [] });
  cap.data.tgSel = optSel;
  if (optSel) {
    await typeArea(optSel, 'ご紹介\nインターネット検索\n雑誌や書籍\nその他');
    await wait(400);
    cap.data.tgTag = await cap.eval(() => { const d = document.querySelector('dialog[open]'); const t = d && d.querySelector('input.tag, input[name="tag"], .insert-box input, [data-tag-part="tag"]'); return t ? t.value : ''; });
    log('tag generated:', cap.data.tgTag);
    await cap.capture('f1-tg-filled');
    await cap.eval(() => { const d = document.querySelector('dialog[open]'); const c = d && (d.querySelector('button[data-taggen="close-dialog"], .close-button, button.close') || [...d.querySelectorAll('button')].find((b) => /閉じる|close|×/i.test(b.textContent + b.getAttribute('aria-label')))); if (c) c.click(); else if (d) d.close(); });
    await wait(500);
  }
  await cap.type('#title', F.F1_TITLE);
  await typeArea('#wpcf7-form', F.F1_FORM);
  await save();
  cap.data.f1 = await cap.eval(() => ({ id: new URLSearchParams(location.search).get('post'), code: (document.querySelector('#wpcf7-shortcode') || {}).value || '' }));
  log('form', cap.data.f1);
  await cap.capture('f1-saved');
  // Contact Form 7 6.2 keeps the shortcode folded away (the block editor does not need it): the toggle shows it
  await cap.eval(() => document.querySelector('.toggle-shortcode').click());
  await wait(500);
  await cap.capture('f1-code');

  // ---- the mail tab: the notification, then Mail (2) — the auto-reply
  await tab('mail-panel');
  await wait(800);
  const MAIL_IN = [['#wpcf7-mail-recipient', 'm-to'], ['#wpcf7-mail-sender', 'm-from'], ['#wpcf7-mail-subject', 'm-subject'], ['#wpcf7-mail-additional-headers', 'm-headers'], ['#wpcf7-mail-body', 'm-body']];
  await cap.capture('mail', { inputs: MAIL_IN });
  cap.data.mailErrorsDefault = await cap.eval(() => [...document.querySelectorAll('.config-error')].map((e) => e.textContent.trim()).filter(Boolean));
  log('default mail errors', cap.data.mailErrorsDefault);
  // the first try: the visitor's address as the sender → Contact Form 7's configuration error
  for (const [sel, k] of MAIL_IN) await typeArea(sel, k === 'm-from' ? F.MAIL_BAD_FROM : F.MAIL[k]);
  await save();
  await tab('mail-panel');
  await wait(600);
  await scrollTo('#wpcf7-mail-recipient', 200);
  await wait(500);
  await cap.capture('mail-err', { inputs: [['#wpcf7-mail-sender', 'm-from']] });
  cap.data.mailErrors = await cap.eval(() => [...document.querySelectorAll('.config-error')].map((e) => e.textContent.trim()).filter(Boolean));
  log('mail errors', cap.data.mailErrors);
  // the sender fixed (the clinic's own domain; replies go to the visitor through Reply-To)
  await typeArea('#wpcf7-mail-sender', F.MAIL['m-from']);
  await save();
  await tab('mail-panel');
  await wait(600);
  await scrollTo('#wpcf7-mail-recipient', 200);
  await wait(500);
  await cap.capture('mail-saved');
  cap.data.mailOk = await cap.eval(() => [...document.querySelectorAll('.config-error')].map((e) => e.textContent.trim()).filter(Boolean));
  log('mail errors after the fix', cap.data.mailOk);
  // Mail (2): the auto-reply → the unsafe-mail warning (it goes to an address the visitor typed, no spam protection yet)
  step('mail 2 on');
  await cap.eval(() => { const c = document.querySelector('#wpcf7-mail-2-active'); if (!c) throw new Error('no mail 2 box'); if (!c.checked) c.click(); });
  await wait(600);
  await scrollTo('#wpcf7-mail-2-active', 140);
  await wait(500);
  const MAIL2_IN = [['#wpcf7-mail-2-recipient', 'm2-to'], ['#wpcf7-mail-2-sender', 'm2-from'], ['#wpcf7-mail-2-subject', 'm2-subject'], ['#wpcf7-mail-2-additional-headers', 'm2-headers'], ['#wpcf7-mail-2-body', 'm2-body']];
  await cap.capture('mail2', { inputs: MAIL2_IN });
  for (const [sel, k] of MAIL2_IN) await typeArea(sel, F.MAIL2[k]);
  await save();
  await tab('mail-panel');
  await wait(600);
  await scrollTo('#wpcf7-mail-2-active', 140);
  await wait(500);
  await cap.capture('mail2-err');
  cap.data.mail2Errors = await cap.eval(() => [...document.querySelectorAll('.config-error')].map((e) => e.textContent.trim()).filter(Boolean));
  log('mail 2 errors', cap.data.mail2Errors);

  // ---- the front end (data only): the form as Contact Form 7 renders it
  const code = cap.data.f1.code;
  await php("$p = get_page_by_path( 'contact' ); wp_update_post( [ 'ID' => $p->ID, 'post_content' => $data ] ); return true;", code);
  const front = async (rel, sel = '.wpcf7') => { await cap.go(rel, sel); await wait(1500); return cap.eval((s) => document.querySelector(s).outerHTML, sel); };
  cap.data.autopOn = await front('/contact/');
  await php("file_put_contents( WP_CONTENT_DIR . '/mu-plugins/no-autop.php', \"<?php add_filter( 'wpcf7_autop_or_not', '__return_false' );\\n\" ); return true;");
  cap.data.input = await front('/contact/');
  await cap.eval(() => document.querySelector('.wpcf7 input[type="submit"]').click());
  await wait(5000);
  cap.data.invalid = await cap.eval(() => document.querySelector('.wpcf7').outerHTML);

  // ---- reCAPTCHA (the live page loads reCAPTCHA v3: Contact Form 7's integration)
  await cap.go('/wp-admin/admin.php?page=wpcf7-integration', '#wpbody-content');
  await cap.capture('integ');
  await cap.go('/wp-admin/admin.php?page=wpcf7-integration&service=recaptcha&action=setup', '#wpbody-content');
  const recIn = await cap.eval(() => [...document.querySelectorAll('#wpbody-content input[type="text"]')].map((e) => '#' + e.id).filter((x) => x !== '#'));
  log('recaptcha inputs', recIn);
  await cap.capture('integ-recaptcha', { inputs: recIn.slice(0, 2).map((s, i) => [s, i ? 'secret' : 'sitekey']) });
  cap.data.recIn = recIn;
  // keys (made up; blurred in the video) saved → reCAPTCHA active → the form saved again: the unsafe-mail warning is gone
  await typeArea(recIn[0], '6LfQx' + 'Kp3AAAAAN2vR8mT0cYwq4ZbE7sJhU1gXo9i');
  await typeArea(recIn[1], '6LfQx' + 'Kp3AAAAAH5nW2eL8tVaR0yBqD3kMfZ6cUs7');
  await cap.eval(() => { const b = document.querySelector('#wpbody-content form [type="submit"]'); setTimeout(() => b.click(), 0); });
  await wait(2500);
  await cap.settle('#wpbody-content', 60000);
  await wait(800);
  cap.data.integMsg = await cap.eval(() => [...document.querySelectorAll('#wpbody-content .notice, #wpbody-content .updated, #wpbody-content .card')].map((e) => e.textContent.replace(/\s+/g, ' ').trim()));
  log('integration', cap.data.integMsg);
  await cap.capture('integ-saved');
  await cap.go(`/wp-admin/admin.php?page=wpcf7&post=${cap.data.f1.id}&action=edit`, '#wpcf7-form');
  await save();
  await tab('mail-panel');
  await wait(600);
  await scrollTo('#wpcf7-mail-2-active', 140);
  await wait(500);
  await cap.capture('mail2-safe');
  cap.data.mail2Safe = await cap.eval(() => [...document.querySelectorAll('.config-error')].map((e) => e.textContent.trim()).filter(Boolean));
  log('after reCAPTCHA', cap.data.mail2Safe);

  // ---- 2. かとう歯科: the same WordPress becomes the second clinic's (its title, pages, its contact form)
  await php(`update_option( 'blogname', 'かとう歯科' ); update_option( 'demo_domain', $data['site'] ); WPCF7::update_option( 'recaptcha', null ); update_option( 'blogdescription', $data['tagline'] );
    foreach ( get_posts( [ 'post_type' => [ 'page', 'wpcf7_contact_form' ], 'numberposts' => -1, 'post_status' => 'any' ] ) as $p ) wp_delete_post( $p->ID, true );
    @unlink( WP_CONTENT_DIR . '/mu-plugins/no-autop.php' );
    foreach ( $data['pages'] as $p ) wp_insert_post( [ 'post_type' => 'page', 'post_status' => 'publish', 'post_title' => $p['title'], 'post_name' => $p['slug'] ] );
    $f = WPCF7_ContactForm::get_template( [ 'title' => $data['title'] ] ); $f->set_properties( [ 'form' => $data['form'], 'mail' => array_merge( $f->prop( 'mail' ), $data['mail'] ) ] ); $id = $f->save();
    deactivate_plugins( [ 'tablepress/tablepress.php' ] );
    return $id;`, { site: SITE_B, tagline: F.KATO_TAGLINE, pages: F.PAGES_B, title: F.K_TITLE, form: F.K_FORM, mail: F.K_MAIL });
  await cap.go('/wp-admin/admin.php?page=wpcf7', '.wp-list-table');
  await cap.capture('k-list');
  const kid = await cap.eval(() => new URL(document.querySelector('.wp-list-table .row-title').href).searchParams.get('post'));
  cap.data.k = { id: kid };
  await cap.go(`/wp-admin/admin.php?page=wpcf7&post=${kid}&action=edit`, '#wpcf7-form');
  await cap.capture('k-edit', { inputs: [['#wpcf7-form', 'form']] });
  await typeArea('#wpcf7-form', F.K_FORM_FILE);
  await save();
  await cap.capture('k-saved');
  cap.data.k.code = await cap.eval(() => (document.querySelector('#wpcf7-shortcode') || {}).value || '');
  await tab('mail-panel');
  await wait(600);
  await scrollTo('#wpcf7-mail-attachments', 420);
  await wait(400);
  await cap.capture('k-mail', { inputs: [['#wpcf7-mail-attachments', 'm-attach']] });
  await typeArea('#wpcf7-mail-attachments', F.K_ATTACH);
  await save();
  await tab('mail-panel');
  await wait(600);
  await scrollTo('#wpcf7-mail-attachments', 420);
  await wait(400);
  await cap.capture('k-mail-saved');
  await tab('form-panel');
  await wait(600);
  await cap.capture('k-form2', { inputs: [['#wpcf7-form', 'form']] });
  // the front end: the form with the file field; a phone photo (3.8 MB) → too large (the default limit, 1 MB)
  await php("$p = get_page_by_path( 'contact' ); wp_update_post( [ 'ID' => $p->ID, 'post_content' => $data ] ); return true;", cap.data.k.code);
  cap.data.kForm = await front('/contact/');
  const big = path.join(os.tmpdir(), 'IMG_4127.jpg');
  const sharp = require(path.join(ROOT, 'node_modules/sharp'));
  await sharp({ create: { width: 4032, height: 3024, channels: 3, noise: { type: 'gaussian', mean: 128, sigma: 33 } } }).blur(0.6).jpeg({ quality: 86 }).toFile(big);
  cap.data.kPhoto = fs.statSync(big).size;
  log('test photo', (cap.data.kPhoto / 1048576).toFixed(2), 'MB');
  const fillK = async () => {
    await cap.eval((v) => {
      const set = (n, val) => { const e = document.querySelector(`.wpcf7 [name="${n}"]`); if (e) { e.value = val; e.dispatchEvent(new Event('input', { bubbles: true })); } };
      set('your-name', v.name); set('your-email', v.email); set('textarea', v.text);
      const pc = document.querySelector('.wpcf7 input[name="policy[]"]'); if (pc && !pc.checked) pc.click();
    }, F.K_TEST);
    const input = await cap.frame.$('.wpcf7 input[type="file"]');
    await input.uploadFile(big);
    await cap.eval(() => document.querySelector('.wpcf7 input[type="submit"]').click());
    await wait(7000);
  };
  await fillK();
  cap.data.kTooLarge = await cap.eval(() => document.querySelector('.wpcf7').outerHTML);
  // the limit raised (limit:10mb) → saved; the form sent again
  await cap.go(`/wp-admin/admin.php?page=wpcf7&post=${kid}&action=edit`, '#wpcf7-form');
  await typeArea('#wpcf7-form', F.K_FORM_FILE_10MB);
  await save();
  await cap.capture('k-saved-10mb');
  await cap.go('/contact/', '.wpcf7');
  await wait(1500);
  await fillK();
  cap.data.kSent = await cap.eval(() => document.querySelector('.wpcf7').outerHTML);
  fs.rmSync(big, { force: true });

  const ORIGIN = cap.origin;
  const out = await cap.finish();
  const toSite = (s, site) => s.split(ORIGIN).join(site).split(ORIGIN.replace(/^https:/, 'http:')).join(site).split(new URL(ORIGIN).pathname).join('');
  for (const [k, v] of Object.entries(out.data)) if (typeof v === 'string') out.data[k] = toSite(v, /^k[A-Z]/.test(k) ? SITE_B : SITE_A);
  // the second clinic's screens: its own address
  for (const [k, p] of Object.entries(out.pages)) {
    if (!k.startsWith('k-')) continue;
    const fix = (s) => s.split(SITE_A).join(SITE_B).split(encodeURIComponent(SITE_A)).join(encodeURIComponent(SITE_B));
    p.html = fix(p.html); p.url = fix(p.url); p.title = fix(p.title);
  }
  fs.writeFileSync(path.join(DIR, 'js/wp-snapshot.js'), `/* real WordPress screens (tools/snapshots/${ID}/capture-wp.js via tools/wp/playground.js, captured ${out.capturedAt}) — generated, do not edit */\nwindow.WP_SNAPSHOT = ` + JSON.stringify(out) + ';\n');
  log('done — now: node tools/webp.js ' + ID);
})().catch((e) => { console.error(e); process.exit(1); });
