/*
 * Timeline: the contact forms of two clinics on Contact Form 7 —
 * 京橋ウェルネスクリニック (miyazawaclinic.net): the plugin, a form from the theme's own form markup (the static inputs
 * kept as comments, the form-tags under them, the checkbox from the tag generator), the shortcode in page-contact.php,
 * the automatic formatting turned off, the notification (the sender mistake), the auto-reply (the unsafe-mail warning →
 * reCAPTCHA v3), the empty submit, a test send → the thanks page, both mails in the clinic's inbox;
 * かとう歯科 (kato-dental-clinic.net): a photo field (jpg / png / pdf), the mail attachment, a phone photo too large →
 * the size limit raised → sent.
 * Every WordPress / Contact Form 7 screen is the real one (js/wp-snapshot.js); the clinics' pages are the live ones
 * (js/site-snapshot.js); the inbox is a look-alike (js/apps.js).
 *
 * Keys:  Space = start / pause   R = restart   C = captions on/off   H = hide hint
 * URL :  ?t=83 (seek, s)   ?from=4 (start of scene 4)   ?speed=1.3   ?captions=0
 */
(function () {
  'use strict';
  const D = window.Demo, K = window.Kit, F = window.FORMS, X = window.FILES, S = window.SITE_SNAPSHOT, WP = window.WP;
  const CC = window.CC, Front = window.Front, Mail = window.Mail;
  const { esc, wait, Caption, Issue, Keycap, Win, screenRect, clickUi, hoverUi } = D;
  const { Code, Term, Browser, Store, FileDialog, readHold } = K;
  const DEV = CC.DEV, KATO = CC.KATO;
  const PC = 'page-contact.php', FN = 'functions.php';
  const FORM_END = X.FORM_AT + X.FORM_LEN - 1;

  /* ------------------------------------------------ Japanese typed through the IME */
  const BR = (o, c) => ({ c: [o, c, o === '[' ? '『' : '』'], p: 1 });
  const JA = {
    'お問い合わせ': { r: 'otoiawase', segs: ['お問い合わせ'], predict: ['お問い合わせ', 'お問い合わせフォーム'], yomi: ['おといあわせ', 'おといあわせふぉーむ'] },
    'コンタクトフォーム設定用': { r: 'kontakutofo-musetteiyou', segs: ['コンタクト', 'フォーム', '設定用'] },
    '例': { r: 'rei', segs: ['例'] },
    '山田花子': { r: 'yamadahanako', segs: ['山田', '花子'] },
    'ご紹介': { r: 'goshoukai', segs: ['ご紹介'] },
    'インターネット検索': { r: 'inta-nettokensaku', segs: ['インターネット', '検索'] },
    '雑誌や書籍': { r: 'zasshiyashoseki', segs: ['雑誌', 'や', '書籍'] },
    'その他': { r: 'sonota', segs: ['その他'] },
    'お問い合わせフォーム：': { r: 'otoiawasefo-mu:', segs: ['お問い合わせ', 'フォーム', '：'] },
    '（元のフォームはコメントで残す）': { r: '(motonofo-muhakomentodenokosu)', segs: ['（', '元の', 'フォームは', 'コメントで', '残す', '）'] },
    '：自動で': { r: ':jidoude', segs: ['：', '自動で'] },
    'を入れない（テーマのマークアップのまま出力）': { r: 'woirenai(te-manoma-kuappunomamashutsuryoku)', segs: ['を', '入れない', '（', 'テーマの', 'マークアップの', 'まま', '出力', '）'] },
    '【お問い合わせ】': { r: '[otoiawase]', segs: [BR('「', '【'), 'お問い合わせ', BR('」', '】')] },
    '様': { r: 'sama', segs: ['様'] },
    '【京橋ウェルネスクリニック】お問い合わせありがとうございます': { r: '[kyoubashiwerunesukurinikku]otoiawasearigatougozaimasu', segs: [BR('「', '【'), '京橋', 'ウェルネス', 'クリニック', BR('」', '】'), 'お問い合わせ', 'ありがとうございます'] },
    'テスト': { r: 'tesuto', segs: ['テスト'] },
    '花子': { r: 'hanako', segs: ['花子'] },
    '太郎': { r: 'tarou', segs: ['太郎'] },
    'フォームの送信テストです。': { r: 'fo-munosoushintesutodesu.', segs: ['フォームの', '送信', 'テストです。'] },
    '（テスト送信）': { r: '(tesutosoushin)', segs: ['（', 'テスト', '送信', '）'] },
    '任意': { r: 'ninni', segs: ['任意'] },
    '画像の添付': { r: 'gazounotenpu', segs: ['画像の', '添付'] },
    'お口の写真やレントゲン画像など（': { r: 'okuchinoshashinyarentogengazounado(', segs: ['お口の', '写真や', 'レントゲン', '画像など', '（'] },
    '・': { r: '/', segs: ['・'] },
    '）': { r: ')', segs: ['）'] },
    '、': { r: ',', segs: ['、'] },
    'まで': { r: 'made', segs: ['まで'] },
    '画像添付のテストです。': { r: 'gazoutenpunotesutodesu.', segs: ['画像', '添付の', 'テストです。'] },
  };
  /** the typing script of one line (Japanese runs through the IME, the rest typed as is) */
  const line = (text) => K.codeScript([text], JA);
  /** several lines typed into a text box (a textarea: Enter, no auto-indent) */
  const lines = (arr) => arr.flatMap((l, i) => (i ? [{ key: 'Enter' }, ...line(l)] : line(l)));

  /* ------------------------------------------------------------- helpers */
  const R = (el, pad = 0) => () => { const e = typeof el === 'function' ? el() : el; if (!e) return null; const r = screenRect(e); return { left: r.left - pad, top: r.top - pad, width: r.width + pad * 2, height: r.height + pad * 2 }; };
  const W = (sel) => WP.el(sel);
  const byText = (sel, re) => WP.els(sel).find((e) => re.test(e.textContent));
  const check = (got, want, tag) => { if (got !== want) { console.warn('[demo] ' + tag + ' differs from the expected text'); window.__typeDiff = (window.__typeDiff || []).concat(tag); } };
  const show = (key, load = 500) => CC.wp(key, { load });
  const linesRect = (a, b) => () => {
    const r1 = Code.lineEl(a), r2 = Code.lineEl(b);
    if (!r1 || !r2) return null;
    const x = screenRect(r1.querySelector('.lc')), y = screenRect(r2.querySelector('.lc'));
    return { left: x.left, top: x.top, width: Math.min(x.width, 1000), height: y.bottom - x.top };
  };
  /** a part of a text box's text marked (an element to point at): the box shows `text` with `needle` wrapped */
  const markIn = (name, text, needle) => {
    const box = CC.box(name);
    const i = text.indexOf(needle);
    if (i < 0) return box;
    box.innerHTML = `${esc(text.slice(0, i))}<span data-mark>${esc(needle)}</span>${esc(text.slice(i + needle.length))}`;
    const m = box.querySelector('[data-mark]');
    const y = m.getBoundingClientRect().top - box.getBoundingClientRect().top + box.scrollTop;
    if (y < box.scrollTop || y > box.scrollTop + box.clientHeight - 30) box.scrollTop = Math.max(0, y - box.clientHeight / 3);
    return m;
  };
  /** the save button of Contact Form 7's editor: click, the page reloads into `key` */
  const save = async (key, load = 900) => {
    const b = W('#publishing-action [name="wpcf7-save"]') || W('[name="wpcf7-save"]');
    if (b) await clickUi(b, { kind: 'hand', after: 80 });
    await show(key, load);
  };
  const deploy = async () => {
    await Term.run('npm run deploy', ['', '<span class="tdim">&gt; kyoubashi-wellness@ deploy</span>', '<span class="tdim">&gt; node scripts/deploy.mjs</span>', '', 300,
      async () => Term.spin('miyazawaclinic.net に接続しています…', 900, '  ↑ ' + (Code.active || PC) + '  <span class="tdim">→ wp-content/themes/kyoubashi-wellness/</span>'),
      '<span class="tg">✔</span> 1 ファイルをアップロードしました <span class="tdim">(1.2s)</span>'], { kps: 20 });
  };
  /** a clinic's page in the browser (`before(doc)`: what differs from the live page, put in before it shows) */
  const load = (page, before) => Store.load(page, { before: (doc) => { Front.enable(doc); if (before) before(doc); } });
  const STATIC = F.STATIC_FORM.join('\n');
  /** the live contact page: reload (F5), the form in view */
  const reloadSite = async (page, o = {}) => {
    await Browser.reload(() => load(page, o.before), { key: 'F5' });
    const form = Store.doc.querySelector(o.at || '.wpcf7');
    if (form) await Store.scrollToEl(form, o.offset != null ? o.offset : 140, o.ms || 1200);
  };
  const wpTab = (id, key) => { const t = Browser.tab(id); t.wpKey = key; t.onShow = () => { if (t.wpKey) WP.show(t.wpKey); }; };

  /* ================================================================ scenes */
  const SCENES = [];
  const scene = (name, fn) => SCENES.push({ name, fn });

  scene('intro', K.introScene);

  /* 1 — the static form, Contact Form 7 from the plugin directory */
  scene('plugin', async () => {
    Caption.step(1);
    Caption.set('京橋ウェルネスクリニックのお問い合わせページ。フォームはデザインどおりに並んでいるが、まだ送信できない');
    await wait(900);
    const form = Store.doc.querySelector('.wpcf7') || Store.doc.querySelector('.contact__form-wrap');
    await Store.scrollToEl(form, 140, 2200);
    await wait(600);
    // the theme: the form is markup only
    await Win.switchTo('code');
    Caption.set('テーマの page-contact.php：action も name 属性もない、見た目だけのフォーム（コーディング時のまま）');
    await Code.reveal(X.FORM_AT + 6, 700);
    Issue.show(linesRect(X.FORM_AT, X.FORM_AT + 8), 'action="" ・ 入力欄に name がない → 送信できない');
    await hoverUi(Code.lineEl(X.FORM_AT), { ax: 0.35, hold: 2400 });
    Issue.hide();
    // wp-admin: プラグインを追加
    Caption.set('送信・メールは Contact Form 7 で。管理画面のプラグインを追加から');
    await Win.switchTo('browser');
    await Browser.clickTab('wp');
    await CC.type('q', 'Contact Form 7', { kps: 14, ax: 0.3 });
    await show('plg-search', 900);
    const card = W('.plugin-card-contact-form-7');
    if (card) { Issue.ok(R(card), 'Contact Form 7（株式会社ロックロブスター）'); await hoverUi(card.querySelector('.name, h3') || card, { hold: 1400 }); Issue.hide(); }
    const inst = W('.plugin-card-contact-form-7 .install-now');
    if (inst) {
      await clickUi(inst, { kind: 'hand', after: 60 });
      inst.classList.add('updating-message');
      inst.textContent = 'インストール中…';
      await wait(1500);
    }
    await show('plg-installed', 300);
    const act = W('.plugin-card-contact-form-7 .activate-now');
    if (act) await clickUi(act, { kind: 'hand', after: 60 });
    await show('plugins-cf7', 900);
    const row = W('tr[data-slug="contact-form-7"]');
    if (row) { Issue.ok(R(row), 'Contact Form 7 6.2.5（有効）'); await readHold(1800); Issue.hide(); }
  });

  /* 2 — the form: the theme's markup, the form-tags */
  scene('form', async () => {
    Caption.step(2);
    Caption.set('フォームはデザインのマークアップのまま使う：page-contact.php のフォームをコピー');
    await Win.switchTo('code');
    await Code.selectLines(X.FORM_AT, FORM_END);
    await Keycap.show(['Ctrl', 'C'], 700);
    await wait(300);
    // お問い合わせ → コンタクトフォームを追加
    await Win.switchTo('browser');
    await clickUi(W('#toplevel_page_wpcf7 > a') || W('#adminmenu'), { after: 60 });
    await show('cf7-list', 700);
    Caption.set('「コンタクトフォーム 1」は有効化で入るサンプル。新しくフォームを作る');
    const sample = W('.row-title');
    if (sample) await hoverUi(sample, { hold: 1000 });
    await clickUi(W('.page-title-action'), { kind: 'hand', after: 60 });
    await show('f1-new', 700);
    await CC.type('title', line(F.F1_TITLE), { kps: 12 });
    // the template: the theme's form pasted over the sample
    Caption.set('フォームのテンプレートに貼り付け、入力欄を Contact Form 7 のフォームタグに置き換えていく');
    let text = await CC.paste('form', F.formAt(), { top: true, hold: 700 });
    check(text, F.formAt(), 'paste');
    // the outer <form>: Contact Form 7 outputs its own
    Caption.set('<form> は Contact Form 7 が出力するので、外側は <div> に');
    const head = F.STATIC_FORM[0];
    text = await CC.type('form', [{ direct: '<!-- ' }, ...line('コンタクトフォーム設定用'), { direct: ' -->' }, { key: 'Enter' }, { key: 'Enter' }, { direct: '<div class="contact__form form">' }], { at: 0, over: head.length, scrollTop: 0, ax: 0.3, ay: 0.06, kps: 15 });
    check(text, F.formAt({ head: true }), 'head');
    // お名前・メールアドレス: the static input kept as a comment, the form-tag under it
    Caption.set('静的な input はコメントで残し、その下にフォームタグ（* は必須・placeholder もデザインのまま）');
    for (let i = 0; i < 2; i++) {
      const f = F.FIELDS[i], ctl = f.html[0];
      const at = text.indexOf(ctl);
      text = await CC.type('form', '<!-- ', { at, click: i === 0, kps: 15, blur: false, wait: 60 });
      text = await CC.type('form', [{ direct: ' -->' }, { key: 'Enter' }, ...line(' '.repeat(24) + f.tag)], { at: at + 5 + ctl.length, click: false, kps: i ? 24 : 16 });
      check(text, F.formAt({ head: true, n: i + 1 }), 'field ' + f.tag.split(' ')[1]);
    }
    // 当院をどちらで知りましたか？: the checkbox tag from the tag generator
    Caption.set('チェックボックスはタグジェネレーターで：必須にして、選択肢を 1 行に 1 つ');
    const cb = F.FIELDS[2];
    const cbAt = text.indexOf(cb.html[0]);
    text = await CC.type('form', '<!-- ', { at: cbAt, kps: 15, blur: false, wait: 60 });
    const cbEnd = text.indexOf(cb.html[cb.html.length - 1]) + cb.html[cb.html.length - 1].length;
    text = await CC.type('form', [{ direct: ' -->' }, { key: 'Enter' }, { direct: ' '.repeat(24) }], { at: cbEnd, click: false, kps: 22, blur: false, wait: 80 });
    const caret = cbEnd + 4 + 1 + 24;
    await clickUi(W('#tag-generator-list [data-target="tag-generator-panel-checkbox"]'), { kind: 'hand', after: 60 });
    // the dialog (its page behind it: the title and template as typed so far)
    const behind = (key) => {
      const t = WP.el('#title', key), ta = WP.el('#wpcf7-form', key);
      if (t) t.value = F.F1_TITLE;
      if (ta) { ta.value = text; ta.scrollTop = Math.max(0, (text.slice(0, caret).split('\n').length - 8) * 20); }
      const pl = WP.el('#title-prompt-text', key); if (pl) pl.classList.add('screen-reader-text');
      // the captured <dialog open> is a plain dialog in the page's flow: Contact Form 7 opens it as a modal (centred, backdrop)
      const dlg = WP.el('dialog[open]', key);
      if (dlg && dlg.showModal && !dlg.__modal) { try { dlg.close(); dlg.showModal(); dlg.__modal = true; } catch (e) { dlg.setAttribute('open', ''); } }
    };
    behind('f1-tg');
    behind('f1-tg-filled');
    const req = WP.el('dialog[open] [data-tag-part="type-suffix"]', 'f1-tg'), tagIn = WP.el('dialog[open] [data-tag-part="tag"]', 'f1-tg');
    if (req) req.checked = false;
    if (tagIn) tagIn.value = tagIn.value.replace('[checkbox* ', '[checkbox ');
    await show('f1-tg', 300);
    await hoverUi(W('dialog[open] [data-tag-part="name"]'), { hold: 900 });
    if (req) { await clickUi(req, { after: 60 }); req.checked = true; if (tagIn) tagIn.value = tagIn.value.replace('[checkbox ', '[checkbox* '); }
    await CC.type('tg-values', lines(['ご紹介', 'インターネット検索', '雑誌や書籍', 'その他']), { all: true, kps: 13, ax: 0.3 });
    await show('f1-tg-filled', 200);
    const tag = W('dialog[open] [data-tag-part="tag"]');
    if (tag) { Issue.ok(R(tag, 2), '[checkbox* checkbox-344 use_label_element …]'); await readHold(1700); Issue.hide(); }
    check(tag ? tag.value : '', cb.tag, 'tag generator');
    await clickUi(W('dialog[open] [data-taggen="insert-tag"]'), { kind: 'hand', after: 60 });
    await show('f1-new', 0);
    CC.set('title', F.F1_TITLE);
    const box = CC.box('form');
    WP.focus(box, true);
    text = text.slice(0, caret) + cb.tag + text.slice(caret);
    CC.show('form', text, caret);
    WP.focus(box, false);
    check(text, F.formAt({ head: true, n: 3 }), 'checkbox');
    await readHold(900);
    // the rest the same way (the radio buttons from the tag generator too), the submit button, the redirect
    Caption.set('ほかの項目も同じように（ラジオボタンもタグジェネレーター）。送信ボタンは [submit "送信"]');
    for (let n = 4; n <= F.FIELDS.length; n++) {
      const t = F.formAt({ head: true, n });
      CC.show('form', t, t.indexOf(F.FIELDS[n - 1].tag));
      await wait(520);
    }
    const final = F.F1_FORM;
    CC.show('form', final, final.indexOf('[submit'));
    await wait(700);
    Caption.set('送信が完了したら（wpcf7mailsent）サンクスページへ移動するスクリプトも、テンプレートの最後に');
    const scr = markIn('form', final, F.THANKS_SCRIPT.join('\n'));
    Issue.ok(R(scr, 4), 'location.href = …/thanks/');
    await readHold(1900);
    Issue.hide();
    CC.set('form', final);
    // saved: the shortcode
    Caption.set('保存してショートコードをコピー');
    await save('f1-saved');
    const ok = W('#message, .notice-success, .updated');
    if (ok) { Issue.ok(R(ok), 'コンタクトフォームが作成されました。'); await readHold(1200); Issue.hide(); }
    await clickUi(W('.toggle-shortcode'), { after: 60 });
    await show('f1-code', 0);
    const code = W('#wpcf7-shortcode');
    if (code) { await clickUi(code, { kind: 'text', ax: 0.3, after: 60 }); code.style.background = '#2271b1'; await Keycap.show(['Ctrl', 'C'], 700); Issue.ok(R(code), WP.data.f1.code); await readHold(1500); Issue.hide(); code.style.background = ''; }
  });

  /* 3 — page-contact.php: the shortcode; the automatic formatting */
  scene('theme', async () => {
    Caption.step(3);
    window.Win11.skipTo('14:31');
    Caption.set('page-contact.php：元のフォームはコメントにして残し（Shift+Alt+A）、その下でショートコードを出力');
    await Win.switchTo('code');
    await Code.selectLines(X.FORM_AT, FORM_END);
    await Keycap.show(['Shift', 'Alt', 'A'], 800);
    const f = Code.files[PC];
    f.lines[X.FORM_AT] = f.lines[X.FORM_AT].replace('<form', '<!-- <form');
    f.lines[FORM_END] = f.lines[FORM_END] + ' -->';
    Code.msel = null;
    if (!f.dirty) { f.dirty = true; Code.renderTabs(); }
    Code.setCaret(FORM_END, f.lines[FORM_END].length);
    await wait(500);
    await Code.reveal(FORM_END, 600);
    await Code.newLineAfter(FORM_END);
    await Code.type([{ key: 'Enter' }, { direct: "<?php echo do_shortcode( '" }, { paste: WP.data.f1.code }, { direct: "' ); ?>" }], { kps: 20 });
    // the comment above the form
    await Code.overwrite('フォームはデザインのまま（送信先・name 属性は未設定）', [...line('お問い合わせフォーム：'), { direct: 'Contact Form 7' }, ...line('（元のフォームはコメントで残す）')], { kps: 14 });
    await Code.save();
    const want = X.files[PC].split('\n');
    want[X.FORM_AT] = want[X.FORM_AT].replace('<form', '<!-- <form');
    want[FORM_END] += ' -->';
    want.splice(FORM_END + 1, 0, `            <?php echo do_shortcode( '${WP.data.f1.code}' ); ?>`);
    want[X.FORM_AT - 1] = want[X.FORM_AT - 1].replace('フォームはデザインのまま（送信先・name 属性は未設定）', 'お問い合わせフォーム：Contact Form 7（元のフォームはコメントで残す）');
    check(Code.text(PC), want.join('\n'), PC);
    await Code.panel(true);
    await deploy();
    // the live page: the form is there — the layout is not
    await Win.switchTo('browser');
    await Browser.clickTab('site');
    await reloadSite('contact', { before: (doc) => Front.replaceForm(WP.data.autopOn, doc) });
    Caption.issue('レイアウト崩れ', 'フォームは出たが、ラベルの文が細切れになって横に並び、項目の高さもばらばら');
    const dt = Store.doc.querySelector('.wpcf7 .form__wrap--other') || Store.doc.querySelector('.wpcf7 .form__label');
    if (dt) { await Store.scrollToEl(dt, 360, 900); Issue.show(R(dt, 6), 'ラベルが行ごとに分かれて横並び'); await readHold(2400); }
    Issue.hide();
    Caption.set('Contact Form 7 の自動整形がテンプレートの改行に <p> / <br> を入れている（テーマの dl / dd とぶつかる）');
    await Store.scroll(Store.win().scrollY + 420, 1200);
    await readHold(1400);
    // functions.php: the formatting off
    Caption.set('functions.php：wpcf7_autop_or_not フィルターで自動整形を止める（テンプレートをそのまま出力）');
    await Win.switchTo('code');
    await Code.openFile(FN);
    await Code.lineAfter("require get_theme_file_path( 'inc/news.php' );", K.codeScript(['', ...X.AUTOP], JA), { kps: 18 });
    await Code.save();
    check(Code.text(FN), X.files[FN].replace("require get_theme_file_path( 'inc/news.php' );\n", "require get_theme_file_path( 'inc/news.php' );\n\n" + X.AUTOP.join('\n') + '\n'), FN);
    Term.clear();
    await deploy();
    await Win.switchTo('browser');
    await reloadSite('contact');
    Caption.fixed('デザインのとおり：ラベルはひとまとまりで、入力欄・チェックボックス・ラジオボタンもコーディングどおり');
    const dl = Store.doc.querySelector('.wpcf7 .form__wrap--other') || Store.doc.querySelector('.wpcf7 .form__wrap');
    if (dl) { await Store.scrollToEl(dl, 360, 900); Issue.ok(R(dl, 6), 'その他を選ばれた方は、…'); await readHold(1800); Issue.hide(); }
    await Store.scroll(Store.win().scrollY + 520, 1400);
    await wait(500);
  });

  /* 4 — Mail: the notification to the clinic */
  scene('mail', async () => {
    Caption.step(4);
    window.Win11.skipTo('14:44');
    Caption.set('メール タブ：フォームの内容をクリニック（info@miyazawaclinic.net）に通知する');
    await Browser.clickTab('wp');
    await clickUi(W('#contact-form-editor-tabs [data-panel="mail-panel"]'), { after: 60 });
    await show('mail', 0);
    await CC.type('m-to', 'info@miyazawaclinic.net', { all: true, kps: 16 });
    Caption.set('送信元はお問い合わせした方のアドレスに（届いたメールにそのまま返信できるように）…');
    await CC.type('m-from', '[your-name] <[your-email]>', { all: true, kps: 15 });
    await CC.type('m-subject', [...line('【お問い合わせ】'), { direct: '[your-name] ' }, ...line('様')], { all: true, kps: 14 });
    await WP.scroll(CC.box('m-body'), 700);
    Caption.set('本文：項目ごとにメールタグ（[your-name] [checkbox-344] …）');
    await CC.paste('m-body', F.MAIL['m-body'], { top: true, hold: 900 });
    await save('mail-err');
    // the configuration error
    const err = CC.box('m-from').closest('td').querySelector('.config-error');
    Caption.issue('設定エラー', '送信元がサイトのドメイン外：他人のドメインを名乗るメールは SPF / DMARC で迷惑メール扱い・不達に');
    if (err) { Issue.show(R(err, 4), 'サイトのドメインに属していないメールアドレスが送信元に設定されています。'); await readHold(2600); Issue.hide(); }
    // fixed: the clinic's own domain; replies go to the visitor through Reply-To
    Caption.set('送信元はクリニックのドメイン（noreply@miyazawaclinic.net）に。返信先は追加ヘッダーの Reply-To: [your-email]');
    await CC.type('m-from', [{ direct: '[_site_title] <noreply@miyazawaclinic.net>' }], { all: true, kps: 16 });
    const hd = WP.field('m-headers') || W('#wpcf7-mail-additional-headers');
    Issue.ok(R(hd), 'Reply-To: [your-email]');
    await hoverUi(hd, { ax: 0.12, hold: 1400 });
    Issue.hide();
    await save('mail-saved');
    Caption.fixed('設定エラーなし：通知メールの設定完了');
    const tabBtn = W('#contact-form-editor-tabs [data-panel="mail-panel"]');
    if (tabBtn) { Issue.ok(R(tabBtn, 4), 'メール'); await readHold(1300); Issue.hide(); }
    check(['#wpcf7-mail-recipient', '#wpcf7-mail-sender', '#wpcf7-mail-subject'].map((s) => (W(s) || {}).value).join('|'), [F.MAIL['m-to'], F.MAIL['m-from'], F.MAIL['m-subject']].join('|'), 'mail saved');
  });

  /* 5 — Mail (2): the auto-reply */
  scene('autoreply', async () => {
    Caption.step(5);
    Caption.set('メール (2)：お問い合わせした方への自動返信');
    const box2 = W('#wpcf7-mail-2-active');
    if (box2) { await WP.scroll(box2, 800); await clickUi(box2, { after: 60 }); }
    await show('mail2', 0);
    await CC.type('m2-from', '[_site_title] <noreply@miyazawaclinic.net>', { all: true, kps: 18 });
    await CC.type('m2-subject', line('【京橋ウェルネスクリニック】お問い合わせありがとうございます'), { all: true, kps: 14 });
    await CC.type('m2-headers', 'Reply-To: info@miyazawaclinic.net', { all: true, kps: 18 });
    await WP.scroll(CC.box('m2-body'), 700);
    await CC.paste('m2-body', F.MAIL2['m2-body'], { top: true, hold: 1000 });
    await hoverUi(CC.box('m2-body'), { ax: 0.2, ay: 0.2, hold: 900 });
    await save('mail2-err');
    // the warning: an auto-reply to any address typed in, no protection against bots
    const to = WP.el('#wpcf7-mail-2-recipient');
    const err = to && to.closest('td').querySelector('.config-error');
    Caption.issue('設定エラー', '自動返信は「入力されたアドレス」に届く：ボットに他人のアドレスを入れられると、迷惑メールの踏み台になる');
    if (err) { Issue.show(R(err, 4), '安全でないメール設定が十分な防御策なく使われている。'); await readHold(2800); Issue.hide(); }
  });

  /* 6 — reCAPTCHA v3 (as on the live site) */
  scene('recaptcha', async () => {
    Caption.step(6);
    Caption.set('スパム対策：公開サイトと同じ reCAPTCHA v3 を Contact Form 7 のインテグレーションで');
    await clickUi(W('#toplevel_page_wpcf7 a[href*="wpcf7-integration"]') || W('#toplevel_page_wpcf7 > a'), { after: 60 });
    await show('integ', 800);
    const card = W('#recaptcha') || byText('.card', /reCAPTCHA/);
    if (card) await hoverUi(card, { hold: 1100 });
    const setup = WP.els('a.button').find((a) => /service=recaptcha/.test(a.getAttribute('href') || ''));
    await clickUi(setup, { kind: 'hand', after: 60 });
    await show('integ-recaptcha', 800);
    Caption.set('サイトキーとシークレットキー（クリニックの Google アカウントの reCAPTCHA 管理画面で発行したもの）');
    CC.pii('sitekey');
    CC.pii('secret');
    await CC.paste('sitekey', '6LfQxKp3AAAAAN2vR8mT0cYwq4ZbE7sJhU1gXo9i', { hold: 300 });
    await CC.paste('secret', '6LfQxKp3AAAAAH5nW2eL8tVaR0yBqD3kMfZ6cUs7', { hold: 300 });
    await clickUi(W('#submit') || W('#wpbody-content [type="submit"]'), { kind: 'hand', after: 60 });
    await show('integ-saved', 900);
    const on = WP.els('#wpbody-content *').filter((e) => /有効化されています/.test(e.textContent)).pop();   // the innermost one
    if (on) { Issue.ok(R(on, 4), 'reCAPTCHA はこのサイト上で有効化されています。'); await readHold(1800); Issue.hide(); }
    // back to the form (the browser's back button), saved again → checked again
    Caption.set('フォームに戻って保存し直すと、設定が再チェックされる');
    for (const key of ['integ-recaptcha', 'integ', 'mail2-err']) { await Keycap.show(['Alt', '←'], 500); await show(key, 250); }
    await save('mail2-safe');
    Caption.fixed('設定エラーなし：reCAPTCHA が有効なら、自動返信の警告も消える');
    const to = W('#wpcf7-mail-2-recipient');
    if (to) { Issue.ok(R(to.closest('tr') || to, 4), '[your-email]（エラーなし）'); await readHold(1700); Issue.hide(); }
  });

  /* 7 — the test on the live page: the empty submit, a real send, the thanks page, both mails */
  scene('test', async () => {
    Caption.step(7);
    window.Win11.skipTo('15:03');
    Caption.set('公開ページで送信テスト：まずは何も入れずに送信');
    await Browser.clickTab('site');
    await reloadSite('contact', { offset: 140, ms: 900 });
    await Front.submit(WP.data.invalid, { ms: 900 });
    await Store.scrollToEl(Store.doc.querySelector('.wpcf7 .form__wrap'), 160, 900);
    Caption.set('必須の 4 項目に「入力してください。」（ご紹介者様・その他・ご相談内容は任意）');
    const tip = Store.doc.querySelector('.wpcf7-not-valid-tip');
    if (tip) { Issue.show(R(tip.closest('dl') || tip, 4), '入力してください。'); await readHold(2000); Issue.hide(); }
    // a real send (to the clinic's own address)
    Caption.set('入力して送信（テストの宛先はクリニックのアドレス：通知と自動返信の両方が届く）');
    const T = F.TEST;
    await Front.type('your-name', [...line('テスト'), { direct: ' ' }, ...line('花子')], { offset: 260 });
    await Front.type('your-email', T.email, { scroll: false, kps: 16 });
    await Front.check('checkbox-344', T.found);
    await Front.check('category', T.wish);
    await Front.type('history', line(T.history), { offset: 300 });
    await Front.type('hope', line(T.hope), { scroll: false });
    const out = Store.doc.querySelector('.wpcf7-response-output');
    await Front.submit(null, { ms: 1300, offset: 560 });
    if (out) out.textContent = '';
    // wpcf7mailsent → the thanks page
    Browser.nav('site', { url: DEV + '/thanks/', title: 'サンクスページ - ' + S.title.replace(/^.* - /, '') });
    Browser.loading('site', true);
    await load('thanks');
    Browser.loading('site', false);
    Caption.fixed('送信完了 → サンクスページへ（テンプレートのスクリプト）');
    await wait(900);
    const h = [...Store.doc.querySelectorAll('main h1, main h2, main h3, main p')].find((e) => /お問い合わせありがとうございます/.test(e.textContent) && e.children.length < 3);
    if (h) { await Store.scrollToEl(h, 220, 1000); Issue.ok(R(h, 6), 'お問い合わせありがとうございます'); await readHold(1700); Issue.hide(); }
    // the clinic's inbox
    Caption.set('クリニックの受信トレイ：通知メールと自動返信メール');
    const vals = { 'your-name': 'テスト 花子', 'your-email': T.email, 'checkbox-344': T.found, introduce: '', 'other-how-found': '', category: T.wish, history: T.history, hope: T.hope, _site_title: '京橋ウェルネスクリニック', _site_url: DEV };
    const fill = (s) => s.replace(/\[([a-z_-]+[0-9]*)\]/g, (m, k) => (k in vals ? vals[k] : m));
    const time = window.Win11.fmt.time();
    Mail.list = [];
    Mail.add({ from: '京橋ウェルネスクリニック', addr: 'noreply@miyazawaclinic.net', to: T.email, subject: fill(F.MAIL['m-subject']), snippet: 'ホームページのお問い合わせフォームから送信がありました。', text: fill(F.MAIL['m-body']), time, label: 'お問い合わせ' });
    Mail.add({ from: '京橋ウェルネスクリニック', addr: 'noreply@miyazawaclinic.net', to: T.email, subject: fill(F.MAIL2['m2-subject']), snippet: 'テスト 花子 様 京橋ウェルネスクリニックです。', text: fill(F.MAIL2['m2-body']), time });
    await Browser.newTab('mail');
    await Browser.typeUrl('mail.google.com');
    Browser.nav('mail', { url: 'https://mail.google.com/mail/u/0/#inbox', title: '受信トレイ (2) - info@miyazawaclinic.net - 京橋ウェルネスクリニック メール', page: 'mail', fav: 'gmail' });
    Mail.render({ newIdx: 1 });
    await wait(900);
    await clickUi(Mail.row(0), { after: 60 });
    Mail.list[0].read = true;
    Mail.render({ open: 0 });
    Browser.nav('mail', { title: `${Mail.list[0].subject} - info@miyazawaclinic.net - 京橋ウェルネスクリニック メール` });
    await hoverUi(D.$('#wmText'), { ax: 0.15, ay: 0.2, hold: 2200 });
    await clickUi(D.$('#wmBody [data-back]'), { after: 60 });
    Mail.render({});
    await clickUi(Mail.row(1), { after: 60 });
    Mail.list[1].read = true;
    Mail.render({ open: 1 });
    Browser.nav('mail', { title: `${Mail.list[1].subject} - info@miyazawaclinic.net - 京橋ウェルネスクリニック メール` });
    Caption.fixed('通知はメールタグに入力内容が入り、返信先（Reply-To）はお問い合わせした方');
    await hoverUi(D.$('#wmText'), { ax: 0.15, ay: 0.3, hold: 2600 });
  });

  /* 8 — かとう歯科: a photo field */
  scene('kato', async () => {
    Caption.step(8);
    window.Win11.skipTo('15:20');
    Caption.set('かとう歯科（別のクライアント）：お問合せフォームに、お口の写真やレントゲン画像を添付できるように');
    await Browser.newTab('kwp');
    await Browser.typeUrl('kato-dental-clinic.net/wp-admin/admin.php?page=wpcf7');
    Browser.nav('kwp', { page: 'wp', fav: 'kato' });
    wpTab('kwp', 'k-list');
    await show('k-list', 900);
    await clickUi(W('.row-title'), { kind: 'hand', after: 60 });
    await show('k-edit', 800);
    wpTab('kwp', 'k-edit');
    Caption.set('表の行を 1 つ追加：[file your-file filetypes:jpg|jpeg|png|pdf]（受け付ける形式を限定）');
    let text = F.K_FORM;
    const at = text.indexOf('</tbody>');
    text = await CC.type('form', [...lines(F.K_FILE_ROW(false)), { key: 'Enter' }], { at, kps: 17, ay: 0.85 });
    check(text, F.K_FORM_FILE, 'kato file row');
    await save('k-saved');
    wpTab('kwp', 'k-saved');
    // the mail: the file attached
    Caption.set('メール タブ：ファイル添付に [your-file]（アップロードされた画像がメールに添付される）');
    await clickUi(W('#contact-form-editor-tabs [data-panel="mail-panel"]'), { after: 60 });
    await show('k-mail', 0);
    await CC.type('m-attach', F.K_ATTACH, { kps: 14 });
    await save('k-mail-saved');
    wpTab('kwp', 'k-mail-saved');
    // the live page: a photo from a phone
    Caption.set('公開ページで確認：スマホで撮った写真を添付して送信');
    await Browser.newTab('ksite');
    await Browser.typeUrl('kato-dental-clinic.net/contact');
    Browser.nav('ksite', { url: KATO + '/contact/', title: S.kato.title, page: 'store', fav: 'kato' });
    Browser.loading('ksite', true);
    await load('kato-contact', (doc) => Front.addRow(WP.data.kForm, 'your-file', 'textarea', doc));
    Browser.loading('ksite', false);
    const KT = F.K_TEST;
    await Front.type('your-name', [...line('テスト'), { direct: ' ' }, ...line('太郎')], { offset: 260, scrollMs: 1200 });
    await Front.type('your-email', KT.email, { scroll: false, kps: 16 });
    await Front.type('textarea', line(KT.text), { scroll: false });
    const file = Front.field('your-file');
    await Store.scrollToEl(file, 380, 700);
    await clickUi(file, { kind: 'hand', ax: 0.08, after: 60 });
    const MB = (WP.data.kPhoto / 1048576).toFixed(1);
    const photo = { name: 'IMG_4127.jpg', date: '2026/11/05 15:13', type: 'JPG ファイル', size: `${Math.round(WP.data.kPhoto / 1024).toLocaleString('ja-JP')} KB` };
    await FileDialog.pick({ folder: ['PC', 'ピクチャ', 'iPhone'], files: [{ name: 'IMG_4126.jpg', date: '2026/11/05 15:12', type: 'JPG ファイル', size: '3,612 KB' }, photo], pick: photo.name });
    Front.pickFile('your-file', photo.name);
    await Front.check('policy', '同意する');
    await Front.submit(WP.data.kTooLarge, { ms: 1500, offset: 600 });
    await Store.scrollToEl(file, 380, 600);
    Caption.issue('送信できない', `写真は ${MB} MB。Contact Form 7 のファイルの上限は初期設定で 1 MB`);
    const tip = Store.doc.querySelector('[data-name="your-file"] .wpcf7-not-valid-tip');
    if (tip) { Issue.show(R(tip.closest('td') || tip, 4), 'アップロードされたファイルが大きすぎます。'); await readHold(2400); Issue.hide(); }
    // the limit raised (and said next to the field)
    Caption.set('フォームタグに limit:10mb（スマホの写真が入る大きさ）、案内文にも「10MB まで」');
    await Browser.clickTab('kwp');
    await clickUi(W('#contact-form-editor-tabs [data-panel="form-panel"]'), { after: 60 });
    await show('k-form2', 0);
    wpTab('kwp', 'k-form2');
    text = F.K_FORM_FILE;
    const p1 = text.indexOf('[file your-file') + '[file your-file'.length;
    text = await CC.type('form', ' limit:10mb', { at: p1, kps: 14, ay: 0.82, blur: false, wait: 120 });
    const p2 = text.indexOf('pdf）') + 3;
    text = await CC.type('form', [...line('、'), { direct: '10MB ' }, ...line('まで')], { at: p2, click: false, kps: 14 });
    check(text, F.K_FORM_FILE_10MB, 'kato limit');
    await save('k-saved-10mb');
    wpTab('kwp', 'k-saved-10mb');
    // sent
    Caption.set('もう一度送信（再読み込みしても入力内容はそのまま。写真は選び直し）');
    await Browser.clickTab('ksite');
    const kept = {};
    for (const n of ['your-name', 'your-email', 'textarea']) kept[n] = Front.field(n).value;
    await Browser.reload(async () => {
      await load('kato-contact', (doc) => Front.addRow(WP.data.kSent, 'your-file', 'textarea', doc));
      for (const [n, v] of Object.entries(kept)) { const b = Front.boxify(Front.field(n)); b.textContent = v; b.__value = v; Front.field(n).value = v; }
      const pc = Store.doc.querySelector('.wpcf7 input[name="policy[]"]'); if (pc) { pc.checked = true; pc.setAttribute('checked', ''); }
    }, { key: 'F5' });
    const file2 = Front.field('your-file');
    await Store.scrollToEl(file2, 380, 900);
    await clickUi(file2, { kind: 'hand', ax: 0.08, after: 60 });
    await FileDialog.pick({ folder: ['PC', 'ピクチャ', 'iPhone'], files: [{ name: 'IMG_4126.jpg', date: '2026/11/05 15:12', type: 'JPG ファイル', size: '3,612 KB' }, photo], pick: photo.name, look: 400 });
    Front.pickFile('your-file', photo.name);
    await Front.submit(WP.data.kSent, { ms: 2200, offset: 600 });
    const resp = Store.doc.querySelector('.wpcf7-response-output');
    Caption.fixed('送信完了：写真はクリニックへの通知メールに添付される');
    if (resp) { await Store.scrollToEl(resp, 520, 700); Issue.ok(R(resp, 4), 'ありがとうございます。メッセージは送信されました。'); await readHold(2200); Issue.hide(); }
  });

  /* 9 — the two live forms */
  scene('live', async () => {
    Caption.allDone();
    Caption.set('京橋ウェルネスクリニック：デザインのままのフォームで送信・通知・自動返信・reCAPTCHA');
    await Browser.clickTab('site');
    Browser.nav('site', { url: DEV + '/contact/', title: S.title });
    Browser.loading('site', true);
    await load('contact');
    Browser.loading('site', false);
    const f = Store.doc.querySelector('.wpcf7');
    if (f) { await Store.scrollToEl(f, 120, 1600); await wait(600); await Store.scroll(Store.win().scrollY + 900, 2600); }
    await wait(700);
    Caption.set('かとう歯科：画像の添付（jpg・png・pdf、10MB まで）');
    await Browser.clickTab('ksite');
    Browser.loading('ksite', true);
    await load('kato-contact', (doc) => Front.addRow(WP.data.kSent, 'your-file', 'textarea', doc));
    Browser.loading('ksite', false);
    const k = Store.doc.querySelector('.wpcf7');
    if (k) await Store.scrollToEl(k, 160, 1600);
    const row = Store.doc.querySelector('[data-name="your-file"]');
    if (row) { Issue.ok(R(row.closest('tr'), 4), '画像の添付'); await readHold(1800); Issue.hide(); }
    Caption.set('お問い合わせフォームの構築・修正：設置・通知と自動返信・入力チェック・スパム対策・ファイル添付');
    await wait(3600);
    Caption.hide();
  });

  /* ============================================================ setup */
  K.run({
    scenes: SCENES,
    warm: ['contact', 'thanks', 'kato-contact'],
    fontText: JSON.stringify(JA) + F.F1_FORM + F.MAIL['m-body'] + F.MAIL2['m2-body'] + F.K_FORM_FILE_10MB,
    async prepare() {
      Code.init(X.files, X.tree);
      Code.show(PC, { top: X.FORM_AT - 12 });
      Term.render('<span class="caret"></span>');
      Browser.addTab({ id: 'site', title: S.title, url: DEV + '/contact/', page: 'store', fav: 'miya' });
      Browser.addTab({ id: 'wp', title: WP.title('plg-add'), url: WP.url('plg-add'), page: 'wp', fav: 'miya' }, { activate: false });
      wpTab('wp', 'plg-add');
      await WP.preload(Object.keys(window.WP_SNAPSHOT.pages));
      await WP.show('plg-add');
      Browser.activate('site');
      await load('contact', (doc) => Front.replaceForm(STATIC, doc));
      const _wp = CC.wp;
      CC.wp = async (key, o = {}) => { const tab = o.tab || Browser.active; const t = Browser.tab(tab); if (t) { t.wpKey = key; if (!t.onShow) wpTab(tab, key); } return _wp(key, o); };
      Win.open('code', 'max');
      Win.open('browser', 'max');
      K.hydrate();
    },
  });
  window.__JA = JA;
})();
