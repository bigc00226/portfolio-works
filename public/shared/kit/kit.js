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
  const LANG = { liquid: 'liquid', twig: 'twig', html: 'html', php: 'php', css: 'css', scss: 'css', js: 'js', mjs: 'js', cjs: 'js', ts: 'js', jsx: 'js', tsx: 'js', json: 'json', csv: 'csv', tsv: 'csv', yml: 'yaml', yaml: 'yaml', toml: 'toml', md: 'md', env: 'env', graphql: 'gql', gql: 'gql', sh: 'sh', txt: 'txt' };
  const langOf = (p) => { const n = p.split('/').pop(); if (n.startsWith('.env')) return 'env'; return LANG[n.split('.').pop()] || 'txt'; };
  const LANG_NAME = { liquid: 'Liquid', twig: 'Twig', html: 'HTML', php: 'PHP', css: 'CSS', js: 'JavaScript', json: 'JSON', csv: 'CSV', yaml: 'YAML', toml: 'TOML', md: 'Markdown', env: 'Properties', gql: 'GraphQL', sh: 'Shell Script', txt: 'Plain Text' };
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
  /** Twig (EC-CUBE's templates): the same {{ }} / {% %} tags as Liquid, with Twig's own words (tests, operators, tags) */
  const TW_RE = /("[^"]*"?|'[^']*'?)|\b(if|elseif|else|endif|for|endfor|in|block|endblock|extends|include|embed|endembed|use|set|endset|macro|endmacro|import|from|with|only|ignore|missing|filter|endfilter|apply|endapply|autoescape|endautoescape|spaceless|endspaceless|verbatim|endverbatim|do|is|not|and|or|matches|starts|ends|defined|empty|iterable|null|none|same|as|loop|true|false|form_theme|trans|endtrans)\b|(\|\s*)([a-z_]+)|\b(\d+(?:\.\d+)?)\b|([A-Za-z_]\w*)|([.[\]:,=<>!?~+*/%-]+)/g;
  let INNER_RE = LQ_RE;
  function liquidInner(s, out) {
    const RE = INNER_RE;
    let last = 0, m;
    RE.lastIndex = 0;
    while ((m = RE.exec(s))) {
      if (m.index > last) out.push([s.slice(last, m.index), '']);
      if (m[1]) out.push([m[1], 't-str']);
      else if (m[2]) out.push([m[2], 't-lq']);
      else if (m[4]) { out.push([m[3], 't-lqd']); out.push([m[4], 't-lqf']); }
      else if (m[5]) out.push([m[5], 't-num']);
      else if (m[6]) out.push([m[6], 't-lqv']);
      else out.push([m[0], 't-pun']);
      last = RE.lastIndex;
      if (m[0] === '') RE.lastIndex++;
    }
    if (last < s.length) out.push([s.slice(last), '']);
  }
  /** text that may contain {{ }} / {% %}: liquid inside, `plain(text, out)` outside */
  function withLiquid(s, out, plain) {
    let i = 0;
    while (i < s.length) {
      // Twig's {# comments #}
      const c = INNER_RE === TW_RE ? s.indexOf('{#', i) : -1;
      if (c >= 0 && [s.indexOf('{{', i), s.indexOf('{%', i)].every((x) => x < 0 || c < x)) {
        if (c > i) plain(s.slice(i, c), out);
        const e = s.indexOf('#}', c + 2);
        const end = e < 0 ? s.length : e + 2;
        out.push([s.slice(c, end), 't-com']);
        i = end;
        continue;
      }
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
    INNER_RE = lang === 'twig' ? TW_RE : LQ_RE;
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
      } else if (lang === 'twig') htmlTokens(s, st, out, true);
      else if (lang === 'html') htmlTokens(s, st, out, false);
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
      $('#vsPos').textContent = '行 1、列 1';
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
      if (this.ins) $('#vsPos').textContent = `行 ${this.ins.line + 1}、列 ${this.ins.col + 1}`;
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
  /*
   * Polaris icons (@shopify/polaris-icons 9.3.1, MIT — the same files the admin and help.shopify.com use:
   * cdn.shopify.com/shopifycloud/help-center/manual/admin-icons/<Name>.svg is byte-identical), 20 × 20, filled with currentColor.
   */
  const PI = {
    home: '<path fill-rule="evenodd" d="M8.344 3.692a2.25 2.25 0 0 1 3.312 0l3.854 4.19a3.75 3.75 0 0 1 .99 2.538v3.33a2.75 2.75 0 0 1-2.75 2.75h-1.75a1.5 1.5 0 0 1-1.5-1.5v-2h-1v2a1.5 1.5 0 0 1-1.5 1.5h-1.75a2.75 2.75 0 0 1-2.75-2.75v-3.33c0-.94.353-1.847.99-2.539l3.854-4.189Zm2.208 1.016a.75.75 0 0 0-1.104 0l-3.854 4.189a2.25 2.25 0 0 0-.594 1.523v3.33c0 .69.56 1.25 1.25 1.25h1.75v-2a1.5 1.5 0 0 1 1.5-1.5h1a1.5 1.5 0 0 1 1.5 1.5v2h1.75c.69 0 1.25-.56 1.25-1.25v-3.33a2.25 2.25 0 0 0-.594-1.523l-3.854-4.19Z"/>',
    homeFilled: '<path d="M14 16h-2a1 1 0 0 1-1-1v-2.5a.5.5 0 0 0-.5-.5h-1a.5.5 0 0 0-.5.5v2.5a1 1 0 0 1-1 1h-2a2 2 0 0 1-2-2v-4.257a3 3 0 0 1 .879-2.122l3.707-3.707a2 2 0 0 1 2.828 0l3.707 3.707a3 3 0 0 1 .879 2.122v4.257a2 2 0 0 1-2 2Z"/>',
    order: '<path fill-rule="evenodd" d="M6.976 3.5a2.75 2.75 0 0 0-2.72 2.347l-.662 4.46a8.75 8.75 0 0 0-.094 1.282v1.661a3.25 3.25 0 0 0 3.25 3.25h6.5a3.25 3.25 0 0 0 3.25-3.25v-1.66c0-.43-.032-.858-.095-1.283l-.66-4.46a2.75 2.75 0 0 0-2.72-2.347h-6.05Zm-1.237 2.567a1.25 1.25 0 0 1 1.237-1.067h6.048c.62 0 1.146.454 1.237 1.067l.583 3.933h-2.484a1.25 1.25 0 0 0-1.185.855l-.159.474a.25.25 0 0 1-.237.171h-1.558a.25.25 0 0 1-.237-.17l-.159-.475a1.25 1.25 0 0 0-1.185-.855h-2.484l.583-3.933Zm-.738 5.433-.001.09v1.66c0 .966.784 1.75 1.75 1.75h6.5a1.75 1.75 0 0 0 1.75-1.75v-1.75h-2.46l-.1.303a1.75 1.75 0 0 1-1.66 1.197h-1.56a1.75 1.75 0 0 1-1.66-1.197l-.1-.303h-2.46Z"/>',
    orderFilled: '<path fill-rule="evenodd" d="M4.255 5.847a2.75 2.75 0 0 1 2.72-2.347h6.05a2.75 2.75 0 0 1 2.72 2.347l.66 4.46c.063.425.095.853.095 1.282v1.661a3.25 3.25 0 0 1-3.25 3.25h-6.5a3.25 3.25 0 0 1-3.25-3.25v-1.66c0-.43.032-.858.094-1.283l.661-4.46Zm2.72-.847a1.25 1.25 0 0 0-1.236 1.067l-.583 3.933h2.484a1.25 1.25 0 0 1 1.185.855l.159.474a.25.25 0 0 0 .237.171h1.558a.25.25 0 0 0 .237-.17l.159-.475a1.25 1.25 0 0 1 1.185-.855h2.484l-.583-3.933a1.25 1.25 0 0 0-1.236-1.067h-6.05Z"/>',
    product: '<path d="M13 8a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z"/><path fill-rule="evenodd" d="M11.276 3.5a3.75 3.75 0 0 0-2.701 1.149l-4.254 4.417a2.75 2.75 0 0 0 .036 3.852l2.898 2.898a2.5 2.5 0 0 0 3.502.033l4.747-4.571a3.25 3.25 0 0 0 .996-2.341v-2.187a3.25 3.25 0 0 0-3.25-3.25h-1.974Zm-1.62 2.19a2.25 2.25 0 0 1 1.62-.69h1.974c.966 0 1.75.784 1.75 1.75v2.187c0 .475-.194.93-.536 1.26l-4.747 4.572a1 1 0 0 1-1.401-.014l-2.898-2.898a1.25 1.25 0 0 1-.016-1.75l4.253-4.418Z"/>',
    productFilled: '<path fill-rule="evenodd" d="M8.575 4.649a3.75 3.75 0 0 1 2.7-1.149h1.975a3.25 3.25 0 0 1 3.25 3.25v2.187a3.25 3.25 0 0 1-.996 2.34l-4.747 4.572a2.5 2.5 0 0 1-3.502-.033l-2.898-2.898a2.75 2.75 0 0 1-.036-3.852l4.254-4.417Zm4.425 3.351a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z"/>',
    person: '<path fill-rule="evenodd" d="M10 3a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Zm-2 3.5a2 2 0 1 1 4 0 2 2 0 0 1-4 0Z"/><path fill-rule="evenodd" d="M15.484 14.227a6.274 6.274 0 0 0-10.968 0l-.437.786a1.338 1.338 0 0 0 1.17 1.987h9.502a1.338 1.338 0 0 0 1.17-1.987l-.437-.786Zm-9.657.728a4.773 4.773 0 0 1 8.346 0l.302.545h-8.95l.302-.545Z"/>',
    personFilled: '<path d="M10 9.75a3.25 3.25 0 1 0 0-6.5 3.25 3.25 0 0 0 0 6.5Z"/><path d="M10 11.5c-1.968 0-3.815.95-4.959 2.552l-.561.786a1.05 1.05 0 0 0 .855 1.662h9.33a1.05 1.05 0 0 0 .855-1.662l-.561-.786a6.094 6.094 0 0 0-4.959-2.552Z"/>',
    gauge: '<path d="M4.5 11.5a5.5 5.5 0 0 1 7.434-5.15l.456-.981a1.5 1.5 0 0 1 .234-.36 7 7 0 0 0-8.766 9.852.75.75 0 0 0 1.315-.722 5.472 5.472 0 0 1-.673-2.639Z"/><path d="m15.084 6.689-.695 1.496a5.475 5.475 0 0 1 1.111 3.315c0 .958-.244 1.857-.673 2.64a.75.75 0 1 0 1.315.72 6.972 6.972 0 0 0 .858-3.36 6.976 6.976 0 0 0-1.916-4.811Z"/><path fill-rule="evenodd" d="M10 16a2 2 0 0 0 1.485-3.34l2.945-6.344a.75.75 0 1 0-1.36-.632l-2.935 6.32a2 2 0 1 0-.135 3.995Zm0-1.5a.5.5 0 1 0 0-1 .5.5 0 0 0 0 1Z"/>',
    discount: '<path d="M12.78 8.28a.75.75 0 0 0-1.06-1.06l-4.5 4.5a.75.75 0 1 0 1.06 1.06l4.5-4.5Z"/><path d="M9 8a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z"/><path d="M12 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z"/><path fill-rule="evenodd" d="M12.094 3.514c-.822-1.79-3.366-1.79-4.188 0a.804.804 0 0 1-1.011.42c-1.848-.686-3.647 1.113-2.962 2.96a.804.804 0 0 1-.419 1.012c-1.79.822-1.79 3.366 0 4.188a.805.805 0 0 1 .42 1.011c-.686 1.848 1.113 3.647 2.96 2.962a.805.805 0 0 1 1.012.419c.822 1.79 3.366 1.79 4.188 0a.805.805 0 0 1 1.011-.42c1.848.686 3.647-1.113 2.962-2.96a.805.805 0 0 1 .419-1.012c1.79-.822 1.79-3.366 0-4.188a.805.805 0 0 1-.42-1.011c.686-1.848-1.113-3.647-2.96-2.962a.805.805 0 0 1-1.012-.419Zm-2.825.626a.804.804 0 0 1 1.462 0 2.304 2.304 0 0 0 2.896 1.2.804.804 0 0 1 1.034 1.034 2.304 2.304 0 0 0 1.199 2.895.804.804 0 0 1 0 1.462 2.304 2.304 0 0 0-1.2 2.896.805.805 0 0 1-1.034 1.034 2.304 2.304 0 0 0-2.895 1.199.804.804 0 0 1-1.462 0 2.304 2.304 0 0 0-2.896-1.2.804.804 0 0 1-1.033-1.034 2.305 2.305 0 0 0-1.2-2.895.804.804 0 0 1 0-1.462 2.304 2.304 0 0 0 1.2-2.896.804.804 0 0 1 1.033-1.033 2.304 2.304 0 0 0 2.896-1.2Z"/>',
    discountFilled: '<path fill-rule="evenodd" d="M11.527 3.327c-.6-1.306-2.455-1.306-3.054 0a1.68 1.68 0 0 1-2.112.874c-1.347-.5-2.66.813-2.16 2.16a1.68 1.68 0 0 1-.874 2.112c-1.306.6-1.306 2.455 0 3.054a1.68 1.68 0 0 1 .874 2.112c-.5 1.347.813 2.659 2.16 2.16a1.68 1.68 0 0 1 2.112.874c.6 1.306 2.455 1.306 3.054 0a1.68 1.68 0 0 1 2.112-.874c1.347.499 2.66-.813 2.16-2.16a1.68 1.68 0 0 1 .874-2.112c1.306-.6 1.306-2.455 0-3.054a1.68 1.68 0 0 1-.874-2.112c.5-1.347-.813-2.66-2.16-2.16a1.68 1.68 0 0 1-2.112-.874Zm-2.527 4.923a1 1 0 1 1-2 0 1 1 0 0 1 2 0Zm3.53.53-4 4a.75.75 0 1 1-1.06-1.06l4-4a.75.75 0 1 1 1.06 1.06Zm.47 3.47a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z"/>',
    content: '<path d="M12 8a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z"/><path fill-rule="evenodd" d="M7.42 3.5h5.16c.535 0 .98 0 1.345.03.38.03.736.098 1.073.27a2.75 2.75 0 0 1 1.202 1.202c.172.337.24.693.27 1.073.03.365.03.81.03 1.345v1.91c0 .535 0 .98-.03 1.345-.03.38-.098.736-.27 1.073a2.751 2.751 0 0 1-1.201 1.202c-.338.172-.694.24-1.074.27-.365.03-.81.03-1.345.03h-5.16c-.535 0-.98 0-1.345-.03-.38-.03-.736-.098-1.073-.27a2.75 2.75 0 0 1-1.202-1.201c-.172-.338-.24-.694-.27-1.074-.03-.365-.03-.81-.03-1.345v-1.91c0-.535 0-.98.03-1.345.03-.38.098-.736.27-1.073a2.75 2.75 0 0 1 1.202-1.202c.337-.172.693-.24 1.073-.27.365-.03.81-.03 1.345-.03Zm-1.223 1.525c-.287.023-.424.065-.514.111a1.25 1.25 0 0 0-.547.547c-.046.09-.088.227-.111.514-.024.296-.025.68-.025 1.253v1.548l.908-1.073a1.75 1.75 0 0 1 2.68.01l2.412 2.894 1.086-1.304a1.75 1.75 0 0 1 2.778.116l.135.192.001-.533v-1.85c0-.572 0-.957-.025-1.253-.023-.287-.065-.424-.111-.514a1.25 1.25 0 0 0-.546-.547c-.091-.046-.228-.088-.515-.111-.296-.024-.68-.025-1.253-.025h-5.1c-.572 0-.957 0-1.253.025Zm-.514 6.589a1.25 1.25 0 0 1-.516-.49l1.886-2.23a.25.25 0 0 1 .383.001l2.38 2.855h-2.366c-.572 0-.957 0-1.253-.025-.287-.023-.424-.065-.514-.111Zm6.867.136h-.365l1.054-1.265a.25.25 0 0 1 .397.017l.751 1.073a1.274 1.274 0 0 1-.07.039c-.09.046-.227.088-.514.111-.296.024-.68.025-1.253.025Z"/><path d="M4 15.75a.75.75 0 0 1 .75-.75h5.5a.75.75 0 0 1 0 1.5h-5.5a.75.75 0 0 1-.75-.75Z"/><path d="M12.75 15a.75.75 0 0 0 0 1.5h2.5a.75.75 0 0 0 0-1.5h-2.5Z"/>',
    contentFilled: '<path d="M12 8a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z"/><path fill-rule="evenodd" d="M7.42 3.5h5.16c.535 0 .98 0 1.345.03.38.03.736.098 1.073.27a2.75 2.75 0 0 1 1.202 1.202c.172.337.24.693.27 1.073.03.365.03.81.03 1.345v1.91c0 .535 0 .98-.03 1.345-.03.38-.098.736-.27 1.073a2.751 2.751 0 0 1-1.201 1.202c-.338.172-.694.24-1.074.27a6.052 6.052 0 0 1-.288.017.744.744 0 0 1-.137.013h-6.08c-.535 0-.98 0-1.345-.03-.38-.03-.736-.098-1.073-.27a2.75 2.75 0 0 1-1.047-.934.75.75 0 0 1-.176-.31c-.157-.324-.22-.667-.25-1.031-.029-.365-.029-.81-.029-1.345v-1.91c0-.535 0-.98.03-1.345.03-.38.098-.736.27-1.073a2.75 2.75 0 0 1 1.202-1.202c.337-.172.693-.24 1.073-.27.365-.03.81-.03 1.345-.03Zm7.58 5.8-.001.533-.135-.192a1.75 1.75 0 0 0-2.778-.116l-1.086 1.303-2.411-2.893a1.75 1.75 0 0 0-2.68-.01l-.909 1.073v-1.548c0-.572 0-.957.025-1.253.023-.287.065-.424.111-.514a1.25 1.25 0 0 1 .547-.547c.09-.046.227-.088.514-.111.296-.024.68-.025 1.253-.025h5.1c.572 0 .957 0 1.252.025.288.023.425.065.516.111.235.12.426.311.546.547.046.09.088.227.111.514.024.296.025.68.025 1.253v1.85Z"/><path d="M4 15.75a.75.75 0 0 1 .75-.75h5.5a.75.75 0 0 1 0 1.5h-5.5a.75.75 0 0 1-.75-.75Z"/><path d="M12.75 15a.75.75 0 0 0 0 1.5h2.5a.75.75 0 0 0 0-1.5h-2.5Z"/>',
    marketsYen: '<path fill-rule="evenodd" d="M3 10a7 7 0 0 1 13.45-2.724 1.742 1.742 0 0 0-.852.407l-.848.742-.794-.695c-.02-.029.02.028 0 0l-.191-.156a1.75 1.75 0 0 0-2.62 2.124 1.75 1.75 0 0 1-.426.052h-.184a.25.25 0 0 0-.208.111l-.374.562a1.857 1.857 0 0 1-3.36-.637 1.75 1.75 0 0 1-2.089.432 5.491 5.491 0 0 0 2.126 4.13.776.776 0 0 1 .065-.033l1.956-.87a.487.487 0 0 0 .192-.153 2.606 2.606 0 0 1 2.085-1.042h.144a1.749 1.749 0 0 0 .242 1.5h-.386c-.348 0-.676.164-.885.442a1.987 1.987 0 0 1-.783.624l-.946.42a5.497 5.497 0 0 0 2.732.165 1.75 1.75 0 0 0 1.132 1.253 7 7 0 0 1-9.178-6.654Zm7-5.5a5.502 5.502 0 0 0-5.31 4.06l.439.291a.25.25 0 0 0 .339-.058l.262-.35c.648-.864 2.013-.554 2.224.505l.103.515a.357.357 0 0 0 .648.128l.374-.562a1.75 1.75 0 0 1 1.456-.779h.184a.25.25 0 0 0 .243-.19l.121-.484a1.75 1.75 0 0 1 1.698-1.326h.219a.25.25 0 0 0 .25-.25v-.438a5.475 5.475 0 0 0-3.25-1.062Z"/><path d="M12.186 8.506a.75.75 0 0 1 1.058-.07l1.506 1.317 1.506-1.317a.75.75 0 0 1 .988 1.128l-1.744 1.526v.91h1.25a.75.75 0 0 1 0 1.5h-1.25v.75h1.25a.75.75 0 0 1 0 1.5h-1.25v.5a.75.75 0 0 1-1.5 0v-.5h-1.25a.75.75 0 0 1 0-1.5h1.25v-.75h-1.25a.75.75 0 0 1 0-1.5h1.25v-.91l-1.744-1.526a.75.75 0 0 1-.07-1.058Z"/>',
    marketsYenFilled: '<path d="M10 3a7 7 0 1 0 2.178 13.654 1.753 1.753 0 0 1-1.132-1.253 5.522 5.522 0 0 1-3.232-.352l1.294-.576c.251-.111.47-.286.635-.506.28-.373.719-.592 1.185-.592h.187a1.75 1.75 0 0 1 1.3-2.343l-.817-.715a1.749 1.749 0 0 1-.57-1.634.748.748 0 0 1-.309.067h-.184a1.25 1.25 0 0 0-1.04.557l-.374.561a.857.857 0 0 1-1.554-.307l-.103-.515a.75.75 0 0 0-1.334-.303l-.262.35a.75.75 0 0 1-1.016.174l-.276-.183a5.502 5.502 0 0 1 9.174-3.107v.023a.75.75 0 0 1-.75.75h-.22c-.277 0-.538.092-.75.25h-.03l-.008.03a1.248 1.248 0 0 0-.424.667l-.004.016a1.75 1.75 0 0 1 2.19-.146l.006.004c.05.035.097.072.142.112l.848.742.848-.742a1.758 1.758 0 0 1 .852-.407 7.026 7.026 0 0 0-2.7-3.188 6.967 6.967 0 0 0-3.75-1.088Z"/><path d="M12.186 8.506a.75.75 0 0 1 1.058-.07l1.506 1.317 1.506-1.317a.75.75 0 0 1 .988 1.128l-1.744 1.526v.91h1.25a.75.75 0 0 1 0 1.5h-1.25v.75h1.25a.75.75 0 0 1 0 1.5h-1.25v.5a.75.75 0 0 1-1.5 0v-.5h-1.25a.75.75 0 0 1 0-1.5h1.25v-.75h-1.25a.75.75 0 0 1 0-1.5h1.25v-.91l-1.744-1.526a.75.75 0 0 1-.07-1.058Z"/>',
    chartVertical: '<path fill-rule="evenodd" d="M9.952 3.5h.096c.182 0 .371 0 .543.034a1.75 1.75 0 0 1 1.375 1.375c.035.172.034.361.034.543v9.096c0 .182 0 .371-.034.543a1.75 1.75 0 0 1-1.375 1.376 2.825 2.825 0 0 1-.543.033h-.096c-.182 0-.371 0-.543-.034a1.75 1.75 0 0 1-1.375-1.375 2.824 2.824 0 0 1-.034-.543v-9.096c0-.182 0-.371.034-.543a1.75 1.75 0 0 1 1.375-1.375c.172-.035.361-.034.543-.034Zm-.253 1.505a.25.25 0 0 0-.194.194 8.217 8.217 0 0 0-.005.3v9.001a8.221 8.221 0 0 0 .005.3.25.25 0 0 0 .194.195l.053.003c.055.002.127.002.248.002s.193 0 .248-.002l.053-.003a.25.25 0 0 0 .194-.194l.003-.053a8.05 8.05 0 0 0 .002-.248v-9a8.046 8.046 0 0 0-.005-.3.25.25 0 0 0-.194-.195 8.217 8.217 0 0 0-.3-.005 8.216 8.216 0 0 0-.302.005Z"/><path fill-rule="evenodd" d="M5.452 9h.096c.182 0 .371 0 .543.034a1.75 1.75 0 0 1 1.375 1.375c.035.172.034.361.034.543v3.596c0 .182 0 .371-.034.543a1.75 1.75 0 0 1-1.375 1.376 2.825 2.825 0 0 1-.543.033h-.096c-.182 0-.371 0-.543-.034a1.75 1.75 0 0 1-1.375-1.375 2.824 2.824 0 0 1-.034-.543v-3.596c0-.182 0-.371.034-.543a1.75 1.75 0 0 1 1.375-1.375c.172-.035.361-.034.543-.034Zm-.253 1.505a.25.25 0 0 0-.194.194 8.217 8.217 0 0 0-.005.3v3.501a8.221 8.221 0 0 0 .005.3.25.25 0 0 0 .194.195l.053.003c.055.002.127.002.248.002s.193 0 .248-.002l.053-.003a.25.25 0 0 0 .194-.194l.003-.053c.002-.054.002-.127.002-.248v-3.5a8.208 8.208 0 0 0-.005-.3.25.25 0 0 0-.194-.195 8.045 8.045 0 0 0-.3-.005 8.045 8.045 0 0 0-.302.005Z"/><path fill-rule="evenodd" d="M14.5 6h-.048c-.182 0-.371 0-.543.034a1.75 1.75 0 0 0-1.375 1.375 2.825 2.825 0 0 0-.034.543v6.596c0 .182 0 .371.034.543a1.75 1.75 0 0 0 1.375 1.376c.172.034.361.033.543.033h.096c.182 0 .371 0 .543-.034a1.75 1.75 0 0 0 1.375-1.375c.035-.172.034-.36.034-.543v-6.596c0-.182 0-.371-.034-.543a1.75 1.75 0 0 0-1.375-1.375c-.172-.035-.361-.034-.543-.034h-.048Zm-.495 1.7a.25.25 0 0 1 .194-.195 8.221 8.221 0 0 1 .3-.005 8.217 8.217 0 0 1 .302.005.25.25 0 0 1 .194.194l.003.053c.002.055.002.127.002.248v6.5a8.05 8.05 0 0 1-.005.3.25.25 0 0 1-.194.195l-.053.003a8.046 8.046 0 0 1-.248.002c-.121 0-.193 0-.248-.002l-.053-.003a.25.25 0 0 1-.194-.194l-.003-.053a8.05 8.05 0 0 1-.002-.248v-6.5c0-.121 0-.193.002-.248l.003-.053v.002-.002Z"/>',
    chartVerticalFilled: '<path d="M9.971 4c-.204 0-.344 0-.465.024a1.25 1.25 0 0 0-.982.982c-.024.121-.024.26-.024.465v9.058c0 .204 0 .344.024.465.099.496.486.883.982.982a2.5 2.5 0 0 0 .465.024h.058c.204 0 .344 0 .465-.024a1.25 1.25 0 0 0 .982-.982 2.5 2.5 0 0 0 .024-.465v-9.058c0-.204 0-.344-.024-.465a1.25 1.25 0 0 0-.982-.982 2.504 2.504 0 0 0-.465-.024h-.058Z"/><path d="M5.471 9.5c-.204 0-.344 0-.465.024a1.25 1.25 0 0 0-.982.982c-.024.121-.024.26-.024.465v3.558c0 .204 0 .344.024.465.099.496.486.883.982.982a2.5 2.5 0 0 0 .465.024h.058c.204 0 .344 0 .465-.024a1.25 1.25 0 0 0 .982-.982c.024-.121.024-.26.024-.465v-3.558c0-.204 0-.344-.024-.465a1.25 1.25 0 0 0-.982-.982 2.503 2.503 0 0 0-.465-.024h-.058Z"/><path d="M14.471 6.5c-.204 0-.344 0-.465.024a1.25 1.25 0 0 0-.982.982c-.024.121-.024.26-.024.465v6.558c0 .204 0 .344.024.465.099.496.486.883.982.982.121.024.26.024.465.024h.058c.204 0 .344 0 .465-.024a1.25 1.25 0 0 0 .982-.982c.024-.121.024-.26.024-.465v-6.558c0-.204 0-.344-.024-.465a1.25 1.25 0 0 0-.982-.982 2.504 2.504 0 0 0-.465-.024h-.058Z"/>',
    settings: '<path fill-rule="evenodd" d="M12.5 10a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0Zm-1.5 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z"/><path fill-rule="evenodd" d="M9.377 2.5c-.926 0-1.676.75-1.676 1.676v.688c0 .056-.043.17-.198.251-.153.08-.303.168-.448.262-.147.097-.268.076-.318.048l-.6-.346a1.676 1.676 0 0 0-2.29.613l-.622 1.08a1.676 1.676 0 0 0 .613 2.289l.648.374c.048.028.124.12.119.29a5.484 5.484 0 0 0 .005.465c.009.175-.07.27-.119.299l-.653.377a1.676 1.676 0 0 0-.613 2.29l.623 1.08a1.676 1.676 0 0 0 2.29.613l.7-.405c.048-.028.166-.048.312.043.115.071.233.139.353.202.155.08.198.195.198.251v.811c0 .926.75 1.676 1.676 1.676h1.246c.926 0 1.676-.75 1.676-1.676v-.81c0-.057.042-.171.197-.252.121-.063.239-.13.354-.202.146-.091.264-.07.312-.043l.7.405a1.676 1.676 0 0 0 2.29-.614l.623-1.08a1.676 1.676 0 0 0-.613-2.289l-.653-.377c-.05-.029-.128-.123-.119-.3a5.494 5.494 0 0 0 .005-.463c-.005-.171.07-.263.12-.291l.647-.374a1.676 1.676 0 0 0 .613-2.29l-.623-1.079a1.676 1.676 0 0 0-2.29-.613l-.6.346c-.049.028-.17.048-.318-.048a5.4 5.4 0 0 0-.448-.262c-.155-.081-.197-.195-.197-.251v-.688c0-.926-.75-1.676-1.676-1.676h-1.246Zm-.176 1.676c0-.097.078-.176.176-.176h1.246c.097 0 .176.079.176.176v.688c0 .728.462 1.298 1.003 1.58.11.058.219.122.323.19.517.337 1.25.458 1.888.09l.6-.346a.176.176 0 0 1 .24.064l.623 1.08a.176.176 0 0 1-.064.24l-.648.374c-.623.36-.888 1.034-.868 1.638a4.184 4.184 0 0 1-.004.337c-.032.615.23 1.31.867 1.677l.653.377a.176.176 0 0 1 .064.24l-.623 1.08a.176.176 0 0 1-.24.065l-.701-.405c-.624-.36-1.341-.251-1.855.069a3.91 3.91 0 0 1-.255.145c-.54.283-1.003.853-1.003 1.581v.811a.176.176 0 0 1-.176.176h-1.246a.176.176 0 0 1-.176-.176v-.81c0-.73-.462-1.3-1.003-1.582a3.873 3.873 0 0 1-.255-.146c-.514-.32-1.23-.428-1.855-.068l-.7.405a.176.176 0 0 1-.241-.065l-.623-1.08a.176.176 0 0 1 .064-.24l.653-.377c.637-.368.899-1.062.867-1.677a3.97 3.97 0 0 1-.004-.337c.02-.604-.245-1.278-.868-1.638l-.648-.374a.176.176 0 0 1-.064-.24l.623-1.08a.176.176 0 0 1 .24-.064l.6.346c.638.368 1.37.247 1.888-.09a3.85 3.85 0 0 1 .323-.19c.54-.282 1.003-.852 1.003-1.58v-.688Z"/>',
    settingsFilled: '<path fill-rule="evenodd" d="M8.013 4.389c0-.767.621-1.389 1.389-1.389h1.196c.767 0 1.39.622 1.39 1.389v.66c0 .153.101.33.307.436.141.074.278.155.411.241.196.128.402.13.536.052l.576-.332a1.389 1.389 0 0 1 1.897.508l.599 1.037a1.39 1.39 0 0 1-.509 1.897l-.621.359c-.131.075-.232.249-.225.477a5.135 5.135 0 0 1-.004.427c-.012.233.09.412.223.489l.627.362c.665.384.892 1.233.509 1.897l-.599 1.037a1.39 1.39 0 0 1-1.897.508l-.672-.388c-.132-.076-.332-.076-.526.045a4.928 4.928 0 0 1-.325.185c-.206.108-.308.284-.308.437v.778a1.39 1.39 0 0 1-1.389 1.39h-1.196a1.389 1.389 0 0 1-1.39-1.39v-.778c0-.153-.102-.33-.307-.437a4.96 4.96 0 0 1-.325-.185c-.194-.121-.395-.12-.526-.045l-.672.388a1.39 1.39 0 0 1-1.898-.508l-.598-1.037a1.389 1.389 0 0 1 .509-1.897l.627-.362c.133-.077.235-.256.223-.49a5.03 5.03 0 0 1-.004-.426c.007-.228-.094-.401-.225-.477l-.621-.359a1.389 1.389 0 0 1-.509-1.897l.598-1.037a1.389 1.389 0 0 1 1.898-.508l.576.332c.133.078.34.076.535-.052a4.81 4.81 0 0 1 .412-.24c.205-.108.308-.284.308-.437v-.66Zm1.987 7.611a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z"/>',
    store: '<path fill-rule="evenodd" d="M13.257 3h-6.514a1.25 1.25 0 0 0-.983.478l-2.386 3.037a1.75 1.75 0 0 0-.374 1.08v.655a2.75 2.75 0 0 0 1.5 2.45v4.55c0 .966.784 1.75 1.75 1.75h7.5a1.75 1.75 0 0 0 1.75-1.75v-4.55a2.75 2.75 0 0 0 1.5-2.45v-.481c0-.504-.17-.994-.48-1.39l-2.28-2.901a1.25 1.25 0 0 0-.983-.478Zm-.257 12.5h.75a.25.25 0 0 0 .25-.25v-4.25a2.742 2.742 0 0 1-2-.863 2.742 2.742 0 0 1-2 .863 2.742 2.742 0 0 1-2-.863 2.742 2.742 0 0 1-2 .863v4.25c0 .138.112.25.25.25h3.75v-2.5a1 1 0 0 1 1-1h1a1 1 0 0 1 1 1v2.5Zm-7-6h-.25c-.69 0-1.25-.56-1.25-1.25v-.654a.25.25 0 0 1 .053-.155l2.312-2.941h6.27l2.205 2.805a.75.75 0 0 1 .16.464v.481c0 .69-.56 1.25-1.25 1.25h-.25c-.69 0-1.25-.56-1.25-1.25v-.5a.75.75 0 0 0-1.5 0v.5a1.25 1.25 0 1 1-2.5 0v-.5a.75.75 0 0 0-1.5 0v.5c0 .69-.56 1.25-1.25 1.25Z"/>',
    plusCircle: '<path d="M6.25 10a.75.75 0 0 1 .75-.75h2.25v-2.25a.75.75 0 0 1 1.5 0v2.25h2.25a.75.75 0 0 1 0 1.5h-2.25v2.25a.75.75 0 0 1-1.5 0v-2.25h-2.25a.75.75 0 0 1-.75-.75Z"/><path fill-rule="evenodd" d="M10 17a7 7 0 1 0 0-14 7 7 0 0 0 0 14Zm0-1.5a5.5 5.5 0 1 0 0-11 5.5 5.5 0 0 0 0 11Z"/>',
    search: '<path fill-rule="evenodd" d="M12.323 13.383a5.5 5.5 0 1 1 1.06-1.06l2.897 2.897a.75.75 0 1 1-1.06 1.06l-2.897-2.897Zm.677-4.383a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z"/>',
    sidekick: '<path d="m10.943 14.05-.002.002c-.73.351-1.465.231-2.204-.105-.252-.114-.532-.083-.713.077-.093.082-.158.2-.162.339-.005.138.052.268.146.377.479.552 1.198.91 1.954.923.827.035 1.596-.417 2.027-1.07.077-.116.117-.249.096-.383-.02-.136-.1-.243-.202-.31-.198-.13-.473-.117-.7.02-.08.05-.16.094-.24.13Z"/><path fill-rule="evenodd" d="M2.893 5.951c-.06.196-.204.817-.204 1.655-.126.729-.078 1.454-.126 2.712l-.06 1.56c-.096 2.547 1.752 5.313 4.276 5.663 1.938.269 3.904.278 5.844.028l.218-.028c.24-.03.383-.049.509-.072 2.335-.424 4.042-3.002 4.074-5.375.002-.127-.003-.271-.012-.513l-.05-1.288c-.027-.722-.048-1.283-.097-1.75l.006-.142c.03-.65.023-.743-.05-1.17-.097-.566-.317-1.16-.506-1.518-.274-.521-.719-1.054-1.407-1.054l-.187-.193c-1.495-1.55-2.192-1.895-5.407-2.209-1.825-.057-2.68.23-3.804.78-1.071.523-2.162 1.245-2.551 1.778-.277.378-.376.838-.466 1.136Zm9.726.323c.711.067 1.364.129 1.883.05 0 0 .283.783.976 1.479.08.08.154.152.224.22.153.15.285.277.392.407.017.123.031.258.044.412-.204-.098-.44-.168-.71-.201-1.064-.076-1.896.336-2.747.758-.818.405-1.654.82-2.73.82-1.075 0-1.911-.415-2.729-.82-.851-.422-1.683-.834-2.746-.758-.26.032-.488.098-.686.189.035-.411.083-.694.165-.943.226-.687.638-1.284 1.178-1.735.071-.03.146-.055.223-.079l.413.015c-.05 1.316.268 2.192.46 2.247.156.044.378-.256.672-.654.105-.142.22-.297.344-.453.147-.186.511-.456 1.002-.738.092.668.28 1.08.408 1.116.157.045.379-.256.672-.653.106-.143.22-.298.344-.454.097-.12.222-.233.379-.334h.089c.275 0 .577.003.893.005.54.004 1.078.055 1.587.104Zm-8.657 7.426c.514 1.351 1.617 2.514 2.975 2.702 1.837.255 3.7.264 5.54.027l.197-.026c.266-.034.47-.065.47-.065 1.27-.23 2.299-1.356 2.8-2.64-.213.124-.463.226-.755.3-.685.17-1.63-.077-2.678-.626-.364-.19-.643-.414-.904-.623-.475-.382-.89-.716-1.655-.716s-1.181.334-1.656.716c-.261.21-.54.433-.904.623-1.048.55-1.992.797-2.678.625-.29-.072-.54-.174-.752-.297Zm1.835-1.137c.687 0 1.244-.557 1.244-1.245 0-.687-.557-1.244-1.244-1.244-.688 0-1.245.557-1.245 1.244 0 .688.557 1.245 1.245 1.245Zm6.9-1.245c0 .688.558 1.245 1.245 1.245s1.244-.557 1.244-1.245c0-.687-.557-1.244-1.244-1.244-.688 0-1.245.557-1.245 1.244Z"/>',
    notification: '<path fill-rule="evenodd" d="m7.252 14.424-2.446-.281c-1.855-.213-2.38-2.659-.778-3.616l.065-.038a2.887 2.887 0 0 0 1.407-2.48v-.509a4.5 4.5 0 0 1 9 0v.51c0 1.016.535 1.958 1.408 2.479l.065.038c1.602.957 1.076 3.403-.778 3.616l-2.543.292v.365a2.7 2.7 0 0 1-5.4 0v-.376Zm3.9.076h-2.4v.3a1.2 1.2 0 0 0 2.4 0v-.3Zm-3.152-1.5h4l3.024-.348a.452.452 0 0 0 .18-.837l-.065-.038a4.414 4.414 0 0 1-.747-.562 4.387 4.387 0 0 1-1.392-3.205v-.51a3 3 0 0 0-6 0v.51a4.387 4.387 0 0 1-2.138 3.767l-.065.038a.452.452 0 0 0 .18.838l3.023.347Z"/>',
    plan: '<path d="m14.208 4.688 1.533-2.3a.25.25 0 0 0-.208-.388h-3.066a.25.25 0 0 0-.208.389l1.533 2.299a.25.25 0 0 0 .416 0Z"/><path fill-rule="evenodd" d="M11.25 7c0-.69.56-1.25 1.25-1.25h3.25c.69 0 1.25.56 1.25 1.25v8.75c0 .69-.56 1.25-1.25 1.25h-11.5c-.69 0-1.25-.56-1.25-1.25v-2.75c0-.69.56-1.25 1.25-1.25h2.75v-1.75c0-.69.56-1.25 1.25-1.25h3v-1.75Zm2.25 2.5v-2.25h2v8.25h-10.25v-2.25h3.25a.75.75 0 0 0 .75-.75v-2.25h3.5a.75.75 0 0 0 .75-.75Z"/>',
    bill: '<path fill-rule="evenodd" d="M5.5 3.5a2 2 0 0 0-2 2v3.75c0 .414.336.75.75.75h2v5.769a.85.85 0 0 0 1.433.618l1.442-1.357 1.611 1.516a.75.75 0 0 0 1.028 0l1.611-1.516 1.442 1.357a.85.85 0 0 0 1.433-.618v-10.269a2 2 0 0 0-2-2h-8.494l.005.017a2.02 2.02 0 0 0-.261-.017Zm-.5 2a.5.5 0 0 1 1 0v3h-1v-3Zm2.75-.48-.006-.02h6.506a.5.5 0 0 1 .5.5v8.764l-.69-.649a1 1 0 0 0-1.37 0l-1.44 1.355-1.44-1.355a1 1 0 0 0-1.37 0l-.69.65v-9.245Zm2 1.48a.75.75 0 0 0 0 1.5h3a.75.75 0 0 0 0-1.5h-3Zm-.75 3.75a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 0 1.5h-3a.75.75 0 0 1-.75-.75Z"/>',
    payment: '<path fill-rule="evenodd" d="M9.621 4h5.258c.395 0 .736 0 1.017.023.297.024.592.078.875.222.424.216.768.56.984.984.144.283.198.578.222.875.023.28.023.622.023 1.017v2.258c0 .395 0 .736-.023 1.017a2.29 2.29 0 0 1-.222.875 2.25 2.25 0 0 1-.983.984c-.284.144-.58.198-.876.222-.28.023-.622.023-1.017.023h-2.58c-.08.083-.169.16-.265.23l-2.73 1.965c-.565.407-.93.67-1.335.859-.358.167-.736.29-1.125.363-.44.083-.889.083-1.586.083h-1.508a.75.75 0 0 1 0-1.5h1.436c.794 0 1.095-.003 1.379-.057.266-.05.524-.134.77-.248.261-.122.508-.296 1.152-.76l2.67-1.923a.423.423 0 0 0-.35-.753l-4.875 1.219a.75.75 0 0 1-.364-1.456l.932-.233v-2.289c-.59.002-.821.011-1.033.062a2.25 2.25 0 0 0-.65.27c-.21.128-.398.31-.943.854l-.594.594a.75.75 0 0 1-1.06-1.06l.654-.655c.46-.46.78-.78 1.16-1.012a3.75 3.75 0 0 1 1.083-.45c.397-.095.813-.103 1.387-.103a6.79 6.79 0 0 1 .019-.396 2.29 2.29 0 0 1 .222-.875 2.25 2.25 0 0 1 .984-.984 2.29 2.29 0 0 1 .875-.222c.28-.023.622-.023 1.017-.023Zm5.229 7h-2.024a1.925 1.925 0 0 0-2.382-1.697l-2.444.611v-1.414h8.5v.85c0 .432 0 .712-.018.924-.017.204-.045.28-.064.317a.75.75 0 0 1-.328.327c-.037.02-.112.047-.316.064-.212.017-.492.018-.924.018Zm1.645-4.5h-8.49c.002-.104.006-.194.013-.274.017-.204.045-.28.064-.316a.75.75 0 0 1 .328-.328c.037-.02.112-.047.316-.064.212-.017.492-.018.924-.018h5.2c.432 0 .712 0 .924.018.204.017.28.045.316.064a.75.75 0 0 1 .328.328c.02.037.047.112.064.316.007.08.01.17.013.274Z"/>',
    cart: '<path fill-rule="evenodd" d="M2.5 3.75a.75.75 0 0 1 .75-.75h1.612a1.75 1.75 0 0 1 1.732 1.5h9.656a.75.75 0 0 1 .748.808l-.358 4.653a2.75 2.75 0 0 1-2.742 2.539h-6.351l.093.78a.25.25 0 0 0 .248.22h6.362a.75.75 0 0 1 0 1.5h-6.362a1.75 1.75 0 0 1-1.738-1.543l-1.04-8.737a.25.25 0 0 0-.248-.22h-1.612a.75.75 0 0 1-.75-.75Zm4.868 7.25h6.53a1.25 1.25 0 0 0 1.246-1.154l.296-3.846h-8.667l.595 5Z"/><path d="M10 17a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z"/><path d="M15 17a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z"/>',
    profile: '<path fill-rule="evenodd" d="M7 8.25a3 3 0 1 1 6 0 3 3 0 0 1-6 0Zm3-1.5a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3Z"/><path fill-rule="evenodd" d="M15.168 15.435a7.5 7.5 0 1 1-10.336-10.87 7.5 7.5 0 0 1 10.336 10.87Zm-9.83-1.659a6 6 0 1 1 9.326 0 7.03 7.03 0 0 0-4.664-1.776 7.03 7.03 0 0 0-4.663 1.776Zm1.086 1.043a5.973 5.973 0 0 0 3.576 1.181c1.34 0 2.577-.44 3.576-1.181a5.53 5.53 0 0 0-3.576-1.319 5.53 5.53 0 0 0-3.576 1.319Z"/>',
    delivery: '<path fill-rule="evenodd" d="M4 5.25a.75.75 0 0 1 .75-.75h6.991a2.75 2.75 0 0 1 2.645 1.995l.427 1.494a.25.25 0 0 0 .18.173l1.681.421a1.75 1.75 0 0 1 1.326 1.698v1.219a1.75 1.75 0 0 1-1.032 1.597 2.5 2.5 0 1 1-4.955.153h-3.025a2.5 2.5 0 1 1-4.78-.75h-.458a.75.75 0 0 1 0-1.5h2.5c.03 0 .06.002.088.005a2.493 2.493 0 0 1 1.947.745h4.43a2.493 2.493 0 0 1 1.785-.75c.698 0 1.33.286 1.783.748a.25.25 0 0 0 .217-.248v-1.22a.25.25 0 0 0-.19-.242l-1.682-.42a1.75 1.75 0 0 1-1.258-1.217l-.427-1.494a1.25 1.25 0 0 0-1.202-.907h-6.991a.75.75 0 0 1-.75-.75Zm2.5 9.25a1 1 0 1 0 0-2 1 1 0 0 0 0 2Zm8 0a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z"/><path d="M3.25 8a.75.75 0 0 0 0 1.5h5a.75.75 0 0 0 0-1.5h-5Z"/>',
    tax: '<path d="M9.25 10a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z"/><path d="M12.75 14a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z"/><path fill-rule="evenodd" d="M12.692 9.308a.625.625 0 0 1 0 .884l-4.5 4.5a.625.625 0 1 1-.884-.884l4.5-4.5a.625.625 0 0 1 .884 0Z"/><path fill-rule="evenodd" d="M8.025 2.5c-.562 0-1.024.467-.914 1.018.19.959.613 1.744 1.172 2.267a5.307 5.307 0 0 0-3.285 3.25l-1.108 3.13c-.922 2.603 1.008 5.335 3.77 5.335h4.68c2.761 0 4.692-2.732 3.77-5.335l-1.108-3.13a5.306 5.306 0 0 0-3.285-3.25c.559-.523.981-1.308 1.172-2.267.11-.551-.352-1.018-.914-1.018h-3.95Zm1.975 2.5c-.295 0-.826-.231-1.176-1h2.352c-.35.769-.88 1-1.176 1Zm3.588 4.536 1.108 3.13a2.5 2.5 0 0 1-2.356 3.334h-4.68a2.5 2.5 0 0 1-2.356-3.335l1.108-3.13a3.806 3.806 0 0 1 7.176 0Z"/>',
    location: '<path fill-rule="evenodd" d="M10 11a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Zm0-1.5a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z"/><path fill-rule="evenodd" d="M8.827 16h-3.077a.75.75 0 0 0 0 1.5h8.5a.75.75 0 0 0 0-1.5h-3.077l.07-.061a17.427 17.427 0 0 0 1.707-1.758c1.224-1.46 2.55-3.574 2.55-5.954 0-3.167-2.328-5.477-5.5-5.477s-5.5 2.31-5.5 5.477c0 2.38 1.326 4.495 2.55 5.954a17.426 17.426 0 0 0 1.777 1.819Zm1.173-11.75c-2.35 0-4 1.646-4 3.977 0 1.846 1.049 3.618 2.2 4.99a15.919 15.919 0 0 0 1.8 1.816 15.92 15.92 0 0 0 1.8-1.817c1.151-1.371 2.2-3.143 2.2-4.99 0-2.33-1.65-3.976-4-3.976Z"/>',
    globe: '<path fill-rule="evenodd" d="M3 10a7 7 0 1 1 14 0 7 7 0 0 1-14 0Zm7-5.5a5.497 5.497 0 0 0-4.737 2.703l2 1.999c.472.472.737 1.113.737 1.78v.518a.5.5 0 0 0 .5.5 2 2 0 0 1 2 2v1.478a5.504 5.504 0 0 0 4.52-3.228h-1.02a.75.75 0 0 1-.75-.75v-.5a.75.75 0 0 0-.75-.75h-2.5a1.755 1.755 0 0 1-1.07-3.144l.463-.356a.393.393 0 0 0 .152-.312v-.04c0-.885.62-1.624 1.449-1.808a5.531 5.531 0 0 0-.994-.09Zm2.875.81a1.85 1.85 0 0 1-1.477.735.352.352 0 0 0-.353.353v.04c0 .587-.271 1.14-.736 1.499l-.462.356a.256.256 0 0 0 .153.457h2.5a2.25 2.25 0 0 1 2.236 2h.713a5.497 5.497 0 0 0-2.574-5.44Zm-8.375 4.69c0-.443.052-.875.152-1.288l1.55 1.55c.19.191.298.45.298.72v.518a2 2 0 0 0 2 2 .5.5 0 0 1 .5.5v1.41a5.502 5.502 0 0 1-4.5-5.41Z"/>',
    apps: '<path fill-rule="evenodd" d="M3.5 5.75a2.25 2.25 0 0 1 2.25-2.25h2.75a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1h-4a1 1 0 0 1-1-1v-2.75Zm2.25-.75a.75.75 0 0 0-.75.75v2.25h3v-3h-2.25Z"/><path fill-rule="evenodd" d="M3.5 14.25a2.25 2.25 0 0 0 2.25 2.25h2.75a1 1 0 0 0 1-1v-4a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v2.75Zm2.25.75a.75.75 0 0 1-.75-.75v-2.25h3v3h-2.25Z"/><path fill-rule="evenodd" d="M14.25 16.5a2.25 2.25 0 0 0 2.25-2.25v-2.75a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v4a1 1 0 0 0 1 1h2.75Zm.75-2.25a.75.75 0 0 1-.75.75h-2.25v-3h3v2.25Z"/><path d="M13.5 3.5a.75.75 0 0 1 .75.75v1.5h1.5a.75.75 0 0 1 0 1.5h-1.5v1.5a.75.75 0 0 1-1.5 0v-1.5h-1.5a.75.75 0 0 1 0-1.5h1.5v-1.5a.75.75 0 0 1 .75-.75Z"/>',
    channels: '<path fill-rule="evenodd" d="M6.25 3.5a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1h.25v1.5h-.25a2.75 2.75 0 0 0-2.75 2.75v2a2.75 2.75 0 0 0 2.75 2.75h2a2.75 2.75 0 0 0 2.75-2.75v-.25h1.5v.25a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1h-2a1 1 0 0 0-1 1v.25h-1.5v-.25c0-.487-.127-.944-.348-1.34l2.909-2.91h1.939a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1h-2a1 1 0 0 0-1 1v1.94l-2.91 2.908a2.738 2.738 0 0 0-1.34-.348h-.25v-1.5h.25a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1h-2Zm.5 1.5v1h1v-1h-1Zm-.5 5.5c-.69 0-1.25.56-1.25 1.25v2c0 .69.56 1.25 1.25 1.25h2c.69 0 1.25-.56 1.25-1.25v-2c0-.69-.56-1.25-1.25-1.25h-2Zm7.75-4.5v-1h1v1h-1Zm0 6.25v1h1v-1h-1Z"/>',
    domain: '<path d="M3.25 3c-.414 0-.75.336-.75.75v9c0 .414.336.75.75.75s.75-.336.75-.75v-8.25h10.25c.414 0 .75-.336.75-.75s-.336-.75-.75-.75h-11Z"/><path fill-rule="evenodd" d="M5 6.25c0-.414.336-.75.75-.75h10.5c.414 0 .75.336.75.75v3.75c0 .414-.336.75-.75.75s-.75-.336-.75-.75v-.5h-9v5h4c.414 0 .75.336.75.75s-.336.75-.75.75h-4.75c-.414 0-.75-.336-.75-.75v-9Zm10.5.75v1h-9v-1h9Z"/><path d="M12.565 10.96c-.17-.043-.35.007-.474.131s-.174.304-.132.474l1.122 4.51c.043.176.177.314.351.362.174.048.36-.001.487-.128l1.165-1.165.84.841c.196.196.512.196.708 0l.353-.353c.196-.195.196-.512 0-.707l-.84-.841 1.163-1.165c.128-.127.177-.313.129-.487-.049-.174-.187-.308-.361-.351l-4.51-1.122Z"/>',
    target: '<path d="M4.75 10a5.25 5.25 0 0 1 10.5 0 .75.75 0 0 0 1.5 0 6.75 6.75 0 1 0-6.75 6.75.75.75 0 0 0 0-1.5 5.25 5.25 0 0 1-5.25-5.25Z"/><path d="M11.537 9.805a.75.75 0 0 0 1.486-.208 3 3 0 1 0-3.492 3.372.75.75 0 0 0 .26-1.478 1.5 1.5 0 1 1 1.746-1.686Z"/><path d="M11.611 10.973a.5.5 0 0 0-.638.638l2.121 6.01a.5.5 0 0 0 .871.135l1.172-1.558 1.038 1.037a.5.5 0 0 0 .707 0l.353-.353a.5.5 0 0 0 0-.707l-1.037-1.038 1.558-1.172a.5.5 0 0 0-.135-.87l-6.01-2.122Z"/>',
    metafields: '<path d="M6.25 9.5c-.414 0-.75.336-.75.75s.336.75.75.75h7.5c.414 0 .75-.336.75-.75s-.336-.75-.75-.75h-7.5Z"/><path fill-rule="evenodd" d="M6.5 4c-1.105 0-2 .895-2 2v.505l-.083.036c-1.011.433-1.667 1.428-1.667 2.528v4.181c0 1.519 1.231 2.75 2.75 2.75h9c1.519 0 2.75-1.231 2.75-2.75v-4.181c0-1.1-.656-2.095-1.667-2.528l-.083-.036v-.505c0-1.105-.895-2-2-2h-.5c-1.105 0-2 .895-2 2h-2c0-1.105-.895-2-2-2h-.5Zm-.5 2c0-.276.224-.5.5-.5h.5c.276 0 .5.224.5.5v.75c0 .414.336.75.75.75h3.5c.414 0 .75-.336.75-.75v-.75c0-.276.224-.5.5-.5h.5c.276 0 .5.224.5.5v1c0 .3.179.571.455.69l.537.23c.46.197.758.649.758 1.149v4.181c0 .69-.56 1.25-1.25 1.25h-9c-.69 0-1.25-.56-1.25-1.25v-4.181c0-.5.298-.952.758-1.15l.537-.23c.276-.118.455-.389.455-.689v-1Z"/>',
    languageTranslate: '<path fill-rule="evenodd" d="M6.955 3.994a.75.75 0 0 0-1.41 0l-2 5.5a.75.75 0 1 0 1.41.512l.187-.514a.756.756 0 0 0 .108.008h2.111l.184.506a.75.75 0 1 0 1.41-.512l-2-5.5Zm-.705 2.45.566 1.556h-1.132l.566-1.555Z"/><path d="M14.55 7.75v-1a.25.25 0 0 0-.25-.25h-1.49l.22.22a.75.75 0 1 1-1.06 1.06l-1.5-1.5a.75.75 0 0 1 0-1.06l1.5-1.5a.75.75 0 0 1 1.06 1.06l-.22.22h1.49c.966 0 1.75.783 1.75 1.75v1a.75.75 0 1 1-1.5 0Z"/><path d="M5.5 12.25v1c0 .138.112.25.25.25h1.49l-.22-.22a.75.75 0 1 1 1.06-1.06l1.5 1.5a.75.75 0 0 1 0 1.06l-1.5 1.5a.75.75 0 0 1-1.06-1.06l.22-.22h-1.49a1.75 1.75 0 0 1-1.75-1.75v-1a.75.75 0 1 1 1.5 0Z"/><path fill-rule="evenodd" d="M11.002 11.5h-.252a.75.75 0 0 1 0-1.5h1.75v-.25a.75.75 0 0 1 1.5 0v.25h1.75a.75.75 0 0 1 0 1.5h-.312a5.877 5.877 0 0 1-.4 1.945 5.13 5.13 0 0 1-.69 1.227c.293.161.634.3 1.03.402a.75.75 0 0 1-.376 1.452 5.676 5.676 0 0 1-1.782-.788 5.677 5.677 0 0 1-1.782.788.75.75 0 1 1-.376-1.452c.396-.103.737-.24 1.03-.402a5.115 5.115 0 0 1-.69-1.227 5.88 5.88 0 0 1-.4-1.945Zm2.935 0h-1.434a4.381 4.381 0 0 0 .295 1.394c.101.257.237.524.422.782.185-.258.32-.525.422-.782a4.386 4.386 0 0 0 .295-1.394Z"/>',
    lock: '<path d="M10.75 13.05a1.5 1.5 0 1 0-1.5 0v.45a.75.75 0 0 0 1.5 0v-.45Z"/><path fill-rule="evenodd" d="M6.25 7.095v-.345a3.75 3.75 0 1 1 7.5 0v.345a3.001 3.001 0 0 1 2.25 2.905v4a3 3 0 0 1-3 3h-6a3 3 0 0 1-3-3v-4a3 3 0 0 1 2.25-2.905Zm1.5-.345a2.25 2.25 0 0 1 4.5 0v.25h-4.5v-.25Zm-2.25 3.25a1.5 1.5 0 0 1 1.5-1.5h6a1.5 1.5 0 0 1 1.5 1.5v4a1.5 1.5 0 0 1-1.5 1.5h-6a1.5 1.5 0 0 1-1.5-1.5v-4Z"/>',
    page: '<path fill-rule="evenodd" d="M6.75 4.5c-.69 0-1.25.56-1.25 1.25v8.5c0 .69.56 1.25 1.25 1.25h6.5c.69 0 1.25-.56 1.25-1.25v-4.75h-3.25a1.75 1.75 0 0 1-1.75-1.75v-3.25h-2.75Zm4.25 1.06 2.44 2.44h-2.19a.25.25 0 0 1-.25-.25v-2.19Zm-7 .19a2.75 2.75 0 0 1 2.75-2.75h3.5a.75.75 0 0 1 .53.22l5 5c.141.14.22.331.22.53v5.5a2.75 2.75 0 0 1-2.75 2.75h-6.5a2.75 2.75 0 0 1-2.75-2.75v-8.5Z"/>',
    x: '<path d="M13.97 15.03a.75.75 0 1 0 1.06-1.06l-3.97-3.97 3.97-3.97a.75.75 0 0 0-1.06-1.06l-3.97 3.97-3.97-3.97a.75.75 0 0 0-1.06 1.06l3.97 3.97-3.97 3.97a.75.75 0 1 0 1.06 1.06l3.97-3.97 3.97 3.97Z"/>',
    chevronRight: '<path fill-rule="evenodd" d="M7.72 14.53a.75.75 0 0 1 0-1.06l3.47-3.47-3.47-3.47a.75.75 0 0 1 1.06-1.06l4 4a.75.75 0 0 1 0 1.06l-4 4a.75.75 0 0 1-1.06 0Z"/>',
    layoutSection: '<path d="M3.5 6.25c0-1.519 1.231-2.75 2.75-2.75.414 0 .75.336.75.75s-.336.75-.75.75c-.69 0-1.25.56-1.25 1.25 0 .414-.336.75-.75.75s-.75-.336-.75-.75Z"/><path fill-rule="evenodd" d="M3.5 9.25c0-.966.784-1.75 1.75-1.75h9.5c.966 0 1.75.784 1.75 1.75v1.5c0 .966-.784 1.75-1.75 1.75h-9.5c-.966 0-1.75-.784-1.75-1.75v-1.5Zm1.75-.25c-.138 0-.25.112-.25.25v1.5c0 .138.112.25.25.25h9.5c.138 0 .25-.112.25-.25v-1.5c0-.138-.112-.25-.25-.25h-9.5Z"/><path d="M3.5 13.75c0 1.519 1.231 2.75 2.75 2.75.414 0 .75-.336.75-.75s-.336-.75-.75-.75c-.69 0-1.25-.56-1.25-1.25 0-.414-.336-.75-.75-.75s-.75.336-.75.75Z"/><path d="M13.75 3.5c1.519 0 2.75 1.231 2.75 2.75 0 .414-.336.75-.75.75s-.75-.336-.75-.75c0-.69-.56-1.25-1.25-1.25-.414 0-.75-.336-.75-.75s.336-.75.75-.75Z"/><path d="M13.75 16.5c1.519 0 2.75-1.231 2.75-2.75 0-.414-.336-.75-.75-.75s-.75.336-.75.75c0 .69-.56 1.25-1.25 1.25-.414 0-.75.336-.75.75s.336.75.75.75Z"/><path d="M11.75 4.25c0 .414-.336.75-.75.75h-2c-.414 0-.75-.336-.75-.75s.336-.75.75-.75h2c.414 0 .75.336.75.75Z"/><path d="M11 16.5c.414 0 .75-.336.75-.75s-.336-.75-.75-.75h-2c-.414 0-.75.336-.75.75s.336.75.75.75h2Z"/>',
    layoutHeader: '<path fill-rule="evenodd" d="M3.5 5.25c0-.966.784-1.75 1.75-1.75h9.5c.966 0 1.75.784 1.75 1.75v1.5a1.75 1.75 0 0 1-1.75 1.75h-9.5a1.75 1.75 0 0 1-1.75-1.75v-1.5Zm1.75-.25a.25.25 0 0 0-.25.25v1.5c0 .138.112.25.25.25h9.5a.25.25 0 0 0 .25-.25v-1.5a.25.25 0 0 0-.25-.25h-9.5Z"/><path d="M3.5 11.25c0-.966.784-1.75 1.75-1.75h.5a.75.75 0 0 1 0 1.5h-.5a.25.25 0 0 0-.25.25v.5a.75.75 0 0 1-1.5 0v-.5Z"/><path d="M3.5 14.75c0 .966.784 1.75 1.75 1.75h.5a.75.75 0 0 0 0-1.5h-.5a.25.25 0 0 1-.25-.25v-.5a.75.75 0 0 0-1.5 0v.5Z"/><path d="M14.75 9.5c.966 0 1.75.784 1.75 1.75v.5a.75.75 0 0 1-1.5 0v-.5a.25.25 0 0 0-.25-.25h-.5a.75.75 0 0 1 0-1.5h.5Z"/><path d="M14.75 16.5a1.75 1.75 0 0 0 1.75-1.75v-.5a.75.75 0 0 0-1.5 0v.5a.25.25 0 0 1-.25.25h-.5a.75.75 0 0 0 0 1.5h.5Z"/><path d="M11.75 10.25a.75.75 0 0 1-.75.75h-2a.75.75 0 0 1 0-1.5h2a.75.75 0 0 1 .75.75Z"/><path d="M11 16.5a.75.75 0 0 0 0-1.5h-2a.75.75 0 0 0 0 1.5h2Z"/>',
    layoutFooter: '<path d="M3.5 5.25c0-.966.784-1.75 1.75-1.75h.5a.75.75 0 0 1 0 1.5h-.5a.25.25 0 0 0-.25.25v.5a.75.75 0 0 1-1.5 0v-.5Z"/><path fill-rule="evenodd" d="M3.5 13.25c0-.966.784-1.75 1.75-1.75h9.5c.966 0 1.75.784 1.75 1.75v1.5a1.75 1.75 0 0 1-1.75 1.75h-9.5a1.75 1.75 0 0 1-1.75-1.75v-1.5Zm1.75-.25a.25.25 0 0 0-.25.25v1.5c0 .138.112.25.25.25h9.5a.25.25 0 0 0 .25-.25v-1.5a.25.25 0 0 0-.25-.25h-9.5Z"/><path d="M3.5 8.75c0 .966.784 1.75 1.75 1.75h.5a.75.75 0 0 0 0-1.5h-.5a.25.25 0 0 1-.25-.25v-.5a.75.75 0 0 0-1.5 0v.5Z"/><path d="M14.75 3.5c.966 0 1.75.784 1.75 1.75v.5a.75.75 0 0 1-1.5 0v-.5a.25.25 0 0 0-.25-.25h-.5a.75.75 0 0 1 0-1.5h.5Z"/><path d="M14.75 10.5a1.75 1.75 0 0 0 1.75-1.75v-.5a.75.75 0 0 0-1.5 0v.5a.25.25 0 0 1-.25.25h-.5a.75.75 0 0 0 0 1.5h.5Z"/><path d="M11.75 4.25a.75.75 0 0 1-.75.75h-2a.75.75 0 0 1 0-1.5h2a.75.75 0 0 1 .75.75Z"/><path d="M11 10.5a.75.75 0 0 0 0-1.5h-2a.75.75 0 0 0 0 1.5h2Z"/>',
    textTitle: '<path d="M4 4.75a.75.75 0 0 1 .75-.75h10.5a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0v-.75h-3.5v8.75h1.25a.75.75 0 0 1 0 1.5h-4.5a.75.75 0 0 1 0-1.5h1.25v-8.75h-3.5v.75a.75.75 0 0 1-1.5 0v-1.5Z"/>',
    image: '<path d="M12.5 9a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z"/><path fill-rule="evenodd" d="M9.018 3.5h1.964c.813 0 1.469 0 2 .043.546.045 1.026.14 1.47.366a3.75 3.75 0 0 1 1.64 1.639c.226.444.32.924.365 1.47.043.531.043 1.187.043 2v1.964c0 .813 0 1.469-.043 2-.045.546-.14 1.026-.366 1.47a3.75 3.75 0 0 1-1.639 1.64c-.444.226-.924.32-1.47.365-.531.043-1.187.043-2 .043h-1.964c-.813 0-1.469 0-2-.043-.546-.045-1.026-.14-1.47-.366a3.75 3.75 0 0 1-1.64-1.639c-.226-.444-.32-.924-.365-1.47-.043-.531-.043-1.187-.043-2v-1.964c0-.813 0-1.469.043-2 .045-.546.14-1.026.366-1.47a3.75 3.75 0 0 1 1.639-1.64c.444-.226.924-.32 1.47-.365.531-.043 1.187-.043 2-.043Zm-1.877 1.538c-.454.037-.715.107-.912.207a2.25 2.25 0 0 0-.984.984c-.1.197-.17.458-.207.912-.037.462-.038 1.057-.038 1.909v1.428l.723-.867a1.75 1.75 0 0 1 2.582-.117l2.695 2.695 1.18-1.18a1.75 1.75 0 0 1 2.604.145l.216.27v-2.374c0-.852 0-1.447-.038-1.91-.037-.453-.107-.714-.207-.911a2.25 2.25 0 0 0-.984-.984c-.197-.1-.458-.17-.912-.207-.462-.037-1.056-.038-1.909-.038h-1.9c-.852 0-1.447 0-1.91.038Zm-2.103 7.821a7.12 7.12 0 0 1-.006-.08.746.746 0 0 0 .044-.049l1.8-2.159a.25.25 0 0 1 .368-.016l3.226 3.225a.75.75 0 0 0 1.06 0l1.71-1.71a.25.25 0 0 1 .372.021l1.213 1.516c-.021.06-.045.114-.07.165-.216.423-.56.767-.984.983-.197.1-.458.17-.912.207-.462.037-1.056.038-1.909.038h-1.9c-.852 0-1.447 0-1.91-.038-.453-.037-.714-.107-.911-.207a2.25 2.25 0 0 1-.984-.984c-.1-.197-.17-.458-.207-.912Z"/>',
    buttonPress: '<path d="M5.75 2.5a1.75 1.75 0 0 0-1.75 1.75v3.5c0 .966.784 1.75 1.75 1.75a.75.75 0 0 0 0-1.5.25.25 0 0 1-.25-.25v-3.5a.25.25 0 0 1 .25-.25h8.5a.25.25 0 0 1 .25.25v3.5a.25.25 0 0 1-.25.25h-.5a.75.75 0 0 0 0 1.5h.5a1.75 1.75 0 0 0 1.75-1.75v-3.5a1.75 1.75 0 0 0-1.75-1.75h-8.5Z"/><path fill-rule="evenodd" d="M9.75 5a2.25 2.25 0 0 0-2.25 2.25v3.58l-.57-.258a1.75 1.75 0 0 0-2.429 1.216l-.07.312a2.25 2.25 0 0 0 .497 1.962l2.456 2.834a1.75 1.75 0 0 0 1.323.604h4.465a1.75 1.75 0 0 0 1.72-1.423l.67-3.523a1.75 1.75 0 0 0-1.267-2.018l-2.295-.612v-2.674a2.25 2.25 0 0 0-2.25-2.25Zm-.75 2.25a.75.75 0 0 1 1.5 0v3.25c0 .34.229.637.557.725l2.851.76a.25.25 0 0 1 .181.288l-.67 3.524a.25.25 0 0 1-.247.203h-4.465a.25.25 0 0 1-.19-.086l-2.456-2.835a.75.75 0 0 1-.165-.654l.07-.312a.25.25 0 0 1 .346-.173l1.63.735a.75.75 0 0 0 1.058-.684v-4.741Z"/>',
    code: '<path d="M12.221 4.956a.75.75 0 0 0-1.442-.412l-3 10.5a.75.75 0 1 0 1.442.412l3-10.5Z"/><path d="M7.03 6.22a.75.75 0 0 1 0 1.06l-2.72 2.72 2.72 2.72a.75.75 0 0 1-1.06 1.06l-3.25-3.25a.75.75 0 0 1 0-1.06l3.25-3.25a.75.75 0 0 1 1.06 0Z"/><path d="M12.97 13.78a.75.75 0 0 1 0-1.06l2.72-2.72-2.72-2.72a.75.75 0 0 1 1.06-1.06l3.25 3.25a.75.75 0 0 1 0 1.06l-3.25 3.25a.75.75 0 0 1-1.06 0Z"/>',
    chevronDown: '<path fill-rule="evenodd" d="M5.72 8.47a.75.75 0 0 1 1.06 0l3.47 3.47 3.47-3.47a.75.75 0 1 1 1.06 1.06l-4 4a.75.75 0 0 1-1.06 0l-4-4a.75.75 0 0 1 0-1.06Z"/>',
    exit: '<path d="M9.75 3c-1.243 0-2.25 1.007-2.25 2.25 0 .414.336.75.75.75s.75-.336.75-.75.336-.75.75-.75h3.5c.69 0 1.25.56 1.25 1.25v8.5c0 .69-.56 1.25-1.25 1.25h-3.5c-.414 0-.75-.336-.75-.75s-.336-.75-.75-.75-.75.336-.75.75c0 1.243 1.007 2.25 2.25 2.25h3.5c1.519 0 2.75-1.231 2.75-2.75v-8.5c0-1.519-1.231-2.75-2.75-2.75h-3.5Z"/><path d="M12.25 10.75c.414 0 .75-.336.75-.75s-.336-.75-.75-.75h-5.69l.97-.97c.293-.293.293-.767 0-1.06-.293-.293-.767-.293-1.06 0l-2.25 2.25c-.141.14-.22.331-.22.53s.079.39.22.53l2.25 2.25c.293.293.767.293 1.06 0 .293-.293.293-.767 0-1.06l-.97-.97h5.69Z"/>',
    menuHorizontal: '<path d="M6 10a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Z"/><path d="M11.5 10a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Z"/><path d="M17 10a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Z"/>',
    undo: '<path d="M7.47 3.72a.75.75 0 0 1 1.06 1.06l-1.72 1.72h3.94a5 5 0 0 1 0 10h-1.5a.75.75 0 0 1 0-1.5h1.5a3.5 3.5 0 1 0 0-7h-3.94l1.72 1.72a.75.75 0 1 1-1.06 1.06l-3-3a.75.75 0 0 1 0-1.06l3-3Z"/>',
    redo: '<path d="M12.53 3.72a.75.75 0 1 0-1.06 1.06l1.72 1.72h-3.94a5 5 0 0 0 0 10h1.5a.75.75 0 0 0 0-1.5h-1.5a3.5 3.5 0 1 1 0-7h3.94l-1.72 1.72a.75.75 0 1 0 1.06 1.06l3-3a.75.75 0 0 0 0-1.06l-3-3Z"/>',
    desktop: '<path fill-rule="evenodd" d="M3.5 6.25a2.75 2.75 0 0 1 2.75-2.75h7.5a2.75 2.75 0 0 1 2.75 2.75v4.5a2.75 2.75 0 0 1-2.75 2.75h-1.25v1.5h.75a.75.75 0 0 1 0 1.5h-6.5a.75.75 0 0 1 0-1.5h.75v-1.5h-1.25a2.75 2.75 0 0 1-2.75-2.75v-4.5Zm5.5 7.25h2v1.5h-2v-1.5Zm-2.75-8.5c-.69 0-1.25.56-1.25 1.25v3.25h10v-3.25c0-.69-.56-1.25-1.25-1.25h-7.5Zm8.725 6c-.116.57-.62 1-1.225 1h-7.5a1.25 1.25 0 0 1-1.225-1h9.95Z"/>',
    mobile: '<path d="M7.75 13.75a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 0 1.5h-3a.75.75 0 0 1-.75-.75Z"/><path fill-rule="evenodd" d="M4.75 5.75a2.75 2.75 0 0 1 2.75-2.75h5a2.75 2.75 0 0 1 2.75 2.75v8.5a2.75 2.75 0 0 1-2.75 2.75h-5a2.75 2.75 0 0 1-2.75-2.75v-8.5Zm2.75-1.25c-.69 0-1.25.56-1.25 1.25v8.5c0 .69.56 1.25 1.25 1.25h5c.69 0 1.25-.56 1.25-1.25v-8.5c0-.69-.56-1.25-1.25-1.25h-.531a1 1 0 0 1-.969.75h-2a1 1 0 0 1-.969-.75h-.531Z"/>',
    viewportWide: '<path d="M4 5.75a2.75 2.75 0 0 1 2.75-2.75h6.5a2.75 2.75 0 0 1 2.75 2.75v.875a.75.75 0 0 1-1.5 0v-.875c0-.69-.56-1.25-1.25-1.25h-6.5c-.69 0-1.25.56-1.25 1.25v.875a.75.75 0 0 1-1.5 0v-.875Z"/><path d="M4.75 12.625a.75.75 0 0 1 .75.75v.875c0 .69.56 1.25 1.25 1.25h6.5c.69 0 1.25-.56 1.25-1.25v-.875a.75.75 0 0 1 1.5 0v.875a2.75 2.75 0 0 1-2.75 2.75h-6.5a2.75 2.75 0 0 1-2.75-2.75v-.875a.75.75 0 0 1 .75-.75Z"/><path d="M9.75 10a.75.75 0 0 1-.75.75h-2.44l.72.72a.75.75 0 1 1-1.06 1.06l-2-2a.75.75 0 0 1 0-1.06l2-2a.75.75 0 1 1 1.06 1.06l-.72.72h2.44a.75.75 0 0 1 .75.75Z"/><path d="M11 10.75a.75.75 0 0 1 0-1.5h2.44l-.72-.72a.75.75 0 0 1 1.06-1.06l2 2a.75.75 0 0 1 0 1.06l-2 2a.75.75 0 1 1-1.06-1.06l.72-.72h-2.44Z"/>',
    cashYen: '<path d="M7.436 6.506a.75.75 0 0 1 1.058-.07l1.506 1.317 1.506-1.317a.75.75 0 0 1 .988 1.128l-1.744 1.526v.41h1.25a.75.75 0 0 1 0 1.5h-1.25v.5h1.25a.75.75 0 0 1 0 1.5h-1.25v.5a.75.75 0 0 1-1.5 0v-.5h-1.25a.75.75 0 0 1 0-1.5h1.25v-.5h-1.25a.75.75 0 0 1 0-1.5h1.25v-.41l-1.744-1.526a.75.75 0 0 1-.07-1.058Z"/><path fill-rule="evenodd" d="M10 3a7 7 0 1 0 0 14 7 7 0 0 0 0-14Zm-5.5 7a5.5 5.5 0 1 1 11 0 5.5 5.5 0 0 1-11 0Z"/>',
    collection: '<path d="M13.75 3.25c0-.414-.336-.75-.75-.75h-3.029c-.87 0-1.703.348-2.313.968l-4.692 4.755c-.29.295-.288.77.007 1.06.295.292.77.289 1.06-.006l4.693-4.756c.328-.333.777-.521 1.245-.521h3.029c.414 0 .75-.336.75-.75Z"/><path d="M12.75 9.5c.552 0 1-.448 1-1s-.448-1-1-1-1 .448-1 1 .448 1 1 1Z"/><path fill-rule="evenodd" d="M8.767 6.098c.703-.703 1.657-1.098 2.652-1.098h2.081c1.519 0 2.75 1.231 2.75 2.75v2.289c0 .861-.342 1.688-.952 2.298l-4.206 4.206c-.976.976-2.56.976-3.536 0l-2.672-2.672c-1.074-1.075-1.074-2.816 0-3.89l3.883-3.883Zm2.652.402c-.597 0-1.17.237-1.591.659l-3.883 3.883c-.489.488-.489 1.28 0 1.768l2.672 2.672c.39.39 1.024.39 1.414 0l4.206-4.206c.329-.328.513-.773.513-1.237v-2.289c0-.69-.56-1.25-1.25-1.25h-2.081Z"/>',
    layoutBlock: '<path d="M5 6.25c0-.69.56-1.25 1.25-1.25h2a.75.75 0 0 0 0-1.5h-2a2.75 2.75 0 0 0-2.75 2.75v2a.75.75 0 0 0 1.5 0v-2Z"/><path d="M13.75 5c.69 0 1.25.56 1.25 1.25v2a.75.75 0 0 0 1.5 0v-2a2.75 2.75 0 0 0-2.75-2.75h-2a.75.75 0 0 0 0 1.5h2Z"/><path d="M13.75 15c.69 0 1.25-.56 1.25-1.25v-2a.75.75 0 0 1 1.5 0v2a2.75 2.75 0 0 1-2.75 2.75h-2a.75.75 0 0 1 0-1.5h2Z"/><path d="M6.25 15c-.69 0-1.25-.56-1.25-1.25v-2a.75.75 0 0 0-1.5 0v2a2.75 2.75 0 0 0 2.75 2.75h2a.75.75 0 0 0 0-1.5h-2Z"/>',
  };
  const pi = (n, s = 20) => `<svg viewBox="0 0 20 20" width="${s}" height="${s}" fill="currentColor" aria-hidden="true">${PI[n] || ''}</svg>`;
  /*
   * The admin frame as it looked before the new look that Shopify began rolling out on 2026-09-15 (Shopify's own before /
   * after picture in shopify.com/blog/admin-new-look): top bar with search, Sidekick, notifications and the store; the
   * navigation shows each item's filled glyph and the outline glyph on the selected item; sales channels as dark tiles.
   * Labels from help.shopify.com/ja: 商品管理 > 注文書 / 在庫転送, 注文管理 > チェックアウト離脱, グロース (the Marketing tab
   * became Growth on 2026-06-17, changelog.shopify.com), コンテンツ > メニュー / ブログ記事, オンラインストア > ページ,
   * ストア分析 > ライブビュー. The markup in dom.js is replaced here once at load.
   */
  const NAV = [
    ['home', 'homeFilled', 'home', 'ホーム'],
    ['orders', 'orderFilled', 'order', '注文管理', [['drafts', '下書き'], ['abandoned', 'チェックアウト離脱']]],
    ['products', 'productFilled', 'product', '商品管理', [['collections', 'コレクション'], ['inventory', '在庫'], ['purchase_orders', '注文書'], ['transfers', '在庫転送'], ['giftcards', 'ギフトカード']]],
    ['customers', 'personFilled', 'person', '顧客管理', [['segments', 'セグメント'], ['companies', '会社']]],
    ['marketing', 'gauge', 'gauge', 'グロース'],
    ['discounts', 'discountFilled', 'discount', 'ディスカウント'],
    ['content', 'contentFilled', 'content', 'コンテンツ', [['metaobjects', 'メタオブジェクト'], ['files', 'ファイル'], ['menus', 'メニュー'], ['blogs', 'ブログ記事']]],
    ['markets', 'marketsYenFilled', 'marketsYen', 'マーケット', [['catalogs', 'カタログ']]],
    ['analytics', 'chartVerticalFilled', 'chartVertical', 'ストア分析', [['reports', 'レポート'], ['live', 'ライブビュー']]],
  ];
  // the real logo (public/shared/logos/shopify.svg) as the admin's top bar shows it: all white, the S cut into the bag
  const SA_LOGO = `<svg viewBox="0 0 500 142.8" height="25" role="img" aria-label="Shopify"><g><g><path fill="#fff" d="M107.4,27.1c-0.1-0.7-0.7-1.1-1.2-1.1c-0.5,0-10.4-0.2-10.4-0.2s-8.3-8-9.1-8.9c-0.8-0.8-2.4-0.6-3-0.4 c0,0-1.6,0.5-4.2,1.3c-0.4-1.4-1.1-3.1-2-4.9c-2.9-5.6-7.3-8.6-12.5-8.6c0,0,0,0,0,0c-0.4,0-0.7,0-1.1,0.1 c-0.2-0.2-0.3-0.4-0.5-0.5c-2.3-2.4-5.2-3.6-8.7-3.5c-6.7,0.2-13.4,5.1-18.9,13.7c-3.8,6.1-6.7,13.7-7.6,19.6 c-7.7,2.4-13.1,4.1-13.3,4.1c-3.9,1.2-4,1.3-4.5,5C10.2,45.6,0,124.5,0,124.5l85.6,14.8l37.1-9.2 C122.6,130.1,107.5,27.8,107.4,27.1z M75.2,19.2c-2,0.6-4.2,1.3-6.6,2.1c0-3.4-0.5-8.2-2-12.2C71.7,9.9,74.2,15.7,75.2,19.2z M64.1,22.6c-4.5,1.4-9.4,2.9-14.3,4.4c1.4-5.3,4-10.5,7.2-14c1.2-1.3,2.9-2.7,4.8-3.5C63.8,13.4,64.2,18.9,64.1,22.6z M54.9,4.9 c1.6,0,2.9,0.3,4,1.1c-1.8,0.9-3.6,2.3-5.2,4.1c-4.3,4.6-7.6,11.7-8.9,18.6c-4.1,1.3-8.1,2.5-11.7,3.6 C35.5,21.4,44.6,5.2,54.9,4.9z"/><g><path fill="#fff" d="M106.2,26c-0.5,0-10.4-0.2-10.4-0.2s-8.3-8-9.1-8.9c-0.3-0.3-0.7-0.5-1.1-0.5l0,122.9l37.1-9.2 c0,0-15.1-102.3-15.2-103C107.3,26.4,106.7,26,106.2,26z"/><path fill="#0a0a0a" d="M65,45.1l-4.3,16.1c0,0-4.8-2.2-10.5-1.8c-8.4,0.5-8.4,5.8-8.4,7.1c0.5,7.2,19.4,8.8,20.5,25.7 c0.8,13.3-7,22.4-18.4,23.1C30.3,116,22.8,108,22.8,108l2.9-12.3c0,0,7.6,5.7,13.6,5.3c3.9-0.2,5.4-3.5,5.2-5.7 c-0.6-9.4-16-8.8-17-24.3C26.7,58,35.2,44.9,54,43.7C61.3,43.2,65,45.1,65,45.1z"/></g></g><g><path fill="#fff" d="M172.9,79.4c-4.3-2.3-6.5-4.3-6.5-7c0-3.4,3.1-5.6,7.9-5.6c5.6,0,10.6,2.3,10.6,2.3l3.9-12 c0,0-3.6-2.8-14.2-2.8c-14.8,0-25.1,8.5-25.1,20.4c0,6.8,4.8,11.9,11.2,15.6c5.2,2.9,7,5,7,8.1c0,3.2-2.6,5.8-7.4,5.8 c-7.1,0-13.9-3.7-13.9-3.7l-4.2,12c0,0,6.2,4.2,16.7,4.2c15.2,0,26.2-7.5,26.2-21C185,88.4,179.5,83.2,172.9,79.4z"/><path fill="#fff" d="M233.5,54.1c-7.5,0-13.4,3.6-17.9,9l-0.2-0.1l6.5-34h-16.9l-16.5,86.6h16.9l5.6-29.6 c2.2-11.2,8-18.1,13.4-18.1c3.8,0,5.3,2.6,5.3,6.3c0,2.3-0.2,5.2-0.7,7.5l-6.4,33.9h16.9l6.6-35c0.7-3.7,1.2-8.1,1.2-11.1 C247.4,59.9,242.4,54.1,233.5,54.1z"/><path fill="#fff" d="M285.7,54.1c-20.4,0-33.9,18.4-33.9,38.9c0,13.1,8.1,23.7,23.3,23.7c20,0,33.5-17.9,33.5-38.9 C308.7,65.7,301.6,54.1,285.7,54.1z M277.4,103.8c-5.8,0-8.2-4.9-8.2-11.1c0-9.7,5-25.5,14.2-25.5c6,0,8,5.2,8,10.2 C291.4,87.8,286.3,103.8,277.4,103.8z"/><path fill="#fff" d="M352,54.1c-11.4,0-17.9,10.1-17.9,10.1h-0.2l1-9.1h-15c-0.7,6.1-2.1,15.5-3.4,22.5l-11.8,62h16.9 l4.7-25.1h0.4c0,0,3.5,2.2,9.9,2.2c19.9,0,32.9-20.4,32.9-41C369.5,64.3,364.4,54.1,352,54.1z M335.8,104c-4.4,0-7-2.5-7-2.5 l2.8-15.8c2-10.6,7.5-17.6,13.4-17.6c5.2,0,6.8,4.8,6.8,9.3C351.8,88.4,345.3,104,335.8,104z"/><path fill="#fff" d="M393.7,29.8c-5.4,0-9.7,4.3-9.7,9.8c0,5,3.2,8.5,8,8.5h0.2c5.3,0,9.8-3.6,9.9-9.8 C402.1,33.4,398.8,29.8,393.7,29.8z"/><polygon fill="#fff" points="370,115.5 386.9,115.5 398.4,55.5 381.4,55.5 "/><path fill="#fff" d="M441.5,55.4h-11.8l0.6-2.8c1-5.8,4.4-10.9,10.1-10.9c3,0,5.4,0.9,5.4,0.9l3.3-13.3 c0,0-2.9-1.5-9.2-1.5c-6,0-12,1.7-16.6,5.6c-5.8,4.9-8.5,12-9.8,19.2l-0.5,2.8h-7.9l-2.5,12.8h7.9l-9,47.4h16.9l9-47.4h11.7 L441.5,55.4z"/><path fill="#fff" d="M482.3,55.5c0,0-10.6,26.7-15.3,41.3h-0.2c-0.3-4.7-4.2-41.3-4.2-41.3h-17.8l10.2,55.1 c0.2,1.2,0.1,2-0.4,2.8c-2,3.8-5.3,7.5-9.2,10.2c-3.2,2.3-6.8,3.8-9.6,4.8l4.7,14.4c3.4-0.7,10.6-3.6,16.6-9.2 c7.7-7.2,14.9-18.4,22.2-33.6L500,55.5H482.3z"/></g></g> </svg>`;
  const SA_BAG = `<svg viewBox="-8 4 126 146" width="15" height="15" aria-hidden="true"><path fill="#fff" d="M107.4,27.1c-0.1-0.7-0.7-1.1-1.2-1.1c-0.5,0-10.4-0.2-10.4-0.2s-8.3-8-9.1-8.9c-0.8-0.8-2.4-0.6-3-0.4 c0,0-1.6,0.5-4.2,1.3c-0.4-1.4-1.1-3.1-2-4.9c-2.9-5.6-7.3-8.6-12.5-8.6c0,0,0,0,0,0c-0.4,0-0.7,0-1.1,0.1 c-0.2-0.2-0.3-0.4-0.5-0.5c-2.3-2.4-5.2-3.6-8.7-3.5c-6.7,0.2-13.4,5.1-18.9,13.7c-3.8,6.1-6.7,13.7-7.6,19.6 c-7.7,2.4-13.1,4.1-13.3,4.1c-3.9,1.2-4,1.3-4.5,5C10.2,45.6,0,124.5,0,124.5l85.6,14.8l37.1-9.2 C122.6,130.1,107.5,27.8,107.4,27.1z M75.2,19.2c-2,0.6-4.2,1.3-6.6,2.1c0-3.4-0.5-8.2-2-12.2C71.7,9.9,74.2,15.7,75.2,19.2z M64.1,22.6c-4.5,1.4-9.4,2.9-14.3,4.4c1.4-5.3,4-10.5,7.2-14c1.2-1.3,2.9-2.7,4.8-3.5C63.8,13.4,64.2,18.9,64.1,22.6z M54.9,4.9 c1.6,0,2.9,0.3,4,1.1c-1.8,0.9-3.6,2.3-5.2,4.1c-4.3,4.6-7.6,11.7-8.9,18.6c-4.1,1.3-8.1,2.5-11.7,3.6 C35.5,21.4,44.6,5.2,54.9,4.9z"/><path fill="#fff" d="M106.2,26c-0.5,0-10.4-0.2-10.4-0.2s-8.3-8-9.1-8.9c-0.3-0.3-0.7-0.5-1.1-0.5l0,122.9l37.1-9.2 c0,0-15.1-102.3-15.2-103C107.3,26.4,106.7,26,106.2,26z"/><path fill="#4a4a4a" d="M65,45.1l-4.3,16.1c0,0-4.8-2.2-10.5-1.8c-8.4,0.5-8.4,5.8-8.4,7.1c0.5,7.2,19.4,8.8,20.5,25.7 c0.8,13.3-7,22.4-18.4,23.1C30.3,116,22.8,108,22.8,108l2.9-12.3c0,0,7.6,5.7,13.6,5.3c3.9-0.2,5.4-3.5,5.2-5.7 c-0.6-9.4-16-8.8-17-24.3C26.7,58,35.2,44.9,54,43.7C61.3,43.2,65,45.1,65,45.1z"/></svg>`;
  const piPair = (off, on) => `<span class="pi-off">${pi(off)}</span><span class="pi-on">${pi(on)}</span>`;
  (function adminShell() {
    const nav = $('#saNav');
    if (!nav) return;
    const item = ([k, off, on, label, sub]) => `<div class="sa-ni" data-nav="${k}">${piPair(off, on)}${esc(label)}</div>` +
      (sub ? `<div class="sa-sub" data-sub="${k}">${sub.map(([sk, sl]) => `<div class="sa-si" data-nav="${k}/${sk}">${esc(sl)}</div>`).join('')}</div>` : '');
    nav.innerHTML = NAV.map(item).join('') +
      `<div class="sa-ng">販売チャネル${pi('chevronRight', 16)}</div>` +
      `<div class="sa-ni" data-nav="online"><span class="sa-ch">${pi('store', 15)}</span>オンラインストア</div>` +
      `<div class="sa-sub" data-sub="online"><div class="sa-si" data-nav="online/themes">テーマ</div><div class="sa-si" data-nav="online/pages">ページ</div><div class="sa-si" data-nav="online/preferences">環境設定</div></div>` +
      `<div class="sa-ni" data-nav="pos"><span class="sa-ch">${SA_BAG}</span>POS</div>` +
      `<div class="sa-ng">アプリ${pi('chevronRight', 16)}</div><div class="sa-apps" id="saApps"></div>` +
      `<div class="sa-ni sa-bottom" data-nav="settings">${piPair('settingsFilled', 'settings')}設定</div>`;
    const mark = $('#sa .sa-mark'); if (mark) mark.innerHTML = SA_LOGO;
    const sIc = $('#sa .sa-search > i'); if (sIc) sIc.outerHTML = pi('search', 18);
    const bell = $('#sa .sa-bell');
    if (bell) { bell.innerHTML = pi('notification'); bell.insertAdjacentHTML('beforebegin', `<span class="sa-bell sa-sk">${pi('sidekick')}</span>`); }
    const setTop = $('#saSet .sa-set-top');
    if (setTop) { const g = $(':scope > i', setTop); if (g) g.outerHTML = pi('settings'); const x = $('#saSetX'); if (x) x.innerHTML = pi('x'); }
  })();
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
      // a section's index page shows the section's outline glyph before its title (Shopify's picture of the Products page)
      const top = o.nav && !o.nav.includes('/') && NAV.find((n) => n[0] === o.nav), h1 = $('#saMain .sa-ph > h1');
      if (top && h1 && !$('#saMain .sa-ph > .back, #saMain .sa-ph > i')) h1.insertAdjacentHTML('beforebegin', `<span class="sa-ph-ic">${pi(top[2])}</span>`);
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
      md.innerHTML = `<div class="sa-md-h">${esc(o.title || '')}<span class="x">${pi('x')}</span></div><div class="sa-md-b">${html}</div>${o.foot ? `<div class="sa-md-f">${o.foot}</div>` : ''}`;
      hydrate(md);
      // Polaris Modal: the backdrop dims the whole admin (top bar and navigation too), the dialog is centred;
      // over the settings too when they are open
      const ov = $('#saOv'), host = $('#saSet').classList.contains('show') ? $('#saSet') : $('#sa');
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
    // Polaris icons; 請求管理, アプリ / 販売チャネル (two pages since 2025), お客様のプライバシー: help.shopify.com/ja
    SETTINGS: [['general', 'store', 'ストアの詳細'], ['plan', 'plan', 'プラン'], ['billing', 'bill', '請求管理'], ['users', 'person', 'ユーザー'], ['payments', 'payment', '決済'], ['checkout', 'cart', 'チェックアウト'],
      ['accounts', 'profile', '顧客アカウント'], ['shipping', 'delivery', '配送と配達'], ['taxes', 'tax', '税金と関税'], ['locations', 'location', 'ロケーション'], ['markets', 'globe', 'マーケット'],
      ['apps', 'apps', 'アプリ'], ['channels', 'channels', '販売チャネル'], ['domains', 'domain', 'ドメイン'], ['events', 'target', '顧客イベント'], ['notifications', 'notification', '通知'], ['custom-data', 'metafields', 'カスタムデータ'],
      ['languages', 'languageTranslate', '言語'], ['privacy', 'lock', 'お客様のプライバシー'], ['policies', 'page', 'ポリシー']],
    settings(key, html, o = {}) {
      $('#saSetNav').innerHTML = this.SETTINGS.map(([k, i, l]) => `<div class="sa-ni${k === key ? ' on' : ''}" data-set="${k}">${pi(i)}${esc(l)}</div>`).join('');
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
    apps(list) { $('#saApps').innerHTML = list.map((a) => `<div class="sa-si sa-pin" data-nav="app/${esc(a.id)}"><span class="sa-app-ic" style="background:${esc(a.color)}">${esc(a.initials || a.name[0])}</span>${esc(a.name)}</div>`).join(''); },
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
  { // DevTools を開いたまま／開いてから詳細表示に切り替える
    const open0 = DevTools.open.bind(DevTools);
    DevTools.open = async (on) => { $('#devtools').classList.remove('dt-dev'); return open0(on); };
  }
  /* Chrome のデバイスモード（Ctrl+Shift+M）は DevTools の機能なので、DevTools が閉じていれば下に開く（低めの高さ・アニメーションなし）。
     スマホの画面は残りの高さに合わせて縮小し、ツールバーの倍率もその値になる（Store.fit）。DevTools を開いたのがデバイスモードなら、戻すときに閉じる */
  {
    const device0 = Store.device.bind(Store);
    let opened = false;
    Store.device = (on) => {
      const dt = $('#devtools');
      if (on && !dt.classList.contains('show')) { dt.classList.add('show', 'dt-dev'); opened = true; if (!$('#dtCon').innerHTML.trim()) DevTools.render(); }
      if (!on && opened) { dt.classList.remove('show', 'dt-dev'); opened = false; }
      device0(on);
    };
  }

  /* ================================================================ THEME EDITOR */
  const TE = {
    dev: 'pc', doc: null, tree: [], cur: null,
    /** o = { theme, badge, page, tree: [{grp, items: [{id, name, ic, blocks: [{id, name, ic}]}]}] } */
    open(o) {
      $('#teTheme').textContent = o.theme || 'Theme';
      $('#teBadge').textContent = o.badge || '下書き';
      $('#teBadge').className = 'sa-bd ' + (o.live ? 'ok' : 'info'); // a theme that is not live: the blue badge (shopify.dev theme editor picture)
      $('#tePageName').textContent = o.page || 'ホームページ';
      $('#teSideH').textContent = o.page || 'ホームページ';
      this.tree = o.tree || [];
      this.renderTree();
      this.setSettings('', '');
      this.fit();
    },
    /*
     * The sections tree as the editor draws it (shopify.dev/docs/storefronts/themes/tools/online-editor): group headings with
     * a rule between groups, a chevron on sections that have blocks, Polaris icons (header / footer group sections get the
     * header / footer layout glyph), the blue "セクションを追加" with the plus-circle.
     */
    renderTree(o = {}) {
      const SEC = { image: 'image', code: 'code', tag: 'product', grid: 'layoutSection', doc: 'layoutSection', layers: 'layoutSection', text: 'layoutSection' };
      const BLK = { text: 'textTitle', yen: 'cashYen', tag: 'product', cart: 'buttonPress', image: 'image', code: 'code' };
      const cls = (id) => `${id === this.cur ? ' on' : ''}${id === o.newId && !Clock.ff ? ' new' : ''}`;
      const sec = (g, s) => {
        const gl = /ヘッダー|header/i.test(g.grp) ? 'layoutHeader' : /フッター|footer/i.test(g.grp) ? 'layoutFooter' : SEC[s.ic] || 'layoutSection';
        return `<div class="te-it${cls(s.id)}" data-te="${esc(s.id)}"><span class="te-cv">${s.blocks ? pi(s.open ? 'chevronDown' : 'chevronRight', 16) : ''}</span>${pi(gl)}<span class="te-nm">${esc(s.name)}</span></div>` +
          (s.open && s.blocks ? s.blocks.map((b) => `<div class="te-it blk${cls(b.id)}" data-te="${esc(b.id)}">${pi(BLK[b.ic] || 'textTitle')}<span class="te-nm">${esc(b.name)}</span></div>`).join('') +
            (s.addBlock ? `<div class="te-it blk add" data-te="${esc(s.id)}+">${pi('plusCircle')}ブロックを追加</div>` : '') : '');
      };
      $('#teTree').innerHTML = this.tree.map((g) => `<div class="te-g"><div class="te-grp">${esc(g.grp)}</div>` + g.items.map((s) => sec(g, s)).join('') +
        (g.add ? `<div class="te-it add" data-te="${esc(g.grp)}+"><span class="te-cv"></span>${pi('plusCircle')}セクションを追加</div>` : '') + '</div>').join('');
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
    setSettings(title, html) { $('#teSetH').innerHTML = esc(title) + (title ? `<span class="te-ib">${pi('menuHorizontal')}</span>` : ''); $('#teSetB').innerHTML = html; hydrate($('#teSet')); },
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
  /*
   * The editor's top bar and icon rail as in shopify.dev's picture of the theme editor: exit, theme name + badge + ⋯, the page
   * picker, then Sidekick, the inspector, desktop / mobile / full width, undo / redo, 公開 and 保存; the rail with sections,
   * theme settings and app embeds. The markup in dom.js is replaced here once at load (ids kept).
   */
  (function teShell() {
    const top = $('#te .te-top');
    if (!top) return;
    top.innerHTML = `<span class="te-exit" id="teExit">${pi('exit')}</span>
      <span class="te-theme"><span id="teTheme">Theme</span><span class="sa-bd info" id="teBadge">下書き</span><span class="te-ib">${pi('menuHorizontal')}</span></span>
      <span class="te-pagesel" id="tePage">${pi('home')}<span id="tePageName">ホームページ</span>${pi('chevronDown', 16)}</span>
      <span class="te-tools"><span class="te-ib">${pi('sidekick')}</span><span class="te-ib te-insp on" id="teInspect"><svg viewBox="0 0 20 20" width="20" height="20" fill="currentColor" aria-hidden="true"><defs><clipPath id="teInspClip"><path d="M0 0h20v11h-9v9H0z"/></clipPath></defs><g clip-path="url(#teInspClip)">${PI.layoutBlock}</g><path d="M11.6 11.1l6.6 2.5-2.9 1.1-1.2 2.9z"/></svg></span>
      <span class="te-dev" id="teDev"><span data-dev="pc" class="on">${pi('desktop')}</span><span data-dev="sp">${pi('mobile')}</span><span data-dev="full">${pi('viewportWide')}</span></span>
      <span class="te-ib off">${pi('undo')}</span><span class="te-ib off">${pi('redo')}</span>
      <span class="sa-btn" id="tePublish">公開</span><span class="sa-btn pri" id="teSave">保存</span></span>`;
    const side = $('#te .te-side');
    if (side && !$('#te .te-rail')) side.insertAdjacentHTML('beforebegin', `<nav class="te-rail"><span class="on">${pi('layoutSection')}</span><span>${pi('settings')}</span><span>${pi('apps')}</span></nav>`);
  })();

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
