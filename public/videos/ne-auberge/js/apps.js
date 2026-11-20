/*
 * The three desktop apps of the demo and the web tools opened in the browser:
 *   Design  — Figma-style canvas with frames that render the real page (static mode)
 *   Code    — VS Code-style editor + terminal (files from code-files.js)
 *   Browser — Chrome-style tabs: dev server / production site (live mode), Sveltia CMS, Tag Manager,
 *             Tag Assistant, Analytics DebugView, Schema Markup Validator, view-source, plain text
 * Real UIs, captured (js/real-ui.js): Sveltia CMS (open source, run with the site's own config), the Schema Markup
 * Validator (public page), Chrome's view-source page. Look-alikes: the design tool and the editor, Tag Manager /
 * Tag Assistant / Analytics (they need a Google login) — with their real icons; the taskbar shows the real app icons.
 */
(function () {
  'use strict';
  const D = window.Demo;
  const { $, $$, esc, icon, clamp, wait, kw, tween, Ease, Cursor, UI, screenRect, pointOf, clickUi, moveToEl, Keycap, KeyStrip, typeInto, fieldTarget, Clock } = D;
  const S = window.SITE_SNAPSHOT;
  const CF = window.CodeFiles;

  /* ====================================================================== DESIGN */
  const ROOT_VARS = (() => {
    const m = (Object.values(S.css)[0] || '').match(/:root\{([^}]*)\}/);
    const out = {};
    if (m) m[1].split(';').forEach((d) => { const i = d.indexOf(':'); if (i > 0) out[d.slice(0, i).trim()] = d.slice(i + 1).trim(); });
    return out;
  })();
  const COLOR_VARS = ['--bg', '--bg-alt', '--ink', '--ink-body', '--annotation', '--fv', '--hair'].filter((k) => ROOT_VARS[k]);
  const hex6 = (v) => { v = v.replace('#', ''); if (v.length === 3) v = v.split('').map((c) => c + c).join(''); return '#' + v.slice(0, 6).toUpperCase(); };
  function rgbToHex(rgb) {
    const m = String(rgb).match(/\d+(\.\d+)?/g);
    if (!m) return '';
    return '#' + m.slice(0, 3).map((x) => (+x).toString(16).padStart(2, '0')).join('').toUpperCase();
  }
  function varOfColor(hex) { return COLOR_VARS.find((k) => hex6(ROOT_VARS[k]) === hex) || ''; }

  // Figma's own glyphs (UI3, 2026): layer types, right-sidebar controls, variable types
  const fsv = (w, b, sw = 1) => `<svg width="${w}" height="${w}" viewBox="0 0 ${w} ${w}" fill="none" stroke="currentColor" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round">${b}</svg>`;
  const FG = {
    frame: fsv(16, '<path d="M5.5 2v12M10.5 2v12M2 5.5h12M2 10.5h12"/>'),
    section: fsv(16, '<path d="M5.5 2v12M10.5 2v12M2 5.5h12M2 10.5h12"/>'),
    text: fsv(16, '<path d="M3.5 3.5h9M8 3.5v9.5"/>'),
    image: fsv(16, '<rect x="2.5" y="3" width="11" height="10" rx="1"/><circle cx="6" cy="6.5" r="1"/><path d="m2.5 11.5 3.2-3 2.4 2.2 2.2-1.8 3.2 2.8"/>'),
    group: fsv(16, '<rect x="3" y="3" width="10" height="10" rx=".5" stroke-dasharray="2 1.6"/>'),
    component: fsv(16, '<path d="M8 2 10 4 8 6 6 4zM12 6l2 2-2 2-2-2zM8 10l2 2-2 2-2-2zM4 6l2 2-2 2-2-2z"/>'),
    instance: fsv(16, '<path d="M8 2.6 13.4 8 8 13.4 2.6 8z"/>'),
    rect: fsv(16, '<rect x="3" y="3" width="10" height="10" rx=".5"/>'),
    chev: fsv(10, '<path d="M2.5 4 5 6.5 7.5 4"/>', 1.2),
    chevR: fsv(10, '<path d="M4 2.5 6.5 5 4 7.5"/>', 1.2),
    plus: fsv(16, '<path d="M8 3.5v9M3.5 8h9"/>'),
    minus: fsv(16, '<path d="M3.5 8h9"/>'),
    eye: fsv(16, '<path d="M1.8 8S4.2 3.8 8 3.8 14.2 8 14.2 8 11.8 12.2 8 12.2 1.8 8 1.8 8z"/><circle cx="8" cy="8" r="2"/>'),
    styles: fsv(16, '<circle cx="5" cy="5" r="1.6"/><circle cx="11" cy="5" r="1.6"/><circle cx="5" cy="11" r="1.6"/><circle cx="11" cy="11" r="1.6"/>'),
    pageIc: fsv(16, '<rect x="3" y="2.5" width="6.5" height="11" rx="1.5"/><path d="M9.5 5.5h1.5a2 2 0 0 1 2 2v1.5a2 2 0 0 1-2 2h-1.5"/>'),
    code: fsv(16, '<path d="m5.5 4.5-3.5 3.5 3.5 3.5M10.5 4.5 14 8l-3.5 3.5"/>'),
    dots: fsv(16, '<circle cx="3.5" cy="8" r=".6" fill="currentColor"/><circle cx="8" cy="8" r=".6" fill="currentColor"/><circle cx="12.5" cy="8" r=".6" fill="currentColor"/>'),
    tune: fsv(16, '<path d="M4 2.5v11M12 2.5v11M8 2.5v11"/><circle cx="4" cy="10" r="1.5" fill="#fff"/><circle cx="12" cy="6" r="1.5" fill="#fff"/><circle cx="8" cy="8" r="1.5" fill="#fff"/>'),
    alV: fsv(16, '<rect x="3" y="4" width="7" height="2.6" rx=".8"/><rect x="3" y="9.4" width="10" height="2.6" rx=".8"/>'),
    // variable types: colour (palette), number (#), string (Aa-like)
    vColor: fsv(16, '<path d="M8 2.5a5.5 5.5 0 0 0 0 11c.9 0 1.3-.6 1.1-1.3-.3-.9.3-1.7 1.2-1.7H12a1.5 1.5 0 0 0 1.5-1.5A5.5 5.5 0 0 0 8 2.5z"/><circle cx="5.3" cy="7.2" r=".7"/><circle cx="7.6" cy="5.1" r=".7"/><circle cx="10.4" cy="5.8" r=".7"/>'),
    vNum: fsv(16, '<path d="M6.2 3 5 13M11 3 9.8 13M3 6h10.5M2.5 10H13"/>'),
    vStr: fsv(16, '<path d="M2.5 12.5 5.5 4l3 8.5M3.6 9.6h3.8M10 8.3c.4-.6 1-.9 1.7-.9 1 0 1.8.6 1.8 1.7v3.4M13.5 10.2c-.6-.3-1.2-.4-1.8-.4-1 0-1.8.5-1.8 1.4 0 .8.7 1.3 1.5 1.3.9 0 1.7-.5 2.1-1.2"/>'),
  };
  const fA = (b) => fsv(14, b);
  const fSeg = (icons, on = -1) => `<span class="fg-seg">${icons.map((ic, i) => `<span${i === on ? ' class="on"' : ''}>${ic}</span>`).join('')}</span>`;
  /** right-sidebar section: title + action icons; empty sections have a grey title */
  const fSec = (title, body, ac = FG.plus) => `<div class="fg-ps${body ? '' : ' h em'}"><div class="fg-ps-h">${title}<span class="ic">${ac}</span></div>${body || ''}</div>`;
  const fIn = (k, v, o = {}) => `<div class="fg-in${o.cls ? ' ' + o.cls : ''}"${o.f ? ` data-f="${o.f}"` : ''}>${k ? `<span class="k">${k}</span>` : ''}<span class="v">${v}</span>${o.s ? `<span class="s">${o.s}</span>` : ''}</div>`;
  /** 位置 (alignment, X / Y, rotation) — the same block for frames, text and images */
  const fPos = (x, y) => fSec('位置', `<div class="sub">配置</div><div class="fg-row">${fSeg([fA('<path d="M2.5 2v10M5 4.5h7M5 9.5h4"/>'), fA('<path d="M7 2v10M3 4.5h8M4.5 9.5h5"/>'), fA('<path d="M11.5 2v10M2 4.5h7M5 9.5h4"/>')])}${fSeg([fA('<path d="M2 2.5h10M4.5 5v7M9.5 5v4"/>'), fA('<path d="M2 7h10M4.5 3v8M9.5 4.5v5"/>'), fA('<path d="M2 11.5h10M4.5 2v7M9.5 5v4"/>')])}</div>
        <div class="sub">位置</div><div class="fg-row">${fIn('X', x)}${fIn('Y', y)}</div>
        <div class="sub">回転</div><div class="fg-row">${fIn(fA('<path d="M3 3v8h8M3 7.5a4 4 0 0 1 3.5 3.5"/>'), '0°')}${fSeg([fA('<path d="M4 3.5a5 5 0 1 1-1 5.5"/><path d="M4 1.5v2h2"/>'), fA('<path d="M7 2v10M2.5 4v6l3-3zM11.5 4v6l-3-3z"/>'), fA('<path d="M2 7h10M4 2.5h6l-3 3zM4 11.5h6l-3-3z"/>')])}</div>`, '');
  const fLook = (o = {}) => fSec('外見', `<div class="fg-row" style="color:#757575;margin:0 0 4px"><span style="flex:1">不透明度</span><span style="flex:1">角の半径</span></div><div class="fg-row">${fIn(fA('<rect x="2" y="2" width="10" height="10" rx="1" stroke-dasharray="1.5 1.5"/>'), '100%')}${fIn(fA('<path d="M2 7V4a2 2 0 0 1 2-2h3"/>'), '0', { cls: o.text ? 'dis' : '' })}<span class="fg-ib">${fA('<path d="M2 5V2.5h2.5M9.5 2.5H12V5M12 9v2.5H9.5M4.5 11.5H2V9"/>')}</span></div>`, `${FG.eye}${fsv(16, '<path d="M8 2.5 12 8a4 4 0 1 1-8 0z"/>')}`);
  const fHead = (t, ac) => `<div class="fg-ps h"><div class="fg-ps-h">${t} ${FG.chev}<span class="ic">${ac || `${FG.code}${FG.dots}`}</span></div></div>`;
  const fResize = `<span class="fg-ib">${fA('<path d="M2 5V2h3M9 2h3v3M12 9v3H9M5 12H2V9"/>')}</span>`;

  const Design = {
    cam: { x: 0, y: 0, z: 0.5 },
    frames: {},
    sel: null, hov: null,
    init() {
      this.canvas = $('#fgCanvas');
      this.world = $('#fgWorld');
      const photos = ['Ne_226_PR', 'Ne_222_PR', 'Ne_0156', 'Ne_233_PR_m', 'Ne_0040', 'Ne_24', 'Ne_232_PR', 'Ne_view', 'Ne_sui_1', 'Ne_0123', 'Ne_0082', 'Ne_208_PR', 'Ne_0165', 'Ne_0037', 'Ne_0157'];
      $('#fgAssets').innerHTML = photos.map((p) => `<div class="fg-asset" data-asset="${p}"><div class="th" style="background-image:url(assets/photos/${p}.webp)"></div><span>${p}.jpg</span></div>`).join('');
      $('#fgLogos').innerHTML = [['architizer-winner-2026', 'Architizer'], ['aficionados-white', 'Aficionados'], ['good-design', 'Good Design']]
        .map(([f, n]) => `<div class="fg-asset" data-logo="${f}"><div class="th" style="background-image:url(assets/logos/${f}.webp)"></div><span>${n}</span></div>`).join('');
      this.apply();
      D.frameFns.add(() => this.track());
      Props.empty();
    },
    apply() {
      const { x, y, z } = this.cam;
      this.world.style.transform = `translate(${(-x * z).toFixed(2)}px, ${(-y * z).toFixed(2)}px) scale(${z})`;
      $('#fgZoom').textContent = Math.round(z * 100) + '%';
      Object.values(this.frames).forEach((f) => { f.label.style.fontSize = 11 / z + 'px'; f.label.style.paddingBottom = 4 / z + 'px'; });
    },
    view() { const r = this.canvas.getBoundingClientRect(); return { w: r.width, h: r.height, r }; },
    /** camera that shows world rect (x, y, w, h) — anchored top-left with padding */
    camFor(x, y, w, h, o = {}) {
      const v = this.view();
      const pad = o.pad != null ? o.pad : 70;
      const z = o.z || Math.min((v.w - pad * 2) / w, (v.h - pad * 2) / h);
      const cx = x + w / 2, cy = o.top != null ? null : y + h / 2;
      return { x: cx - v.w / 2 / z, y: o.top != null ? y - o.top / z : cy - v.h / 2 / z, z };
    },
    async camTo(c, ms = 900) {
      const s = { ...this.cam };
      await tween(ms, (e) => {
        this.cam.x = s.x + (c.x - s.x) * e;
        this.cam.y = s.y + (c.y - s.y) * e;
        this.cam.z = s.z + (c.z - s.z) * e;
        this.apply();
      }, Ease.inOut);
    },
    toScreen(wx, wy) { const r = this.canvas.getBoundingClientRect(); return [r.left + (wx - this.cam.x) * this.cam.z, r.top + (wy - this.cam.y) * this.cam.z]; },
    toWorld(sx, sy) { const r = this.canvas.getBoundingClientRect(); return [(sx - r.left) / this.cam.z + this.cam.x, (sy - r.top) / this.cam.z + this.cam.y]; },

    async addFrame(id, o) {
      const el = document.createElement('div');
      el.className = 'fg-frame';
      el.style.left = o.x + 'px';
      el.style.top = o.y + 'px';
      el.innerHTML = `<div class="fg-flabel">${esc(o.label)}</div><div class="fg-fbody"><iframe scrolling="no" tabindex="-1"></iframe></div>`;
      this.world.appendChild(el);
      const f = { id, el, label: el.querySelector('.fg-flabel'), body: el.querySelector('.fg-fbody'), iframe: el.querySelector('iframe'), x: o.x, y: o.y, w: o.w, h: o.h, vh: o.vh, name: o.label };
      f.iframe.style.width = o.w + 'px';
      f.iframe.style.height = (o.ih || 11000) + 'px';
      f.body.style.width = o.w + 'px';
      f.body.style.height = o.h + 'px';
      f.body.style.background = '#F7F7F6';
      if (o.hiddenUntilLoad) el.style.visibility = 'hidden';
      this.frames[id] = f;
      this.apply();
      f.doc = await window.SiteFrame.load(f.iframe, 'static', { vh: o.vh, before: o.before });
      f.win = f.iframe.contentWindow;
      return f;
    },
    rename(f, name) { f.name = name; f.label.textContent = name; },
    setWidth(f, w, vh) {
      f.w = w;
      f.iframe.style.width = w + 'px';
      f.body.style.width = w + 'px';
      if (vh) f.doc.documentElement.style.setProperty('--demo-vh', vh + 'px');
    },
    contentH(f) { return Math.ceil(f.doc.body.getBoundingClientRect().height); },
    fitHeight(f) { f.h = Math.max(200, this.contentH(f)); f.body.style.height = f.h + 'px'; },
    /** world y of an element inside a frame */
    worldY(f, el) { return f.y + el.getBoundingClientRect().top + f.win.scrollY; },

    select(target) {
      this.sel = target;
      $('#fgSel').classList.toggle('show', !!target);
      $$('.fg-flabel').forEach((l) => l.classList.remove('sel'));
      if (target && target.frame && !target.el) target.frame.label.classList.add('sel');
      if (!$('#fgSel .h')) $('#fgSel').insertAdjacentHTML('afterbegin', '<span class="h" style="left:0;top:0"></span><span class="h" style="left:100%;top:0"></span><span class="h" style="left:0;top:100%"></span><span class="h" style="left:100%;top:100%"></span>');
      this.track();
    },
    hover(target) { this.hov = target; $('#fgHov').classList.toggle('show', !!target); this.track(); },
    rectOf(t) { return t.el ? screenRect(t.el) : screenRect(t.frame.body); },
    track() {
      const c = this.canvas.getBoundingClientRect();
      const place = (box, t) => {
        const r = this.rectOf(t);
        box.style.left = r.left - c.left + 'px';
        box.style.top = r.top - c.top + 'px';
        box.style.width = r.width + 'px';
        box.style.height = r.height + 'px';
        return r;
      };
      if (this.sel) {
        const r = place($('#fgSel'), this.sel);
        const t = this.sel;
        const w = t.el ? t.el.getBoundingClientRect().width : t.frame.w;
        const h = t.el ? t.el.getBoundingClientRect().height : t.frame.h;
        $('#fgSelSize').textContent = `${Math.round(w)} × ${Math.round(h)}`;
        void r;
      }
      if (this.hov) place($('#fgHov'), this.hov);
    },
    setTool(name) { $$('.fg-tool[data-tool]').forEach((t) => t.classList.toggle('active', t.dataset.tool === name)); },
    leftTab(name) {
      $$('.fg-ltabs span').forEach((s) => s.classList.toggle('on', s.dataset.ltab === name));
      $$('.fg-lpane').forEach((p) => p.classList.toggle('on', p.dataset.lpane === name));
    },
  };

  const Layers = {
    items: [],
    render() {
      $('#fgLayers').innerHTML = this.items.map((it) =>
        `<div class="fg-layer ${it.kind}${it.sel ? ' sel' : ''}${it.isNew ? ' new' : ''}" data-key="${it.key}" style="padding-left:${10 + it.depth * 24}px">` +
        `<span class="lic">${FG[it.kind] || FG.rect}</span><span>${esc(it.name)}</span></div>`).join('');
      this.items.forEach((it) => { it.isNew = false; });
    },
    add(item, o = {}) {
      item.isNew = !Clock.ff;
      const i = o.after ? this.items.findIndex((x) => x.key === o.after) : -1;
      if (o.first) this.items.unshift(item);
      else if (i >= 0) {
        let j = i + 1;
        while (j < this.items.length && this.items[j].depth > this.items[i].depth) j++;
        if (o.child) j = i + 1;
        this.items.splice(j, 0, item);
      } else this.items.push(item);
      this.render();
    },
    rename(key, name) { const it = this.items.find((x) => x.key === key); if (it) { it.name = name; this.render(); } },
    select(key) { this.items.forEach((x) => { x.sel = x.key === key; }); this.render(); },
    el(key) { return $(`.fg-layer[data-key="${key}"]`); },
  };

  /* right sidebar (デザイン tab) — UI3 as of 2026-11: sections 位置 / レイアウト / 外見 / タイポグラフィ / 塗り / 線 /
     エフェクト / エクスポート; nothing selected: ページ / スタイル / エクスポート (variables moved to the navigation bar) */
  const Props = {
    root() { return $('#fgProps'); },
    empty() {
      this.root().innerHTML = fSec('ページ', `<div class="fg-row">${this.fillIn('#F5F5F5')}<span class="fg-ib">${FG.eye}</span></div>`, FG.pageIc) +
        fSec('スタイル', '') + fSec('エクスポート', '');
    },
    /** frame tool: the preset list (groups collapsed except デスクトップ) */
    presets() {
      const G = ['スマートフォン', 'タブレット', 'デスクトップ', 'プレゼンテーション', 'ウォッチ', '用紙', 'ソーシャルメディア', 'Figma コミュニティ', 'アーカイブ'];
      const DESK = [['MacBook Air', '1280×832'], ['MacBook Pro 14インチ', '1512×982'], ['MacBook Pro 16インチ', '1728×1117'], ['デスクトップ', '1440×1024', 'desktop'], ['ワイヤーフレーム', '1440×1024'], ['TV', '1280×720']];
      this.root().innerHTML = `<div class="fg-ps h"><div class="fg-ps-h">フレーム</div></div><div class="fg-pre">${G.map((g) => g === 'デスクトップ'
        ? `<div class="g"><span class="cv">${FG.chev}</span>${g}</div>${DESK.map(([n, s, k]) => `<div class="it"${k ? ` data-preset="${k}"` : ''}><span>${n}</span><small>${s}</small></div>`).join('')}`
        : `<div class="g"><span class="cv">${FG.chevR}</span>${g}</div>`).join('')}</div>`;
    },
    /** a fill input: a colour variable shows as a chip with its name, otherwise the hex value */
    fillIn(hex, o = {}) {
      const v = varOfColor(hex);
      const body = o.img ? `<span class="sw" style="background-image:url(${o.img})"></span><span class="v">画像</span>`
        : v ? `<span class="fg-var"><span class="sw" style="background:${hex}"></span>${esc(v.replace('--', ''))}</span>`
          : `<span class="sw" style="background:${hex}"></span><span class="v">${hex.slice(1)}</span>`;
      return `<div class="fg-in fill" data-f="fill">${body}<span class="op">100 <i>%</i></span></div>`;
    },
    fillRow(hex, o = {}) { return `<div class="fg-row">${this.fillIn(hex, o)}<span class="fg-ib">${FG.eye}</span><span class="fg-ib">${FG.minus}</span></div>`; },
    fills(rows) { return fSec('塗り', rows, `${FG.styles}${FG.plus}`); },
    frame(f) {
      this.root().innerHTML = fHead('フレーム') + fPos(Math.round(f.x), Math.round(f.y)) +
        fSec('レイアウト', `<div class="sub">サイズ</div><div class="fg-row">${fIn('W', f.w, { f: 'w' })}${fIn('H', f.h, { f: 'h' })}${fResize}</div>
          <div class="fg-chk"><i>${fsv(10, '<path d="m2.5 5 2 2 3.5-4" stroke="#fff"/>', 1.4)}</i>コンテンツを隠す</div>`, `${fsv(16, '<path d="M3 3l3 3M13 3l-3 3M3 13l3-3M13 13l-3-3"/>')}${FG.alV}`) +
        fLook() + this.fills(this.fillRow('#F7F7F6')) + fSec('線', '') + fSec('エフェクト', '') + fSec('レイアウトガイド', '') + fSec('エクスポート', '');
    },
    text(el, name) {
      const cs = el.ownerDocument.defaultView.getComputedStyle(el);
      const r = el.getBoundingClientRect();
      const size = parseFloat(cs.fontSize);
      const lh = cs.lineHeight === 'normal' ? 0 : parseFloat(cs.lineHeight);
      const ls = parseFloat(cs.letterSpacing) || 0;
      const fam = cs.fontFamily.split(',')[0].replace(/["']/g, '').trim();
      const wt = { 300: 'Light', 400: 'Regular', 500: 'Medium', 600: 'SemiBold', 700: 'Bold' }[cs.fontWeight] || 'Regular';
      const hex = rgbToHex(cs.color);
      const r1 = (n) => Math.round(n * 10) / 10;
      const auto = cs.whiteSpace === 'nowrap';
      const al = { center: 1, right: 2, end: 2 }[cs.textAlign] || 0;
      void name;
      this.root().innerHTML = fHead('テキスト') + fPos(Math.round(r.left), Math.round(r.top + el.ownerDocument.defaultView.scrollY)) +
        fSec('レイアウト', `<div class="sub">サイズ変更</div><div class="fg-row" data-f="wrap">${fSeg([fA('<path d="M2.5 3v8M5 7h6.5M9.5 5l2 2-2 2"/>'), fA('<path d="M3 2.5h8M7 5v6.5M5 9.5l2 2 2-2"/>'), fA('<rect x="2.5" y="2.5" width="9" height="9" rx="1"/><path d="M5 5.5h4M5 8.5h3"/>')], auto ? 0 : 1)}</div>
          <div class="fg-row" style="margin-top:8px">${fIn('W', Math.round(r.width), { s: auto ? '内包' : '' })}${fIn('H', Math.round(r.height), { s: '内包' })}${fResize}</div>`, '') +
        fLook({ text: true }) +
        fSec('タイポグラフィ', `<div class="fg-row"><span class="fg-dd2">${esc(fam)}<span class="c">${FG.chev}</span></span></div>
          <div class="fg-row"><span class="fg-dd2">${wt}<span class="c">${FG.chev}</span></span><div class="fg-in fill" data-f="size"><span class="v">${r1(size)}</span><span class="op" style="width:28px;padding:0;justify-content:center">${FG.chev}</span></div></div>
          <div class="fg-row" style="color:#757575;margin:4px 0"><span style="flex:1">行間</span><span style="flex:1">文字間隔</span></div>
          <div class="fg-row">${fIn(fA('<path d="M3 2.5h8M3 11.5h8M5 9.5 7 4l2 5.5M5.7 7.8h2.6"/>'), lh ? Math.round((lh / size) * 100) + '%' : '自動')}${fIn(fA('<path d="M2 2v10M12 2v10M5 9.5 7 4l2 5.5"/>'), Math.round((ls / size) * 100) + '%')}</div>
          <div class="sub">配置</div><div class="fg-row">${fSeg([fA('<path d="M2.5 3.5h9M2.5 7h6M2.5 10.5h9"/>'), fA('<path d="M2.5 3.5h9M4 7h6M2.5 10.5h9"/>'), fA('<path d="M2.5 3.5h9M5.5 7h6M2.5 10.5h9"/>')], al)}${fSeg([fA('<path d="M2.5 2.5h9M7 4.5v7M4.5 7 7 4.5 9.5 7"/>'), fA('<path d="M2.5 7h9M7 2v3M7 9v3"/>'), fA('<path d="M2.5 11.5h9M7 2.5v7M4.5 7 7 9.5 9.5 7"/>')], 0)}<span class="fg-ib">${FG.tune}</span></div>`, FG.styles) +
        this.fills(this.fillRow(hex)) + fSec('線', '') + fSec('エフェクト', '');
    },
    /** a frame whose fill is a photo (the hero section) */
    image(el, name, file) {
      const r = el.getBoundingClientRect();
      void name;
      this.root().innerHTML = fHead('フレーム') + fPos(Math.round(r.left), Math.round(r.top)) +
        fSec('レイアウト', `<div class="sub">サイズ</div><div class="fg-row">${fIn('W', Math.round(r.width), { f: 'w' })}${fIn('H', Math.round(r.height), { f: 'h' })}${fResize}</div>
          <div class="fg-chk"><i>${fsv(10, '<path d="m2.5 5 2 2 3.5-4" stroke="#fff"/>', 1.4)}</i>コンテンツを隠す</div>`, '') +
        fLook() + this.fills(this.fillRow('', { img: `assets/photos/${file}.webp` })) + fSec('線', '') + fSec('エフェクト', '') + fSec('エクスポート', '');
    },
    field(name) { return $(`[data-f="${name}"]`, this.root()); },
    flash(name) { const f = this.field(name); if (f) { f.classList.remove('changed'); void f.offsetWidth; f.classList.add('changed'); } },
  };

  /* variables view (navigation bar → バリアブル): collections on the left, 名前 / 値 table on the right */
  const Vars = {
    coll: 'color',
    NAMES: { color: 'Color', type: 'Typography', space: 'Spacing' },
    open() {
      $('#fgVars').classList.add('show');
      $$('.fg-rail .it').forEach((s) => s.classList.toggle('on', s.id === 'fgVarsBtn'));
      this.counts();
    },
    close() {
      $('#fgVars').classList.remove('show');
      const pane = ($('.fg-lpane.on') || {}).dataset || {};
      $$('.fg-rail .it').forEach((s) => s.classList.toggle('on', s.dataset.ltab === (pane.lpane || 'layers')));
    },
    rows(coll) {
      const COLL = {
        color: COLOR_VARS.map((k) => [k, ROOT_VARS[k], 'color']),
        type: ['--fs-display', '--fs-h1', '--fs-h2', '--fs-body', '--fs-caption', '--lh-body', '--lh-head', '--ls', '--serif'].filter((k) => ROOT_VARS[k]).map((k) => [k, ROOT_VARS[k]]),
        space: ['--section-y', '--gutter', '--maxw', '--measure', '--space-1', '--space-2', '--space-3', '--space-4'].filter((k) => ROOT_VARS[k]).map((k) => [k, ROOT_VARS[k]]),
      };
      // Figma's number variables are unitless (px); anything else (clamp(), font stacks) is a string variable
      return (COLL[coll] || []).map(([k, v, kind]) => {
        if (kind) return [k, v, kind];
        const m = String(v).trim().match(/^(-?[\d.]+)(px|rem|em)?$/);
        return m ? [k, String(Math.round(parseFloat(m[1]) * (m[2] === 'rem' || m[2] === 'em' ? 16 : 1) * 100) / 100), 'num'] : [k, v, 'str'];
      });
    },
    counts() {
      $('#fgVarColls').innerHTML = Object.keys(this.NAMES).map((c) => `<div class="fg-vcoll${c === this.coll ? ' on' : ''}" data-coll="${c}">${this.NAMES[c]}<em>${this.rows(c).length}</em></div>`).join('');
      $('#fgVarCount').textContent = this.rows(this.coll).length;
    },
    async show(coll, o = {}) {
      this.coll = coll;
      $$('.fg-vcoll').forEach((c) => c.classList.toggle('on', c.dataset.coll === coll));
      $('#fgVarCount').textContent = this.rows(coll).length;
      const t = $('#fgVarTable');
      t.innerHTML = `<div class="fg-vrow head"><span>名前</span><span>値</span><span>${FG.plus}</span></div>`;
      for (const [k, v, kind] of this.rows(coll)) {
        const val = kind === 'color'
          ? `<span class="sw" style="background:${v}"></span>${hex6(v).slice(1)}`
          : esc(v.length > 34 ? v.slice(0, 33) + '…' : v);
        t.insertAdjacentHTML('beforeend', `<div class="fg-vrow${Clock.ff ? '' : ' new'}"><span class="nm">${kind === 'color' ? FG.vColor : kind === 'num' ? FG.vNum : FG.vStr}${esc(k.replace('--', ''))}</span><span class="vl">${val}</span><span></span></div>`);
        await kw(o.gap || 170);
      }
    },
  };

  /* ======================================================================== CODE */
  const LH = 21;
  // VS Code's file icons (Seti) and codicons: public/shared/vscode.js
  const fileIcon = (p) => window.VSC.fileIcon(p);
  const ci = (n) => window.VSC.ci(n);

  /** html of one line: tokens + range classes + zero-width inserts (caret / IME composition) */
  function lineHtml(tokens, ranges, inserts) {
    let total = 0;
    tokens.forEach(([t]) => { total += t.length; });
    const cuts = new Set();
    ranges.forEach((r) => { cuts.add(r.from); cuts.add(r.to); });
    inserts.forEach((x) => cuts.add(Math.min(x.at, total)));
    const pieces = [];
    let pos = 0;
    for (const [t, c] of tokens) {
      let s = 0;
      const local = [...cuts].filter((k) => k > pos && k < pos + t.length).sort((a, b) => a - b);
      for (const k of local) { pieces.push([t.slice(s, k - pos), c, pos + s]); s = k - pos; }
      pieces.push([t.slice(s), c, pos + s]);
      pos += t.length;
    }
    let html = '';
    const done = new Set();
    const emitIns = (p) => inserts.forEach((x, i) => { if (!done.has(i) && Math.min(x.at, total) === p) { html += x.html; done.add(i); } });
    for (const [t, c, start] of pieces) {
      emitIns(start);
      if (!t) continue;
      const rc = ranges.filter((r) => start >= r.from && start < r.to).map((r) => r.cls).join(' ');
      const cls = [c, rc].filter(Boolean).join(' ');
      html += cls ? `<span class="${cls}">${esc(t)}</span>` : esc(t);
    }
    emitIns(total);
    return html;
  }

  const Code = {
    files: {}, tabs: [], active: null, top: 0,
    ins: null, sel: null, sq: [], lineCls: {}, status: {},
    tree: [],
    init() {
      for (const [p, text] of Object.entries(CF.files)) this.files[p] = { path: p, lang: CF.langOf(p), lines: text.split('\n'), dirty: false };
      this.tree = CF.tree.map(([path, kind, open]) => ({ path, dir: kind === 'dir', open: !!open }));
      this.renderTree();
      this.render();
    },
    /* ---- explorer */
    renderTree() {
      const openDirs = new Set(this.tree.filter((n) => n.dir && n.open).map((n) => n.path));
      const visible = (p) => { const parts = p.split('/'); for (let i = 1; i < parts.length; i++) if (!openDirs.has(parts.slice(0, i).join('/'))) return false; return true; };
      $('#vsTree').innerHTML = this.tree.filter((n) => visible(n.path)).map((n) => {
        const depth = n.path.split('/').length - 1;
        const name = n.path.split('/').pop();
        const st = this.status[n.path] || '';
        return `<div class="vs-node${n.path === this.active ? ' focus' : ''}${st === 'M' ? ' mod' : st === 'U' ? ' add' : ''}" data-path="${esc(n.path)}" style="padding-left:${6 + depth * 12}px">` +
          (n.dir ? `<span class="tw">${ci(n.open ? 'chevron-down' : 'chevron-right')}</span>` : `<span class="tw"></span>${fileIcon(n.path)}`) +
          `<span class="nm">${esc(name)}</span>${st && !n.dir ? `<span class="st">${st}</span>` : ''}</div>`;
      }).join('');
    },
    node(path) { return $(`.vs-node[data-path="${CSS.escape(path)}"]`); },
    mark(path, st) { this.status[path] = st; this.renderTree(); this.gitBadge(); },
    gitBadge() { const n = Object.keys(this.status).length; const b = $('#vsGitBadge'); b.textContent = n; b.classList.toggle('show', n > 0); },
    /* ---- tabs + view */
    show(path, o = {}) {
      if (!this.tabs.includes(path)) this.tabs.push(path);
      this.active = path;
      this.top = o.top != null ? o.top : (this.files[path].lastTop || 0);
      this.left = this.files[path].lastLeft || 0;
      this.lockLeft = false;
      this.ins = null; this.sel = null; this.sq = []; this.lineCls = {};
      $('#vsLang').textContent = { astro: 'Astro', ts: 'TypeScript', css: 'CSS', json: 'JSON', yaml: 'YAML', md: 'Markdown', robots: 'Plain Text', html: 'HTML' }[this.files[path].lang] || 'Plain Text';
      this.renderTabs();
      this.renderTree();
      this.render();
    },
    async openFile(path, o = {}) {
      const n = this.node(path);
      if (n) await clickUi(n, { after: 60 });
      this.show(path, o);
      await wait(o.after != null ? o.after : 260);
    },
    renderTabs() {
      $('#vsTabs').innerHTML = this.tabs.map((p) => {
        const f = this.files[p];
        return `<div class="vs-tab${p === this.active ? ' on' : ''}${f.dirty ? ' dirty' : ''}" data-tab="${esc(p)}">${fileIcon(p)}<span class="nm">${esc(p.split('/').pop())}</span><span class="x">${ci('close')}</span></div>`;
      }).join('');
      const p = this.active ? this.active.split('/') : [];
      $('#vsCrumbs').innerHTML = p.map((x, i) => (i ? ci('chevron-right') : '') + (i === p.length - 1 ? fileIcon(this.active) : '') + `<span>${esc(x)}</span>`).join('');
    },
    /** visible rows: editor + terminal panel share a fixed height; the panel is 252px when shown. Measured once —
     *  reading the height after every render forced a full layout per keystroke (and could catch the panel mid-slide) */
    rows() {
      if (!this._hAll || this._rowsW !== innerWidth) {
        const h = $('#vsLines').clientHeight;
        if (!h) return 5;
        this._hAll = h + Math.max(0, $('#vsPanel').offsetHeight - 1);
        this._rowsW = innerWidth;
      }
      const on = $('#vsPanel').classList.contains('show');
      return Math.max(5, Math.floor((this._hAll - (on ? 252 : 0)) / LH));
    },
    render() {
      const box = $('#vsLines');
      const f = this.files[this.active];
      if (!f) { box.innerHTML = `<div class="vs-empty">${icon('code')}<span>ファイルを開いて編集を開始</span></div>`; window.VSC.minimap($('#vsMini'), null); return; }
      f.lastTop = this.top;
      const toks = CF.highlight(f.lang, f.lines);
      const start = Math.max(0, Math.floor(this.top)), frac = this.top - start;
      const end = Math.min(f.lines.length, start + this.rows() + 2);
      let html = '';
      for (let i = start; i < end; i++) {
        const ranges = [];
        if (this.sel && this.sel.line === i) ranges.push({ from: this.sel.from, to: this.sel.to, cls: 'selbg' });
        this.sq.filter((q) => q.line === i).forEach((q) => ranges.push({ from: q.from, to: q.to, cls: 'sq-err' }));
        const inserts = [];
        if (this.ins && this.ins.line === i) inserts.push({ at: this.ins.col, html: this.ins.html });
        if (this.probe && this.probe.line === i) inserts.push({ at: this.probe.col, html: '<span class="probe"></span>' });
        const cur = this.ins && this.ins.line === i;
        html += `<div class="vs-line${cur ? ' cur' : ''}${this.lineCls[i] ? ' ' + this.lineCls[i] : ''}" data-l="${i}"><span class="ln">${i + 1}</span><span class="lc"><span class="lx">${lineHtml(toks[i] || [], ranges, inserts)}</span></span></div>`;
      }
      box.innerHTML = html;
      box.style.paddingTop = 2 - frac * LH + 'px';
      window.VSC.minimap($('#vsMini'), toks, this.top);
      if (this.ins) $('#vsPos').textContent = `行 ${this.ins.line + 1}、列 ${this.ins.col + 1}`;
      this.follow();
    },
    /**
     * Horizontal scrolling like the real editor: when the caret (or the IME composition) goes past the right edge of
     * the (snapped, half-width) editor the view follows it a few characters ahead; when it comes back left of the view
     * it scrolls back. A scrollbar thumb shows at the bottom while lines are wider than the view.
     */
    follow() {
      const box = $('#vsLines');
      const lc = box.querySelector('.lc');
      if (!lc) return;
      const vw = lc.clientWidth;
      const mark = box.querySelector('.probe') || box.querySelector('.caret');
      if (mark && vw && !this.lockLeft) {
        const x = mark.offsetLeft;
        const comp = box.querySelector('.ime-c');
        const right = Math.max(x, comp ? comp.offsetLeft + comp.offsetWidth : 0);
        if (right - this.left > vw - 28) this.left = Math.ceil(right - vw + 56);
        else if (x - this.left < 10) this.left = Math.max(0, Math.floor(x - Math.min(120, vw * 0.25)));
        if (x < vw - 40 && this.left > 0 && right < vw - 28) this.left = 0;
      }
      const f = this.files[this.active];
      if (f) f.lastLeft = this.left;
      box.style.setProperty('--hx', this.left + 'px');
      let widest = 0;
      box.querySelectorAll('.lx').forEach((x) => { widest = Math.max(widest, x.offsetWidth); });
      const bar = $('#vsHbar');
      if (!bar) return;
      const on = widest > vw + 4 || this.left > 0;
      bar.classList.toggle('show', on);
      if (!on) return;
      const total = Math.max(widest + 40, this.left + vw);
      bar.firstElementChild.style.width = Math.max(30, (vw / total) * 100) + '%';
      bar.firstElementChild.style.left = (this.left / total) * 100 + '%';
    },
    lineEl(i) { return $(`.vs-line[data-l="${i}"]`); },
    ensureVisible(line, margin = 3) {
      const rows = this.rows();
      if (line < this.top + 1) this.top = Math.max(0, line - margin);
      else if (line > this.top + rows - margin) this.top = line - rows + margin + 1;
    },
    async scrollTo(top, ms = 700) {
      const s = this.top;
      await tween(ms, (e) => { this.top = s + (top - s) * e; this.render(); }, Ease.inOut);
    },
    /** screen rect of a column position on a line (line must be in view) */
    colRect(line, col) {
      this.lockLeft = false;
      this.probe = { line, col };
      this.render();
      const p = $('#vsLines .probe');
      const r = p ? p.getBoundingClientRect() : this.lineEl(line).getBoundingClientRect();
      this.probe = null;
      this.lockLeft = true; // keep the column in view until the click puts the caret there
      this.render();
      return { left: r.left, top: r.top, width: 0, height: LH, right: r.left, bottom: r.top + LH };
    },
    find(text, from = 0) {
      const f = this.files[this.active];
      for (let i = from; i < f.lines.length; i++) { const c = f.lines[i].indexOf(text); if (c >= 0) return { line: i, col: c }; }
      return null;
    },
    setCaret(line, col) { this.lockLeft = false; this.ins = { line, col, html: '<span class="caret"></span>' }; this.sel = null; this.render(); },
    async clickAt(line, col, o = {}) {
      this.ensureVisible(line, o.margin || 6);
      this.render();
      const r = this.colRect(line, col);
      Cursor.kind('text');
      await Cursor.moveTo(r.left + 1, r.top + LH / 2, o);
      await Cursor.click();
      this.setCaret(line, col);
      await wait(o.after != null ? o.after : 160);
    },
    async dragSelect(line, from, to) {
      this.ensureVisible(line, 6);
      this.render();
      const a = this.colRect(line, from), b = this.colRect(line, to);
      Cursor.kind('text');
      await Cursor.moveTo(a.left + 1, a.top + LH / 2);
      Cursor.press();
      this.ins = null;
      await Cursor.moveTo(b.left + 1, b.top + LH / 2, {
        ms: 520, easing: Ease.out,
        onMove: (x) => {
          const col = clamp(from + Math.round((x - a.left) / Math.max(1, (b.left - a.left) / Math.max(1, to - from))), from, to);
          this.sel = { line, from, to: col };
          this.render();
        },
      });
      Cursor.release();
      this.sel = { line, from, to };
      this.render();
      await wait(220);
    },
    /** typing target at the caret (or replacing the selection) */
    target() {
      const f = this.files[this.active];
      const line = this.sel ? this.sel.line : this.ins.line;
      const c0 = this.sel ? this.sel.from : this.ins.col;
      const c1 = this.sel ? this.sel.to : this.ins.col;
      const orig = f.lines.slice();
      const before = orig[line].slice(0, c0), after = orig[line].slice(c1);
      this.sel = null;
      const self = this;
      return {
        render(text, comp) {
          self.lockLeft = false;
          const parts = (before + text).split('\n');
          f.lines = [...orig.slice(0, line), ...parts.slice(0, -1), parts[parts.length - 1] + after, ...orig.slice(line + 1)];
          if (!f.dirty) { f.dirty = true; self.renderTabs(); }
          const cl = line + parts.length - 1, cc = parts[parts.length - 1].length;
          self.ins = { line: cl, col: cc, html: comp + '<span class="caret"></span>' };
          self.ensureVisible(cl);
          self.render();
        },
        anchor() { const c = $('#vsLines .ime-c.active') || $('#vsLines .ime-c') || $('#vsLines .caret'); return screenRect(c || $('#vsLines')); },
        enter(text) { const cur = (before + text).split('\n').pop(); return '\n' + cur.match(/^\s*/)[0]; },
      };
    },
    async type(script, o = {}) {
      if (typeof script === 'string') script = [{ direct: script }];
      await typeInto(this.target(), script, { kps: 20, ...o });
      this.ins.html = '<span class="caret"></span>';
      this.render();
    },
    /** End key + Enter on a line, then type */
    async newLineAfter(line, o = {}) {
      const f = this.files[this.active];
      await this.clickAt(line, f.lines[line].length, o);
      KeyStrip.special('End');
      await kw(120);
    },
    insertLines(at, lines, o = {}) {
      const f = this.files[this.active];
      f.lines.splice(at, 0, ...lines);
      if (!f.dirty) { f.dirty = true; this.renderTabs(); }
      if (o.flash !== false && !Clock.ff) { for (let i = 0; i < lines.length; i++) this.lineCls[at + i] = 'flash'; setTimeout(() => { this.lineCls = {}; this.render(); }, 1400 / Clock.speed); }
      const last = at + lines.length - 1;
      this.ins = { line: last, col: lines[lines.length - 1].length, html: '<span class="caret"></span>' };
      this.ensureVisible(last);
      this.render();
    },
    replaceLines(at, count, lines) { const f = this.files[this.active]; f.lines.splice(at, count, ...lines); this.render(); },
    async save(o = {}) {
      await Keycap.show(['Ctrl', 'S'], 700);
      const f = this.files[this.active];
      f.dirty = false;
      this.renderTabs();
      if (!o.noStatus && !this.status[this.active]) this.mark(this.active, o.status || 'M');
      await wait(200);
    },
    setText(path, text) { this.files[path].lines = text.split('\n'); if (path === this.active) this.render(); },
    text(path) { return this.files[path].lines.join('\n'); },
    async panel(on) { $('#vsPanel').classList.toggle('show', on); await D.realWait(320); this.render(); },
  };

  const Term = {
    lines: [],
    prompt: 'PS C:\\dev\\ne-auberge> ',
    /** the terminal scrolls like the real one: the newest line (the prompt being typed) always stays in view */
    render(input) {
      const keep = this.lines.slice(-80);
      const el = $('#vsTerm');
      el.innerHTML = keep.map((l) => `<div>${l}</div>`).join('') + (input != null ? `<div>${esc(this.prompt)}<span id="termIn">${input}</span></div>` : '');
      el.scrollTop = el.scrollHeight;
    },
    clear() { this.lines = []; this.render(''); },
    async run(cmd, out = [], o = {}) {
      this.render('<span class="caret"></span>');
      const inEl = $('#termIn');
      const script = typeof cmd === 'string' ? [{ direct: cmd }] : cmd;
      const typed = await typeInto(fieldTarget(inEl), script, { kps: o.kps || 15, keepStrip: true });
      KeyStrip.special('Enter');
      KeyStrip.idleHide(900);
      this.lines.push(esc(this.prompt) + `<span class="tw2">${esc(typed)}</span>`);
      this.render();
      for (const line of out) {
        if (typeof line === 'number') { await wait(line); continue; }
        this.lines.push(line);
        this.render();
        await kw(o.gap || 90);
      }
      this.render(o.noPrompt ? null : '<span class="caret"></span>');
    },
  };

  /* ===================================================================== BROWSER */
  // tab icons: ne-auberge.jp, the dev server and view-source have no favicon (Chrome's own icon); Sveltia CMS shows its logo
  // (the site's config sets no logo_url); the Google tools and the validator show theirs (npm run favicons)
  const FI = (f) => `<img class="br-fav img" src="../../shared/favicons/${f}" alt="">`;
  const FAV = {
    site: FI('default.png'),
    cms: FI('sveltia.svg'),
    gtm: FI('gtm.svg'),
    ta: FI('ta.svg'),
    ga: FI('ga.svg'),
    val: FI('schema.ico'),
    src: FI('default.png'),
    blank: '<span class="br-fav" style="background:transparent"></span>',
  };
  const Browser = {
    tabs: [], active: null,
    tabEl(id) { return $(`.br-tab[data-tab="${id}"]`); },
    addTab(t, o = {}) {
      const tab = { fav: 'site', ...t };
      this.tabs.push(tab);
      const el = document.createElement('div');
      el.className = 'br-tab' + (o.anim && !Clock.ff ? ' new' : '');
      el.dataset.tab = tab.id;
      el.innerHTML = `<span class="fav">${FAV[tab.fav] || FAV.site}</span><span class="tt"></span><span class="x">${icon('close')}</span>`;
      $('#brTabs').appendChild(el);
      this.setTitle(tab.id, tab.title);
      if (o.activate !== false) this.activate(tab.id);
      return tab;
    },
    tab(id) { return this.tabs.find((t) => t.id === id); },
    activate(id) {
      this.active = id;
      const t = this.tab(id);
      $$('.br-tab').forEach((e) => e.classList.toggle('on', e.dataset.tab === id));
      $$('.br-page').forEach((p) => p.classList.toggle('on', p.dataset.page === t.page));
      this.showUrl(t.url);
    },
    showUrl(url) {
      const m = String(url).match(/^(https?:\/\/)?([^/]+)(.*)$/);
      const secure = /^https/.test(url);
      $('#brLock').innerHTML = secure ? window.Win11.SVG.tune : icon('info'); // Chrome's site-info (tune) icon
      const blur = (t) => esc(t).replace(/\{\{(.*?)\}\}/g, '<span class="pii">$1</span>');
      $('#brUrl').innerHTML = m ? `${blur(m[2])}<span class="dim">${blur(m[3])}</span>` : blur(url);
    },
    setTitle(id, title) { const t = this.tab(id); t.title = title; $('.tt', this.tabEl(id)).textContent = title; },
    setUrl(id, url) { this.tab(id).url = url; if (this.active === id) this.showUrl(url); },
    setPage(id, page) { this.tab(id).page = page; if (this.active === id) this.activate(id); },
    loading(id, on) {
      const f = $('.fav', this.tabEl(id));
      if (on) f.innerHTML = '<span class="br-fav spin"></span>';
      else f.innerHTML = FAV[this.tab(id).fav] || FAV.site;
    },
    async clickTab(id, o = {}) { await clickUi(this.tabEl(id), { kind: 'arrow', after: 60, ...o }); this.activate(id); await wait(160); },
    /** focus the omnibox and type an address (half-width), Enter */
    async typeUrl(text, o = {}) {
      await clickUi('#brOmni', { kind: 'text' });
      $('#brOmni').classList.add('focus');
      $('#brUrl').innerHTML = `<span class="selbg" style="background:#c6dafc">${$('#brUrl').textContent}</span>`;
      await wait(200);
      await typeInto(fieldTarget($('#brUrl')), [{ direct: text }], { kps: 14, keepStrip: true });
      KeyStrip.special('Enter');
      KeyStrip.idleHide(800);
      $('#brOmni').classList.remove('focus');
      await wait(o.after != null ? o.after : 100);
    },
    async newTab(id, o = {}) {
      await clickUi('#brNewTab', { kind: 'arrow', after: 80 });
      this.addTab({ id, title: '新しいタブ', url: '', page: 'blank', fav: 'blank' }, { anim: true });
      await wait(250);
    },
  };

  /* ---------------------------------------------------------- dev / live site frames */
  const SiteView = {
    async load(iframe, o = {}) {
      try { if (o.intro) sessionStorage.removeItem('ne_intro_seen'); else sessionStorage.setItem('ne_intro_seen', '1'); } catch (e) {}
      const doc = await window.SiteFrame.load(iframe, 'live', o);
      return doc;
    },
    async scroll(iframe, y, ms = 1200, easing = Ease.inOut) {
      const w = iframe.contentWindow;
      const s = w.scrollY;
      await tween(ms, (e) => w.scrollTo(0, s + (y - s) * e), easing);
    },
    yOf(iframe, el, offset = 0) { return el.getBoundingClientRect().top + iframe.contentWindow.scrollY - offset; },
  };

  const AstroErr = {
    show(path, line, srcLines, hlIdx) {
      $('#aeTitle').innerHTML = `Could not import <code>${esc(path)}</code>.`;
      $('#aeLoc').textContent = `src/pages/[...slug].astro:${line}:26`;
      $('#aeCode').innerHTML = srcLines.map((l, i) => `<span class="${i === hlIdx ? 'hl' : ''}"><span class="n">${line - hlIdx + i}</span>${esc(l)}</span>`).join('');
      $('#astroErr').classList.add('show');
    },
    hide() { $('#astroErr').classList.remove('show'); },
  };

  /* ========================================================================= CMS
   * The real Sveltia CMS with the site's own /admin/config.yml, captured state by state (js/cms-snapshot.js,
   * tools/snapshots/ne-auberge/capture-cms.js) and shown in a frame (js/real-ui.js). The typing is drawn over the CMS's
   * own inputs; the state after each step is the one the CMS rendered for that input. */
  const strip = (t) => String(t || '').replace(/[⁦-⁩]/g, '');
  const Cms = {
    snap: window.CMS_SNAPSHOT,
    frame: null,
    async init() { this.frame = await new window.RealUI.Frame($('#cmsPage'), this.snap, { title: 'Sveltia CMS' }).load('settingsList'); },
    show(name, o) { this.frame.show(name, o); return this; },
    /** the address and the tab title the CMS had in that state */
    url(name) { return this.snap.states[name].url; },
    title(name) { return strip(this.snap.states[name].title); },
    row(re) { return this.frame.$$('[role="row"]').find((r) => re.test(r.textContent.trim())); },
    coll(label) { return this.frame.$(`[role="treeitem"][data-label="${label}"]`); },
    input(key) { return this.frame.$(`section[data-key-path="${key}"] input`); },
    saveButton() { return this.frame.$$('button').find((b) => b.textContent.trim() === '保存'); },
    /** scrolls the editor so the field sits in its upper half (as the mouse wheel would) */
    async reveal(key, ms = 900) {
      const inp = this.input(key);
      let box = inp.parentElement;
      while (box && !(box.scrollHeight > box.clientHeight + 2 && /auto|scroll/.test(this.frame.win.getComputedStyle(box).overflowY))) box = box.parentElement;
      if (!box) return;
      const r = inp.getBoundingClientRect(), br = box.getBoundingClientRect();
      await this.frame.scrollBox(box, Math.max(0, box.scrollTop + r.top - br.top - br.height * 0.42), ms);
    },
    async type(key, script, o = {}) {
      const inp = this.input(key);
      await clickUi(inp, { kind: 'text', ax: 0.15, after: 80 });
      const t = this.frame.typeTarget(inp);
      const text = await typeInto(t, script, { kps: o.kps || 12 });
      t.done(text);
      return text;
    },
  };

  /* ================================================================ Tag Manager */
  const GTM_ID = S.gtmId || 'GTM-MCB2MDKB';
  /* Google's Material icons (filled, 24 × 24) used by Tag Manager, Tag Assistant and Analytics */
  const MP = {
    back: 'M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z',
    search: 'M15.5 14h-.79l-.28-.27A6.47 6.47 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z',
    apps4: 'M3 3h8v8H3zm10 0h8v8h-8zM3 13h8v8H3zm10 0h8v8h-8z',
    apps: 'M4 8h4V4H4v4zm6 12h4v-4h-4v4zm-6 0h4v-4H4v4zm0-6h4v-4H4v4zm6 0h4v-4h-4v4zm6-10v4h4V4h-4zm-6 4h4V4h-4v4zm6 6h4v-4h-4v4zm0 6h4v-4h-4v4z',
    help: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z',
    helpO: 'M11 18h2v-2h-2v2zm1-16C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm0-14c-2.21 0-4 1.79-4 4h2c0-1.1.9-2 2-2s2 .9 2 2c0 2-3 1.75-3 5h2c0-2.25 3-2.5 3-5 0-2.21-1.79-4-4-4z',
    more: 'M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z',
    chevR: 'M10 6 8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z',
    drop: 'M7 10l5 5 5-5z',
    close: 'M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z',
    folderO: 'M20 6h-8l-2-2H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm0 12H4V8h16v10z',
    overview: 'M5 5h14l1.5 3H3.5zM3 9h18v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z',
    tag: 'M17.63 5.84C17.27 5.33 16.67 5 16 5L5 5.01C3.9 5.01 3 5.9 3 7v10c0 1.1.9 1.99 2 1.99L16 19c.67 0 1.27-.33 1.63-.84L22 12l-4.37-6.16z',
    tagO: 'M17.63 5.84C17.27 5.33 16.67 5 16 5L5 5.01C3.9 5.01 3 5.9 3 7v10c0 1.1.9 1.99 2 1.99L16 19c.67 0 1.27-.33 1.63-.84L22 12l-4.37-6.16zM16 17H5V7h11l3.55 5L16 17z',
    vars: 'M3 9h18v9H3zM5 6.5h3V9H5zm5.5 0h3V9h-3zM16 6.5h3V9h-3z',
    folder: 'M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z',
    eye: 'M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z',
    power: 'M13 3h-2v10h2V3zm4.83 2.17-1.42 1.42A6.92 6.92 0 0 1 19 12c0 3.87-3.13 7-7 7A6.995 6.995 0 0 1 7.58 6.58L6.17 5.17A8.932 8.932 0 0 0 3 12a9 9 0 0 0 18 0c0-2.74-1.23-5.18-3.17-6.83z',
    shield: 'M12 1 3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z',
    edit: 'M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a.996.996 0 0 0 0-1.41l-2.34-2.34a.996.996 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z',
    code: 'M9.4 16.6 4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0 4.6-4.6-4.6-4.6L16 6l6 6-6 6-1.4-1.4z',
    image: 'M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z',
    sweep: 'M15 16h4v2h-4zm0-8h7v2h-7zm0 4h6v2h-6zM3 18c0 1.1.9 2 2 2h6c1.1 0 2-.9 2-2V8H3v10zM14 5h-3l-1-1H6L5 5H2v2h12z',
    openNew: 'M19 19H5V5h7V3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14c1.1 0 2-.9 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z',
    api: 'M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zM9.4 15.6 8 17l-5-5 5-5 1.4 1.4L5.8 12l3.6 3.6zm5.2 0 3.6-3.6-3.6-3.6L16 7l5 5-5 5-1.4-1.4z',
    copy: 'M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z',
    home: 'M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z',
    reports: 'M5 9.2h3V19H5zM10.6 5h2.8v14h-2.8zm5.6 8H19v6h-2.8z',
    explore: 'M12 10.9c-.61 0-1.1.49-1.1 1.1s.49 1.1 1.1 1.1c.61 0 1.1-.49 1.1-1.1s-.49-1.1-1.1-1.1zM12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm2.19 12.19L6 18l3.81-8.19L18 6l-3.81 8.19z',
    ads: 'M18 11v2h4v-2h-4zm-2 6.61c.96.71 2.21 1.65 3.2 2.39.4-.53.8-1.07 1.2-1.6-.99-.74-2.24-1.68-3.2-2.4-.4.54-.8 1.08-1.2 1.61zM20.4 5.6c-.4-.53-.8-1.07-1.2-1.6-.99.74-2.24 1.68-3.2 2.4.4.53.8 1.07 1.2 1.6.96-.72 2.21-1.65 3.2-2.4zM4 9c-1.1 0-2 .9-2 2v2c0 1.1.9 2 2 2h1v4h2v-4h1l5 3V6L8 9H4zm11.5 3c0-1.33-.58-2.53-1.5-3.35v6.69c.92-.81 1.5-2.01 1.5-3.34z',
    admin: 'M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58a.49.49 0 0 0 .12-.61l-1.92-3.32a.488.488 0 0 0-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54a.484.484 0 0 0-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58a.49.49 0 0 0-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z',
    flag: 'M14.4 6 14 4H5v17h2v-7h5.6l.4 2h7V6z',
    bolt: 'M7 2v11h3v9l7-12h-4l4-8z',
    page: 'M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z',
  };
  const mi = (k, s = 24) => `<svg class="mi" width="${s}" height="${s}" viewBox="0 0 24 24" fill="currentColor"><path d="${MP[k]}"/></svg>`;
  // the trigger glyph (two overlapping circles) and the Google tag glyph (blue tag with a G)
  const TRIG = (s = 24) => `<svg class="mi" width="${s}" height="${s}" viewBox="0 0 24 24"><circle cx="10" cy="10" r="6.5" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="14" cy="14" r="6.5" fill="currentColor"/></svg>`;
  const GTAG = (s = 28) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24"><path d="M12 2.2 6.2 7.4V20a1.8 1.8 0 0 0 1.8 1.8h8a1.8 1.8 0 0 0 1.8-1.8V7.4z" fill="#4285f4"/><circle cx="12" cy="7.6" r="1.3" fill="#fff"/><path d="M14.6 15.6a2.7 2.7 0 1 1-.8-2.1" fill="none" stroke="#fff" stroke-width="1.5"/><path d="M12.2 15.4h2.5" stroke="#fff" stroke-width="1.5"/></svg>`;
  const ADS = '<svg width="28" height="28" viewBox="0 0 24 24"><path d="M8.6 3.9 2.4 14.6a3.4 3.4 0 1 0 5.9 3.4l6.2-10.7z" fill="#fbbc04"/><path d="M15.4 3.9a3.4 3.4 0 0 0-5.9 3.4l6.2 10.7a3.4 3.4 0 1 0 5.9-3.4z" fill="#4285f4"/><circle cx="5.3" cy="16.3" r="3.4" fill="#34a853"/></svg>';
  const FLOOD = '<svg width="28" height="28" viewBox="0 0 24 24"><circle cx="12" cy="12" r="7.5" fill="none" stroke="#4285f4" stroke-width="4" stroke-dasharray="15 32"/><circle cx="12" cy="12" r="7.5" fill="none" stroke="#ea4335" stroke-width="4" stroke-dasharray="12 35" stroke-dashoffset="-15"/><circle cx="12" cy="12" r="7.5" fill="none" stroke="#fbbc04" stroke-width="4" stroke-dasharray="10 37" stroke-dashoffset="-27"/><circle cx="12" cy="12" r="7.5" fill="none" stroke="#34a853" stroke-width="4" stroke-dasharray="10 37" stroke-dashoffset="-37"/></svg>';
  const LINKER = '<svg width="28" height="28" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#4285f4"/><path d="M7 10h8.5l-2-2M17 14H8.5l2 2" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  /* ============================================================== Tag Manager
   * Japanese UI as of 2025–2026: header (タグ マネージャー / account › container / 検索ワークスペース), the
   * ワークスペース・バージョン・管理 tabs with the container ID, ワークスペースでの変更数, プレビュー and 公開, the left
   * navigation, the tag list, the tag sheet (タグの設定 / トリガー), the tag type and trigger pickers. */
  const Gtm = {
    tags: [
      { name: 'Google タグ - G-GREWV04PEW', type: 'Google タグ', trig: 'Initialization - All Pages', init: true, date: '3日前' },
      { name: 'gtag.js - G-88EYJ4NSQJ', type: 'カスタム HTML', trig: 'All Pages', date: '3日前' },
      { name: 'Meta Pixel - PageView', type: 'カスタム HTML', trig: 'All Pages', date: '3日前' },
    ],
    changes: 0,
    cur: { name: '', tagId: '' },
    init() {
      $('#gtmPage').innerHTML = `<div class="gtm">
        <div class="gx-top"><span class="gx-back">${mi('back')}</span><span class="gx-prod"><img src="../../shared/favicons/gtm.svg" alt="">タグ マネージャー</span>
          <span class="gx-acc"><small>すべてのアカウント ${mi('chevR', 14)} Né</small><b>ne-auberge.jp${mi('drop')}</b></span>
          <span class="gx-search">${mi('search')}<span>検索ワークスペース</span></span>
          <span class="gx-ic">${mi('apps4')}</span><span class="gx-ic">${mi('help')}</span><span class="gx-ic">${mi('more')}</span><span class="gx-av">K</span></div>
        <div class="gx-tabs"><span class="on">ワークスペース</span><span>バージョン</span><span>管理</span>
          <span class="r"><span class="id">${GTM_ID}</span><span class="ch">ワークスペースでの変更数: <b id="gtmChanges">0</b></span><span class="gx-btn out" id="gtmPreview">プレビュー</span><span class="gx-btn fill" id="gtmSubmit">公開</span></span></div>
        <div class="gtm-body">
          <nav class="gx-nav"><div class="lbl">現在のワークスペース</div><div class="ws">Default Workspace${mi('chevR')}</div>
            <div class="gtm-ni" data-nav="overview">${mi('overview')}概要</div>
            <div class="gtm-ni" data-nav="tags">${mi('tag')}タグ</div>
            <div class="gtm-ni" data-nav="triggers">${TRIG()}トリガー</div>
            <div class="gtm-ni" data-nav="vars">${mi('vars')}変数</div>
            <div class="gtm-ni">${mi('folder')}フォルダ</div>
            <div class="gtm-ni">${mi('tagO')}テンプレート</div></nav>
          <main class="gtm-main" id="gtmMain"></main>
        </div>
        <div class="gx-scrim" id="gtmScrim"></div>
        <div class="gtm-panel" id="gtmPanel"></div>
        <div class="gtm-pick" id="gtmPick"></div>
        <div class="gtm-dlg" id="gtmDlg"></div></div>`;
      this.overview();
    },
    nav(k) { $$('.gtm-ni').forEach((n) => n.classList.toggle('on', n.dataset.nav === k)); },
    setChanges(n) { this.changes = n; const c = $('#gtmChanges'); if (c) c.textContent = n; },
    overview() {
      this.nav('overview');
      $('#gtmMain').innerHTML = `<div class="gtm-overview">
        <div class="gtm-card"><small>ワークスペースでの変更数</small><b>${this.changes}</b></div>
        <div class="gtm-card"><small>公開中のバージョン</small><b>バージョン 3</b></div>
        <div class="gtm-card"><small>コンテナ ID</small><b>${GTM_ID}</b></div></div>
        <div class="gtm-card"><div class="gtm-card-h">計測設計（ne-auberge.jp）</div>
        <table class="gtm-tbl"><tr><th>目的</th><th>計測</th><th>送信先</th></tr>
        <tr><td>サイト全体の流入・回遊</td><td>page_view / scroll / user_engagement（拡張計測）</td><td>GA4（メイン / 関連プロパティ）</td></tr>
        <tr><td>予約サイトへの送客</td><td>click（外部リンク：CHILLNN / TableCheck）</td><td>GA4</td></tr>
        <tr><td>広告の最適化</td><td>PageView</td><td>Meta Pixel</td></tr></table></div>`;
    },
    trigChip(t) {
      const init = /^Initialization/.test(t);
      return `<span class="gx-chip"><i class="${init ? 'init' : ''}">${mi(init ? 'power' : 'eye', 16)}</i>${esc(t)}</span>`;
    },
    tagsView(newIdx = -1) {
      this.nav('tags');
      $('#gtmMain').innerHTML = `<div class="gtm-card"><div class="gtm-card-h">タグ<span class="r">${mi('search')}<span class="gx-btn tonal" id="gtmNew">新規</span></span></div>
        <table class="gtm-tbl"><tr><th class="cb"><i></i></th><th>名前 <span class="ar">↑</span></th><th>タイプ</th><th>配信トリガー</th><th>最終更新</th></tr>
        ${this.tags.map((t, i) => `<tr class="${i === newIdx && !Clock.ff ? 'new' : ''}" data-row="${i}"><td class="cb"><i></i></td><td class="nm">${esc(t.name)}</td><td>${esc(t.type)}</td><td>${this.trigChip(t.trig)}</td><td>${t.date}</td></tr>`).join('')}
        </table></div>`;
    },
    row(i) { return $(`tr[data-row="${i}"] td.nm`); },
    /** the tag sheet: 名前のないタグ → タグの設定 (タグの種類・タグ ID・設定…) / トリガー (配信トリガー) */
    panel(t) {
      const dirty = !!(t.name || t.tagId != null || t.trig);
      const typeHtml = t.tagId != null
        ? `<div class="gx-sub">タグの種類</div><div class="gx-type">${GTAG()}<span class="tt"><b>Google タグ</b><small>Google</small></span><span class="ed">${mi('edit')}</span></div>
           <div class="gx-sub">タグ ID <span class="q">${mi('helpO', 18)}</span></div><div class="gx-inrow"><div class="gtm-in" id="gtmTagId">${esc(t.tagId)}</div><span class="lego">${mi('vars', 20)}</span></div>
           <div class="gx-exp">${mi('chevR')}設定</div><div class="gx-exp">${mi('chevR')}共有イベントの設定</div><div class="gx-exp last">${mi('chevR')}詳細設定</div>`
        : `<div class="gtm-empty" id="gtmChooseType"><span class="big">${mi('tag', 46)}</span><span>タグタイプを選択して設定を開始...</span><a>詳細</a></div>`;
      const trg = t.trig ? { 'All Pages': ['eye', 'ページビュー'], 'Initialization - All Pages': ['power', '初期化'] }[t.trig] || ['eye', 'ページビュー'] : null;
      const trgHtml = trg
        ? `<div class="gx-sub">配信トリガー</div><div class="gx-type trig"><i>${mi(trg[0], 18)}</i><span class="tt"><b>${esc(t.trig)}</b><small>${trg[1]}</small></span></div>`
        : `<div class="gtm-empty" id="gtmChooseTrig"><span class="big">${TRIG(46)}</span><span>トリガーを選択してこのタグを配信...</span><a>詳細</a></div>`;
      $('#gtmPanel').innerHTML = `<div class="gtm-ph"><span class="x">${mi('close')}</span><span class="gtm-name${t.name ? '' : ' ph'}" id="gtmName">${t.name ? esc(t.name) : '名前のないタグ'}</span><span class="fd">${mi('folderO')}</span>
          <div class="r"><span class="gx-btn ${dirty ? 'fill' : 'dis'}" id="gtmSave">保存</span><span class="gx-ic">${mi('more')}</span></div></div>
        <div class="gtm-pb"><div class="gtm-sec${t.tagId != null ? ' set' : ''}"><h4>タグの設定</h4>${typeHtml}</div><div class="gtm-sec${trg ? ' set' : ''}"><h4>トリガー</h4>${trgHtml}</div></div>`;
    },
    picker(kind) {
      const row = (ic, n, s, k, more) => `<div class="gtm-opt${s ? '' : ' one'}"${k ? ` data-opt="${k}"` : ''}><span class="ic">${ic}</span><span class="tt"><b>${n}</b>${s ? `<small>${s}</small>` : ''}</span>${more ? `<span class="go">${mi('chevR')}</span>` : ''}</div>`;
      const body = kind === 'type'
        ? `<div class="gx-gallery">${mi('tagO')}<span>コミュニティ テンプレート ギャラリーでタグタイプをさらに見つけましょう</span>${mi('chevR')}</div>
           <div class="gx-ph">おすすめ</div>
           ${row('<img src="../../shared/favicons/ga.svg" alt="" width="26" height="26">', 'Google アナリティクス', '', '', true)}
           ${row(ADS, 'Google 広告', '', '', true)}
           ${row(FLOOD, 'Floodlight', '', '', true)}
           ${row(GTAG(), 'Google タグ', 'Google', 'googtag')}
           ${row(LINKER, 'コンバージョン リンカー', 'Google', '')}
           ${row(`<span style="color:#5f6368;display:flex">${mi('shield', 26)}</span>`, 'おすすめのコミュニティ CMP テンプレート', 'Google タグ マネージャーの同意設定と高度に統合できるおすすめの CMP テンプレートをご紹介します。', '', true)}
           <div class="gx-ph">カスタム</div>
           ${row(`<span style="color:#5f6368;display:flex">${mi('code', 26)}</span>`, 'カスタム HTML', 'カスタム HTML タグ', 'html')}
           ${row(`<span style="color:#5f6368;display:flex">${mi('image', 26)}</span>`, 'カスタム画像', 'カスタム画像タグ', '')}`
        : `<div class="gx-th"><span>名前 <span class="ar">↑</span></span><span>タイプ</span><span>フィルタ</span></div>
           ${[['all', 'All Pages', 'ページビュー', 'eye', ''], ['consent', 'Consent Initialization - All Pages', '同意の初期化', 'power', ''], ['init', 'Initialization - All Pages', '初期化', 'power', '']]
             .map(([k, n, s, ic]) => `<div class="gtm-opt trg" data-opt="${k}"><span class="tc">${mi(ic, 18)}</span><span class="n">${n}</span><span class="s">${s}</span><span class="f"></span></div>`).join('')}`;
      $('#gtmPick').innerHTML = `<div class="gx-pkh"><span class="x">${mi('close')}</span><h4>${kind === 'type' ? 'タグタイプを選択' : 'トリガーの選択'}</h4><span class="r">${kind === 'trig' ? '<span class="add">+</span>' : ''}${mi('search')}</span></div><div class="gx-pkb">${body}</div>`;
    },
    dialog(html) { const d = $('#gtmDlg'); d.innerHTML = html; d.classList.toggle('show', !!html); },
  };

  /* =============================================================== Tag Assistant
   * tagassistant.google.com (Japanese): the "Tag Assistant をサイトにリンク" dialog of the Tag Manager preview mode, then
   * the debug view (接続済み / 概要 / コンテナの詳細 / GTM-… の出力: 配信されたタグ・未配信のタグ). */
  const TA = {
    render(state, tagsOk = true) {
      if (state === 'connect') {
        $('#taPage').innerHTML = `<div class="ta"><div class="tx-top"><img src="../../shared/favicons/ta.svg" alt=""><span class="t">Tag Assistant</span><span class="beta">BETA</span>
            <span class="r"><a>拡張機能をインストール</a>${mi('more')}<span class="gx-av">K</span></span></div>
          <div class="tx-home"><h2>Tag Assistant へようこそ</h2><p>Tag Assistant を使用すると、サイトのタグが適切に機能しているかどうかを確認できます。</p>
            <div class="tx-dom"><div class="h">ドメイン<span class="gx-btn tonal">ドメインを追加</span></div><div class="sub">有効なドメイン</div><div class="none">有効なドメインはありません</div></div></div>
          <div class="tx-scrim"></div>
          <div class="tx-dlg"><span class="x">${mi('close')}</span><h3>Tag Assistant をサイトにリンク</h3>
            <div class="lg"><img src="../../shared/favicons/gtm.svg" alt=""><span>タグ マネージャー プレビュー モード</span></div>
            <p>タグ マネージャー コンテナ <b>${GTM_ID}</b> は、このウェブブラウザのデバッグモードで読み込まれます。サイトの URL を入力すると、コンテナのプレビューが開始します。</p>
            <div class="fl">ウェブサイトの URL ${mi('helpO', 18)}</div><div class="gtm-in" id="taUrl" data-ph="例: https://www.google.com"></div>
            <div class="bt"><span class="gx-btn fill" id="taConnect">リンク</span></div><div class="nw">新しいウィンドウでサイトを開きます</div>
            <div class="ck"><i><svg width="12" height="12" viewBox="0 0 24 24"><path d="M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4z" fill="#fff"/></svg></i>URL にデバッグ シグナルを含める <span class="q">ⓘ</span></div></div></div>`;
        return;
      }
      const ev = ['同意の初期化', '初期化', 'コンテナの読み込み', 'DOM Ready', 'ウィンドウの読み込み'];
      const fired = [
        [Gtm.tags.find((t) => /G-GREWV04PEW/.test(t.name)).name, 'Google タグ'],
        [Gtm.cur.name || 'GA4 - Google タグ', 'Google タグ', true],
        ['gtag.js - G-88EYJ4NSQJ', 'カスタム HTML'],
        ['Meta Pixel - PageView', 'カスタム HTML'],
      ];
      $('#taPage').innerHTML = `<div class="ta"><div class="tx-top dbg"><span class="x">${mi('close')}</span><span class="cn"><small>接続済み</small><b>localhost:4321</b></span><span class="r">${mi('more')}</span></div>
        <div class="tx-found"><span class="n">1</span><span class="m">Google タグが見つかりました</span><span class="chip"><img src="../../shared/favicons/gtm.svg" alt="">${GTM_ID}</span></div>
        <div class="ta-body"><div class="ta-left"><div class="sum">概要<span>${mi('sweep')}</span></div>
            <div class="grp">${mi('drop')}<span>Né（ネ）｜新潟・新発田、一日一組のオーベル…</span></div>
            ${ev.map((e, i) => `<div class="ta-ev${Clock.ff ? '' : ' new'}" style="animation-delay:${(ev.length - 1 - i) * 120}ms"><span class="n">${i + 1}</span>${e}<i>${mi('api', 14)}</i></div>`).reverse().join('')}</div>
          <div class="ta-main"><h2>概要</h2>
            <div class="tx-card"><h4>コンテナの詳細</h4><div class="kv"><div><small>コンテナ名</small><a>ne-auberge.jp ${mi('openNew', 16)}</a></div><div><small>コンテナ ID</small>${GTM_ID}</div><div><small>ソース</small>ページ上の gtm.js スニペット</div><div><small>コンテナ バージョン</small>プレビュー ${mi('edit', 16)}</div></div></div>
            <div class="tx-card"><h4>${GTM_ID} の出力 ${mi('helpO', 18)}</h4><div class="ta-tabs"><span class="on">タグ</span><span>変数</span><span>データレイヤー</span><span>同意</span><span>コンソール (0)</span></div>
              <div class="ta-h">配信されたタグ</div>
              <div class="ta-tags">${fired.map(([n, type, main], i) => `<div class="ta-tag${Clock.ff ? '' : ' new'}" style="animation-delay:${300 + i * 140}ms" ${main ? 'id="taMain"' : ''}><b>${esc(n)}</b><small>${type} - 1 回配信されました</small></div>`).join('')}</div>
              <div class="ta-h">未配信のタグ</div><div class="ta-none">なし</div></div></div></div></div>`;
      void tagsOk;
    },
    tagId: '',
  };

  /* ================================================================== Analytics
   * Google アナリティクス (Japanese, 2026): top bar, left navigation, 管理 › データ ストリーム › ウェブ ストリームの詳細,
   * 管理 › DebugView (分 / 秒 streams, 上位のイベント, 現在のユーザー プロパティ). Event times follow the taskbar clock. */
  const GA = {
    events: [],
    render(view) {
      const top = `<div class="g4-top"><span class="g4-hb">${mi('apps')}</span><img class="g4-logo" src="../../shared/favicons/ga.svg" alt=""><span class="g4-name">アナリティクス</span>
        <div class="g4-acct"><small>すべてのアカウント ${mi('chevR', 14)} Né</small><b>ne-auberge.jp${mi('drop')}</b></div>
        <div class="g4-search">${mi('search')}<span>「レポート」と検索してみてください</span></div>
        <span class="g4-ic">${mi('apps')}</span><span class="g4-ic">${mi('help')}</span><span class="g4-ic">${mi('more')}</span><span class="gx-av">K</span></div>`;
      const rail = `<div class="g4-rail"><span>${mi('home')}</span><span>${mi('reports')}</span><span>${mi('explore')}</span><span>${mi('ads')}</span><span class="on bottom" id="gaAdminBtn">${mi('admin')}</span></div>`;
      let main;
      if (view === 'admin') {
        main = `<div class="g4-head"><span class="bk">${mi('back')}</span><h1>ウェブ ストリームの詳細</h1></div>
          <div class="g4-card st"><div class="ct">ストリームの詳細 <span class="ed">${mi('edit', 20)}</span></div>
            <div class="g4-kv"><div><small>ストリーム名</small>ne-auberge.jp</div><div><small>ストリームの URL</small>https://ne-auberge.jp</div><div><small>ストリーム ID</small><span class="pii">10482317746</span></div><div><small>測定 ID</small><span class="mid"><b id="gaMid">G-MEEEN9DKT1</b>${mi('copy', 18)}</span></div></div></div>
          <div class="g4-card st"><div class="ct">イベント</div>
            <div class="g4-row"><span class="ic">${mi('bolt', 22)}</span><span class="tx"><b>拡張計測機能</b><small>ページビュー、スクロール数、離脱クリック、他 3 個</small></span><span class="sw on"><i></i></span></div></div>`;
      } else {
        const n = this.events.length;
        const counts = {};
        this.events.forEach((e) => { counts[e.name] = (counts[e.name] || 0) + 1; });
        const icon4 = (e) => mi(e.conv ? 'flag' : e.name === 'page_view' ? 'page' : 'bolt', 16);
        main = `<div class="g4-head"><h1>DebugView</h1><span class="dv">デバッグ デバイス: <b id="gaDevN">${n ? '1' : '0'}</b>${mi('drop')}</span></div>
          <div class="g4-cols">
            <div class="g4-min"><div class="t">分</div><div class="list">${[0, 1, 2, 3, 4, 5, 6].map((i) => `<div class="m${n && i === 0 ? ' now' : ' z'}"><i>${n && i === 0 ? n : 0}</i></div>`).join('')}</div></div>
            <div class="g4-sec" id="gaStream"><div class="t">秒</div><div class="stream"><div class="line"></div><div class="evs">${this.events.map((e) => `<div class="g4-ev in${e.conv ? ' key' : ''}"><span class="tm">${e.t}</span><span class="dot">${icon4(e)}</span><span class="nm">${esc(e.name)}</span></div>`).join('')}</div></div></div>
            <div class="g4-side">
              <div class="g4-card top"><div class="ct">上位のイベント<small>過去 30 分間</small></div><div class="rows">${Object.entries(counts).sort((a, b) => b[1] - a[1]).map(([k, v]) => { const c = this.events.find((e) => e.name === k).conv; return `<div class="r"><span class="ic${c ? ' key' : ''}">${mi(c ? 'flag' : 'bolt', 16)}</span><span class="n">${esc(k)}</span><span class="c">${v}</span></div>`; }).join('') || '<div class="none">データがありません</div>'}</div></div>
              <div class="g4-card"><div class="ct">現在のユーザー プロパティ</div><div class="none">ユーザー プロパティはありません</div></div>
            </div></div>`;
      }
      $('#gaPage').innerHTML = `<div class="ga g4">${top}<div class="g4-body">${rail}<div class="g4-main">${main}</div></div></div>`;
    },
  };

  /* =================================================================== validator
   * The real Schema Markup Validator (validator.schema.org), driven with this page's source and captured state by state
   * (js/validator-snapshot.js, tools/snapshots/ne-auberge/capture-validator.js). */
  const Val = {
    snap: window.VALIDATOR_SNAPSHOT,
    frame: null,
    async init() { this.frame = await new window.RealUI.Frame($('#valPage'), this.snap, { title: this.snap.title }).load('dialogUrl'); },
    show(name, o) { this.frame.show(name, o); return this; },
    resultList() { return this.frame.$('#results-cell ul.mdl-list'); },
    title() { return this.snap.title; },
    url(name) { return this.snap.states[name].url; },
    dialog() { return this.frame.$$('.XKSfm-Sx9Kwc').find((d) => d.getClientRects().length); },
    snippetTab() { return this.frame.$('#new-test-code'); },
    dialogEditor() { const d = this.dialog(); return d && d.querySelector('.CodeMirror'); },
    runButton() { return this.frame.$$('button, [role=button]').filter((e) => e.textContent.trim() === 'テストを実行' && e.getClientRects().length).pop(); },
    editor() { return this.frame.$$('.CodeMirror').find((c) => !c.closest('.XKSfm-Sx9Kwc')); },
    playButton() { return this.frame.$$('button, [role=button]').find((e) => e.textContent.trim() === 'play_arrow'); },
    errorItem() { return this.frame.$('#results-cell li.mdl-list__item'); },
    results() { return this.frame.$('#results-cell'); },
    /** the line of the editor the validator marks with the error icon */
    errorLine() { const m = this.frame.$$('.CodeMirror-gutter-elt').find((e) => !/^\d+$/.test(e.textContent.trim())); return m && m.closest('.CodeMirror-code > div, .CodeMirror-line, pre') ; },
  };

  /* ================================================================ view-source
   * Chrome's own view-source page of the dev server's HTML (js/view-source-snapshot.js: the markup Blink built and its
   * view-source.css, tools/snapshots/ne-auberge/capture-view-source.js). Ctrl+A is a real selection in the frame. */
  const VS = window.VIEW_SOURCE_SNAPSHOT;
  const Src = {
    frame: null,
    async init() {
      const snap = { styles: [VS.css], htmlAttrs: VS.states.broken.htmlAttrs, states: VS.states };
      // Chrome on Windows draws a selection in the system highlight colour, with white text
      this.frame = await new window.RealUI.Frame($('#srcPage'), snap, { title: 'view-source', extraCss: '::selection { background-color: rgb(51, 103, 209); color: #fff; }' }).load('broken');
    },
    render(which) { this.frame.show(which); this.frame.win.scrollTo(0, 0); },
    selectAll(on) {
      const sel = this.frame.doc.getSelection();
      sel.removeAllRanges();
      if (on) sel.selectAllChildren(this.frame.doc.body);
    },
  };

  window.Apps = { Design, Layers, Props, Vars, Code, Term, Browser, SiteView, AstroErr, Cms, Gtm, TA, GA, Val, Src, rgbToHex, varOfColor, ROOT_VARS };
})();
