/*
 * Gmail (web, Japanese, 2025–2026 Material 3 look): header (Gmail logo / メールを検索 / help, settings, apps, account),
 * the Mail · Chat · Meet rail, the navigation (作成 / 受信トレイ … / ラベル), the inbox list with its toolbar and the
 * message view (subject + label chips, sender header, body, attachment card, 返信 / 転送).
 * The logo is Gmail's own (gstatic: logo_gmail_lockup_default_2x_r5.png); icons are Google's Material icons.
 * Ids and classes the scripts use: #wm, #wmBody, #wmCount, .wm-row[data-mail], .wm-subj, .wm-tools [data-back],
 * #wmText, #wmAttach.
 */
(function () {
  'use strict';
  const P = {
    menu: 'M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z',
    search: 'M15.5 14h-.79l-.28-.27A6.47 6.47 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z',
    tune: 'M3 17v2h6v-2H3zM3 5v2h10V5H3zm10 16v-2h8v-2h-8v-2h-2v6h2zM7 9v2H3v2h4v2h2V9H7zm14 4v-2H11v2h10zm-6-4h2V7h4V5h-4V3h-2v6z',
    help: 'M11 18h2v-2h-2v2zm1-16C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm0-14c-2.21 0-4 1.79-4 4h2c0-1.1.9-2 2-2s2 .9 2 2c0 2-3 1.75-3 5h2c0-2.25 3-2.5 3-5 0-2.21-1.79-4-4-4z',
    settings: 'M19.43 12.98c.04-.32.07-.64.07-.98 0-.34-.03-.66-.07-.98l2.11-1.65c.19-.15.24-.42.12-.64l-2-3.46a.5.5 0 0 0-.61-.22l-2.49 1c-.52-.4-1.08-.73-1.69-.98l-.38-2.65A.49.49 0 0 0 14 2h-4c-.25 0-.46.18-.49.42l-.38 2.65c-.61.25-1.17.59-1.69.98l-2.49-1a.5.5 0 0 0-.61.22l-2 3.46c-.13.22-.07.49.12.64l2.11 1.65c-.04.32-.07.65-.07.98s.03.66.07.98l-2.11 1.65c-.19.15-.24.42-.12.64l2 3.46a.5.5 0 0 0 .61.22l2.49-1c.52.4 1.08.73 1.69.98l.38 2.65c.03.24.24.42.49.42h4c.25 0 .46-.18.49-.42l.38-2.65c.61-.25 1.17-.59 1.69-.98l2.49 1a.5.5 0 0 0 .61-.22l2-3.46c.12-.22.07-.49-.12-.64l-2.11-1.65zm-1.98-1.71c.04.31.05.52.05.73 0 .21-.02.43-.05.73l-.14 1.13.89.7 1.08.84-.7 1.21-1.27-.51-1.04-.42-.9.68c-.43.32-.84.56-1.25.73l-1.06.43-.16 1.13-.2 1.35h-1.4l-.19-1.35-.16-1.13-1.06-.43c-.43-.18-.83-.41-1.23-.71l-.91-.7-1.06.43-1.27.51-.7-1.21 1.08-.84.89-.7-.14-1.13c-.03-.31-.05-.54-.05-.74s.02-.43.05-.73l.14-1.13-.89-.7-1.08-.84.7-1.21 1.27.51 1.04.42.9-.68c.43-.32.84-.56 1.25-.73l1.06-.43.16-1.13.2-1.35h1.39l.19 1.35.16 1.13 1.06.43c.43.18.83.41 1.23.71l.91.7 1.06-.43 1.27-.51.7 1.21-1.07.85-.89.7.14 1.13zM12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm0 6c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z',
    apps: 'M4 8h4V4H4v4zm6 12h4v-4h-4v4zm-6 0h4v-4H4v4zm0-6h4v-4H4v4zm6 0h4v-4h-4v4zm6-10v4h4V4h-4zm-6 4h4V4h-4v4zm6 6h4v-4h-4v4zm0 6h4v-4h-4v4z',
    edit: 'M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM5.92 19H5v-.92l9.06-9.06.92.92L5.92 19zM20.71 5.63l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83a1 1 0 0 0 0-1.41z',
    inbox: 'M19 3H4.99C3.88 3 3 3.9 3 5v14c0 1.1.88 2 1.99 2H19c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 12h-4c0 1.66-1.35 3-3 3s-3-1.34-3-3H4.99V5H19v10z',
    star: 'M22 9.24l-7.19-.62L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21 12 17.27 18.18 21l-1.63-7.03L22 9.24zM12 15.4l-3.76 2.27 1-4.28-3.32-2.88 4.38-.38L12 6.1l1.71 4.04 4.38.38-3.32 2.88 1 4.28L12 15.4z',
    schedule: 'M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z',
    send: 'M4.01 6.03l7.51 3.22-7.52-1 .01-2.22m7.5 8.72L4 17.97v-2.22l7.51-1M2.01 3 2 10l15 2-15 2 .01 7L23 12 2.01 3z',
    draft: 'M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zM6 20V4h7v5h5v11H6z',
    expand: 'M16.59 8.59 12 13.17 7.41 8.59 6 10l6 6 6-6z',
    add: 'M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z',
    label: 'M17.63 5.84C17.27 5.33 16.67 5 16 5L5 5.01C3.9 5.01 3 5.9 3 7v10c0 1.1.9 1.99 2 1.99L16 19c.67 0 1.27-.33 1.63-.84L22 12l-4.37-6.16zM16 17H5V7h11l3.55 5L16 17z',
    box: 'M19 5v14H5V5h14m0-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z',
    drop: 'M7 10l5 5 5-5z',
    refresh: 'M17.65 6.35A7.958 7.958 0 0 0 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08A5.99 5.99 0 0 1 12 18c-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z',
    more: 'M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z',
    left: 'M15.41 7.41 14 6l-6 6 6 6 1.41-1.41L10.83 12z',
    right: 'M10 6 8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z',
    back: 'M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z',
    archive: 'M20.54 5.23l-1.39-1.68C18.88 3.21 18.47 3 18 3H6c-.47 0-.88.21-1.16.55L3.46 5.23C3.17 5.57 3 6.02 3 6.5V19c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6.5c0-.48-.17-.93-.46-1.27zM6.24 5h11.52l.81.97H5.44l.8-.97zM5 19V8h14v11H5zm8.45-9h-2.9v3H8l4 4 4-4h-2.55z',
    report: 'M15.73 3H8.27L3 8.27v7.46L8.27 21h7.46L21 15.73V8.27L15.73 3zM19 14.9 14.9 19H9.1L5 14.9V9.1L9.1 5h5.8L19 9.1v5.8zM11 7h2v6h-2zm0 8h2v2h-2z',
    del: 'M16 9v10H8V9h8m-1.5-6h-5l-1 1H5v2h14V4h-3.5l-1-1zM18 7H6v12c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7z',
    unread: 'M22 8.98V18c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2h10.1c-.06.32-.1.66-.1 1 0 1.48.65 2.79 1.67 3.71L12 11 4 6v2l8 5 5.3-3.32c.54.2 1.1.32 1.7.32 1.13 0 2.16-.39 3-1.02zM16 5c0 1.66 1.34 3 3 3s3-1.34 3-3-1.34-3-3-3-3 1.34-3 3z',
    task: 'M22 5.18 10.59 16.6l-4.24-4.24 1.41-1.41 2.83 2.83 10-10L22 5.18zM12 20c-4.41 0-8-3.59-8-8s3.59-8 8-8c1.57 0 3.04.46 4.28 1.25l1.45-1.45A10.02 10.02 0 0 0 12 2C6.48 2 2 6.48 2 12s4.48 10 10 10c1.73 0 3.36-.44 4.78-1.22l-1.5-1.5c-1 .46-2.11.72-3.28.72zm7-5h-3v2h3v3h2v-3h3v-2h-3v-3h-2v3z',
    move: 'M20 6h-8l-2-2H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm0 12H4V6h5.17l2 2H20v10zm-7.84-6H8v2h4.16l-1.59 1.59L11.99 17 16 13.01 11.99 9l-1.41 1.41L12.16 12z',
    print: 'M19 8H5c-1.66 0-3 1.34-3 3v6h4v4h12v-4h4v-6c0-1.66-1.34-3-3-3zm-3 11H8v-5h8v5zm3-7c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm-1-9H6v4h12V3z',
    openNew: 'M19 19H5V5h7V3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14c1.1 0 2-.9 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z',
    reply: 'M10 9V5l-7 7 7 7v-4.1c5 0 8.5 1.6 11 5.1-1-5-4-10-11-11z',
    forward: 'M14 9V5l7 7-7 7v-4.1c-5 0-8.5 1.6-11 5.1 1-5 4-10 11-11z',
    emoji: 'M18 9V7h-2V2.84C14.77 2.3 13.42 2 11.99 2 6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12c0-1.05-.17-2.05-.47-3H18zm-2.5-1c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5-1.5-.67-1.5-1.5.67-1.5 1.5-1.5zm-7 0c.83 0 1.5.67 1.5 1.5S9.33 11 8.5 11 7 10.33 7 9.5 7.67 8 8.5 8zm3.5 9.5c-2.33 0-4.31-1.46-5.11-3.5h10.22c-.8 2.04-2.78 3.5-5.11 3.5zM22 3h2v2h-2v2h-2V5h-2V3h2V1h2v2z',
    mail: 'M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4-8 5-8-5V6l8 5 8-5v2z',
    chat: 'M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z',
    meet: 'M15 8v8H5V8h10m1-2H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4V7c0-.55-.45-1-1-1z',
    promo: 'M21.41 11.41l-8.83-8.83c-.37-.37-.88-.58-1.41-.58H4c-1.1 0-2 .9-2 2v7.17c0 .53.21 1.04.59 1.41l8.83 8.83c.78.78 2.05.78 2.83 0l7.17-7.17c.78-.78.78-2.04-.01-2.83zM12.83 20 4 11.17V4h7.17L20 12.83 12.83 20zM6.5 5C7.33 5 8 5.67 8 6.5S7.33 8 6.5 8 5 7.33 5 6.5 5.67 5 6.5 5z',
    group: 'M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z',
    info: 'M11 7h2v2h-2zm0 4h2v6h-2zm1-9C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z',
    dl: 'M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z',
  };
  const mi = (k, s = 20) => `<svg class="gmi" width="${s}" height="${s}" viewBox="0 0 24 24" fill="currentColor"><path d="${P[k]}"/></svg>`;
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  /** esc() + ぼかし：pii に挙げた文字列（テスト客の氏名など）だけを .pii で囲む */
  const escP = (s, pii) => { let h = esc(s); for (const v of pii || []) if (v) h = h.split(esc(v)).join('<span class="pii" style="display:inline-block">' + esc(v) + '</span>'); return h; };
  const COLORS = ['#5e8e3e', '#1e88e5', '#8e24aa', '#e8710a', '#00897b', '#c2185b', '#5c6bc0'];
  const avColor = (s) => COLORS[[...String(s)].reduce((a, c) => a + c.charCodeAt(0), 0) % COLORS.length];
  /** "14:01" → "14:01（3 分前）" against the taskbar clock (Gmail shows the age of today's messages) */
  function ago(t) {
    const m = String(t).match(/^(\d{1,2}):(\d{2})$/);
    if (!m || !window.Win11) return esc(t);
    const now = window.Win11.now();
    const d = Math.max(0, Math.round((now.getHours() * 60 + now.getMinutes()) - (+m[1] * 60 + +m[2])));
    return `${esc(t)} (${d < 60 ? `${d} 分前` : `${Math.floor(d / 60)} 時間前`})`;
  }
  const PDF = '<svg width="16" height="16" viewBox="0 0 16 16"><rect width="16" height="16" rx="2" fill="#ea4335"/><text x="8" y="11" font-size="5.6" font-family="Arial" font-weight="700" fill="#fff" text-anchor="middle">PDF</text></svg>';

  window.GmailUI = {
    mi,
    /** the page shell: cfg { account: letter, avatar: color, labels: [..], tabs: bool (personal Gmail inbox categories) } */
    shell(cfg) {
      this.cfg = cfg;
      return `<div class="wm gmx${cfg.tabs ? ' tabs' : ''}" id="wm">
        <div class="gx-h"><span class="hi">${mi('menu', 24)}</span><img class="gx-logo" src="assets/gmail_lockup.png" alt="Gmail" width="109" height="40">
          <div class="gx-s">${mi('search', 24)}<span>メールを検索</span>${mi('tune', 24)}</div>
          <span class="hr"><span class="hi">${mi('help', 24)}</span><span class="hi">${mi('settings', 24)}</span><span class="hi">${mi('apps', 24)}</span><span class="gx-av" style="background:${cfg.avatar || '#5e8e3e'}">${esc(cfg.account || 'K')}</span></span></div>
        <div class="gx-b">
          <div class="gx-rail"><div class="ri on"><span class="ic">${mi('mail')}<b class="gx-bd" id="wmRail"></b></span>Mail</div><div class="ri"><span class="ic">${mi('chat')}</span>Chat</div><div class="ri"><span class="ic">${mi('meet')}</span>Meet</div></div>
          <aside class="wm-side"><div class="wm-compose">${mi('edit', 24)}<span>作成</span></div>
            <div class="wm-f on">${mi('inbox')}<span>受信トレイ</span><b id="wmCount"></b></div>
            <div class="wm-f">${mi('star')}<span>スター付き</span></div><div class="wm-f">${mi('schedule')}<span>スヌーズ中</span></div>
            <div class="wm-f">${mi('send')}<span>送信済み</span></div><div class="wm-f">${mi('draft')}<span>下書き</span></div><div class="wm-f">${mi('expand')}<span>もっと見る</span></div>
            <div class="wm-lbl"><span>ラベル</span>${mi('add')}</div>
            ${(cfg.labels || []).map((l) => `<div class="wm-f">${mi('label')}<span>${esc(l)}</span></div>`).join('')}</aside>
          <main class="wm-main"><div class="wm-body" id="wmBody"></div></main>
        </div></div>`;
    },
    count(list) {
      const n = list.filter((m) => !m.read).length;
      const c = document.getElementById('wmCount'); if (c) c.textContent = n || '';
      const r = document.getElementById('wmRail'); if (r) { r.textContent = n || ''; r.style.display = n ? '' : 'none'; }
    },
    /** the inbox: toolbar, (categories), rows. o.newIdx: rows up to this index arrive with the animation */
    list(list, o = {}) {
      this.count(list);
      const n = list.length;
      const cats = this.cfg && this.cfg.tabs ? `<div class="gx-cats"><div class="c on">${mi('inbox')}<span>メイン</span></div><div class="c">${mi('promo')}<span>プロモーション</span></div><div class="c">${mi('group')}<span>ソーシャル</span></div><div class="c">${mi('info')}<span>新着</span></div></div>` : '';
      return `<div class="gx-tool"><span class="ti">${mi('box')}${mi('drop', 18)}</span><span class="ti">${mi('refresh')}</span><span class="ti">${mi('more')}</span>
          <span class="pg">${n ? `1～${n} / ${n}` : ''}</span><span class="ti dim">${mi('left')}</span><span class="ti dim">${mi('right')}</span></div>${cats}
        <div class="wm-list">${list.map((m, i) => `<div class="wm-row${m.read ? '' : ' unread'}${m.att ? ' att' : ''}${(o.newIdx != null && (o.newAll ? i <= o.newIdx : i === o.newIdx)) ? ' new' : ''}" data-mail="${i}">
            <span class="c">${mi('box')}</span><span class="c">${mi('star')}</span>
            <span class="wm-from">${esc(m.from)}</span>
            <span class="wm-subj"><b>${escP(m.subject, m.pii)}</b><span class="sn"> - ${escP(m.snippet, m.pii)}</span>${m.att ? `<span class="gx-chip">${PDF}<span>${esc(m.att)}</span></span>` : ''}</span>
            <span class="wm-date">${esc(m.time)}</span></div>`).join('')}</div>`;
    },
    /** one message. m: { from, addr, to, subject, label, time, html | text, att } */
    reading(m, list) {
      const pos = list ? list.findIndex((x) => x.subject === m.subject && x.time === m.time) + 1 : 1;
      const tot = list ? list.length : 1;
      const body = m.html != null ? m.html : escP(m.text, m.pii);
      return `<div class="wm-read"><div class="gx-tool wm-tools"><span class="ti" data-back>${mi('back')}</span><span class="ti">${mi('archive')}</span><span class="ti">${mi('report')}</span><span class="ti">${mi('del')}</span><i class="sep"></i>
          <span class="ti">${mi('unread')}</span><span class="ti">${mi('schedule')}</span><span class="ti">${mi('task')}</span><i class="sep"></i><span class="ti">${mi('move')}</span><span class="ti">${mi('label')}</span><span class="ti">${mi('more')}</span>
          <span class="pg">${pos} / ${tot}</span><span class="ti${pos <= 1 ? ' dim' : ''}">${mi('left')}</span><span class="ti${pos >= tot ? ' dim' : ''}">${mi('right')}</span></div>
        <div class="gx-scroll"><div class="gx-subj"><h2>${escP(m.subject, m.pii)}</h2><span class="lc">受信トレイ<i>×</i></span>${m.label ? `<span class="lc">${esc(m.label)}<i>×</i></span>` : ''}<span class="ri">${mi('print')}${mi('openNew')}</span></div>
          <div class="gx-mh"><span class="av" style="background:${avColor(m.from)}">${esc(String(m.from)[0])}</span>
            <div class="fr"><div><b>${esc(m.from)}</b> <span class="ad${m.addrPii ? ' pii' : ''}">&lt;${esc(m.addr)}&gt;</span></div><div class="to">To ${m.toHtml || (m.to ? esc(m.to) : '自分')} ${mi('drop', 16)}</div></div>
            <div class="gx-dt"><span>${ago(m.time)}</span>${mi('star')}${mi('emoji')}${mi('reply')}${mi('more')}</div></div>
          <div class="wm-text" id="wmText">${body}</div>
          ${m.att ? `<div class="gx-atts"><div class="gx-att" id="wmAttach"><div class="th"><div class="pg"></div></div><div class="nm">${PDF}<span>${esc(m.att)}</span></div></div></div>` : ''}
          <div class="gx-btns"><span class="b">${mi('reply')}返信</span><span class="b">${mi('forward')}転送</span><span class="b r">${mi('emoji')}</span></div></div></div>`;
    },
  };
})();
