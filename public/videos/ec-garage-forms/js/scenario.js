/*
 * Timeline: Garage（garage.plus.co.jp, EC-CUBE 2）— 帳票・PDF・CSV: the request → 受注管理 › 帳票出力 and the 納品書 as it is
 * (EC-CUBE's sample logo, 「商品名 / 商品コード / [ 規格 ]」 in one column) → the logo, SC_Fpdf_Ex (data/class_extends):
 * the 品番 column — first 24 mm too wide (the table runs off the page), fixed → LC_Page_Admin_Order_Pdf_Ex: the 帳票出力
 * defaults, three orders at once (PDF一括出力) → the 出荷指示 CSV for the warehouse (CSV出力項目設定 › 高度な設定): the SQL
 * with dtb_order.deliv_date (EC-CUBE 2.4's column) passes 構文エラーを確認する but CSV出力 fails → dtb_shipping.shipping_date
 * → the real CSV → the 新着商品 by 商品登録CSV: a full-width comma in カテゴリID (EC-CUBE's own error), fixed, registered
 * → git, the production server → the live shop.
 * Every EC-CUBE screen, PDF and CSV is real: EC-CUBE 2 (eccube2-weekly-20261110) running locally with this code
 * (js/ec-snapshot.js, assets/pdf — tools/snapshots/ec-garage-forms/capture-ec.js); the shop is the live garage.plus.co.jp
 * (js/site-snapshot.js). The servers and the terminal output around them are reconstructions.
 *
 * Keys:  Space = start / pause   R = restart   C = captions on/off   H = hide hint
 * URL :  ?t=83 (seek, s)   ?from=4 (start of scene 4)   ?speed=1.3   ?captions=0
 */
(function () {
  'use strict';
  const D = window.Demo, K = window.Kit, F = window.FILES, EC = window.EC, W11 = window.Win11, GA = window.GA;
  const { esc, wait, Caption, Issue, Keycap, Win, screenRect, clickUi, hoverUi } = D;
  const { Code, Term, Browser, Store, FileDialog, readHold } = K;
  const SRC = F.SRC, P = F.files;
  const DEV = 'http://localhost:8080', LIVE = 'https://garage.plus.co.jp';
  const DATA = EC.data || {};
  const S = window.SITE_SNAPSHOT;
  /** a live page's own <title> (from its snapshot) */
  const TITLE = (k) => ((S.pages[k] && S.pages[k].pc || '').match(/<title>([^<]*)<\/title>/) || [])[1] || S.title;
  const mark = (label) => { (window.__marks = window.__marks || []).push([label, D.Clock.t]); };
  const check = (path, want, tag) => { if (Code.text(path) !== want) { console.warn('[demo] ' + path + ' differs from the expected text'); window.__typeDiff = (window.__typeDiff || []).concat(tag); } };
  const lineOf = (text, needle, from = 0) => text.split('\n').findIndex((l, i) => i >= from && l.includes(needle));

  /* ------------------------------------------------ Japanese typed through the IME */
  const JA = {
    '列の幅（': { r: 'retsunohaba(', segs: ['列の', '幅', '（'] },
    '）：品番の列を足す': { r: '):hinbannoretsuwotasu', segs: ['）：', '品番の', '列を', '足す'] },
    '商品名': { r: 'shouhinmei', segs: ['商品名'] },
    '規格': { r: 'kikaku', segs: ['規格'] },
    '品番': { r: 'hinban', segs: ['品番'] },
    '数量': { r: 'suuryou', segs: ['数量'] },
    '単価': { r: 'tanka', segs: ['単価'] },
    '金額': { r: 'kingaku', segs: ['金額'] },
    '税込': { r: 'zeikomi', segs: ['税込'] },
    '商品合計・送料などの行：品番の列は空': { r: 'shouhingoukei/souryounadonogyou:hinbannoretsuhakara', segs: ['商品', '合計', '・', '送料', 'などの', '行', '：', '品番の', '列は', '空'] },
    '納品書': { r: 'nouhinsho', segs: ['納品書'], predict: ['納品', '納品書'], yomi: ['のうひん', 'のうひんしょ'] },
    'このたびは': { r: 'konotabiha', segs: ['この', 'たびは'] },
    'をご利用いただき': { r: 'wogoriyouitadaki', segs: ['を', 'ご利用', 'いただき'] },
    'まことにありがとうございます。': { r: 'makotoniarigatougozaimasu.', segs: ['まことに', 'ありがとうございます。'] },
    '下記の内容にて納品いたします。': { r: 'kakinonaiyounitenouhinitashimasu.', segs: ['下記の', '内容にて', '納品', 'いたします。'] },
    'ご不明な点は、ガラージお客様センターまでお問い合わせください。': [{ r: 'gofumeinatenha,', segs: ['ご不明な', '点は', '、'] }, { r: 'garaajiokyakusamasenta-made', segs: ['ガラージ', 'お客様', 'センター', 'まで'] }, { r: 'otoiawasekudasai.', segs: ['お問い合わせ', 'ください。'] }],
    'フリーダイヤル': { r: 'furi-daiyaru', segs: ['フリーダイヤル'] },
    '（平日': { r: '(heijitsu', segs: ['（', '平日'] },
    '～': { r: '~', segs: ['～'] },
    '、': { r: ',', segs: ['、'] },
    '）': { r: ')', segs: ['）'] },
    // the SQL's column names (the warehouse's)
    '受注番号': { r: 'juchuubangou', segs: ['受注', '番号'] },
    '配送先番号': { r: 'haisousakibangou', segs: ['配送先', '番号'] },
    'お届け希望日': { r: 'otodokekibioubi', segs: ['お届け', '希望日'] },
    '配送方法': { r: 'haisouhouhou', segs: ['配送', '方法'] },
    '会社名': { r: 'kaishamei', segs: ['会社名'] },
    'お届け先': { r: 'otodokesaki', segs: ['お届け先'] },
    '郵便番号': { r: 'yuubinbangou', segs: ['郵便番号'] },
    '住所': { r: 'juusho', segs: ['住所'] },
    '電話番号': { r: 'denwabangou', segs: ['電話番号'] },
    'カラー': { r: 'kara-', segs: ['カラー'] },
    '出荷指示（PLC）': [{ r: 'shukkashiji(', segs: ['出荷', '指示', '（'] }, { direct: 'PLC' }, { r: ')', segs: ['）'] }],
  };
  /** typing script for 4-space PHP / SQL lines (EC-CUBE 2's style): Enter + auto-indent, corrected */
  const php = (lines, after) => K.codeScript(lines, JA, { after, unit: '    ' });
  const show0 = Code.show.bind(Code);
  Code.show = function (path, o) {
    const f = Code.files[path];
    if (f && /.(php|sql)$/.test(path)) f.indent = '    ';
    show0(path, o);
  };
  const openAt = async (path, o) => { if (Code.files[path]) Code.files[path].lastLeft = 0; await Code.openFile(path, o); };
  const panel = async (tall) => { await Code.panel(true, tall ? { tall: true } : {}); if (Code.ins && Code.active) { Code.ensureVisible(Code.ins.line); Code.render(); } Term.render('<span class="caret"></span>'); };

  /* ------------------------------------------------------------- helpers */
  const R = (el, pad = 0) => () => { const e = typeof el === 'function' ? el() : typeof el === 'string' ? EC.el(el) : el; if (!e) return null; const r = screenRect(e); return { left: r.left - pad, top: r.top - pad, width: r.width + pad * 2, height: r.height + pad * 2 }; };
  const linesRect = (a, b, w = 1100) => () => {
    const r1 = Code.lineEl(a), r2 = Code.lineEl(b);
    if (!r1 || !r2) return null;
    const x = screenRect(r1.querySelector('.lc')), y = screenRect(r2.querySelector('.lc'));
    return { left: x.left, top: x.top, width: Math.min(x.width, w), height: y.bottom - x.top };
  };
  const termFind = (text, n = 1, w = 1200) => () => {
    const rows = [...document.querySelectorAll('#vsTerm > div')];
    let i = -1;
    rows.forEach((r, k) => { if (r.textContent.includes(text)) i = k; });
    if (i < 0) return null;
    const a = screenRect(rows[i]), b = screenRect(rows[Math.min(rows.length - 1, i + n - 1)]);
    return { left: a.left, top: a.top, width: Math.min(w, a.width), height: b.bottom - a.top };
  };
  const textEl = (sel, re) => EC.els(sel).find((e) => re.test(e.textContent.trim()));
  const btn = (re) => textEl('a.btn-normal, a.btn-action, a', re);
  const say = (text, ms) => { Caption.set(text); return readHold(ms != null ? ms : Math.min(4200, Math.max(1600, text.length * 55))); };
  const ecKey = {};
  /** an EC-CUBE screen in a tab (its real title; the address of the dev copy), the page loading for a moment */
  async function ecScreen(key, o = {}) {
    const tab = o.tab || 'ec';
    if (o.loading !== false) { Browser.loading(tab, true); await wait(o.ms || 450); }
    await EC.show(key);
    ecKey[tab] = key;
    Browser.nav(tab, { title: o.title || EC.title(key), url: o.url || EC.url(key), page: 'wp', fav: 'ec' });
    if (o.loading !== false) Browser.loading(tab, false);
    await wait(o.after != null ? o.after : 300);
  }
  async function tabTo(id) {
    await Browser.clickTab(id);
    if (Browser.tab(id).page === 'wp' && ecKey[id]) await EC.show(ecKey[id]);
  }
  /** a PDF EC-CUBE made, in Chrome's PDF viewer (the tab of the 帳票出力 popup) */
  async function pdfView(key, o = {}) {
    Browser.loading('pop', true);
    await wait(o.ms || 900);
    GA.Pdf.show(key);
    Browser.nav('pop', { title: 'pdf.php', url: DEV + '/admin/order/pdf.php', page: 'pdf', fav: 'dev' });
    Browser.loading('pop', false);
    await wait(500);
  }
  const spot = (n, pad = 0) => R(() => GA.Pdf.spot(n), pad);
  /** the 帳票出力 popup's 「この内容で作成する」 */
  const makeBtn = () => btn(/この内容で作成する/);
  async function typeBox(name, text, o = {}) {
    const box = EC.field(name);
    await clickUi(box, { kind: 'text', ax: o.ax != null ? o.ax : 0.1, after: 60 });
    EC.focus(box, true);
    await D.typeInto(EC.typeInto(name, null, o.base ? { base: o.base } : {}), typeof text === 'string' ? [{ direct: text }] : text, { kps: o.kps || 13 });
    EC.blur(name);
  }
  /** pastes text into a captured box (Ctrl+V): o.selectAll first replaces what is there */
  async function pasteBox(name, text, o = {}) {
    const box = EC.field(name);
    if (!box) {
      const ta = EC.el(`textarea[name="${name}"]`);
      await clickUi(ta, { kind: 'text', ax: 0.2, ay: 0.15, after: 60 });
      if (o.selectAll) { await Keycap.show(['Ctrl', 'A'], 450); ta.select(); await wait(250); }
      await Keycap.show(['Ctrl', 'V'], 500);
      ta.value = text;
      ta.scrollTop = 0;
      ta.setSelectionRange(0, 0);
      await wait(300);
      return;
    }
    await clickUi(box, { kind: 'text', ax: 0.2, ay: 0.15, after: 60 });
    EC.focus(box, true);
    if (o.selectAll) { await Keycap.show(['Ctrl', 'A'], 450); box.innerHTML = `<span style="background:#b4d5fe">${esc(box.textContent)}</span>`; await wait(250); }
    await Keycap.show(['Ctrl', 'V'], 500);
    box.textContent = text;
    box.scrollTop = 0;
    await wait(300);
    EC.blur(name);
  }
  const shipName = (() => {
    // the CSV EC-CUBE sent: contents_<yymmdd>_<hhmmss>.csv — at the video's clock
    const f = (DATA.shipCsv && DATA.shipCsv.file) || 'contents.csv';
    return f.replace(/_\d{6}_\d{6}\.csv$/, '_261116_111842.csv');
  })();

  /* ================================================================ scenes */
  const SCENES = [];
  const scene = (name, fn) => SCENES.push({ name, fn });

  scene('intro', K.introScene);

  /* 1 — the request, the live shop, 受注管理 and the 納品書 as it is */
  scene('request', async () => {
    Caption.step(1);
    await say('依頼（業務チーム）：納品書 PDF・倉庫向けの出荷指示 CSV・新着商品の一括登録');
    await hoverUi(Code.lineEl(2), { ax: 0.3, hold: 500 });
    Issue.ok(linesRect(2, 9, 980), '納品書（PDF）');
    await readHold(3400);
    Issue.ok(linesRect(11, 16, 980), '出荷指示 CSV');
    await readHold(2400);
    Issue.ok(linesRect(18, 21, 980), '新着商品');
    await readHold(2000);
    Issue.hide();
    // the live shop: a product with its 品番 (製品番号)
    await Win.switchTo('browser');
    await tabTo('live');
    await say('Garage（プラス株式会社 ファニチャーカンパニー）：オフィス家具の通販。商品ごとに品番（製品番号 例：797-039）');
    const code = Store.doc.querySelector('#product_code_dynamic');
    if (code) {
      await Store.scrollToEl(code, 380, 1400);
      Issue.ok(() => screenRect(code.closest('dl') || code), '品番');
      await readHold(2400);
      Issue.hide();
    } else { await Store.scroll(420, 1400); await readHold(1600); }
    await Store.scroll(0, 900);
    // the dev copy: 受注管理
    await Browser.newTab('ec');
    await Browser.typeUrl('localhost:8080/admin/order/');
    await ecScreen('orders', { ms: 700 });
    GA.blurPeople();
    await say('開発環境（EC-CUBE 2.25・本番データのコピー）の受注管理：法人のお客様の家具の注文が多い');
    const rowOf = (id) => textEl('table.list tr', new RegExp(String(id)));
    await EC.scroll(560, 900);
    const r86 = rowOf(120486);
    if (r86) { await hoverUi(r86, { hold: 600 }); Issue.ok(R(r86, 1), '注文番号 120486（家具便・3 商品）'); await readHold(2200); Issue.hide(); }
    // 帳票出力 (個別出力: a popup)
    await say('「帳票」の個別出力：帳票出力の画面（ポップアップ）');
    const one = r86 && [...r86.querySelectorAll('a')].find((a) => /個別出力/.test(a.textContent));
    await clickUi(one || r86, { kind: 'hand', after: 80 });
    await Browser.newTab('pop');
    await ecScreen('pdf-form', { tab: 'pop', ms: 600, url: DEV + '/admin/order/pdf.php?order_id=120486' });
    await hoverUi(EC.el('select[name="type"]'), { hold: 500 });
    Issue.ok(R(EC.el('input[name="title"]'), 3), 'タイトル・メッセージ・備考は毎回入力');
    await readHold(2400);
    Issue.hide();
    await clickUi(makeBtn(), { kind: 'hand', after: 60 });
    await pdfView('nouhin-default');
    mark('pdfDefault');
    Caption.issue('今の納品書', 'ロゴは EC-CUBE のサンプルのまま。明細は「商品名 / 商品コード / [ 規格 ]」が 1 列');
    await hoverUi(GA.Pdf.spot('logo'), { hold: 400 });
    Issue.show(spot('logo', 4), 'EC-CUBE のサンプルのロゴ');
    await readHold(2600);
    Issue.show(spot('col1', 2), '品番が商品名に埋もれている');
    await readHold(3000);
    Issue.hide();
  });

  /* 2 — the logo, SC_Fpdf_Ex: the 品番 column */
  scene('pdf', async () => {
    Caption.step(2);
    W11.skipTo('10:27');
    await Win.switchTo('code');
    await say('納品書は data/class/SC_Fpdf.php（EC-CUBE 本体・FPDF）。明細の 1 列目に商品名・商品コード・規格をつないでいる');
    const SF = 'data/class/SC_Fpdf.php';
    await openAt(SF, { top: 236 });
    const l1 = lineOf(Code.text(SF), "$arrOrder[$i][0] = $this->arrDisp['product_name'][$i].' / ';");
    await Code.reveal(l1 + 6, 600);
    Issue.show(linesRect(l1, l1 + 10, 1000), '1 列目＝商品名 / 商品コード / [ 規格 ]');
    await readHold(3200);
    const lw = lineOf(Code.text(SF), '$this->width_cell = [');
    await Code.reveal(lw, 600);
    Issue.ok(linesRect(lw, lw + 6, 1000), '列の幅（mm）と見出しはプロパティ');
    await readHold(2800);
    const lg = lineOf(Code.text(SF), "$logo_file = PDF_TEMPLATE_REALDIR.'logo.png';");
    await Code.reveal(lg, 600);
    Issue.ok(linesRect(lg, lg + 1, 1000), 'ロゴは templates/admin/pdf/logo.png');
    await readHold(2600);
    Issue.hide();
    // the logo
    await say('ロゴ：Garage のロゴの PNG を logo.png に差し替え');
    await panel(false);
    await Term.run('Copy-Item assets\\garage\\logo_garage.png data\\Smarty\\templates\\admin\\pdf\\logo.png', [' '], { kps: 26 });
    Code.mark(SRC.LOGO, 'M');
    await wait(600);
    await Code.panel(false);
    // class_extends
    await say('EC-CUBE 2 のカスタマイズは data/class_extends に「元のクラス名_Ex.php」を置く（本体は変更しない）');
    await openAt('data/class_extends/README.md', { top: 0 });
    Issue.ok(linesRect(2, 2, 1100), '*_Ex.php で拡張');
    await readHold(2600);
    Issue.hide();
    await say('SC_Fpdf_Ex：コンストラクターで列の幅と見出しを変え、表（FancyTable）で品番を別の列にする');
    const A = SRC.fpdf(1).split('\n');
    const ci = A.findIndex((l) => l.includes('public function __construct('));
    const fi = A.findIndex((l) => l.includes('public function FancyTable('));
    await Code.newFile(SRC.FPDF_PATH);
    await Code.paste(A.slice(0, ci).join('\n'));
    await Code.type(php(A.slice(ci, fi - 8), A[ci - 1]), { kps: 22 });
    await Code.paste('\n' + A.slice(fi - 8, fi + 3).join('\n'), { flash: false });
    const end = A.length - 3;
    await Code.type(php(A.slice(fi + 3, end), A[fi + 2]), { kps: 22 });
    await Code.paste('\n' + A.slice(end).join('\n'), { flash: false });
    await Code.save({ status: 'U' });
    check(SRC.FPDF_PATH, SRC.fpdf(1), 'SC_Fpdf_Ex 1');
    const sp = lineOf(Code.text(SRC.FPDF_PATH), "$name = str_replace(");
    Issue.ok(linesRect(sp - 7, sp + 1, 1000), '商品の行：「商品名 [ 規格 ]」と品番に分ける');
    await readHold(2600);
    Issue.hide();
    // the PDF
    await Win.switchTo('browser');
    await tabTo('pop');
    await Keycap.show(['Alt', '←'], 500);
    await ecScreen('pdf-form', { tab: 'pop', url: DEV + '/admin/order/pdf.php?order_id=120486' });
    await clickUi(makeBtn(), { kind: 'hand', after: 60 });
    await pdfView('nouhin-wide');
    mark('pdfWide');
    await hoverUi(GA.Pdf.spot('logo'), { hold: 300 });
    Issue.ok(spot('logo', 4), 'Garage のロゴ');
    await readHold(1800);
    Caption.issue('はみ出し', '品番の列は付いたが、表が用紙の右端からはみ出して「金額(税込)」が切れている');
    Issue.show(spot('right', 3), '金額の列が切れている');
    await readHold(3600);
    Issue.hide();
    await Win.switchTo('code');
    const lw2 = lineOf(Code.text(SRC.FPDF_PATH), '$this->width_cell = [');
    await Code.reveal(lw2, 500);
    Caption.issue('原因', '品番の 24mm を足しただけで、商品名の列（110.3mm）を狭めていない：合計 192.5mm');
    Issue.show(linesRect(lw2, lw2, 900), '110.3 + 24 + 12 + 21.7 + 24.5');
    await readHold(3400);
    Issue.hide();
    await say('商品名の列を 24mm 狭めて 86.3mm に（合計は元の 168.5mm）');
    await Code.overwrite('110.3', [{ direct: '86.3' }], { from: lw2 });
    await Code.save();
    check(SRC.FPDF_PATH, SRC.fpdf(2), 'SC_Fpdf_Ex 2');
    await Win.switchTo('browser');
    await Keycap.show(['Alt', '←'], 500);
    await ecScreen('pdf-form', { tab: 'pop', url: DEV + '/admin/order/pdf.php?order_id=120486' });
    await clickUi(makeBtn(), { kind: 'hand', after: 60 });
    await pdfView('nouhin-col');
    mark('pdfCol');
    Caption.fixed('納品書：Garage のロゴ、明細に「品番」の列（797-047・666-980 …）');
    await hoverUi(GA.Pdf.spot('code'), { hold: 400 });
    Issue.ok(spot('code', 3), '品番');
    await readHold(2600);
    Issue.ok(spot('table', 3), '用紙の幅に収まった');
    await readHold(2200);
    Issue.ok(spot('shop', 4), '発行元：特定商取引法の設定（販売業者・所在地・TEL）');
    await readHold(2600);
    Issue.hide();
  });

  /* 3 — the defaults (LC_Page_Admin_Order_Pdf_Ex), three orders at once */
  scene('defaults', async () => {
    Caption.step(3);
    W11.skipTo('10:41');
    await Win.switchTo('code');
    const PO = 'data/class/pages/admin/order/LC_Page_Admin_Order_Pdf.php';
    await openAt(PO, { top: 100 });
    const cf = lineOf(Code.text(PO), 'public function createFromValues(');
    await Code.reveal(cf + 14, 600);
    await say('帳票出力の初期値は LC_Page_Admin_Order_Pdf の createFromValues()（タイトル「お買上げ明細書(納品書)」など）');
    Issue.ok(linesRect(cf + 3, cf + 17, 1000), '初期値');
    await readHold(3000);
    Issue.hide();
    await say('LC_Page_Admin_Order_Pdf_Ex：親の初期値に、タイトル「納品書」・メッセージ・備考（お客様センター）を上書き');
    const B = SRC.PDF_PAGE.split('\n');
    const pi = B.findIndex((l) => l.includes('$arrForm = parent::createFromValues('));
    const ri = B.findIndex((l) => l.includes('return $arrForm;'));
    await Code.newFile(SRC.PDF_PAGE_PATH);
    await Code.paste(B.slice(0, pi + 1).join('\n'));
    await Code.type(php(B.slice(pi + 1, ri - 1), B[pi]), { kps: 20 });
    await Code.paste('\n' + B.slice(ri - 1).join('\n').replace(/\n$/, ''), { flash: false });
    await Code.save({ status: 'U' });
    check(SRC.PDF_PAGE_PATH, SRC.PDF_PAGE.replace(/\n$/, ''), 'Pdf_Ex');
    // three orders of today
    W11.skipTo('10:49');
    await Win.switchTo('browser');
    await tabTo('ec');
    await say('受注一覧で 3 件にチェック →「PDF一括出力」');
    await EC.scroll(560, 600);
    for (const id of [120488, 120487, 120486]) {
      const c = EC.el(`#pdf_order_id_${id}`);
      if (c) { await clickUi(c, { after: 120 }); GA.tick(`#pdf_order_id_${id}`); }
    }
    await clickUi(btn(/PDF一括出力/), { kind: 'hand', after: 60 });
    await tabTo('pop');
    await ecScreen('pdf-form-multi', { tab: 'pop', ms: 600, url: DEV + '/admin/order/pdf.php' });
    mark('multiForm');
    Caption.set('帳票出力：3 件の注文番号と、Pdf_Ex で入れた初期値');
    Issue.ok(R(textEl('table tr', /^注文番号/), 2), '注文番号 3 件');
    await readHold(2000);
    Issue.ok(R(EC.el('input[name="title"]'), 3), 'タイトル「納品書」');
    await readHold(1600);
    Issue.ok(R(textEl('table tr', /^備考/), 2), '備考：お客様センターの連絡先');
    await readHold(2600);
    Issue.hide();
    await clickUi(makeBtn(), { kind: 'hand', after: 60 });
    await pdfView('nouhin-multi', { ms: 1200 });
    mark('pdfMulti');
    Caption.fixed('3 件の納品書が 1 つの PDF に（1 件 1 ページ）。タイトル「納品書」・備考も入った');
    Issue.ok(spot('note', 3), '備考（初期値）');
    await readHold(2600);
    Issue.hide();
    await clickUi(document.querySelector('#pvImg'), { after: 100 });
    await Keycap.show(['End'], 500);
    GA.Pdf.show('nouhin-multi-p3');
    await readHold(2400);
  });

  /* 4 — the 出荷指示 CSV: CSV出力項目設定, 高度な設定 (SQL) */
  scene('csv', async () => {
    Caption.step(4);
    W11.skipTo('10:58');
    await tabTo('ec');
    await say('受注の CSV（CSV出力項目設定）は 1 行 = 1 受注。倉庫は 1 行 = 1 商品で、品番・数量・お届け先が欲しい');
    await Browser.typeUrl('localhost:8080/admin/contents/csv.php?tpl_subno_csv=order');
    await ecScreen('csv-order', { ms: 600 });
    const sel = EC.el('#output_list_to, select[name="output_list[]"], .ms2side__select select');
    if (sel) { Issue.show(R(sel, 3), '受注の項目（受注単位）'); await readHold(2600); Issue.hide(); }
    await say('「高度な設定」：SELECT 文を書いて、その結果を CSV にできる');
    const adv = textEl('a', /^高度な設定$/);
    if (adv && adv.getBoundingClientRect().width > 0) await hoverUi(adv, { hold: 600 });
    // the SQL, written in the editor
    await Win.switchTo('code');
    await say('SQL：受注 × 配送先 × 配送商品（dtb_shipment_item）。PostgreSQL の本番でも動く書き方');
    const Q = SRC.sql(1).split('\n');
    await Code.newFile(SRC.SQL_PATH);
    await Code.paste(Q.slice(0, 2).join('\n'));
    await Code.type(K.codeScript(Q.slice(2, Q.length - 1), JA, { after: Q[1], unit: '    ' }), { kps: 26 });
    await Code.save({ status: 'U' });
    check(SRC.SQL_PATH, SRC.sql(1).replace(/\n$/, ''), 'sql 1');
    await Keycap.show(['Ctrl', 'A'], 400);
    await Keycap.show(['Ctrl', 'C'], 400);
    // into the admin
    await Win.switchTo('browser');
    await Browser.typeUrl('localhost:8080/admin/contents/csv_sql.php');
    await ecScreen('csvsql', { ms: 600, url: DEV + '/admin/contents/csv_sql.php' });
    await typeBox('sql_name', JA['出荷指示（PLC）']);
    await pasteBox('csv_sql', SRC.sqlBody(1));
    await say('「構文エラーを確認する」');
    await clickUi(btn(/構文エラーを確認する/), { kind: 'hand', after: 60 });
    await Browser.newTab('chk');
    await ecScreen('csvsql-check', { tab: 'chk', ms: 700, url: DEV + '/admin/contents/csv_sql.php' });
    Issue.ok(R(textEl('table tr', /^エラー内容/), 2), 'エラーはありません');
    await readHold(2200);
    Issue.hide();
    await Keycap.show(['Ctrl', 'W'], 400);
    // the popup closed: its opener (the admin's tab) is in front again
    GA.closeTab('chk');
    Browser.activate('ec');
    if (ecKey.ec) await EC.show(ecKey.ec);
    await wait(300);
    await clickUi(btn(/この内容で登録する/), { kind: 'hand', after: 60 });
    await ecScreen('csvsql-saved', { ms: 700, url: DEV + '/admin/contents/csv_sql.php' });
    const reg = textEl('table.list tr', /出荷指示/);
    if (reg) { Issue.ok(R(reg, 1), '登録済みの SQL'); await readHold(1800); Issue.hide(); }
    await say('「CSV出力」で確認');
    await clickUi(reg && reg.querySelector('a[name="csv"]') || btn(/CSV出力/), { kind: 'hand', after: 60 });
    await ecScreen('csvsql-fail', { ms: 900, url: DEV + '/admin/contents/csv_sql.php' });
    mark('csvFail');
    Caption.issue('システムエラー', '構文の確認は「エラーはありません」だったのに、CSV出力で「システムエラーが発生しました」');
    Issue.show(R(textEl('body *', /システムエラーが発生しました/) || EC.el('body'), 8), 'CSV出力で失敗');
    await readHold(3400);
    Issue.hide();
    // the error log, then SQLite itself
    await Win.switchTo('code');
    await panel(true);
    const elog = (DATA.errorLog || []).map((l) => esc(l.replace(/\/srv\/eccube\//g, '/var/www/eccube/').slice(0, 170)));
    await Term.run('Get-Content data\\logs\\error.log -Tail 40 | Select-String -Context 0,6 "DB処理"', elog.length ? elog : ['DB処理でエラーが発生しました。'], { kps: 30 });
    Issue.show(termFind('MDB2 Error', 1, 700), 'DB のエラー（詳細なし）');
    await readHold(2600);
    const msg = String(DATA.sqliteMsg || 'no such column: o.deliv_date');
    await Term.run('sqlite3 data\\eccube.db ".read docs\\csv\\shipping-plc.sql"', [' <span class="tr">Parse error: ' + esc(msg) + '</span>'], { kps: 26 });
    Issue.show(termFind('Parse error', 1, 900), msg);
    await readHold(2600);
    Issue.hide();
    await Code.panel(false);
    const dl = lineOf(Code.text(SRC.SQL_PATH), 'o.deliv_date');
    await Code.reveal(dl, 400);
    Caption.issue('原因', 'お届け日は EC-CUBE 2.4 までの dtb_order.deliv_date。2.11 以降は配送先ごとの dtb_shipping.shipping_date');
    Issue.show(linesRect(dl, dl, 760), '古い版の列名');
    await readHold(3800);
    Issue.hide();
    await Code.overwrite('o.deliv_date', [{ direct: 's.shipping_date' }], { from: dl });
    await Code.save();
    check(SRC.SQL_PATH, SRC.sql(2).replace(/\n$/, ''), 'sql 2');
    await Keycap.show(['Ctrl', 'A'], 400);
    await Keycap.show(['Ctrl', 'C'], 400);
    await Win.switchTo('browser');
    await Keycap.show(['Alt', '←'], 500);
    await ecScreen('csvsql-saved', { url: DEV + '/admin/contents/csv_sql.php' });
    await pasteBox('csv_sql', SRC.sqlBody(2), { selectAll: true });
    await clickUi(btn(/この内容で登録する/), { kind: 'hand', after: 60 });
    await ecScreen('csvsql-saved2', { ms: 700, url: DEV + '/admin/contents/csv_sql.php' });
    const reg2 = textEl('table.list tr', /出荷指示/);
    await clickUi(reg2 && reg2.querySelector('a[name="csv"]') || btn(/CSV出力/), { kind: 'hand', after: 60 });
    await Browser.download(shipName, `${((DATA.shipCsv && DATA.shipCsv.bytes) || 2000) / 1000 | 0} KB`, { hold: 1600 });
    // the CSV (Shift_JIS) in the editor
    await Win.switchTo('code');
    await say('ダウンロードした CSV（Shift_JIS）を docs/csv に置いて中身を確認');
    await Code.newFile(F.SHIP_FILE);
    Code.setText(F.SHIP_FILE, F.SHIP_CSV);
    await Code.save({ status: 'U' });
    await Code.reveal(0, 300);
    mark('shipCsv');
    Caption.fixed('出荷指示 CSV：1 行 = 1 商品。お届け希望日・配送方法・お届け先・品番・カラー・数量');
    const n = F.SHIP_CSV.split('\n').length;
    Issue.ok(linesRect(0, 0, 1500), '倉庫の項目名');
    await readHold(2400);
    Issue.ok(linesRect(1, Math.min(n - 1, 12), 1500), `${n - 1} 行（新規受付・入金済みの受注の商品）`);
    await readHold(3200);
    Issue.hide();
  });

  /* 5 — the 新着商品 by 商品登録CSV */
  scene('products', async () => {
    Caption.step(5);
    W11.skipTo('11:24');
    const PC = 'docs/csv/products-new-2026-11.csv';
    await openAt(PC, { top: 0 });
    await say('商品部の CSV：EC-CUBE の商品 CSV の形式で新着 8 商品（商品名・品番・価格・在庫・カテゴリID・画像）');
    Issue.ok(linesRect(1, 8, 1500), '新着 8 商品');
    await readHold(3000);
    Issue.hide();
    await Win.switchTo('browser');
    await tabTo('ec');
    await Browser.typeUrl('localhost:8080/admin/products/upload_csv.php');
    await ecScreen('upload', { ms: 600 });
    await say('商品管理 › 商品登録CSV：CSV ファイルを選んで「この内容で登録する」');
    const file = EC.el('input[name="csv_file"]');
    await clickUi(file, { kind: 'hand', ax: 0.08, after: 100 });
    await FileDialog.pick({ folder: ['PC', 'ローカル ディスク (C:)', 'work', 'garage-eccube', 'docs', 'csv'], files: [
      { name: 'products-new-2026-11.csv', date: '2026/11/10 11:20', type: 'Microsoft Excel CSV ファイル', size: `${Math.max(1, Math.round(P[PC].length * 1.4 / 1024))} KB` },
      { name: shipName.replace('contents', 'shipping-plc'), date: '2026/11/10 11:19', type: 'Microsoft Excel CSV ファイル', size: '3 KB' }], pick: 'products-new-2026-11.csv' });
    await clickUi(btn(/この内容で登録する/), { kind: 'hand', after: 60 });
    await ecScreen('upload-err', { ms: 1100 });
    mark('uploadErr');
    const errEl = textEl('#main span.attention, span.attention, .attention, #main td, #main div, #main p', /販売価格/);
    Caption.issue('取り込みエラー', '4 行目「販売価格は数字で入力してください」：gNest の行の価格が "143,000"（3 桁区切りのカンマ付き）');
    if (errEl) Issue.show(R(errEl, 4), '4 行目：販売価格');
    await readHold(3800);
    Issue.hide();
    // the CSV: the full-width commas
    await Win.switchTo('code');
    await openAt(PC);
    const lines = Code.text(PC).split('\n');
    const money = /"(\d{1,3}(?:,\d{3})+)"/;
    const bad = lines.map((l, i) => (money.test(l) ? i : -1)).filter((i) => i >= 0);
    await say('gNest の 3 行：価格表から貼り付けた "143,000" をカンマなしの数字に');
    for (const i of bad) {
      const m = Code.text(PC).split('\n')[i].match(money);
      await Code.reveal(i, 300);
      await Code.overwrite(m[0], [{ direct: m[1].replace(/,/g, '') }], { from: i });
    }
    await Code.save();
    check(PC, F.FINAL_CSV, 'product csv');
    await Win.switchTo('browser');
    await Keycap.show(['Alt', '←'], 500);
    await ecScreen('upload');
    await clickUi(EC.el('input[name="csv_file"]'), { kind: 'hand', ax: 0.08, after: 100 });
    await FileDialog.pick({ folder: ['PC', 'ローカル ディスク (C:)', 'work', 'garage-eccube', 'docs', 'csv'], files: [
      { name: 'products-new-2026-11.csv', date: '2026/11/10 11:27', type: 'Microsoft Excel CSV ファイル', size: `${Math.max(1, Math.round(P[PC].length * 1.4 / 1024))} KB` }], pick: 'products-new-2026-11.csv', look: 400 });
    await clickUi(btn(/この内容で登録する/), { kind: 'hand', after: 60 });
    await ecScreen('upload-done', { ms: 1400 });
    mark('uploadDone');
    Caption.fixed('CSV登録を実行しました：新着 8 商品を登録');
    const done = textEl('#main div, #main p, #main td', /2行目/) || EC.el('#main');
    if (done) Issue.ok(R(done, 4), '2〜9 行目：登録');
    await readHold(3000);
    Issue.hide();
    await Browser.typeUrl('localhost:8080/admin/products/');
    await ecScreen('products', { ms: 900, url: DEV + '/admin/products/' });
    await say('商品マスター：新着の gNest・EL2・GS3・エイルチェアなど（画像・品番・価格・在庫）');
    await EC.scroll(560, 1000);
    const g = textEl('table.list tr', /gNest/);
    if (g) { await hoverUi(g, { hold: 500 }); Issue.ok(R(g, 1), '新着 gNest'); await readHold(2400); Issue.hide(); }
  });

  /* 6 — git, the production server, the live shop */
  scene('deploy', async () => {
    Caption.step(6);
    W11.skipTo('11:52');
    await Win.switchTo('code');
    await panel(true);
    await say('コミットして本番へ。CSV の SQL と新着商品は本番の管理画面で同じ手順で登録');
    await Term.run('git add -A; git commit -m "帳票：納品書に品番の列とロゴ・帳票出力の初期値、出荷指示 CSV の SQL"', [
      esc('[main 7b2e4c9] 帳票：納品書に品番の列とロゴ・帳票出力の初期値、出荷指示 CSV の SQL'),
      ' 6 files changed, 1184 insertions(+)',
      ' create mode 100644 data/class_extends/SC_Fpdf_Ex.php',
      ' create mode 100644 data/class_extends/page_extends/admin/order/LC_Page_Admin_Order_Pdf_Ex.php',
      ' create mode 100644 docs/csv/shipping-plc.sql'], { kps: 34 });
    await Term.run('git push', ['To github.com:garage-plus/garage-eccube.git', '   5d81a0e..7b2e4c9  main -&gt; main'], { kps: 20 });
    await Term.run('ssh garage-prod "cd /var/www/eccube && ./deploy.sh"', ['Updating 5d81a0e..7b2e4c9', 'Fast-forward',
      ' data/Smarty/templates/admin/pdf/logo.png          | Bin 3871 -&gt; 4412 bytes',
      ' data/class_extends/SC_Fpdf_Ex.php                 |  43 +++',
      ' .../admin/order/LC_Page_Admin_Order_Pdf_Ex.php    |  31 +++',
      ' docs/csv/shipping-plc.sql                         |  22 ++',
      'Smarty のキャッシュを削除しました（data/Smarty/templates_c）', '<span class="tg">deploy: done</span>'], { kps: 26 });
    Issue.ok(termFind('deploy: done', 1, 500), '本番へ反映');
    await readHold(2000);
    Issue.hide();
    await Code.panel(false);
    // the live shop
    await Win.switchTo('browser');
    await tabTo('live');
    await Browser.typeUrl('garage.plus.co.jp/products/detail.php?product_id=179746');
    Browser.nav('live', { url: LIVE + '/products/detail.php?product_id=179746', title: TITLE('fresh') });
    Browser.loading('live', true);
    await Store.load('fresh', { states: ['icons'] });
    Browser.loading('live', false);
    mark('live');
    await say('公開中の Garage：新着の gNest ラウンジワーキング（CSV で登録した商品）');
    await Store.scroll(360, 1600);
    await readHold(2000);
    Cursor0();
    Caption.set('EC-CUBE 2：納品書 PDF（品番の列・ロゴ・初期値・一括出力）、倉庫向けの出荷指示 CSV（SQL）、新着商品の CSV 一括登録');
    await wait(4800);
    Caption.hide();
  });
  const Cursor0 = () => D.Cursor.kind('arrow');

  /* ============================================================ setup */
  K.run({
    scenes: SCENES,
    warm: ['home', 'fresh', 'desk'],
    fontText: JSON.stringify(JA) + P['docs/request-2026-11.md'] + F.SHIP_CSV + '品番帳票出力納品書',
    async prepare() {
      const tree = [
        ['assets', 'dir', 1], ['assets/garage', 'dir', 1], ['assets/garage/logo_garage.png'],
        ['data', 'dir', 1], ['data/class', 'dir', 1], ['data/class/pages', 'dir', 1], ['data/class/pages/admin', 'dir', 1], ['data/class/pages/admin/order', 'dir', 1],
        ['data/class/pages/admin/order/LC_Page_Admin_Order_Pdf.php'], ['data/class/SC_Fpdf.php'],
        ['data/class_extends', 'dir', 1], ['data/class_extends/page_extends', 'dir', 1], ['data/class_extends/page_extends/admin', 'dir', 1],
        ['data/class_extends/page_extends/admin/order', 'dir', 1], ['data/class_extends/README.md'],
        ['data/Smarty', 'dir', 1], ['data/Smarty/templates', 'dir', 1], ['data/Smarty/templates/admin', 'dir', 1], ['data/Smarty/templates/admin/pdf', 'dir', 1],
        ['data/Smarty/templates/admin/pdf/logo.png'], ['data/Smarty/templates/admin/pdf/nouhinsyo1.pdf'],
        ['docs', 'dir', 1], ['docs/csv', 'dir', 1], ['docs/csv/products-new-2026-11.csv'], ['docs/request-2026-11.md'],
        ['.gitignore'], ['README.md'],
      ];
      Code.init({ ...P }, tree);
      Code.show('docs/request-2026-11.md', { top: 0 });
      Term.render('<span class="caret"></span>');
      Browser.addTab({ id: 'live', title: TITLE('desk'), url: LIVE + '/products/detail.php?product_id=179812', page: 'store', fav: 'store' });
      await Store.load('desk', { states: ['icons'] });
      await EC.preload(Object.keys(window.EC_SNAPSHOT.pages));
      GA.blurPeople();
      D.Win.open('browser', 'max');
      D.Win.open('code', 'max');
      K.hydrate();
    },
  });
  window.__JA = JA;
})();
