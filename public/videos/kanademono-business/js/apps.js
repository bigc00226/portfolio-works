/*
 * The screens of this video on top of the shared Shopify kit (shared/kit/kit.js):
 *   V        — Shopify admin pages: companies (B2B), a company (+ the app's block 「法人会員の申請」), catalog,
 *              draft orders, a draft order + invoice, the Flow workflow for the staff notification
 *   Mail     — a webmail look-alike (no logos): the staff notification, the welcome mail, the quote mail
 *   Acct     — the store's real customer-account login page (captured: js/account-snapshot.js), its code step, the orders page
 *   Pdf      — the quotes (御見積書) as real PDFs in Chrome's own PDF viewer (captured: js/quote-pdfs.js, assets/pdf/)
 *   B2BStore — what is added to the captured storefront: the 法人様会員登録フォーム (dev version), the 法人価格 block
 * Contents come from js/files.js (the store's own products and prices; the company and documents are made up).
 */
(function () {
  'use strict';
  const D = window.Demo, K = window.Kit, F = window.FILES;
  const { $, $$, esc, icon, wait } = D;
  const { H } = K;
  const S = window.SITE_SNAPSHOT || { products: [] };
  const img = Object.fromEntries((S.products || []).map((p) => [p.handle, p.image]));
  const yen = (v) => '¥' + Math.round(Number(v)).toLocaleString('ja-JP');
  const tax = (v) => Math.floor((v * 10) / 110);

  /* ============================================================ extra browser pages: mail + PDF viewer */
  $('#brContent').insertAdjacentHTML('afterbegin', `
    <div class="br-page" data-page="mail"><div class="wm" id="wm">
      <aside class="wm-side"><div class="wm-compose"><i data-icon="pencil"></i>作成</div>
        <div class="wm-f on"><i data-ic="inbox"></i>受信トレイ<b id="wmCount"></b></div><div class="wm-f"><i data-icon="star"></i>スター付き</div><div class="wm-f"><i data-ic="clock"></i>スヌーズ中</div><div class="wm-f"><i data-icon="arrow-right"></i>送信済み</div><div class="wm-f"><i data-icon="file"></i>下書き</div>
        <div class="wm-lbl">ラベル</div><div class="wm-f"><i data-icon="tag"></i>法人会員</div><div class="wm-f"><i data-icon="tag"></i>見積もり</div></aside>
      <main class="wm-main"><div class="wm-search"><i data-icon="search"></i>メールを検索</div><div class="wm-body" id="wmBody"></div></main>
    </div></div>
    <div class="br-page" data-page="acct"><div class="ac" id="ac"><iframe id="acFrame" title="ログイン - KANADEMONO"></iframe><div class="ac-home" id="acHome" hidden></div></div></div>
    <div class="br-page" data-page="pdf"><div class="pv" id="pv"><img id="pvImg" alt=""><div id="pvSpots"></div></div></div>`);

  /* ===================================================================== admin views */
  const CO = F.COMPANY;
  const V = {
    companiesEmpty() {
      return H.page({ title: '会社', actions: [H.btn('会社を追加', { pri: true })] },
        H.card('', `<div class="sa-empty big"><div class="sa-empty-art">${K.ic('building')}</div><h3>B2B の取引先（会社）を管理</h3><p>会社ごとにロケーション・連絡先・カタログ（価格リスト）・支払い条件を設定できます。</p></div>`));
    },
    companies(rows) {
      return H.page({ title: '会社', actions: [H.btn('エクスポート'), H.btn('会社を追加', { pri: true })] },
        H.card('', `<div class="sa-tools">${icon('search')}<span>会社を検索</span><span class="sp"></span><span>${rows.length} 社</span></div>` +
          H.table([['', 'ck'], '会社', 'ロケーション', 'メインの連絡先', 'カタログ', '支払い条件', ['注文', 'num']], rows.map((r) => [H.ck(), `<b>${r.name ? esc(r.name) : '<span class="kb-blank">（名称なし）</span>'}</b>`, '本社', '山田 太郎', r.catalog ? H.badge(r.catalog, 'info') : '<span class="sa-mute">なし</span>', r.terms || '<span class="sa-mute">なし</span>', '0']), { id: 'coTable', rowId: (r, i) => 'r' + i }), { flush: true }));
    },
    company(o = {}) {
      const name = o.blank ? '（名称なし）' : CO;
      const loc = H.table(['ロケーション', 'カタログ', '支払い条件', '配送先'], [['<b>本社</b>', o.catalog ? H.badge('法人卸 15%OFF', 'info') : '<span class="sa-mute">なし</span>', o.terms ? '30日以内（Net 30）' : '<span class="sa-mute">なし</span>', '<span class="pii">東京都渋谷区 ・・・</span>']], { id: 'coLoc' });
      return H.page({ title: name, back: true, badge: o.approved ? H.badge('承認済み', 'ok') : H.badge('承認待ち', 'att'), actions: [H.btn('その他の操作')] },
        `<div class="sa-grid"><div>
          ${H.card('概要', H.kv([['会社名', o.blank ? '<span class="kb-blank">（空欄）</span>' : esc(CO)], ['メモ', '業種：IT・通信 / 時期：1か月以内'], ['顧客になった日', '2026年9月15日']]), { id: 'coSum' })}
          ${H.card('ロケーション', loc + `<div style="margin-top:10px;display:flex;gap:8px">${H.btn('カタログを追加', { id: 'coAddCat', off: o.catalog })}${H.btn('支払い条件を編集', { id: 'coTerms' })}</div>`, { id: 'coLocCard' })}
          ${H.card('連絡先', H.table(['名前', 'メール', '役職', '権限'], [['山田 太郎', 'b2b+testlab@kanademono.design', '総務部', H.badge(o.role || '注文のみ', o.role ? 'info' : '')]], { id: 'coContacts' }))}
        </div><div>
          ${H.card(`<span class="kb-appic">K</span>法人会員の申請`, o.approved
            ? `<p>${H.badge('承認済み', 'ok')}</p><p class="sa-mute">登録完了メールを送信しました。ご担当者はログイン画面でメールアドレスを入力し、ワンタイムパスワードでログインできます。</p>`
            : `<p>${H.badge('承認待ち', 'att')}</p><p class="sa-mute">法人様会員登録フォームからの申請（App Proxy）。カタログと支払い条件を設定してから承認します。</p>${H.btn('承認して登録完了メールを送信', { pri: true, id: 'coApprove', off: !(o.catalog && o.terms) })}`, { id: 'coApp' })}
          ${H.card('カタログ', o.catalog ? `<p><b>法人卸 15%OFF</b></p><p class="sa-mute">価格の調整：-15%（【B2B】割引表記なし の商品は固定価格）</p>` : '<p class="sa-mute">この会社に割り当てられたカタログはありません。</p>', { id: 'coCatCard' })}
          ${H.card('支払い条件', o.terms ? '<p><b>30日以内（Net 30）</b></p><p class="sa-mute">注文後に請求書を発行し、30 日以内のお支払い</p>' : '<p class="sa-mute">設定されていません（注文時にお支払い）</p>', { id: 'coTermCard' })}
        </div></div>`);
    },
    catalogModal(state) {
      return `${H.field('タイトル', state.title || '', { id: 'catTitle', ph: '例：法人卸価格' })}
        <div class="sa-f"><label>価格の調整</label><div class="sa-row"><div class="sa-in sel" id="catAdj"><span class="v">${state.adj || '値下げ'}</span></div><div class="sa-in" id="catPct"><span class="v">${esc(state.pct || '')}</span><span class="sf">%</span></div></div>
          <div class="hint">カタログのすべての商品の価格を一律で調整します。</div></div>
        <div class="sa-f"><label>商品</label><div class="sa-choice on"><span class="sa-rd"></span><div><b>すべての商品</b><p class="sa-mute">ストアのすべての商品（新しく追加した商品も含む）</p></div></div>
          <div class="sa-choice${state.fixed ? ' on' : ''}" id="catFixed"><span class="sa-rd"></span><div><b>固定価格の商品を指定</b><p class="sa-mute">タグ「【B2B】割引表記なし」の商品は、調整せず通常価格のまま</p></div></div></div>
        <div class="sa-f"><label>割り当て</label><div class="sa-pill">${K.ic('building')}${esc(CO)} › 本社</div></div>`;
    },
    drafts(rows) {
      return H.page({ title: '下書き注文', actions: [H.btn('下書き注文を作成', { pri: true })] },
        H.card('', `<div class="sa-tabs"><span class="on">すべて</span><span>未完了</span><span>請求書送付済み</span><span>完了</span></div>` +
          H.table([['', 'ck'], '下書き注文', '日付', '顧客', 'ステータス', ['合計', 'num']], rows.map((r) => [H.ck(), `<b>${r.name}</b> <span class="sa-tag">カンタン見積もり</span>`, r.date, `${K.ic('building')} ${esc(CO)}`, r.sent ? H.badge('請求書送付済み', 'info') : H.badge('未完了', 'att'), yen(r.total)]), { id: 'drTable', rowId: (r, i) => rows[i].name.replace('#', '') }), { flush: true }));
    },
    draft(o = {}) {
      const b2b = !!o.b2b;
      const rows = F.QUOTE.map((it) => {
        const p = b2b ? it.b2b : it.price;
        return [`<span class="sa-pn">${H.thumb(img[it.h] || '', { sm: true })}<span>${esc(it.name)}</span></span>`,
          (b2b && p !== it.price ? `<s class="sa-mute">${yen(it.price)}</s> ` : '') + yen(p), `× ${it.qty}`, `<span class="num">${yen(p * it.qty)}</span>`];
      });
      const total = b2b ? F.TOTAL_B2B : F.TOTAL_RETAIL;
      return H.page({ title: o.name || '#D1024', back: true, badge: o.sent ? H.badge('請求書送付済み', 'info') : H.badge('未完了', 'att'), actions: [H.btn('複製'), H.btn('その他の操作')] },
        `<div class="sa-grid"><div>
          ${H.card('商品', H.table(['商品', '単価', '数量', ['合計', 'num']], rows, { id: 'dfItems' }) + (b2b ? `<p class="sa-mute" style="margin:10px 0 0">${K.ic('tag')} カタログ「法人卸 15%OFF」の価格</p>` : ''), { id: 'dfItemsCard' })}
          ${H.card('支払い', H.kv([['小計', yen(total)], ['配送', '無料'], ['消費税（10%・内税）', yen(tax(total))], ['合計', `<b id="dfTotal">${yen(total)}</b>`]]) +
            `<div class="sa-hr"></div><p class="sa-mute">${b2b ? '支払い条件：30日以内（Net 30）— 請求書のリンクから注文すると、支払い期日つきの注文になります。' : '支払い条件：なし'}</p>
            <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:8px">${H.btn('請求書を送信', { id: 'dfInvoice' })}${H.btn('支払い期日つきで注文を作成', { pri: true, off: !b2b })}</div>`, { id: 'dfPay' })}
        </div><div>
          ${H.card('会社', `<p><b>${esc(CO)}</b></p><p class="sa-mute">本社 ・ 山田 太郎</p>${b2b ? `<p>${H.badge('法人卸 15%OFF', 'info')}</p>` : '<p class="sa-mute">（会社が設定されていません）</p>'}`, { id: 'dfCo' })}
          ${H.card('メモ', `<p>スタイリング「${esc(F.STYLING)}」から作成</p>`)}
          ${H.card('タグ', '<span class="sa-tag">カンタン見積もり</span>')}
        </div></div>`);
    },
    invoiceModal() {
      return H.field('宛先', 'b2b+testlab@kanademono.design', { html: true }) + H.field('送信元', 'KANADEMONO for BUSINESS <b2b@kanademono.design>') +
        H.field('件名', `御見積書・ご請求書（#D1024）— ${esc(F.STYLING)}`, { html: true }) +
        H.field('カスタムメッセージ', 'このたびはお見積もりのご依頼をいただき、ありがとうございます。下記のリンクからご注文いただけます（お支払いは 30 日以内の請求書払い）。', { ta: true });
    },
    catalog() {
      const list = (S.catalog || []).filter((p) => p.tags.some((t) => /【B2B】/.test(t)) && p.vs.length).slice(0, 10);
      const rows = list.map((p) => {
        const fixed = p.tags.some((t) => /割引表記なし/.test(t));
        const pr = Math.round(+p.vs[0][1]);
        return [`<span class="sa-pn"><span>${esc(p.t.replace(/\s+/g, ' '))}</span></span>`, `<span class="sa-mute">${esc(p.v)}</span>`, yen(pr), fixed ? `${yen(pr)} ${H.badge('固定価格', '')}` : `<b>${yen(Math.round(pr * 0.85))}</b>`];
      });
      return H.page({ title: '法人卸 15%OFF', back: true, badge: H.badge('アクティブ', 'ok'), actions: [H.btn('その他の操作')] },
        `<div class="sa-grid"><div>${H.card('価格', `<p class="sa-mute">価格の調整：<b>-15%</b>（値下げ）。タグ「【B2B】割引表記なし」の商品は固定価格（通常価格のまま）。</p>` + H.table(['商品', '販売元', '通常価格', 'カタログの価格'], rows, { id: 'ctTable' }), { id: 'ctCard' })}</div>
          <div>${H.card('割り当て', `<div class="sa-pill">${K.ic('building')}${esc(CO)} › 本社</div>`)}${H.card('通貨', '<p>日本円（JPY ¥）</p>')}${H.card('数量ルール', '<p class="sa-mute">なし（1 個から注文できます）</p>')}</div></div>`);
    },
    notifyList() {
      const row = (t, d, id) => `<div class="kb-nt"${id ? ` id="${id}"` : ''}><b>${t}</b><span class="sa-mute">${d}</span>${K.ic('external')}</div>`;
      return H.page({ title: '通知' }, `${H.card('お客様への通知', row('注文の確認', '注文したお客様に送信') + row('下書き注文の請求書', '下書き注文から請求書を送ったとき') + row('B2B アクセスのメール', '会社の連絡先がログインできるようになったとき（登録完了メール）', 'ntB2B') + row('ログインの確認コード', 'ワンタイムパスワードのメール'))}
        ${H.card('スタッフへの通知', row('新しい注文', 'b2b@kanademono.design'))}`);
    },
    notifyEdit() {
      return H.page({ title: 'B2B アクセスのメール', back: true, actions: [H.btn('プレビュー'), H.btn('テストメールを送信')] },
        H.card('', H.field('メールの件名', '【{{ shop.name }} for BUSINESS】法人会員登録が完了しました') + '<label class="sa-lbl">メールの本文（HTML）</label><div class="kf-code tall" id="ntBody"></div>'));
    },
    themes() {
      const row = (n, sub, live, id) => `<div class="kb-theme"><div class="kb-theme-th"></div><div><b>${esc(n)}</b>${live ? ' ' + H.badge('公開中', 'ok') : ''}<p class="sa-mute">${sub}</p></div><span class="sp"></span>${H.btn('カスタマイズ', { id, pri: !live })}</div>`;
      return H.page({ title: 'テーマ' },
        H.card('', row('kanademono-v2/main', 'Impulse 2.4.0 ・ GitHub と連携', true, 'thLive')) +
        H.card('テーマライブラリ', row('kanademono-v2/b2b（開発）', 'Impulse 2.4.0 ・ 法人様会員登録フォーム・法人価格を追加中', false, 'thDev')));
    },
    order() {
      const rows = F.QUOTE.map((it) => [`<span class="sa-pn">${H.thumb(img[it.h] || '', { sm: true })}<span>${esc(it.name)}</span></span>`, yen(it.b2b), `× ${it.qty}`, `<span class="num">${yen(it.b2b * it.qty)}</span>`]);
      return H.page({ title: '#1043', back: true, badge: H.badge('支払い待ち', 'att', { dot: true }) + ' ' + H.badge('未発送', 'att', { dot: true }), actions: [H.btn('返金'), H.btn('編集'), H.btn('その他の操作')] },
        `<div class="sa-grid"><div>
          ${H.card('未発送（' + F.QUOTE.reduce((a, it) => a + it.qty, 0) + '）', H.table(['商品', '単価', '数量', ['合計', 'num']], rows))}
          ${H.card(`${H.badge('支払い待ち', 'att', { dot: true })}`, H.kv([['小計', yen(F.TOTAL_B2B)], ['配送', '無料'], ['合計', `<b>${yen(F.TOTAL_B2B)}</b>`], ['支払い条件', '30日以内（Net 30）'], ['支払い期日', '<b id="odDue">2026年10月15日</b>']]) + `<div style="display:flex;gap:8px;justify-content:flex-end;margin-top:10px">${H.btn('請求書を送信')}${H.btn('支払い済みにする')}</div>`, { id: 'odPay' })}
        </div><div>
          ${H.card('会社', `<p><b>${esc(CO)}</b></p><p class="sa-mute">本社 ・ 山田 太郎</p><p>${H.badge('法人卸 15%OFF', 'info')}</p>`, { id: 'odCo' })}
          ${H.card('メモ', '<p>下書き注文 #D1024（カンタン見積もり）から作成</p>')}
          ${H.card('タイムライン', '<div class="kb-tl" id="odTl"><p><b>14:09</b> 請求書のリンクから注文しました（支払い期日 10月15日）</p><p><b>14:06</b> 下書き注文 #D1024 の請求書を送信しました</p><p><b>13:58</b> KANADEMONO B2B が下書き注文 #D1024 を作成しました（カンタン見積もり）</p></div>')}
        </div></div>`);
    },
    flow(on) {
      const node = (cls, t, d) => `<div class="kf-node ${cls}"><b>${t}</b><span>${d}</span></div>`;
      return H.page({ title: '法人会員の申請 → 担当者へ通知', back: true, badge: on ? H.badge('有効', 'ok') : H.badge('オフ'), actions: [H.btn(on ? '無効にする' : 'ワークフローを有効にする', { pri: !on, id: 'kfOn' })] },
        `<div class="kf"><div class="kf-canvas">${node('trg', 'トリガー', '会社が作成された')}<i class="kf-line"></i>${node('cond', '条件', '会社のメモに「業種」が含まれる')}<i class="kf-line"></i>${node('act', 'アクション', '社内メールを送信 → b2b@kanademono.design')}</div>
          <div class="kf-side"><h3>社内メールを送信</h3>${H.field('件名', '【法人会員登録】{{ company.name }} 様から申請がありました')}<label class="sa-lbl">メッセージ</label><div class="kf-code" id="kfBody"></div></div></div>`);
    },
  };

  /* ========================================================================= mail */
  const Mail = {
    list: [],
    render(o = {}) {
      const unread = this.list.filter((m) => !m.read).length;
      $('#wmCount').textContent = unread || '';
      $('#wmBody').innerHTML = o.open != null ? this.reading(this.list[o.open]) :
        `<div class="wm-list">${this.list.map((m, i) => `<div class="wm-row${m.read ? '' : ' unread'}${i === o.newIdx ? ' new' : ''}" data-mail="${i}"><span class="wm-star">${icon('star')}</span><span class="wm-from">${esc(m.from)}</span><span class="wm-subj"><b>${esc(m.subject)}</b> — <span class="sa-mute">${esc(m.snippet)}</span></span>${m.att ? `<span class="wm-att">${icon('file')}</span>` : ''}<span class="wm-date">${esc(m.time)}</span></div>`).join('')}</div>`;
      D.hydrateIcons($('#wmBody'));
    },
    reading(m) {
      return `<div class="wm-read"><div class="wm-tools"><span data-back>${icon('arrow-left')}</span>${icon('download')}${icon('alert')}${icon('x-circle')}</div>
        <h2>${esc(m.subject)} <span class="sa-tag">${esc(m.label || '受信トレイ')}</span></h2>
        <div class="wm-hd"><span class="wm-av">${esc(m.from[0])}</span><div><b>${esc(m.from)}</b> <span class="sa-mute">&lt;${esc(m.addr)}&gt;</span><div class="sa-mute">To: ${m.to}</div></div><span class="wm-date">${esc(m.time)}</span></div>
        <div class="wm-text" id="wmText">${m.html}</div>
        ${m.att ? `<div class="wm-attach" id="wmAttach"><div class="wm-pdf">${icon('file')}<b>PDF</b></div><span>${esc(m.att)}</span></div>` : ''}</div>`;
    },
    add(m) { this.list.unshift({ read: false, ...m }); },
  };

  /* ======================================================= customer account login (new customer accounts) */
  // The login page is the store's real one: js/account-snapshot.js (tools/snapshots/kanademono-business/capture-account.js),
  // drawn in a frame. The code step cannot be captured without sending a code to a real address, so it is that same page
  // with the texts the page itself uses for it (its ja locale: 「コードを入力」「{{email}}に送信されました」「6桁のコード」
  // 「別のメールアドレスでログインする」). The orders page after the login is a reconstruction in the page's own look
  // (fonts and colours of the captured page).
  const AS = window.ACCOUNT_SNAPSHOT;
  const BASE = location.href.replace(/[?#].*$/, '').replace(/[^/]*$/, '');
  const ACC_CSS = 'html{scrollbar-width:none}.demo-caret{position:fixed;width:1.5px;background:#000;pointer-events:none;animation:dcb 1s steps(1) infinite}.demo-caret[hidden]{display:none}@keyframes dcb{50%{opacity:0}}';
  const chainOf = (el, n) => { const out = []; for (let e = el; e && out.length < n; e = e.parentElement || (e.getRootNode() !== e.ownerDocument ? e.getRootNode().host : null)) out.push(e); return out; };
  const Acct = {
    doc: null,
    // where shopify.com/25419644990/account redirects (as captured; its one-time trace id is the same inside redirect_uri)
    loginUrl: AS.url.replace('analytics_trace_id=…', 'analytics_trace_id=' + ((AS.url.match(/analytics_trace_id%3D([0-9a-f-]+)/) || [])[1] || '')),
    /** the real login page (its own markup and styles) */
    load() {
      const f = $('#acFrame');
      $('#acHome').hidden = true; f.hidden = false;
      const attrs = AS.htmlAttrs.map(([k, v]) => `${k}="${esc(v)}"`).join(' ');
      const hold = window.Stage ? window.Stage.hold : (p) => p;
      return hold(new Promise((resolve) => {
        f.addEventListener('load', async function onLoad() {
          f.removeEventListener('load', onLoad);
          const d = f.contentDocument;
          try { await Promise.race([d.fonts.ready, new Promise((r) => setTimeout(r, 5000))]); } catch (e) { /* fonts are optional */ }
          resolve(d);
        });
        f.srcdoc = `<!DOCTYPE html><html ${attrs}><head><base href="${BASE}">${AS.head}<style>${ACC_CSS}</style></head><body${AS.bodyAttrs}>${AS.body}</body></html>`;
      })).then((d) => { this.doc = d; this.focus('shop'); return d; });
    },
    email() { return this.doc.getElementById('customer-authentication-web-email'); },
    submit() { return this.doc.querySelector('#email-form button[type="submit"][aria-label]'); },
    /** the page's own focus look (measured from the live page): 'shop' on load (autofocus), 'email' while typing, null */
    focus(which) {
      const d = this.doc;
      const apply = (els, diffs, on) => els.forEach((e, i) => Object.entries(diffs[i] || {}).forEach(([k, v]) => e.style.setProperty(k, on ? v : '')));
      const em = this.email();
      const shop = d.querySelector('shop-login') && d.querySelector('shop-login').shadowRoot && d.querySelector('shop-login').shadowRoot.querySelector('button');
      if (em) apply(chainOf(em, 6), AS.focus.email, which === 'email');
      if (shop) apply(chainOf(shop, 2), AS.focus.shopButton, which === 'shop');
    },
    /** types into the page's <input>: its own rendering of the value, a caret drawn after the text */
    async type(input, text, o = {}) {
      const d = this.doc;
      await D.clickUi(input, { kind: 'text', after: 80 });
      this.focus('email');
      let caret = d.getElementById('demoCaret');
      if (!caret) { caret = d.createElement('span'); caret.id = 'demoCaret'; caret.className = 'demo-caret'; d.body.appendChild(caret); }
      // the floating label moves the text down with a short padding transition: switch it off while typing, so the
      // caret drawn after the text sits where the text is at every moment
      input.style.transition = 'none';
      const cs = d.defaultView.getComputedStyle(input);
      const meas = d.createElement('span');
      meas.style.cssText = `position:absolute;visibility:hidden;white-space:pre;font:${cs.font};letter-spacing:${cs.letterSpacing}`;
      d.body.appendChild(meas);
      const place = () => {
        const r = input.getBoundingClientRect();
        meas.textContent = input.value;
        const h = Math.round(parseFloat(cs.fontSize) * 1.3);
        caret.style.left = (r.left + parseFloat(cs.borderLeftWidth) + parseFloat(cs.paddingLeft) + meas.getBoundingClientRect().width - input.scrollLeft) + 'px';
        caret.style.top = (r.top + parseFloat(cs.borderTopWidth) + parseFloat(cs.paddingTop) + (r.height - parseFloat(cs.borderTopWidth) - parseFloat(cs.borderBottomWidth) - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom) - h) / 2) + 'px';
        caret.style.height = h + 'px';
        caret.hidden = false;
      };
      place();
      const t = await D.typeInto({ cls: { comp: 'demo-ime' }, render(v) { input.value = v; place(); }, anchor() { return D.screenRect(caret); } }, [{ direct: text }], { kps: o.kps || 14 });
      input.value = t;
      caret.hidden = true;
      meas.remove();
      input.style.transition = '';
      return t;
    },
    /** after the e-mail: the code step (the same page, with the page's own texts for it) */
    codeStep(email) {
      const d = this.doc;
      d.querySelector('main h1 span').textContent = 'コードを入力';
      d.querySelector('main p').textContent = `${email}に送信されました`;
      d.title = 'コードを入力 - KANADEMONO';
      // the Shop button and the 「または」 line belong to the first step only
      const shopBlock = d.querySelector('shop-login').closest('main > div') || d.querySelector('shop-login').parentElement;
      shopBlock.remove();
      const consent = d.getElementById('marketing-consent');
      if (consent) consent.closest('label, div[class]').parentElement.parentElement.remove();
      const em = this.email();
      em.value = '';
      em.type = 'text';
      em.setAttribute('inputmode', 'numeric');
      em.setAttribute('autocomplete', 'one-time-code');
      em.placeholder = '6桁のコード';
      const label = d.getElementById('customer-authentication-web-email-label');
      if (label) label.querySelector('span').textContent = '6桁のコード';
      const legal = [...d.querySelectorAll('main p')].find((p) => /利用規約/.test(p.textContent));
      if (legal) { legal.textContent = '別のメールアドレスでログインする'; legal.style.color = 'rgb(0, 91, 209)'; legal.style.textDecoration = 'underline'; legal.style.textUnderlineOffset = '2px'; }
      this.focus(null);
      this.busy(false);
      return d;
    },
    busy(on) { const b = this.submit(); if (b) b.setAttribute('aria-busy', on ? 'true' : 'false'); if (b) b.style.opacity = on ? '.45' : ''; },
    /** after the login: the account's orders page (reconstruction in the captured page's look) */
    home() {
      $('#acFrame').hidden = true;
      const h = $('#acHome');
      h.hidden = false;
      h.innerHTML = `<header><a class="ac-shop">KANADEMONO</a><nav><span>ショップ</span><span class="on">注文</span></nav><span class="sp"></span>
          <span class="ac-co">${K.ic('building')}${esc(CO)} ・ 本社${K.ic('chevron-down')}</span><span class="ac-av">${K.ic('user')}</span></header>
        <main><h1>注文</h1><div class="ac-empty">${K.ic('inbox')}<b>まだ注文はありません</b><p>${esc(CO)}（本社）として購入すると、法人価格・請求書払い（30 日以内）が適用されます</p><span class="ac-btn">ショップに行く</span></div></main>`;
      K.hydrate(h);
    },
  };

  /* ===================================================================== PDF viewer */
  // The quotes are real PDFs (assets/pdf/quote-D10xx.pdf) and the page is Chrome's own PDF viewer showing them, captured
  // at the size of this browser's page area (tools/snapshots/kanademono-business/build-quote-pdfs.js). The spots mark
  // where the table / amount / total / note are, for the pointer and the issue boxes.
  const QP = window.QUOTE_PDFS || {};
  const Pdf = {
    no: null,
    show(o = {}) {
      const q = QP[o.no || 'D1024'];
      this.no = o.no || 'D1024';
      $('#pvImg').src = q.img;
      $('#pvSpots').innerHTML = Object.entries(q.spots).map(([k, [x, y, w, h]]) => `<div class="pv-spot" data-spot="${k}" style="left:${x}px;top:${y}px;width:${w}px;height:${h}px"></div>`).join('');
    },
    spot(k) { return $(`#pvSpots [data-spot="${k}"]`); },
  };

  /* ============================================================ storefront: what the dev theme adds */
  const B2B_CSS = `
    .b2b-register{max-width:880px;margin:0 auto;padding:10px 0 40px}
    .b2b-form{display:grid;grid-template-columns:1fr 1fr;gap:18px 26px;text-align:left;margin-top:26px}
    .b2b-field{display:flex;flex-direction:column;gap:8px;font-size:14px;letter-spacing:.04em}
    .b2b-field em{font-style:normal;font-size:11px;background:#222;color:#fff;border-radius:2px;padding:1px 6px;margin-left:8px;vertical-align:1px}
    .b2b-in{text-transform:none;letter-spacing:.02em;height:46px;border:1px solid #cfcfcf;background:#fff;padding:0 14px;font-size:15px;color:#222;display:flex;align-items:center;white-space:nowrap;overflow:hidden;box-sizing:border-box;position:relative}
    .b2b-in.sel::after{content:'';position:absolute;right:16px;top:17px;width:7px;height:7px;border:solid #555;border-width:0 1.5px 1.5px 0;transform:rotate(45deg)}
    .b2b-in.focus{border-color:#222;box-shadow:0 0 0 1px #222}
    .b2b-field.err .b2b-in{border-color:#c4302b;background:#fff6f6}
    .pii{filter:blur(5px)}
    .demo-caret{display:inline-block;width:1.5px;height:1.15em;background:#222;margin:0 1px;vertical-align:-0.2em;animation:dcb 1s steps(1) infinite}@keyframes dcb{50%{opacity:0}}
    .demo-ime{text-decoration:underline dotted 2px;text-underline-offset:4px}.demo-ime.conv{text-decoration-style:solid}.demo-ime.conv.active{text-decoration-thickness:3px;background:rgba(0,91,211,.18)}
    .b2b-field .msg{color:#c4302b;font-size:12.5px}
    .b2b-form .btn{grid-column:1/-1;justify-self:center;min-width:280px;height:52px;margin-top:8px}
    .b2b-done{grid-column:1/-1;border:1px solid #2f6b4f;background:#f2f8f4;color:#2f6b4f;padding:16px 20px;font-size:14.5px;line-height:1.7;text-align:center}
    .b2b-price{margin:18px 0 6px;padding:16px 18px;border:1px solid #222;display:flex;flex-wrap:wrap;align-items:center;gap:10px 14px}
    .b2b-price__label{font-size:12px;letter-spacing:.12em;background:#222;color:#fff;padding:3px 10px}
    .b2b-price__value{font-size:22px;font-weight:600;letter-spacing:.02em}
    .b2b-price__value small{font-size:12px;font-weight:400;margin-left:4px}
    .b2b-price__off{font-size:12.5px;color:#b0431f;border:1px solid #b0431f;padding:2px 8px}
    .b2b-price .btn{width:100%;margin-top:4px}
    @media (max-width:749px){.b2b-register{padding:4px 16px 28px}.b2b-form{grid-template-columns:1fr;margin-top:10px}.b2b-form .btn{min-width:0;width:100%}}`;
  const inp = (v, id) => `<span class="b2b-in" data-in="${id}">${v || ''}</span>`;
  const FORM_HTML = (o = {}) => `<div class="b2b-register" data-demo-b2b><form class="b2b-form" onsubmit="return false">
      <label class="b2b-field${o.err ? ' err' : ''}"><span>会社名<em>必須</em></span>${inp(esc(o.company || ''), 'company')}${o.err ? '<span class="msg">会社名を入力してください</span>' : ''}</label>
      <label class="b2b-field"><span>部署名</span>${inp(esc(o.dept || ''), 'dept')}</label>
      <label class="b2b-field"><span>ご担当者名<em>必須</em></span>${inp(o.filled ? '山田 太郎' : '', 'name')}</label>
      <label class="b2b-field"><span>メールアドレス<em>必須</em></span>${inp(o.filled ? 'b2b+testlab@kanademono.design' : '', 'email')}</label>
      <label class="b2b-field"><span>電話番号</span>${inp('', 'tel')}</label>
      <label class="b2b-field"><span>業種</span><span class="b2b-in sel">${o.filled ? 'IT・通信' : '選択してください'}</span></label>
      <label class="b2b-field"><span>導入予定時期</span><span class="b2b-in sel">${o.filled ? '1か月以内' : '選択してください'}</span></label>
      ${o.done ? '<div class="b2b-done">申請を受け付けました。1〜2営業日以内に登録完了メールをお送りします。</div>' : '<button class="btn" type="button">申請する</button>'}</form></div>`;
  /** the registration section of the captured business page: its content area (the live form is loaded there by script) */
  function regArea(doc) {
    const h = [...doc.querySelectorAll('h2, h3, .section-header__title, p')].find((e) => /法人様会員登録フォーム/.test(e.textContent) && !e.closest('a'));
    if (!h) return null;
    let sec = h.closest('[id^="shopify-section"], section') || h.parentElement;
    return { sec, head: h };
  }
  function css(doc) { if (!doc.getElementById('b2b-css')) { const s = doc.createElement('style'); s.id = 'b2b-css'; s.textContent = B2B_CSS; doc.head.appendChild(s); } }
  /** insert our form into the registration section (replacing the "読み込んでいます…" placeholder / the live form) */
  function putForm(doc, o) {
    css(doc);
    // the grey panel under the 3 steps: where the live page embeds its form (not captured: an external embed)
    const box = doc.querySelector('#register-sec > div[style*="f7f7f7"]') || doc.querySelector('#register-sec');
    if (!box) return null;
    const old = box.querySelector('[data-demo-b2b]');
    const wrap = doc.createElement('div');
    wrap.innerHTML = FORM_HTML(o);
    const el = wrap.firstElementChild;
    if (old) old.replaceWith(el);
    else { box.innerHTML = ''; box.appendChild(el); }
    return el;
  }
  /** the 法人価格 block under the product price (what customer.b2b? renders) */
  function putPrice(doc, o) {
    css(doc);
    const old = doc.querySelector('[data-demo-price]');
    if (old) old.remove();
    const host = doc.querySelector('.product-single__meta .product-single__price') || doc.querySelector('.product-single__title');
    if (!host) return null;
    const el = doc.createElement('div');
    el.className = 'b2b-price'; el.setAttribute('data-demo-price', '');
    el.innerHTML = `<span class="b2b-price__label">法人価格</span><span class="b2b-price__value">${yen(o.price)}<small>（税込）</small></span>${o.off ? '<span class="b2b-price__off">卸売 15%OFF</span>' : ''}<a class="btn btn--secondary" href="#">この商品で見積書を作成</a>`;
    host.insertAdjacentElement('afterend', el);
    return el;
  }

  window.KB = { V, Mail, Pdf, Acct, img, yen, tax, putForm, putPrice, regArea };
})();
