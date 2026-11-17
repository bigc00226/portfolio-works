/*
 * The parts of this video on top of the shared kit (shared/kit/kit.js) and the real WordPress screens
 * (shared/wordpress/wp-frame.js, js/wp-snapshot.js):
 *   - the tab icons: wp-admin of a site without a site icon → WordPress' own icon; the site's pages → the favicon the
 *     live theme declares (/img/favicon.ico, with the snapshot); Chrome's error page → Chrome's icon for a page without one
 *   - Chrome's own error page for ERR_TOO_MANY_REDIRECTS (the browser page "neterr"): Chrome's layout and texts
 *     (components/neterror, security_interstitials — BSD licence), its icon taken from the Chromium source
 *   - the terminal over SSH: the prompt of the remote shell
 */
(function () {
  'use strict';
  const K = window.Kit, D = window.Demo;
  const { $, esc } = D;
  const S = window.SITE_SNAPSHOT;

  K.Browser.FAV.wp = '<img class="br-fav img" src="../../shared/favicons/wordpress.png" alt="">';
  const fav = S && (S.favicon || (S.pages && S.pages.home && S.pages.home.favicon));
  K.Browser.FAV.store = `<img class="br-fav img" src="${esc(fav || 'assets/favicon.ico')}" alt="">`;
  K.Browser.FAV.neterr = '<img class="br-fav img" src="../../shared/favicons/default.png" alt="">';

  /**
   * the home page's 「本日開催のイベント」 was captured on 2026-11-17: shown on the video's day (2026-11-10, also a Tuesday)
   * with that day's date; of its events the one-day flea market (2026-11-18 on the site's own schedule) is not on that day —
   * MYSTERY GATE (to 2027-03-31), ある料理人が遺した謎 (to 2027-03-31), the winter illumination (from 2026-11-07) are
   */
  window.StoreFrame.STATES.today = {
    on(doc) {
      const d = doc.querySelector('.daily-event_calender .target-date');
      if (d) d.textContent = '2026年 11月10日 火曜日';
      doc.querySelectorAll('.event-list .event-list_item').forEach((li) => { if (/フリーマーケット/.test(li.textContent)) li.remove(); });
    },
    off() {},
  };

  /** Chrome's error page (net::ERR_TOO_MANY_REDIRECTS) as Chrome draws it, in Japanese */
  const NetErr = {
    show(host) {
      $('#netErr').innerHTML = `
        <div class="ne-wrap">
          <div class="ne-icon"></div>
          <div class="ne-msg">
            <h1><span>このページは動作していません</span></h1>
            <p><strong>${esc(host)}</strong> でリダイレクトが繰り返し行われました。</p>
            <div class="ne-sug"><p><a>Cookie を削除</a>してみてください。</p></div>
            <div class="ne-code">ERR_TOO_MANY_REDIRECTS</div>
          </div>
          <div class="ne-nav"><button class="ne-btn" id="neReload">再読み込み</button></div>
        </div>`;
    },
  };

  /** the terminal on a remote server (ssh): the bash prompt instead of PowerShell's */
  const LOCAL_PROMPT = K.Term.prompt;
  const Shell = {
    remote(user, host, dir = '~') { K.Term.prompt = `[${user}@${host} ${dir}]$ `; },
    cd(dir) { K.Term.prompt = K.Term.prompt.replace(/ [^ \]]+\]\$ $/, ` ${dir}]$ `); },
    local() { K.Term.prompt = LOCAL_PROMPT; },
  };

  /**
   * VS Code's notification toast (bottom right of the window) — here: saving the hosts file needs administrator rights,
   * VS Code offers to retry as administrator
   */
  const VsNotify = {
    show(msg, buttons) {
      let n = $('#saVsNotif');
      if (!n) { n = document.createElement('div'); n.id = 'saVsNotif'; n.className = 'sa-vsn'; $('#win-code').appendChild(n); }
      n.innerHTML = `<div class="sa-vsn-m">${window.VSC.ci('error', 'sa-vsn-i')}<span class="sa-vsn-t">${msg}</span><span class="sa-vsn-x">${window.VSC.ci('close')}</span></div>` +
        `<div class="sa-vsn-b">${buttons.map((b, i) => `<span class="sa-vsn-btn${i === 0 ? ' pri' : ''}">${esc(b)}</span>`).join('')}</div>`;
      n.classList.add('show');
      return n;
    },
    btn(i) { return document.querySelectorAll('#saVsNotif .sa-vsn-btn')[i]; },
    hide() { const n = $('#saVsNotif'); if (n) n.classList.remove('show'); },
  };

  /**
   * Chrome's page info bubble (the icon left of the address) → 接続は保護されています → 証明書は有効です → the certificate
   * viewer. The certificate is the one www.saitama-arena.co.jp serves (public: CN, issuer, validity — checked
   * 2026-11-18); its fingerprints are blurred instead of shown.
   */
  const CERT = {
    host: 'www.saitama-arena.co.jp',
    to: [['共通名 (CN)', 'www.saitama-arena.co.jp'], ['組織 (O)', '<証明書に含まれていません>'], ['部門 (OU)', '<証明書に含まれていません>']],
    by: [['共通名 (CN)', 'Amazon RSA 2048 M01'], ['組織 (O)', 'Amazon'], ['部門 (OU)', '<証明書に含まれていません>']],
    valid: [['発行日', '2026年9月3日木曜日 9:00:00'], ['有効期限', '2027年3月20日土曜日 8:59:59']],
  };
  const Cert = {
    bubble(step) {
      let b = $('#saPi');
      if (!b) { b = document.createElement('div'); b.id = 'saPi'; b.className = 'sa-pi'; $('#win-browser').appendChild(b); }
      const row = (ic, t, sub, cls = '') => `<div class="sa-pi-row ${cls}"><span class="sa-pi-ic">${ic}</span><span class="sa-pi-t">${t}${sub ? `<small>${sub}</small>` : ''}</span><span class="sa-pi-go">›</span></div>`;
      const LOCK = '<svg viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M18 8h-1V6A5 5 0 0 0 7 6v2H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V10a2 2 0 0 0-2-2zM9 6a3 3 0 0 1 6 0v2H9zm9 14H6V10h12z"/></svg>';
      const CERTI = '<svg viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M4 3h16a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1h-5v2l-3-1.5L9 18v-2H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1zm1 2v9h14V5zm3 2h8v2H8zm0 3h5v2H8z"/></svg>';
      b.innerHTML = step === 1
        ? `<div class="sa-pi-h">${esc(CERT.host)}<span class="sa-pi-x">✕</span></div>${row(LOCK, '接続は保護されています', '', 'sec')}${row('<svg viewBox="0 0 24 24" width="18" height="18"><circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="9" cy="10" r="1.3" fill="currentColor"/><circle cx="14" cy="14" r="1.3" fill="currentColor"/></svg>', 'Cookie とサイトデータ')}${row('<svg viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M3 17h7v2H3zm0-6h11v2H3zm0-6h18v2H3zm14 12h4v2h-4zm-1-6h5v2h-5z"/></svg>', 'サイトの設定')}`
        : `<div class="sa-pi-h"><span class="sa-pi-back">←</span>セキュリティ<span class="sa-pi-x">✕</span></div><div class="sa-pi-sec">${LOCK}<div><b>接続は保護されています</b><p>このサイトに送信した情報（パスワード、クレジットカード番号など）は、第三者に見られることはありません。</p></div></div>${row(CERTI, '証明書は有効です', '', 'cert')}`;
      b.classList.add('show');
      return b;
    },
    el(sel) { return $('#saPi ' + sel); },
    hideBubble() { const b = $('#saPi'); if (b) b.classList.remove('show'); },
    viewer(on) {
      let v = $('#saCert');
      if (!v) {
        v = document.createElement('div'); v.id = 'saCert'; v.className = 'sa-cert';
        const sec = (h, rows) => `<h3>${h}</h3><dl>${rows.map(([k, x]) => `<dt>${esc(k)}</dt><dd>${esc(x)}</dd>`).join('')}</dl>`;
        v.innerHTML = `<div class="sa-cert-tb"><span>証明書ビューア: ${esc(CERT.host)}</span><span class="sa-cert-wc">─</span><span class="sa-cert-wc">✕</span></div>
          <div class="sa-cert-tabs"><span class="on">全般</span><span>詳細</span></div>
          <div class="sa-cert-b">${sec('発行先', CERT.to)}${sec('発行元', CERT.by)}${sec('有効期間', CERT.valid)}
          <h3>SHA-256 フィンガープリント</h3><dl><dt>証明書</dt><dd class="pii">4f1c9a07e2b85d3360a1f7c42e9b0d58c3a6f21e7d90b4c85a2e1f3d6c7b8094</dd><dt>公開鍵</dt><dd class="pii">a83e5d17c09b2f64e1d7a5c38b90f2e46d1c7a05b3e9f8d2c4a6b1e07f5d9c3a</dd></dl></div>`;
        $('#win-browser').appendChild(v);
      }
      v.classList.toggle('show', !!on);
      return v;
    },
  };

  window.SA = { NetErr, Shell, VsNotify, Cert };
})();
