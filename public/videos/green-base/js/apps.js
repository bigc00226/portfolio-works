/*
 * The screens of this video on top of the shared Shopify kit (shared/kit/kit.js):
 *   TS     — the real Shopify Theme Store (themes.shopify.com, captured: js/themestore-snapshot.js, shown by js/themestore-frame.js)
 *   Views  — the Shopify admin pages: themes, custom data (metaobject definition "植物", product metafield definition),
 *            metaobject entries, a product with its metafields
 * The care texts and products come from js/files.js (the live store's own data).
 */
(function () {
  'use strict';
  const D = window.Demo, K = window.Kit, F = window.FILES, S = window.SITE_SNAPSHOT;
  const { $, $$, esc, icon, tween, Ease } = D;
  const { H } = K;
  const img = Object.fromEntries((S.products || []).map((p) => [p.handle, p.image]));
  const yen = (v) => Number(v).toLocaleString('ja-JP') + ' 円';

  /* ===================================================================== theme store (the real site) */
  // The theme library cards of the admin still use these small wireframes (the admin itself is a reconstruction).
  const THEMES = [
    { name: 'Flow', by: 'Eight Themes', paid: true, c: ['#e9efe6', '#2f5d3a', '#b9cfa9', '#6f8f62'] },
    { name: 'Dawn', by: 'Shopify', paid: false, c: ['#f3f3f3', '#222', '#cfcfcf', '#8a8a8a'] },
  ];
  const wire = (t, big) => `<div class="tsw${big ? ' big' : ''}" style="--a:${t.c[0]};--b:${t.c[1]};--c:${t.c[2]};--d:${t.c[3]}"><div class="tsw-bar"><i></i><u></u><u></u><u></u></div><div class="tsw-hero"><b></b><s></s></div><div class="tsw-row"><span></span><span></span><span></span><span></span></div>${big ? '<div class="tsw-row two"><span></span><span></span></div>' : ''}</div>`;
  // themes.shopify.com as captured (1920 × 947 = this Chrome window's page area): the list filtered by 業種「ガーデン」
  // (its header search opens over it), the Flow page with the desktop preview, and after 「モバイル版」 was clicked
  const KEYS = ['list', 'flow', 'flowSp'];
  $('#brContent').insertAdjacentHTML('afterbegin', `
    <div class="br-page" data-page="ts"><div class="ts" id="ts">${KEYS.map((k, i) => `<iframe class="ts-frame${i ? '' : ' on'}" data-ts="${k}" title="Shopify テーマストア" tabindex="-1"></iframe>`).join('')}</div></div>`);
  const TS = {
    docs: {},
    cur: 'list',
    frame(k = this.cur) { return $(`.ts-frame[data-ts="${k}"]`); },
    win(k = this.cur) { return this.frame(k).contentWindow; },
    doc(k = this.cur) { return this.docs[k]; },
    /** an element of a captured page (the first one that is drawn) */
    el(sel, k = this.cur) { return [...this.doc(k).querySelectorAll(sel)].find((e) => e.getBoundingClientRect().width > 0) || null; },
    /** an element by its text (exact, trimmed) */
    text(sel, t, k = this.cur) { return [...this.doc(k).querySelectorAll(sel)].find((e) => e.textContent.trim() === t && e.getBoundingClientRect().width > 0) || null; },
    async load() { for (const k of KEYS) this.docs[k] = await window.TSFrame.load(this.frame(k), k); },
    /** shows a captured page (instantly: all three are loaded up front) with its real title and address */
    show(k) {
      this.cur = k;
      $$('.ts-frame').forEach((f) => f.classList.toggle('on', f.dataset.ts === k));
      const p = window.TSFrame.page(k);
      if (K.Browser.tab('ts')) K.Browser.nav('ts', { title: p.title, url: p.url });
    },
    async scroll(y, ms = 1100, k = this.cur) {
      const w = this.win(k), s = w.scrollY;
      await tween(ms, (e) => w.scrollTo(0, s + (y - s) * e), Ease.inOut);
    },
    yOf(el, k = this.cur) { return el.getBoundingClientRect().top + this.win(k).scrollY; },
    search(state) { window.TSFrame.search(this.doc('list'), state); },
  };

  /* ===================================================================== admin views */
  const V = {
    themes(o = {}) {
      const live = o.flowLive ? 'Flow' : 'Dawn';
      const lib = o.flow === false ? [] : [o.flowLive ? { n: 'Dawn', v: '15.0.0', d: '前回のライブテーマ' } : { n: 'Flow', v: '39.9.1', d: o.edited ? '最終保存：11月4日 15:12' : '試用版・テーマストアから追加' }];
      const card = (t, isLive) => `<div class="gb-th${isLive ? ' live' : ''}" data-th="${esc(t)}"><div class="gb-th-img">${wire(THEMES.find((x) => x.name === t), false)}</div><div class="gb-th-b"><b>${esc(t)}</b>${isLive ? H.badge('ライブ', 'ok') : ''}<p class="sa-mute">${isLive ? (o.flowLive ? '11月4日 15:40 に公開' : '現在ストアに表示中') : ''}</p></div><div class="gb-th-a">${H.btn('…')}${H.btn('カスタマイズ', { pri: isLive })}</div></div>`;
      return H.page({ title: 'テーマ', actions: [H.btn('テーマストアを見る', { icon: 'external' })] },
        H.card('現在のテーマ', card(live, true)) +
        H.card('テーマライブラリ', lib.length ? lib.map((t) => `<div class="gb-lib" data-lib="${esc(t.n)}">${H.thumb('', { bg: '#e9efe6' })}<div><b>${esc(t.n)}</b> <span class="sa-mute">${t.v}</span><div class="sa-mute">${esc(t.d)}</div></div><span class="sp"></span>${o.flowLive ? '' : H.btn('公開', { id: 'libPublish' })}${H.btn('カスタマイズ', { id: 'libCustomize' })}</div>`).join('') : '<p class="sa-mute">テーマライブラリにテーマはありません。</p>', { id: 'libCard' }));
    },
    customData() {
      const res = [['商品', 'tag', 0], ['バリエーション', 'tag', 0], ['コレクション', 'grid', 0], ['顧客', 'user', 0], ['注文', 'inbox', 0], ['ページ', 'doc', 0], ['ブログ記事', 'doc', 0]];
      return H.page({ title: 'カスタムデータ' },
        H.card('メタフィールドの定義', '<p class="sa-mute">ストアのリソースに独自の項目を追加します。</p>' + res.map(([n, i, c]) => `<div class="gb-res" data-res="${esc(n)}"><i data-ic="${i}"></i>${esc(n)}<span class="sp"></span><span class="sa-mute">${c}</span>${icon('chevron-right')}</div>`).join(''), { id: 'cdRes' }) +
        H.card('メタオブジェクトの定義', '<p class="sa-mute">複数のリソースで使う構造化されたデータ（例：植物ごとの育て方）を作成します。</p>' + `<div class="gb-res" id="cdMoAdd">${icon('plus')}定義を追加</div>`, { id: 'cdMo' }));
    },
    moDef(fields, o = {}) {
      const rows = fields.map((f) => `<div class="gb-fd${o.newKey === f[1] ? ' new' : ''}" data-key="${esc(f[1])}"><span class="gb-fd-ic">${f[3] ? K.ic('sort') : icon('text')}</span><div><b>${esc(f[0])}</b><div class="sa-mute"><code>${esc(f[1])}</code> ・ ${esc(f[2])}</div></div><span class="sp"></span>${icon('menu-dots')}</div>`).join('');
      return H.page({ title: o.saved ? '植物' : 'メタオブジェクトの定義を追加', back: true },
        `<div class="sa-grid"><div>
          ${H.card('', `<div class="sa-row">${H.field('名前', o.name || '', { id: 'moName', ph: '例：植物' })}${H.field('タイプ', o.type || '', { id: 'moType', ph: '例：plant', hint: 'Liquid と API で使う識別子' })}</div>`)}
          ${H.card('フィールド', (rows || '<p class="sa-mute" id="fdEmpty">フィールドがありません</p>') + `<div class="gb-res add" id="fdAdd">${icon('plus')}フィールドを追加</div>`, { id: 'fdCard' })}
        </div><div>
          ${H.card('アクセス', '<div class="sa-f"><span class="sa-ck on"></span>　ストアフロント（Liquid）でアクセスする</div><div class="sa-f"><span class="sa-ck"></span>　Storefront API でアクセスする</div>')}
          ${H.card('オプション', '<div class="sa-f"><span class="sa-ck on"></span>　翻訳を有効にする</div><div class="sa-f"><span class="sa-ck"></span>　Web ページとして公開する</div>')}
        </div></div>`);
    },
    fieldModal(stage) {
      if (stage === 'type') {
        const t = (n, d, i) => `<div class="gb-ty" data-ty="${esc(n)}"><span class="gb-fd-ic">${icon(i)}</span><div><b>${esc(n)}</b><div class="sa-mute">${esc(d)}</div></div></div>`;
        return `<div class="gb-tys">${t('1 行テキスト', '名前・短い値', 'text')}${t('複数行テキスト', '説明・段落', 'align-c')}${t('リッチテキスト', '書式付きの文章', 'type')}${t('整数', '数量・順位', 'variable')}${t('ファイル', '画像・PDF', 'image')}${t('真偽値', 'はい / いいえ', 'check')}</div>`;
      }
      return `${H.field('名前', '', { id: 'fdName', ph: '例：日当たり' })}${H.field('キー', '', { id: 'fdKey', ph: '例：hiatari', hint: 'Liquid では <code>plant.キー</code> で参照します' })}
        <div class="sa-f"><span class="sa-ck" id="fdList"></span>　値のリストを保存する（複数の値）</div>`;
    },
    productMfDef(o = {}) {
      return H.page({ title: '商品のメタフィールドの定義を追加', back: true },
        H.card('', `${H.field('名前', o.name || '', { id: 'pmName', ph: '例：植物' })}${H.field('ネームスペースとキー', o.key || '', { id: 'pmKey', ph: 'custom.' })}${H.field('説明', '育て方のデータ（植物ごとに 1 件）', { ta: false })}
          <div class="sa-f"><label>タイプ</label><div class="sa-in sel" id="pmType"><span class="v">${esc(o.type || 'タイプを選択')}</span></div></div>
          ${o.type ? `<div class="sa-f"><label>メタオブジェクトの定義</label><div class="sa-in sel"><span class="v">植物</span></div></div>` : ''}`) +
        H.card('オプション', '<div class="sa-f"><span class="sa-ck on"></span>　ストアフロントでアクセスする</div><div class="sa-f"><span class="sa-ck on"></span>　テーマエディタの動的ソースで使う</div>'));
    },
    entries(list) {
      return H.page({ title: '植物', back: true, actions: [H.btn('エントリを追加', { pri: true, id: 'enAdd' })] },
        H.card('', list.length ? H.table([['', 'ck'], '表示名', '日当たり', '更新日'], list.map((e) => [H.ck(), `<b>${esc(e.name)}</b>`, `<span class="sa-mute">${esc(e.hiatari.slice(0, 26))}…</span>`, '11月4日'])) : `<div class="sa-empty big"><div class="sa-empty-art">${K.ic('cube')}</div><h3>植物のエントリを追加しましょう</h3><p>植物ごとに育て方を 1 件ずつ登録し、商品から参照します。</p></div>`, { flush: true }));
    },
    entry(vals = {}) {
      const f = (name, key, o = {}) => `<div class="sa-f" data-f="${key}"><label>${esc(name)}</label><div class="sa-in${o.ta ? ' ta' : ''}" id="en_${key}"><span class="v">${esc(vals[key] || '')}</span></div>${o.hint ? `<div class="hint">${o.hint}</div>` : ''}</div>`;
      const list = (vals.hanakotoba || []).map((x) => `<span class="sa-tag">${esc(x)}</span>`).join('');
      return H.page({ title: vals.name ? `植物：${vals.name}` : '植物のエントリを追加', back: true, badge: H.badge('アクティブ', 'ok') },
        `<div class="sa-grid"><div>${H.card('', f('表示名', 'name') + f('日当たり', 'hiatari', { ta: true }) + f('みずやり', 'mizuyari', { ta: true }) + f('原産地', 'gensanchi') +
          `<div class="sa-f" data-f="hanakotoba"><label>花言葉（リスト）</label><div class="sa-in" id="en_hanakotoba">${list}<span class="v"></span></div><div class="hint">Enter で値を追加</div></div>` +
          f('気温', 'kion', { ta: true }) + f('注意', 'chuui', { ta: true }) + f('ペット・赤ちゃん', 'pet'), { id: 'enCard' })}</div><div>
          ${H.card('参照している商品', vals.refs ? vals.refs.map((r) => `<div class="gb-ref">${H.thumb(img[r.handle] || '', { sm: true })}<span>${esc(r.title)}</span></div>`).join('') : '<p class="sa-mute">まだ参照されていません</p>', { id: 'enRefs' })}
        </div></div>`);
    },
    product(p, o = {}) {
      const tags = ['DIFFICULITY_易しい', 'FAMILY_ペット', 'INTERIOR_テーブルグリーン', 'LEEF_パラパラ', 'LIGHT_暗い', 'MERIT_おしゃれな鉢とセット', 'MERIT_スタッフが植え替えてから発送', 'SIZE_〜50cm', 'TYPE_観葉植物'];
      return H.page({ title: p.title, back: true, badge: H.badge('アクティブ', 'ok'), actions: [H.btn('複製'), H.btn('プレビュー'), H.btn('その他の操作')] },
        `<div class="sa-grid"><div>
          ${H.card('', H.field('タイトル', p.title) + H.field('説明', p.body, { ta: true }) + `<label class="sa-lbl">メディア</label><div class="sa-media"><span class="sa-th big" style="background-image:url('${esc(img[p.handle] || '')}')"></span><span class="sa-media-add">${icon('plus')}</span></div>`)}
          ${H.card('価格', `<div class="sa-row">${H.field('価格', Number(p.price).toLocaleString(), { pre: '¥' })}${H.field('割引前の価格', '', { pre: '¥' })}</div>`)}
          ${H.card('商品のメタフィールド', `<div class="gb-mf" id="pmRow"><span class="gb-mf-k">植物<small>custom.plant</small></span><div class="sa-in sel" id="pmPick"><span class="v">${o.plant ? `<span class="gb-ent">${K.ic('cube')}パキラ</span>` : ''}</span>${o.plant ? '' : '<span class="ph">エントリを選択</span>'}</div></div>`, { id: 'pmCard' })}
        </div><div>
          ${H.card('ステータス', '<div class="sa-in sel"><span class="v">アクティブ</span></div>')}
          ${H.card('商品整理', H.field('販売元', 'GREEN BASE') + H.field('タグ', tags.map((t) => `<span class="sa-tag">${esc(t)}</span>`).join(''), { html: true }))}
        </div></div>`);
    },
  };

  window.GB = { TS, V, THEMES, wire, img, yen };
})();
