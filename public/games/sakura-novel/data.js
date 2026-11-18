/*
 * 花明かりの写真館 — data shared by the engine (game.js) and the script checker (Node):
 * the names of the pictures, characters, songs, endings, and the parser of the script format (script.js).
 *
 * Script format (one command or one page of text per line):
 *   *label                         a label (jump target). Text inside a label runs top to bottom.
 *   # comment
 *   @chapter <id> <title>          a chapter starts (title card, chapter select, save info); optional "| koharu=3, akari=2" preset for chapter select
 *   @bg <key> [fade|wipe|petal|black|cut] [ms]      background (keys of BG)
 *   @cg <key> [fade|petal|cut] · @cg off [fade]     event picture over everything on the screen (keys of CG)
 *   @show <char> <expr> <left|center|right|lc|rc>   a standing sprite enters / changes expression / moves
 *   @hide <char|all>
 *   @bgm <song|stop> · @se <name>
 *   @fx flash|shake · @sepia on|off · @tint none|dusk|night · @petals off|on|heavy · @wait <ms>
 *   @set koharu+1, clue_neg=1      flags (integers)
 *   @if <cond> => <label>          cond: a>=2 && b || !c · names "g.xxx" read the saved records (g.ends = endings seen)
 *   @jump <label>
 *   @choice                        followed by option lines:  - (cond) text => label !! koharu+1, x=1
 *   @end <ending id>
 *   名前「台詞」 / 名前(expr)「台詞」  a line of dialogue (the expression changes when the character is on screen)
 *   anything else                   narration.  "｜" breaks the line inside one page.
 */
(function (root) {
  'use strict';
  const NOVEL = (root.NOVEL = root.NOVEL || {});

  NOVEL.BG = {
    station: 'bg-station', slope: 'bg-slope-day', slope_night: 'bg-slope-night', studio_out: 'bg-studio-out',
    studio_in: 'bg-studio-in', darkroom: 'bg-darkroom', bookshop: 'bg-bookshop', river: 'bg-river-dusk',
  };
  NOVEL.BG_NAME = {
    station: '春見駅', slope: '花見坂', slope_night: '夜の花見坂', studio_out: '桐野写真館', studio_in: '写真館の店内',
    darkroom: '暗室', bookshop: '坂下堂', river: '灯川の土手',
  };
  NOVEL.CG = { photo: 'cg-photo', koharu: 'cg-koharu', akari: 'cg-akari', night: 'cg-night' };
  NOVEL.CG_LIST = [
    { key: 'photo', title: '昭和四十八年の春' },
    { key: 'koharu', title: 'ファインダー越しの春' },
    { key: 'akari', title: '川面の灯' },
    { key: 'night', title: '花明かりの下で' },
  ];
  NOVEL.CHARS = {
    koharu: { name: '小春', color: '#f3a6b8', exprs: ['normal', 'smile', 'surprised', 'sad'] },
    akari: { name: '灯', color: '#a9c1ee', exprs: ['normal', 'smile', 'shy', 'sad'] },
    kiyoshi: { name: '清', color: '#e2cfa8', exprs: ['normal', 'smile', 'distant'] },
    harue: { name: '春江', color: '#d7bfe6', exprs: ['normal', 'smile'] },
  };
  NOVEL.sprite = (ch, expr) => `ch-${ch}-${expr}`;
  /** name plate → character id (for the expression and the highlight) */
  NOVEL.SPEAKERS = { 小春: 'koharu', 灯: 'akari', 清: 'kiyoshi', 春江: 'harue', 湊: null, '？？？': null, 叔母: null };
  NOVEL.SONGS = ['title', 'daily', 'memory', 'dusk', 'night', 'harue', 'ending'];
  NOVEL.SE = ['shutter', 'bell', 'paper', 'wind', 'chime', 'heart'];
  NOVEL.ENDINGS = [
    { id: 'normal', title: '春を待つ封筒', kind: 'NORMAL END', hint: 'だれかの気持ちに、もう少し寄りそってみると……' },
    { id: 'koharu', title: 'ファインダー越しの春', kind: 'KOHARU END', hint: '小春の夢と、まっすぐ向きあう' },
    { id: 'akari', title: '川面の灯', kind: 'AKARI END', hint: '灯と、春江さんのそばにいる' },
    { id: 'true', title: '花明かりの写真館', kind: 'TRUE END', hint: 'ほかの結末を見たあと、三つの手がかり（ネガ・歌・日付）をすべて見つける' },
  ];
  NOVEL.POS = ['left', 'center', 'right', 'lc', 'rc'];
  const TRANS_BG = ['fade', 'wipe', 'petal', 'black', 'cut'];

  /* ---------- conditions & flags ---------- */
  NOVEL.evalCond = function (cond, flags, g) {
    const val = (name) => (name.startsWith('g.') ? +((g || {})[name.slice(2)] || 0) : +((flags || {})[name] || 0));
    return cond.split('||').some((alt) => alt.split('&&').every((atom) => {
      const m = /^\s*(!)?\s*([\w.]+)\s*(?:(>=|<=|==|!=|>|<)\s*(-?\d+))?\s*$/.exec(atom);
      if (!m) return false;
      const v = val(m[2]);
      let r;
      if (!m[3]) r = !!v;
      else {
        const n = +m[4];
        r = m[3] === '>=' ? v >= n : m[3] === '<=' ? v <= n : m[3] === '==' ? v === n : m[3] === '!=' ? v !== n : m[3] === '>' ? v > n : v < n;
      }
      return m[1] ? !r : r;
    }));
  };
  NOVEL.condNames = (cond) => (cond.match(/[A-Za-z_][\w.]*/g) || []);
  NOVEL.parseSet = function (s) {
    return s.split(',').map((p) => p.trim()).filter(Boolean).map((p) => {
      const m = /^(\w+)\s*(\+|-|=)\s*(-?\d+)$/.exec(p);
      return m ? { k: m[1], op: m[2], v: +m[3] } : { bad: p };
    });
  };
  NOVEL.applySet = function (ops, flags) {
    for (const o of ops) {
      if (o.bad) continue;
      const cur = +(flags[o.k] || 0);
      flags[o.k] = o.op === '+' ? cur + o.v : o.op === '-' ? cur - o.v : o.v;
    }
    return flags;
  };

  /* ---------- parser ---------- */
  NOVEL.parse = function (src) {
    const cmds = [], labels = {}, chapters = [], errors = [];
    let label = null, off = 0, choice = null;
    src.split(/\r?\n/).forEach((raw, i) => {
      const ln = i + 1, line = raw.trim();
      if (!line || line[0] === '#') return;
      const err = (m) => errors.push(`line ${ln}: ${m} — ${line.slice(0, 40)}`);
      if (line[0] === '*') {
        label = line.slice(1).trim();
        if (labels[label] != null) err(`label "${label}" defined twice`);
        labels[label] = cmds.length; off = 0; choice = null;
        return;
      }
      if (!label) { err('outside a label'); return; }
      const push = (c) => { c.label = label; c.off = off++; c.ln = ln; cmds.push(c); return c; };
      if (/^-\s/.test(line)) {
        const m = /^-\s+(?:\((.+?)\)\s*)?(.+?)\s*=>\s*(\S+)(?:\s*!!\s*(.+))?$/.exec(line);
        if (!choice) { err('option without @choice'); return; }
        if (!m) { err('bad option'); return; }
        choice.options.push({ cond: m[1] || null, text: m[2], target: m[3], set: m[4] ? NOVEL.parseSet(m[4]) : [] });
        return;
      }
      choice = null;
      if (line[0] === '@') {
        const parts = line.slice(1).split(/\s+/), cmd = parts[0], a = parts.slice(1);
        switch (cmd) {
          case 'chapter': {
            const rest = line.slice(1 + cmd.length).trim();
            const [head, preset] = rest.split('|');
            const sp = head.trim().split(/\s+/);
            const c = push({ t: 'chapter', id: sp[0], title: sp.slice(1).join('　'), preset: preset ? NOVEL.parseSet(preset) : [] });
            chapters.push({ id: c.id, title: c.title, label, preset: c.preset });
            break;
          }
          case 'bg': if (!a[0]) err('bg needs a key'); push({ t: 'bg', key: a[0], trans: a[1] || 'fade', ms: +a[2] || 0 }); if (a[1] && !TRANS_BG.includes(a[1])) err('unknown transition'); break;
          case 'cg': push({ t: 'cg', key: a[0] === 'off' ? null : a[0], trans: a[1] || 'fade' }); break;
          case 'show': push({ t: 'show', ch: a[0], expr: a[1] || 'normal', pos: a[2] || 'center' }); break;
          case 'hide': push({ t: 'hide', ch: a[0] || 'all' }); break;
          case 'bgm': push({ t: 'bgm', song: a[0] === 'stop' ? null : a[0] }); break;
          case 'se': push({ t: 'se', name: a[0] }); break;
          case 'fx': push({ t: 'fx', kind: a[0] }); break;
          case 'sepia': push({ t: 'sepia', on: a[0] !== 'off' }); break;
          case 'tint': push({ t: 'tint', kind: a[0] || 'none' }); break;
          case 'petals': push({ t: 'petals', mode: a[0] || 'on' }); break;
          case 'wait': push({ t: 'wait', ms: +a[0] || 500 }); break;
          case 'set': push({ t: 'set', ops: NOVEL.parseSet(line.slice(4)) }); break;
          case 'if': {
            const m = /^@if\s+(.+?)\s*=>\s*(\S+)$/.exec(line);
            if (!m) err('bad @if'); else push({ t: 'if', cond: m[1], target: m[2] });
            break;
          }
          case 'jump': push({ t: 'jump', target: a[0] }); break;
          case 'choice': choice = push({ t: 'choice', options: [] }); break;
          case 'end': push({ t: 'end', id: a[0] }); break;
          default: err(`unknown command @${cmd}`);
        }
        return;
      }
      const m = /^([^\s「」(（『』]{1,8})(?:[(（]([a-z]+)[)）])?(「[\s\S]*」|『[\s\S]*』)$/.exec(line);
      if (m) push({ t: 'text', name: m[1], expr: m[2] || null, text: m[3].replace(/｜/g, '\n') });
      else push({ t: 'text', name: null, expr: null, text: line.replace(/｜/g, '\n') });
    });
    return { cmds, labels, chapters, errors };
  };
})(typeof window !== 'undefined' ? window : globalThis);
