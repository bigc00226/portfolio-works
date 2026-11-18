/*
 * 宵灯りのほこら — maps. Each map: rows of tile characters (see TILES), and `marks`: lowercase letters / digits in the rows
 * that place objects (npc, chest, save lantern, sign, warp, barrier, lantern, boulder, deco). The tile under a mark is
 * `u` (or the map's ground). Pure data: also loaded by Node for the reachability check.
 */
(function (root) {
  'use strict';
  const HR = root.HR || (typeof module !== 'undefined' ? {} : {});

  /** tile chars → { solid, enc: encounter weight (0 = none), name } */
  const TILES = {
    '.': { enc: 1 }, ',': { enc: 1 }, '"': { enc: 1.6 }, ':': { enc: 0.55 }, '=': { enc: 0.6 }, ';': { enc: 1 }, "'": { enc: 1 }, C: { enc: 1 },
    S: { enc: 0.8 }, '-': { enc: 0 }, '!': { enc: 0.6 }, Y: { enc: 0 }, _: { enc: 0 }, J: { enc: 0 }, D: { enc: 0 }, H: { enc: 0 },
    '~': { solid: 1 }, T: { solid: 1 }, F: { solid: 1 }, '^': { solid: 1 }, '#': { solid: 1 }, R: { solid: 1 }, Q: { solid: 1 }, W: { solid: 1 },
    N: { solid: 1 }, K: { solid: 1, counter: 1 }, P: { solid: 1 }, '|': { solid: 1 }, B: { solid: 1 }, X: { solid: 1 }, O: { solid: 1, pit: 1 },
    Z: { solid: 1 }, I: { solid: 1 }, M: { solid: 1 }, U: { solid: 1 }, V: { solid: 1 }, E: { solid: 1 }, L: { solid: 1 }, 0: { solid: 1 },
    '*': { solid: 1 }, '&': { solid: 1 },
  };

  const MAPS = {};

  MAPS.home = {
    name: 'ヨネの家', style: 'interior', music: 'home', bg: 'bg-field', ground: '_',
    rows: [
      '000000000000',
      '0##########0',
      '0#MM_JJJbE#0',
      '0#__V_JJJJ#0',
      '0#a_______#0',
      '0#____U___#0',
      '0####D#####0',
      '000000000000',
    ],
    marks: {
      b: { t: 'npc', id: 'yone', spr: 'yone', dir: 'left', talk: 'yone', u: 'J' },
      a: { t: 'save' },
    },
    doors: { '5,6': { to: 'village', x: 7, y: 5, dir: 'down' } },
  };

  MAPS.inn = {
    name: '宿屋「月見屋」', style: 'interior', music: 'home', bg: 'bg-field', ground: '_',
    rows: [
      '00000000000000',
      '0############0',
      '0#EE_EE__MUa#0',
      '0#JJ_JJ__c__#0',
      '0#JJ_JJ_KKK_#0',
      '0#___b______#0',
      '0#_d______U_#0',
      '0######D#####0',
      '00000000000000',
    ],
    marks: {
      c: { t: 'npc', id: 'okami', spr: 'innkeeper', dir: 'down', talk: 'inn' },
      b: { t: 'npc', id: 'guest', spr: 'traveler', dir: 'right', talk: 'innGuest', wander: 1 },
      d: { t: 'npc', id: 'innkid', spr: 'child2', dir: 'up', talk: 'innKid', wander: 1 },
      a: { t: 'save' },
    },
    doors: { '7,7': { to: 'village', x: 24, y: 5, dir: 'down' } },
  };

  MAPS.village = {
    name: '灯ノ里', style: 'village', music: 'village', bg: 'bg-field', ground: '.',
    rows: [
      'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT',
      'TTT,...TTTTTTLk==lLTTTTTT..,.TTT',
      'TT..RRRRRR.....==....QQQQQQQ..TT',
      'T.,.RRRRRR.....==....QQQQQQQ...T',
      'T...#W#DW#.....==....#W#D#W#.,.T',
      'T......:...b...==.......:......T',
      'T...:::::::::::==:::::::::::...T',
      'T.B............==............B.T',
      'T..RRRRR....========..QQQQQ....T',
      'T..RRRRR....=*====a=..QQQQQ....T',
      'T..#NcN#..f.========..#NeN#....T',
      'T..#KKK#.......==.....#KKK#....T',
      'T.:::::::::::::==::::::::::::..T',
      'T.........g....==..h...........T',
      'T..RRRRR.......==...||||||||||.T',
      'T..RRRRR.......==...|PPPPPPPP|.T',
      'T..#NiN#.......==..m|PPPPPPPP|.T',
      'T..#KKK#.......==...|PPPPPPPP|.T',
      'T.:::::::::::::==...||||||||||.T',
      'T.~~~~~~.......==...n..........T',
      'T~~~~~~~.,.....==....,.....B...T',
      'T.~~~~~........==..............T',
      'TT............s==.............TT',
      'TTTTTTTTTTTTTTTxyTTTTTTTTTTTTTTT',
    ],
    marks: {
      k: { t: 'deco', kind: 'jizo', talk: 'jizo', u: '=' },
      l: { t: 'deco', kind: 'jizo', talk: 'jizo', u: '=' },
      b: { t: 'npc', id: 'child', spr: 'child', dir: 'down', talk: 'child', wander: 2 },
      a: { t: 'save', u: '=' },
      c: { t: 'npc', id: 'goro', spr: 'smith', dir: 'down', talk: 'shopWeapon', u: 'N', shopKeeper: true },
      e: { t: 'npc', id: 'mame', spr: 'merchant', dir: 'down', talk: 'shopItem', u: 'N', shopKeeper: true },
      i: { t: 'npc', id: 'tae', spr: 'tailor', dir: 'down', talk: 'shopArmor', u: 'N', shopKeeper: true },
      f: { t: 'npc', id: 'oldman', spr: 'oldman', dir: 'down', talk: 'oldman' },
      g: { t: 'npc', id: 'hint', spr: 'villager', dir: 'down', talk: 'hint', wander: 2 },
      h: { t: 'npc', id: 'cat', spr: 'cat', dir: 'down', talk: 'cat', wander: 3 },
      m: { t: 'npc', id: 'farmer', spr: 'farmer', dir: 'right', talk: 'farmer' },
      n: { t: 'npc', id: 'woman', spr: 'woman', dir: 'down', talk: 'woman', wander: 2 },
      s: { t: 'sign', talk: 'signVillage' },
      x: { t: 'warp', to: 'field', x: 7, y: 1, dir: 'down', u: '=' },
      y: { t: 'warp', to: 'field', x: 8, y: 1, dir: 'down', u: '=' },
    },
    doors: { '7,4': { to: 'home', x: 5, y: 5, dir: 'up' }, '24,4': { to: 'inn', x: 7, y: 6, dir: 'up' } },
    shopColors: { '4,10': '#b2462f', '23,10': '#2f5d8a', '4,16': '#7a4a8c' },
  };

  MAPS.field = {
    name: '灯ノ野', style: 'field', music: 'field', bg: 'bg-field', ground: '.',
    rows: [
      'TTTTTTTxyTTTTTTTTTTTTTTTTTTTTTT^^^^^^^^^^^^^',
      'T.,....::.....T.......,...T...T^^^^z^^^^^^^^',
      'T......::..............RRRRR..T^^^^:^^^^^^^^',
      'T..,...::..............#NtN#..T^^^^:^^^^^^^^',
      'T......::..............#KKK#a.T^^^^:^^^^^^^^',
      'T.....,::.........p...........T^^^^:^^^^^^^^',
      'T......:::::::::::::::::::::::::r:::^^^^^^^^',
      'T..,...::...""""..........,...T^^^^^^^^^^^^^',
      'T......::.."""""".....T.......TT^^^^^^^^^^^^',
      'T.T....::...""""...c..........TTT^^^^^^^^^^^',
      'T......::.......................TTT^^^^^^^^^',
      'T..,...::.....,.........,...........TT^^^^^^',
      'T......::..................................T',
      'SSSSSSS::SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS',
      '~~~~~~~--~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
      '~~~~~~~--~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
      'SSSSSSS::SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS',
      'T......::..................................T',
      'T.,....::....""""""..........&.....,.......T',
      'T......::...........q.....""""".......T....T',
      'T..T...::....,........."""""".........d....T',
      'T......::.........T..........""""..........T',
      'FFFFFF.::.FFFFFFFF....,..............,.....T',
      'FFFFFFF::FFFFFFFFF.........""""............T',
      'FFFFFFFvwFFFFFFFFFF.....T.......e..........T',
      'FFFFFFFFFFFFFFFFFFFF......."""""..........TT',
      'FFFFFFFFFFFFFFFFFFFFF.....T...........TTTTTT',
      'FFFFFFFFFFFFFFFFFFFFFF..............TTTTTTTT',
      'FFFFFFFFFFFFFFFFFFFFFFFTTTTTTTTTTTTTTTTTTTTT',
    ],
    marks: {
      x: { t: 'warp', to: 'village', x: 15, y: 22, dir: 'up', u: ':' },
      y: { t: 'warp', to: 'village', x: 16, y: 22, dir: 'up', u: ':' },
      z: { t: 'warp', to: 'cave', x: 15, y: 28, dir: 'up', u: ':', cave: true },
      v: { t: 'warp', to: 'forest', x: 17, y: 30, dir: 'up', u: ':', forest: true },
      w: { t: 'warp', to: 'forest', x: 18, y: 30, dir: 'up', u: ':', forest: true },
      t: { t: 'npc', id: 'omitsu', spr: 'teagirl', dir: 'down', talk: 'shopTea', u: 'N', shopKeeper: true },
      a: { t: 'save' },
      p: { t: 'npc', id: 'traveler', spr: 'traveler', dir: 'down', talk: 'traveler', wander: 2 },
      q: { t: 'npc', id: 'lost', spr: 'villager2', dir: 'down', talk: 'lost', wander: 1 },
      r: { t: 'barrier', kind: 'rope', flag: 'rope', talk: 'rope', u: ':' },
      c: { t: 'chest', id: 'f1', item: 'omamori' },
      d: { t: 'chest', id: 'f2', gold: 120 },
      e: { t: 'chest', id: 'f3', item: 'amazake', n: 2 },
    },
    shopColors: { '24,3': '#3d7a55' },
    zones: [
      { x: 0, y: 0, w: 20, h: 13, table: 'field1' },
      { x: 20, y: 0, w: 11, h: 13, table: 'field1', after: 'forest', table2: 'field3' },
      { x: 0, y: 17, w: 44, h: 12, table: 'field2' },
    ],
    rate: [16, 18],
  };

  MAPS.forest = {
    name: '宵ノ森', style: 'forest', music: 'forest', bg: 'bg-forest', ground: ';', dark: 0.25, ambient: 'fireflies',
    rows: [
      'FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF',
      'FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF',
      'FFFFFFFFFFFFFF;;;III;;FFFFFFFFFFFFFF',
      'FFFFFFFFFFFF;;;;;IoI;;;;FFFFFFFFFFFF',
      'FFFFFFFFFFF;;;;;;;;;;;;;;FFFFFFFFFFF',
      'FFFFFFFFFFF;;;;;;;s;;;;;;FFFFFFFFFFF',
      'FFFFFFFFFFFF;;;;;;;;;;;;FFFFFFFFFFFF',
      'FFFFFFFFFFFFFF;;;;;;;;FFFFFFFFFFFFFF',
      'FFFFF;;;FFFFFFFF;;;;FFFFFFFFFFFFFFFF',
      'FFFFF;3;FFFFFFFF;;;;FFFFFFFFFFFFFFFF',
      'FFFFF;;;FFFFFFFFmmmmFFFFFFFFFFFFFFFF',
      'FFFFFF;FFFFFFFF;;;;;;FFFFFFFFFFFFFFF',
      'FFFFFF;FFFFFFFk;;;;;;aFFFFFFFFFFFFFF',
      'FF;;;;;;;;;;;;;;;;;;;;FFFFFFFFFFFFFF',
      'FF;FFFFFFFFFFFF;;;;;;FFFFFFFFFFFFFFF',
      'FF;FFFFFFFFFFFFF;;;;FFFFFFFFFFFeFFFF',
      'F;;;;FFFFFFFFFFF;;;;FFFFFFFFFFF;FFFF',
      'F;1;;FFFFFFFFFFF;;;;;;;;;;;;;;;;FFFF',
      'F;;;;FFFFFFFFFFF;;;;FFFFFFFFFFF;;FFF',
      'FF;FFFFFFFFFFFFF;;;;FFFFFFFFFFF;;FFF',
      'FF;;;;;;;;;;;;;;;;;;FFFFFFFFFFF;;FFF',
      'FFFFFFFF;FFFFFFF;;;;FFFFFFFFFF;;;;FF',
      'FFFFFFFF;FFFFFFF;;;;FFFFFFFFFF;2;;FF',
      'FFFFFFFFcFFFFFFF;;;;FFFFFFFFFF;;;;FF',
      'FFFFFFFFFFFFFFFF;;;;FFFFFFFFFFFFFFFF',
      'FFFFFFFFFFFF;;;;;;;;;;;;FFFFFFFFFFFF',
      'FFFFFFFFFFF;;;;;;;;;;;;;;FFFFFFFFFFF',
      'FFFFFFFFFF;;;;;;;;;;;;;;;;FFFFFFFFFF',
      'FFFFFFFFFF;f;;;;;;;;;;;;g;FFFFFFFFFF',
      'FFFFFFFFFFF;;;;;;;;;;;;;;FFFFFFFFFFF',
      'FFFFFFFFFFFFFFFF;;;;FFFFFFFFFFFFFFFF',
      'FFFFFFFFFFFFFFFFFxyFFFFFFFFFFFFFFFFF',
    ],
    marks: {
      o: { t: 'deco', kind: 'oak', talk: 'oak', big: true },
      s: { t: 'npc', id: 'suzuTrapped', spr: 'suzu', dir: 'down', talk: 'suzuTrapped', hideIf: 'forest', trapped: true },
      m: { t: 'barrier', kind: 'mist', flag: 'mist', talk: 'mist' },
      k: { t: 'sign', talk: 'signForest' },
      a: { t: 'save' },
      1: { t: 'lantern', id: 'L1' },
      2: { t: 'lantern', id: 'L2' },
      3: { t: 'lantern', id: 'L3' },
      c: { t: 'chest', id: 'w1', item: 'kitsuke', n: 2 },
      e: { t: 'chest', id: 'w2', item: 'juzu' },
      f: { t: 'chest', id: 'w3', item: 'dango', n: 3 },
      g: { t: 'chest', id: 'w4', gold: 80 },
      x: { t: 'warp', to: 'field', x: 7, y: 23, dir: 'up' },
      y: { t: 'warp', to: 'field', x: 8, y: 23, dir: 'up' },
    },
    triggers: [{ x: 16, y: 8, w: 4, h: 1, id: 'oakBoss', unless: 'forest' }],
    zones: [{ x: 0, y: 20, w: 36, h: 12, table: 'forestS' }, { x: 0, y: 10, w: 36, h: 10, table: 'forestN' }],
    rate: [13, 14],
  };

  MAPS.cave = {
    name: '鳴き岩の洞', style: 'cave', music: 'cave', bg: 'bg-cave', ground: "'", dark: 0.55, ambient: 'dust',
    rows: [
      'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
      'XXXXXXXXXXXXXXXHHXXXXXXXXXXXXXXXXX',
      "XXXXXXXXXXX~~~~''~~~~XXXXXXXXXXXXX",
      "XXXXXXXXX~~~~~''''~~~~~XXXXXXXXXXX",
      "XXXXXXXX~~~~''bbbb''~~~~XXXXXXXXXX",
      "XXXXXXXX~~~'''''''''''e~~~XXXXXXXX",
      "XXXXXXXX~~''''''''''''''~~XXXXXXXX",
      "XXXXXXXXXXXXXXX''XXXXXXXXXXXXXXXXX",
      "XXXXXXXXXXXXXXX''XXXXXXXXXXXXXXXXX",
      "XXXXXXXXXXXXXXa''XXXXXXXXXXXXXXXXX",
      "XXXXXXXXXXXXXXX''XXXXXXXXXXXXXXXXX",
      "XXXXXXXXXXXXXXX''XXXXXXXXXXXXXXXXX",
      'XXXXXXXXXXXXXXXOOXXXXXXXXXXXXXXXXX',
      'XXXXXXXXXXXCCCCCCCCCCCXXXXXXXXXXXX',
      'XXXXXXXXXXXCCCCCCCCCCCXXXXXXXXXXXX',
      'XXXXXXXXXXXCC1CCCCC2CCXXXXXXXXXXXX',
      'XXXXXXXXXXXCCCCCCCCCCCXXXXXXXXXXXX',
      'XXXXXXXXXXXCCCCCCCCCCCXXXXXXXXXXXX',
      "XXXXXXXXXXXXXXX''XXXXXXXXXXXXXXXXX",
      "XXXXXXXXXXXXXXk''XXXXXXXXXXXXXXXXX",
      "XXXX''''''''''''''''''''''''''XXXX",
      "XXXX'XXXXXXXXXX''XXXXXXXXXXXX'XXXX",
      "XXXXcXXXXXXXXXX''XXXXXXXXXXXXdXXXX",
      "XXXXXXXXXXXXXXX''XXXXXXXXXXXXXXXXX",
      "XXXXXXXXXXXXX''''''XXXXXXXXXXXXXXX",
      "XXXXXXXXXXXX''''''''XXXXXXXXXXXXXX",
      "XXXXXXXXXXXX''''''''XXXXXXXXXXXXXX",
      "XXXXXXXXXXXXXX''''XXXXXXXXXXXXXXXX",
      "XXXXXXXXXXXXXXX''XXXXXXXXXXXXXXXXX",
      'XXXXXXXXXXXXXXXxyXXXXXXXXXXXXXXXXX',
    ],
    marks: {
      b: { t: 'barrier', kind: 'boss', flag: 'cave', talk: 'hanzakiBody' },
      a: { t: 'save' },
      1: { t: 'boulder', u: 'C' },
      2: { t: 'boulder', u: 'C' },
      k: { t: 'sign', talk: 'signCave' },
      c: { t: 'chest', id: 'c1', item: 'yamagami' },
      d: { t: 'chest', id: 'c2', item: 'kumihimo' },
      e: { t: 'chest', id: 'c3', item: 'yomigaeri', n: 2 },
      x: { t: 'warp', to: 'field', x: 35, y: 2, dir: 'down' },
      y: { t: 'warp', to: 'field', x: 35, y: 2, dir: 'down' },
    },
    decos: [{ kind: 'hanzaki', x: 16, y: 4, hideIf: 'cave' }],
    doors: { '15,1': { to: 'shrine', x: 11, y: 28, dir: 'up' }, '16,1': { to: 'shrine', x: 12, y: 28, dir: 'up' } },
    triggers: [{ x: 15, y: 7, w: 2, h: 1, id: 'hanzakiBoss', unless: 'cave' }],
    zones: [{ x: 0, y: 13, w: 34, h: 17, table: 'cave' }, { x: 0, y: 7, w: 34, h: 6, table: 'caveN' }],
    rate: [13, 14],
  };

  MAPS.shrine = {
    name: '奥ノ祠', style: 'shrine', music: 'shrine', bg: 'bg-shrine', ground: ';', dark: 0.45, ambient: 'wisps',
    rows: [
      'TTTTTTTTTTTTTTTTTTTTTTTT',
      'TTTTTQQQQQQQQQQQQQQTTTTT',
      'TTTTTQQQQQQQQQQQQQQTTTTT',
      'TTTTTZZZZYYYYYYZZZZTTTTT',
      'TTTT;;;;L======L;;;;TTTT',
      'TTTT;;;;;==bb==;;;;eTTTT',
      'TTTT;;;;;======;;;;;TTTT',
      'TTTTT;;;;======;;;;TTTTT',
      'TTTTTTT;;I====I;;TTTTTTT',
      'TTTTTTTT;======;TTTTTTTT',
      'TTTTTTTTTTggggTTTTTTTTTT',
      'TTTTTT;;a;====;w;;TTTTTT',
      'TTTT;;;;;;====;;;;;;TTTT',
      'TT1;;;;;;;====;;;;;;;2TT',
      'TTTT;;;;;;====;;;;;;TTTT',
      'TTTTTTT;;;====;;;TTTTTTT',
      'TTTTTTTTL;====;LTTTTTTTT',
      'TTTTTTTTTI====ITTTTTTTTT',
      'TTTTTTTTT;====;TTTTTTTTT',
      'TTTTTTTTT;!!!!;TTTTTTTTT',
      'TTTTTTTTT;!!!!;TTTTTTTTT',
      'TTTTTTTTT;!!!!;TTTTTTTTT',
      'TTTTTTTT;;====;;TTTTTTTT',
      'TTTTTTc;;;====;;;dTTTTTT',
      'TTTTTTT;;;====;;;TTTTTTT',
      'TTTTTTTTTI====ITTTTTTTTT',
      'TTTTTTTTT;====;TTTTTTTTT',
      'TTTTTTTTTT====TTTTTTTTTT',
      'TTTTTTTTTT====TTTTTTTTTT',
      'TTTTTTTTTTTxyTTTTTTTTTTT',
    ],
    marks: {
      b: { t: 'barrier', kind: 'boss', flag: 'cleared', talk: 'yoiguraiBody', u: '=' },
      g: { t: 'barrier', kind: 'shadow', flag: 'kageOpen', talk: 'shadowGate' },
      a: { t: 'save' },
      w: { t: 'deco', kind: 'spring', talk: 'spring' },
      1: { t: 'kage', id: 'kage1' },
      2: { t: 'kage', id: 'kage2' },
      c: { t: 'chest', id: 's1', item: 'yoiake' },
      d: { t: 'chest', id: 's2', item: 'suminesuzu' },
      e: { t: 'chest', id: 's3', item: 'shiroginu' },
      x: { t: 'warp', to: 'cave', x: 15, y: 2, dir: 'down', u: '=' },
      y: { t: 'warp', to: 'cave', x: 16, y: 2, dir: 'down', u: '=' },
    },
    decos: [{ kind: 'torii', x: 9, y: 8, w: 6 }, { kind: 'torii', x: 9, y: 17, w: 6 }, { kind: 'torii', x: 9, y: 25, w: 6 }, { kind: 'yoigurai', x: 12, y: 5, hideIf: 'cleared' }],
    triggers: [{ x: 9, y: 7, w: 6, h: 1, id: 'finalBoss', unless: 'cleared' }],
    zones: [{ x: 0, y: 10, w: 24, h: 20, table: 'shrine' }],
    rate: [13, 12],
  };

  /** parsed map: tiles[y][x] (chars), objects list from marks */
  function parse(id) {
    const m = MAPS[id];
    if (m._parsed) return m._parsed;
    const w = Math.max(...m.rows.map((r) => r.length)), h = m.rows.length;
    const tiles = [], objs = [];
    for (let y = 0; y < h; y++) {
      const row = [];
      for (let x = 0; x < w; x++) {
        let ch = m.rows[y][x] || m.rows[y][m.rows[y].length - 1];
        const mk = m.marks && m.marks[ch];
        if (mk) { const o = Object.assign({}, mk, { x, y, mark: ch }); if (mk.t === 'warp') o.dest = { to: mk.to, x: mk.x, y: mk.y, dir: mk.dir }; objs.push(o); ch = mk.u || m.ground; }
        row.push(ch);
      }
      tiles.push(row);
    }
    m._parsed = { w, h, tiles, objs };
    return m._parsed;
  }

  HR.TILES = TILES;
  HR.MAPS = MAPS;
  HR.parseMap = parse;
  HR.VILLAGE_RETURN = { map: 'village', x: 15, y: 21, dir: 'up' };
  if (typeof module !== 'undefined' && module.exports) module.exports = { TILES, MAPS, parse };
})(typeof window !== 'undefined' ? window : globalThis);
