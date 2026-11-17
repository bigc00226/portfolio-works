/*
 * The parts of this video on top of the shared kit (shared/kit/kit.js) and the real WordPress screens
 * (shared/wordpress/wp-frame.js, js/wp-snapshot.js):
 *   - the tab icons: asianretreat.jp's site icon (assets/favicon.webp, from the live site) — wp-admin shows the site icon
 *     too; the mail tab: Gmail's real favicon (shared/favicons)
 *   - Mail: the shop's inbox (a webmail look-alike without logos, as in wp-clinic-contact-form — Gmail needs a login)
 *   - AR.paid(doc): the general settings' Stripe section as it is once the paid plan of Booking Package is active
 *     (RECONSTRUCTED: the free plugin draws the same fields disabled with 「有料購読への加入が必要」 — the captured screen)
 *   - AR.card(doc): the payment step with Stripe's card field (RECONSTRUCTED for the same reason)
 *   - AR.mailText(tpl, b): a notification e-mail as Booking Package fills its template ([id] [services] … → the booking)
 */
(function () {
  'use strict';
  const D = window.Demo, K = window.Kit;
  const { $, esc } = D;
  const { Browser } = K;
  const icon = (n) => D.icon(n);

  Browser.FAV.store = '<img class="br-fav img" src="assets/favicon.webp" alt="">';
  Browser.FAV.wp = Browser.FAV.store;

  /* ---------------------------------------------------------------- reconstructions on captured screens */
  const css = (doc, id, text) => { let s = doc.getElementById(id); if (!s) { s = doc.createElement('style'); s.id = id; doc.head.appendChild(s); } s.textContent = text; };
  const AR = {
    /** the Stripe rows of 一般設定 with the paid plan active: fields enabled, the red notes gone, the keys typed */
    paid(doc, keys = {}) {
      const rows = [...doc.querySelectorAll('tr, .row, div')].filter((r) => /有料購読への加入が必要/.test(r.textContent) && r.querySelector('input, select'));
      doc.querySelectorAll('input[disabled], select[disabled]').forEach((e) => {
        const near = e.closest('td, div');
        if (near && /Stripe|公開鍵|シークレット|支払いの取得|有効/.test((e.closest('tr') || near).textContent)) e.removeAttribute('disabled');
      });
      css(doc, 'demo-paid', '.demo-paid-hide { display: none !important; }');
      [...doc.querySelectorAll('*')].filter((e) => e.children.length === 0 && /^有料購読への加入が必要$/.test(e.textContent.trim())).forEach((e) => e.classList.add('demo-paid-hide'));
      return rows.length;
    },
    /**
     * the payment method row with Stripe's card field, before the 予約する button (RECONSTRUCTED: with the paid plan the
     * plugin asks for the method and mounts Stripe's card element there). Returns { box, target(part) } — the targets
     * for Demo.typeInto: 'num' / 'exp' / 'cvc'.
     */
    card(doc, before) {
      if (!doc || !before) return null;
      css(doc, 'demo-card', `
        .demo-pay { margin: 18px 0 22px; text-align: left; }
        .demo-pay .demo-pay-h { font-weight: 600; margin: 0 0 8px; }
        .demo-pay label { display: inline-flex; align-items: center; gap: 6px; margin: 0 22px 8px 0; }
        .demo-stripe { display: flex; align-items: center; gap: 12px; height: 44px; padding: 0 12px; border: 1px solid #d9d9d9; border-radius: 4px; background: #fff;
          box-shadow: 0 1px 1px rgba(0,0,0,.03), 0 3px 6px rgba(0,0,0,.02); font: 16px/1 -apple-system, "Segoe UI", Roboto, sans-serif; color: #30313d; max-width: 520px; }
        .demo-stripe.focus { border-color: #0570de; box-shadow: 0 0 0 3px rgba(5,112,222,.25); }
        .demo-stripe .brand { width: 26px; height: 18px; border-radius: 3px; background: linear-gradient(135deg, #e3e8ee, #c3cad3); flex: none; }
        .demo-stripe .num { flex: 1; letter-spacing: .02em; } .demo-stripe .exp { width: 74px; } .demo-stripe .cvc { width: 44px; }
        .demo-stripe .ph { color: #87909f; }
        .demo-stripe .demo-caret { display: inline-block; width: 1px; height: 1.1em; background: #30313d; vertical-align: -0.2em; animation: demoBlink 1s steps(1) infinite; }
        .demo-pay .demo-note { font-size: 12px; color: #6d6e78; margin-top: 6px; }`);
      const wrap = doc.createElement('div');
      wrap.className = 'demo-pay';
      wrap.innerHTML = `<div class="demo-pay-h">お支払い方法</div>
        <label><input type="radio" name="demo-pay"> 現地で支払う</label><label><input type="radio" name="demo-pay" checked> Stripe で支払う</label>
        <div class="demo-stripe"><span class="brand"></span><span class="num"><span class="ph">カード番号</span></span><span class="exp"><span class="ph">月 / 年</span></span><span class="cvc"><span class="ph">CVC</span></span></div>
        <div class="demo-note">テストモード（Stripe のテストカード）</div>`;
      (before.closest('.bookingButton, .row, div') || before).before(wrap);
      const box = wrap.querySelector('.demo-stripe');
      const target = (part) => {
        const el = box.querySelector('.' + part);
        return {
          cls: { comp: 'demo-ime' },
          render(text) { el.innerHTML = (text ? esc(text) : '') + '<span class="demo-caret"></span>'; },
          anchor() { return D.screenRect(el); },
          done() { el.querySelector('.demo-caret') && el.querySelector('.demo-caret').remove(); },
        };
      };
      return { box, target };
    },
    /**
     * RECONSTRUCTED — any Booking Package screen once the paid plan is active: the red 「有料購読への加入が必要」 labels
     * gone and the controls next to them usable; o.prep: 準備時間 30分 (予約の前後) selected; o.stripe: 「Stripe で支払う」
     * ticked among the payment methods. (The free plugin draws them disabled; applyFreePlanLimits keeps 準備時間 at 0.)
     */
    unlock(doc, o = {}) {
      if (!doc || doc.__arUnlocked === JSON.stringify(o)) return;
      doc.__arUnlocked = JSON.stringify(o);
      css(doc, 'demo-paid', '.demo-paid-hide { display: none !important; }');
      const labels = [...doc.querySelectorAll('body *')].filter((e) => e.children.length === 0 && /^有料購読への加入が必要$/.test(e.textContent.trim()));
      for (const l of labels) {
        l.classList.add('demo-paid-hide');
        const row = l.closest('tr') || l.parentElement;
        if (row) row.querySelectorAll('input[disabled], select[disabled], textarea[disabled]').forEach((x) => { x.removeAttribute('disabled'); x.disabled = false; });
        if (row && row.matches && row.matches('input[disabled], select[disabled]')) row.removeAttribute('disabled');
        // fields whose own value is the red label (料金 2–6 …): emptied
        if (/^(INPUT|TEXTAREA)$/.test(l.tagName)) l.value = '';
      }
      doc.querySelectorAll('input[disabled], textarea[disabled]').forEach((x) => { if (/有料購読/.test(x.value || x.placeholder || '')) { x.removeAttribute('disabled'); x.value = ''; x.placeholder = ''; } });
      const rowOf = (re) => { const th = [...doc.querySelectorAll('th')].find((t) => re.test(t.textContent)); return th && th.closest('tr'); };
      if (o.prep) {
        const r = rowOf(/準備時間/);
        const sel = r && [...r.querySelectorAll('select')].find((s) => [...s.options].some((x) => x.value === '30'));
        if (sel) { sel.removeAttribute('disabled'); [...sel.options].forEach((x) => { if (x.value === '30') x.setAttribute('selected', ''); else x.removeAttribute('selected'); }); sel.value = '30'; }
      }
      if (o.stripe) {
        const r = rowOf(/支払い方法/);
        const cb = r && [...r.querySelectorAll('input[type="checkbox"]')].find((c) => /Stripe で支払う/.test((c.closest('label') || c.parentElement || {}).textContent || ''));
        if (cb) { cb.removeAttribute('disabled'); cb.checked = true; cb.setAttribute('checked', ''); }
      }
    },
    /**
     * RECONSTRUCTED — the booking page's time slots with 準備時間 30分 (before and after) applied around the 13:00–14:30
     * visit, for a 60-minute menu: 12:00 (ends 13:00, no time to move) and 14:30 (right at the end) closed
     */
    prepSlots(doc, times = ['12:00', '14:30']) {
      if (!doc) return;
      doc.querySelectorAll('.selectable_time_slot').forEach((s) => { if (times.some((t) => s.textContent.includes(t))) s.classList.add('closed'); });
    },
    /** the plugin's text for the payment method in the e-mail / the confirm step */
    yen: (n) => '¥' + Number(n).toLocaleString('ja-JP'),
    /** a notification e-mail: Booking Package's template with its tags filled from the booking */
    mailText(tpl, b) {
      return tpl.replace(/\[(\w+)\]/g, (m, k) => (b[k] != null ? b[k] : m));
    },
  };

  /* ---------------------------------------------------------------- the shop's inbox */
  $('#brContent').insertAdjacentHTML('afterbegin', `
    <div class="br-page" data-page="mail"><div class="wm" id="wm">
      <aside class="wm-side"><div class="wm-compose"><i data-icon="pencil"></i>作成</div>
        <div class="wm-f on"><i data-ic="inbox"></i>受信トレイ<b id="wmCount"></b></div><div class="wm-f"><i data-icon="star"></i>スター付き</div><div class="wm-f"><i data-ic="clock"></i>スヌーズ中</div><div class="wm-f"><i data-icon="arrow-right"></i>送信済み</div><div class="wm-f"><i data-icon="file"></i>下書き</div>
        <div class="wm-lbl">ラベル</div><div class="wm-f"><i data-icon="tag"></i>WEB予約</div><div class="wm-f"><i data-icon="tag"></i>LINE予約</div></aside>
      <main class="wm-main"><div class="wm-top"><div class="wm-search"><i data-icon="search"></i>メールを検索</div></div><div class="wm-body" id="wmBody"></div></main>
    </div></div>`);
  const Mail = {
    list: [],
    render(o = {}) {
      const unread = this.list.filter((m) => !m.read).length;
      $('#wmCount').textContent = unread || '';
      $('#wmBody').innerHTML = o.open != null ? this.reading(this.list[o.open]) :
        `<div class="wm-list">${this.list.map((m, i) => `<div class="wm-row${m.read ? '' : ' unread'}${o.newIdx != null && i <= o.newIdx ? ' new' : ''}" data-mail="${i}"><span class="wm-star">${icon('star')}</span><span class="wm-from">${esc(m.from)}</span><span class="wm-subj"><b>${esc(m.subject)}</b> — <span class="sa-mute">${esc(m.snippet)}</span></span><span class="wm-date">${esc(m.time)}</span></div>`).join('')}</div>`;
      D.hydrateIcons($('#wmBody'));
    },
    reading(m) {
      return `<div class="wm-read"><div class="wm-tools"><span data-back>${icon('arrow-left')}</span>${icon('download')}${icon('alert')}${icon('x-circle')}</div>
        <h2>${esc(m.subject)} <span class="sa-tag">${esc(m.label || '受信トレイ')}</span></h2>
        <div class="wm-hd"><span class="wm-av">${esc(m.from[0])}</span><div><b>${esc(m.from)}</b> <span class="sa-mute pii">&lt;${esc(m.addr)}&gt;</span><div class="sa-mute">To: <span class="pii">${esc(m.to)}</span></div></div><span class="wm-date">${esc(m.time)}</span></div>
        <div class="wm-text" id="wmText">${m.html || esc(m.text)}</div></div>`;
    },
    add(m) { this.list.unshift({ read: false, ...m }); },
    row(i) { return $(`#wmBody .wm-row[data-mail="${i}"]`); },
  };
  D.hydrateIcons($('#wm'));

  window.AR = AR;
  window.Mail = Mail;
})();
