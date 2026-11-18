/*
 * Timeline: building ne-auberge.jp — Figma design → responsive → Astro + Sveltia CMS → SEO / LLMO → GA4 / GTM → live.
 *
 * Keys:  Space = start / pause   R = restart   C = captions on/off   H = hide hint
 * URL :  ?speed=1.3   ?from=3 (start at scene 3)   ?to=3   ?captions=0   ?autoplay=1   ?font=local
 */
(function () {
  'use strict';
  const D = window.Demo;
  const A = window.Apps;
  const S = window.SITE_SNAPSHOT;
  const { $, $$, esc, wait, kw, tween, Ease, Cursor, Clock, Caption, Issue, Keycap, KeyStrip, Notif, Ghost, Win, UI } = D;
  const { clickUi, hoverUi, moveToEl, typeInto, fieldTarget, frameTextTarget, screenRect, pointOf, realWait } = D;
  const { Design, Layers, Props, Vars, Code, Term, Browser, SiteView, AstroErr, Cms, Gtm, TA, GA, Val, Src } = A;
  /** hold for reading a "✓ 修正" caption: keeps its speed-1 length in real time when ?speed is above 1 */
  const readHold = (ms) => wait(ms * Math.max(1, Clock.speed));
  /** pause between actions (PACE < 1 tightens the whole timeline; typing and the ✓ captions are not affected) */
  const PACE = 0.78;
  const hold = (ms) => wait(ms * PACE);

  /* ------------------------------------------------ Japanese typing scripts (Microsoft IME)
   *   {r: romaji, segs: [...], predict: [...], yomi: [...]}  romaji -> kana composition (+ prediction hints that
   *        narrow with every key), Space converts, further Spaces walk the candidate list ({c: [...], p: index}), Enter
   *   {r, tab: i, predict, yomi}  accept a prediction with Tab        {direct: 'abc'}  half-width (IME off)
   *   {paste: 'text'}  Ctrl+V        {key: 'Enter' | 'Backspace' | 'Space', n}
   */
  const JA = {
    lead: [
      { r: 'ajiwautameni,tomaru.', segs: ['味わう', 'ために、', { c: ['止まる。', '泊まる。', '留まる。', '停まる。'], p: 1 }],
        predict: ['味わう', '味わい', 'アジア'], yomi: ['あじわう', 'あじわい', 'あじあ'] },
    ],
    sub: [
      { r: 'niigata/shibata,', segs: ['新潟', '・', { c: ['柴田、', '新発田、', '芝田、', 'しばた、'], p: 1 }],
        predict: ['新潟', '新潟県', '新潟市'], yomi: ['にいがた', 'にいがたけん', 'にいがたし'] },
      { r: 'ichinichihitokumino', segs: ['一日', '一組の'], predict: ['一日', '一日中', '一日一善'], yomi: ['いちにち', 'いちにちじゅう', 'いちにちいちぜん'] },
      { r: 'o-beruju.', segs: ['オーベルジュ。'], predict: ['オーベルジュ'], yomi: ['おーべるじゅ'] },
    ],
    eyebrow: [
      { r: 'futatsunokodawari', segs: [{ c: ['二つの', 'ふたつの', '2つの', '二つ乃'], p: 1 }, 'こだわり'],
        predict: ['二つ', '蓋', '再び'], yomi: ['ふたつ', 'ふた', 'ふたたび'], candHold: 420 },
    ],
    cta: [
      { r: 'goyoyaku', segs: [{ c: ['ご予約', '御予約', 'ごよやく'] }], predict: ['ご予約', 'ご予約はこちら'], yomi: ['ごよやく', 'ごよやくはこちら'] },
    ],
    title: [
      { paste: 'Né' },
      { r: '(ne)|', segs: [{ c: ['（ね）｜', '（ネ）｜', '（根）｜'], p: 1 }] },
      // 新発田 was corrected once (scene 1): the IME has learned it and now offers it first
      { r: 'niigata/shibata,', segs: ['新潟', '・', '新発田、'], predict: ['新潟', '新潟県', '新潟・新発田'], yomi: ['にいがた', 'にいがたけん', 'にいがた・しばた'] },
      // …and predicts the whole phrase typed before
      { r: 'ichinichi', tab: 0, predict: ['一日一組のオーベルジュ', '一日', '一日中'], yomi: ['いちにちひとくみのおーべるじゅ', 'いちにち', 'いちにちじゅう'] },
    ],
    llmsHead: [
      { direct: '## ' },
      { r: 'eigyoubitojikann', segs: ['営業日と', '時間'], predict: ['営業日', '営業時間', '営業中'], yomi: ['えいぎょうび', 'えいぎょうじかん', 'えいぎょうちゅう'] },
      { r: '(yokuayamattetsutaerareru', segs: ['（よく', '誤って', '伝えられる'], predict: ['（よく', '（よくある'], yomi: ['（よく', '（よくある'] },
      { r: 'koumoku)', segs: ['項目）'], predict: ['項目', '項目別'], yomi: ['こうもく', 'こうもくべつ'] },
      { direct: ' / Opening days and hours (often misreported)' },
    ],
    tagName: [
      { direct: 'GA4 - Google ' },
      { r: 'tagu', segs: [{ c: ['タグ', 'たぐ', '田口'] }], predict: ['タグ', 'タグ付け'], yomi: ['たぐ', 'たぐづけ'] },
    ],
    version: [
      { direct: 'GA4 ' },
      { r: 'keisokusettei', segs: ['計測', '設定'], predict: ['計測', '計測器'], yomi: ['けいそく', 'けいそくき'] },
    ],
    commit: [
      { direct: 'git commit -m "SEO/LLMO' },
      { r: 'kibann', segs: ['基盤'], predict: ['基盤', '基板'], yomi: ['きばん', 'きばん'] },
      { r: 'to', segs: ['と'] },
      { direct: 'GTM' },
      { r: 'keisokuwotsuika', segs: ['計測を', '追加'], predict: ['計測', '計測器'], yomi: ['けいそく', 'けいそくき'] },
      { direct: '"' },
    ],
  };

  /* ------------------------------------------------------------- helpers */
  const PCX = 0, SPX = 1640; // world x of the two frames
  let pc = null, sp = null; // design frames
  let devDoc = null; // localhost:4321 iframe document
  const W = { dev: () => $('#devFrame'), live: () => $('#liveFrame') };
  const hide = (el) => el && el.setAttribute('data-demo-hidden', '');
  const show = (el, anim = 'demo-pop') => {
    if (!el) return;
    el.removeAttribute('data-demo-hidden');
    el.removeAttribute('data-demo-invis');
    if (anim && !Clock.ff) { el.classList.remove(anim); void el.offsetWidth; el.classList.add(anim); setTimeout(() => el.classList.remove(anim), 900); }
  };
  const invis = (el) => el && el.setAttribute('data-demo-invis', '');

  /** press, drag a ghost to a point, release */
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
  const ghostImg = (urls) => urls.map((u, i) => `<div class="g" style="background-image:url(${u});position:absolute;left:${i * 10}px;top:${i * 8}px"></div>`).join('');

  /** select-all highlight in a small field, then type (replaces) */
  async function typeField(el, script, o = {}) {
    await clickUi(el, { kind: o.kind || 'text', dbl: !!o.dbl, after: 80 });
    el.classList.add('focus');
    const v = el.querySelector('.v') || el;
    if (o.selectAll !== false && v.textContent) { v.innerHTML = `<span style="background:#b4d5ff">${esc(v.textContent)}</span>`; await hold(260); }
    const text = await typeInto(fieldTarget(v, { base: o.base || '' }), script, { kps: o.kps || 12, ...o });
    el.classList.remove('focus');
    return text;
  }

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
    await hold(4200);
    it.classList.add('hide');
    await hold(900);
  });

  /* ------------------------------------------------------- 1 Figma Design */
  scene('design', async () => {
    Caption.step(1);
    Caption.set('Figma：カラー・タイポグラフィ・余白をローカル変数として定義（実装の CSS 変数と同じ値）');
    await hold(500);
    await clickUi('#fgVarsBtn');
    Vars.open();
    await hold(250);
    await Vars.show('color');
    await hold(700);
    await clickUi('.fg-vcoll[data-coll="type"]');
    await Vars.show('type', { gap: 120 });
    await hold(1000);
    await clickUi('#fgVarsClose');
    Vars.close();
    await hold(300);

    // frame
    Caption.set('PC（1440px）のフレームを作成');
    await clickUi('.fg-tool[data-tool="frame"]');
    Design.setTool('frame');
    await Keycap.show(['F'], 600);
    Props.presets();
    await hold(300);
    await clickUi('[data-preset="desktop"]');
    pc.el.style.visibility = 'visible';
    Design.setTool('move');
    Layers.add({ key: 'pc', name: 'Desktop', kind: 'frame', depth: 0 });
    Layers.select('pc');
    Design.select({ frame: pc });
    Props.frame(pc);
    await Design.camTo(Design.camFor(PCX, -50, 1440, 960, { pad: 50 }), 900);
    // rename
    await clickUi(pc.label, { dbl: true, kind: 'text', after: 60 });
    pc.label.innerHTML = `<span style="background:#b4d5ff">${esc(pc.name)}</span>`;
    await hold(250);
    const name = await typeInto(fieldTarget(pc.label), [{ direct: 'Home / PC' }], { kps: 11 });
    Design.rename(pc, name);
    Layers.rename('pc', name);
    Props.frame(pc);
    await hold(300);

    // hero image
    Caption.set('メインビジュアル：写真を配置（PC 用 3 枚をスライドで切り替え）');
    await clickUi('.fg-ltabs span[data-ltab="assets"]');
    Design.leftTab('assets');
    await hold(250);
    const hero = pc.doc.querySelector('.hero');
    await dragTo($('.fg-asset[data-asset="Ne_226_PR"]'), Design.toScreen(PCX + 720, 450), ghostImg(['assets/photos/Ne_226_PR.webp']));
    show(hero, 'demo-fade');
    Layers.add({ key: 'hero', name: 'Hero', kind: 'section', depth: 1 }, { after: 'pc', child: true });
    Layers.add({ key: 'kv', name: 'KV / Ne_226_PR · Ne_222_PR · Ne_0156', kind: 'image', depth: 2 }, { after: 'hero', child: true });
    Design.select({ frame: pc, el: hero });
    Props.image(hero, 'Hero', 'Ne_226_PR');
    await hold(900);

    // lead copy
    Caption.set('キャッチコピーを入力（ローマ字入力 → 変換）');
    await clickUi('.fg-ltabs span[data-ltab="layers"]');
    Design.leftTab('layers');
    await clickUi('.fg-tool[data-tool="text"]');
    Design.setTool('text');
    await Keycap.show(['T'], 600);
    const lead = pc.doc.querySelector('.lead');
    const leadHtml = lead.innerHTML;
    Cursor.kind('text');
    await Cursor.moveTo(...Design.toScreen(PCX + 720, 432));
    await Cursor.click();
    lead.textContent = '';
    show(lead, null);
    Layers.add({ key: 'lead', name: 'テキスト', kind: 'text', depth: 2 }, { after: 'kv' });
    Layers.select('lead');
    Design.select({ frame: pc, el: lead });
    await typeInto(frameTextTarget(lead), JA.lead, { kps: 11 });
    lead.innerHTML = leadHtml;
    Layers.rename('lead', '味わうために、泊まる。');
    Design.setTool('move');
    Props.text(lead, '味わうために、泊まる。');
    await hold(1200);

    // sub copy
    const sub = pc.doc.querySelector('.sub.kv-late');
    const subHtml = sub.innerHTML;
    await clickUi('.fg-tool[data-tool="text"]');
    Design.setTool('text');
    Cursor.kind('text');
    await Cursor.moveTo(...Design.toScreen(PCX + 720, 490));
    await Cursor.click();
    sub.textContent = '';
    show(sub, null);
    Layers.add({ key: 'sub', name: 'テキスト', kind: 'text', depth: 2 }, { after: 'lead' });
    Layers.select('sub');
    Design.select({ frame: pc, el: sub });
    await typeInto(frameTextTarget(sub), JA.sub, { kps: 12 });
    sub.innerHTML = subHtml;
    Layers.rename('sub', '新潟・新発田、一日一組のオーベルジュ。');
    Design.setTool('move');
    Props.text(sub, '新潟・新発田、一日一組のオーベルジュ。');
    await hold(900);

    // award logos
    Caption.set('受賞ロゴ（Architizer A+Awards・The Aficionados・グッドデザイン賞）を配置');
    await clickUi('.fg-ltabs span[data-ltab="assets"]');
    Design.leftTab('assets');
    await hold(200);
    await dragTo($('.fg-asset[data-logo="aficionados-white"]'), Design.toScreen(PCX + 720, 840),
      ghostImg(['assets/logos/architizer-winner-2026.webp', 'assets/logos/aficionados-white.webp', 'assets/logos/good-design.webp']).replace(/class="g"/g, 'class="g" style="background-color:#333;background-size:70% auto;background-repeat:no-repeat;background-position:center"'));
    const awards = pc.doc.querySelector('.kv-awards');
    show(awards);
    Layers.add({ key: 'awards', name: 'Awards', kind: 'group', depth: 2 }, { after: 'sub' });
    Design.select({ frame: pc, el: awards });
    await hold(700);
    await clickUi('.fg-ltabs span[data-ltab="layers"]');
    Design.leftTab('layers');

    // the rest of the page
    Caption.set('各セクションを配置：コンセプト／ふたつのこだわり／一日の流れ／ストーリー／ギャラリー／アクセス…');
    Design.select(null);
    const secs = [
      ['.concept', 'Concept — Néという名のオーベルジュ'], ['.pillars', 'Pillars — ふたつのこだわり'], ['.experience', 'Experience — A day at Né'],
      ['.story', 'Story — 未来へつづく、新しい「根」を'], ['.gallery', 'Gallery'], ['.access', 'Access'], ['.news', 'News'],
      ['.cta-band', 'CTA — Reserve'], ['footer.footer', 'Footer'],
    ];
    const z = 0.2;
    for (const [sel, nm] of secs) {
      const el = pc.doc.querySelector(sel);
      show(el);
      Design.fitHeight(pc);
      Layers.add({ key: sel, name: nm, kind: sel === 'footer.footer' ? 'component' : 'section', depth: 1 }, { after: Layers.items[Layers.items.length - 1].key });
      const r = el.getBoundingClientRect();
      const v = Design.view();
      await Design.camTo({ x: PCX + 720 - v.w / 2 / z, y: Math.max(-60, pc.y + r.top + r.height / 2 - v.h / 2 / z), z }, 520);
      await hold(260);
    }
    Design.fitHeight(pc);
    await hold(500);

    // body text values
    Caption.set('コンセプト本文：游明朝 17px（--fs-body）・行間 210%・字間 8%（--ls）・色 --ink-body');
    const cp = pc.doc.querySelector('.c-body p');
    const r = cp.getBoundingClientRect();
    await Design.camTo(Design.camFor(PCX + 300, r.top - 200, 840, 760), 1000);
    await clickUi(cp, { ay: 0.3 });
    Design.select({ frame: pc, el: cp });
    Props.text(cp, 'Néは、日本語で「根」、…');
    await hold(2400);
    Design.select(null);
  });

  /* -------------------------------------------------- 2 Responsive design */
  scene('responsive', async () => {
    Caption.step(2);
    Caption.set('PC デザインを複製し、SP（375px）フレームを作成');
    const v = Design.view();
    await Design.camTo({ x: PCX - 60, y: -80, z: Math.min(0.42, (v.w - 80) / (SPX + 1440 + 120)) }, 900);
    await clickUi(pc.label);
    Design.select({ frame: pc });
    Layers.select('pc');
    Props.frame(pc);
    await hold(300);
    await Keycap.show(['Ctrl', 'D'], 800);
    sp.el.style.visibility = 'visible';
    if (!Clock.ff) sp.el.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 300 });
    Layers.add({ key: 'sp', name: 'Home / PC', kind: 'frame', depth: 0 }, { first: true });
    Layers.select('sp');
    Design.select({ frame: sp });
    Props.frame(sp);
    await hold(700);

    // width 375
    await typeField(Props.field('w'), [{ direct: '375' }, { key: 'Enter' }], { kps: 8 });
    sp.doc.head.insertAdjacentHTML('beforeend', '<style id="demo-e1">.hero.photo.intro .lead{font-size:2.6rem!important}</style>');
    Design.setWidth(sp, 375, 8.12);
    Design.fitHeight(sp);
    Props.frame(sp);
    Props.flash('w');
    await hold(500);
    await clickUi(sp.label, { dbl: true, kind: 'text', after: 60 });
    sp.label.innerHTML = `<span style="background:#b4d5ff">${esc(sp.name)}</span>`;
    await hold(200);
    const nm = await typeInto(fieldTarget(sp.label), [{ direct: 'Home / SP' }], { kps: 12 });
    Design.rename(sp, nm);
    Layers.rename('sp', nm);
    Props.frame(sp);
    await Design.camTo(Design.camFor(SPX, -60, 375, 900, { pad: 40 }), 1000);
    await hold(300);

    // E1: heading overflows the 375px frame
    const lead = sp.doc.querySelector('.lead');
    Caption.issue('表示崩れ', 'PC 用の文字サイズ（2.6rem）のまま。375px では見出しがフレームからはみ出して切れている');
    Issue.show(() => {
      const fr = screenRect(sp.body), lr = screenRect(lead);
      return { left: fr.left, top: lr.top, width: fr.width, height: lr.height };
    }, '表示崩れ：見出しが画面からはみ出す');
    await hold(3000);
    await clickUi(lead, { ax: 0.3 });
    Design.select({ frame: sp, el: lead });
    Props.text(lead, '味わうために、泊まる。');
    await hold(700);
    await typeField(Props.field('size'), [{ direct: '21.3' }, { key: 'Enter' }], { kps: 8 });
    sp.doc.getElementById('demo-e1').remove();
    Props.text(lead, '味わうために、泊まる。');
    Props.flash('size');
    Design.track();
    Issue.ok(() => {
      const fr = screenRect(sp.body), lr = screenRect(lead);
      return { left: fr.left, top: lr.top, width: fr.width, height: lr.height };
    }, 'SP：1.42rem（21.3px）・自動幅で 1 行');
    Caption.fixed('SP 用の見出しサイズ 1.42rem（21.3px）に変更。改行させず（自動幅）1 行に収めた');
    await readHold(2800);
    Issue.hide();
    Design.select(null);
    Props.empty();

    // breakpoint notes
    Caption.set('ブレイクポイント 720px：一日の流れは横スクロール、ギャラリーは非表示に');
    const ex = sp.doc.querySelector('.ex-chs');
    const er = ex.getBoundingClientRect();
    await Design.camTo(Design.camFor(SPX - 40, er.top - 380, 900, 1000), 1100);
    const note = document.createElement('div');
    note.className = 'fg-note pop';
    note.style.left = SPX + 375 + 60 + 'px';
    note.style.top = er.top - 160 + 'px';
    note.innerHTML = '<b>≤ 720px</b>1 日の流れ：横スクロール<br>（scroll-snap・1 枚 84vw）<br>ギャラリー：SP では非表示';
    Design.world.appendChild(note);
    await hold(600);
    await tween(1600, (e) => { ex.scrollLeft = e * (ex.scrollWidth - ex.clientWidth) * 0.42; }, Ease.inOut);
    await hold(500);
    await tween(900, (e) => { ex.scrollLeft = (1 - e) * (ex.scrollWidth - ex.clientWidth) * 0.42; }, Ease.inOut);
    // overview of both
    const bp = document.createElement('div');
    bp.className = 'fg-note pop';
    bp.style.left = SPX + 375 + 60 + 'px';
    bp.style.top = '0px';
    bp.innerHTML = '<b>Breakpoint</b>PC：721px 以上<br>SP：720px 以下（ルート文字サイズ 15px）';
    Design.world.appendChild(bp);
    await Design.camTo(Design.camFor(PCX - 40, -110, SPX + 375 + 520, 2500, { pad: 30 }), 1400);
    await hold(2400);
  });

  /* -------------------------------------------------- 3 Frontend / CMS */
  scene('frontend', async () => {
    Caption.step(3);
    Caption.set('Astro でコンポーネントを実装 ― 開発サーバーを起動');
    await Win.switchTo('code', { state: 'max' });
    await Keycap.show(['Ctrl', '@'], 700);
    await Code.panel(true);
    Term.render('<span class="caret"></span>');
    await hold(300);
    await Term.run('npm run dev', [
      '', '<span class="tdim">&gt; ne-auberge@0.0.1 dev</span>', '<span class="tdim">&gt; astro dev</span>', '', 500,
      ' <span class="tb tm"> astro </span> <span class="tg">v5.1.0</span> <span class="tdim">ready in</span> 412 <span class="tdim">ms</span>', '',
      '┃ Local    <span class="tc tlink">http://localhost:4321/</span>', '┃ Network  <span class="tdim">use --host to expose</span>', '',
      `<span class="tdim">${window.Win11.fmt.stamp().slice(11)}</span> <span class="tc">[watch]</span> <span class="tdim">Watching for file changes...</span>`,
    ], { noPrompt: true, gap: 70 });
    await hold(600);

    // snap: code left, browser right
    await Keycap.show(['Win', '←'], 700);
    Win.state('code', 'snap-left');
    await realWait(450);
    Code.render();
    const link = [...$$('#vsTerm .tlink')].pop();
    await Keycap.show(['Ctrl', 'クリック'], 700);
    await clickUi(link, { kind: 'hand' });
    Win.open('browser', 'snap-right');
    Browser.addTab({ id: 'dev', title: 'localhost:4321', url: 'http://localhost:4321/', page: 'site', fav: 'site' });
    Browser.loading('dev', true);
    await realWait(450);
    devDoc = await SiteView.load(W.dev(), { intro: true, before: (d) => {
      d.querySelectorAll('main > section[data-astro-cid-nf35xw4x]').forEach(hide);
      hide(d.querySelector('.pillars > .eyebrow'));
    } });
    Browser.loading('dev', false);
    await hold(2600);

    // E2: import path typo
    Caption.set('ページにトップの各セクション（HomeSections コンポーネント）を読み込む');
    await Code.openFile('src/pages/[...slug].astro');
    let at = Code.find("import Hero from");
    await Code.newLineAfter(at.line);
    await Code.type([{ key: 'Enter' }, { direct: "import HomeSections from '../components/home/HomeSection.astro';" }]);
    const impLine = at.line + 1;
    at = Code.find('{isHome && <Hero');
    await Code.newLineAfter(at.line);
    await Code.type([{ key: 'Enter' }, { direct: '{isHome && <HomeSections />}' }]);
    await Code.save();
    const pth = '../components/home/HomeSection.astro';
    const lines = Code.files[Code.active].lines;
    const c0 = lines[impLine].indexOf(pth);
    Code.sq = [{ line: impLine, from: c0, to: c0 + pth.length }];
    Code.render();
    $('#vsProblems').innerHTML = `${VSC.ci('error')} 1 ${VSC.ci('warning')} 0`;
    $(`.vs-tab[data-tab="${CSS.escape(Code.active)}"]`).classList.add('err');
    Term.lines.push(`<span class="tdim">${window.Win11.fmt.stamp().slice(11)}</span> <span class="tr">[ERROR]</span> <span class="tr">Could not import "../components/home/HomeSection.astro".</span>`);
    Term.render(null);
    AstroErr.show(pth, impLine + 1, lines.slice(impLine - 2, impLine + 2), 2);
    await hold(500);
    Caption.issue('エラー', 'import パスの綴り間違い（HomeSection → HomeSections）で、開発サーバーがページを表示できない');
    Issue.show($('.ae-box'), 'エラー：モジュールを読み込めない');
    await hold(3200);
    Issue.show(() => {
      const r = Code.lineEl(impLine) ? screenRect(Code.lineEl(impLine).querySelector('.lc')) : null;
      return r && { left: r.left, top: r.top, width: Math.min(r.width, 560), height: r.height };
    }, 'ファイル名は HomeSections.astro', { below: true });
    await hold(1200);
    await Code.clickAt(impLine, c0 + pth.indexOf('.astro'));
    await Code.type([{ direct: 's' }], { kps: 6 });
    Code.sq = [];
    Code.render();
    await Code.save();
    $('#vsProblems').innerHTML = `${VSC.ci('error')} 0 ${VSC.ci('warning')} 0`;
    $(`.vs-tab[data-tab="${CSS.escape(Code.active)}"]`).classList.remove('err');
    Term.lines.push(`<span class="tdim">${window.Win11.fmt.stamp().slice(11)}</span> <span class="tc">[200]</span> / <span class="tdim">38ms</span>`);
    Term.render(null);
    AstroErr.hide();
    devDoc.querySelectorAll('main > section[data-astro-cid-nf35xw4x]').forEach((s) => show(s, null));
    Code.lineCls[impLine] = 'good';
    Code.render();
    Issue.ok(() => { const e = Code.lineEl(impLine); const r = e && screenRect(e.querySelector('.lc')); return r && { left: r.left, top: r.top, width: Math.min(r.width, 560), height: r.height }; }, '修正：HomeSections.astro', { below: true });
    Caption.fixed('ファイル名を HomeSections.astro に修正 → 保存するとホットリロードで各セクションが表示された');
    await SiteView.scroll(W.dev(), SiteView.yOf(W.dev(), devDoc.querySelector('.concept'), 120), 1600);
    await readHold(1600);
    Issue.hide();
    delete Code.lineCls[impLine];
    Code.render();

    // component copy (IME)
    Caption.set('コンポーネントにコピーを入力（日本語はローマ字入力 → 変換）');
    await Code.openFile('src/components/home/HomeSections.astro');
    at = Code.find('<p class="eyebrow"></p>');
    await Code.scrollTo(Math.max(0, at.line - 8), 900);
    await Code.clickAt(at.line, at.col + '<p class="eyebrow">'.length);
    await Code.type(JA.eyebrow, { kps: 11 });
    await Code.save();
    const eb = devDoc.querySelector('.pillars > .eyebrow');
    await SiteView.scroll(W.dev(), SiteView.yOf(W.dev(), devDoc.querySelector('.pillars'), 120), 1100);
    show(eb);
    await hold(1800);

    // CMS
    Caption.set('Sveltia CMS（Git ベース）：予約導線や CTA をブラウザから編集できるように設定');
    await Code.openFile('public/admin/config.yml', { top: 0 });
    await hold(600);
    await Code.scrollTo(18, 1600);
    await hold(900);
    await clickUi(Browser.tabEl('dev'));
    await Keycap.show(['Win', '↑'], 700);
    Win.open('browser', 'max');
    await realWait(450);
    await Browser.newTab('cms');
    await Browser.typeUrl('localhost:4321/admin/');
    Browser.loading('cms', true);
    Browser.tab('cms').fav = 'cms';
    await hold(500);
    // the real Sveltia CMS (js/cms-snapshot.js): address and tab title as the CMS set them
    const cmsAt = (name, o) => { Cms.show(name, o); Browser.setUrl('cms', Cms.url(name)); Browser.setTitle('cms', Cms.title(name)); };
    Browser.setPage('cms', 'cms');
    cmsAt('settingsList');
    Browser.loading('cms', false);
    await hold(700);
    await clickUi(Cms.row(/Site Settings/), { kind: 'hand' });
    cmsAt('siteEdit');
    await hold(700);
    Caption.set('宿泊予約（CHILLNN）の URL とサイト共通の CTA 文言を入力');
    await Cms.type('reservation.stay.url', [{ direct: 'https://ne.booking.chillnn.com/ja/' }], { kps: 15 });
    cmsAt('siteUrl', { keepScroll: true });
    await hold(300);
    await Cms.reveal('cta.global');
    await Cms.type('cta.global', JA.cta);
    cmsAt('siteCta', { keepScroll: true });
    await hold(400);
    await clickUi(Cms.saveButton(), { kind: 'hand', after: 100 });
    cmsAt('siteSaved'); // the CMS goes back to the collection: 「エントリーが保存されました。」
    await hold(900);
    Code.setText('src/content/settings/site.json', window.CodeFiles.files['src/content/settings/site.json']);
    Code.mark('src/content/settings/site.json', 'M');
    await hold(1400);
  });

  /* -------------------------------------------------- 4 SEO / LLMO */
  scene('seo', async () => {
    Caption.step(4);
    Caption.set('ページごとの title / description を CMS で管理（日本語・英語）');
    const cmsAt = (name, o) => { Cms.show(name, o); Browser.setUrl('cms', Cms.url(name)); Browser.setTitle('cms', Cms.title(name)); };
    await clickUi(Cms.coll('ページ / Pages'));
    cmsAt('pagesList');
    await hold(800);
    await clickUi(Cms.row(/^home$/), { kind: 'hand' }); // no title yet: the CMS lists it by its file name
    cmsAt('homeEdit');
    await hold(800);
    await Cms.type('title', JA.title, { kps: 12 });
    cmsAt('homeTitle', { keepScroll: true });
    await hold(500);
    await clickUi(Cms.saveButton(), { kind: 'hand', after: 100 });
    cmsAt('homeSaved');
    await hold(900);
    Code.setText('src/content/pages/ja/home.md', window.CodeFiles.files['src/content/pages/ja/home.md']);
    Code.mark('src/content/pages/ja/home.md', 'M');
    Browser.setTitle('dev', S.pages[0].ja.title);
    await hold(900);

    // head tags
    Caption.set('共通レイアウトで canonical・hreflang（ja / en / x-default）・OGP を出力');
    await Win.switchTo('code', { state: 'snap-left' });
    Win.state('browser', 'snap-right');
    Browser.activate('dev');
    await realWait(450);
    await Code.panel(false);
    await Code.openFile('src/layouts/Base.astro', { top: 0 });
    await Code.scrollTo(16, 1300);
    const hl = Code.find('hreflang="ja"');
    for (let i = 0; i < 3; i++) Code.lineCls[hl.line + i] = 'flash';
    Code.render();
    await hold(2200);
    Code.lineCls = {};

    Caption.set('構造化データ（JSON-LD）：宿・レストラン・料理長・運営会社などを @graph で記述');
    await Code.openFile('src/data/schema.ts', { top: 0 });
    await hold(500);
    await Code.scrollTo(Math.min(120, Code.files['src/data/schema.ts'].lines.length - 30), 3600);
    await hold(500);

    // E3: JSON-LD not rendered
    Caption.set('<head> に JSON-LD を出力');
    await clickUi($('.vs-tab[data-tab="src/layouts/Base.astro"]'));
    Code.show('src/layouts/Base.astro');
    const tw = Code.find('twitter:description');
    await Code.newLineAfter(tw.line);
    await Code.type([{ key: 'Enter' }, { direct: '<script type="application/ld+json">{JSON.stringify(schema)}</script>' }]);
    const ldLine = tw.line + 1;
    await Code.save();
    await hold(300);

    Caption.set('ページのソースを構造化データのテストツールで検証');
    await clickUi(W.dev(), { ax: 0.5, ay: 0.4 });
    await Keycap.show(['Ctrl', 'U'], 700);
    Browser.addTab({ id: 'src', title: 'view-source:localhost:4321/', url: 'view-source:localhost:4321/', page: 'src', fav: 'src' }, { anim: true });
    Src.render('broken'); // Chrome's view-source page of the dev server's HTML (JSON-LD printed as {JSON.stringify(schema)})
    await hold(900);
    await Keycap.show(['Ctrl', 'A'], 600);
    Src.selectAll(true);
    await hold(300);
    await Keycap.show(['Ctrl', 'C'], 600);
    // the real Schema Markup Validator (js/validator-snapshot.js), run with this source
    if (!Browser.tab('val')) Browser.addTab({ id: 'val', title: Val.title(), url: Val.url('dialogUrl'), page: 'val', fav: 'val' }, { activate: false, anim: true });
    await hold(300);
    await Browser.clickTab('val');
    Src.selectAll(false);
    await clickUi(Val.snippetTab(), { kind: 'hand' });
    Val.show('dialogSnippet');
    await hold(400);
    await clickUi(Val.dialogEditor(), { kind: 'text', ay: 0.25 });
    await Keycap.show(['Ctrl', 'V'], 600);
    Val.show('dialogPasted');
    await hold(600);
    await clickUi(Val.runButton(), { kind: 'hand' });
    Val.show('loading');
    await hold(1100);
    Val.show('error');
    Caption.issue('エラー', 'JSON-LD に {JSON.stringify(schema)} が文字のまま出力され、構造化データとして読み取れない');
    Issue.show(() => screenRect(Val.errorItem()), 'アイテムが検出されない：その他のエラー 1 件');
    await hold(3400);
    Issue.show(() => { const e = Code.lineEl(ldLine); const r = e && screenRect(e.querySelector('.lc')); return r && { left: r.left, top: r.top, width: Math.min(r.width, 600), height: r.height }; },
      'Astro は <script> 内の {式} を展開しない → set:html', { below: true });
    await hold(2200);

    // fix: set:html
    const ln = Code.files['src/layouts/Base.astro'].lines[ldLine];
    const from = ln.indexOf('>{JSON');
    await Code.dragSelect(ldLine, from, ln.length);
    await Code.type([{ direct: ' set:html={JSON.stringify(schema)} />' }]);
    await Code.save();
    Code.lineCls[ldLine] = 'good';
    Code.render();
    Issue.hide();
    await Browser.clickTab('src');
    await Keycap.show(['F5'], 600);
    Src.render('fixed');
    await hold(700);
    await Keycap.show(['Ctrl', 'A'], 500);
    Src.selectAll(true);
    await Keycap.show(['Ctrl', 'C'], 500);
    await Browser.clickTab('val');
    Src.selectAll(false);
    await clickUi(Val.editor(), { kind: 'text', ax: 0.4, ay: 0.3 });
    await Keycap.show(['Ctrl', 'A'], 500);
    Val.show('selectAll');
    await Keycap.show(['Ctrl', 'V'], 500);
    Val.show('fixedPasted');
    await hold(400);
    await clickUi(Val.playButton(), { kind: 'hand' }); // ▶ runs the test again
    Val.show('loading2');
    await hold(1000);
    Val.show('ok');
    Issue.ok(() => screenRect(Val.resultList()), 'Restaurant・LocalBusiness・WebSite：エラーなし・警告なし');
    Caption.fixed('set:html で JSON を埋め込み → Restaurant・LocalBusiness・WebSite の 3 件を検出（宿・料理長・運営会社はその中に）、エラー・警告なし');
    await readHold(3000);
    Issue.hide();
    delete Code.lineCls[ldLine];
    Code.render();

    // robots.txt
    Caption.set('robots.txt：AI クローラーにも公開する方針を明示');
    await Code.openFile('public/robots.txt', { top: 0 });
    const pb = Code.find('User-agent: PerplexityBot');
    await Code.clickAt(pb.line, 0);
    await Code.type([{ direct: 'User-agent: ClaudeBot' }, { key: 'Enter' }, { direct: 'Allow: /' }, { key: 'Enter' }, { key: 'Enter' }], { kps: 15 });
    await Code.save();
    await hold(600);

    // llms.txt
    Caption.set('llms.txt：AI が誤りやすい事実（定休日・営業時間）をはっきり書いておく');
    await Code.openFile('public/llms.txt', { top: 0 });
    const L = Code.files['public/llms.txt'].lines;
    await Code.scrollTo(Math.max(0, L.length - 18), 1500);
    await Code.clickAt(L.length - 1, 0);
    const tail = S.llms.slice(S.llms.indexOf('## 営業日と時間'));
    const head = tail.split('\n')[0];
    const rest = tail.slice(head.length + 2);
    const script = D.scriptText(JA.llmsHead) === head ? JA.llmsHead : [{ paste: head }];
    await Code.type(script, { kps: 12 });
    await Code.type([{ key: 'Enter' }, { key: 'Enter' }, { paste: rest }]);
    if (Code.text('public/llms.txt') !== S.llms) { console.warn('[demo] llms.txt differs after typing; restoring'); Code.setText('public/llms.txt', S.llms); }
    await Code.save();
    await hold(400);
    await clickUi(Browser.tabEl('dev'));
    await Browser.newTab('llms');
    await Browser.typeUrl('localhost:4321/llms.txt');
    $('#txtView').textContent = S.llms;
    Browser.tab('llms').fav = 'site'; // a text file: Chrome's default page icon
    Browser.loading('llms', true);
    Browser.loading('llms', false);
    Browser.setPage('llms', 'txt');
    Browser.setUrl('llms', 'http://localhost:4321/llms.txt');
    Browser.setTitle('llms', 'localhost:4321/llms.txt');
    await hold(1200);
    await tween(1800, (e) => { $('#txtView').scrollTop = e * ($('#txtView').scrollHeight - $('#txtView').clientHeight); }, Ease.inOut);
    await hold(1600);
  });

  /* -------------------------------------------------- 5 GA4 / GTM */
  scene('measure', async () => {
    Caption.step(5);
    Caption.set('Google タグ マネージャーのコンテナを全ページに設置');
    const snippet = [
      '<!-- Google Tag Manager -->',
      "    <script is:inline>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':",
      "    new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],",
      "    j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=",
      "    'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);",
      `    })(window,document,'script','dataLayer','${S.gtmId}');</script>`,
      '    <!-- End Google Tag Manager -->',
    ].join('\n');
    const nos = [
      '<!-- Google Tag Manager (noscript) -->',
      `    <noscript><iframe src="https://www.googletagmanager.com/ns.html?id=${S.gtmId}"`,
      '    height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>',
      '    <!-- End Google Tag Manager (noscript) -->',
    ].join('\n');
    await Code.openFile('src/layouts/Base.astro');
    let at = Code.find("sessionStorage.getItem('ne_intro_seen')");
    await Code.scrollTo(Math.max(0, at.line - 12), 700);
    await Code.newLineAfter(at.line);
    await Code.type([{ key: 'Enter' }, { paste: snippet }]);
    at = Code.find('<body>');
    await Code.newLineAfter(at.line);
    await Code.type([{ key: 'Enter' }, { paste: nos }]);
    await Code.save();
    const gl = Code.find(S.gtmId);
    Code.lineCls[gl.line] = 'flash';
    Code.render();
    await hold(1200);

    // Tag Manager
    await clickUi(Browser.tabEl('dev'));
    await Keycap.show(['Win', '↑'], 600);
    Win.open('browser', 'max');
    await realWait(400);
    if (!Browser.tab('gtm')) Browser.addTab({ id: 'gtm', title: 'Tag Manager', url: 'https://tagmanager.google.com/#/container/accounts/{{6248113907}}/containers/{{214509722}}/workspaces/7', page: 'gtm', fav: 'gtm' }, { activate: false, anim: true });
    if (!Browser.tab('ga')) Browser.addTab({ id: 'ga', title: 'Analytics | DebugView', url: 'https://analytics.google.com/analytics/web/#/{{p478216035}}/admin/debugview', page: 'ga', fav: 'ga' }, { activate: false, anim: true });
    await hold(300);
    await Browser.clickTab('gtm');
    Caption.set('計測設計：流入・回遊は GA4、予約サイトへの送客は外部リンクのクリック、広告は Meta Pixel');
    await hold(3200);
    Caption.set('GA4 の Google タグを追加（全ページで配信）');
    await clickUi($('.gtm-ni[data-nav="tags"]'));
    Gtm.tagsView();
    await hold(600);
    await clickUi('#gtmNew', { kind: 'hand' });
    Gtm.panel({ name: '', tagId: null, trig: null });
    $('#gtmPanel').classList.add('show');
    await realWait(380);
    await clickUi('#gtmName', { kind: 'text' });
    $('#gtmName').classList.add('focus');
    Gtm.cur.name = await typeInto(fieldTarget($('#gtmName')), JA.tagName, { kps: 12 });
    $('#gtmName').classList.remove('focus');
    $('#gtmName').textContent = Gtm.cur.name;
    await clickUi('#gtmChooseType', { kind: 'hand' });
    Gtm.picker('type');
    $('#gtmPick').classList.add('show');
    await realWait(350);
    await clickUi('.gtm-opt[data-opt="googtag"]', { kind: 'hand' });
    $('#gtmPick').classList.remove('show');
    Gtm.panel({ name: Gtm.cur.name, tagId: '', trig: null });
    await hold(400);
    await clickUi('#gtmTagId', { kind: 'text' });
    $('#gtmTagId').classList.add('focus');
    Gtm.cur.tagId = await typeInto(fieldTarget($('#gtmTagId')), [{ direct: 'G-MEEN9DKT1' }], { kps: 9 }); // typo: one E short
    $('#gtmTagId').classList.remove('focus');
    $('#gtmTagId').textContent = Gtm.cur.tagId;
    await clickUi('#gtmChooseTrig', { kind: 'hand' });
    Gtm.picker('trig');
    $('#gtmPick').classList.add('show');
    await realWait(350);
    await clickUi('.gtm-opt[data-opt="all"]', { kind: 'hand' });
    $('#gtmPick').classList.remove('show');
    Gtm.panel({ name: Gtm.cur.name, tagId: Gtm.cur.tagId, trig: 'All Pages' });
    await hold(600);
    await clickUi('#gtmSave', { kind: 'hand' });
    $('#gtmPanel').classList.remove('show');
    Gtm.tags.unshift({ name: Gtm.cur.name, type: 'Google タグ', trig: 'All Pages', date: 'たった今' });
    Gtm.tagsView(0);
    await hold(900);

    // preview
    Caption.set('プレビュー（Tag Assistant）で、各タグの発火を確認');
    await clickUi('#gtmPreview', { kind: 'hand' });
    TA.render('connect');
    if (!Browser.tab('ta')) Browser.addTab({ id: 'ta', title: 'Tag Assistant', url: 'https://tagassistant.google.com/', page: 'ta', fav: 'ta' }, { anim: true });
    else Browser.activate('ta');
    await hold(600);
    await clickUi('#taUrl', { kind: 'text' });
    $('#taUrl').classList.add('focus');
    await typeInto(fieldTarget($('#taUrl')), [{ direct: 'http://localhost:4321/' }], { kps: 16 });
    $('#taUrl').classList.remove('focus');
    await clickUi('#taConnect', { kind: 'hand' });
    TA.tagId = Gtm.cur.tagId;
    TA.render('fired');
    await hold(2600);

    // E4: no data in GA4
    Caption.set('GA4 の DebugView で、イベントが届いているか確認');
    await Browser.clickTab('ga');
    GA.events = [];
    GA.render('debug');
    await hold(2200);
    Caption.issue('計測エラー', 'タグは発火しているのに、GA4（DebugView）にイベントが 1 件も届かない');
    Issue.show($('#gaStream'), '計測エラー：データが届かない');
    await hold(3000);
    await clickUi('#gaAdminBtn');
    GA.render('admin');
    Browser.setUrl('ga', 'https://analytics.google.com/analytics/web/#/{{p478216035}}/admin/streams/table/');
    Issue.hide();
    await hold(700);
    await hoverUi('#gaMid', { kind: 'arrow', hold: 400 });
    Issue.show($('#gaMid'), 'GA4 の測定 ID：G-MEEEN9DKT1');
    await hold(1800);
    Issue.hide();
    await Browser.clickTab('ta');
    await hoverUi('#taMain', { hold: 300 });
    Issue.show($('#taMain'), 'タグ ID：G-MEEN9DKT1（E が 1 つ足りない）');
    Caption.issue('計測エラー', '原因は測定 ID の入力ミス：G-MEE「E」N9DKT1 の E が 1 つ足りなかった');
    await hold(3000);
    Issue.hide();

    // fix
    await Browser.clickTab('gtm');
    await clickUi(Gtm.row(0));
    Gtm.panel({ name: Gtm.cur.name, tagId: Gtm.cur.tagId, trig: 'All Pages' });
    $('#gtmPanel').classList.add('show');
    await realWait(380);
    const idEl = $('#gtmTagId');
    idEl.innerHTML = 'G-MEE<span class="probe"></span>N9DKT1';
    const pr = $('#gtmTagId .probe').getBoundingClientRect();
    Cursor.kind('text');
    await Cursor.moveTo(pr.left, pr.top + pr.height / 2 + 2);
    await Cursor.click();
    idEl.classList.add('focus');
    const fixed = await typeInto(fieldTarget(idEl, { base: 'G-MEE', after: 'N9DKT1' }), [{ direct: 'E' }], { kps: 5 });
    Gtm.cur.tagId = 'G-MEE' + fixed + 'N9DKT1';
    idEl.classList.remove('focus');
    idEl.textContent = Gtm.cur.tagId;
    Issue.ok(idEl, '修正：G-MEEEN9DKT1');
    await hold(1200);
    Issue.hide();
    await clickUi('#gtmSave', { kind: 'hand' });
    $('#gtmPanel').classList.remove('show');
    Gtm.tags[0].date = 'たった今';
    Gtm.tagsView();
    await hold(500);
    await clickUi('#gtmPreview', { kind: 'hand' });
    TA.tagId = Gtm.cur.tagId;
    TA.render('fired');
    Browser.activate('ta');
    await hold(1600);
    await Browser.clickTab('ga');
    GA.events = [];
    GA.render('debug');
    Browser.setUrl('ga', 'https://analytics.google.com/analytics/web/#/{{p478216035}}/admin/debugview');
    await hold(600);
    const evs = [
      { name: 'session_start', pm: '' }, { name: 'first_visit', pm: '' },
      { name: 'page_view', pm: 'page_location: http://localhost:4321/' }, { name: 'user_engagement', pm: 'engagement_time_msec: 1820' },
      { name: 'scroll', pm: 'percent_scrolled: 90' }, { name: 'click', pm: 'link_domain: ne.booking.chillnn.com', conv: true },
    ];
    for (let i = 0; i < evs.length; i++) {
      GA.events.unshift({ ...evs[i], t: `14:1${2 + Math.floor(i / 3)}:${String(5 + i * 7).padStart(2, '0')}` });
      GA.render('debug');
      await hold(520);
    }
    Issue.ok($('#gaStream'), 'イベント受信：page_view / scroll / click');
    Caption.fixed('測定 ID を G-MEEEN9DKT1 に直して再プレビュー → page_view・scroll・予約サイトへの click が届いた');
    await readHold(3000);
    Issue.hide();

    // publish
    Caption.set('コンテナを公開（バージョン名を付けて送信）');
    await Browser.clickTab('gtm');
    await clickUi('#gtmSubmit', { kind: 'hand' });
    Gtm.dialog(`<div class="gtm-dlg-box"><h3>変更を送信</h3><div class="gtm-fl">バージョン名</div><div class="gtm-in" id="gtmVer" style="width:100%;font-family:inherit"></div>
      <div class="gtm-fl">変更内容</div><div style="color:#3c4043">タグを追加：${esc(Gtm.cur.name)}（Google タグ ・ All Pages）</div>
      <div class="row"><span class="gbtn">キャンセル</span><span class="gbtn fill" id="gtmPublish">公開</span></div></div>`);
    await hold(500);
    await clickUi('#gtmVer', { kind: 'text' });
    $('#gtmVer').classList.add('focus');
    await typeInto(fieldTarget($('#gtmVer')), JA.version, { kps: 12 });
    $('#gtmVer').classList.remove('focus');
    await clickUi('#gtmPublish', { kind: 'hand' });
    Gtm.dialog(`<div class="gtm-dlg-box"><div class="gtm-ok">${D.icon('check')}バージョン 4「GA4 計測設定」を公開しました</div>
      <div style="color:#5f6368;margin-top:10px">コンテナ ${S.gtmId} ・ ne-auberge.jp</div><div class="row"><span class="gbtn fill">閉じる</span></div></div>`);
    await hold(2200);
    Gtm.dialog('');
  });

  /* -------------------------------------------------- 6 deploy + live */
  scene('live', async () => {
    Caption.allDone();
    Caption.set('main ブランチに push → Cloudflare で本番（ne-auberge.jp）へデプロイ');
    await Win.switchTo('code', { state: 'max' });
    await Code.panel(true);
    Term.lines.push('');
    Term.render('<span class="caret"></span>');
    await hold(300);
    await Term.run('git add -A', [], { kps: 14 });
    await Term.run(JA.commit, [
      '[main 4f2c9e1] SEO/LLMO基盤とGTM計測を追加', ' 9 files changed, 214 insertions(+), 12 deletions(-)',
    ], { kps: 14 });
    await Term.run('git push origin main', [
      'Enumerating objects: 31, done.', 'Counting objects: 100% (31/31), done.', 'Writing objects: 100% (17/17), 6.81 KiB | 1.70 MiB/s, done.', 400,
      'To github.com:<span class="pii">xxxxxxxxxx</span>/ne-auberge.git', '   9a3e0b7..4f2c9e1  main -&gt; main',
    ], { kps: 15, gap: 160 });
    await hold(1200);
    Notif.show('Cloudflare', '[Cloudflare Pages] Deployment succeeded: ne-auberge (main · 4f2c9e1)', 5200, '', { app: 'Google Chrome', src: 'mail.google.com' });
    await hold(1800);

    await Win.switchTo('browser', { state: 'max' });
    await Browser.newTab('live');
    await Browser.typeUrl('ne-auberge.jp');
    Browser.tab('live').fav = 'site';
    Browser.setPage('live', 'live');
    Browser.setUrl('live', 'https://ne-auberge.jp/');
    Browser.loading('live', true);
    const live = W.live();
    const doc = await SiteView.load(live, { intro: true });
    Browser.loading('live', false);
    Browser.setTitle('live', S.pages[0].ja.title);
    Caption.set('公開サイト：ne-auberge.jp');
    Cursor.kind('arrow');
    await Cursor.moveTo(innerWidth * 0.62, innerHeight * 0.62, { ms: 900 });
    await hold(4600);
    const y = (sel, off = 80) => SiteView.yOf(live, doc.querySelector(sel), off);
    await SiteView.scroll(live, y('.concept', 40), 2200);
    await hold(1600);
    await SiteView.scroll(live, y('.pillars', 60), 2000);
    await hold(500);
    const pl = doc.querySelector('.pillar .p-link');
    await hoverUi(pl, { kind: 'hand', hold: 1100 });
    await SiteView.scroll(live, y('.experience', 60), 2000);
    await hold(900);
    await SiteView.scroll(live, y('.ex-ch:nth-of-type(3)', 120), 2200);
    await hold(500);
    await SiteView.scroll(live, y('.story', 0), 2400);
    await hold(1400);
    await SiteView.scroll(live, y('.gallery', 60), 2000);
    await hold(700);
    await SiteView.scroll(live, y('.access', 60), 1800);
    await hold(1000);
    await SiteView.scroll(live, y('.cta-band', 260), 1800);
    await hold(400);
    await hoverUi(doc.querySelector('.cta-reserve'), { kind: 'hand', hold: 1600 });
    Cursor.kind('arrow');
    await Cursor.moveTo(innerWidth * 0.7, innerHeight * 0.5, { ms: 700 });
    await SiteView.scroll(live, 0, 2600, Ease.inOut);
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
    // Mincho fallback (see engine.js) for the site frames and the parent page (intro card)
    const fontCss = await D.minchoAlias();
    window.SiteFrame.setFontCss(fontCss);
    if (fontCss) document.head.insertAdjacentHTML('beforeend', `<style>${fontCss}</style>`);

    Design.init();
    Code.init();
    await Cms.init(); // the real UIs (js/real-ui.js): Sveltia CMS, the validator, Chrome's view-source page
    Gtm.init();
    GA.render('debug');
    await Val.init();
    await Src.init();
    TA.render('connect');

    // files as they are before the demo types into them
    const F = Code.files, orig = window.CodeFiles.files;
    const set = (p, t) => { F[p].lines = t.split('\n'); };
    set('src/components/home/HomeSections.astro', orig['src/components/home/HomeSections.astro'].replace('<p class="eyebrow">ふたつのこだわり</p>', '<p class="eyebrow"></p>'));
    set('public/robots.txt', S.robots.replace('User-agent: ClaudeBot\nAllow: /\n\n', ''));
    set('public/llms.txt', S.llms.slice(0, S.llms.indexOf('## 営業日と時間')));
    set('src/content/settings/site.json', orig['src/content/settings/site.json'].replace('"url": "https://ne.booking.chillnn.com/ja/"', '"url": ""').replace('"global": "ご予約"', '"global": ""'));
    set('src/content/pages/ja/home.md', orig['src/content/pages/ja/home.md'].replace(/^title: .*$/m, 'title: ""'));

    // design frames (loaded up front; shown when they are "created")
    pc = await Design.addFrame('pc', { x: PCX, y: 0, w: 1440, h: 900, vh: 9, label: 'Desktop', hiddenUntilLoad: true, before: (d) => {
      d.querySelectorAll('main > section:not(.hero), footer.footer').forEach(hide);
      hide(d.querySelector('.hero'));
      ['.lead', '.sub.kv-late'].forEach((s) => invis(d.querySelector(s)));
      hide(d.querySelector('.kv-awards'));
    } });
    sp = await Design.addFrame('sp', { x: SPX, y: 0, w: 1440, h: 900, vh: 9, label: 'Home / PC', hiddenUntilLoad: true });
    Design.fitHeight(sp);
    const v = Design.view();
    Design.cam = { x: PCX + 720 - v.w / 2 / 0.5, y: -200, z: 0.5 };
    Design.apply();

    // fonts: every glyph the frames will draw (page text + typed kana + candidates)
    const jaText = JSON.stringify(JA) + Object.values(JA).flat().filter((s) => s && s.r).map((s) => D.romajiToKana(s.r).kana).join('');
    await Promise.all([
      D.preloadFontText(pc.doc, pc.doc.body.textContent + jaText),
      D.preloadFontText(sp.doc, sp.doc.body.textContent),
      D.preloadFontText(document, $('#intro').textContent + 'Né'),
    ]);
    // photos used by the live site: decode before recording (already cached after a seek-reload)
    if (!fast) await Promise.all(['Ne_226_PR', 'Ne_222_PR', 'Ne_0156', 'Ne_0040', 'Ne_24'].map((p) => new Promise((r) => { const i = new Image(); i.onload = i.onerror = r; i.src = `assets/photos/${p}.webp`; })));
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
