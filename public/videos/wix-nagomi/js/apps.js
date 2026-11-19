/*
 * The panels of the Wix editor used in this video (on top of shared/wix/wix.js): pages & menu (with "hidden from
 * the menu"), media manager, link settings, the booking request form (its options and the auto-reply), the mobile
 * header's booking button, page SEO, publish. Pictures in the media manager are the site's own (the captured images).
 */
(function () {
  'use strict';
  const D = window.Demo, X = window.Wix;
  const { esc } = D;
  const sv = X.sv;

  const NG = {
    /** pages & menu: [{n, home, sub, on, off(hidden from the menu), new, edit, id}] */
    pages(list, o = {}) {
      const row = (p) => `<div class="wx-pg${p.sub ? ' sub' : ''}${p.on ? ' on' : ''}${p.new ? ' new' : ''}${p.off ? ' off' : ''}"${p.id ? ` id="${p.id}"` : ''} data-pg="${esc(p.n)}">
          ${p.home ? `<span class="home">${sv('home')}</span>` : ''}${p.edit ? `<span class="ed" id="${p.edit}"></span>` : `<span class="nm">${esc(p.n)}${p.off ? `<span class="hid" title="メニューに表示しない">${sv('eye', 14)}</span>` : ''}</span>`}<span class="dots">${sv('dots')}</span></div>`;
      return `<div class="wx-pg-tabs"><span class="on">サイトメニュー</span><span>ページ</span><span>ブログ</span><span>多言語</span></div>
        <div class="wx-pg-h">サイトメニュー（ヘッダーのナビゲーション）<span class="sp"></span>${list.length} ページ</div>
        ${list.map(row).join('')}
        <div class="wx-pg-add" id="pgAdd">${sv('plus', 15)}ページを追加</div>
        ${o.note ? `<div class="lo-files">${esc(o.note)}</div>` : ''}`;
    },
    media(imgs, o = {}) {
      return `<div class="lo-files">${esc(o.folder || 'サイトファイル')}　${imgs.length} 件</div>
        <div class="wx-media">${imgs.map((m, i) => `<div${o.on && o.on.includes(i) ? ' class="on"' : ''}${o.up === i ? ' class="up"' : ''} style="background-image:url('${m.src}')" title="${esc(m.name)}"></div>`).join('')}</div>`;
    },
    mediaFoot(label = 'ページに追加') { return `<span class="wx-btn" id="mdUpload">${sv('upload', 15)}メディアをアップロード</span><span class="wx-btn pri" id="mdPick">${esc(label)}</span>`; },
    slides(n) {
      return `<div class="wx-sf"><label>スライド（${n} 枚）</label><div class="wx-media" style="padding:0;grid-template-columns:repeat(3,1fr)" id="slList"></div></div>
        <div class="wx-sf"><div class="wx-tg">自動で切り替える（5 秒ごと）<span class="sw on"></span></div></div>
        <div class="wx-sf"><label>切り替え効果</label><div class="wx-opt"><span>スライド</span><span class="on">クロスフェード</span><span>なし</span></div></div>`;
    },
    link(o = {}) {
      return `<div class="wx-sf"><label>リンクの種類</label><div class="wx-opt"><span class="on">ページ</span><span>URL</span><span>メール</span><span>アンカー</span></div></div>
        <div class="wx-sf"><label>ページ</label><div class="wx-in${o.focus ? ' focus' : ''}" id="lkPage"><span class="v">${esc(o.page || '')}</span>${o.page ? '' : '<span class="ph">ページを選択</span>'}</div></div>
        ${o.list ? `<div class="ng-opts" id="lkList">${o.list.map((p) => `<div data-lk="${esc(p)}">${esc(p)}</div>`).join('')}</div>` : ''}`;
    },
    /** the booking request form (Wix Forms): fields / the tour options / after sending */
    form(o = {}) {
      const tabs = `<div class="wx-pg-tabs"><span${o.tab === 'fields' ? ' class="on"' : ''}>項目</span><span${o.tab === 'after' ? ' class="on"' : ''}>送信後の設定</span><span>デザイン</span></div>`;
      if (o.tab === 'after') {
        return tabs + `
          <div class="lo-sw-row" id="fmNotify">新しいリクエストをメールで通知<small>サイトのオーナー・共同管理者へ</small><span class="wx-tg"><span class="sw on"></span></span></div>
          <div class="lo-sw-row" id="fmAuto">お客様に自動返信メールを送る<small>入力されたメールアドレスへ</small><span class="wx-tg"><span class="sw${o.auto ? ' on' : ''}"></span></span></div>
          ${o.auto ? `<div class="wx-sf"><label>自動返信の件名</label><div class="wx-in"><span class="v">【Nagomi Nature Connections】予約リクエストを受け付けました</span></div></div>
          <div class="wx-sf"><label>本文</label><div class="wx-in" id="fmAutoBody" style="min-height:76px;align-items:flex-start"><span class="v">${esc(o.body || '')}</span>${o.body ? '' : '<span class="ph">本文を入力</span>'}</div></div>` : ''}`;
      }
      const F = [['1. 参加希望のツアー', 'チェックボックス'], ['2. オプション', 'チェックボックス'], ['3. 参加希望日（第1希望・第2希望）', '日付'], ['4. ご希望の時間', 'ドロップダウン'], ['5. 参加人数 *', '数字'], ['6. お名前（代表者の方）*', '短いテキスト'], ['7. メールアドレス *', 'メール'], ['8. お電話番号', '電話番号'], ['9. お問合せ・メッセージ', '長いテキスト']];
      if (o.field === 0) {
        const OPTS = ['西湖カヤック体験', '本栖湖カヤック体験', '西湖SUP体験', '樹海・洞窟探検', '樹海ロングトレイル', '富士下山', '宝永火口ダウンヒル', '西湖カヤックレンタル', ...(o.added ? ['西湖SUPレンタル'] : [])];
        return tabs + `<div class="wx-sf"><label>1. 参加希望のツアー（複数選択可）</label></div>
          <div class="ng-opts" id="fmOpts">${OPTS.map((x, i) => `<div${o.added && i === OPTS.length - 1 ? ' class="new"' : ''}><i></i>${esc(x)}</div>`).join('')}
          ${o.editing ? '<div class="new"><i></i><span class="wx-in focus" id="fmNewOpt" style="flex:1;min-height:26px;padding:2px 8px"></span></div>' : ''}
          <div class="add" id="fmAddOpt">${sv('plus', 14)} 選択肢を追加</div></div>`;
      }
      return tabs + `<div class="lo-fields">${F.map(([n, t], i) => `<div${o.on === i ? ' class="on"' : ''} id="fmF${i}"><b>${esc(n)}</b><em>${esc(t)}</em>${sv('dots')}</div>`).join('')}</div>`;
    },
    /** the header's booking button: where it is shown */
    btnSettings(o = {}) {
      return `<div class="wx-sf"><label>ボタンのテキスト</label><div class="wx-in"><span class="v">ご予約</span></div></div>
        <div class="wx-sf"><label>リンク先</label><div class="wx-in"><span class="v">予約リクエストフォーム</span></div></div>
        <div class="lo-sw-row" id="btnMob">モバイルのサイトに表示<small>オフにすると、スマートフォンではこのボタンが表示されません</small><span class="wx-tg"><span class="sw${o.mobile ? ' on' : ''}"></span></span></div>`;
    },
    publish(domain) {
      return `<div class="art">${sv('rocket', 56)}</div><div class="hd">サイトを公開しました</div>
        <div class="bd">変更内容が公開サイトに反映されました。下の URL からいつでも確認できます。<div class="url">${sv('globe', 18)}https://${esc(domain)}</div></div>
        <div class="ft"><span class="wx-btn" id="pubDone">完了</span><span class="wx-btn pri" id="pubView">サイトを表示</span></div>`;
    },
  };
  window.NG = NG;
})();
