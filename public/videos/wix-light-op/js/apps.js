/*
 * The panels of the Wix editor used in this video (on top of shared/wix/wix.js): add elements, pages & menu,
 * media manager, background / text / form settings, publish. The pictures in the media manager are the site's own
 * (the captured page's images).
 */
(function () {
  'use strict';
  const D = window.Demo, X = window.Wix;
  const { esc } = D;
  const sv = X.sv;

  const LO = {
    /** "追加" panel: categories on the left, the items of one category on the right */
    add(cat, items) {
      const CATS = ['テキスト', '画像', 'ボタン', 'ストリップ', 'デコレーション', 'ボックス', 'ギャラリー', 'メニュー・アンカー', 'お問い合わせ・フォーム', 'ソーシャル', '動画・音楽', '埋め込みコード'];
      return `<div class="wx-add"><div class="wx-add-cats">${CATS.map((c) => `<div${c === cat ? ' class="on"' : ''}>${esc(c)}</div>`).join('')}</div><div class="wx-add-items">${items}</div></div>`;
    },
    strips() {
      return `<h4>フルスクリーン</h4><div class="wx-grid2">
        <div class="wx-add-it" id="addStripFull"><div class="pv dark">背景画像 ＋ 見出し</div><div class="n">フルスクリーン（背景画像）</div></div>
        <div class="wx-add-it"><div class="pv">背景色のみ</div><div class="n">ストリップ（背景色）</div></div></div>
        <h4>コンテンツ</h4><div class="wx-grid2">
        <div class="wx-add-it" id="addStripCols"><div class="pv">見出し ＋ 文章 ＋ 画像</div><div class="n">2カラム</div></div>
        <div class="wx-add-it"><div class="pv">3 つのリスト</div><div class="n">3カラム</div></div>
        <div class="wx-add-it" id="addStripList"><div class="pv">見出し ＋ リンクのリスト</div><div class="n">リスト ＋ 大きな画像</div></div>
        <div class="wx-add-it"><div class="pv dark">テキストのみ</div><div class="n">テキスト（濃い背景）</div></div></div>`;
    },
    texts() {
      return `<h4>見出し</h4><div class="wx-add-it" id="addH1"><div class="t1">見出し 1</div></div><div class="wx-add-it"><div class="t2">見出し 2</div></div>
        <h4>段落</h4><div class="wx-add-it"><div class="t3">段落テキストです。クリックして編集し、内容を書き換えてください。</div></div>`;
    },
    forms() {
      return `<h4>お問い合わせフォーム</h4><div class="wx-grid2">
        <div class="wx-add-it" id="addForm"><div class="pv form"><i></i><i></i><i></i><b></b></div><div class="n">お問い合わせ（項目を追加できる）</div></div>
        <div class="wx-add-it"><div class="pv form"><i></i><b></b></div><div class="n">メールマガジン登録</div></div></div>`;
    },
    /** pages & menu: [{n, home, sub, on, id, edit}] */
    pages(list, o = {}) {
      const row = (p) => `<div class="wx-pg${p.sub ? ' sub' : ''}${p.on ? ' on' : ''}${p.new ? ' new' : ''}"${p.id ? ` id="${p.id}"` : ''} data-pg="${esc(p.n)}">
          ${p.home ? `<span class="home">${sv('home')}</span>` : ''}${p.edit ? `<span class="ed" id="${p.edit}"></span>` : `<span class="nm">${esc(p.n)}</span>`}<span class="dots">${sv('dots')}</span></div>`;
      return `<div class="wx-pg-tabs"><span class="on">サイトメニュー</span><span>ページ</span><span>ブログ</span><span>多言語</span></div>
        <div class="wx-pg-h">サイトメニュー（ヘッダーのナビゲーション）<span class="sp"></span>${list.length} ページ</div>
        ${list.map(row).join('')}
        <div class="wx-pg-add" id="pgAdd">${sv('plus', 15)}ページを追加</div>
        ${o.note ? `<div class="lo-files">${esc(o.note)}</div>` : ''}`;
    },
    /** media manager: images [{src, name}] */
    media(imgs, o = {}) {
      return `<div class="lo-files">${esc(o.folder || 'サイトファイル')}　${imgs.length} 件</div>
        <div class="wx-media">${imgs.map((m, i) => `<div${o.on === i ? ' class="on"' : ''}${o.up === i ? ' class="up"' : ''} style="background-image:url('${m.src}')" title="${esc(m.name)}"></div>`).join('')}</div>`;
    },
    mediaFoot() { return `<span class="wx-btn" id="mdUpload">${sv('upload', 15)}メディアをアップロード</span><span class="wx-btn pri" id="mdPick">ページに追加</span>`; },
    /** background settings of a strip */
    bg(o = {}) {
      return `<div class="wx-sf"><label>背景</label><div class="wx-opt"><span>色</span><span class="on">画像</span><span>動画</span></div></div>
        <div class="wx-sf"><label>表示方法</label><div class="wx-opt"><span class="on">カバー（切り取り）</span><span>フィット</span><span>タイル</span></div></div>
        <div class="wx-sf"><div class="wx-tg" id="bgStretch">ストリップの幅いっぱいに表示（全幅）<span class="sw${o.stretch ? ' on' : ''}"></span></div></div>
        <div class="wx-sf"><label>スクロール時の効果</label><div class="wx-opt"><span class="on">なし</span><span>パララックス</span><span>ズーム</span></div></div>`;
    },
    /** text settings (font size) */
    textSize(px, o = {}) {
      const pct = Math.round(((px - 12) / (60 - 12)) * 100);
      return `<div class="wx-sf"><label>テーマ</label><div class="wx-in"><span class="v">見出し 1</span></div></div>
        <div class="wx-sf"><label>フォントサイズ${o.mobile ? '（モバイル）' : ''}</label><div class="wx-slider" id="txSize"><div class="tr"><b style="width:${pct}%"></b><i style="left:${pct}%"></i></div><span class="n">${px}</span></div></div>
        <div class="wx-sf"><label>行間</label><div class="wx-slider"><div class="tr"><b style="width:40%"></b><i style="left:40%"></i></div><span class="n">1.6</span></div></div>
        ${o.mobile ? '<div class="wx-sf" style="font-size:12px;color:#577083">モバイルでの変更はデスクトップのサイトには反映されません。</div>' : ''}`;
    },
    /** form settings (Wix Forms) */
    form(o = {}) {
      const F = [['会社名', '短いテキスト', 1], ['ご担当者様氏名', '短いテキスト', 1], ['メールアドレス', 'メール', 1], ['電話番号', '電話番号', o.telReq ? 1 : 0], ['本社住所', '短いテキスト', 1], ['お問い合わせ内容', '長いテキスト', 1]];
      return `<div class="wx-pg-tabs"><span${o.tab === 'fields' ? ' class="on"' : ''}>項目</span><span${o.tab === 'after' ? ' class="on"' : ''}>送信後の設定</span><span>デザイン</span></div>
        ${o.tab === 'after' ? `
          <div class="lo-sw-row" id="fmNotify">新しい送信をメールで通知<small>送信内容をサイトのオーナーに送ります</small><span class="wx-tg"><span class="sw${o.notify ? ' on' : ''}"></span></span></div>
          <div class="wx-sf"><label>通知の送信先</label><div class="wx-in"><span class="v">${o.notify ? 'サイトのオーナー・共同管理者' : ''}</span>${o.notify ? '' : '<span class="ph">送信先を選択</span>'}</div></div>
          <div class="wx-sf"><label>送信後のメッセージ</label><div class="wx-in"><span class="v">${o.thanks ? 'お問い合わせありがとうございます。担当者よりご連絡いたします。' : ''}</span>${o.thanks ? '' : '<span class="ph">メッセージを入力</span>'}</div></div>`
        : `<div class="lo-fields">${F.map(([n, t, req], i) => `<div${o.on === i ? ' class="on"' : ''} id="fmF${i}"><b>${esc(n)}${req ? ' *' : ''}</b><em>${esc(t)}</em>${sv('dots')}</div>`).join('')}</div>
          ${o.field != null ? `<div class="lo-sw-row" id="fmReq">必須項目にする<span class="wx-tg"><span class="sw${o.telReq ? ' on' : ''}"></span></span></div>` : ''}`}`;
    },
    publish(domain) {
      return `<div class="art">${sv('rocket', 56)}</div><div class="hd">サイトを公開しました</div>
        <div class="bd">変更内容が公開サイトに反映されました。下の URL からいつでも確認できます。<div class="url">${sv('globe', 18)}https://${esc(domain)}</div></div>
        <div class="ft"><span class="wx-btn" id="pubDone">完了</span><span class="wx-btn pri" id="pubView">サイトを表示</span></div>`;
    },
  };
  window.LO = LO;
})();
