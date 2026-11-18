/*
 * Timeline: NOT A HOTEL — brand design in Figma → web design / responsive → WordPress theme (wp-env, theme.json from
 * the Figma variables, custom post type, templates) → content entry (block editor + ACF) → deploy + DB migration.
 *
 * Keys:  Space = start / pause   R = restart   C = captions on/off   H = hide hint
 * URL :  ?speed=1.3   ?from=3 (start at scene 3)   ?to=3   ?captions=0   ?autoplay=1   ?t=120 (seek, seconds)
 */
(function () {
  'use strict';
  const D = window.Demo;
  const A = window.Apps;
  const S = window.SITE_SNAPSHOT;
  const TF = window.ThemeFiles;
  const WP = window.WP;
  const { H } = window.WPData;
  const WP_URL = 'http://localhost:8888'; // wp-env
  const { $, $$, esc, wait, kw, tween, Ease, Cursor, Clock, Caption, Issue, Keycap, KeyStrip, Notif, Ghost, Win, UI, Ime } = D;
  const { clickUi, hoverUi, moveToEl, typeInto, fieldTarget, frameTextTarget, screenRect, realWait } = D;
  const { Design, Layers, Props, Vars, Plugin, Code, Term, Browser, SiteView, Device, DevTools } = A;
  /** hold for reading a "✓ 修正" caption: keeps its speed-1 length in real time when ?speed is above 1 */
  const readHold = (ms) => wait(ms * Math.max(1, Clock.speed));
  /** pause between actions (PACE < 1 tightens the whole timeline; typing and the ✓ captions are not affected) */
  const PACE = 0.8;
  const hold = (ms) => wait(ms * PACE);
  const fmt = window.Win11.fmt;

  /* ------------------------------------------------ Japanese typing scripts (Microsoft IME)
   *   {r: romaji, segs: [...], predict: [...], yomi: [...]}  romaji -> kana composition (+ prediction hints), Space
   *        converts, further Spaces walk the candidate list ({c: [...], p: index}), Enter
   *   {direct: 'abc'}  half-width (IME off)      {paste: 'text'}  Ctrl+V      {key: 'Enter' | 'Backspace', n}
   */
  const JA = {
    // E1: あなた is committed as 貴方 (the IME's first candidate) — fixed by re-conversion afterwards
    tagline: [
      { r: 'sekaijuuni', segs: ['世界中に'], predict: ['世界中', '世界中に', '世界'], yomi: ['せかいじゅう', 'せかいじゅうに', 'せかい'] },
      { r: 'anatanoiewo', segs: ['貴方の', '家を'], predict: ['あなた', 'あなたの', '貴方'], yomi: ['あなた', 'あなたの', 'あなた'] },
    ],
    btn: [
      { r: 'shiryouwoseikyuusuru', segs: ['資料を', '請求する'], predict: ['資料', '資料請求', '資料を'], yomi: ['しりょう', 'しりょうせいきゅう', 'しりょうを'] },
    ],
    labels: [
      { direct: "'labels'        => [ 'name' => '" },
      { r: 'rainnnappu', segs: ['ラインナップ'], predict: ['ラインナップ', 'ライン'], yomi: ['らいんなっぷ', 'らいん'] },
      { direct: "', 'singular_name' => '" },
      { r: 'hausu', segs: ['ハウス'], predict: ['ハウス', 'ハウスダスト'], yomi: ['はうす', 'はうすだすと'] },
      { direct: "', 'add_new_item' => '" },
      { r: 'hausuwotsuika', segs: ['ハウスを', '追加'], predict: ['ハウス', 'ハウスを'], yomi: ['はうす', 'はうすを'] },
      { direct: "' ]," },
    ],
    concept: [
      { r: 'okuyugawarano', segs: ['奥湯河原の'], predict: ['奥湯河原', '奥湯河原温泉'], yomi: ['おくゆがわら', 'おくゆがわらおんせん'] },
      { r: 'joukeinibotsunyuusuru,', segs: ['情景に', '没入する、'], predict: ['情景', '情景描写'], yomi: ['じょうけい', 'じょうけいびょうしゃ'] },
      { r: 'yunojikann', segs: ['湯の', '時間'], predict: ['湯の', '湯の花'], yomi: ['ゆの', 'ゆのはな'] },
    ],
    price: [
      { direct: '3,452' },
      { r: 'mannenn~', segs: ['万円〜'], predict: ['万円', '万円〜'], yomi: ['まんえん', 'まんえん〜'] },
    ],
    commit: [
      { direct: 'git commit -m "' },
      { r: 'toppupe-jito', segs: ['トップページと'], predict: ['トップページ', 'トップ'], yomi: ['とっぷぺーじ', 'とっぷ'] },
      // ラインナップ was typed before (post-types.php): the IME predicts it now
      { r: 'rainn', tab: 0, predict: ['ラインナップ', 'ライン'], yomi: ['らいんなっぷ', 'らいん'] },
      { r: 'wojissou', segs: ['を', '実装'], predict: ['を', 'を実装'], yomi: ['を', 'をじっそう'] },
      { direct: '"' },
    ],
  };

  /* ------------------------------------------------------------- helpers */
  const LOGO_SVG = S.logoSvg;
  const logo = (w, h) => LOGO_SVG.replace(/width="[^"]*" height="[^"]*"/, `width="${w}" height="${h}"`);
  const B = { logo: { x: 0, y: 0, w: 1440, h: 820 }, color: { x: 0, y: 940, w: 1440, h: 900 }, type: { x: 0, y: 1960, w: 1440, h: 1000 }, cmp: { x: 1560, y: 0, w: 1200, h: 1180 } };
  const PCX = 0, SPX = 1600;
  let pc = null, sp = null, sheet = null;
  let devDoc = null, liveDoc = null;
  const W = { dev: () => $('#devFrame'), live: () => $('#liveFrame') };
  const hide = (el) => el && el.setAttribute('data-demo-hidden', '');
  const show = (el, anim = 'demo-pop') => {
    if (!el) return;
    el.removeAttribute('data-demo-hidden');
    el.removeAttribute('data-demo-invis');
    if (anim && !Clock.ff) { el.classList.remove(anim); void el.offsetWidth; el.classList.add(anim); setTimeout(() => el.classList.remove(anim), 900); }
  };
  const popIn = (el) => { if (!el) return; el.classList.remove('bd-hide'); if (!Clock.ff) { el.classList.remove('pop-in'); void el.offsetWidth; el.classList.add('pop-in'); } };

  async function dragTo(fromEl, toXY, ghostHtml, o = {}) {
    await moveToEl(fromEl);
    UI.hover(fromEl);
    await hold(120);
    Cursor.press();
    Ghost.show(ghostHtml);
    Ghost.move(Cursor.x, Cursor.y);
    await Cursor.moveTo(toXY[0], toXY[1], { ms: o.ms || 900, onMove: (x, y) => Ghost.move(x, y), keepHover: true });
    await hold(140);
    Cursor.release();
    Ghost.hide();
    UI.unhover();
  }

  /** the lineup cards of the dev site (list + SP carousel) */
  const cards = (doc) => [...doc.querySelectorAll('[class*="propertyList"] > a, [class*="propertyCarousel"] [class*="_slide"] > a')];
  const isOnSale = (a) => { const p = a.querySelector('[class*="_price"]'); return p && !p.querySelector('svg, [class*="soldOut"]'); };

  /* ================================================================ boards */
  function logoBoard() {
    const svg = logo(720, 200);
    const k = 80; // clear space = the logo's first square (8 of its 20 units) at 10x
    return `<div class="bd">
      <div class="bd-h">01 — LOGO</div><div class="bd-t">ロゴ</div>
      <div class="bd-d">ロゴタイプは横組み 1 種類。比率・形・間隔は変えずに、背景に合わせて黒または白で使用する。</div>
      <div class="bd-logo bd-hide" id="bdLogo" style="left:200px;top:300px;width:720px;height:200px">${svg}</div>
      <div class="bd-clear bd-hide" id="bdClear" style="left:${200 - k}px;top:${300 - k}px;width:${720 + 2 * k}px;height:${200 + 2 * k}px">
        <i style="left:-2px;top:${k - 2}px;width:${k}px;height:${k}px">x</i><i style="right:-2px;top:${k - 2}px;width:${k}px;height:${k}px">x</i>
        <i style="left:${k + 320}px;top:-2px;width:${k}px;height:${k}px">x</i><i style="left:${k + 320}px;bottom:-2px;width:${k}px;height:${k}px">x</i></div>
      <div class="bd-cap bd-hide" id="bdClearCap" style="left:${200 - k}px;top:${300 + 200 + k + 14}px">アイソレーション：x ＝ ロゴ左端の■（高さの 2/5）以上</div>
      <div class="bd-tile bd-hide" id="bdNeg" style="left:1086px;top:220px;width:290px;height:150px;background:#0b0b0d;color:#fff">${logo(72, 20)}</div>
      <div class="bd-tile bd-hide" id="bdPos" style="left:1086px;top:390px;width:290px;height:150px;background:#f5f5f7;color:#000">${logo(72, 20)}</div>
      <div class="bd-cap bd-hide" id="bdTileCap" style="left:1086px;top:556px">ネガ / ポジ</div>
      <div class="bd-min bd-hide" id="bdMin" style="left:${200 - k}px;top:700px">${logo(72, 20)}<span>最小サイズ：幅 72px（Web ヘッダー）</span></div>
    </div>`;
  }
  function colorBoard() {
    const sw = TF.COLORS.map((c, i) => {
      const col = i % 5, row = Math.floor(i / 5);
      return `<div class="bd-sw bd-hide" data-sw="${c.slug}" style="left:${64 + col * 260}px;top:${220 + row * 324}px"><div class="c" style="background:${c.color}"></div>
        <div class="m"><b>${esc(c.name)}</b><span>${c.color.toUpperCase()}</span><span>color/${c.slug}</span></div></div>`;
    }).join('');
    return `<div class="bd"><div class="bd-h">02 — COLOR</div><div class="bd-t">カラー</div>
      <div class="bd-d">モノトーンを基調に、行動を促す要素（資料請求・リンク）だけに Highlight の青を使う。</div>${sw}</div>`;
  }
  function typeBoard() {
    const body = 'NOT A HOTELは単なる別荘ではありません。保有するハウスはもちろん、全国の拠点を自由に利用できます。';
    return `<div class="bd"><div class="bd-h">03 — TYPOGRAPHY</div><div class="bd-t">タイポグラフィ</div>
      <div class="bd-type bd-hide" data-ty="hl" style="top:200px"><small>Display — Manuka Condensed Bold（ハウス名）</small><div class="s-hl">Onsen Suite</div></div>
      <div class="bd-type bd-hide" data-ty="en" style="top:408px"><small>English — Neue Haas Grotesk Text Medium</small><div class="s-en">NOT A HOTEL</div></div>
      <div class="bd-type bd-hide" data-ty="ja" style="top:548px"><small>Japanese — Hiragino Sans W6 / Meiryo（約物：YakuHanJP）</small><div class="s-ja" id="bdTagline"></div></div>
      <div class="bd-type bd-hide" data-ty="body" style="top:720px"><small>Body — 16px ・ 行間 2.1 ・ 字間 0.04em</small><div class="s-body">${esc(body)}</div></div>
      <div class="bd-rule bd-hide" id="bdRule" style="top:200px"><b>ボイス &amp; トーン（表記ルール）</b>・社名は「NOT A HOTEL」（半角・大文字）<br>・<em>「あなた」「暮らし」はひらがな</em><br>・価格は「○○万円〜」<br>・ハウス名は英字大文字（Manuka Condensed）</div>
    </div>`;
  }
  function sheetBody() {
    const doc = new DOMParser().parseFromString(S.html.pc, 'text/html');
    const bar = doc.querySelector('[class*="heroButtonBar"]');
    const small = doc.querySelector('a[class*="smallPrimaryButton"]');
    const link = doc.querySelector('section[class*="NK4ZyG_wrapper"] a[class*="primaryTextLink"]');
    // the card's three variants, as they appear in the live lineup: 販売中 + NEW / EXCLUSIVE / キャンセル待ち
    const all = [...doc.querySelectorAll('[class*="propertyList"] > a')];
    const pick = [all[0], all.find((a) => a.querySelector('svg[aria-label="EXCLUSIVE"]')), all.find((a) => a.querySelector('[class*="soldOut"]'))].filter(Boolean);
    const listCls = (doc.querySelector('[class*="propertyList"]') || {}).className || '';
    const primary = bar && bar.querySelector('a[class*="ctaPrimaryButton"]');
    if (primary) primary.id = 'shPrimary';
    pick.forEach((c) => c.querySelectorAll('[style]').forEach((e) => e.removeAttribute('style')));
    const labels = ['販売中 ・ NEW', 'EXCLUSIVE', 'キャンセル待ち'];
    return `<div class="sh">
      <div class="sh-h">04 — COMPONENTS</div><div class="sh-t">コンポーネント</div>
      <div class="sh-l" style="top:170px">Button / CTA（写真・暗い背景の上）</div>
      <div class="sh-dark">${bar ? bar.outerHTML : ''}</div>
      <div class="sh-l" style="top:380px">Button / Small ・ Link / Text</div>
      <div class="sh-light">${small ? small.outerHTML : ''}${link ? link.outerHTML : ''}</div>
      <div class="sh-l" style="top:530px">Card / House（販売区分のバリアント）</div>
      <div class="sh-cards">${pick.map((c, i) => `<div class="sh-card"><div class="sh-v">${labels[i]}</div><div class="${listCls}"${i ? '' : ' id="shCardWrap"'}>${c.outerHTML}</div></div>`).join('')}</div>
    </div>`;
  }
  const SHEET_CSS = `
    .sh { position: absolute; inset: 0; background: #fff; font-family: YakuHanJP, "Hiragino Sans", Meiryo, sans-serif; }
    .sh-h { position: absolute; left: 64px; top: 52px; font: 500 15px neue-haas-grotesk-text, Arial, sans-serif; letter-spacing: .08em; color: #8e8e93; }
    .sh-t { position: absolute; left: 64px; top: 80px; font-weight: 600; font-size: 40px; letter-spacing: .02em; color: #0b0b0d; }
    .sh-l { position: absolute; left: 64px; font: 500 14px neue-haas-grotesk-text, Arial, sans-serif; color: #8e8e93; }
    .sh-dark { position: absolute; left: 64px; top: 200px; width: 1072px; height: 150px; border-radius: 12px; background: #0b0b0d url(assets/site/imagedelivery.net/_/public-0afd35f919.webp) center 70% / cover; display: flex; align-items: center; justify-content: center; }
    .sh-dark > div { position: static !important; transform: none !important; margin: 0 !important; width: auto !important; }
    .sh-light { position: absolute; left: 64px; top: 410px; width: 1072px; height: 90px; border-radius: 12px; background: #f5f5f7; display: flex; align-items: center; justify-content: center; gap: 56px; }
    .sh-cards { position: absolute; left: 64px; top: 566px; display: flex; gap: 40px; }
    .sh-card { width: 330px; }
    .sh-card > div:not(.sh-v) { display: block !important; width: 318px !important; }
    .sh-v { font: 600 13px "Segoe UI", sans-serif; color: #9747ff; margin-bottom: 10px; }
    #shPrimary.demo-empty::after { content: ""; }
    .demo-cmp { outline: 1.5px dashed #9747ff; outline-offset: 5px; }
    .demo-cmp-tag { position: absolute; color: #9747ff; font: 600 13px "Segoe UI", sans-serif; white-space: nowrap; }
  `;

  /* ================================================================ scenes */
  const SCENES = [];
  const scene = (name, fn) => SCENES.push({ name, fn });

  /* ---------------------------------------------------------------- 0 intro */
  scene('intro', async () => {
    const it = $('#intro');
    $$('.intro-steps li').forEach((li, i) => { li.style.transitionDelay = 0.5 + i * 0.12 + 's'; });
    it.classList.remove('hide');
    await realWait(60);
    it.classList.add('play');
    await hold(4400);
    it.classList.add('hide');
    await hold(900);
  });

  /* ------------------------------------------------------- 1 Brand design */
  scene('brand', async () => {
    Caption.step(1);
    Caption.set('Figma：ブランドガイドラインを作成（ロゴ・カラー・タイポグラフィ・コンポーネント）');
    await hold(900);
    const LG = Design.frames.logo, bd = LG.body;

    // logo
    await clickUi('.fg-ltabs span[data-ltab="assets"]');
    Design.leftTab('assets');
    await hold(300);
    await dragTo($('.fg-asset[data-logo="pos"]'), Design.toScreen(B.logo.x + 560, B.logo.y + 400),
      `<div class="g" style="background:#fff;display:grid;place-items:center;line-height:0">${logo(86, 24)}</div>`);
    popIn($('#bdLogo', bd));
    Layers.add({ key: 'logo', name: 'Logo / Horizontal', kind: 'instance', depth: 1 }, { after: 'b-logo', child: true });
    Design.select({ frame: LG, el: $('#bdLogo', bd), cmp: true });
    Props.component('Logo / Horizontal', [['カラー', 'variant', 'Black'], ['サイズ', 'variant', 'Large']], { instance: true });
    await hold(1100);
    Caption.set('ロゴ：アイソレーション（周囲の余白）と最小サイズを規定');
    Design.select(null);
    popIn($('#bdClear', bd));
    await hold(500);
    popIn($('#bdClearCap', bd));
    await hold(900);
    popIn($('#bdNeg', bd)); await hold(260); popIn($('#bdPos', bd)); popIn($('#bdTileCap', bd));
    await hold(500);
    popIn($('#bdMin', bd));
    await hold(1600);
    await clickUi('.fg-ltabs span[data-ltab="layers"]');
    Design.leftTab('layers');

    // variables
    Caption.set('ローカル変数：ブランドカラー・書体・レイアウト値を定義（サイトの CSS 変数と同じ値）');
    Props.empty();
    await clickUi('#fgVarsBtn');
    Vars.open();
    await hold(250);
    await Vars.show('color');
    await hold(900);
    await clickUi('.fg-vcoll[data-coll="type"]');
    await Vars.show('type', { gap: 120 });
    await hold(900);
    await clickUi('.fg-vcoll[data-coll="space"]');
    await Vars.show('space', { gap: 120 });
    await hold(1000);
    await clickUi('#fgVarsClose');
    Vars.close();
    await hold(300);

    // color board
    Caption.set('カラー：モノトーン＋Highlight の青（資料請求・リンク）。変数をスウォッチに割り当て');
    await Design.camTo(Design.camFor(B.color.x, B.color.y, B.color.w, B.color.h, { pad: 40 }), 1000);
    for (const c of TF.COLORS) { popIn($(`[data-sw="${c.slug}"]`, Design.frames.color.body)); await hold(170); }
    Layers.add({ key: 'swatches', name: 'Swatches（8）', kind: 'group', depth: 1 }, { after: 'b-color', child: true });
    await hold(1400);

    // typography board
    Caption.set('タイポグラフィ：ハウス名は Manuka Condensed、英字は Neue Haas Grotesk、和文はヒラギノ角ゴ（Windows はメイリオ）');
    const TY = Design.frames.type, tb = TY.body;
    await Design.camTo(Design.camFor(B.type.x, B.type.y, B.type.w, B.type.h, { pad: 40 }), 1000);
    for (const k of ['hl', 'en']) { popIn($(`[data-ty="${k}"]`, tb)); await hold(500); }
    popIn($('#bdRule', tb));
    await hold(900);

    // tagline (IME) — E1
    Caption.set('ブランドメッセージを入力（ローマ字入力 → 変換）');
    popIn($('[data-ty="ja"]', tb));
    await clickUi('.fg-tool[data-tool="text"]');
    Design.setTool('text');
    await Keycap.show(['T'], 600);
    const tag = $('#bdTagline', tb);
    Cursor.kind('text');
    await moveToEl(tag, { ax: 0.02, ay: 0.55 });
    await Cursor.click();
    Layers.add({ key: 'tagline', name: 'テキスト', kind: 'text', depth: 1 }, { after: 'b-type', child: true });
    Layers.select('tagline');
    const tagT = { cls: { comp: 'demo-ime' }, render(text, comp) { tag.innerHTML = esc(text) + comp + '<span class="demo-caret"></span>'; }, anchor() { const c = tag.querySelector('.demo-ime.active') || tag.querySelector('.demo-ime') || tag.querySelector('.demo-caret') || tag; return screenRect(c); } };
    const typed = await typeInto(tagT, JA.tagline, { kps: 11 });
    tag.textContent = typed;
    Design.setTool('move');
    Layers.rename('tagline', typed);
    await hold(700);
    Caption.issue('表記ゆれ', '「あなた」が「貴方」に変換されたまま確定。表記ルールでは「あなた」はひらがな');
    const textRect = (el) => { const rg = document.createRange(); rg.selectNodeContents(el); const r = rg.getBoundingClientRect(); return { left: r.left, top: r.top, width: r.width, height: r.height }; };
    Issue.show(() => textRect(tag), '表記ゆれ：貴方 → あなた（ひらがな）');
    await hold(2600);
    Issue.show($('#bdRule em', tb), 'ボイス & トーン：「あなた」はひらがな', { below: true });
    await hold(2000);
    Issue.hide();
    // re-conversion: double-click the word, 変換 key, pick あなた
    const pre = '世界中に', word = '貴方', post = 'の家を';
    tag.innerHTML = `${pre}<span class="probe-w">${word}</span>${post}`;
    const wr = screenRect($('.probe-w', tag));
    tag.textContent = typed;
    Cursor.kind('text');
    await Cursor.moveTo(wr.left + wr.width * 0.5, wr.top + wr.height * 0.55);
    await Cursor.dblclick();
    tag.innerHTML = `${pre}<span class="seltext">${word}</span>${post}`;
    await hold(500);
    KeyStrip.special('変換');
    const cand = ['貴方', 'あなた', '貴女', '彼方'];
    const conv = (i) => { tag.innerHTML = `${pre}<span class="demo-ime conv active">${cand[i]}</span>${post}`; };
    conv(0);
    if (!Clock.ff) Ime.show('cand', cand, 0, screenRect($('.demo-ime', tag)));
    await kw(560);
    KeyStrip.special('Space');
    conv(1);
    if (!Clock.ff) Ime.show('cand', cand, 1, screenRect($('.demo-ime', tag)));
    await kw(700);
    KeyStrip.special('Enter');
    Ime.hide();
    const fixedTag = pre + cand[1] + post;
    tag.textContent = fixedTag;
    KeyStrip.idleHide();
    Layers.rename('tagline', fixedTag);
    Props.text(tag, fixedTag, { style: 'Japanese / Heading 56' });
    Issue.ok(tag, '修正：世界中にあなたの家を');
    Caption.fixed('再変換（変換キー）で「あなた」に直した。サイトの見出し「世界中にあなたの家を」と同じ表記');
    await readHold(2600);
    Issue.hide();
    popIn($('[data-ty="body"]', tb));
    await hold(900);

    // components
    Caption.set('コンポーネント：ボタンとハウスカード（サイトと同じ寸法・余白・角丸）');
    Props.empty();
    await Design.camTo(Design.camFor(B.cmp.x, B.cmp.y, B.cmp.w, B.cmp.h, { pad: 40 }), 1100);
    sheet.el.style.visibility = 'visible';
    if (!Clock.ff) sheet.el.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 300 });
    Layers.add({ key: 'b-cmp', name: '04 — Components', kind: 'frame', depth: 0 });
    await hold(600);
    const btn = sheet.doc.getElementById('shPrimary');
    const btnLabel = btn.textContent;
    // zoom in on the button bar to type its label
    const b0 = btn.getBoundingClientRect();
    await Design.camTo(Design.camFor(B.cmp.x + b0.left - 300, B.cmp.y + b0.top - 110, b0.width + 600, 280, { pad: 40 }), 900);
    await clickUi(btn, { dbl: true, kind: 'text', after: 80 });
    Design.select({ frame: sheet, el: btn });
    btn.textContent = '';
    await typeInto(frameTextTarget(btn), JA.btn, { kps: 12 });
    btn.textContent = btnLabel;
    await hold(400);
    Caption.set('ボタンをコンポーネント化（Primary / Black alpha / Small の 3 種）');
    await Keycap.show(['Ctrl', 'Alt', 'K'], 800);
    btn.classList.add('demo-cmp');
    Design.select({ frame: sheet, el: btn, cmp: true });
    Layers.add({ key: 'btn', name: 'Button / Primary', kind: 'component', depth: 1 }, { after: 'b-cmp', child: true });
    Props.component('Button', [['Type', 'variant', 'Primary'], ['Label', 'text', '資料を請求する'], ['Size', 'variant', 'Large']], { anim: true });
    await hold(2200);
    // card
    Design.select(null);
    await Design.camTo(Design.camFor(B.cmp.x, B.cmp.y, B.cmp.w, B.cmp.h, { pad: 40 }), 900);
    Caption.set('ハウスカード：プロパティ（ハウス名・エリア・コンセプト・価格・NEW）＝ WordPress のカスタムフィールドに対応させる');
    const card = sheet.doc.querySelector('#shCardWrap > a');
    await clickUi(card, { ax: 0.5, ay: 0.4 });
    card.classList.add('demo-cmp');
    Design.select({ frame: sheet, el: card, cmp: true });
    Layers.add({ key: 'card', name: 'Card / House', kind: 'component', depth: 1 }, { after: 'btn' });
    Props.component('Card / House', [
      ['ハウス名', 'text', 'ONSEN SUITE'], ['エリア', 'text', 'YUGAWARA'], ['コンセプト', 'text', '奥湯河原の情景に没入する、湯の時間'],
      ['価格', 'text', '3,452万円〜'], ['NEW', 'bool', 'true'], ['販売区分', 'variant', '販売中 / EXCLUSIVE / キャンセル待ち'],
    ], { anim: true, note: 'プロパティ名は、WordPress 側の ACF フィールド（place / short_concept / price_label / is_new / sales_type）と 1 対 1 で対応させる。' });
    await hold(4200);
    Design.select(null);
  });

  /* -------------------------------------------------- 2 Web design / responsive */
  scene('web', async () => {
    Caption.step(2);
    Caption.set('Web デザイン：トップページ（PC 1440px）をコンポーネントで組み立てる');
    Props.empty();
    await clickUi('#fgPages .fg-page[data-page="web"]');
    Design.showPage('web');
    const v = Design.view();
    Design.cam = { x: PCX + 720 - v.w / 2 / 0.42, y: -160, z: 0.42 };
    Design.apply();
    await hold(400);
    await clickUi('.fg-tool[data-tool="frame"]');
    Design.setTool('frame');
    await Keycap.show(['F'], 600);
    pc.el.style.visibility = 'visible';
    if (!Clock.ff) pc.el.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 300 });
    Design.setTool('move');
    Layers.add({ key: 'pc', name: 'Home / PC — 1440', kind: 'frame', depth: 0 });
    Design.select({ frame: pc });
    Props.frame(pc);
    await hold(600);
    const parts = [
      ['header#header', 'Header', 'instance'], ['main > [class*="heroWrapper"]', 'Hero / Slides（5）', 'section'],
      ['main > section[class*="NK4ZyG_wrapper"]', 'Lineup — Card / House × 8', 'section'],
      ['main > section[class*="jQXgJa_wrapper"]', 'Features ・ 世界中にあなたの家を', 'section'],
      ['main > [class*="ctaSectionWrapper"]', 'Catalog CTA', 'section'], ['main > [class*="D0vJ_q_wrapper"]', 'News', 'section'],
      ['main > [class*="carouselSectionWrapper"]', 'Stories ・ Movie gallery', 'section'], ['footer', 'Footer', 'instance'],
    ];
    Design.select(null);
    const z = 0.2;
    for (const [sel, nm, kind] of parts) {
      const el = pc.doc.querySelector(sel);
      show(el);
      Design.fitHeight(pc);
      Layers.add({ key: sel, name: nm, kind, depth: 1 }, { after: Layers.list[Layers.list.length - 1].key });
      const r = el.getBoundingClientRect();
      const vv = Design.view();
      await Design.camTo({ x: PCX + 720 - vv.w / 2 / z, y: Math.max(-80, pc.y + r.top + r.height / 2 - vv.h / 2 / z), z }, 560);
      await hold(sel.includes('NK4ZyG') ? 900 : 300);
    }
    Design.fitHeight(pc);
    await hold(500);

    // SP
    Caption.set('SP（375px）：ブレイクポイント 768px。ラインナップは横スクロール、ナビはメニューボタンに');
    await Design.camTo({ x: PCX - 80, y: -200, z: Math.min(0.24, (v.w - 80) / (SPX + 375 + 600)) }, 900);
    await clickUi(pc.label);
    Design.select({ frame: pc });
    Props.frame(pc);
    await Keycap.show(['Ctrl', 'D'], 800);
    sp.el.style.visibility = 'visible';
    if (!Clock.ff) sp.el.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 300 });
    Layers.add({ key: 'sp', name: 'Home / SP — 375', kind: 'frame', depth: 0 }, { first: true });
    Layers.select('sp');
    Design.select({ frame: sp });
    Props.frame(sp);
    await hold(500);
    await Design.camTo(Design.camFor(SPX - 40, -60, 900, 1800, { pad: 30 }), 1100);
    const lu = sp.doc.querySelector('[class*="propertyCarousel"]') || sp.doc.querySelector('section[class*="NK4ZyG_wrapper"]');
    const lr = lu.getBoundingClientRect();
    Design.note('web', SPX + 375 + 50, sp.y + lr.top - 40, '<b>≤ 768px</b>ラインナップ：横スクロール<br>（カード幅 250px・間隔 15px）<br>ヘッダー：資料請求＋メニュー', { w: 400 });
    await Design.camTo(Design.camFor(SPX - 40, sp.y + lr.top - 500, 900, 1500, { pad: 30 }), 1200);
    await hold(2600);
    Design.select(null);

    // Dev Mode
    Caption.set('Dev Mode：実装に渡す値（サイズ・余白・変数・CSS）を確認');
    const cta = pc.doc.querySelector('[class*="heroButtonBar"] a[class*="ctaPrimaryButton"]');
    const cr = cta.getBoundingClientRect();
    await Design.camTo(Design.camFor(PCX + cr.left - 420, pc.y + cr.top - 260, cr.width + 840, 560, { pad: 40 }), 1000);
    await clickUi('#fgDevToggle', { kind: 'hand' });
    $('#fgDevToggle').classList.add('on');
    $('#win-design').classList.add('devmode');
    await hold(300);
    await clickUi(cta);
    Design.select({ frame: pc, el: cta });
    Props.inspect(cta, 'Button / Primary');
    await hold(3200);

    // variables -> JSON
    Caption.set('変数を JSON（デザイントークン）で書き出す → WordPress の theme.json に変換して使う');
    await clickUi('#fgRtabs span:nth-child(2)');
    Plugin.show();
    await hold(1800);
    await clickUi('#fgPluginCopy', { kind: 'hand' });
    $('#fgPluginCopy').classList.add('done');
    $('#fgPluginCopy').textContent = 'コピーしました';
    await hold(1400);
    Plugin.hide();
    Design.select(null);
  });

  /* -------------------------------------------------- 3 WordPress theme */
  scene('theme', async () => {
    Caption.step(3);
    Caption.set('WordPress：ローカル環境（wp-env / Docker）を起動');
    await Win.switchTo('code', { state: 'max' });
    await Code.openFile('.wp-env.json', { top: 0 });
    await hold(1400);
    await Keycap.show(['Ctrl', '@'], 700);
    await Code.panel(true);
    Term.render('<span class="caret"></span>');
    await hold(300);
    await Term.run('npx wp-env start', [
      async () => Term.spin("Starting 'WordPress' environment…", 2200, '<span class="tdim">ℹ Starting \'WordPress\' environment.</span>'),
      '', 'WordPress development site started at <span class="tlink">http://localhost:8888</span>',
      'WordPress test site started at <span class="tlink">http://localhost:8889</span>',
      'MySQL is listening on port 52135', 'MySQL for automated testing is listening on port 52136', '',
      '<span class="tg">✔</span> Done! <span class="tdim">(in 41s 307ms)</span>',
    ], { kps: 15, gap: 80 });
    await hold(800);

    // tokens -> theme.json
    Caption.set('Figma から書き出したデザイントークンを theme.json に変換（配色・書体・余白）');
    await Code.openFile('tokens/figma-variables.json', { top: 0 });
    await Code.clickAt(0, 1);
    await Keycap.show(['Ctrl', 'A'], 500);
    Code.selectAll();
    await hold(250);
    await Keycap.show(['Ctrl', 'V'], 600);
    Code.clearSelectAll();
    Code.setText('tokens/figma-variables.json', TF.TOKENS_JSON);
    const tl = Code.files['tokens/figma-variables.json'].lines;
    Code.files['tokens/figma-variables.json'].dirty = true;
    Code.renderTabs();
    Code.setCaret(tl.length - 1, 1);
    await hold(500);
    await Code.save();
    await Code.scrollTo(0, 500);
    await Term.run('npm run tokens', [
      '', '<span class="tdim">&gt; notahotel-wp@ tokens</span>', '<span class="tdim">&gt; node scripts/tokens-to-theme-json.mjs</span>', '', 300,
      `<span class="tg">✔</span> wp-content/themes/notahotel/theme.json を書き出しました <span class="tdim">（color ${TF.COLORS.length} / fontFamilies ${TF.FONTS.length} / fontSizes 4 / spacingSizes 3）</span>`,
    ], { kps: 15 });
    Code.setText('wp-content/themes/notahotel/theme.json', TF.files['wp-content/themes/notahotel/theme.json']);
    Code.mark('wp-content/themes/notahotel/theme.json', 'M');
    await hold(400);
    await Code.openFile('wp-content/themes/notahotel/theme.json', { top: 0 });
    await Code.scrollTo(6, 1200);
    await hold(1600);
    await Code.panel(false);

    // snap + activate the theme
    Caption.set('テーマ「NOT A HOTEL」を有効化');
    await Keycap.show(['Win', '←'], 700);
    Win.state('code', 'snap-left');
    await realWait(450);
    Code.render();
    await Win.switchTo('browser', { state: 'snap-right' });
    Browser.addTab({ id: 'wp', title: WP.title('themes-before'), url: `${WP_URL}/wp-admin/themes.php`, page: 'wp', fav: 'wp' });
    await WP.show('themes-before');
    await hold(900);
    // the real theme card: hovering it shows WordPress' own 有効化 / ライブプレビュー buttons
    await hoverUi(WP.el('.theme[data-slug="notahotel"] .theme-screenshot'), { hold: 600 });
    await clickUi(WP.el('.theme[data-slug="notahotel"] .theme-actions .activate'), { kind: 'hand' });
    Browser.loading('wp', true);
    await hold(500);
    await WP.show('themes-activated');
    Browser.loading('wp', false);
    await hold(1500);

    // custom post type (IME in code)
    Caption.set('カスタム投稿タイプ「ハウス」を登録（管理画面のメニュー名「ラインナップ」）');
    await Code.openFile('wp-content/themes/notahotel/inc/post-types.php', { top: 0 });
    const pt = Code.find("register_post_type( 'house', [");
    await Code.newLineAfter(pt.line);
    await Code.type([{ key: 'Enter' }]);
    await Code.type(JA.labels, { kps: 16 });
    await hold(300);
    await Code.save();
    if (Code.text('wp-content/themes/notahotel/inc/post-types.php') !== TF.files['wp-content/themes/notahotel/inc/post-types.php']) {
      console.warn('[demo] post-types.php differs after typing; restoring');
      Code.setText('wp-content/themes/notahotel/inc/post-types.php', TF.files['wp-content/themes/notahotel/inc/post-types.php']);
    }
    await clickUi(Browser.tabEl('wp'));
    await Browser.reload({ key: 'F5' });
    await WP.show('themes-cpt');
    // the admin menu is folded at this window width: the post type's menu shows its name on hover
    await hoverUi(WP.el('#menu-posts-house > a'), { hold: 150 });
    WP.el('#menu-posts-house').classList.add('opensub'); // what WordPress' menu script does on hover: the flyout opens
    await hold(350);
    Issue.ok(() => { const s = WP.el('#menu-posts-house .wp-submenu'); return s && D.screenRect(s); }, 'メニュー名「ラインナップ」（house）');
    await hold(2000);
    Issue.hide();
    WP.el('#menu-posts-house').classList.remove('opensub');
    D.UI.unhover();

    // front-page.php: WP_Query — E2 (missing semicolon)
    Caption.set('トップページのテンプレート：ハウスを WP_Query で取得し、カードを並べる');
    await Code.openFile('wp-content/themes/notahotel/front-page.php', { top: 0 });
    const blank = Code.find('get_header();').line + 1;
    await Code.newLineAfter(blank, { clickCol: 0 });
    await Code.type([{ key: 'Enter' }, { direct: TF.QUERY[0].replace(/;$/, '') }, { key: 'Enter' }, { direct: TF.QUERY[1] }], { kps: 22 });
    const qLine = blank + 1;
    await Code.save();
    await hold(300);
    if (!Browser.tab('dev')) Browser.addTab({ id: 'dev', title: 'localhost:8888', url: 'http://localhost:8888/', page: 'site', fav: 'site' }, { anim: true, activate: false });
    await Browser.clickTab('dev');
    Browser.loading('dev', true);
    await hold(500);
    Browser.loading('dev', false);
    Browser.setTitle('dev', WP.title('php-error'));
    await WP.phpError(true); // WordPress' own page for the parse error (line qLine + 2, as in the editor)
    Code.sq = [{ line: qLine + 1, from: 0, to: 7 }];
    Code.render();
    $('#vsProblems').innerHTML = `${VSC.ci('error')} 1 ${VSC.ci('warning')} 0`;
    await hold(600);
    Caption.issue('エラー', 'Parse error：$houses の行末の「;」がなく、次の行の $slides で構文エラー（WP_DEBUG で表示）');
    Issue.show(() => { const d = WP.errorDoc(); return d && D.screenRect(d.body); }, 'エラー：PHP の構文エラー（重大なエラー）');
    await hold(3400);
    Issue.show(() => {
      const e = Code.lineEl(qLine); if (!e) return null;
      const r = screenRect(e.querySelector('.lc'));
      return { left: r.left, top: r.top, width: r.width, height: r.height };
    }, '行末に「;」がない', { below: true });
    await hold(1400);
    // fix: End of the line, type ;  (the view scrolls right to the end of the long line)
    const ql = Code.files[Code.active].lines[qLine];
    await Code.clickAt(qLine, ql.length);
    await Code.type([{ direct: ';' }], { kps: 5 });
    Code.sq = [];
    Code.render();
    await Code.save();
    $('#vsProblems').innerHTML = `${VSC.ci('error')} 0 ${VSC.ci('warning')} 0`;
    Issue.hide();
    await clickUi(W.dev(), { ax: 0.5, ay: 0.3 });
    await Keycap.show(['F5'], 600);
    WP.phpError(false);
    Browser.loading('dev', true);
    devDoc = await SiteView.load(W.dev(), { view: 'pc', before: (d) => cards(d).forEach(hide) });
    Browser.loading('dev', false);
    Browser.setTitle('dev', S.title);
    Code.lineCls[qLine] = 'good';
    Code.render();
    Issue.ok(() => { const e = Code.lineEl(qLine); const r = e && screenRect(e.querySelector('.lc')); return r && { left: r.left, top: r.top, width: r.width, height: r.height }; }, '修正：行末に ; を追加', { below: true });
    Caption.fixed('「;」を追加して保存 → 再読み込みでトップページが表示された（ハウスは未登録なので一覧は空）');
    await readHold(2200);
    await SiteView.scroll(W.dev(), SiteView.yOf(W.dev(), devDoc.querySelector('section[class*="NK4ZyG_wrapper"]'), 80), 1400);
    await readHold(800);
    Issue.hide();
    delete Code.lineCls[qLine];
    Code.render();

    // the card template part
    Caption.set('カードのテンプレート：Figma のカードと同じマークアップに ACF のフィールドを差し込む');
    await Code.openFile('wp-content/themes/notahotel/template-parts/house-card.php', { top: 0 });
    const doc0 = Code.find(' */').line;
    await Code.newLineAfter(doc0, { clickCol: 3 });
    await Code.type([{ key: 'Enter' }, { direct: "$type  = get_field( 'sales_type' );" }, { key: 'Enter' }, { direct: TF.PRICE_TYPO }], { kps: 18 });
    await Code.save();
    await hold(400);
    const hl = Code.find('<a href=').line;
    await Code.scrollTo(Math.max(0, hl - 3), 700);
    const longest = Code.files[Code.active].lines[hl];
    Code.setCaret(hl, 0);
    await hold(600);
    // read the long line to its end (horizontal scroll), then back
    const m = Code.measureCol(hl, longest.length);
    if (m.x > m.vw) await Code.scrollX(m.x - m.vw + 40, 1600);
    await hold(1500);
    await Code.scrollX(0, 700);
    await hold(800);
  });

  /* -------------------------------------------------- 4 content */
  scene('content', async () => {
    Caption.step(4);
    Caption.set('既存のハウス 7 件を WP-CLI で取り込み（旧サイトから書き出した WXR ファイル）');
    await Code.panel(true);
    Term.render('<span class="caret"></span>');
    const old = H.slice(1);
    await Term.run('npx wp-env run cli wp import wp-content/import/houses.xml --authors=skip', [
      '<span class="tdim">ℹ Starting \'wp import wp-content/import/houses.xml --authors=skip\' on the cli container.</span>', 200,
      'Starting the import process...',
      ...old.slice(0, 3).map((h, i) => `Processing post #${21 + i} ("${esc(h.name)}") (post_type: house)`),
      '<span class="tdim">…</span>',
      `Processing post #${21 + old.length - 1} ("${esc(old[old.length - 1].name)}") (post_type: house)`,
      "Success: Finished importing from 'wp-content/import/houses.xml' file.",
      '<span class="tg">✔</span> Ran `wp import …` in \'cli\'. <span class="tdim">(in 4s 812ms)</span>',
    ], { kps: 17, gap: 110 });
    await hold(500);
    await Browser.clickTab('wp');
    await clickUi(WP.el('#menu-posts-house > a'));
    Browser.loading('wp', true);
    await WP.show('list-960');
    Browser.setUrl('wp', WP.url('list-960'));
    Browser.setTitle('wp', WP.title('list-960'));
    Browser.loading('wp', false);
    await hold(2000);

    // new house: the post type has no content editor, so WordPress opens the classic edit screen (title + meta boxes)
    Caption.set('新しいハウス「ONSEN SUITE」を入稿（タイトルと ACF のフィールド）');
    await Keycap.show(['Win', '↑'], 700);
    Win.open('browser', 'max');
    await WP.show('list-1920');
    await realWait(450);
    await clickUi(WP.el('.page-title-action'), { kind: 'hand' });
    Browser.loading('wp', true);
    await WP.show('editor-empty');
    Browser.setUrl('wp', WP.url('editor-empty'));
    Browser.setTitle('wp', WP.title('editor-empty'));
    await hold(400);
    Browser.loading('wp', false);
    const NEWH = H[0];
    // the title box has the focus when the screen opens (as in WordPress)
    WP.focus(WP.field('title'), true);
    await hold(500);
    const typeField = async (k, script, o = {}) => {
      const el = WP.field(k);
      await clickUi(el, { kind: 'text', ax: o.ax || 0.15, after: 80 });
      WP.focus(el, true);
      // the title box's 「タイトルを追加」 is a label over the input: WordPress hides it as soon as a key is pressed
      if (k === 'title') { const lab = WP.el('#title-prompt-text'); if (lab) lab.classList.add('screen-reader-text'); }
      const text = await typeInto(D.frameTextTarget(el), script, { kps: o.kps || 13 });
      el.textContent = text;
      WP.focus(el, false);
      await hold(200);
      return text;
    };
    await typeField('title', [{ direct: NEWH.name }], { kps: 12, ax: 0.05 });
    await hold(300);
    await typeField('place', [{ direct: NEWH.place }]);
    const concept = await typeField('short_concept', JA.concept, { kps: 12 });
    if (concept !== NEWH.concept) console.warn('[demo] concept typed differs', concept, NEWH.concept);
    const price = await typeField('price_label', JA.price, { kps: 11 });
    if (price !== NEWH.price) console.warn('[demo] price typed differs', price, NEWH.price);
    const cb = WP.el('#acf-field_house_new');
    await clickUi(cb, { kind: 'hand' });
    cb.checked = true;
    await hold(300);
    await typeField('detail_path', [{ direct: NEWH.href }], { kps: 16 });
    // featured image (the media library: the card images, uploaded with their own file names)
    Caption.set('アイキャッチ画像を設定（メディアライブラリから）');
    await clickUi(WP.el('#set-post-thumbnail'), { kind: 'hand' });
    await WP.show('editor-media');
    await hold(900);
    await clickUi(WP.el(`.media-modal .attachment[data-id="${window.WP_SNAPSHOT.ids.media[NEWH.file]}"]`));
    await WP.show('editor-media-selected');
    await hold(1100);
    await clickUi(WP.el('.media-modal .media-button-select'), { kind: 'hand' });
    await WP.show('editor-thumb');
    await hold(900);
    // publish: the screen reloads as the edit screen of the published post, with WordPress' notice
    await clickUi(WP.el('#publish'), { kind: 'hand' });
    Browser.loading('wp', true);
    await hold(600);
    await WP.show('editor-published');
    Browser.setUrl('wp', WP.url('editor-published'));
    Browser.setTitle('wp', WP.title('editor-published'));
    Browser.loading('wp', false);
    WP.published();
    await hold(1800);

    // front page: E3 (prices missing)
    Caption.set('トップページで表示を確認');
    await Browser.clickTab('dev');
    await Keycap.show(['F5'], 600);
    Browser.loading('dev', true);
    const blanked = [];
    cards(devDoc).forEach((a) => {
      show(a, null);
      if (isOnSale(a)) { const p = a.querySelector('[class*="_price"]'); blanked.push([p, p.innerHTML]); p.innerHTML = ''; }
    });
    await hold(400);
    Browser.loading('dev', false);
    W.dev().contentWindow.scrollTo(0, 0);
    await SiteView.scroll(W.dev(), SiteView.yOf(W.dev(), devDoc.querySelector('section[class*="NK4ZyG_wrapper"]'), 20), 1500);
    await hold(700);
    const firstCard = devDoc.querySelector('[class*="propertyList"] > a');
    const priceBox = () => { const d = screenRect(firstCard.querySelector('[class*="cardInner"]')); return { left: d.left, top: d.top, width: d.width, height: d.height + 26 }; };
    Caption.issue('表示されない', 'カードの価格（3,452万円〜 など）が 1 件も表示されていない');
    Issue.show(priceBox, '価格が表示されない');
    await hold(3200);
    Issue.hide();
    // diagnose: the field name in ACF
    await Browser.clickTab('wp');
    Browser.loading('wp', true);
    await WP.show('acf-group-1920');
    Browser.setUrl('wp', WP.url('acf-group-1920'));
    Browser.setTitle('wp', WP.title('acf-group-1920'));
    await hold(400);
    Browser.loading('wp', false);
    await hold(500);
    const acfRow = () => WP.el('.acf-field-object[data-key="field_house_price"] .handle, .acf-field-object[data-key="field_house_price"]');
    await hoverUi(WP.el('.acf-field-object[data-key="field_house_price"] .li-field-name') || acfRow(), { hold: 300 });
    Issue.show(() => { const r = acfRow(); return r && D.screenRect(r); }, 'フィールド名：price_label');
    await hold(2200);
    // the template
    await Win.switchTo('code', { state: 'snap-left' });
    Win.state('browser', 'snap-right');
    D.UI.unhover();
    await WP.show('acf-group');
    await realWait(450);
    await Code.panel(false);
    Code.show('wp-content/themes/notahotel/template-parts/house-card.php', { top: 0 });
    const pl = Code.find("get_field( 'price_lable' )");
    const pcol = Code.files[Code.active].lines[pl.line].indexOf('price_lable');
    Code.sq = [{ line: pl.line, from: pcol, to: pcol + 'price_lable'.length }];
    Code.render();
    Issue.show(() => { const q = $('#vsLines .sq-err'); return q ? screenRect(q) : null; }, 'テンプレートは price_lable（綴り間違い）', { below: true });
    Caption.issue('表示されない', 'テンプレートのフィールド名が price_lable（label の綴り間違い）で、値を取得できていなかった');
    await hold(3000);
    await Code.dragSelect(pl.line, pcol, pcol + 'price_lable'.length);
    Issue.hide();
    await Code.type([{ direct: 'price_label' }], { kps: 12 });
    Code.sq = [];
    Code.render();
    await Code.save();
    if (Code.text(Code.active) !== TF.files[Code.active]) { console.warn('[demo] house-card.php differs after the fix; restoring'); Code.setText(Code.active, TF.files[Code.active]); }
    await Browser.clickTab('dev');
    Browser.activate('dev');
    await Keycap.show(['F5'], 600);
    Browser.loading('dev', true);
    await hold(350);
    blanked.forEach(([p, h]) => { p.innerHTML = h; });
    Browser.loading('dev', false);
    await SiteView.scroll(W.dev(), SiteView.yOf(W.dev(), devDoc.querySelector('section[class*="NK4ZyG_wrapper"]'), 20), 400);
    Issue.ok(() => { const d = screenRect(devDoc.querySelector('[class*="propertyList"] > a [class*="cardInner"]')); return { left: d.left, top: d.top, width: d.width, height: d.height }; }, '価格：3,452万円〜');
    Caption.fixed('price_label に直して保存 → 再読み込みで 8 件すべての価格・EXCLUSIVE・キャンセル待ちが表示された');
    await readHold(2800);
    Issue.hide();

    // responsive check (device mode)
    Caption.set('レスポンシブ確認：DevTools のデバイスモード（375px）');
    await Keycap.show(['F12'], 600);
    DevTools.clear();
    await DevTools.open(true);
    await Keycap.show(['Ctrl', 'Shift', 'M'], 700);
    $('#dtDevice').classList.add('on');
    await Device.set(true, { w: 375, h: 812 });
    Browser.loading('dev', true);
    devDoc = await SiteView.load(W.dev(), { view: 'sp' });
    Browser.loading('dev', false);
    Device.fit();
    await hold(1600);
    const spl = devDoc.querySelector('section[class*="NK4ZyG_wrapper"]');
    await SiteView.scroll(W.dev(), SiteView.yOf(W.dev(), spl, 60), 1600);
    await hold(1200);
    const car = devDoc.querySelector('[class*="propertyCarousel"] [class*="_container"]');
    if (car) {
      // swiping the carousel: the cards scroll in as they come into view (the site's scroll-in effect)
      const slides = [...car.querySelectorAll('[class*="_slide"] > a > section')];
      const vw = W.dev().contentWindow.innerWidth;
      const reveal = () => slides.forEach((sl) => { if (sl.getBoundingClientRect().left < vw - 20 && sl.style.opacity !== '1') { sl.style.transition = 'opacity 0.8s ease-in-out, transform 0.8s ease-in-out'; sl.style.opacity = '1'; sl.style.transform = 'translateY(0px)'; } });
      await tween(1400, (e) => { car.style.transform = `translate3d(${-e * 530}px, 0, 0)`; reveal(); }, Ease.inOut);
      await hold(900);
      await tween(800, (e) => { car.style.transform = `translate3d(${-(1 - e) * 530}px, 0, 0)`; }, Ease.inOut);
      car.style.transform = 'translate3d(0px, 0px, 0px)';
    }
    await hold(800);
    await Keycap.show(['Ctrl', 'Shift', 'M'], 600);
    $('#dtDevice').classList.remove('on');
    await Device.set(false);
    await DevTools.open(false);
    devDoc = await SiteView.load(W.dev(), { view: 'pc' });
    await hold(600);
  });

  /* -------------------------------------------------- 5 deploy + migration */
  scene('publish', async () => {
    Caption.step(5);
    Caption.set('テーマを本番へ：main に push → GitHub Actions がテーマを本番サーバーに同期');
    await Win.switchTo('code', { state: 'max' });
    await Code.panel(true);
    Term.lines.push('');
    Term.render('<span class="caret"></span>');
    await hold(300);
    await Term.run('git add -A', [], { kps: 14 });
    await Term.run(JA.commit, [
      '[main 7c41d2e] トップページとラインナップを実装', ' 14 files changed, 486 insertions(+), 9 deletions(-)',
    ], { kps: 14 });
    await Term.run('git push origin main', [
      'Enumerating objects: 38, done.', 'Writing objects: 100% (24/24), 9.42 KiB | 3.14 MiB/s, done.', 300,
      'To github.com:<span class="pii">xxxxxxxx</span>/notahotel-wp.git', '   3e9b0a4..7c41d2e  main -&gt; main',
    ], { kps: 15, gap: 140 });
    Code.clearStatus();
    await Term.run('gh run watch', [
      async () => Term.spin('Deploy theme to production · main', 2600, '<span class="tg">✓</span> main <b>Deploy theme to production</b> <span class="tdim">· 11873220415</span>'),
      '<span class="tdim">Triggered via push about 1 minute ago</span>', '',
      '<span class="tg">✓</span> deploy in 36s', '  <span class="tg">✓</span> Checkout', '  <span class="tg">✓</span> Sync theme (rsync)', '  <span class="tg">✓</span> Flush cache', '',
      "<span class=\"tg\">✓</span> Run Deploy theme to production (11873220415) completed with 'success'",
    ], { kps: 15, gap: 110 });
    await hold(900);

    // DB
    Caption.set('データベースを本番へ移行（WP-CLI で書き出し → 本番サーバーで取り込み）');
    Term.lines = [];
    Term.render('<span class="caret"></span>');
    await Term.run('npx wp-env run cli wp db export wp-content/import/notahotel.sql', [
      "Success: Exported to 'wp-content/import/notahotel.sql'.",
    ], { kps: 18 });
    await Term.run('scp import/notahotel.sql notahotel-prod:~/', ['notahotel.sql                     100% 8412KB   9.8MB/s   00:00'], { kps: 18 });
    await Term.run('ssh notahotel-prod "wp db import notahotel.sql --path=/var/www/notahotel"', [
      "Success: Imported from 'notahotel.sql'.",
    ], { kps: 18 });
    await hold(800);

    // production: E4 (URLs still point at the local environment)
    Caption.set('本番（notahotel.com）を確認');
    await Win.switchTo('browser', { state: 'max' });
    await Browser.newTab('live');
    await Browser.typeUrl('notahotel.com');
    Browser.tab('live').fav = 'site';
    Browser.setPage('live', 'live');
    Browser.setUrl('live', 'https://notahotel.com/');
    Browser.loading('live', true);
    liveDoc = await SiteView.load(W.live(), { view: 'pc', before: (d) => {
      d.querySelectorAll('[class*="propertyList"] img, [class*="propertyCarousel"] img, #hero-pagination ~ * img, [class*="heroWrapper"] picture img').forEach((i) => { i.setAttribute('data-demo-src', i.getAttribute('src')); i.setAttribute('src', 'missing/' + i.getAttribute('src').split('/').pop()); });
      d.querySelectorAll('video').forEach((v) => { v.setAttribute('data-demo-broken', ''); v.querySelectorAll('source').forEach((s) => s.setAttribute('src', 'missing/video.mp4')); v.removeAttribute('src'); v.removeAttribute('poster'); try { v.load(); } catch (e) {} });
      d.querySelectorAll('#hero-pagination button').forEach((b) => { b.setAttribute('data-demo-style', b.getAttribute('style') || ''); b.style.setProperty('--imageUrl', 'none'); });
    } });
    Browser.loading('live', false);
    Browser.setTitle('live', S.title);
    await hold(1600);
    await SiteView.scroll(W.live(), SiteView.yOf(W.live(), liveDoc.querySelector('section[class*="NK4ZyG_wrapper"]'), 20), 1400);
    await hold(500);
    Caption.issue('表示崩れ', '本番でハウスの写真とヒーロー動画が表示されない');
    Issue.show(() => { const g = liveDoc.querySelector('[class*="propertyList"]'); const r = screenRect(g); return { left: r.left, top: Math.max(r.top, 90), width: r.width, height: Math.min(r.height, innerHeight - 260) }; }, '表示崩れ：画像が読み込まれない');
    await hold(2600);
    await Keycap.show(['F12'], 600);
    DevTools.clear();
    await DevTools.open(true);
    const up = (f) => `http://localhost:8888/wp-content/uploads/2026/10/${f}`;
    DevTools.log('warn', `Mixed Content: The page at 'https://notahotel.com/' was loaded over HTTPS, but requested an insecure element '${up(H[0].file)}'. This request was automatically upgraded to HTTPS.`, '(索引):1');
    for (const h of H.slice(0, 5)) { DevTools.log('err', `GET ${up(h.file).replace('http:', 'https:')} net::ERR_CONNECTION_REFUSED`, '(索引):1'); await hold(140); }
    DevTools.log('err', 'GET https://localhost:8888/wp-content/uploads/2026/10/yugawara-hero-pc-autumn.mp4 net::ERR_CONNECTION_REFUSED', '(索引):1');
    Issue.show($('#dtCon'), 'URL が http://localhost:8888 のまま');
    Caption.issue('表示崩れ', 'DB 内の画像・動画の URL がローカル環境（http://localhost:8888）のまま本番に入っていた');
    await hold(3400);
    Issue.hide();

    // fix: search-replace on the server
    await Win.switchTo('code', { state: 'max' });
    await Term.run("ssh notahotel-prod \"wp search-replace 'http://localhost:8888' 'https://notahotel.com' --all-tables --path=/var/www/notahotel\"", [
      '+------------------+-----------------------+--------------+------+', '| Table            | Column                | Replacements | Type |', '+------------------+-----------------------+--------------+------+',
      '| wp_options       | option_value          | 2            | PHP  |', '| wp_postmeta      | meta_value            | 168          | SQL  |', '| wp_posts         | guid                  | 74           | SQL  |', '| wp_posts         | post_content          | 12           | SQL  |',
      '+------------------+-----------------------+--------------+------+', '<span class="tg">Success:</span> Made 256 replacements.',
    ], { kps: 20, gap: 70 });
    await Term.run('ssh notahotel-prod "wp cache flush --path=/var/www/notahotel"', ['<span class="tg">Success:</span> The cache was flushed.'],
      { kps: 18 });
    await hold(700);
    await Win.switchTo('browser', { state: 'max' });
    await Keycap.show(['F5'], 600);
    Browser.loading('live', true);
    DevTools.clear();
    liveDoc = await SiteView.load(W.live(), { view: 'pc' });
    Browser.loading('live', false);
    await SiteView.scroll(W.live(), SiteView.yOf(W.live(), liveDoc.querySelector('section[class*="NK4ZyG_wrapper"]'), 20), 10);
    Issue.ok(() => { const g = liveDoc.querySelector('[class*="propertyList"]'); const r = screenRect(g); return { left: r.left, top: Math.max(r.top, 90), width: r.width, height: Math.min(r.height, innerHeight - 560) }; }, 'コンソールのエラー 0 件・画像を表示');
    Caption.fixed('wp search-replace で URL を本番ドメインに置換 → 画像と動画が表示され、コンソールのエラーも 0 件に');
    await readHold(2800);
    Issue.hide();
    await DevTools.open(false);

    // the live site
    Caption.allDone();
    Caption.set('公開サイト：notahotel.com');
    const live = W.live();
    await SiteView.scroll(live, 0, 1400);
    Cursor.kind('arrow');
    await Cursor.moveTo(innerWidth * 0.62, innerHeight * 0.6, { ms: 900 });
    await hold(3600);
    const y = (sel, off = 60) => SiteView.yOf(live, liveDoc.querySelector(sel), off);
    await SiteView.scroll(live, y('section[class*="NK4ZyG_wrapper"]', 0), 2200);
    await hold(600);
    await hoverUi(liveDoc.querySelector('[class*="propertyList"] > a:nth-child(2)'), { kind: 'hand', hold: 1300 });
    Cursor.kind('arrow');
    await SiteView.scroll(live, y('[class*="E4DnZW_wrapper"]', 0), 2200);
    await hold(1200);
    await SiteView.scroll(live, y('[class*="jQXgJa_titleWrapper"]', 0), 2000);
    await hold(2200);
    await SiteView.scroll(live, y('[class*="jQXgJa_inner"]', 120), 1600);
    await hold(1400);
    await SiteView.scroll(live, y('[class*="ctaSectionWrapper"]', 60), 1800);
    await hold(900);
    await SiteView.scroll(live, y('[class*="D0vJ_q_wrapper"]', 60), 1800);
    await hold(1000);
    await SiteView.scroll(live, y('footer', 200), 2400);
    await hold(1200);
    await SiteView.scroll(live, 0, 2800, Ease.inOut);
    await hold(1800);

    // outro
    Caption.hide();
    const it = $('#intro');
    $$('.intro-steps li').forEach((li) => { li.classList.add('ok'); li.style.transitionDelay = '0s'; li.querySelector('b').textContent = '✓'; });
    it.classList.remove('play');
    it.classList.remove('hide');
    await realWait(80);
    it.classList.add('play');
    await hold(5000);
  });

  /* ============================================================== prepare */
  async function prepare(fast) {
    D.hydrateIcons();
    D.Cursor.init();
    KeyStrip.mode(true);
    $('#introLogo').innerHTML = logo(360, 100);

    Design.init();
    Code.init();
    // files as they are before the demo types into them
    const F = Code.files, set = (p, t) => { F[p].lines = t.split('\n'); };
    set('tokens/figma-variables.json', '{}');
    set('wp-content/themes/notahotel/theme.json', TF.THEME_JSON_STUB);
    set('wp-content/themes/notahotel/inc/post-types.php', TF.files['wp-content/themes/notahotel/inc/post-types.php'].replace(TF.LABELS_LINE + '\n', ''));
    set('wp-content/themes/notahotel/front-page.php', TF.FRONT_BEFORE);
    set('wp-content/themes/notahotel/template-parts/house-card.php', TF.files['wp-content/themes/notahotel/template-parts/house-card.php'].replace("$type  = get_field( 'sales_type' );\n" + TF.PRICE_TYPO + '\n', ''));
    TF.files['wp-content/themes/notahotel/template-parts/house-card.php'] = TF.files['wp-content/themes/notahotel/template-parts/house-card.php'].replace(TF.PRICE_TYPO, TF.PRICE_OK);

    // assets panel: the logo (positive / negative) and the house photos
    $('#fgLogos').innerHTML = `<div class="fg-asset logo" data-logo="pos"><div class="th">${logo(58, 16)}</div><span>Logo / Black</span></div>` +
      `<div class="fg-asset logo neg" data-logo="neg"><div class="th">${logo(58, 16)}</div><span>Logo / White</span></div>`;
    $('#fgAssets').innerHTML = H.map((h) => `<div class="fg-asset"><div class="th" style="background-image:url(${h.img})"></div><span>${esc(h.file)}</span></div>`).join('');

    // brand page boards
    Design.addBoard('logo', { ...B.logo, label: '01 — Logo', html: logoBoard() });
    Design.addBoard('color', { ...B.color, label: '02 — Color', html: colorBoard() });
    Design.addBoard('type', { ...B.type, label: '03 — Typography', html: typeBoard() });
    sheet = await Design.addSheet('cmp', { ...B.cmp, label: '04 — Components', body: sheetBody(), css: SHEET_CSS, hidden: true });
    Layers.items.brand = [
      { key: 'b-logo', name: '01 — Logo', kind: 'frame', depth: 0 }, { key: 'b-color', name: '02 — Color', kind: 'frame', depth: 0 },
      { key: 'b-type', name: '03 — Typography', kind: 'frame', depth: 0 },
    ];
    // web page frames (loaded up front; shown when they are "created")
    pc = await Design.addSiteFrame('pc', { page: 'web', x: PCX, y: 0, w: 1440, h: 900, vh: 9, label: 'Home / PC — 1440', hiddenUntilLoad: true, before: (d) => {
      d.querySelectorAll('main > *, footer').forEach(hide);
      hide(d.querySelector('header#header'));
    } });
    sp = await Design.addSiteFrame('sp', { page: 'web', view: 'sp', x: SPX, y: 0, w: 375, h: 812, vh: 8.12, label: 'Home / SP — 375', hiddenUntilLoad: true });
    Design.fitHeight(sp);
    Design.showPage('brand');
    const v = Design.view();
    Design.cam = { x: B.logo.x + B.logo.w / 2 - v.w / 2 / 0.62, y: B.logo.y - 90, z: Math.min(0.62, (v.w - 60) / B.logo.w) };
    Design.cam = Design.camFor(B.logo.x, B.logo.y, B.logo.w, B.logo.h, { pad: 50 });
    Design.apply();

    // fonts used by the boards (Adobe Fonts kit + local copies) and by the kana typed on them
    const jaText = JSON.stringify(JA) + Object.values(JA).flat().filter((s) => s && s.r).map((s) => D.romajiToKana(s.r).kana).join('') + 'あなた貴方貴女彼方';
    try {
      await Promise.race([Promise.all([
        document.fonts.load('700 100px "Manuka Condensed"', 'ONSEN SUITE POOL CLUB'),
        document.fonts.load('500 40px neue-haas-grotesk-text', 'NOT A HOTEL 0123456789#'),
        document.fonts.load('400 40px neue-haas-grotesk-text', 'NOT A HOTEL'),
        document.fonts.load('600 40px YakuHanJP', '、。「」' + jaText),
      ]), new Promise((r) => setTimeout(r, 8000))]);
    } catch (e) {}
    if (!fast) await Promise.all(H.map((h) => new Promise((r) => { const i = new Image(); i.onload = i.onerror = r; i.src = h.img; })));
    Win.open('design', 'max');
  }

  /* ============================================================== runner (shared/stage.js) */
  window.Stage.run({
    scenes: SCENES,
    async prepare(fast) {
      $('#intro').classList.add('hide');
      $('#intro').style.transition = 'none';
      await prepare(fast);
      await new Promise((r) => setTimeout(r, 50));
      $('#intro').style.transition = '';
      $('#intro').classList.remove('hide'); // the title card waits for play
      window.__JA = JA;
    },
    onStart() { $('#hint').style.transition = 'none'; $('#hint').classList.add('hide'); },
    afterSeek() { if (KeyStrip.visible()) KeyStrip.idleHide(400); },
  });
})();
