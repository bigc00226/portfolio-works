/*
 * Code editor panes of the creator-mode editor (HTML / CSS / JavaScript), light theme with line numbers.
 * One CodeView per pane: syntax colouring (HTML + creator-mode tags <{ }>, CSS, JS), caret, single- and multi-line
 * selection, scripted clicks / drags at a character position, and typing through the IME engine (typeInto).
 */
(function () {
  'use strict';
  const D = window.Demo;
  const { $, esc, clamp, wait, kw, tween, Ease, Cursor, Clock, KeyStrip, Keycap, typeInto, screenRect } = D;
  const MAXCH = 420; // characters drawn per line (minified bundles are one very long line)

  /* =============================================================== tokenizers: (line, state) -> {tokens, state} */
  function tokSmarty(s) {
    const out = [['<{', 't-sd']];
    const closed = s.endsWith('}>');
    const body = s.slice(2, closed ? -2 : undefined);
    let i = 0;
    while (i < body.length) {
      const r = body.slice(i);
      let m, c = 't-sp';
      if ((m = r.match(/^\*[\s\S]*\*?$/))) c = 't-scom';
      else if ((m = r.match(/^\/?(?:if|elseif|else|section|sectionelse|foreach|foreachelse|insert|include|assign|literal|capture)\b/))) c = 't-skw';
      else if ((m = r.match(/^\$[A-Za-z_][\w]*(?:\.[\w]+|\[[\w$.]+\])*/))) c = 't-svar';
      else if ((m = r.match(/^\|[\w]+(?::(?:'[^']*'|"[^"]*"|[\w]+))*/))) c = 't-smod';
      else if ((m = r.match(/^'[^']*'?|^"[^"]*"?/))) c = 't-sstr';
      else if ((m = r.match(/^[A-Za-z_]\w*(?==)/))) c = 't-sattr';
      else if ((m = r.match(/^\d+/))) c = 't-num';
      else if ((m = r.match(/^(?:==|!=|&&|\|\||>=|<=|!|=)/))) c = 't-sop';
      else m = [r[0]];
      out.push([m[0], c]);
      i += m[0].length;
    }
    if (closed) out.push(['}>', 't-sd']);
    return out;
  }

  const JS_KW = new Set('const let var function return if else for of in new class extends async await try catch finally throw typeof instanceof while do break continue switch case default this import export from void delete yield'.split(' '));
  const JS_LIT = new Set(['true', 'false', 'null', 'undefined', 'NaN']);
  function tokJs(s, st0) {
    const st = { c: false, t: false, ...(st0 || {}) };
    const out = [];
    let i = 0, prev = '';
    const push = (t, c) => { if (t) out.push([t, c]); };
    while (i < s.length) {
      if (st.c) { const j = s.indexOf('*/', i); const e = j < 0 ? s.length : j + 2; push(s.slice(i, e), 't-com'); i = e; if (j >= 0) st.c = false; continue; }
      if (st.t) { const j = s.indexOf('`', i); const e = j < 0 ? s.length : j + 1; push(s.slice(i, e), 't-str'); i = e; if (j >= 0) st.t = false; continue; }
      const r = s.slice(i);
      let m;
      if (r.startsWith('/*')) { st.c = true; continue; }
      if (r.startsWith('//')) { push(r, 't-com'); break; }
      if (r[0] === '`') { push('`', 't-str'); i++; st.t = true; continue; }
      if ((m = r.match(/^'(?:\\.|[^'\\])*'?|^"(?:\\.|[^"\\])*"?/))) { push(m[0], 't-str'); i += m[0].length; prev = 's'; continue; }
      if ((m = r.match(/^\d[\d._e]*/))) { push(m[0], 't-num'); i += m[0].length; continue; }
      if ((m = r.match(/^[A-Za-z_$][\w$]*/))) {
        const w = m[0];
        const after = r.slice(w.length);
        let c = 't-var';
        if (JS_KW.has(w)) c = 't-kw';
        else if (JS_LIT.has(w)) c = 't-const';
        else if (/^\s*\(/.test(after)) c = 't-fn';
        else if (prev === '.') c = 't-prop';
        push(w, c); i += w.length; prev = 'w'; continue;
      }
      if ((m = r.match(/^\s+/))) { push(m[0], ''); i += m[0].length; continue; }
      push(r[0], /[{}()[\]]/.test(r[0]) ? 't-br' : 't-pun'); prev = r[0]; i++;
    }
    return { tokens: out, state: st };
  }

  function tokCss(s, st0) {
    const st = { c: false, d: 0, v: false, ...(st0 || {}) };
    const out = [];
    let i = 0;
    const push = (t, c) => { if (t) out.push([t, c]); };
    while (i < s.length) {
      if (st.c) { const j = s.indexOf('*/', i); const e = j < 0 ? s.length : j + 2; push(s.slice(i, e), 't-com'); i = e; if (j >= 0) st.c = false; continue; }
      const r = s.slice(i);
      let m;
      if (r.startsWith('/*')) { st.c = true; continue; }
      if (r[0] === '{') { push('{', 't-br'); st.d++; st.v = false; i++; continue; }
      if (r[0] === '}') { push('}', 't-br'); st.d = Math.max(0, st.d - 1); st.v = false; i++; continue; }
      if (r[0] === ';') { push(';', 't-pun'); st.v = false; i++; continue; }
      if ((m = r.match(/^\s+/))) { push(m[0], ''); i += m[0].length; continue; }
      if ((m = r.match(/^'[^']*'?|^"[^"]*"?/))) { push(m[0], 't-str'); i += m[0].length; continue; }
      if (st.v) {
        if ((m = r.match(/^url\([^)]*\)?/))) { push(m[0], 't-str'); i += m[0].length; continue; }
        if ((m = r.match(/^(#[0-9a-fA-F]{3,8}|-?\.?\d[\d.]*(%|[a-z]+)?)/))) { push(m[0], 't-num'); i += m[0].length; continue; }
        if ((m = r.match(/^!important/))) { push(m[0], 't-kw'); i += m[0].length; continue; }
        if ((m = r.match(/^[\w-]+(?=\()/))) { push(m[0], 't-fn'); i += m[0].length; continue; }
        if ((m = r.match(/^[\w-]+/))) { push(m[0], 't-val'); i += m[0].length; continue; }
        push(r[0], 't-pun'); i++; continue;
      }
      if ((m = r.match(/^@[\w-]+/))) { push(m[0], 't-at'); i += m[0].length; continue; }
      // selector or property? the next of { ; } on this line decides (a "{" first means a selector)
      const nb = r.search(/[{;}]/);
      const isSel = st.d === 0 || (nb >= 0 ? r[nb] === '{' : !/^[\w-]+\s*:/.test(r));
      if (!isSel && (m = r.match(/^[\w-]+(?=\s*:)/))) { push(m[0], 't-prop'); i += m[0].length; const c = r.slice(m[0].length).match(/^\s*:/); push(c[0], 't-pun'); i += c[0].length; st.v = true; continue; }
      const stop = nb >= 0 ? nb : r.length;
      const seg = r.slice(0, Math.max(1, stop)).replace(/\/\*[\s\S]*$/, '') || r[0];
      push(seg, isSel ? 't-sel' : 't-prop'); i += seg.length;
    }
    return { tokens: out, state: st };
  }

  /** HTML with creator-mode tags; <script>/<style> bodies are coloured as JS/CSS */
  function tokHtml(s, st0) {
    const st = { m: 'text', q: '', tag: '', sub: null, ...(st0 || {}) };
    const out = [];
    let i = 0;
    const push = (t, c) => { if (t) out.push([t, c]); };
    const smartyAt = (k) => s.startsWith('<{', k);
    const smarty = () => { const j = s.indexOf('}>', i + 2); const e = j < 0 ? s.length : j + 2; out.push(...tokSmarty(s.slice(i, e))); i = e; };
    while (i < s.length) {
      if (st.m === 'comment') {
        const j = s.indexOf('-->', i); const e = j < 0 ? s.length : j + 3;
        push(s.slice(i, e), 't-com'); i = e; if (j >= 0) st.m = 'text'; continue;
      }
      if (st.m === 'raw') {
        const endTag = '</' + st.tag;
        const j = s.toLowerCase().indexOf(endTag, i);
        const e = j < 0 ? s.length : j;
        const seg = s.slice(i, e);
        if (seg) {
          if (smartyAt(i)) { smarty(); continue; }
          const k = seg.indexOf('<{');
          const part = k > 0 ? seg.slice(0, k) : seg;
          const res = (st.tag === 'style' ? tokCss : tokJs)(part, st.sub);
          out.push(...res.tokens); st.sub = res.state; i += part.length;
          continue;
        }
        st.m = 'text'; st.sub = null;
        continue;
      }
      if (smartyAt(i)) { smarty(); continue; }
      if (st.m === 'text') {
        if (s.startsWith('<!--', i)) { st.m = 'comment'; continue; }
        const m = s.slice(i).match(/^<(\/?)([A-Za-z][\w:-]*|!DOCTYPE|!doctype|\?xml)/);
        if (m) { push('<' + m[1], 't-pun'); push(m[2], 't-tag'); i += m[0].length; st.m = 'tag'; st.tag = m[1] ? '' : m[2].toLowerCase(); continue; }
        let j = i + 1;
        while (j < s.length && s[j] !== '<') j++;
        push(s.slice(i, j), 't-text'); i = j; continue;
      }
      if (st.m === 'tag') {
        const r = s.slice(i);
        let m;
        if ((m = r.match(/^\s+/))) { push(m[0], ''); i += m[0].length; continue; }
        if ((m = r.match(/^\/?>|^\?>/))) {
          push(m[0], 't-pun'); i += m[0].length;
          st.m = (st.tag === 'script' || st.tag === 'style') && m[0] === '>' ? 'raw' : 'text';
          st.sub = null; continue;
        }
        if (r[0] === '"' || r[0] === "'") { st.m = 'val'; st.q = r[0]; push(r[0], 't-str'); i++; continue; }
        if (r[0] === '=') { push('=', 't-pun'); i++; continue; }
        if ((m = r.match(/^[^\s=>"'<]+/))) { push(m[0], 't-attr'); i += m[0].length; continue; }
        push(r[0], 't-pun'); i++; continue;
      }
      if (st.m === 'val') {
        let j = i;
        while (j < s.length && s[j] !== st.q && !s.startsWith('<{', j)) j++;
        push(s.slice(i, j), 't-str'); i = j;
        if (s[i] === st.q) { push(st.q, 't-str'); i++; st.m = 'tag'; }
        continue;
      }
    }
    return { tokens: out, state: st };
  }
  const TOK = {
    html: tokHtml,
    css: tokCss,
    js: tokJs,
  };

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

  /* ====================================================================== CodeView */
  class CodeView {
    constructor(el, o = {}) {
      this.el = typeof el === 'string' ? $(el) : el;
      this.el.classList.add('ce');
      this.el.innerHTML = '<div class="ce-lines"></div>';
      this.box = this.el.firstChild;
      this.lang = o.lang || 'html';
      this.lh = o.lh || 20;
      this.setText(o.text || '');
      this.focused = false;
    }
    setText(text) {
      this.lines = String(text).split('\n');
      this.top = 0; this.left = 0; this.lockLeft = false; this.ins = null; this.sel = null; this.lineCls = {}; this.sq = []; this.marks = {};
      this.states = [null];
      this.render();
    }
    text() { return this.lines.join('\n'); }
    dirtyFrom(line) { this.states.length = Math.min(this.states.length, line + 1); }
    stateAt(line) {
      // start state of `line` (computed forward from the last known one)
      const tok = TOK[this.lang];
      for (let k = this.states.length - 1; k < line; k++) {
        const res = tok(this.lines[k] || '', this.states[k]);
        this.states[k + 1] = res.state;
      }
      return this.states[line];
    }
    tokens(line) {
      const s = this.lines[line] || '';
      const st = this.stateAt(line);
      const shown = s.length > MAXCH ? s.slice(0, MAXCH) : s;
      return TOK[this.lang](shown, st).tokens;
    }
    /** visible rows; the editor boxes have fixed CSS heights, so the height is read once (reading it after every
     *  render forced a full page layout per keystroke) — 0 while hidden is not kept */
    rows() {
      if (!this._rows || this._rowsW !== innerWidth) {
        const h = this.box.clientHeight;
        if (!h) return 3;
        this._rows = Math.max(3, Math.floor(h / this.lh));
        this._rowsW = innerWidth;
      }
      return this._rows;
    }
    render() {
      const start = Math.max(0, Math.floor(this.top)), frac = this.top - start;
      const end = Math.min(this.lines.length, start + this.rows() + 2);
      const gw = String(Math.max(99, this.lines.length)).length;
      let html = '';
      for (let i = start; i < end; i++) {
        const ranges = [];
        if (this.sel) {
          const { a, b } = this.sel;
          if (i >= a.line && i <= b.line) {
            const from = i === a.line ? a.col : 0;
            const to = i === b.line ? b.col : (this.lines[i] || '').length + 1;
            ranges.push({ from, to, cls: 'selbg' });
          }
        }
        this.sq.filter((q) => q.line === i).forEach((q) => ranges.push({ from: q.from, to: q.to, cls: 'sq-err' }));
        const inserts = [];
        if (this.ins && this.ins.line === i && this.focused) inserts.push({ at: this.ins.col, html: this.ins.html });
        if (this.probe && this.probe.line === i) inserts.push({ at: this.probe.col, html: '<span class="probe"></span>' });
        const s = this.lines[i] || '';
        const selNl = this.sel && i >= this.sel.a.line && i < this.sel.b.line ? '<span class="selbg selnl"> </span>' : '';
        const more = s.length > MAXCH ? '<span class="t-more"></span>' : '';
        const cur = this.ins && this.ins.line === i && this.focused;
        const mark = this.marks[i] ? `<span class="ce-mark ${this.marks[i]}"></span>` : '';
        html += `<div class="ce-line${cur ? ' cur' : ''}${this.lineCls[i] ? ' ' + this.lineCls[i] : ''}" data-l="${i}"><span class="ln" style="width:${gw * 9 + 26}px">${mark}${i + 1}</span><span class="lc"><span class="lx">${lineHtml(this.tokens(i), ranges, inserts)}${selNl}${more}</span></span></div>`;
      }
      this.box.innerHTML = html;
      this.box.style.transform = `translateY(${-frac * this.lh}px)`;
      this.follow();
      if (this.onRender) this.onRender();
    }
    /**
     * Horizontal scrolling like a real code editor: when the caret (or the IME composition) reaches the right edge of
     * the pane the view follows it a few characters ahead, and scrolls back when it returns to the left.
     */
    follow() {
      if (this.left == null) this.left = 0;
      const lc = this.box.querySelector('.lc');
      if (!lc) return;
      const vw = lc.clientWidth;
      const mark = this.box.querySelector('.probe') || (this.focused ? this.box.querySelector('.caret') : null);
      if (mark && vw && !this.lockLeft) {
        const x = mark.offsetLeft;
        const comp = this.box.querySelector('.ime-c');
        const right = Math.max(x, comp ? comp.offsetLeft + comp.offsetWidth : 0);
        if (right - this.left > vw - 24) this.left = Math.ceil(right - vw + 48);
        else if (x - this.left < 10) this.left = Math.max(0, Math.floor(x - Math.min(100, vw * 0.25)));
        if (x < vw - 36 && this.left > 0 && right < vw - 24) this.left = 0;
      }
      this.box.style.setProperty('--hx', this.left + 'px');
    }
    lineEl(i) { return this.box.querySelector(`.ce-line[data-l="${i}"]`); }
    ensureVisible(line, margin = 3) {
      const rows = this.rows();
      if (line < this.top + 1) this.top = Math.max(0, line - margin);
      else if (line > this.top + rows - margin - 1) this.top = Math.min(Math.max(0, this.lines.length - rows + 1), line - rows + margin + 1);
    }
    async scrollTo(top, ms = 700) {
      const s = this.top;
      top = clamp(top, 0, Math.max(0, this.lines.length - 4));
      await tween(ms, (e) => { this.top = s + (top - s) * e; this.render(); }, Ease.inOut);
    }
    /** scroll so `line` sits about a third from the top */
    async reveal(line, ms) { await this.scrollTo(Math.max(0, line - Math.floor(this.rows() * 0.3)), ms); }
    colRect(line, col) {
      this.lockLeft = false;
      this.probe = { line, col };
      this.render();
      const p = this.box.querySelector('.probe');
      const r = p ? p.getBoundingClientRect() : this.lineEl(line).getBoundingClientRect();
      this.probe = null;
      this.lockLeft = true; // keep the column in view until the click puts the caret there
      this.render();
      return { left: r.left, top: r.top, width: 0, height: this.lh, right: r.left, bottom: r.top + this.lh };
    }
    find(text, from = 0) {
      for (let i = from; i < this.lines.length; i++) { const c = this.lines[i].indexOf(text); if (c >= 0) return { line: i, col: c }; }
      return null;
    }
    findLine(re, from = 0) { for (let i = from; i < this.lines.length; i++) if (re.test(this.lines[i])) return i; return -1; }
    focus(on = true) { this.focused = on; this.el.classList.toggle('focus', on); this.render(); }
    setCaret(line, col) { this.lockLeft = false; this.ins = { line, col, html: '<span class="caret"></span>' }; this.sel = null; this.focus(true); }
    async clickAt(line, col, o = {}) {
      if (!o.noScroll) { this.ensureVisible(line, o.margin || 6); this.render(); }
      const r = this.colRect(line, col);
      Cursor.kind('text');
      await Cursor.moveTo(r.left + 1, r.top + this.lh / 2, o);
      await Cursor.click();
      this.setCaret(line, col);
      await wait(o.after != null ? o.after : 140);
    }
    /** press at (l0,c0), drag to (l1,c1) — the selection grows with the pointer */
    async dragSelect(l0, c0, l1, c1, o = {}) {
      this.ensureVisible(l0, 6);
      this.render();
      const a = this.colRect(l0, c0);
      Cursor.kind('text');
      await Cursor.moveTo(a.left + 1, a.top + this.lh / 2);
      Cursor.press();
      this.focus(true);
      this.ins = null;
      const b = this.colRect(l1, c1);
      const dist = Math.max(1, b.left - a.left);
      await Cursor.moveTo(b.left + 1, b.top + this.lh / 2, {
        ms: o.ms || 560, easing: Ease.out,
        onMove: (x, y) => {
          if (l0 === l1) {
            const col = clamp(c0 + Math.round((x - a.left) / Math.max(1, dist / Math.max(1, c1 - c0))), c0, c1);
            this.sel = { a: { line: l0, col: c0 }, b: { line: l0, col } };
          } else {
            const ln = clamp(l0 + Math.round((y - a.top) / this.lh), l0, l1);
            this.sel = { a: { line: l0, col: c0 }, b: { line: ln, col: ln === l1 ? c1 : 0 } };
          }
          this.render();
        },
      });
      Cursor.release();
      this.sel = { a: { line: l0, col: c0 }, b: { line: l1, col: c1 } };
      this.render();
      await wait(o.after != null ? o.after : 200);
    }
    /** click at the start, then Shift+click at the end (scrolling between when the range is long) */
    async shiftSelect(l0, c0, l1, c1, o = {}) {
      await this.clickAt(l0, c0);
      if (l1 > this.top + this.rows() - 4) await this.scrollTo(l1 - this.rows() + 5, o.scrollMs || 900);
      const b = this.colRect(l1, c1);
      Cursor.kind('text');
      await Cursor.moveTo(b.left + 1, b.top + this.lh / 2);
      KeyStrip.special('Shift');
      await wait(120);
      await Cursor.click();
      this.sel = { a: { line: l0, col: c0 }, b: { line: l1, col: c1 } };
      this.ins = null;
      this.render();
      await wait(o.after != null ? o.after : 260);
    }
    selectAll() {
      const n = this.lines.length - 1;
      this.sel = { a: { line: 0, col: 0 }, b: { line: n, col: this.lines[n].length } };
      this.ins = null;
      this.focus(true);
    }
    selectedText() {
      if (!this.sel) return '';
      const { a, b } = this.sel;
      if (a.line === b.line) return this.lines[a.line].slice(a.col, b.col);
      return [this.lines[a.line].slice(a.col), ...this.lines.slice(a.line + 1, b.line), this.lines[b.line].slice(0, b.col)].join('\n');
    }
    /** typing target at the caret (or replacing the selection) */
    target() {
      const a = this.sel ? this.sel.a : { line: this.ins.line, col: this.ins.col };
      const b = this.sel ? this.sel.b : a;
      const orig = this.lines.slice();
      const before = orig[a.line].slice(0, a.col), after = orig[b.line].slice(b.col);
      this.sel = null;
      const self = this;
      return {
        render(text, comp) {
          self.lockLeft = false;
          const parts = (before + text).split('\n');
          self.lines = [...orig.slice(0, a.line), ...parts.slice(0, -1), parts[parts.length - 1] + after, ...orig.slice(b.line + 1)];
          self.dirtyFrom(a.line);
          const cl = a.line + parts.length - 1, cc = parts[parts.length - 1].length;
          self.ins = { line: cl, col: cc, html: comp + '<span class="caret"></span>' };
          self.ensureVisible(cl);
          self.render();
          if (self.onChange) self.onChange();
        },
        anchor() { const c = self.box.querySelector('.ime-c.active') || self.box.querySelector('.ime-c') || self.box.querySelector('.caret'); return screenRect(c || self.box); },
        enter(text) { const cur = (before + text).split('\n').pop(); return '\n' + cur.match(/^\s*/)[0]; },
      };
    }
    async type(script, o = {}) {
      if (typeof script === 'string') script = [{ direct: script }];
      this.focus(true);
      const out = await typeInto(this.target(), script, { kps: 20, ...o });
      this.ins.html = '<span class="caret"></span>';
      this.render();
      return out;
    }
    /** Ctrl+V of a block at the caret / over the selection */
    async paste(text, o = {}) {
      this.focus(true);
      await Keycap.show(['Ctrl', 'V'], 700);
      const t = this.target();
      t.render(text, '');
      const first = this.ins.line - text.split('\n').length + 1;
      if (o.flash !== false && !Clock.ff) {
        const n = text.split('\n').length;
        for (let i = 0; i < Math.min(n, 400); i++) this.lineCls[first + i] = 'flash';
        setTimeout(() => { this.lineCls = {}; this.render(); }, 1500 / Clock.speed);
      }
      this.ins.html = '<span class="caret"></span>';
      this.render();
      await wait(o.after != null ? o.after : 300);
    }
    /** Ctrl+A then Ctrl+V */
    async replaceAll(text, o = {}) {
      this.focus(true);
      await Keycap.show(['Ctrl', 'A'], 600);
      this.selectAll();
      this.render();
      await wait(380);
      this.top = 0;
      await this.paste(text, { ...o, after: 120 });
      this.top = 0;
      this.ins = { line: 0, col: 0, html: '<span class="caret"></span>' };
      this.render();
      await wait(o.after != null ? o.after : 300);
    }
    /** End + Enter on a line, then the new line is ready for typing (keeps indentation) */
    async newLineAfter(line, o = {}) {
      await this.clickAt(line, this.lines[line].length, o);
      KeyStrip.special('End');
      await kw(110);
    }
    markLine(i, cls) { if (cls) this.marks[i] = cls; else delete this.marks[i]; this.render(); }
  }

  window.CodeView = CodeView;
  window.CodeTok = TOK;
})();
