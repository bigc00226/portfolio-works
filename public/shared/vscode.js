/*
 * VS Code as it looks by default today — shared by every video that shows VS Code (the Shopify kit, Né, NOT A HOTEL):
 *   VSC.fileIcon(path)      the file's icon in VS Code's default file icon theme "Seti": its icon font
 *                           (public/shared/fonts/seti.woff, MIT) with the glyph and colour vs-seti-icon-theme.json gives
 *                           the file name / extension / language (a file Seti has no icon for gets Seti's plain file icon)
 *   VSC.ci(name)            a codicon (VS Code's own icon font, public/shared/fonts/codicon.ttf, CC BY 4.0)
 *   VSC.minimap(canvas, toks, top)   the minimap: every line as 1 px wide × 2 px high characters in its token colour
 *                           (VS Code's default: renderCharacters, scale 1, 120 columns; the slider shows only on mouse over)
 * Colours and layout: public/shared/vscode.css (the "Dark Modern" theme, VS Code's default since 1.78).
 */
(function () {
  'use strict';
  const C = { yellow: '#cbcb41', blue: '#519aba', green: '#8dc149', grey: '#6d8086', purple: '#a074c4', orange: '#e37933', pink: '#f55385', red: '#cc3e44', white: '#d4d7d6', ignore: '#41535b' };
  const SETI = {
    file: [0xe023, C.white],
    name: { '.gitignore': [0xe034, C.ignore], '.shopifyignore': [0xe034, C.ignore], '.wp-env.json': [0xe055, C.yellow], 'tsconfig.json': [0xe097, C.blue] },
    ext: {
      liquid: [0xe05b, C.green], csv: [0xe01e, C.green], tsv: [0xe01e, C.green], toml: [0xe019, C.grey], graphql: [0xe03e, C.pink], gql: [0xe03e, C.pink],
      svg: [0xe091, C.purple], png: [0xe04c, C.purple], webp: [0xe04c, C.purple], jpg: [0xe04c, C.purple], avif: [0xe04c, C.purple], pdf: [0xe06d, C.red], ico: [0xe02f, C.yellow],
    },
    // by language (VS Code's language of the file)
    lang: {
      javascript: [0xe051, C.yellow], typescript: [0xe099, C.blue], json: [0xe055, C.yellow], markdown: [0xe060, C.blue], css: [0xe01d, C.blue],
      dotenv: [0xe019, C.grey], yaml: [0xe0a7, C.purple], html: [0xe048, C.orange], php: [0xe070, C.purple], shellscript: [0xe089, C.green], xml: [0xe0a5, C.orange],
    },
  };
  const LANG_OF_EXT = {
    js: 'javascript', mjs: 'javascript', cjs: 'javascript', jsx: 'javascript', ts: 'typescript', tsx: 'typescript', json: 'json', md: 'markdown',
    css: 'css', scss: 'css', html: 'html', htm: 'html', yml: 'yaml', yaml: 'yaml', php: 'php', sh: 'shellscript', xml: 'xml',
  };
  const ch = (code) => `&#x${code.toString(16)};`;
  function fileIcon(path) {
    const name = String(path).split('/').pop();
    const ext = name.includes('.') ? name.split('.').pop().toLowerCase() : '';
    const lang = name.startsWith('.env') ? 'dotenv' : LANG_OF_EXT[ext];
    const [g, c] = SETI.name[name] || SETI.ext[ext] || SETI.lang[lang] || SETI.file;
    return `<span class="fi seti" style="color:${c}">${ch(g)}</span>`;
  }

  const CI = {
    'chevron-right': 0xeab6, 'chevron-down': 0xeab4, 'chevron-up': 0xeab7, close: 0xea76, error: 0xea87, warning: 0xea6c, 'circle-filled': 0xea71,
    files: 0xeaf0, search: 0xea6d, 'source-control': 0xea68, 'debug-alt': 0xeb91, extensions: 0xeae6, account: 0xeb99, 'settings-gear': 0xeb51,
    'new-file': 0xea7f, 'new-folder': 0xea80, refresh: 0xeb37, 'collapse-all': 0xeac5, ellipsis: 0xea7c, 'arrow-left': 0xea9b, 'arrow-right': 0xea9c,
    copilot: 0xec1e, 'layout-sidebar-left': 0xebf3, 'layout-panel-off': 0xec01, 'layout-sidebar-right-off': 0xec00, layout: 0xebeb,
    remote: 0xeb3a, 'git-branch': 0xec6f, sync: 0xea77, bell: 0xeaa2, bracket: 0xeb0f, add: 0xea60, trash: 0xea81,
  };
  const ci = (name, cls = '') => `<span class="ci${cls ? ' ' + cls : ''}">${ch(CI[name])}</span>`;

  // the editor's token colours (Dark Modern = the Dark+ token colours), drawn at reduced opacity like VS Code's minimap
  const MINI = Object.fromEntries(Object.entries({
    '': '#cccccc', 't-kw': '#569cd6', 't-ctl': '#c586c0', 't-str': '#ce9178', 't-com': '#6a9955', 't-fn': '#dcdcaa', 't-var': '#9cdcfe', 't-num': '#b5cea8',
    't-tag': '#569cd6', 't-ctag': '#4ec9b0', 't-attr': '#9cdcfe', 't-pun': '#808080', 't-sel': '#d7ba7d', 't-prop': '#9cdcfe', 't-type': '#4ec9b0',
    't-head': '#569cd6', 't-const': '#4fc1ff', 't-br': '#ffd700', 't-key': '#9cdcfe', 't-bul': '#6796e6', 't-link': '#ce9178', 't-lq': '#c586c0',
    't-lqd': '#808080', 't-lqv': '#9cdcfe', 't-lqf': '#dcdcaa', 't-php': '#569cd6',
  }).map(([k, v]) => [k, v + '99']));
  /** draws the lines (toks[i] = [[text, tokenClass], …]) with the visible part (from line `top`) a third down when the file is long */
  function minimap(cv, toks, top = 0) {
    if (!cv) return;
    const w = cv.clientWidth, h = cv.clientHeight;
    if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h; }
    const g = cv.getContext('2d');
    g.clearRect(0, 0, w, h);
    if (!toks || !w) return;
    const rows = Math.floor(h / 2);
    const first = toks.length > rows ? Math.max(0, Math.min(toks.length - rows, Math.floor(top) - Math.floor(rows / 3))) : 0;
    for (let i = first; i < Math.min(toks.length, first + rows); i++) {
      let x = 0;
      for (const [t, c] of toks[i] || []) {
        g.fillStyle = MINI[String(c || '').split(' ')[0]] || MINI[''];
        for (let k = 0; k < t.length && x < 120; k++, x++) {
          const code = t.charCodeAt(k);
          if (code === 32 || code === 9) continue;
          const wide = code > 0x2e80;
          g.fillRect(x, (i - first) * 2, wide ? 2 : 1, 2);
          if (wide) x++;
        }
      }
    }
  }

  window.VSC = { fileIcon, ci, CI, minimap, SETI };
})();
