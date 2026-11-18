/*
 * The on-screen apps shared by the Shopify production-process videos (markup: shared/kit/dom.js):
 *   Code     — VS Code as it looks by default (Dark Modern theme, its codicons, the Seti file icons, the minimap):
 *              explorer (new files), tabs, editor with caret / selection / IME typing, terminal (Term)
 *   Browser  — Chrome: tabs, omnibox, reload, DevTools (console / network), device mode
 *   Admin    — the Shopify admin (it needs a login, so its screens are rebuilt; the logo and favicon are the real ones):
 *              navigation, pages built with the H helpers, modals, toasts, settings
 *   Store    — the captured live storefront (shared/kit/store-frame.js) at PC width and in device mode
 *   TE       — the theme editor look-alike (sections / blocks, settings panel, preview)
 *   FileDialog — the Windows 11 "開く" dialog (file uploads)
 *   Hi       — a small syntax highlighter (VS Code "Dark+" colours): Liquid, HTML, CSS, JS, JSON, CSV, YAML, TOML, .env, Markdown
 * The taskbar, title bars and browser tabs show the real app icons and favicons (public/shared/icons, favicons, logos).
 * Each video adds its own views in videos/<id>/js/ and drives everything from its scenario.
 */
(function () {
  'use strict';
  const D = window.Demo;
  const V = window.VIDEO || {};
  const { $, $$, esc, icon, clamp, wait, kw, tween, Ease, Cursor, UI, screenRect, clickUi, hoverUi, moveToEl, Keycap, KeyStrip, typeInto, fieldTarget, Clock } = D;

  /* ======================================================================= icons */
  const XP = {
    bag: 'M6 7h12l1 14H5zM9 7a3 3 0 0 1 6 0',
    inbox: 'M22 12h-6l-2 3h-4l-2-3H2M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z',
    target: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 18a6 6 0 1 0 0-12 6 6 0 0 0 0 12zM12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4z',
    percent: 'M19 5L5 19M6.5 9a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5zM17.5 20a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z',
    store: 'M3 9l1.5-5h15L21 9M3 9v11h18V9M3 9a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0M9 20v-6h6v6',
    pos: 'M4 4h16v10H4zM8 18h8M12 14v4',
    apps: 'M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM17 14v6M14 17h6',
    exit: 'M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9',
    desktop: 'M3 4h18v12H3zM8 20h8M12 16v4',
    'file-plus': 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M12 18v-6M9 15h6',
    'folder-plus': 'M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2zM12 11v6M9 14h6',
    truck: 'M1 3h15v13H1zM16 8h4l3 3v5h-7M5.5 21a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5zM18.5 21a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z',
    receipt: 'M4 2v20l3-2 3 2 3-2 3 2 3-2V2l-3 2-3-2-3 2-3-2-3 2zM8 8h8M8 12h8M8 16h5',
    building: 'M3 21h18M5 21V5l7-3v19M19 21V9l-7-3M9 9h.01M9 13h.01M9 17h.01M15 13h.01M15 17h.01',
    mail: 'M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zM22 6l-10 7L2 6',
    key: 'M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.78 7.78 5.5 5.5 0 0 1 7.78-7.78zM15.5 7.5l3 3L22 7l-3-3',
    clock: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 6v6l4 2',
    shield: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z',
    refresh: 'M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15',
    flow: 'M6 3v6M6 15v6M3 9h6v6H3zM15 3h6v6h-6zM15 15h6v6h-6zM9 12h3M12 6v12M12 6h3M12 18h3',
    webhook: 'M18 16.98h-5.99c-1.1 0-1.95.94-2.48 1.9A4 4 0 0 1 2 17c.01-.7.2-1.4.57-2M6 17l3.13-5.78c.53-.97.1-2.18-.5-3.1a4 4 0 1 1 6.89-4.06M12 6l3.13 5.73C15.66 12.7 16.9 13 18 13a4 4 0 0 1 0 8',
    terminal: 'M4 17l6-6-6-6M12 19h8',
    cube: 'M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z',
    'external': 'M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3',
    filter: 'M22 3H2l8 9.46V19l4 2v-8.54z',
    sort: 'M3 6h18M6 12h12M10 18h4',
    store2: 'M3 21h18M4 21V10M20 21V10M2 10l10-7 10 7',
    gauge: 'M12 14l4-4M3.34 19a10 10 0 1 1 17.32 0',
    location: 'M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0zM12 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
    doc: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M16 13H8M16 17H8M10 9H8',
    yen: 'M6 3l6 8 6-8M12 11v10M7 13h10M7 17h10',
    play: 'M6 4l14 8-14 8z',
    pause: 'M6 4h4v16H6zM14 4h4v16h-4z',
    'circle-check': 'M22 11.08V12a10 10 0 1 1-5.93-9.14M22 4L12 14.01l-3-3',
  };
  const svg = (d, s = 16) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="${d}"/></svg>`;
  const ic = (n) => (XP[n] ? svg(XP[n]) : icon(n));
  function hydrate(root = document) {
    $$('i[data-ic]', root).forEach((i) => { if (!i.firstChild) i.innerHTML = ic(i.dataset.ic); });
    D.hydrateIcons(root);
  }

  /* ================================================================= highlighter */
  const LANG = { liquid: 'liquid', html: 'html', php: 'php', css: 'css', scss: 'css', js: 'js', mjs: 'js', cjs: 'js', ts: 'js', jsx: 'js', tsx: 'js', json: 'json', csv: 'csv', tsv: 'csv', yml: 'yaml', yaml: 'yaml', toml: 'toml', md: 'md', env: 'env', graphql: 'gql', gql: 'gql', sh: 'sh', txt: 'txt' };
  const langOf = (p) => { const n = p.split('/').pop(); if (n.startsWith('.env')) return 'env'; return LANG[n.split('.').pop()] || 'txt'; };
  const LANG_NAME = { liquid: 'Liquid', html: 'HTML', php: 'PHP', css: 'CSS', js: 'JavaScript', json: 'JSON', csv: 'CSV', yaml: 'YAML', toml: 'TOML', md: 'Markdown', env: 'Properties', gql: 'GraphQL', sh: 'Shell Script', txt: 'Plain Text' };
  const JS_RE = /(\/\/.*$|\/\*.*?(?:\*\/|$))|(`(?:[^`\\]|\\.)*`?|'(?:[^'\\]|\\.)*'?|"(?:[^"\\]|\\.)*"?)|\b(import|from|export|default|return|if|else|for|of|in|while|await|try|catch|finally|throw|new|switch|case|break|continue)\b|\b(const|let|var|function|async|class|extends|this|typeof|instanceof)\b|\b(true|false|null|undefined|NaN)\b|\b(\d[\d_]*(?:\.\d+)?)\b|([A-Za-z_$][\w$]*)(?=\s*\()|\b([A-Z][A-Za-z0-9_]*)\b|([A-Za-z_$][\w$]*)|(=>|[{}()[\];,.:?=<>!&|+*/%-])/g;
  function jsTokens(s, out) {
    let last = 0, m;
    JS_RE.lastIndex = 0;
    while ((m = JS_RE.exec(s))) {
      if (m.index > last) out.push([s.slice(last, m.index), '']);
      const cls = m[1] ? 't-com' : m[2] ? 't-str' : m[3] ? 't-ctl' : m[4] ? 't-kw' : m[5] ? 't-kw' : m[6] ? 't-num' : m[7] ? 't-fn' : m[8] ? 't-type' : m[9] ? 't-var' : '';
      out.push([m[0], cls]);
      last = JS_RE.lastIndex;
      if (m[0] === '') JS_RE.lastIndex++;
    }
    if (last < s.length) out.push([s.slice(last), '']);
  }
  const LQ_RE = /("[^"]*"?|'[^']*'?)|\b(if|elsif|else|endif|unless|endunless|for|endfor|in|case|when|endcase|assign|capture|endcapture|render|section|sections|schema|endschema|style|endstyle|stylesheet|endstylesheet|javascript|endjavascript|form|endform|comment|endcomment|liquid|echo|and|or|contains|limit|break|continue|paginate|endpaginate|with|as|blank|empty|nil|true|false)\b|(\|\s*)([a-z_]+)|\b(\d+(?:\.\d+)?)\b|([A-Za-z_][\w-]*)|([.[\]:,=<>!]+)/g;
  function liquidInner(s, out) {
    let last = 0, m;
    LQ_RE.lastIndex = 0;
    while ((m = LQ_RE.exec(s))) {
      if (m.index > last) out.push([s.slice(last, m.index), '']);
      if (m[1]) out.push([m[1], 't-str']);
      else if (m[2]) out.push([m[2], 't-lq']);
      else if (m[4]) { out.push([m[3], 't-lqd']); out.push([m[4], 't-lqf']); }
      else if (m[5]) out.push([m[5], 't-num']);
      else if (m[6]) out.push([m[6], 't-lqv']);
      else out.push([m[0], 't-pun']);
      last = LQ_RE.lastIndex;
      if (m[0] === '') LQ_RE.lastIndex++;
    }
    if (last < s.length) out.push([s.slice(last), '']);
  }
  /** text that may contain {{ }} / {% %}: liquid inside, `plain(text, out)` outside */
  function withLiquid(s, out, plain) {
    let i = 0;
    while (i < s.length) {
      const a = s.indexOf('{{', i), b = s.indexOf('{%', i);
      const k = a < 0 ? b : b < 0 ? a : Math.min(a, b);
      if (k < 0) { plain(s.slice(i), out); return; }
      if (k > i) plain(s.slice(i, k), out);
      const close = s.indexOf(s[k + 1] === '{' ? '}}' : '%}', k + 2);
      const end = close < 0 ? s.length : close + 2;
      const inner = s.slice(k, end);
      const o = inner.match(/^(\{[{%]-?)([\s\S]*?)(-?[}%]\}|)$/);
      out.push([o[1], 't-lqd']);
      if (s[k + 1] === '%') {
        const t = o[2].match(/^(\s*)([a-z_]+)/);
        if (t) { out.push([t[1], '']); out.push([t[2], 't-lq']); liquidInner(o[2].slice(t[0].length), out); }
        else liquidInner(o[2], out);
      } else liquidInner(o[2], out);
      if (o[3]) out.push([o[3], 't-lqd']);
      i = end;
    }
  }
  function htmlTokens(s, st, out, liquid) {
    let i = 0;
    const str = (v) => (liquid && /\{[{%]/.test(v) ? withLiquid(v, out, (t, o) => o.push([t, 't-str'])) : out.push([v, 't-str']));
    while (i < s.length) {
      if (liquid && (s.startsWith('{{', i) || s.startsWith('{%', i)) && !st.tag) {
        const close = s.indexOf(s[i + 1] === '{' ? '}}' : '%}', i + 2);
        const end = close < 0 ? s.length : close + 2;
        withLiquid(s.slice(i, end), out, () => {});
        i = end; continue;
      }
      if (st.tag) {
        const ws = s.slice(i).match(/^\s+/);
        if (ws) { out.push([ws[0], '']); i += ws[0].length; continue; }
        if (s.startsWith('/>', i)) { out.push(['/>', 't-pun']); i += 2; st.tag = false; continue; }
        if (s[i] === '>') { out.push(['>', 't-pun']); i++; st.tag = false; continue; }
        if (s[i] === '"' || s[i] === "'") { const q = s[i]; const e = s.indexOf(q, i + 1); const j = e < 0 ? s.length : e + 1; str(s.slice(i, j)); i = j; continue; }
        if (liquid && (s.startsWith('{{', i) || s.startsWith('{%', i))) {
          const close = s.indexOf(s[i + 1] === '{' ? '}}' : '%}', i + 2);
          const end = close < 0 ? s.length : close + 2;
          withLiquid(s.slice(i, end), out, () => {});
          i = end; continue;
        }
        if (s[i] === '=') { out.push(['=', '']); i++; continue; }
        const a = s.slice(i).match(/^[^\s=>/"'{]+/);
        if (a) { out.push([a[0], 't-attr']); i += a[0].length; continue; }
        out.push([s[i], '']); i++; continue;
      }
      if (s.startsWith('<!--', i)) { const e = s.indexOf('-->', i); const j = e < 0 ? s.length : e + 3; out.push([s.slice(i, j), 't-com']); i = j; continue; }
      const t = s.slice(i).match(/^(<\/?)([A-Za-z][\w.:-]*|!DOCTYPE)/);
      if (t) { out.push([t[1], 't-pun']); out.push([t[2], 't-tag']); i += t[0].length; st.tag = true; continue; }
      const stop = liquid ? /^[^<{]+|^\{(?![{%])/ : /^[^<]+/;
      const txt = s.slice(i).match(stop);
      if (txt) { out.push([txt[0], '']); i += txt[0].length; continue; }
      out.push([s[i], '']); i++;
    }
  }
  function cssTokens(s, out) {
    const tr = s.trim();
    if (!tr) { out.push([s, '']); return; }
    if (/^\/\*|^\*/.test(tr)) { out.push([s, 't-com']); return; }
    const prop = s.match(/^(\s*)([\w-]+)(\s*:\s*)(.*?)(;?)(\s*\/\*.*\*\/)?$/);
    if (prop && !/[{,]\s*$/.test(tr) && !/^@/.test(tr)) { out.push([prop[1], '']); out.push([prop[2], 't-prop']); out.push([prop[3], '']); out.push([prop[4], 't-str']); out.push([prop[5], '']); if (prop[6]) out.push([prop[6], 't-com']); return; }
    if (/^@/.test(tr)) { const m = s.match(/^(\s*)(@[\w-]*)(.*)$/); out.push([m[1], '']); out.push([m[2], 't-ctl']); out.push([m[3], '']); return; }
    out.push([s, tr === '}' ? '' : 't-sel']);
  }
  /*
   * PHP as VS Code's Dark Modern colours it: markup outside <?php ?> as HTML, inside: $variables, keywords / storage /
   * control words, functions, Class_Names, CONSTANTS, strings, comments (also /* *\/ over several lines).
   * State across lines in `st`: st.php (inside <?php), st.pcom (inside /* *\/), st.pq (an HTML attribute quote that the
   * PHP block interrupted: class="<?php echo … ?>").
   */
  const PHP_RE = /(\?>)|(\/\*)|(\/\/.*?(?=\?>|$)|#(?!\[).*?(?=\?>|$))|('(?:[^'\\]|\\.)*'?|"(?:[^"\\]|\\.)*"?)|(\$[A-Za-z_]\w*)|\b(if|else|elseif|endif|foreach|endforeach|for|endfor|while|endwhile|do|switch|endswitch|case|default|break|continue|return|require|require_once|include|include_once|try|catch|finally|throw|match|yield|goto)\b|\b(function|fn|class|interface|trait|enum|extends|implements|public|private|protected|static|const|namespace|use|abstract|final|readonly|global|var|new|instanceof|as|and|or|xor|insteadof)\b|\b(echo|print|array|list|isset|unset|empty|exit|die|eval)\b(?=\s*[\s(;'"$])|\b(true|false|null|TRUE|FALSE|NULL|self|parent)\b|\b(\d[\d_]*(?:\.\d+)?)\b|([A-Za-z_\\][\w\\]*)(?=\s*\()|\b([A-Z][A-Z0-9_]*[A-Z0-9])\b(?!\s*::)|\b([A-Z][A-Za-z0-9_]*)\b|([A-Za-z_]\w*)|(=>|->|\?->|::|[{}()[\];,.:?=<>!&|+*/%@-])/g;
  function phpTokens(s, st, out) {
    let i = 0;
    while (i < s.length) {
      if (!st.php) {
        if (st.pq) {   // the rest of an attribute value the PHP block was inside of
          const e = s.indexOf(st.pq, i);
          const j = e < 0 ? s.length : e + 1;
          out.push([s.slice(i, j), 't-str']); i = j;
          if (e >= 0) st.pq = null;
          continue;
        }
        const k = s.indexOf('<?', i);
        const seg = k < 0 ? s.slice(i) : s.slice(i, k);
        if (seg) {
          const n = out.length;
          htmlTokens(seg, st, out, false);
          const last = out.length > n ? out[out.length - 1] : null;
          // the segment ended inside an attribute value ( class="<?php … ): the value goes on after the PHP block
          if (k >= 0 && last && last[1] === 't-str' && /^["']/.test(last[0]) && (last[0].length === 1 || !last[0].endsWith(last[0][0]))) st.pq = last[0][0];
        }
        if (k < 0) return;
        const open = s.slice(k).match(/^<\?(?:php|=)?/)[0];
        out.push([open, 't-php']); i = k + open.length; st.php = true;
        continue;
      }
      if (st.pcom) {
        const e = s.indexOf('*/', i);
        const j = e < 0 ? s.length : e + 2;
        out.push([s.slice(i, j), 't-com']); i = j;
        if (e >= 0) st.pcom = false;
        continue;
      }
      PHP_RE.lastIndex = i;
      const m = PHP_RE.exec(s);
      if (!m) { out.push([s.slice(i), '']); return; }
      if (m.index > i) out.push([s.slice(i, m.index), '']);
      i = PHP_RE.lastIndex;
      if (m[1]) { out.push([m[1], 't-php']); st.php = false; continue; }
      if (m[2]) {
        const e = s.indexOf('*/', m.index + 2);
        i = e < 0 ? s.length : e + 2;
        out.push([s.slice(m.index, i), 't-com']);
        if (e < 0) st.pcom = true;
        continue;
      }
      const before = s.slice(0, m.index);
      const member = /(\?->|->)\s*$/.test(before);   // $post->ID, $q->posts: properties
      const cls = m[3] ? 't-com' : m[4] ? 't-str' : m[5] ? 't-var' : m[6] ? 't-ctl' : m[7] ? 't-kw' : m[8] ? 't-fn' : m[9] ? 't-kw' : m[10] ? 't-num'
        : m[11] ? (/\bnew\s+$/.test(before) ? 't-type' : 't-fn')
          : m[12] ? (member ? 't-var' : 't-const') : m[13] ? (member ? 't-var' : 't-type') : m[14] ? (member ? 't-var' : '') : '';
      out.push([m[0], cls]);
      if (m[0] === '') PHP_RE.lastIndex++;
    }
  }
  function jsonTokens(s, out) {
    const re = /("(?:[^"\\]|\\.)*")(\s*:)?|(-?\b\d+(?:\.\d+)?\b)|\b(true|false|null)\b/g;
    let last = 0, m;
    while ((m = re.exec(s))) {
      if (m.index > last) out.push([s.slice(last, m.index), '']);
      if (m[1]) { out.push([m[1], m[2] ? 't-key' : 't-str']); if (m[2]) out.push([m[2], '']); }
      else if (m[3]) out.push([m[3], 't-num']);
      else out.push([m[4], 't-kw']);
      last = re.lastIndex;
    }
    if (last < s.length) out.push([s.slice(last), '']);
  }
  function csvTokens(s, out) {
    let col = 0, i = 0;
    while (i <= s.length) {
      let j = i;
      if (s[i] === '"') { j = i + 1; while (j < s.length && !(s[j] === '"' && s[j + 1] !== '"')) j += s[j] === '"' ? 2 : 1; j++; }
      while (j < s.length && s[j] !== ',' && s[j] !== '\t') j++;
      if (j > i) out.push([s.slice(i, j), 't-c' + (col % 8)]);
      if (j < s.length) out.push([s[j], 't-pun']);
      col++; i = j + 1;
      if (j >= s.length) break;
    }
  }
  function yamlTokens(s, out) {
    const c = s.match(/^(\s*)(#.*)$/);
    if (c) { out.push([c[1], '']); out.push([c[2], 't-com']); return; }
    const m = s.match(/^(\s*-?\s*)([\w.-]+)(\s*:)(.*)$/);
    if (m) { out.push([m[1], 't-pun']); out.push([m[2], 't-kw']); out.push([m[3], '']); out.push([m[4], /^\s*\d+$/.test(m[4]) ? 't-num' : 't-str']); return; }
    out.push([s, 't-str']);
  }
  function tomlTokens(s, out) {
    const tr = s.trim();
    if (/^#/.test(tr)) { out.push([s, 't-com']); return; }
    if (/^\[.*\]$/.test(tr)) { out.push([s, 't-type']); return; }
    const m = s.match(/^(\s*)([\w.-]+)(\s*=\s*)(.*)$/);
    if (m) { out.push([m[1], '']); out.push([m[2], 't-var']); out.push([m[3], '']); out.push([m[4], /^(true|false|\d+)$/.test(m[4].trim()) ? 't-kw' : 't-str']); return; }
    out.push([s, '']);
  }
  function envTokens(s, out) {
    if (/^\s*#/.test(s)) { out.push([s, 't-com']); return; }
    const m = s.match(/^([A-Z0-9_]+)(=)(.*)$/);
    if (m) { out.push([m[1], 't-var']); out.push([m[2], '']); out.push([m[3], 't-str']); return; }
    out.push([s, '']);
  }
  function mdTokens(s, out) {
    if (/^#{1,6}\s/.test(s)) { out.push([s, 't-head']); return; }
    const b = s.match(/^(\s*[-*]\s|\s*\d+\.\s)(.*)$/);
    if (b) { out.push([b[1], 't-bul']); s = b[2]; }
    const re = /(`[^`]*`)|(\*\*[^*]+\*\*)/g; let last = 0, m;
    while ((m = re.exec(s))) { if (m.index > last) out.push([s.slice(last, m.index), '']); out.push([m[0], m[1] ? 't-str' : 't-kw']); last = re.lastIndex; }
    if (last < s.length) out.push([s.slice(last), '']);
  }
  function gqlTokens(s, out) {
    const re = /(#.*$)|("[^"]*")|\b(query|mutation|fragment|on|true|false|null)\b|(\$\w+)|\b([A-Z]\w*)\b|(\w+)(?=\s*[:(])|([{}()[\]:,!=])/g;
    let last = 0, m;
    while ((m = re.exec(s))) {
      if (m.index > last) out.push([s.slice(last, m.index), '']);
      out.push([m[0], m[1] ? 't-com' : m[2] ? 't-str' : m[3] ? 't-kw' : m[4] ? 't-var' : m[5] ? 't-type' : m[6] ? 't-fn' : 't-pun']);
      last = re.lastIndex;
    }
    if (last < s.length) out.push([s.slice(last), 't-var']);
  }
  /** tokens for every line: [[text, cls], …][] */
  function highlight(lang, lines) {
    const res = [];
    const st = { tag: false, block: null };
    for (const s of lines) {
      const out = [];
      if (lang === 'liquid') {
        const open = s.match(/\{%-?\s*(schema|style|stylesheet|javascript)\s*-?%\}/);
        const close = s.match(/\{%-?\s*end(schema|style|stylesheet|javascript)\s*-?%\}/);
        if (st.block && !close) {
          if (st.block === 'schema') jsonTokens(s, out); else if (st.block === 'javascript') jsTokens(s, out); else cssTokens(s, out);
        } else htmlTokens(s, st, out, true);
        if (open && !close) st.block = open[1];
        if (close) st.block = null;
      } else if (lang === 'html') htmlTokens(s, st, out, false);
      else if (lang === 'php') phpTokens(s, st, out);
      else if (lang === 'css') cssTokens(s, out);
      else if (lang === 'js') jsTokens(s, out);
      else if (lang === 'json') jsonTokens(s, out);
      else if (lang === 'csv') csvTokens(s, out);
      else if (lang === 'yaml') yamlTokens(s, out);
      else if (lang === 'toml') tomlTokens(s, out);
      else if (lang === 'env') envTokens(s, out);
      else if (lang === 'md') mdTokens(s, out);
      else if (lang === 'gql') gqlTokens(s, out);
      else out.push([s, '']);
      res.push(out);
    }
    return res;
  }
  const Hi = { langOf, highlight, LANG_NAME, jsTokens, htmlTokens, phpTokens, withLiquid };

  /* ======================================================================== CODE */
  const LH = 21;
  // VS Code's file icons (Seti) and codicons: public/shared/vscode.js
  const fileIcon = (p) => window.VSC.fileIcon(p);
  const ci = (n) => window.VSC.ci(n);
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

  /** VS Code-like Enter: keep the indentation, one level more after an opening bracket / tag / Liquid block */
  function indentAfter(cur, unit = '  ') {
    const ind = cur.match(/^\s*/)[0];
    if (/^\s*\*\/\s*$/.test(cur)) return ind.slice(0, -1);
    return ind + (/[[{(]\s*$/.test(cur) || /^\s*<(?!\/)(?!.*<\/)[^>]*[^/]>\s*$/.test(cur) || /\{%-?\s*(if|for|unless|case|when|else|form|capture|schema)\b.*%\}\s*$/.test(cur) ? unit : '');
  }
  /**
   * typing script for whole lines of code (as they should end up): Enter + the editor's auto-indent, corrected with
   * Backspace / spaces; ASCII typed with the IME off, Japanese runs through the IME using `ja` (run -> chunk(s))
   */
  function codeScript(lines, ja = {}, o = {}) {
    const out = [];
    let prev = o.after != null ? o.after : null;
    const unit = o.unit || '  ';
    for (const line of lines) {
      const ind = line.match(/^ */)[0].length;
      const body = line.slice(ind);
      if (prev != null) {
        out.push({ key: 'Enter' });
        const auto = indentAfter(prev, unit).length;
        if (auto > ind) out.push({ key: 'Backspace', n: auto - ind });
        else if (auto < ind) out.push({ direct: ' '.repeat(ind - auto) });
      } else if (ind) out.push({ direct: ' '.repeat(ind) });
      // Japanese runs (digits between Japanese characters stay in the run)
      const re = /[^\x00-\x7f]+(?:[0-9]+[^\x00-\x7f]+)*/g;
      let last = 0, m;
      while ((m = re.exec(body))) {
        if (m.index > last) out.push({ direct: body.slice(last, m.index) });
        const c = ja[m[0]];
        if (!c) throw new Error('codeScript: no IME entry for 「' + m[0] + '」');
        (Array.isArray(c) ? c : [c]).forEach((x) => out.push(x));
        last = re.lastIndex;
      }
      if (last < body.length) out.push({ direct: body.slice(last) });
      prev = line;
    }
    return out;
  }

  const Code = {
    files: {}, tabs: [], active: null, top: 0, left: 0,
    ins: null, sel: null, sq: [], lineCls: {}, status: {}, tree: [],
    /** files: { path: text }, tree: [[path, 'dir', open?] | [path]] (explorer order) */
    init(files = {}, tree = null) {
      for (const [p, text] of Object.entries(files)) this.addFile(p, text, { silent: true });
      if (!tree) {
        // folders first (open), then files, like the explorer sorts them
        const dirs = new Set();
        Object.keys(files).forEach((p) => { const a = p.split('/'); for (let i = 1; i < a.length; i++) dirs.add(a.slice(0, i).join('/')); });
        const all = [...[...dirs].map((d) => [d, 'dir', 1]), ...Object.keys(files).map((p) => [p])];
        const key = (p, dir) => p.split('/').map((s, i, a) => ((i < a.length - 1 || dir) ? '0' : '1') + s).join('/');
        tree = all.sort((a, b) => key(a[0], a[1] === 'dir').localeCompare(key(b[0], b[1] === 'dir')));
      }
      this.tree = tree.map(([path, kind, open]) => ({ path, dir: kind === 'dir', open: !!open }));
      this.renderTree();
      this.render();
    },
    addFile(path, text = '', o = {}) {
      this.files[path] = { path, lang: langOf(path), lines: String(text).split('\n'), dirty: false, indent: o.indent || '  ' };
      if (!o.silent && !this.tree.some((n) => n.path === path)) {
        // keep the explorer order: after the last sibling in the same folder
        const dir = path.split('/').slice(0, -1).join('/');
        let at = this.tree.length;
        const idx = this.tree.map((n, i) => [n, i]).filter(([n]) => n.path.split('/').slice(0, -1).join('/') === dir && !n.dir);
        const after = idx.filter(([n]) => n.path.localeCompare(path) < 0).pop();
        if (after) at = after[1] + 1; else if (idx.length) at = idx[0][1]; else { const d = this.tree.findIndex((n) => n.path === dir); if (d >= 0) at = d + 1; }
        this.tree.splice(at, 0, { path, dir: false });
        this.renderTree();
      }
      return this.files[path];
    },
    renderTree() {
      const openDirs = new Set(this.tree.filter((n) => n.dir && n.open).map((n) => n.path));
      const visible = (p) => { const parts = p.split('/'); for (let i = 1; i < parts.length; i++) if (!openDirs.has(parts.slice(0, i).join('/'))) return false; return true; };
      $('#vsTree').innerHTML = this.tree.filter((n) => visible(n.path)).map((n) => {
        const depth = n.path.split('/').length - 1;
        const name = n.path.split('/').pop();
        const s = this.status[n.path] || '';
        if (n.input != null) return `<div class="vs-node input" data-path="${esc(n.path)}" style="padding-left:${6 + depth * 12}px"><span class="tw"></span>${fileIcon(n.input || 'x.txt')}<span class="vs-nin">${esc(n.input)}<span class="caret"></span></span></div>`;
        return `<div class="vs-node${n.path === this.active ? ' focus' : ''}${s === 'M' ? ' mod' : s === 'U' ? ' add' : ''}" data-path="${esc(n.path)}" style="padding-left:${6 + depth * 12}px">` +
          (n.dir ? `<span class="tw">${ci(n.open ? 'chevron-down' : 'chevron-right')}</span>` : `<span class="tw"></span>${fileIcon(n.path)}`) +
          `<span class="nm">${esc(name)}</span>${s && !n.dir ? `<span class="st">${s}</span>` : ''}</div>`;
      }).join('');
    },
    node(path) { return $(`.vs-node[data-path="${CSS.escape(path)}"]`); },
    mark(path, s) { this.status[path] = s; this.renderTree(); this.gitBadge(); },
    gitBadge() { const n = Object.keys(this.status).length; const b = $('#vsGitBadge'); b.textContent = n; b.classList.toggle('show', n > 0); },
    clearStatus() { this.status = {}; this.renderTree(); this.gitBadge(); },
    show(path, o = {}) {
      if (!this.tabs.includes(path)) this.tabs.push(path);
      this.active = path;
      const f = this.files[path];
      this.top = o.top != null ? o.top : (f.lastTop || 0);
      this.left = f.lastLeft || 0;
      this.lockLeft = false;
      this.ins = null; this.sel = null; this.sq = []; this.lineCls = {}; this.clearSelectAll();
      $('#vsLang').textContent = LANG_NAME[f.lang] || 'Plain Text';
      $('#vsIndent').textContent = f.indent === '\t' ? 'タブのサイズ: 4' : 'スペース: 2';
      $('#vsEol').textContent = f.crlf ? 'CRLF' : 'LF';
      $('#vsEnc').textContent = f.enc || 'UTF-8';
      $('#vsPos').textContent = 'Ln 1, Col 1';
      this.renderTabs();
      this.renderTree();
      this.render();
    },
    async openFile(path, o = {}) {
      const parts = path.split('/');
      for (let i = 1; i < parts.length; i++) await this.expand(parts.slice(0, i).join('/'));
      const n = this.node(path);
      if (n) await clickUi(n, { after: 60 });
      this.show(path, o);
      await wait(o.after != null ? o.after : 260);
    },
    async expand(path) {
      const n = this.tree.find((x) => x.path === path);
      if (!n || n.open) return;
      await clickUi(this.node(path), { after: 40 });
      n.open = true;
      this.renderTree();
      await wait(160);
    },
    /** explorer: "new file" in a folder, type its name, Enter -> opens empty */
    async newFile(path, o = {}) {
      const dir = path.split('/').slice(0, -1).join('/');
      if (dir) { const d = this.tree.find((x) => x.path === dir); if (d && !d.open) await this.expand(dir); else if (d) await clickUi(this.node(dir), { after: 40 }); }
      await clickUi('#vsNewFile', { after: 80 });
      const at = dir ? this.tree.findIndex((x) => x.path === dir) + 1 : this.tree.length;
      const node = { path: path + '#new', dir: false, input: '' };
      this.tree.splice(at, 0, node);
      this.renderTree();
      const name = path.split('/').pop();
      await typeInto({
        render: (text) => { node.input = text; this.renderTree(); },
        anchor: () => screenRect($('.vs-node.input .caret') || $('#vsTree')),
      }, [{ direct: name }], { kps: 12, quietMode: true });
      KeyStrip.special('Enter');
      this.tree.splice(this.tree.indexOf(node), 1);
      this.addFile(path, o.text || '');
      this.mark(path, 'U');
      this.show(path, { top: 0 });
      this.setCaret(0, 0);
      await wait(260);
    },
    renderTabs() {
      $('#vsTabs').innerHTML = this.tabs.map((p) => {
        const f = this.files[p];
        return `<div class="vs-tab${p === this.active ? ' on' : ''}${f.dirty ? ' dirty' : ''}" data-tab="${esc(p)}">${fileIcon(p)}<span class="nm">${esc(p.split('/').pop())}</span><span class="x">${ci('close')}</span></div>`;
      }).join('');
      const p = this.active ? this.active.split('/') : [];
      $('#vsCrumbs').innerHTML = p.map((x, i) => (i ? ci('chevron-right') : '') + (i === p.length - 1 ? fileIcon(this.active) : '') + `<span>${esc(x)}</span>`).join('');
    },
    closeTab(path) { this.tabs = this.tabs.filter((t) => t !== path); if (this.active === path) { const n = this.tabs[this.tabs.length - 1]; if (n) this.show(n); else { this.active = null; this.renderTabs(); this.render(); } } else this.renderTabs(); },
    rows() {
      if (!this._hAll || this._rowsW !== innerWidth) {
        const h = $('#vsLines').clientHeight;
        if (!h) return 5;
        this._hAll = h + Math.max(0, $('#vsPanel').offsetHeight - 1);
        this._rowsW = innerWidth;
      }
      const p = $('#vsPanel');
      const on = p.classList.contains('show');
      return Math.max(5, Math.floor((this._hAll - (on ? (p.classList.contains('tall') ? 360 : 252) : 0)) / LH));
    },
    render() {
      const box = $('#vsLines');
      const f = this.files[this.active];
      if (!f) { box.innerHTML = `<div class="vs-empty">${icon('code')}<span>ファイルを開いて編集を開始</span></div>`; this.hbar(0, 0, 0); this.minimap(null); return; }
      f.lastTop = this.top;
      const toks = highlight(f.lang, f.lines);
      const start = Math.max(0, Math.floor(this.top)), frac = this.top - start;
      const end = Math.min(f.lines.length, start + this.rows() + 2);
      let html = '';
      for (let i = start; i < end; i++) {
        const ranges = [];
        if (this.sel && this.sel.line === i) ranges.push({ from: this.sel.from, to: this.sel.to, cls: 'selbg' });
        if (this.msel && i >= this.msel.a && i <= this.msel.b) ranges.push({ from: 0, to: f.lines[i].length, cls: 'selbg' });
        this.sq.filter((q) => q.line === i).forEach((q) => ranges.push({ from: q.from, to: q.to, cls: 'sq-err' }));
        const inserts = [];
        if (this.ins && this.ins.line === i) inserts.push({ at: this.ins.col, html: this.ins.html });
        if (this.probe && this.probe.line === i) inserts.push({ at: this.probe.col, html: '<span class="probe"></span>' });
        const cur = this.ins && this.ins.line === i;
        html += `<div class="vs-line${cur ? ' cur' : ''}${this.lineCls[i] ? ' ' + this.lineCls[i] : ''}" data-l="${i}"><span class="ln">${i + 1}</span><span class="lc"><span class="lx">${lineHtml(toks[i] || [], ranges, inserts)}</span></span></div>`;
      }
      box.innerHTML = html;
      box.style.paddingTop = 2 - frac * LH + 'px';
      this.minimap(f, toks);
      if (this.ins) $('#vsPos').textContent = `Ln ${this.ins.line + 1}, Col ${this.ins.col + 1}`;
      this.follow();
    },
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
      this.hbar(vw, widest, this.left);
    },
    /** the minimap at the right of the editor (public/shared/vscode.js) */
    minimap(f, toks) { window.VSC.minimap($('#vsMini'), f ? toks : null, this.top); },
    hbar(vw, widest, left) {
      const bar = $('#vsHbar');
      const on = widest > vw + 4 || left > 0;
      bar.classList.toggle('show', on);
      if (!on) return;
      const total = Math.max(widest + 40, left + vw);
      const th = bar.firstElementChild;
      th.style.width = Math.max(30, (vw / total) * 100) + '%';
      th.style.left = (left / total) * 100 + '%';
    },
    lineEl(i) { return $(`.vs-line[data-l="${i}"]`); },
    ensureVisible(line, margin = 3) {
      const rows = this.rows();
      if (line < this.top + 1) this.top = Math.max(0, line - margin);
      else if (line > this.top + rows - margin) this.top = line - rows + margin + 1;
    },
    async scrollTo(top, ms = 700) {
      const f = this.files[this.active];
      top = clamp(top, 0, Math.max(0, f.lines.length - 3));
      const s = this.top;
      await tween(ms, (e) => { this.top = s + (top - s) * e; this.render(); }, Ease.inOut);
    },
    /** bring a line into view (scrolls when it is outside the visible rows) */
    async reveal(line, ms = 700, margin = 6) {
      const rows = this.rows();
      if (line >= this.top + 1 && line <= this.top + rows - margin) return;
      await this.scrollTo(Math.max(0, line - Math.floor(rows / 3)), ms);
    },
    async scrollX(left, ms = 700) {
      const s = this.left;
      await tween(ms, (e) => { this.left = s + (left - s) * e; $('#vsLines').style.setProperty('--hx', this.left + 'px'); }, Ease.inOut);
      this.lockLeft = true;
      this.render();
    },
    colRect(line, col) {
      this.lockLeft = false;
      this.probe = { line, col };
      this.render();
      const p = $('#vsLines .probe');
      const r = p ? p.getBoundingClientRect() : this.lineEl(line).getBoundingClientRect();
      this.probe = null;
      this.lockLeft = true;
      this.render();
      return { left: r.left, top: r.top, width: 0, height: LH, right: r.left, bottom: r.top + LH };
    },
    find(text, from = 0) {
      const f = this.files[this.active];
      for (let i = from; i < f.lines.length; i++) { const c = f.lines[i].indexOf(text); if (c >= 0) return { line: i, col: c }; }
      return null;
    },
    findLine(re, from = 0) { const f = this.files[this.active]; for (let i = from; i < f.lines.length; i++) if (re.test(f.lines[i])) return i; return -1; },
    setCaret(line, col) { this.lockLeft = false; this.ins = { line, col, html: '<span class="caret"></span>' }; this.sel = null; this.msel = null; this.render(); },
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
      const a = this.colRect(line, from);
      Cursor.kind('text');
      await Cursor.moveTo(a.left + 1, a.top + LH / 2);
      Cursor.press();
      const b = this.colRect(line, to);
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
    /** whole lines a..b selected (Shift+click), replaced by the next type()/paste() */
    async selectLines(a, b) {
      await this.clickAt(a, 0);
      await this.reveal(b, 600);
      KeyStrip.special('Shift');
      const r = this.colRect(b, this.files[this.active].lines[b].length);
      await Cursor.moveTo(r.left + 1, r.top + LH / 2);
      await Cursor.click();
      this.ins = null;
      this.msel = { a, b };
      this.render();
      await wait(260);
    },
    selectAll() { this.selAll = true; $('#vsLines').classList.add('selall'); },
    clearSelectAll() { this.selAll = false; $('#vsLines').classList.remove('selall'); },
    /** typing target at the caret (or replacing the selection) */
    target() {
      const f = this.files[this.active];
      let line, c0, c1, orig = f.lines.slice(), endLine;
      if (this.msel) { line = this.msel.a; c0 = 0; endLine = this.msel.b; c1 = orig[endLine].length; }
      else { line = this.sel ? this.sel.line : this.ins.line; c0 = this.sel ? this.sel.from : this.ins.col; c1 = this.sel ? this.sel.to : this.ins.col; endLine = line; }
      const before = orig[line].slice(0, c0), after = orig[endLine].slice(c1);
      this.sel = null; this.msel = null;
      const self = this;
      return {
        render(text, comp) {
          self.lockLeft = false;
          const parts = (before + text).split('\n');
          f.lines = [...orig.slice(0, line), ...parts.slice(0, -1), parts[parts.length - 1] + after, ...orig.slice(endLine + 1)];
          if (!f.dirty) { f.dirty = true; self.renderTabs(); }
          const cl = line + parts.length - 1, cc = parts[parts.length - 1].length;
          self.ins = { line: cl, col: cc, html: comp + '<span class="caret"></span>' };
          self.ensureVisible(cl);
          self.render();
        },
        anchor() { const c = $('#vsLines .ime-c.active') || $('#vsLines .ime-c') || $('#vsLines .caret'); return screenRect(c || $('#vsLines')); },
        enter(text) { return '\n' + indentAfter((before + text).split('\n').pop(), f.indent); },
      };
    },
    async type(script, o = {}) {
      if (typeof script === 'string') script = [{ direct: script }];
      this.clearSelectAll();
      await typeInto(this.target(), script, { kps: 20, ...o });
      this.ins.html = '<span class="caret"></span>';
      this.render();
    },
    /** Ctrl+V of a block of text at the caret / over the selection */
    async paste(text, o = {}) {
      this.clearSelectAll();
      await Keycap.show(['Ctrl', 'V'], 650);
      const t = this.target();
      t.render(text, '');
      const at = this.ins.line;
      const n = text.split('\n').length;
      if (o.flash !== false && !Clock.ff) { for (let i = 0; i < n; i++) this.lineCls[at - n + 1 + i] = 'flash'; setTimeout(() => { this.lineCls = {}; this.render(); }, 1400 / Clock.speed); }
      this.render();
      await wait(o.after != null ? o.after : 300);
    },
    async newLineAfter(line, o = {}) {
      const f = this.files[this.active];
      await this.clickAt(line, Math.min(f.lines[line].length, o.clickCol != null ? o.clickCol : 4), o);
      KeyStrip.special('End');
      this.setCaret(line, f.lines[line].length);
      await kw(160);
    },
    /** caret at the end of the line containing `needle`, Enter (keeps indentation), then type */
    async lineAfter(needle, script, o = {}) {
      const p = this.find(needle, o.from || 0);
      if (!p) throw new Error('not found: ' + needle);
      await this.reveal(p.line, o.scrollMs);
      await this.newLineAfter(p.line);
      return this.type([{ key: 'Enter' }, ...(typeof script === 'string' ? [{ direct: script }] : script)], o);
    },
    /** drag over `text` (first occurrence at/after line `from`) and type over it */
    async overwrite(text, script, o = {}) {
      const p = this.find(text, o.from || 0);
      if (!p) throw new Error('not found: ' + text);
      await this.reveal(p.line, o.scrollMs);
      const col = p.col + (o.offset || 0);
      const len = o.len != null ? o.len : text.length - (o.offset || 0);
      await this.dragSelect(p.line, col, col + len);
      return this.type(script, o);
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
    async save(o = {}) {
      await Keycap.show(['Ctrl', 'S'], 700);
      const f = this.files[this.active];
      f.dirty = false;
      this.renderTabs();
      if (!o.noStatus && !this.status[this.active]) this.mark(this.active, o.status || 'M');
      await wait(200);
    },
    setText(path, text) { this.files[path].lines = String(text).split('\n'); if (path === this.active) this.render(); },
    text(path = this.active) { return this.files[path].lines.join('\n'); },
    async panel(on, o = {}) { const p = $('#vsPanel'); p.classList.toggle('tall', !!o.tall); p.classList.toggle('show', on); await D.realWait(320); this.render(); },
    problems(e, w = 0) { $('#vsProblems').innerHTML = `${ci('error')} ${e} ${ci('warning')} ${w}`; },
    /** the quick pick at the top of the window (command palette, "Reopen with Encoding" …): returns after the pick */
    async quickPick(items, pick, o = {}) {
      let qp = $('#vsQp');
      if (!qp) { qp = document.createElement('div'); qp.id = 'vsQp'; qp.className = 'vs-qp'; $('#win-code').appendChild(qp); }
      qp.innerHTML = `<div class="vs-qp-in">${esc(o.placeholder || '')}</div>` + items.map((x) => {
        const [label, desc] = Array.isArray(x) ? x : [x, ''];
        return `<div class="vs-qp-i${label === pick ? ' pk' : ''}"><span>${esc(label)}</span><span class="d">${esc(desc)}</span></div>`;
      }).join('');
      qp.classList.add('show');
      await wait(o.look || 600);
      const t = $('.vs-qp-i.pk', qp);
      if (t) { await hoverUi(t, { hold: 150 }); $$('.vs-qp-i', qp).forEach((e) => e.classList.toggle('sel', e === t)); await clickUi(t, { after: 60 }); }
      qp.classList.remove('show');
      await wait(150);
    },
  };

  const Term = {
    lines: [],
    prompt: `PS ${(V.project && V.project.path) || 'C:\\dev'}> `,
    keep: 80,
    render(input) {
      const keep = this.lines.slice(-this.keep);
      const el = $('#vsTerm');
      el.innerHTML = keep.map((l) => `<div>${l}</div>`).join('') + (input != null ? `<div>${esc(this.prompt)}<span id="termIn">${input}</span></div>` : '');
      el.scrollTop = el.scrollHeight;
    },
    clear() { this.lines = []; this.render('<span class="caret"></span>'); },
    async run(cmd, out = [], o = {}) {
      KeyStrip.hideNow(); // a new command: the key display starts fresh (not after the editor's last keys)
      this.render('<span class="caret"></span>');
      const inEl = $('#termIn');
      const script = typeof cmd === 'string' ? [{ direct: cmd }] : cmd;
      const typed = await typeInto(fieldTarget(inEl), script, { kps: o.kps || 15, keepStrip: true, quietMode: true });
      KeyStrip.special('Enter');
      KeyStrip.idleHide(900);
      this.lines.push(esc(this.prompt) + `<span class="tw2">${o.shown != null ? o.shown : esc(typed)}</span>`);
      this.render();
      await this.out(out, o);
      this.render(o.noPrompt ? null : '<span class="caret"></span>');
    },
    async out(out = [], o = {}) {
      for (const line of out) {
        if (typeof line === 'number') { await wait(line); continue; }
        if (typeof line === 'function') { await line(); continue; }
        this.lines.push(line);
        this.render(null);
        await kw(o.gap || 90);
      }
    },
    async spin(text, ms, done) {
      const frames = '⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏';
      this.lines.push('');
      const i = this.lines.length - 1;
      const n = Math.max(1, Math.round(ms / 110));
      for (let k = 0; k < n; k++) { this.lines[i] = `<span class="tc">${frames[k % frames.length]}</span> ${text}`; this.render(null); await wait(110); }
      this.lines[i] = done;
      this.render(null);
    },
    /** a progress bar line: label [████░░] n/total — rendered `steps` times over `ms` */
    async progress(label, total, ms, o = {}) {
      this.lines.push('');
      const i = this.lines.length - 1;
      const steps = o.steps || Math.max(4, Math.round(ms / 140));
      for (let k = 1; k <= steps; k++) {
        const n = Math.round((total * k) / steps);
        const pct = Math.round((n / total) * 100);
        this.lines[i] = `${label}<span class="tprog"><i style="width:${pct}%"></i></span>${n.toLocaleString()} / ${total.toLocaleString()} <span class="tdim">${pct}%${o.unit ? ' ' + o.unit : ''}</span>`;
        this.render(null);
        await wait(ms / steps);
      }
      if (o.done) { this.lines[i] = o.done; this.render(null); }
    },
  };

  /* ===================================================================== BROWSER */
  // tab icons: the real favicons (npm run favicons). The stores' own favicons come with their snapshots (FAV.store).
  const FI = (src) => `<img class="br-fav img" src="${esc(src)}" alt="">`;
  const FAVICON = (f) => FI('../../shared/favicons/' + f);
  const FAV = {
    admin: FAVICON('shopify.png'),     // Shopify admin and theme editor (admin.shopify.com)
    shopify: FAVICON('shopify.png'),   // Shopify Theme Store / App Store
    ms: FAVICON('makeshop.ico'),       // makeshop byGMO shop admin (console.makeshop.jp)
    github: FAVICON('github.svg'),
    gmail: FAVICON('gmail.ico'),
    dev: FAVICON('default.png'),       // a page without a favicon (dev servers, self-made tools, the PDF viewer): Chrome's own icon
    blank: '<span class="br-fav" style="background:transparent"></span>',
  };
  const Browser = {
    tabs: [], active: null, FAV,
    tabEl(id) { return $(`.br-tab[data-tab="${id}"]`); },
    addTab(t, o = {}) {
      const tab = { fav: 'admin', ...t };
      this.tabs.push(tab);
      const el = document.createElement('div');
      el.className = 'br-tab' + (o.anim && !Clock.ff ? ' new' : '');
      el.dataset.tab = tab.id;
      el.innerHTML = `<span class="fav">${FAV[tab.fav] || FAV.admin}</span><span class="tt"></span><span class="x">${icon('close')}</span>`;
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
      if (t.page === 'store') Store.fit();
      if (t.page === 'editor') TE.fit();
      if (t.onShow) t.onShow();
    },
    showUrl(url) {
      const m = String(url).match(/^(https?:\/\/)?([^/]+)(.*)$/);
      $('#brLock').innerHTML = /^https/.test(url) ? window.Win11.SVG.tune : icon('info');
      const blur = (t) => esc(t).replace(/\{\{(.*?)\}\}/g, '<span class="pii">$1</span>');
      $('#brUrl').innerHTML = m && url ? `${blur(m[2])}<span class="dim">${blur(m[3])}</span>` : blur(url || '');
    },
    setTitle(id, title) { const t = this.tab(id); t.title = title; $('.tt', this.tabEl(id)).textContent = title; },
    setUrl(id, url) { this.tab(id).url = url; if (this.active === id) this.showUrl(url); },
    setPage(id, page) { this.tab(id).page = page; if (this.active === id) this.activate(id); },
    setFav(id, fav) { this.tab(id).fav = fav; $('.fav', this.tabEl(id)).innerHTML = FAV[fav] || FAV.admin; },
    /** title + url + page in one go (navigation inside a tab) */
    nav(id, o) { if (o.title) this.setTitle(id, o.title); if (o.url) this.setUrl(id, o.url); if (o.page) this.setPage(id, o.page); if (o.fav) this.setFav(id, o.fav); },
    loading(id, on) {
      const f = $('.fav', this.tabEl(id));
      f.innerHTML = on ? '<span class="br-fav spin"></span>' : (FAV[this.tab(id).fav] || FAV.admin);
    },
    async clickTab(id, o = {}) { await clickUi(this.tabEl(id), { kind: 'arrow', after: 60, ...o }); this.activate(id); await wait(160); },
    async typeUrl(text, o = {}) {
      await clickUi('#brOmni', { kind: 'text' });
      $('#brOmni').classList.add('focus');
      $('#brUrl').innerHTML = `<span style="background:#c6dafc">${esc($('#brUrl').textContent)}</span>`;
      await wait(200);
      await typeInto(fieldTarget($('#brUrl')), [{ direct: text }], { kps: 14, keepStrip: true, quietMode: true });
      KeyStrip.special('Enter');
      KeyStrip.idleHide(800);
      $('#brOmni').classList.remove('focus');
      await wait(o.after != null ? o.after : 100);
    },
    async newTab(id) {
      await clickUi('#brNewTab', { kind: 'arrow', after: 80 });
      this.addTab({ id, title: '新しいタブ', url: '', page: 'blank', fav: 'blank' }, { anim: true });
      await wait(250);
    },
    /** Chrome's download bubble (top right): a finished download */
    async download(name, size, o = {}) {
      let b = $('#brDl');
      if (!b) {
        b = document.createElement('div');
        b.id = 'brDl'; b.className = 'br-dl';
        $('#win-browser').appendChild(b);
      }
      b.innerHTML = `<div class="br-dl-h">最近のダウンロード履歴</div><div class="br-dl-r">${fileIcon(name)}<div><b>${esc(name)}</b><span>${esc(size)} • 完了</span></div><i data-icon="folder"></i></div>`;
      D.hydrateIcons(b);
      b.classList.add('show');
      await wait(o.hold || 2200);
      b.classList.remove('show');
      await wait(200);
    },
    /** reload button (or a key); `fn` does the actual (re)load while the tab spins */
    async reload(fn, o = {}) {
      if (o.key) await Keycap.show([o.key], 600);
      else await clickUi('#brReload', { after: 40 });
      const id = this.active;
      this.loading(id, true);
      if (fn) await fn(); else await wait(o.ms || 450);
      await wait(200);
      this.loading(id, false);
    },
  };

  /* ===================================================================== ADMIN */
  const st = V.store || {};
  const ADMIN = `https://admin.shopify.com/store/${st.handle || 'store'}`;
  /** small HTML builders for admin pages */
  const H = {
    page(o, body) {
      return `<div class="sa-page${o.wide ? ' wide' : ''}${o.full ? ' full' : ''}"><div class="sa-ph">${o.back ? `<span class="back" data-back><i data-icon="arrow-left"></i></span>` : ''}${o.icon ? `<i data-ic="${o.icon}"></i>` : ''}<h1>${esc(o.title)}</h1>${o.badge || ''}<span class="acts">${(o.actions || []).join('')}</span></div>${o.sub ? `<div class="sa-sub-h">${o.sub}</div>` : ''}${body}</div>`;
    },
    card(title, body, o = {}) { return `<div class="sa-card${o.flush ? ' flush' : ''}"${o.id ? ` id="${o.id}"` : ''}>${title ? `<h2>${title}${o.right ? `<span class="r">${o.right}</span>` : ''}</h2>` : ''}${body}</div>`; },
    btn(label, o = {}) { return `<span class="sa-btn${o.pri ? ' pri' : ''}${o.plain ? ' plain' : ''}${o.crit ? ' crit' : ''}${o.off ? ' off' : ''}"${o.id ? ` id="${o.id}"` : ''}${o.act ? ` data-act="${o.act}"` : ''}>${o.icon ? `<i data-ic="${o.icon}"></i>` : ''}${esc(label)}</span>`; },
    badge(text, tone = '', o = {}) { return `<span class="sa-bd ${tone}${o.dot ? ' dot' : ''}${o.full ? ' full' : ''}">${esc(text)}</span>`; },
    banner(tone, title, body = '', o = {}) { return `<div class="sa-banner ${tone}"${o.id ? ` id="${o.id}"` : ''}><i data-icon="${tone === 'crit' ? 'x-circle' : tone === 'ok' ? 'check' : tone === 'warn' ? 'alert' : 'info'}"></i><div>${title ? `<b>${title}</b>` : ''}${body}</div></div>`; },
    field(label, value = '', o = {}) {
      return `<div class="sa-f"${o.wrapId ? ` id="${o.wrapId}"` : ''}>${label ? `<label>${esc(label)}</label>` : ''}<div class="sa-in${o.ta ? ' ta' : ''}${o.select ? ' sel' : ''}"${o.id ? ` id="${o.id}"` : ''}>${o.pre || ''}<span class="v">${o.html ? value : esc(value)}</span>${o.ph && !value ? `<span class="ph">${esc(o.ph)}</span>` : ''}${o.suffix ? `<span class="sf">${esc(o.suffix)}</span>` : ''}</div>${o.hint ? `<div class="hint">${o.hint}</div>` : ''}</div>`;
    },
    table(cols, rows, o = {}) {
      const th = cols.map((c) => { const [label, cls] = Array.isArray(c) ? c : [c, '']; return `<th class="${cls}">${label}</th>`; }).join('');
      const tr = rows.map((r, i) => `<tr${o.rowId ? ` data-row="${esc(o.rowId(r, i))}"` : ''}${o.rowCls ? ` class="${o.rowCls(r, i)}"` : ''}>${r.map((c, j) => { const cls = Array.isArray(cols[j]) ? cols[j][1] : ''; return `<td class="${cls}">${c}</td>`; }).join('')}</tr>`).join('');
      return `<table class="sa-tbl"${o.id ? ` id="${o.id}"` : ''}><thead><tr>${th}</tr></thead><tbody>${tr}</tbody></table>`;
    },
    thumb(src, o = {}) { return `<span class="sa-th${o.sm ? ' sm' : ''}" style="${src ? `background-image:url('${esc(src)}')` : ''}${o.bg ? `;background-color:${o.bg}` : ''}"></span>`; },
    prod(name, src) { return `<span class="sa-pn">${H.thumb(src)}<span>${esc(name)}</span></span>`; },
    ck(on) { return `<span class="sa-ck${on ? ' on' : ''}"></span>`; },
    kv(pairs) { return `<dl class="sa-kv">${pairs.map(([k, v]) => `<dt>${esc(k)}</dt><dd>${v}</dd>`).join('')}</dl>`; },
    prog(pct, o = {}) { return `<div class="sa-prog"${o.id ? ` id="${o.id}"` : ''}><i style="width:${pct}%"></i></div>`; },
    yen(n) { return '¥' + Number(n).toLocaleString('ja-JP'); },
  };
  const Admin = {
    tab: 'adm',
    url(p = '') { return ADMIN + p; },
    /** the browser tab title of an admin page: "<title> · <store> · Shopify" */
    title(t) { return `${t} · ${st.name || 'ストア'} · Shopify`; },
    nav(key) {
      const top = key ? key.split('/')[0] : '';
      $$('#saNav .sa-ni, #saNav .sa-si').forEach((e) => e.classList.toggle('on', e.dataset.nav === key || (e.classList.contains('sa-ni') && e.dataset.nav === top && !key.includes('/'))));
      $$('#saNav .sa-sub').forEach((s) => s.classList.toggle('open', s.dataset.sub === top));
      if (key && key.includes('/')) { const p = $(`#saNav .sa-ni[data-nav="${top}"]`); if (p) p.classList.add('on'); p && p.classList.add('parent'); }
    },
    /** show a page: o = { nav, title (tab title), path (url path after /store/<handle>) } */
    show(html, o = {}) {
      $('#saMain').innerHTML = html;
      hydrate($('#saMain'));
      $('#saScroll').scrollTop = 0;
      if (o.nav != null) this.nav(o.nav);
      if (Browser.tab(this.tab)) {
        Browser.nav(this.tab, { title: o.title ? this.title(o.title) : undefined, url: o.path != null ? this.url(o.path) : undefined });
        const t = Browser.tab(this.tab);
        this._last = { title: t.title, url: t.url };
      }
    },
    /** click a navigation item, then show the page */
    async go(navKey, html, o = {}) {
      const top = navKey.split('/')[0];
      const sub = navKey.includes('/');
      const subEl = $(`#saNav .sa-sub[data-sub="${top}"]`); // installed apps (app/<id>) have no submenu to open
      if (sub && subEl && !subEl.classList.contains('open')) { await clickUi($(`#saNav .sa-ni[data-nav="${top}"]`), { after: 60 }); this.nav(top); await wait(200); }
      await clickUi($(`#saNav [data-nav="${navKey}"]`), { after: 60 });
      Browser.loading(this.tab, true);
      await wait(o.load != null ? o.load : 380);
      Browser.loading(this.tab, false);
      this.show(html, { nav: navKey, ...o });
      await wait(o.after != null ? o.after : 300);
    },
    /** navigate inside the admin by clicking `el` (a row, a button), then show the page */
    async open(el, html, o = {}) {
      if (el) await clickUi(el, { after: 60, ...(o.click || {}) });
      Browser.loading(this.tab, true);
      await wait(o.load != null ? o.load : 380);
      Browser.loading(this.tab, false);
      this.show(html, o);
      await wait(o.after != null ? o.after : 300);
    },
    async scroll(y, ms = 800, box = '#saScroll') {
      const b = $(box);
      y = clamp(y, 0, b.scrollHeight - b.clientHeight);
      const s = b.scrollTop;
      await tween(ms, (e) => { b.scrollTop = s + (y - s) * e; }, Ease.inOut);
    },
    async scrollToEl(el, offset = 80, ms = 800, box = '#saScroll') {
      if (typeof el === 'string') el = $(el);
      const b = $(box);
      const y = el.getBoundingClientRect().top - b.getBoundingClientRect().top + b.scrollTop - offset;
      await this.scroll(y, ms, box);
    },
    modal(html, o = {}) {
      const md = $('#saMd');
      md.className = 'sa-md' + (o.lg ? ' lg' : '');
      md.innerHTML = `<div class="sa-md-h">${esc(o.title || '')}<span class="x"><i data-icon="close"></i></span></div><div class="sa-md-b">${html}</div>${o.foot ? `<div class="sa-md-f">${o.foot}</div>` : ''}`;
      hydrate(md);
      // over the settings too when they are open (the modal dims the screen it was opened from)
      const ov = $('#saOv'), host = $('#saSet').classList.contains('show') ? $('#saSet') : $('#sa .sa-main');
      if (ov.parentElement !== host) host.appendChild(ov);
      ov.classList.add('show');
    },
    closeModal() { $('#saOv').classList.remove('show'); },
    toast(text, o = {}) {
      const t = $('#saToast');
      t.textContent = text;
      t.classList.toggle('err', !!o.err);
      t.classList.add('show');
      const tk = (this._tt = (this._tt || 0) + 1);
      wait(o.hold || 2600).then(() => { if (tk === this._tt) t.classList.remove('show'); });
    },
    /** the contextual save bar over the top bar (unsaved changes) */
    saveBar(on, text) { if (text) $('#saSaveText').textContent = text; $('#saSaveBar').classList.toggle('show', on); },
    /** click 保存 in the save bar: spins, the bar goes, a toast */
    async saveFromBar(toast = '保存しました') {
      await clickUi('#saSave', { after: 60 });
      await this.busy('#saSave', 650);
      this.saveBar(false);
      this.toast(toast);
      await wait(300);
    },
    /** a button that spins while the admin works */
    async busy(el, ms = 700) {
      if (typeof el === 'string') el = $(el);
      el.classList.add('busy');
      await wait(ms);
      el.classList.remove('busy');
    },
    /* ---- settings (full-screen, own navigation) */
    SETTINGS: [['general', 'store', 'ストアの詳細'], ['plan', 'receipt', 'プラン'], ['users', 'users', 'ユーザー'], ['payments', 'yen', '決済'], ['checkout', 'cart', 'チェックアウト'],
      ['accounts', 'user', '顧客アカウント'], ['shipping', 'truck', '配送と配達'], ['taxes', 'receipt', '税金と関税'], ['locations', 'location', 'ロケーション'], ['markets', 'globe', 'マーケット'],
      ['apps', 'apps', 'アプリと販売チャネル'], ['domains', 'globe', 'ドメイン'], ['events', 'target', '顧客イベント'], ['notifications', 'bell', '通知'], ['custom-data', 'database', 'カスタムデータ'],
      ['languages', 'lang', '言語'], ['policies', 'doc', 'ポリシー']],
    settings(key, html, o = {}) {
      $('#saSetNav').innerHTML = this.SETTINGS.map(([k, i, l]) => `<div class="sa-ni${k === key ? ' on' : ''}" data-set="${k}"><i data-ic="${i}"></i>${esc(l)}</div>`).join('');
      $('#saSetMain').innerHTML = html;
      hydrate($('#saSet'));
      $('#saSetScroll').scrollTop = 0;
      $('#saSet').classList.add('show');
      if (Browser.tab(this.tab)) Browser.nav(this.tab, { title: this.title(o.title || '設定'), url: this.url('/settings/' + (o.path || key)) });
    },
    /** open the settings (from the navigation) and go to one of its pages */
    async openSettings(key, html, o = {}) {
      if (!$('#saSet').classList.contains('show')) {
        await clickUi($('#saNav [data-nav="settings"]'), { after: 60 });
        this.settings('general', this.generalPage(), { title: 'ストアの詳細', path: 'general' });
        await wait(550);
      }
      if (key !== 'general') {
        const it = $(`#saSetNav [data-set="${key}"]`);
        if (it) await clickUi(it, { after: 60 });
        Browser.loading(this.tab, true); await wait(320); Browser.loading(this.tab, false);
      }
      this.settings(key, html, o);
      await wait(300);
    },
    generalPage() {
      return H.page({ title: 'ストアの詳細' }, H.card('ストアの詳細', H.kv([['ストア名', esc(st.name || '')], ['ストアのメールアドレス', '<span class="pii">info@example.com</span>'], ['ストアの通貨', '日本円（JPY ¥）'], ['タイムゾーン', '(GMT+09:00) 大阪、札幌、東京']])) +
        H.card('請求先情報', '<p class="sa-mute">請求先の住所・電話番号</p><p class="pii">東京都 ・・・</p>'));
    },
    /** close the settings: the tab shows the admin page behind them again */
    closeSettings() {
      $('#saSet').classList.remove('show');
      if (this._last && Browser.tab(this.tab)) Browser.nav(this.tab, this._last);
    },
    /** installed apps listed in the navigation (name, colour, initials) */
    apps(list) { $('#saApps').innerHTML = list.map((a) => `<div class="sa-si" data-nav="app/${esc(a.id)}"><span class="sa-app-ic" style="background:${esc(a.color)};width:18px;height:18px;border-radius:5px;font-size:9px;margin:0 8px 0 -26px">${esc(a.initials || a.name[0])}</span>${esc(a.name)}</div>`).join(''); },
  };

  /** single-line field (.sa-in with a .v inside): click, type (IME or direct) */
  async function typeInput(el, script, o = {}) {
    if (typeof el === 'string') el = $(el);
    await clickUi(el, { kind: 'text', after: 80 });
    el.classList.add('focus');
    const v = $('.v', el) || el;
    const base = o.keep ? v.textContent : '';
    const text = await typeInto(fieldTarget(v, { base }), typeof script === 'string' ? [{ direct: script }] : script, { kps: o.kps || 12, ...o });
    v.textContent = base + text;
    el.classList.remove('focus');
    return base + text;
  }
  /** a dropdown: click the field, pick an option from the list that opens below it */
  async function choose(el, options, pick, o = {}) {
    if (typeof el === 'string') el = $(el);
    await clickUi(el, { after: 80 });
    const r = screenRect(el); // also right for a field inside a (scaled) iframe
    const pop = document.createElement('div');
    pop.className = 'sa-pop';
    pop.innerHTML = options.map((x) => `<div class="sa-pop-i${x === pick ? ' pk' : ''}">${esc(x)}</div>`).join('');
    pop.style.left = r.left + 'px'; pop.style.top = r.bottom + 4 + 'px'; pop.style.minWidth = r.width + 'px';
    document.body.appendChild(pop);
    await wait(o.look || 500);
    const target = $('.sa-pop-i.pk', pop);
    if (target) { await hoverUi(target, { hold: 120 }); await clickUi(target, { after: 60 }); }
    pop.remove();
    const v = $('.v', el); if (v) v.textContent = pick;
    await wait(150);
  }

  /* ================================================================ FILE DIALOG */
  const FileDialog = {
    /** Windows 11 "開く" dialog: o = { folder: ['PC', 'ダウンロード'], files: [{name, date, type, size}], pick: name } */
    async pick(o) {
      const el = document.createElement('div');
      el.className = 'fd';
      el.innerHTML = `<div class="fd-win"><div class="fd-title"><img src="../../shared/icons/chrome.webp" alt="" width="16" height="16">開く<span class="sp"></span><span class="fd-x">${window.Win11.CAP.close}</span></div>
        <div class="fd-bar"><span>${icon('arrow-left')}</span><span>${icon('arrow-right')}</span><span>${icon('chevron-up')}</span><span>${icon('reload')}</span>
          <div class="fd-path">${icon('folder')}${(o.folder || ['PC', 'ダウンロード']).map((x) => `<span>${esc(x)}</span>`).join(icon('chevron-right'))}</div><div class="fd-search">${icon('search')}${esc((o.folder || ['ダウンロード']).slice(-1)[0])}の検索</div></div>
        <div class="fd-body"><nav class="fd-nav"><div>${icon('home')}ホーム</div><div>${icon('image')}ギャラリー</div><div class="sep"></div><div>${icon('folder')}デスクトップ</div><div class="on">${icon('download')}ダウンロード</div><div>${icon('files')}ドキュメント</div><div>${icon('image')}ピクチャ</div></nav>
          <div class="fd-list"><div class="fd-h"><span>名前</span><span>更新日時</span><span>種類</span><span>サイズ</span></div>
          ${(o.files || []).map((f) => `<div class="fd-r" data-f="${esc(f.name)}"><span>${fileIcon(f.name)}${esc(f.name)}</span><span>${esc(f.date || '')}</span><span>${esc(f.type || '')}</span><span>${esc(f.size || '')}</span></div>`).join('')}</div></div>
        <div class="fd-foot"><span>ファイル名(N):</span><div class="fd-in" id="fdName"></div><div class="fd-ty">${esc(o.filter || 'すべてのファイル (*.*)')}</div><span class="fd-b pri" id="fdOpen">開く(O)</span><span class="fd-b">キャンセル</span></div></div>`;
      $('#desk').appendChild(el);
      await wait(Clock.ff ? 0 : 60);
      el.classList.add('show');
      await wait(o.look || 700);
      const row = $(`.fd-r[data-f="${CSS.escape(o.pick)}"]`, el);
      await clickUi(row, { after: 120 });
      row.classList.add('on');
      $('#fdName', el).textContent = o.pick;
      await wait(300);
      await clickUi($('#fdOpen', el), { after: 80 });
      el.remove();
      await wait(200);
    },
  };

  /* ===================================================================== STORE */
  const PC_W = 1920;
  function fitPc(fitEl, box) {
    const W = box.clientWidth, Ht = box.clientHeight;
    if (!W || !Ht) return 1;
    const s = W / PC_W;
    fitEl.style.width = PC_W + 'px';
    fitEl.style.height = Math.ceil(Ht / s) + 'px';
    fitEl.style.transform = `scale(${s})`;
    return s;
  }
  const Store = {
    doc: null, spDoc: null, page: null,
    fit() {
      fitPc($('#stFit'), $('#stPc'));
      const scr = $('#stDevScr');
      const h = scr.clientHeight - 28;
      if (h > 0) {
        const z = Math.min(1, h / 844);
        $('#stSpFrame').style.transform = `scale(${z})`;
        $('#stSpFrame').style.marginBottom = -(844 * (1 - z)) + 'px';
        $('#stZoom').textContent = Math.round(z * 100) + '%';
      }
    },
    async load(page = 'home', o = {}) { this.page = page; this.fit(); this.doc = await window.StoreFrame.load($('#stFrame'), page, 'pc', o); return this.doc; },
    async loadSp(page = 'home', o = {}) { this.fit(); this.spDoc = await window.StoreFrame.load($('#stSpFrame'), page, 'sp', o); return this.spDoc; },
    win(sp) { return (sp ? $('#stSpFrame') : $('#stFrame')).contentWindow; },
    async scroll(y, ms = 1200, sp = false, easing = Ease.inOut) {
      const w = this.win(sp);
      const s = w.scrollY;
      await tween(ms, (e) => w.scrollTo(0, s + (y - s) * e), easing);
    },
    yOf(el, offset = 0, sp = false) { return el.getBoundingClientRect().top + this.win(sp).scrollY - offset; },
    async scrollToEl(el, offset = 90, ms = 1200, sp = false) {
      const d = sp ? this.spDoc : this.doc;
      if (typeof el === 'string') el = d.querySelector(el);
      if (!el) return null;
      await this.scroll(this.yOf(el, offset, sp), ms, sp);
      return el;
    },
    device(on) { $('#stPage').classList.toggle('device', on); $('#dtDevice').classList.toggle('on', on); this.fit(); },
  };

  /* ===================================================================== DEVTOOLS */
  const DevTools = {
    lines: [],
    async open(on) { $('#devtools').classList.toggle('show', on); await D.realWait(320); Store.fit(); },
    tab(name) { $$('#devtools .dt-tabs > span[data-dt]').forEach((s) => s.classList.toggle('on', s.dataset.dt === name)); },
    clear() { this.lines = []; this.render(); },
    log(kind, text, src) { this.lines.push({ kind, text, src }); this.render(); },
    render() {
      this.tab('console');
      const errs = this.lines.filter((l) => l.kind === 'err').length, warns = this.lines.filter((l) => l.kind === 'warn').length;
      $('#dtErrs').innerHTML = (errs ? `<span class="e">${icon('x-circle')} ${errs}</span>` : '') + (warns ? `<span class="w">${icon('alert')} ${warns}</span>` : '');
      $('#dtCon').innerHTML = this.lines.map((l) => `<div class="dt-l ${l.kind}">${l.kind === 'err' ? icon('x-circle') : l.kind === 'warn' ? icon('alert') : '<span class="dt-i"></span>'}<span class="tx">${l.text}</span>${l.src ? `<span class="src">${esc(l.src)}</span>` : ''}</div>`).join('') +
        '<div class="dt-l prompt"><span class="dt-i">›</span><span class="caret"></span></div>';
      const c = $('#dtCon'); c.scrollTop = c.scrollHeight;
    },
    /** any other panel: raw html in the DevTools body */
    panel(name, html) { this.tab(name); $('#dtCon').innerHTML = html; },
  };

  /* ================================================================ THEME EDITOR */
  const TE = {
    dev: 'pc', doc: null, tree: [], cur: null,
    /** o = { theme, badge, page, tree: [{grp, items: [{id, name, ic, blocks: [{id, name, ic}]}]}] } */
    open(o) {
      $('#teTheme').textContent = o.theme || 'Theme';
      $('#teBadge').textContent = o.badge || '下書き';
      $('#teBadge').className = 'sa-bd' + (o.live ? ' ok' : '');
      $('#tePageName').textContent = o.page || 'ホームページ';
      $('#teSideH').textContent = o.page || 'ホームページ';
      this.tree = o.tree || [];
      this.renderTree();
      this.setSettings('', '');
      this.fit();
    },
    renderTree(o = {}) {
      $('#teTree').innerHTML = this.tree.map((g) => `<div class="te-grp">${esc(g.grp)}</div>` + g.items.map((s) => `<div class="te-it${s.id === this.cur ? ' on' : ''}${s.id === o.newId && !Clock.ff ? ' new' : ''}" data-te="${esc(s.id)}"><i data-ic="${s.ic || 'layers'}"></i>${esc(s.name)}</div>` +
        (s.open && s.blocks ? s.blocks.map((b) => `<div class="te-it blk${b.id === this.cur ? ' on' : ''}${b.id === o.newId && !Clock.ff ? ' new' : ''}" data-te="${esc(b.id)}"><i data-ic="${b.ic || 'text'}"></i>${esc(b.name)}</div>`).join('') + (s.addBlock ? `<div class="te-it blk add" data-te="${esc(s.id)}+"><i data-icon="plus"></i>ブロックを追加</div>` : '') : '')).join('') +
        (g.add ? `<div class="te-it add" data-te="${esc(g.grp)}+"><i data-icon="plus"></i>セクションを追加</div>` : '')).join('');
      hydrate($('#teTree'));
    },
    item(id) { return $(`#teTree [data-te="${CSS.escape(id)}"]`); },
    find(id) { for (const g of this.tree) for (const s of g.items) { if (s.id === id) return s; for (const b of s.blocks || []) if (b.id === id) return b; } return null; },
    async select(id, title, html) {
      await clickUi(this.item(id), { after: 60 });
      this.cur = id;
      const s = this.find(id);
      if (s && s.blocks) s.open = true;
      this.renderTree();
      this.setSettings(title || (s && s.name) || '', html || '');
      await wait(250);
    },
    setSettings(title, html) { $('#teSetH').innerHTML = esc(title); $('#teSetB').innerHTML = html; hydrate($('#teSet')); },
    fit() {
      const c = $('#teCanvas'), prev = $('#tePrev');
      if (this.dev === 'sp') {
        c.classList.add('sp');
        const h = prev.clientHeight - 24;
        const z = Math.min(1, h / 844);
        c.style.height = 844 + 'px'; c.style.transform = `translateX(-50%) scale(${z})`;
        $('#teFit').style.width = '390px'; $('#teFit').style.height = '844px'; $('#teFit').style.transform = 'none';
      } else {
        // desktop preview: the page is laid out at the preview's own width (as the real editor does), not scaled down
        c.classList.remove('sp'); c.style.height = ''; c.style.transform = '';
        const f = $('#teFit');
        f.style.width = c.clientWidth + 'px'; f.style.height = c.clientHeight + 'px'; f.style.transform = 'none';
      }
    },
    async load(page = 'home', o = {}) { this.fit(); this.doc = await window.StoreFrame.load($('#teFrame'), page, this.dev === 'sp' ? 'sp' : 'pc', o); return this.doc; },
    win() { return $('#teFrame').contentWindow; },
    async scroll(y, ms = 1000) { const w = this.win(); const s = w.scrollY; await tween(ms, (e) => w.scrollTo(0, s + (y - s) * e), Ease.inOut); },
    yOf(el, off = 0) { return el.getBoundingClientRect().top + this.win().scrollY - off; },
    /** blue outline + label over an element of the preview (follows it) */
    hl(el, label) {
      const h = $('#teHl');
      if (!el) { h.classList.remove('show'); if (this._hf) { D.frameFns.delete(this._hf); this._hf = null; } return; }
      $('b', h).textContent = label || '';
      const place = () => { const r = screenRect(el); const p = $('#tePrev').getBoundingClientRect(); h.style.left = r.left - p.left + 'px'; h.style.top = r.top - p.top + 'px'; h.style.width = r.width + 'px'; h.style.height = r.height + 'px'; };
      place();
      h.classList.add('show');
      if (!this._hf) { this._hf = place; D.frameFns.add(place); } else { D.frameFns.delete(this._hf); this._hf = place; D.frameFns.add(place); }
    },
    async save() { await clickUi('#teSave', { after: 60 }); await Admin.busy('#teSave', 700); },
  };

  window.addEventListener('resize', () => { Store.fit(); TE.fit(); });

  /*
   * The editor draws only the rows that fit above its panel (a row further down may still be in the page, under the
   * terminal). When the pointer is to go to such a row, the editor scrolls to it first — as a person scrolls the
   * editor before pointing at a line. The rows are drawn anew: the pointer aims at the new one.
   */
  if (D.revealers) D.revealers.push(async (el) => {
    const box = $('#vsLines');
    const line = el.closest && el.closest('.vs-line');
    if (!line || !box || !box.contains(line) || !Code.active) return null;
    const i = +line.dataset.l;
    const rows = Code.rows();
    if (i >= Math.ceil(Code.top) && i <= Math.floor(Code.top) + rows - 2) return null;
    await Code.scrollTo(Math.max(0, i - Math.floor(rows / 3)), 600);
    return Code.lineEl(i) || el;
  });

  /* ====================================================================== runner */
  const readHold = (ms) => wait(ms * Math.max(1, Clock.speed));
  /** the title card scene */
  async function introScene() {
    const intro = $('#intro');
    intro.classList.remove('hide');
    intro.classList.add('play');
    const items = $$('.intro-steps li');
    for (let i = 0; i < items.length; i++) { await wait(360); items[i].classList.add('ok'); }
    await wait(2200);
    intro.classList.add('hide');
    await wait(900);
  }
  /** warm the image / font cache with the captured storefront once (hidden frames) */
  async function warmStore(pages = ['home']) {
    const S = window.SITE_SNAPSHOT;
    if (!S) return;
    for (const p of pages) {
      for (const view of ['pc', 'sp']) {
        if (!S.pages[p] || !S.pages[p][view]) continue;
        const f = document.createElement('iframe');
        f.style.cssText = `position:fixed;left:-4000px;top:0;width:${view === 'pc' ? 1920 : 390}px;height:${view === 'pc' ? 950 : 844}px;visibility:hidden`;
        document.body.appendChild(f);
        const doc = await window.StoreFrame.load(f, p, view, { noHold: true });
        await Promise.race([Promise.all([...doc.images].map((i) => (i.decode ? i.decode().catch(() => {}) : null))), new Promise((r) => setTimeout(r, 12000))]);
        f.remove();
      }
    }
  }
  /**
   * cfg: { scenes: [{name, fn}], prepare?(fast), warm?: ['home', 'product'], fontText?: '' }
   */
  function run(cfg) {
    window.Stage.run({
      scenes: cfg.scenes,
      async prepare(fast) {
        const intro = $('#intro');
        intro.classList.add('hide');
        intro.style.transition = 'none';
        hydrate();
        Cursor.init();
        if (window.SITE_SNAPSHOT && window.SITE_SNAPSHOT.favicon) FAV.store = FI(window.SITE_SNAPSHOT.favicon);
        if (cfg.prepare) await cfg.prepare(fast);
        const txt = document.body.textContent + (cfg.fontText || '');
        try { await Promise.race([Promise.all(['400 14px "Noto Sans JP"', '700 14px "Noto Sans JP"'].map((f) => document.fonts.load(f, [...new Set(txt)].join('')))), new Promise((r) => setTimeout(r, 8000))]); } catch (e) {}
        if (!fast && cfg.warm !== false) await warmStore(cfg.warm || ['home']);
        await new Promise((r) => setTimeout(r, 50));
        intro.style.transition = '';
        intro.classList.remove('hide');
      },
      onStart() { $('#hint').style.transition = 'none'; $('#hint').classList.add('hide'); if (cfg.onStart) cfg.onStart(); },
      afterSeek() { if (KeyStrip.visible()) KeyStrip.idleHide(400); if (cfg.afterSeek) cfg.afterSeek(); },
    });
  }

  window.Kit = { V, ic, svg, hydrate, Hi, Code, Term, indentAfter, codeScript, Browser, Admin, H, Store, DevTools, TE, FileDialog, typeInput, choose, readHold, introScene, warmStore, run, fileIcon, LH, ADMIN };
})();
