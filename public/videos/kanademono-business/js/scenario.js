/*
 * Timeline: the B2B features of KANADEMONO for BUSINESS (kanademono.design/pages/business) on Shopify —
 * requirements -> 法人様会員登録フォーム (theme section + App Proxy -> companyCreate) -> company, catalog (法人卸 15%OFF),
 * payment terms, 法人価格 on the product page -> カンタン見積もり (draftOrderCreate + quote PDF) -> draft order + invoice
 * -> staff notification (Flow) -> end-to-end test (mail, PDF, smartphone) -> the live page.
 *
 * Keys:  Space = start / pause   R = restart   C = captions on/off   H = hide hint
 * URL :  ?t=83 (seek, s)   ?from=4 (start of scene 4)   ?speed=1.3   ?captions=0
 */
(function () {
  'use strict';
  const D = window.Demo, K = window.Kit, F = window.FILES, S = window.SITE_SNAPSHOT;
  const { $, $$, esc, wait, Cursor, Caption, Issue, Keycap, KeyStrip, Win, screenRect, typeInto, frameTextTarget, fieldTarget } = D;
  const { clickUi, hoverUi, moveToEl } = D;
  const { Code, Term, Browser, Admin, H, Store, TE, DevTools, typeInput, readHold, choose } = K;
  const { V, Mail, Pdf, Acct, putForm, putPrice, yen } = window.KB;
  const LIVE = 'https://kanademono.design';
  const DEV = 'http://127.0.0.1:9292';
  const TITLE = { business: '法人様窓口 – KANADEMONO', product: `${F.QUOTE[1].name} – KANADEMONO`, desk: `${F.QUOTE[0].name} – KANADEMONO` };
  const CO = F.COMPANY;
  const DESK = F.QUOTE[0], CHAIR = F.QUOTE[1];

  /* ------------------------------------------------ Japanese typed through the IME */
  const JA = {
    'での実現方法': { r: 'denojitsugenhouhou', segs: ['での', '実現方法'] },
    '法人会員登録：申請フォームから顧客と会社（': [{ r: 'houjinkaiintouroku:', segs: ['法人会員登録', '：'] }, { r: 'shinseifo-mukarakokyakutokaisha(', segs: ['申請フォームから', '顧客と', '会社', '（'] }],
    '）を作成し、承認後にログイン': { r: ')wosakuseishi,shouningoniroguin', segs: ['）を', '作成し、', '承認後に', 'ログイン'] },
    '卸売取引：会社ロケーションにカタログを割り当て（価格リスト': [{ r: 'oroshiuritorihiki:', segs: ['卸売取引', '：'] }, { r: 'kaisharoke-shonnnikataroguwo', segs: ['会社', 'ロケーションに', 'カタログを'] }, { r: 'wariate(kakakurisuto', segs: ['割り当て', '（価格', 'リスト'] }],
    'オフ）': { r: 'ofu)', segs: ['オフ）'] },
    '請求書払い：会社ロケーションの支払い条件（30日以内）': [{ r: 'seikyuushobarai:', segs: ['請求書払い', '：'] }, { r: 'kaisharoke-shonnnoshiharaijouken(30nichiinai)', segs: ['会社', 'ロケーションの', '支払い条件', '（30日以内）'] }],
    'カンタン見積もり：': { r: 'kantanmitsumori:', segs: ['カンタン', '見積もり', '：'] },
    'で下書き注文を作り、見積書': { r: 'deshitagakichuumonwotsukuri,mitsumorisho', segs: ['で', '下書き', '注文を', '作り、', '見積書'] },
    'を返す': { r: 'wokaesu', segs: ['を返す'] },
    '担当者への通知：': { r: 'tantoushahenotsuuchi:', segs: ['担当者への', '通知', '：'] },
    'で申請内容を社内メールに送る': { r: 'deshinseinaiyouwoshanaime-runiokuru', segs: ['で', '申請内容を', '社内メールに', '送る'] },
    '業種：': { r: 'gyoushu:', segs: ['業種', '：'] },
    '時期：': { r: 'jiki:', segs: [{ c: ['時期', '次期', '時季'], p: 0 }, '：'] },
    '本社': { r: 'honsha', segs: ['本社'] },
    '会社名を入力してください': { r: 'kaishameiwonyuuryokushitekudasai', segs: ['会社名を', '入力して', 'ください'] },
    '会社名': { r: 'kaishamei', segs: ['会社名'] },
    '必須': { r: 'hissu', segs: ['必須'] },
    'カンタン見積もり': { r: 'kantanmitsumori', segs: ['カンタン', '見積もり'] },
    'スタイリング「': { r: 'sutairingu[', segs: ['スタイリング', '「'] },
    '」から作成': { r: ']karasakusei', segs: ['」から', '作成'] },
    '【': { r: 'kakko', segs: [{ c: ['（', '「', '【', '『'], p: 2 }], candHold: 300 },
    '】割引表記なし': [{ r: 'kakkotoji', segs: [{ c: ['）', '」', '】', '』'], p: 2 }], candHold: 300 }, { r: 'waribikihyoukinashi', segs: ['割引', '表記なし'] }],
    '「この商品で見積書を作成」：': [{ r: '[konoshouhinnde', segs: ['「この', '商品で'] }, { r: 'mitsumorishowosakusei]:', segs: ['見積書を', '作成', '」：'] }],
    'に送って、返ってきた': { r: 'niokutte,kaettekita', segs: ['に', '送って、', '返ってきた'] },
    'を新しいタブで開く': { r: 'woatarashiitabudehiraku', segs: ['を', '新しい', 'タブで', '開く'] },
    '法人価格（卸売取引）・カンタン見積もり・請求書払いがご利用いただけます。': [{ r: 'houjinkakaku(oroshiuritorihiki)/', segs: ['法人価格', '（卸売取引）', '・'] }, { r: 'kantanmitsumori/', segs: ['カンタン', '見積もり', '・'] }, { r: 'seikyuushobaraigagoriyouitadakemasu.', segs: ['請求書払いが', 'ご利用', 'いただけます。'] }],
    '会社名：': { r: 'kaishamei:', segs: ['会社名', '：'] },
    'ご担当者：': { r: 'gotantousha:', segs: ['ご担当者', '：'] },
    '（': { r: '(', raw: true },
    '）': { r: ')', raw: true },
    'メール：': { r: 'me-ru:', segs: ['メール', '：'] },
    '業種・時期：': { r: 'gyoushu/jiki:', segs: ['業種', '・', '時期', '：'] },
  };
  const code = (lines, o) => K.codeScript(lines, JA, o);
  const NAME = [{ r: 'yamada', segs: ['山田'] }, { key: 'Space' }, { r: 'tarou', segs: [{ c: ['太郎', 'たろう', '多朗'], p: 0 }] }];
  const COMPANY_JA = [{ r: 'kabushikigaishatesutorabo', segs: ['株式会社', 'テストラボ'], predict: ['株式会社', '株式'], yomi: ['かぶしきがいしゃ', 'かぶしき'] }];
  const DEPT_JA = [{ r: 'soumubu', segs: ['総務部'] }];
  const CATALOG_JA = [{ r: 'houjinnoroshi', segs: ['法人', '卸'] }, { direct: ' 15%OFF' }];

  /* ------------------------------------------------------------- helpers */
  const linesRect = (a, b) => () => {
    const r1 = Code.lineEl(a), r2 = Code.lineEl(b);
    if (!r1 || !r2) return null;
    const x = screenRect(r1.querySelector('.lc')), y = screenRect(r2.querySelector('.lc'));
    return { left: x.left, top: x.top, width: Math.min(x.width, 1150), height: y.bottom - x.top };
  };
  const termRect = (n) => () => {
    const ls = [...$('#vsTerm').children].filter((e) => !e.querySelector('#termIn'));
    const sel = ls.slice(-n);
    if (!sel.length) return null;
    const a = screenRect(sel[0]), b = screenRect(sel[sel.length - 1]);
    return { left: a.left, top: a.top, width: 900, height: b.bottom - a.top };
  };
  async function selectWhole(line) { await Code.dragSelect(line, 0, Code.files[Code.active].lines[line].length); }
  /** Enter at the end of `line`, then lines of code (indent fixed against that line) */
  async function addAfter(line, lines, o = {}) {
    await Code.reveal(line, 500);
    await Code.newLineAfter(line);
    await Code.type(code(lines, { after: Code.files[Code.active].lines[line] }), { kps: 21, ...o });
  }
  function check(path, want, tag) {
    if (Code.text(path) !== want) { console.warn('[demo] ' + path + ' differs from the expected text'); window.__typeDiff = (window.__typeDiff || []).concat(tag); }
  }
  async function newTerminal(label) {
    await Keycap.show(['Ctrl', 'Shift', '@'], 650);
    Term.lines = [];
    $('.vs-pt-sh').textContent = label;   // the shell name in the panel's toolbar
    Term.render('<span class="caret"></span>');
    await wait(300);
  }
  /** type into a field of the injected form (inside the store frame) */
  async function frameType(key, script, o = {}) {
    const el = Store.doc.querySelector(`[data-in="${key}"]`);
    await clickUi(el, { kind: 'text', after: 80 });
    el.classList.add('focus');
    const t = await typeInto(frameTextTarget(el), script, { kps: o.kps || 12 });
    el.innerHTML = esc(t);
    el.classList.remove('focus');
    return t;
  }
  const submitBtn = () => Store.doc.querySelector('[data-demo-b2b] .btn');
  async function storeTab(id, page, o = {}) {
    Browser.nav(id, { title: TITLE[page], url: (o.base || DEV) + (o.path || '/'), page: 'store', fav: 'store' });
    Browser.loading(id, true);
    const doc = await Store.load(page, { before: o.before });
    Browser.loading(id, false);
    return doc;
  }
  const regBox = () => Store.doc.querySelector('[data-demo-b2b]');

  /* ================================================================ scenes */
  const SCENES = [];
  const scene = (name, fn) => SCENES.push({ name, fn });

  scene('intro', K.introScene);

  /* 1 — what the business page offers today -> how to build it on Shopify */
  scene('requirements', async () => {
    Caption.step(1);
    Caption.set('現行の法人様窓口（/pages/business）：法人会員限定サービスの内容を確認');
    await wait(400);
    const d = Store.doc;
    const h2 = (t) => [...d.querySelectorAll('h2')].find((h) => h.textContent.trim() === t);
    await Store.scrollToEl(h2('SERVICE'), 90, 2000);
    await wait(500);
    const card = (t) => [...d.querySelectorAll('h3, h4, .h4, p, h5')].find((e) => e.textContent.trim() === t);
    for (const t of ['卸売取引', '請求書払い', 'カンタン見積もり']) { const el = card(t); if (el) await hoverUi(el, { hold: 900 }); }
    Caption.set('この「法人様会員登録フォーム」・法人価格・見積もり・請求書払いを、Shopify の B2B 機能で実装する');
    await Store.scrollToEl(h2('REGISTRATION FORM'), 90, 1800);
    await wait(1300);
    await Win.switchTo('code', { state: 'max' });
    await Code.openFile('docs/requirements.md', { top: 0 });
    Caption.set('要件を Shopify の機能に対応づける：会社（B2B）・カタログ・支払い条件・下書き注文');
    const todo = Code.find('<!-- TODO -->').line;
    await selectWhole(todo);
    await Code.type(code(F.REQ_TYPED), { kps: 19 });
    await Code.save({ noStatus: true });
    check('docs/requirements.md', F.REQ_FINAL, 'requirements');
    await wait(700);
  });

  /* 2 — the registration form: theme section + App Proxy (companyCreate) */
  scene('register', async () => {
    Caption.step(2);
    Caption.set('法人様会員登録フォーム（テーマのセクション）：入力欄を追加し、App Proxy（/apps/b2b/register）に送信');
    await Code.openFile('theme/sections/b2b-register.liquid', { top: 0 });
    const fl = Code.find('<form class="b2b-form"').line;
    await addAfter(fl, F.FORM_FIELD(false));
    await Code.save();
    check('theme/sections/b2b-register.liquid', F.FORM_BAD, 'form');
    Caption.set('App Proxy のルート：申請内容から会社（B2B）・連絡先・ロケーションを companyCreate で作成');
    await Code.openFile('app/routes/apps.b2b.register.js', { top: 0 });
    const todo = Code.find('// TODO').line;
    await selectWhole(todo);
    await Code.type(code(F.REG_TYPED), { kps: 17 });
    await Code.save();
    await Code.panel(true);
    Term.render('<span class="caret"></span>');
    await Term.run('shopify app dev', [
      async () => Term.spin('Preparing dev store kanademono-dev.myshopify.com', 1300, '<span class="tg">✓</span> Using store <span class="tb">kanademono-dev.myshopify.com</span>'),
      '<span class="tg">✓</span> App Proxy: <span class="tlink">https://kanademono-dev.myshopify.com/apps/b2b</span> → https://forum-pixel-unit.trycloudflare.com',
      '<span class="tdim">13:41:07</span> <span class="tc">remix</span> │ Local: http://localhost:52011/',
    ], { noPrompt: true });
    await newTerminal('powershell (2)');
    await Term.run('npm run theme:dev', ['', '<span class="tg">✓</span> Synced theme <span class="tdim">(kanademono-v2 / development)</span>', '<span class="tb">Preview your theme</span>', `  • <span class="tlink">${DEV}</span>`, `  • Customize this theme in the Theme Editor: <span class="tlink">https://kanademono.myshopify.com/admin/themes/140001234567/editor</span>`], { noPrompt: true });
    // the theme editor: put the section on the business page template
    Caption.set('テーマエディタ：法人様窓口のテンプレートの「REGISTRATION FORM」の下にセクションを追加');
    await Win.switchTo('browser');
    await Browser.clickTab('adm');
    await Admin.go('online/themes', V.themes(), { title: 'テーマ', path: '/themes' });
    await hoverUi('#thLive', { hold: 600 });
    await clickUi('#thDev', { after: 80 });
    Browser.nav('adm', { page: 'editor', title: 'kanademono-v2/b2b（開発） · カスタマイズ · KANADEMONO · Shopify', url: Admin.url('/themes/140001234567/editor?previewPath=%2Fpages%2Fbusiness') });
    const sec = (id, name, ic) => ({ id, name, ic: ic || 'layers' });
    const tpl = [sec('hero', 'ヒーロー（法人様窓口）', 'image'), sec('about', 'ABOUT'), sec('service', 'SERVICE'), sec('coord', 'COORDINATE'), sec('case', 'CASE STUDY'), sec('order', 'HOW TO CHECKOUT'), sec('showroom', 'SHOWROOM'), sec('steps', 'REGISTRATION FORM（手順）'), sec('contact', 'CONTACT')];
    TE.open({ theme: 'kanademono-v2/b2b（開発）', badge: '開発', page: '法人様窓口', tree: [{ grp: 'ヘッダー', items: [sec('header', 'ヘッダー', 'layers')] }, { grp: 'テンプレート', add: true, items: tpl }, { grp: 'フッター', items: [sec('perks', '特典（Warranty / Fit / Ship）'), sec('footer', 'フッター')] }] });
    Browser.loading('adm', true);
    await TE.load('business');
    Browser.loading('adm', false);
    const teReg = () => { const h = [...TE.doc.querySelectorAll('h2')].find((x) => x.textContent.trim() === 'REGISTRATION FORM'); return h && h.closest('.index-section'); };
    await TE.scroll(TE.yOf(teReg(), 40), 1600);
    await wait(500);
    await choose(TE.item('テンプレート+'), ['画像付きテキスト', 'コレクションリスト', 'カスタム Liquid', '法人様会員登録フォーム', 'お問い合わせフォーム'], '法人様会員登録フォーム', { look: 900 });
    tpl.splice(tpl.findIndex((x) => x.id === 'steps') + 1, 0, sec('b2b-register', '法人様会員登録フォーム', 'doc'));
    TE.renderTree({ newId: 'b2b-register' });
    putForm(TE.doc, {});
    await wait(300);
    await TE.select('b2b-register', '法人様会員登録フォーム', H.field('見出し', '法人様会員登録フォーム') + H.field('業種（カンマ区切り）', 'IT・通信,広告・デザイン,建築・設計,飲食・小売,その他', { ta: true }) + '<p class="sa-mute">送信先：App Proxy /apps/b2b/register</p>');
    const teForm = TE.doc.querySelector('[data-demo-b2b]');
    await TE.scroll(TE.yOf(teForm, 160), 900);
    TE.hl(teForm, '法人様会員登録フォーム');
    await typeInput($('#teSetB .sa-in.ta'), [{ direct: ',' }, { r: 'seizougyou', segs: ['製造業'] }], { keep: true, kps: 12 });
    putForm(TE.doc, {});
    await wait(400);
    await TE.save();
    Admin.toast('保存しました');
    TE.hl(null);
    await wait(400);
    await clickUi('#teExit', { after: 60 });
    Browser.nav('adm', { page: 'admin' });
    Admin.show(V.themes(), { title: 'テーマ', path: '/themes' });
    await wait(300);
    // test on the dev store
    Browser.addTab({ id: 'dev', title: TITLE.business, url: DEV + '/pages/business', page: 'store', fav: 'store' }, { anim: true });
    Browser.loading('dev', true);
    await Store.load('business', { before: (d) => putForm(d, {}) });
    Browser.loading('dev', false);
    await Store.scrollToEl(regBox(), 330, 1600);
    Caption.set('テスト送信：担当者名とメールアドレスだけ入れて「申請する」');
    await frameType('name', NAME);
    await frameType('email', [{ direct: 'b2b+testlab@kanademono.design' }], { kps: 16 });
    await clickUi(submitBtn(), { kind: 'hand', after: 120 });
    Cursor.kind('arrow');
    await wait(500);
    putForm(Store.doc, { filled: true, done: true });
    await wait(1400);
    // the admin: a company without a name
    await Browser.clickTab('adm');
    await Admin.go('customers/companies', V.companies([{ name: '' }]), { title: '会社', path: '/companies' });
    Caption.issue('入力漏れ', '会社名が空のまま申請が通り、「名称なし」の会社が作られてしまった（会社名は必須のはず）');
    Issue.show($('#coTable tbody tr'), '会社名が空');
    await wait(3000);
    Issue.hide();
    // fix: required in the form + server-side check
    await Win.switchTo('code');
    await Code.openFile('theme/sections/b2b-register.liquid');
    const inp = Code.find('autocomplete="organization">');
    await Code.clickAt(inp.line, inp.col + 'autocomplete="organization"'.length);
    await Code.type(' required', { kps: 14 });
    await Code.save();
    check('theme/sections/b2b-register.liquid', F.FORM_FINAL, 'form-fix');
    Caption.set('ブラウザの入力チェックだけに頼らず、App Proxy 側でも会社名を確認して 422 を返す');
    await Code.openFile('app/routes/apps.b2b.register.js');
    const fl2 = Code.find('const form = Object.fromEntries').line;
    await addAfter(fl2, [F.REG_VALID], { kps: 22 });
    await Code.save();
    check('app/routes/apps.b2b.register.js', F.REG_FINAL, 'register');
    Code.lineCls[fl2 + 1] = 'good'; Code.render();
    await wait(400);
    await Win.switchTo('browser');
    await Browser.clickTab('dev');
    await Browser.reload(async () => { await Store.load('business', { before: (d) => putForm(d, { filled: true }) }); }, { key: 'F5' });
    await Store.scrollToEl(regBox(), 330, 0);
    await clickUi(submitBtn(), { kind: 'hand', after: 120 });
    Cursor.kind('arrow');
    putForm(Store.doc, { filled: true, err: true });
    Caption.fixed('会社名が空だと「会社名を入力してください」で送信できない');
    Issue.ok(Store.doc.querySelector('.b2b-field.err'), '会社名は必須');
    await readHold(2200);
    Issue.hide();
    await frameType('company', COMPANY_JA);
    Store.doc.querySelector('.b2b-field.err') && Store.doc.querySelector('.b2b-field.err').classList.remove('err');
    const m = Store.doc.querySelector('.b2b-field .msg'); if (m) m.remove();
    await frameType('dept', DEPT_JA);
    await frameType('tel', [{ direct: '03-0000-0000' }], { kps: 13 });
    await clickUi(submitBtn(), { kind: 'hand', after: 120 });
    Cursor.kind('arrow');
    await wait(400);
    putForm(Store.doc, { filled: true, done: true, company: CO, dept: '総務部' });
    Caption.set('申請を受け付けた（Step.2 の「登録完了メール」は、管理画面で承認したときに送る）');
    await wait(1800);
    delete Code.lineCls[fl2 + 1];
  });

  /* 3 — the company: catalog (法人卸 15%OFF), payment terms, 法人価格 on the product page, approval */
  scene('company', async () => {
    Caption.step(3);
    Caption.set('管理画面 › 会社：テストで作った「名称なし」の会社を削除');
    await Browser.clickTab('adm');
    await Admin.go('customers/companies', V.companies([{ name: CO }, { name: '' }]), { title: '会社', path: '/companies' });
    await clickUi('#coTable tr[data-row="r1"] .sa-ck', { after: 60 });
    $('#coTable tr[data-row="r1"] .sa-ck').classList.add('on');
    await wait(300);
    Admin.modal('<p>（名称なし）を削除しますか？ ロケーションと連絡先も削除されます。この操作は元に戻せません。</p>', { title: '会社を削除', foot: H.btn('キャンセル') + H.btn('削除', { crit: true, id: 'coDel' }) });
    await wait(700);
    await clickUi('#coDel', { after: 60 });
    await Admin.busy('#coDel', 600);
    Admin.closeModal();
    Admin.show(V.companies([{ name: CO }]), { title: '会社', path: '/companies' });
    Admin.toast('会社を削除しました');
    Caption.set('申請された会社を開く：会社名・連絡先・ロケーション（本社）ができている');
    await wait(700);
    await Admin.open($('#coTable tbody tr td:nth-child(2) b'), V.company({}), { title: CO, path: '/companies/7340032' });
    await hoverUi('#coApp p.sa-mute', { hold: 1300 });
    Caption.set('卸売取引（最大 15% オフ）：会社のロケーションにカタログ（価格リスト）を割り当てる');
    await clickUi('#coAddCat', { after: 80 });
    Admin.modal(V.catalogModal({}), { title: 'カタログを作成', foot: H.btn('キャンセル') + H.btn('カタログを保存', { pri: true, id: 'catSave' }) });
    await wait(400);
    await typeInput('#catTitle', CATALOG_JA, { kps: 12 });
    await typeInput('#catPct', '15', { kps: 8 });
    await clickUi('#catFixed', { after: 80 });
    $('#catFixed').classList.add('on');
    await hoverUi('#catFixed p', { hold: 1300 });
    await clickUi('#catSave', { after: 60 });
    await Admin.busy('#catSave', 800);
    Admin.closeModal();
    Admin.show(V.company({ catalog: true }), { title: CO, path: '/companies/7340032' });
    Admin.toast('カタログを作成しました');
    await wait(500);
    Caption.set('カタログの価格：15% 値下げ、タグ「【B2B】割引表記なし」の商品（エルゴヒューマンなど）は固定価格');
    await Admin.open($('#coCatCard b'), V.catalog(), { title: '法人卸 15%OFF', path: '/catalogs/9175041' });
    await hoverUi('#ctTable tbody tr:nth-child(1) td:nth-child(4)', { hold: 1200 });
    const fixedRow = [...$$('#ctTable tbody tr')].find((tr) => /固定価格/.test(tr.textContent));
    if (fixedRow) await hoverUi(fixedRow.querySelector('td:nth-child(4)'), { hold: 1500 });
    const tdRow = [...$$('#ctTable tbody tr')].find((tr) => /THE TABLE/.test(tr.textContent));
    if (tdRow) await hoverUi(tdRow.querySelector('td:nth-child(4)'), { hold: 1100 });
    await Admin.open($('.sa-ph .back'), V.company({ catalog: true }), { title: CO, path: '/companies/7340032' });
    Caption.set('請求書払い：支払い条件を「30日以内（Net 30）」に');
    await clickUi('#coTerms', { after: 80 });
    Admin.modal(H.field('支払い条件', '支払い期日なし', { id: 'tmSel', select: true }) + '<p class="sa-mute">注文後に請求書を発行し、期日までにお支払いいただきます。期日が近づくと自動でリマインドを送信します。</p>', { title: '支払い条件を編集', foot: H.btn('キャンセル') + H.btn('保存', { pri: true, id: 'tmSave' }) });
    await wait(300);
    await choose('#tmSel', ['支払い期日なし', '受領時', 'フルフィルメント時', '7日以内（Net 7）', '15日以内（Net 15）', '30日以内（Net 30）', '45日以内（Net 45）'], '30日以内（Net 30）', { look: 700 });
    await clickUi('#tmSave', { after: 60 });
    await Admin.busy('#tmSave', 600);
    Admin.closeModal();
    Admin.show(V.company({ catalog: true, terms: true }), { title: CO, path: '/companies/7340032' });
    Admin.toast('支払い条件を更新しました');
    await Admin.scrollToEl('#coLocCard', 80, 700);
    await hoverUi('#coLoc tbody tr td:nth-child(2)', { hold: 1100 });
    Caption.set('ご担当者のロール：本社ロケーションの「ロケーションの管理者」（注文・見積もり・請求書を確認できる）');
    await Admin.scrollToEl('#coContacts', 120, 600);
    await clickUi('#coContacts tbody tr td:nth-child(4) .sa-bd', { after: 80 });
    Admin.modal(H.field('本社', '注文のみ', { id: 'roleSel', select: true }) + '<p class="sa-mute">ロケーションの管理者は、そのロケーションの注文・下書き注文・請求書・支払い方法を管理できます。</p>', { title: 'ロールを割り当て', foot: H.btn('キャンセル') + H.btn('保存', { pri: true, id: 'roleSave' }) });
    await wait(300);
    await choose('#roleSel', ['注文のみ', 'ロケーションの管理者'], 'ロケーションの管理者', { look: 600 });
    await clickUi('#roleSave', { after: 60 });
    await Admin.busy('#roleSave', 500);
    Admin.closeModal();
    Admin.show(V.company({ catalog: true, terms: true, role: 'ロケーションの管理者' }), { title: CO, path: '/companies/7340032' });
    Admin.toast('ロールを保存しました');
    await Admin.scrollToEl('#coContacts', 120, 0);
    await hoverUi('#coContacts tbody tr td:nth-child(4) .sa-bd', { hold: 900 });
    await Admin.scroll(0, 500);

    // the 法人価格 block on the product page (theme snippet) — checked as the test company's contact
    Caption.set('商品ページの法人価格（スニペット b2b-price）を、テストの法人会員でログインして確認');
    await Win.switchTo('code');
    await Code.openFile('theme/snippets/b2b-price.liquid', { top: 0 });
    await hoverUi(Code.lineEl(5), { ax: 0.4, hold: 1200 });
    await Win.switchTo('browser');
    await Browser.clickTab('dev');
    await storeTab('dev', 'desk', { path: '/products/' + DESK.h, before: (d) => putPrice(d, { price: DESK.b2b, off: true }) });
    const pb = () => Store.doc.querySelector('[data-demo-price]');
    await Store.scrollToEl(Store.doc.querySelector('.product-single__title'), 120, 900);
    await hoverUi(pb(), { ax: 0.3, hold: 1600 });
    Caption.set(`デスクは ${yen(DESK.price)} → 法人価格 ${yen(DESK.b2b)}（15%オフ）`);
    await wait(1400);
    await storeTab('dev', 'product', { path: '/products/' + CHAIR.h, before: (d) => putPrice(d, { price: CHAIR.b2b, off: true }) });
    await Store.scrollToEl(Store.doc.querySelector('.product-single__title'), 120, 0);
    await wait(500);
    Caption.issue('表示の誤り', 'タグ「【B2B】割引表記なし」のチェアは価格が変わらないのに「卸売 15%OFF」と表示されている');
    Issue.show(pb(), '割引されていないのに 15%OFF');
    await moveToEl(pb(), { ax: 0.55 });
    await wait(3000);
    Issue.hide();
    await Win.switchTo('code');
    const vl = Code.find('b2b-price__value').line;
    await addAfter(vl, [F.PRICE_UNLESS], { kps: 20 });
    const ol = Code.find('b2b-price__off').line;
    await addAfter(ol, [F.PRICE_END], { kps: 20 });
    await Code.save();
    check('theme/snippets/b2b-price.liquid', F.PRICE_FINAL, 'price');
    Code.lineCls[vl + 1] = 'good'; Code.lineCls[ol + 1] = 'good'; Code.render();
    Term.lines.push('<span class="tdim">13:52:31</span> <span class="tg">Synced</span> » update snippets/b2b-price.liquid'); Term.render(null);
    await wait(500);
    await Win.switchTo('browser');
    await Browser.reload(async () => { await Store.load('product', { before: (d) => putPrice(d, { price: CHAIR.b2b, off: false }) }); }, { key: 'F5' });
    await Store.scrollToEl(Store.doc.querySelector('.product-single__title'), 120, 0);
    Caption.fixed('割引表記なしの商品は法人価格の表示だけ（15%OFF の表示なし）、ほかの商品は 15%OFF のまま');
    Issue.ok(pb(), '割引表記なし');
    await readHold(2400);
    Issue.hide();
    Code.lineCls = {};
    // approve
    Caption.set('カタログと支払い条件がそろったので承認：登録完了メールが届き、ワンタイムパスワードでログインできる');
    await Browser.clickTab('adm');
    await clickUi('#coApprove', { after: 60 });
    await Admin.busy('#coApprove', 900);
    Admin.show(V.company({ catalog: true, terms: true, approved: true, role: 'ロケーションの管理者' }), { title: CO, path: '/companies/7340032' });
    Admin.toast('承認して登録完了メールを送信しました');
    Issue.ok($('#coApp'), '承認済み');
    await readHold(1800);
    Issue.hide();
  });

  /* 4 — カンタン見積もり: draftOrderCreate (+ the company as purchasing entity) and the quote PDF */
  scene('quote', async () => {
    Caption.step(4);
    Caption.set('カンタン見積もり：スタイリングの商品で下書き注文を作り、見積書（PDF）を返す App Proxy');
    await Win.switchTo('code');
    await Code.openFile('app/routes/apps.b2b.quote.js', { top: 0 });
    await hoverUi(Code.lineEl(9), { ax: 0.5, hold: 1200 });
    const todo = Code.find('// TODO').line;
    await selectWhole(todo);
    await Code.type(code(F.QUOTE_TYPED), { kps: 17 });
    await Code.save();
    check('app/routes/apps.b2b.quote.js', F.QUOTE_BAD, 'quote');
    Caption.set('テスト：法人会員としてスタイリング（デスク・チェア・配線トレー・ローテーブル）の見積もりを依頼');
    await Code.openFile('scripts/test-quote.mjs', { top: 0 });
    await wait(600);
    await Term.run('node scripts/test-quote.mjs project-room', [500, `<span class="tg">✔</span> 下書き注文 #D1023・合計 ${yen(F.TOTAL_RETAIL)} → tmp/quote-D1023.pdf`]);
    await Win.switchTo('browser');
    Browser.addTab({ id: 'pdf', title: 'quote-D1023.pdf', url: 'file:///C:/dev/kanademono-b2b/tmp/quote-D1023.pdf', page: 'pdf', fav: 'pdf' }, { anim: true });
    Pdf.show({ no: 'D1023' });
    await wait(900);
    Caption.issue('価格の誤り', `合計 ${yen(F.TOTAL_RETAIL)}：デスクも配線トレーも通常価格。法人卸 15%OFF のカタログが効いていない`);
    Issue.show(Pdf.spot('table'), '通常価格のまま');
    await moveToEl(Pdf.spot('price1'));
    await wait(3000);
    Issue.hide();
    Caption.set('原因：下書き注文に購入者（会社・ロケーション・連絡先）を指定していない → カタログの価格が適用されない');
    await Win.switchTo('code');
    await Code.openFile('app/routes/apps.b2b.quote.js');
    const il = Code.find('      input: {').line;
    Issue.show(linesRect(il, il + 3), '会社の指定がない', { below: true });
    await wait(1800);
    Issue.hide();
    await addAfter(il, [F.QUOTE_FIX], { kps: 23 });
    await Code.save();
    check('app/routes/apps.b2b.quote.js', F.QUOTE_FINAL, 'quote-fix');
    Code.lineCls[il + 1] = 'good'; Code.render();
    await Term.run('node scripts/test-quote.mjs project-room', [500, `<span class="tg">✔</span> 下書き注文 #D1024・合計 ${yen(F.TOTAL_B2B)} → tmp/quote-D1024.pdf`]);
    await Win.switchTo('browser');
    Browser.nav('pdf', { title: 'quote-D1024.pdf', url: 'file:///C:/dev/kanademono-b2b/tmp/quote-D1024.pdf' });
    Browser.loading('pdf', true); await wait(400); Browser.loading('pdf', false);
    Pdf.show({ no: 'D1024' });
    Caption.fixed(`purchasingEntity を指定：法人価格で ${yen(F.TOTAL_B2B)}（チェアは割引表記なしのため通常価格）`);
    Issue.ok(Pdf.spot('table'), '法人卸 15%OFF の価格');
    await readHold(2600);
    Issue.hide();
    await hoverUi(Pdf.spot('sum'), { hold: 1200 });
    await hoverUi(Pdf.spot('total'), { hold: 1000 });
    await hoverUi(Pdf.spot('note'), { ax: 0.3, hold: 1400 });
    delete Code.lineCls[il + 1];
    // the button on the product page (theme JS)
    Caption.set('商品ページの「この商品で見積書を作成」ボタン：App Proxy に送って PDF を開くスクリプト');
    await Win.switchTo('code');
    await Code.newFile('theme/assets/b2b-quote.js');
    await Code.type(code(F.QJS), { kps: 20 });
    await Code.save({ status: 'U' });
    if (Code.text('theme/assets/b2b-quote.js') !== F.QJS.join('\n')) { console.warn('[demo] b2b-quote.js differs'); window.__typeDiff = (window.__typeDiff || []).concat('qjs'); }
    Term.lines.push('<span class="tdim">14:03:12</span> <span class="tg">Synced</span> » update assets/b2b-quote.js'); Term.render(null);
    await wait(400);
    await Win.switchTo('browser');
    await Browser.clickTab('dev');
    await storeTab('dev', 'desk', { path: '/products/' + DESK.h, before: (d) => putPrice(d, { price: DESK.b2b, off: true }) });
    await Store.scrollToEl(Store.doc.querySelector('.product-single__title'), 120, 600);
    await Keycap.show(['F12'], 600);
    await DevTools.open(true);
    const net = (rows) => DevTools.panel('network', '<div class="dt-net"><table><thead><tr><th>名前</th><th>ステータス</th><th>タイプ</th><th>開始元</th><th>サイズ</th><th>時間</th></tr></thead><tbody>' + rows.map((r) => '<tr' + (r[6] ? ' class="kb-net-hl"' : '') + '>' + r.slice(0, 6).map((c) => '<td>' + c + '</td>').join('') + '</tr>').join('') + '</tbody></table></div>');
    net([['dsk-k72-lft2', '200', 'document', 'その他', '61.3 kB', '182 ms'], ['b2b-quote.js', '200', 'script', 'dsk-k72-lft2:412', '1.1 kB', '9 ms']]);
    await wait(500);
    await clickUi(Store.doc.querySelector('[data-demo-price] .btn'), { kind: 'hand', after: 120 });
    Cursor.kind('arrow');
    net([['dsk-k72-lft2', '200', 'document', 'その他', '61.3 kB', '182 ms'], ['b2b-quote.js', '200', 'script', 'dsk-k72-lft2:412', '1.1 kB', '9 ms'], ['quote（/apps/b2b/quote）', '200', 'fetch', 'b2b-quote.js:7', '48.6 kB', '612 ms', 1]]);
    Caption.set('App Proxy（/apps/b2b/quote）への POST が 200：ログイン中の顧客 ID つきの署名済みリクエストで、PDF が返る');
    await hoverUi($('.kb-net-hl td'), { hold: 2000 });
    await Keycap.show(['F12'], 500);
    await DevTools.open(false);
    Browser.addTab({ id: 'pdf2', title: 'quote-D1025.pdf', url: 'blob:http://127.0.0.1:9292/7c1e…', page: 'pdf', fav: 'pdf' }, { anim: true });
    Browser.loading('pdf2', true); await wait(700); Browser.loading('pdf2', false);
    Pdf.show({ no: 'D1025' }); // the quote of the desk alone (assets/pdf/quote-D1025.pdf)
    Caption.set(`ボタンからも 1 分以内に見積書：法人価格 ${yen(DESK.b2b)}（税込）`);
    await hoverUi(Pdf.spot('sum'), { hold: 1800 });
    await wait(600);
  });

  /* 5 — the draft order: company, catalog prices, payment terms, invoice */
  scene('draft', async () => {
    Caption.step(5);
    Caption.set('管理画面 › 下書き注文：見積もりは下書き注文として残り、営業担当が確認できる');
    await Browser.clickTab('adm');
    await Admin.go('orders/drafts', V.drafts([{ name: '#D1024', date: '11月8日 13:58', total: F.TOTAL_B2B }, { name: '#D1023', date: '11月8日 13:55', total: F.TOTAL_RETAIL }]), { title: '下書き注文', path: '/draft_orders' });
    await wait(500);
    await hoverUi('#drTable tr[data-row="D1023"] td:nth-child(2)', { hold: 900 });
    await Admin.open($('#drTable tr[data-row="D1024"] td:nth-child(2) b'), V.draft({ b2b: true, name: '#D1024' }), { title: '#D1024', path: '/draft_orders/1189236719678' });
    await hoverUi('#dfItems tbody tr:nth-child(1) td:nth-child(2)', { hold: 1200 });
    await hoverUi('#dfItems tbody tr:nth-child(2) td:nth-child(2)', { hold: 900 });
    await hoverUi('#dfCo .sa-bd', { hold: 1000 });
    Caption.set('「請求書を送信」：リンクから注文すると、支払い条件（30日以内）の請求書払いになる');
    await Admin.scrollToEl('#dfPay', 120, 700);
    await hoverUi('#dfPay .sa-hr + p', { ax: 0.4, hold: 1600 });
    await hoverUi('#dfPay .sa-btn.pri', { hold: 900 });
    await clickUi('#dfInvoice', { after: 80 });
    Admin.modal(V.invoiceModal(), { title: '請求書を送信', foot: H.btn('キャンセル') + H.btn('請求書を送信', { pri: true, id: 'ivSend' }) });
    await wait(600);
    await hoverUi('#saMd .sa-in.ta', { hold: 1500 });
    await clickUi('#ivSend', { after: 60 });
    await Admin.busy('#ivSend', 800);
    Admin.closeModal();
    Admin.show(V.draft({ b2b: true, sent: true, name: '#D1024' }), { title: '#D1024', path: '/draft_orders/1189236719678' });
    Admin.toast('請求書を送信しました');
    await wait(1200);
    // the customer orders from the invoice link -> an order with payment terms (請求書払い)
    Caption.set('お客様が請求書のリンクから注文 → 支払い期日つきの注文（請求書払い）が作られる');
    await Admin.go('orders', H.page({ title: '注文', actions: [H.btn('エクスポート'), H.btn('注文を作成', { pri: true })] },
      H.card('', H.table([['', 'ck'], '注文', '日付', '顧客', '支払い状況', 'フルフィルメント状況', ['合計', 'num']],
        [[H.ck(), '<b>#1043</b>', '11月8日 14:09', `${K.ic('building')} ${esc(CO)}`, H.badge('支払い期日 10月15日', 'att', { dot: true }), H.badge('未発送', 'att', { dot: true }), yen(F.TOTAL_B2B)],
          [H.ck(), '#1042', '11月8日 11:26', '<span class="pii">一般のお客様</span>', H.badge('支払い済み', '', { dot: true, full: true }), H.badge('発送済み', '', { dot: true, full: true }), yen(64800)],
          [H.ck(), '#1041', '11月8日 09:51', '<span class="pii">一般のお客様</span>', H.badge('支払い済み', '', { dot: true, full: true }), H.badge('未発送', 'att', { dot: true }), yen(23500)]], { id: 'odTable' }), { flush: true })), { title: '注文', path: '/orders' });
    await hoverUi('#odTable tbody tr:first-child td:nth-child(5)', { hold: 1200 });
    await Admin.open($('#odTable tbody tr:first-child td:nth-child(2) b'), V.order(), { title: '注文 #1043', path: '/orders/5873412345678' });
    Issue.ok($('#odPay'), '30日以内の請求書払い');
    await hoverUi('#odDue', { hold: 1800 });
    await hoverUi('#odTl', { ax: 0.3, hold: 1600 });
    Issue.hide();
    await wait(500);
  });

  /* 6 — staff notification (Flow) */
  scene('notify', async () => {
    Caption.step(6);
    Caption.set('お客様への「B2B アクセスのメール」（登録完了メール）に、使えるサービスの案内を追加');
    await Admin.openSettings('notifications', V.notifyList(), { title: '通知', path: 'notifications' });
    await clickUi('#ntB2B', { after: 80 });
    Browser.loading('adm', true); await wait(400); Browser.loading('adm', false);
    Admin.settings('notifications', V.notifyEdit(), { title: 'B2B アクセスのメール', path: 'notifications/company_contact_b2b_access' });
    const nb = $('#ntBody');
    const NT_BASE = ['{% capture email_title %}法人会員登録が完了しました{% endcapture %}', '<p>{{ customer.last_name }} 様</p>', '<p>{{ shop.name }} for BUSINESS の法人会員登録が完了しました。</p>', '<p>専用ログインページでメールアドレスを入力すると、ワンタイムパスワードが届きます。</p>'].join('\n');
    nb.textContent = NT_BASE;
    await wait(500);
    await clickUi(nb, { kind: 'text', ay: 0.32, after: 80 });
    nb.classList.add('focus');
    const nt = await typeInto(fieldTarget(nb, { base: NT_BASE + '\n' }), code(['<p>法人価格（卸売取引）・カンタン見積もり・請求書払いがご利用いただけます。</p>']), { kps: 20 });
    nb.textContent = NT_BASE + '\n' + nt;
    nb.classList.remove('focus');
    Admin.saveBar(true);
    await wait(400);
    await Admin.saveFromBar('通知を保存しました');
    await clickUi('#saSetX', { after: 60 });
    Admin.closeSettings();
    await wait(200);
    Caption.set('担当者への通知：Shopify Flow で「会社が作成された」ら、申請内容を社内メールで送る');
    await Admin.open($('#saNav [data-nav="app/flow"]'), V.flow(false), { nav: 'app/flow', title: 'Flow', path: '/apps/flow/editor/b2b-register' });
    await hoverUi('.kf-node.trg', { hold: 1100 });
    await hoverUi('.kf-node.cond', { hold: 1300 });
    await hoverUi('.kf-node.act', { hold: 900 });
    const box = $('#kfBody');
    await clickUi(box, { kind: 'text', after: 80 });
    box.classList.add('focus');
    const lines = F.MAIL_LINES.slice(0, 4);
    const t = await typeInto(fieldTarget(box), code(lines), { kps: 20 });
    box.textContent = t;
    box.classList.remove('focus');
    if (t !== lines.join('\n')) { console.warn('[demo] flow mail body differs'); window.__typeDiff = (window.__typeDiff || []).concat('flow'); }
    await wait(400);
    await clickUi('#kfOn', { after: 60 });
    await Admin.busy('#kfOn', 700);
    Admin.show(V.flow(true), { nav: 'app/flow', title: 'Flow', path: '/apps/flow/editor/b2b-register' });
    $('#kfBody').textContent = t;
    Admin.toast('ワークフローを有効にしました');
    Caption.set('申請・承認・見積もりのたびに、担当者と法人のご担当者の両方にメールが届く');
    await wait(1500);
  });

  /* 7 — end-to-end test: mails, the quote PDF, the form on a smartphone */
  scene('test', async () => {
    Caption.step(7);
    Caption.set('動作テスト：ここまでの申請・承認・見積もりで、メールが正しく届いているか確認');
    Mail.list = [];
    Mail.add({ from: 'Shopify Flow', addr: 'no-reply@shopify.com', subject: `【法人会員登録】${CO} 様から申請がありました`, snippet: '会社名・ご担当者・業種・時期', time: '14:01', label: '法人会員', to: 'b2b@kanademono.design',
      html: `会社名：${esc(CO)}\nご担当者：山田 太郎（総務部）\nメール：b2b+testlab@kanademono.design\n業種・時期：業種：IT・通信 / 時期：1か月以内` });
    Mail.add({ from: 'KANADEMONO for BUSINESS', addr: 'b2b@kanademono.design', subject: '【KANADEMONO for BUSINESS】法人会員登録が完了しました', snippet: '専用ログインページにメールアドレスを入力してください', time: '14:02', label: '法人会員', to: 'b2b+testlab@kanademono.design',
      html: `${esc(CO)}
山田 太郎 様

KANADEMONO for BUSINESS の法人会員登録が完了しました。
専用ログインページでメールアドレスを入力すると、ワンタイムパスワード（6 桁の確認コード）が届きます。
法人価格（卸売取引）・カンタン見積もり・請求書払いがご利用いただけます。

<span class="wm-btn" id="wmLogin">専用ログインページへ</span>` });
    Mail.add({ from: 'KANADEMONO for BUSINESS', addr: 'b2b@kanademono.design', subject: `御見積書・ご請求書（#D1024）`, snippet: F.STYLING, time: '14:06', att: 'quote-D1024.pdf', label: '見積もり',
      to: 'b2b+testlab@kanademono.design', html: `${esc(CO)}\n山田 太郎 様\n\nこのたびはお見積もりのご依頼をいただき、ありがとうございます。\nスタイリング「${esc(F.STYLING)}」のお見積書をお送りします。\n\nお見積金額（税込）：<b>${yen(F.TOTAL_B2B)}</b>\nお支払い：請求書払い（30 日以内）\n\n下記のリンクからご注文いただけます。\n<span class="sa-link">ご注文手続きへ進む</span>` });
    Browser.addTab({ id: 'mail', title: '受信トレイ (3) - b2b@kanademono.design', url: 'https://mail.google.com/mail/u/0/#inbox', page: 'mail', fav: 'mail' }, { anim: true });
    Mail.render({ newIdx: 0 });
    await wait(900);
    await hoverUi('.wm-row[data-mail="2"]', { hold: 700 });
    await clickUi('.wm-row[data-mail="2"]', { after: 80 });
    Caption.set('担当者へのメール（Flow）：フォームの会社名・ご担当者・業種・時期が入っている');
    Mail.list[2].read = true;
    Mail.render({ open: 2 });
    Browser.nav('mail', { title: `【法人会員登録】${CO} 様から申請がありました - b2b@kanademono.design` });
    await hoverUi('#wmText', { ax: 0.2, hold: 2200 });
    await clickUi('.wm-tools [data-back]', { after: 80 });
    Mail.render({});
    await wait(300);
    // the welcome mail -> login with a one-time code
    await clickUi('.wm-row[data-mail="1"]', { after: 80 });
    Mail.list[1].read = true;
    Mail.render({ open: 1 });
    Browser.nav('mail', { title: '【KANADEMONO for BUSINESS】法人会員登録が完了しました - b2b@kanademono.design' });
    Caption.set('登録完了メール（Step.2）→ 専用ログインページでワンタイムパスワード（Step.3）');
    await hoverUi('#wmText', { ax: 0.3, ay: 0.4, hold: 1600 });
    await clickUi('#wmLogin', { kind: 'hand', after: 100 });
    Cursor.kind('arrow');
    // the store's real login page (shopify.com/25419644990/account redirects to it)
    Browser.addTab({ id: 'acct', title: 'ログイン - KANADEMONO', url: Acct.loginUrl, page: 'acct', fav: 'store' }, { anim: true });
    Browser.loading('acct', true);
    await Acct.load();
    Browser.loading('acct', false);
    await wait(600);
    await Acct.type(Acct.email(), 'b2b+testlab@kanademono.design', { kps: 16 });
    await clickUi(Acct.submit(), { after: 80 });
    Acct.busy(true); await wait(700);
    Acct.codeStep('b2b+testlab@kanademono.design');
    Browser.nav('acct', { title: 'コードを入力 - KANADEMONO' });
    Mail.add({ from: 'KANADEMONO', addr: 'no-reply@kanademono.design', subject: 'ログイン用の確認コード：482915', snippet: 'このコードは 10 分間有効です', time: '14:12', label: '法人会員', to: 'b2b+testlab@kanademono.design', html: '確認コード：<b>482915</b>\nこのコードは 10 分間有効です。' });
    Caption.set('確認コード（ワンタイムパスワード）はメールで届く');
    await Browser.clickTab('mail');
    Mail.render({ newIdx: 0 });
    await hoverUi('.wm-row[data-mail="0"] .wm-subj', { hold: 1500 });
    await Browser.clickTab('acct');
    Caption.set('メールに届いた 6 桁のコードを入力してログイン（パスワード不要）');
    await wait(600);
    const digits = '482915';
    await Acct.type(Acct.email(), digits, { kps: 4 });
    KeyStrip.idleHide(600);
    await clickUi(Acct.submit(), { after: 80 });
    Acct.busy(true); await wait(800);
    Acct.home();
    Browser.nav('acct', { title: '注文 - KANADEMONO', url: 'https://shopify.com/25419644990/account/orders' });
    Caption.set(`${CO}（本社）としてログイン：法人価格・請求書払いで購入できる`);
    Issue.ok($('.ac-co'), '会社として購入');
    await readHold(2200);
    Issue.hide();
    await Browser.clickTab('mail');
    // (the inbox list is on screen already: only an open mail has the back arrow)
    if ($('.wm-tools [data-back]')) await clickUi('.wm-tools [data-back]', { after: 80 });
    Mail.render({});
    await wait(300);
    await clickUi('.wm-row[data-mail="1"]', { after: 80 });
    Caption.set('お客様へのメール：見積書の PDF と、請求書払いで注文できるリンク');
    Mail.list[1].read = true;
    Mail.render({ open: 1 });
    Browser.nav('mail', { title: '御見積書・ご請求書（#D1024） - b2b@kanademono.design' });
    await hoverUi('#wmText b', { hold: 1300 });
    await clickUi('#wmAttach', { after: 80 });
    // the attached quote is #D1024, open in the first PDF tab (the viewer page is shared by the two PDF tabs)
    await clickUi(Browser.tabEl('pdf'), { kind: 'arrow', after: 60 });
    Pdf.show({ no: 'D1024' });
    Browser.activate('pdf');
    await wait(160);
    await wait(1500);
    // smartphone
    Caption.set('スマートフォン幅でも、登録フォームが 1 列で入力しやすいか確認');
    await Browser.clickTab('dev');
    await storeTab('dev', 'business', { path: '/pages/business', before: (d) => putForm(d, {}) });
    await Keycap.show(['Ctrl', 'Shift', 'M'], 700);
    Store.device(true);
    await Store.loadSp('business', { before: (d) => putForm(d, {}) });
    await Store.scrollToEl(Store.spDoc.querySelector('[data-demo-b2b]'), 200, 1800, true);
    await wait(2200);
    Caption.set('商品ページの法人価格と見積書ボタンも、スマートフォン幅で確認');
    Browser.nav('dev', { title: TITLE.desk, url: DEV + '/products/' + DESK.h });
    Browser.loading('dev', true);
    await Store.loadSp('desk', { before: (d) => putPrice(d, { price: DESK.b2b, off: true }) });
    Browser.loading('dev', false);
    await Store.scrollToEl(Store.spDoc.querySelector('[data-demo-price]'), 330, 1600, true);
    await wait(2000);
    Store.device(false);
  });

  /* 8 — the live page */
  scene('live', async () => {
    Caption.allDone();
    Caption.set('公開中の法人様窓口（kanademono.design/pages/business）');
    await Browser.newTab('live');
    await Browser.typeUrl('kanademono.design/pages/business');
    Browser.nav('live', { url: LIVE + '/pages/business', title: TITLE.business, page: 'store', fav: 'store' });
    Browser.loading('live', true);
    await Store.load('business', { before: (d) => putForm(d, {}) });
    Browser.loading('live', false);
    await wait(1600);
    const d = Store.doc;
    const h2 = (t) => [...d.querySelectorAll('h2')].find((h) => h.textContent.trim() === t);
    await Store.scrollToEl(h2('ABOUT'), 90, 2000);
    await wait(900);
    await Store.scrollToEl(h2('SERVICE'), 90, 1800);
    await wait(600);
    Caption.set('卸売取引（法人卸 15%OFF のカタログ）・請求書払い（支払い条件）・カンタン見積もり（下書き注文）');
    const card = (t) => [...d.querySelectorAll('h3, h4, .h4, p, h5')].find((e) => e.textContent.trim() === t);
    for (const t of ['卸売取引', '請求書払い', 'カンタン見積もり']) { const el = card(t); if (el) await hoverUi(el, { hold: 1100 }); }
    Cursor.kind('arrow');
    await Store.scrollToEl(h2('REGISTRATION FORM'), 90, 2200);
    await wait(1000);
    Caption.set('法人様会員登録フォーム：申請すると会社（B2B）が作られ、承認後に登録完了メール');
    await Store.scrollToEl(regBox(), 260, 1200);
    await hoverUi(Store.doc.querySelector('[data-in="company"]'), { kind: 'text', hold: 1400 });
    Cursor.kind('arrow');
    await wait(600);
    await Store.scrollToEl(h2('CONTACT'), 160, 1400);
    const cbtn = [...d.querySelectorAll('#contact-sec a.btn')][0];
    if (cbtn) await hoverUi(cbtn, { kind: 'hand', hold: 1300 });
    Cursor.kind('arrow');
    const perks = d.querySelector('#shopify-section-perks-grids');
    if (perks) { await Store.scrollToEl(perks, 300, 1200); await hoverUi(perks.querySelector('.perks-col'), { kind: 'hand', hold: 1200 }); Cursor.kind('arrow'); }
    await wait(800);
    await Store.scroll(0, 2600);
    Caption.set('ログインしていないお客様の商品ページは、これまでどおり通常価格のまま');
    Browser.nav('live', { url: LIVE + '/products/' + DESK.h, title: TITLE.desk });
    Browser.loading('live', true);
    await Store.load('desk');
    Browser.loading('live', false);
    await Store.scrollToEl(Store.doc.querySelector('.product-single__title'), 120, 900);
    await hoverUi(Store.doc.querySelector('.product-single__price'), { hold: 1800 });
    await Store.scroll(0, 1200);
    Caption.set('法人会員登録・法人価格・カンタン見積もり・請求書払いを Shopify の B2B 機能で実装');
    await wait(3800);
    Caption.hide();
  });

  /* ============================================================ setup */
  K.run({
    scenes: SCENES,
    warm: ['business', 'product', 'desk'],
    fontText: JSON.stringify(JA) + CO + F.STYLING,
    async prepare() {
      const tree = [
        ['app', 'dir', 1], ['app/lib', 'dir', 0], ['app/lib/company.server.js'], ['app/lib/quote-pdf.server.js'], ['app/routes', 'dir', 1], ['app/routes/apps.b2b.quote.js'], ['app/routes/apps.b2b.register.js'], ['app/shopify.server.js'],
        ['docs', 'dir', 1], ['docs/requirements.md'],
        ['flow', 'dir', 0], ['flow/company-created.liquid'],
        ['scripts', 'dir', 1], ['scripts/fixtures', 'dir', 0], ['scripts/fixtures/styling-project-room.json'], ['scripts/test-quote.mjs'],
        ['theme', 'dir', 1], ['theme/assets', 'dir', 1], ['theme/config', 'dir', 0], ['theme/config/settings_schema.json'], ['theme/sections', 'dir', 1], ['theme/sections/b2b-register.liquid'], ['theme/sections/main-product.liquid'],
        ['theme/snippets', 'dir', 1], ['theme/snippets/b2b-price.liquid'], ['theme/templates', 'dir', 0], ['theme/templates/page.business.json'],
        ['.env'], ['package.json'], ['README.md'], ['shopify.app.toml'],
      ];
      Code.init(F.files, tree);
      Code.show('README.md', { top: 0 });
      Term.render('<span class="caret"></span>');
      Browser.FAV.store = '<img class="br-fav img" src="assets/favicon-32.webp" alt="">';
      Browser.FAV.pdf = Browser.FAV.dev; // Chrome's PDF viewer: a PDF has no favicon
      Browser.FAV.mail = Browser.FAV.gmail;
      Admin.apps([{ id: 'flow', name: 'Flow', color: '#29845a', initials: 'F' }, { id: 'b2b', name: 'KANADEMONO B2B', color: '#222', initials: 'K' }]);
      // browser: the admin (companies, empty) behind, the live business page in front
      Browser.addTab({ id: 'adm', title: Admin.title('会社'), url: Admin.url('/companies'), page: 'admin', fav: 'admin' });
      Admin.show(V.companiesEmpty(), { nav: 'customers/companies', title: '会社', path: '/companies' });
      Browser.addTab({ id: 'biz', title: TITLE.business, url: LIVE + '/pages/business', page: 'store', fav: 'store' });
      K.hydrate();
    },
  });
  // the first scene shows the live page: load it when the clock starts (before the title card ends)
  const first = SCENES[1].fn;
  SCENES[1].fn = async () => { await Store.load('business'); await first(); };
  window.__JA = JA;
})();
