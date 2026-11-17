/*
 * Real third-party UIs captured as documents (js/validator-snapshot.js, js/cms-snapshot.js, js/view-source-snapshot.js,
 * written by tools/snapshots/ne-auberge/capture-*.js) shown in an <iframe>:
 *   - one document per UI: the UI's own stylesheets (inlined as captured) in <head>, the state's <body> swapped in place
 *     (show(name)) — input values, scroll positions, open popovers / modal dialogs are restored, as the capture recorded them
 *   - the scripted pointer is not a real mouse: the UI's :hover rules are re-targeted at .demo-hover, and its :focus rules at
 *     .demo-focus (the frame never takes the keyboard focus, so Space keeps playing / pausing the video)
 *   - typing into one of the UI's inputs: typeTarget(input) draws the text (IME composition, caret) over the input with the
 *     input's own font and padding, then the input gets the value
 */
(function () {
  const D = window.Demo;
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const baseHref = () => location.href.replace(/[#?].*$/, '').replace(/[^/]*$/, '');

  /* ---- tiny CSS walker (rules inside @media / @supports / @layer / @container too) ---- */
  function parseBlocks(css) {
    const out = [];
    let i = 0;
    css = css.replace(/\/\*[\s\S]*?\*\//g, '');
    while (i < css.length) {
      const open = css.indexOf('{', i);
      if (open < 0) break;
      const semi = css.indexOf(';', i);
      if (semi >= 0 && semi < open && /^\s*@(import|charset|namespace|layer [^{]*$)/.test(css.slice(i, semi))) { i = semi + 1; continue; }
      const sel = css.slice(i, open).trim();
      let depth = 1, j = open + 1;
      while (j < css.length && depth) { const c = css[j]; if (c === '{') depth++; else if (c === '}') depth--; j++; }
      const body = css.slice(open + 1, j - 1);
      if (/^@(media|supports|layer|container)/.test(sel)) out.push({ sel, children: parseBlocks(body) });
      else out.push({ sel, body });
      i = j;
    }
    return out;
  }
  /** the rules whose selector has :hover / :focus… re-targeted at classes the demo sets */
  function stateRules(css) {
    const map = (sel) => sel
      .replace(/:hover\b/g, '.demo-hover')
      .replace(/:focus-visible\b/g, '.demo-focus')
      .replace(/:focus-within\b/g, '.demo-focus-within')
      .replace(/:focus\b/g, '.demo-focus');
    const walk = (blocks) => blocks.map((b) => {
      if (b.children) { const inner = walk(b.children); return inner ? `${b.sel}{${inner}}` : ''; }
      if (b.sel.startsWith('@') || !/:(hover|focus)/.test(b.sel)) return '';
      // keep only the selectors of a list that have the state (the others already apply)
      const parts = b.sel.split(/,(?![^(]*\))/).filter((s) => /:(hover|focus)/.test(s)).map(map);
      return parts.length ? `${parts.join(',')}{${b.body}}` : '';
    }).join('');
    return walk(parseBlocks(css));
  }

  const DEMO_CSS = `
    *, *::before, *::after { cursor: none !important; }
    html { scrollbar-width: none; }
    ::-webkit-scrollbar { display: none; }
    .demo-type { position: absolute; z-index: 2147483000; box-sizing: border-box; display: flex; align-items: center; white-space: pre; overflow: hidden;
      pointer-events: none; border-color: transparent !important; background: transparent !important; }
    .demo-caret { display: inline-block; width: 1px; height: 1.15em; background: currentColor; margin: 0 0 0 1px; vertical-align: -0.2em; animation: demoBlink 1s steps(1) infinite; flex: none; }
    @keyframes demoBlink { 50% { opacity: 0; } }
    .demo-ime { text-decoration-line: underline; text-decoration-style: dotted; text-decoration-thickness: 2px; text-underline-offset: .18em; text-decoration-skip-ink: none; }
    .demo-ime.conv { text-decoration-style: solid; text-decoration-thickness: 1.5px; }
    .demo-ime.conv.active { text-decoration-thickness: 3px; background: rgba(0, 120, 215, .18); }
  `;

  class Frame {
    /**
     * container  the element the iframe fills
     * snap       { css: [{css}] | styles: [string], htmlAttrs, states: { name: { body, bodyAttrs, values, scroll } } }
     * o.extraCss more CSS for the frame (e.g. the browser's own colours)
     */
    constructor(container, snap, o = {}) {
      this.container = container;
      this.snap = snap;
      this.o = o;
      this.state = null;
    }
    async load(first) {
      const css = [...(this.snap.css || []).map((c) => c.css), ...(this.snap.styles || [])].join('\n');
      const attrs = (this.snap.htmlAttrs || []).map(([k, v]) => ` ${k}="${esc(v)}"`).join('');
      const f = document.createElement('iframe');
      f.setAttribute('title', this.o.title || '');
      f.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;border:0;display:block;background:#fff';
      f.srcdoc = `<!DOCTYPE html><html${attrs}><head><meta charset="utf-8"><base href="${baseHref()}">`
        + `<style>${css}</style><style>${stateRules(css)}</style><style>${DEMO_CSS}${this.o.extraCss || ''}</style></head><body></body></html>`;
      this.container.innerHTML = '';
      this.container.appendChild(f);
      this.iframe = f;
      await new Promise((r) => { f.onload = r; });
      this.doc = f.contentDocument;
      this.win = f.contentWindow;
      const self = this;
      this.win.__demoHover = (el, on) => { for (let e = el; e && e.nodeType === 1; e = e.parentElement) e.classList.toggle('demo-hover', on); void self; };
      if (first) this.show(first);
      // every font face of the UI, loaded now (the page may still be hidden: nothing would ask for them before it shows)
      const faces = [...this.doc.fonts].map((f) => f.load().catch(() => null));
      await Promise.race([Promise.all(faces), new Promise((r) => setTimeout(r, 10000))]);
      return this;
    }
    /**
     * the captured state `name`. o.keepScroll: the boxes stay where they are scrolled now (the state follows a step the
     * pointer just did in place, e.g. typing into a field the editor was scrolled to)
     */
    show(name, o = {}) {
      const st = this.snap.states[name];
      if (!st) throw new Error('no state ' + name);
      const b = this.doc.body;
      const kept = o.keepScroll ? [...b.querySelectorAll('*')].map((e, i) => (e.scrollTop || e.scrollLeft ? [i, e.tagName + '.' + e.className, e.scrollTop, e.scrollLeft] : null)).filter(Boolean) : null;
      [...b.attributes].forEach((a) => b.removeAttribute(a.name));
      (st.bodyAttrs || []).forEach(([k, v]) => b.setAttribute(k, v));
      b.innerHTML = st.body;
      const all = [...b.querySelectorAll('*')];
      // input values and scroll positions, written onto the elements by the capture
      b.querySelectorAll('[data-demo-value]').forEach((e) => { e.value = e.getAttribute('data-demo-value'); });
      if (kept) {
        kept.forEach(([i, sig, t, l]) => {
          const same = (e) => e && e.tagName + '.' + e.className === sig;
          const e = same(all[i]) ? all[i] : all.find(same);
          if (e) { e.scrollTop = t; e.scrollLeft = l; }
        });
      } else b.querySelectorAll('[data-demo-scroll]').forEach((e) => { const [t, l] = e.getAttribute('data-demo-scroll').split(',').map(Number); e.scrollTop = t; e.scrollLeft = l; });
      b.querySelectorAll('[data-demo-popover]').forEach((e) => { try { e.showPopover(); } catch (x) { /* not a popover here */ } });
      b.querySelectorAll('dialog[data-demo-modal]').forEach((e) => { try { e.close(); e.showModal(); } catch (x) { /* ignore */ } });
      this.state = name;
      return this;
    }
    $(sel) { return this.doc.querySelector(sel); }
    $$(sel) { return [...this.doc.querySelectorAll(sel)]; }
    /** first element of `sel` whose text matches */
    byText(sel, re) { return this.$$(sel).find((e) => re.test(e.textContent.trim())); }
    /** smooth scroll of a box inside the frame (on the demo clock) */
    async scrollBox(el, top, ms = 700) {
      const from = el.scrollTop;
      await D.tween(ms, (e) => { el.scrollTop = from + (top - from) * e; }, D.Ease.inOut);
    }
    focus(el, on) {
      el.classList.toggle('demo-focus', on);
      for (let e = el.parentElement; e && e.nodeType === 1; e = e.parentElement) e.classList.toggle('demo-focus-within', on);
    }
    /** typeInto() target drawn over an <input> / <textarea> of the frame */
    typeTarget(input, o = {}) {
      const doc = this.doc, win = this.win;
      const cs = win.getComputedStyle(input);
      const r = input.getBoundingClientRect();
      const ov = doc.createElement('div');
      ov.className = 'demo-type';
      ['font', 'letterSpacing', 'color', 'paddingLeft', 'paddingRight', 'paddingTop', 'paddingBottom', 'borderLeftWidth', 'borderRightWidth', 'borderTopWidth', 'borderBottomWidth', 'borderStyle', 'textAlign', 'lineHeight']
        .forEach((k) => { ov.style[k] = cs[k]; });
      Object.assign(ov.style, { left: r.left + win.scrollX + 'px', top: r.top + win.scrollY + 'px', width: r.width + 'px', height: r.height + 'px' });
      doc.body.appendChild(ov);
      const base = o.base != null ? o.base : '';
      input.style.color = 'transparent';
      input.style.caretColor = 'transparent';
      input.value = '';
      this.focus(input, true);
      const frame = this;
      return {
        cls: { comp: 'demo-ime' },
        render(text, comp) { ov.innerHTML = `<span>${esc(base + text)}</span>${comp}<span class="demo-caret"></span>`; },
        anchor() { const c = ov.querySelector('.demo-ime.active') || ov.querySelector('.demo-ime') || ov.querySelector('.demo-caret') || ov; return D.screenRect(c); },
        done(text) {
          ov.remove();
          input.style.color = '';
          input.style.caretColor = '';
          input.value = base + text;
          frame.focus(input, false);
        },
      };
    }
  }

  window.RealUI = { Frame, stateRules };
})();
