/*
 * 宵灯りのほこら — data and battle core.
 * Pure data + pure functions (no DOM), so the same file runs in the browser (window.HR) and in Node (require) for the
 * balance simulation (see docs/games/hokora-rpg.md「技術メモ」).
 */
(function (root) {
  'use strict';
  const HR = {};

  /* ---------------- party ---------------- */
  HR.CHARS = {
    koharu: {
      name: 'コハル', role: '祠守の見習い', face: 'face-koharu', weapon: 'staff',
      base: { hp: 36, mp: 12, atk: 9, def: 6, agi: 9, spi: 9 },
      grow: { hp: 6.2, mp: 2.7, atk: 2.2, def: 1.8, agi: 1.5, spi: 2.5 },
      skills: [['tomoshibi', 1], ['hinoko', 2], ['kiyome', 4], ['tamayobi', 7], ['yoibarai', 9], ['hinowa', 12]],
      eq: { w: 'haraegushi', a: 'noragi', c: null },
      desc: '祠守ヨネの孫。灯の術で仲間を癒やし、妖を祓う。',
    },
    genta: {
      name: 'ゲンタ', role: '木こり', face: 'face-genta', weapon: 'axe',
      base: { hp: 46, mp: 5, atk: 12, def: 8, agi: 5, spi: 3 },
      grow: { hp: 8.6, mp: 1.3, atk: 2.9, def: 2.3, agi: 1.1, spi: 0.8 },
      skills: [['onata', 1], ['funbari', 3], ['nagi', 5], ['niou', 7], ['kabuto', 9], ['taiboku', 12]],
      eq: { w: 'teono', a: 'noragi', c: null },
      desc: '里いちばんの力持ち。斧の大技と、仲間をかばう仁王立ち。',
    },
    suzu: {
      name: 'スズ', role: '鈴の付喪神', face: 'face-suzu', weapon: 'bell',
      base: { hp: 28, mp: 20, atk: 5, def: 5, agi: 11, spi: 13 },
      grow: { hp: 4.9, mp: 3.6, atk: 1.2, def: 1.5, agi: 2.0, spi: 2.9 },
      skills: [['suzukaze', 1], ['nemurisuzu', 1], ['mamorisuzu', 1], ['sumine', 8], ['narukami', 10]],
      eq: { w: 'kosuzu', a: 'noragi', c: null },
      desc: '祠の鈴に宿る付喪神。風と音の術で、敵をまとめて相手にする。',
    },
  };
  HR.STAT_NAMES = { hp: 'HP', mp: '気', atk: '攻', def: '守', agi: '速', spi: '霊' };

  /** exp to go from lv to lv+1 */
  HR.expNeed = (lv) => Math.round(9 * Math.pow(lv, 1.8));
  HR.expTotal = (lv) => { let s = 0; for (let i = 1; i < lv; i++) s += HR.expNeed(i); return s; };
  HR.MAX_LV = 30;
  HR.baseStat = (id, lv, k) => Math.floor(HR.CHARS[id].base[k] + HR.CHARS[id].grow[k] * (lv - 1));

  /* ---------------- skills (わざ) ---------------- */
  // target: enemy | enemies | ally | allies | self | dead
  HR.SKILLS = {
    tomoshibi: { name: '灯し火', mp: 3, target: 'ally', type: 'heal', power: 22, k: 1.2, fx: 'heal', desc: '味方ひとりの HP を回復する' },
    hinoko: { name: '火の粉', mp: 2, target: 'enemy', type: 'magic', el: 'fire', power: 12, k: 1.0, fx: 'fire', desc: '敵ひとりに火の術' },
    kiyome: { name: '清め', mp: 2, target: 'ally', type: 'cure', fx: 'holy', desc: '味方ひとりの毒・眠り・しびれ・暗闇を治す' },
    tamayobi: { name: '魂呼び', mp: 8, target: 'dead', type: 'revive', fx: 'holy', desc: '倒れた味方を HP 半分で起こす' },
    yoibarai: { name: '宵祓い', mp: 7, target: 'enemies', type: 'magic', el: 'light', power: 22, k: 1.0, fx: 'holy', desc: '敵すべてに灯の術（影の妖に強い）' },
    hinowa: { name: '灯の輪', mp: 9, target: 'allies', type: 'heal', power: 30, k: 1.0, fx: 'heal', desc: '味方すべての HP を回復する' },
    onata: { name: '大鉈', mp: 2, target: 'enemy', type: 'phys', mult: 1.6, fx: 'slash2', desc: '力をこめた重い一撃' },
    funbari: { name: 'ふんばり', mp: 2, target: 'self', type: 'buff', buff: 'atk', turns: 4, fx: 'buff', desc: '4 ターンのあいだ攻撃が上がる' },
    nagi: { name: '薙ぎ払い', mp: 4, target: 'enemies', type: 'phys', mult: 0.8, fx: 'sweep', desc: '敵すべてを斧で払う' },
    niou: { name: '仁王立ち', mp: 3, target: 'self', type: 'cover', fx: 'buff', desc: 'このターン、味方への攻撃を引き受けて守りを固める', first: true },
    kabuto: { name: '兜割り', mp: 4, target: 'enemy', type: 'phys', mult: 1.25, debuff: 'def', fx: 'slash2', desc: '攻撃し、敵の守りを下げる' },
    taiboku: { name: '大木倒し', mp: 8, target: 'enemy', type: 'phys', mult: 2.6, fx: 'slash3', desc: '渾身の大技' },
    suzukaze: { name: '鈴風', mp: 3, target: 'enemies', type: 'magic', el: 'wind', power: 12, k: 0.8, fx: 'wind', desc: '敵すべてに風の術' },
    nemurisuzu: { name: '眠り鈴', mp: 3, target: 'enemies', type: 'status', status: 'sleep', chance: 0.55, fx: 'bell', desc: '敵すべてを眠らせることがある' },
    mamorisuzu: { name: '守り鈴', mp: 4, target: 'allies', type: 'buff', buff: 'def', turns: 4, fx: 'bell', desc: '4 ターンのあいだ味方すべての守りが上がる', first: true },
    sumine: { name: '澄み音', mp: 5, target: 'allies', type: 'heal', power: 14, k: 0.6, cure: true, fx: 'bell', desc: '味方すべてを少し回復し、状態異常も治す' },
    narukami: { name: '鳴神', mp: 7, target: 'enemy', type: 'magic', el: 'thunder', power: 44, k: 1.5, fx: 'thunder', desc: '敵ひとりに雷の術' },
  };

  /* ---------------- items ---------------- */
  // kind: use (battle & field) | field (field only) | battle (battle only) | key | w / a / c (equipment)
  HR.ITEMS = {
    dango: { name: 'よもぎ団子', kind: 'use', target: 'ally', heal: 40, price: 10, desc: 'HP を 40 回復' },
    omusubi: { name: '梅のおむすび', kind: 'use', target: 'ally', heal: 130, price: 40, desc: 'HP を 130 回復' },
    amazake: { name: '甘酒', kind: 'use', target: 'ally', mpheal: 20, price: 60, desc: '気を 20 回復' },
    dokukeshi: { name: '毒消し草', kind: 'use', target: 'ally', cure: ['poison'], price: 8, desc: '毒を治す' },
    kitsuke: { name: '気付け薬', kind: 'use', target: 'ally', cure: ['poison', 'sleep', 'para', 'dark'], price: 24, desc: '毒・眠り・しびれ・暗闇を治す' },
    yomigaeri: { name: 'よみがえりの香', kind: 'use', target: 'dead', revive: 0.5, price: 150, desc: '倒れた味方を HP 半分で起こす' },
    kemuri: { name: '煙玉', kind: 'battle', target: 'none', flee: true, price: 30, desc: '戦いから必ず逃げられる（主の妖には効かない）' },
    kanshaku: { name: 'かんしゃく玉', kind: 'battle', target: 'enemies', dmg: 36, el: 'fire', price: 40, desc: '敵すべてに 36 前後の火のダメージ' },
    kaerifuda: { name: '里帰りの札', kind: 'field', target: 'none', warp: true, price: 60, desc: '灯ノ里へひと息に帰る（外か洞・森の中で）' },
    hidane: { name: '火種石', kind: 'key', desc: '祠に代々納められてきた、ほのかに温かい石' },
    // weapons
    haraegushi: { name: '祓串', kind: 'w', who: 'staff', atk: 3, price: 20, desc: '紙垂の付いた祓いの串' },
    kashi: { name: '樫の杖', kind: 'w', who: 'staff', atk: 8, spi: 2, price: 80, desc: '軽くて丈夫な杖' },
    ginkushi: { name: '銀の祓串', kind: 'w', who: 'staff', atk: 13, spi: 5, price: 280, desc: '銀の飾りが澄んだ音をたてる' },
    tsukishiro: { name: '月白の薙刀', kind: 'w', who: 'staff', atk: 20, spi: 7, price: 640, desc: '月の光の色をした薙刀' },
    yoiake: { name: '宵明けの杖', kind: 'w', who: 'staff', atk: 27, spi: 12, price: 900, desc: '夜明けの光を宿した杖' },
    teono: { name: '手斧', kind: 'w', who: 'axe', atk: 5, price: 30, desc: 'ゲンタ愛用の薪割り斧' },
    kitaenata: { name: '鍛え鉈', kind: 'w', who: 'axe', atk: 11, price: 100, desc: 'よく鍛えた厚い鉈' },
    hagane: { name: '鋼の斧', kind: 'w', who: 'axe', atk: 18, price: 330, desc: '鍛冶屋ゴロウの自信作' },
    iwakudaki: { name: '岩砕きの大斧', kind: 'w', who: 'axe', atk: 26, price: 720, desc: '岩も割れるという大斧' },
    yamagami: { name: '山神の鉞', kind: 'w', who: 'axe', atk: 34, price: 1000, desc: '山の神に奉納されていた鉞' },
    kosuzu: { name: '小鈴', kind: 'w', who: 'bell', atk: 3, spi: 2, price: 30, desc: 'スズの分身のような小さな鈴' },
    dousuzu: { name: '銅の鈴', kind: 'w', who: 'bell', atk: 6, spi: 6, price: 260, desc: '低く響く銅の鈴' },
    kazakiri: { name: '風切りの扇', kind: 'w', who: 'bell', atk: 10, spi: 11, price: 600, desc: '鈴の付いた鉄扇' },
    suminesuzu: { name: '澄み鈴', kind: 'w', who: 'bell', atk: 13, spi: 17, price: 900, desc: 'どこまでも澄んだ音の鈴' },
    // armor
    noragi: { name: '野良着', kind: 'a', def: 3, price: 20, desc: 'ふだんの仕事着' },
    tabihaori: { name: '旅の羽織', kind: 'a', def: 6, price: 60, desc: '風を通さない羽織' },
    sashiko: { name: '刺し子の上着', kind: 'a', def: 11, price: 180, desc: '糸を重ねて縫った丈夫な上着' },
    kariginu: { name: '狩衣', kind: 'a', def: 14, spi: 5, price: 400, desc: '術の力を高める装束' },
    kusari: { name: '鎖帷子', kind: 'a', def: 18, price: 460, desc: '重いが頼りになる' },
    shiroginu: { name: '白絹の衣', kind: 'a', def: 22, spi: 6, price: 900, desc: '祠に伝わる白い衣' },
    // accessories
    omamori: { name: 'お守り', kind: 'c', def: 3, price: 40, desc: '里の鎮守のお守り' },
    kamihimo: { name: '疾風の髪紐', kind: 'c', agi: 8, price: 200, desc: '身のこなしが軽くなる' },
    tasuki: { name: '力のたすき', kind: 'c', atk: 6, price: 240, desc: '袖をしばると力が出る' },
    netsuke: { name: '毒除けの根付', kind: 'c', def: 2, immune: ['poison'], price: 150, desc: '毒を受けなくなる' },
    juzu: { name: '霊石の数珠', kind: 'c', spi: 8, price: 500, desc: '術の力が上がる' },
    kumihimo: { name: '緋色の組紐', kind: 'c', atk: 4, def: 4, spi: 4, price: 600, desc: '攻・守・霊が少しずつ上がる' },
  };
  HR.SLOT_NAMES = { w: '武器', a: '防具', c: '飾り' };

  HR.SHOPS = {
    weapon: { name: '鍛冶屋「金床屋」', keeper: 'ゴロウ', list: [['kashi'], ['kitaenata'], ['ginkushi', 'forest'], ['hagane', 'forest'], ['dousuzu', 'forest'], ['tsukishiro', 'cave'], ['iwakudaki', 'cave'], ['kazakiri', 'cave']] },
    armor: { name: '仕立て屋「糸車」', keeper: 'おタエ', list: [['tabihaori'], ['omamori'], ['sashiko', 'forest'], ['kamihimo', 'forest'], ['tasuki', 'forest'], ['netsuke', 'forest'], ['kariginu', 'cave'], ['kusari', 'cave']] },
    item: { name: 'よろず屋「豆吉」', keeper: 'マメキチ', list: [['dango'], ['dokukeshi'], ['kitsuke'], ['kemuri'], ['kaerifuda'], ['omusubi', 'forest'], ['amazake', 'forest'], ['kanshaku', 'forest'], ['yomigaeri', 'forest']] },
    tea: { name: '峠の茶屋', keeper: 'おミツ', list: [['dango'], ['omusubi'], ['amazake'], ['dokukeshi'], ['kitsuke'], ['yomigaeri'], ['kaerifuda']] },
  };
  HR.INN_PRICE = 10;

  /* ---------------- enemies ---------------- */
  // act: type phys (mult) | magic (power, uses spi) | status | drain (hp) | drainmp | heal (self) | buff (self def)
  HR.EACTS = {
    attack: { name: null, type: 'phys', mult: 1, target: 'one', fx: 'claw' },
    tailfire: { name: '尻尾の灯', type: 'magic', el: 'fire', power: 6, target: 'one', fx: 'fire' },
    kick: { name: '一本足蹴り', type: 'phys', mult: 1.4, target: 'one', fx: 'claw' },
    fireball: { name: '鬼灯の火', type: 'magic', el: 'fire', power: 7, target: 'one', fx: 'fire' },
    roll: { name: 'ごろごろ転がり', type: 'phys', mult: 1.35, target: 'one', fx: 'claw' },
    harden: { name: '苔むし', type: 'buff', buff: 'def', target: 'self', fx: 'buff' },
    sleepspore: { name: 'ねむり胞子', type: 'status', status: 'sleep', chance: 0.45, target: 'one', fx: 'spore' },
    poisonspore: { name: '毒の胞子', type: 'magic', power: 5, status: 'poison', chance: 0.55, target: 'one', fx: 'spore' },
    whip: { name: '根の鞭', type: 'phys', mult: 1.2, target: 'one', fx: 'claw' },
    branches: { name: '枝払い', type: 'phys', mult: 0.72, target: 'all', fx: 'sweepE' },
    sap: { name: '樹液吸い', type: 'drain', mult: 1.0, target: 'one', fx: 'drain' },
    leafstorm: { name: '木の葉嵐', type: 'magic', el: 'wind', power: 16, target: 'all', fx: 'leaves' },
    pinch: { name: 'はさみ打ち', type: 'phys', mult: 1.5, target: 'one', fx: 'claw' },
    shell: { name: '甲羅ごもり', type: 'buff', buff: 'def', target: 'self', fx: 'buff' },
    windcry: { name: '風鳴り', type: 'magic', el: 'wind', power: 10, target: 'all', fx: 'windE' },
    echo: { name: '鳴き響き', type: 'status', status: 'para', chance: 0.4, target: 'one', fx: 'echo' },
    slam: { name: 'のしかかり', type: 'phys', mult: 1.45, target: 'one', fx: 'quake' },
    bubbles: { name: '泡しぶき', type: 'magic', power: 18, status: 'poison', chance: 0.3, target: 'all', fx: 'bubbles' },
    tail: { name: '尾びれ打ち', type: 'phys', mult: 0.8, target: 'all', fx: 'sweepE' },
    bathe: { name: '湖の水浴び', type: 'heal', power: 90, buff: 'def', target: 'self', fx: 'healE' },
    bite: { name: '噛みつき', type: 'phys', mult: 1.35, target: 'one', fx: 'claw' },
    howl: { name: '影の遠吠え', type: 'status', status: 'dark', chance: 0.35, target: 'all', fx: 'echo' },
    onibi: { name: '鬼火', type: 'magic', el: 'fire', power: 16, target: 'all', fx: 'fireE' },
    drainki: { name: '灯吸い', type: 'drainmp', power: 8, target: 'one', fx: 'drain' },
    claw: { name: '影の爪', type: 'phys', mult: 1.3, target: 'one', fx: 'claw' },
    veil: { name: '闇の帳', type: 'status', status: 'dark', chance: 0.4, target: 'all', fx: 'dark' },
    devour: { name: '灯喰い', type: 'drainmp', power: 6, target: 'all', fx: 'drain' },
    wave: { name: '宵の大波', type: 'magic', power: 30, target: 'all', fx: 'darkwave' },
    grasp: { name: '影つかみ', type: 'phys', mult: 0.95, target: 'all', fx: 'sweepE' },
    eclipse: { name: '月喰み', type: 'magic', power: 38, target: 'all', fx: 'darkwave' },
  };

  // size: drawn height on the battle screen (logical px). img: images.json name.
  HR.ENEMIES = {
    nezumi: { name: 'ちょうちんねずみ', img: 'm-nezumi', size: 58, hp: 11, atk: 8, def: 3, agi: 8, spi: 5, exp: 5, gold: 4, drop: ['dango', 0.12], weak: ['wind'], acts: [['attack', 3], ['tailfire', 1]] },
    kakashi: { name: 'かかしぼう', img: 'm-kakashi', size: 80, hp: 18, atk: 10, def: 5, agi: 4, spi: 2, exp: 8, gold: 6, drop: ['dango', 0.1], weak: ['fire'], acts: [['attack', 3], ['kick', 1]] },
    hozuki: { name: 'ほおずき火', img: 'm-hozuki', size: 60, hp: 13, atk: 6, def: 3, agi: 10, spi: 9, exp: 8, gold: 7, drop: ['dokukeshi', 0.1], weak: ['wind'], resist: ['fire'], acts: [['attack', 1], ['fireball', 2]] },
    kokedaruma: { name: 'こけだるま', img: 'm-kokedaruma', size: 70, hp: 36, atk: 14, def: 13, agi: 3, spi: 4, exp: 20, gold: 14, drop: ['dango', 0.2], weak: ['fire', 'thunder'], acts: [['attack', 2], ['roll', 2], ['harden', 1]] },
    kasamaru: { name: 'かさまる', img: 'm-kasamaru', size: 68, hp: 28, atk: 12, def: 7, agi: 8, spi: 8, exp: 18, gold: 13, drop: ['dokukeshi', 0.25], weak: ['fire'], acts: [['attack', 2], ['sleepspore', 1], ['poisonspore', 1]] },
    iwagani: { name: 'いわがに', img: 'm-iwagani', size: 66, hp: 92, atk: 25, def: 26, agi: 6, spi: 4, exp: 50, gold: 40, drop: ['omusubi', 0.15], weak: ['thunder'], acts: [['attack', 2], ['pinch', 2], ['shell', 1]] },
    kazetsuzumi: { name: 'かぜつづみ', img: 'm-kazetsuzumi', size: 66, hp: 72, atk: 20, def: 12, agi: 14, spi: 15, exp: 46, gold: 38, drop: ['amazake', 0.12], weak: ['fire'], resist: ['wind'], acts: [['attack', 1], ['windcry', 2], ['echo', 1]] },
    yamikoma: { name: 'やみこま', img: 'm-yamikoma', size: 78, hp: 150, atk: 36, def: 24, agi: 15, spi: 10, exp: 135, gold: 60, drop: ['omusubi', 0.2], weak: ['light'], acts: [['attack', 2], ['bite', 2], ['howl', 1]] },
    kagedoro: { name: 'かげどうろう', img: 'm-kagedoro', size: 84, hp: 140, atk: 28, def: 30, agi: 7, spi: 26, exp: 128, gold: 64, drop: ['amazake', 0.2], weak: ['light'], resist: ['fire'], acts: [['onibi', 2], ['attack', 1], ['drainki', 1]] },
    // bosses
    nejiregashi: {
      name: 'ねじれ樫', img: 'b-nejiregashi', size: 150, boss: true, hp: 450, atk: 27, def: 12, agi: 6, spi: 12, exp: 240, gold: 200, weak: ['fire'],
      cycle: ['whip', 'branches', 'whip', 'sap'], low: { at: 0.5, cycle: ['leafstorm', 'whip', 'sap', 'branches'], msg: 'ねじれ樫の枝が、ざわざわと逆立った！' },
    },
    hanzaki: {
      name: 'はんざき大主', img: 'b-hanzaki', size: 140, boss: true, hp: 760, atk: 34, def: 20, agi: 8, spi: 18, exp: 700, gold: 600, weak: ['thunder'], immune: ['sleep'],
      cycle: ['slam', 'bubbles', 'tail', 'slam', 'bathe'], low: { at: 0.4, cycle: ['slam', 'bubbles', 'tail', 'slam'], twice: true, msg: 'はんざき大主が、怒りで身をふるわせている！' },
    },
    yoigurai: {
      name: '宵喰らい', img: 'b-yoigurai', size: 170, boss: true, hp: 1350, atk: 44, def: 26, agi: 16, spi: 32, exp: 0, gold: 0, weak: ['light'], immune: ['sleep', 'para'],
      cycle: ['claw', 'veil', 'claw', 'devour', 'wave'], low: { at: 0.5, cycle: ['claw', 'wave', 'grasp', 'claw', 'eclipse', 'devour'], twice: true, name: '宵喰らい・真', msg: '宵喰らいの影がふくれあがり、真の姿をあらわした！' },
    },
  };

  /** encounter tables: groups of enemy ids */
  HR.TABLES = {
    field1: [['nezumi'], ['nezumi'], ['nezumi', 'nezumi'], ['kakashi'], ['hozuki'], ['nezumi', 'hozuki']],
    field2: [['nezumi', 'nezumi', 'hozuki'], ['kakashi', 'nezumi'], ['hozuki', 'hozuki'], ['kakashi', 'kakashi'], ['kasamaru']],
    field3: [['kokedaruma', 'kasamaru'], ['kakashi', 'kakashi', 'hozuki'], ['kasamaru', 'kasamaru'], ['kokedaruma', 'hozuki', 'hozuki']],
    forestS: [['kasamaru', 'nezumi'], ['kokedaruma'], ['hozuki', 'hozuki', 'nezumi'], ['kakashi', 'kakashi'], ['kasamaru']],
    forestN: [['kokedaruma', 'kasamaru'], ['kasamaru', 'kasamaru', 'hozuki'], ['kokedaruma', 'hozuki', 'hozuki'], ['kakashi', 'kokedaruma']],
    cave: [['iwagani'], ['kazetsuzumi', 'kazetsuzumi'], ['iwagani', 'kazetsuzumi'], ['kokedaruma', 'kokedaruma', 'kazetsuzumi']],
    caveN: [['iwagani', 'iwagani'], ['kazetsuzumi', 'kazetsuzumi', 'kazetsuzumi'], ['iwagani', 'kazetsuzumi']],
    shrine: [['yamikoma'], ['kagedoro', 'yamikoma'], ['yamikoma', 'yamikoma'], ['kagedoro', 'kagedoro'], ['kazetsuzumi', 'yamikoma', 'kazetsuzumi']],
  };
  HR.GROUPS = {
    gentaEvent: ['nezumi', 'kakashi', 'nezumi'],
    oak: ['nejiregashi'],
    hanzaki: ['hanzaki'],
    kage: ['kagedoro', 'kagedoro'],
    final: ['yoigurai'],
  };

  HR.STATUS = {
    poison: { name: '毒', color: '#9b6bd6' },
    sleep: { name: '眠り', color: '#6b9bd6' },
    para: { name: 'しびれ', color: '#e0c040' },
    dark: { name: '暗闇', color: '#555a70' },
  };
  HR.EL_NAMES = { fire: '火', wind: '風', thunder: '雷', light: '灯' };

  /* ---------------- actors ---------------- */
  /** stats of a party member from its level and equipment */
  HR.charStats = function (id, c) {
    const s = {};
    for (const k of ['hp', 'mp', 'atk', 'def', 'agi', 'spi']) s[k] = HR.baseStat(id, c.lv, k);
    s.immune = [];
    for (const slot of ['w', 'a', 'c']) {
      const it = c.eq[slot] && HR.ITEMS[c.eq[slot]];
      if (!it) continue;
      for (const k of ['atk', 'def', 'agi', 'spi']) if (it[k]) s[k] += it[k];
      if (it.immune) s.immune.push(...it.immune);
    }
    return s;
  };
  HR.skillsAt = (id, lv) => HR.CHARS[id].skills.filter(([, l]) => l <= lv).map(([k]) => k);
  HR.canEquip = (id, itemId) => { const it = HR.ITEMS[itemId]; if (!it) return false; if (it.kind === 'w') return it.who === HR.CHARS[id].weapon; return it.kind === 'a' || it.kind === 'c'; };

  /** a battle actor for a party member (c = save data of the member) */
  HR.partyActor = function (id, c) {
    const s = HR.charStats(id, c);
    return { side: 'p', id, name: HR.CHARS[id].name, hp: Math.min(c.hp, s.hp), mhp: s.hp, mp: Math.min(c.mp, s.mp), mmp: s.mp, atk: s.atk, def: s.def, agi: s.agi, spi: s.spi, immune: s.immune, weak: [], resist: [], st: {}, buf: {}, skills: HR.skillsAt(id, c.lv) };
  };
  const LETTERS = 'ＡＢＣＤ';
  HR.enemyActors = function (ids) {
    const count = {};
    ids.forEach((id) => (count[id] = (count[id] || 0) + 1));
    const seen = {};
    return ids.map((id) => {
      const d = HR.ENEMIES[id];
      seen[id] = (seen[id] || 0) + 1;
      const name = count[id] > 1 ? d.name + LETTERS[seen[id] - 1] : d.name;
      return { side: 'e', id, name, baseName: d.name, hp: d.hp, mhp: d.hp, mp: 0, mmp: 0, atk: d.atk, def: d.def, agi: d.agi, spi: d.spi, weak: d.weak || [], resist: d.resist || [], immune: d.immune || [], st: {}, buf: {}, boss: !!d.boss, turn: 0, phase: 1 };
    });
  };

  /* ---------------- battle math ---------------- */
  const alive = (a) => a.hp > 0;
  HR.alive = alive;
  const effAtk = (a) => a.atk * (a.buf.atk ? 1.4 : 1);
  const effDef = (a) => a.def * (a.buf.def ? 1.5 : 1) * (a.buf.defdown ? 0.6 : 1);
  HR.physDmg = (atk, def, mult, r) => Math.max(1, Math.round((atk * mult - def * 0.5) * (0.88 + r * 0.24)));
  HR.magDmg = (power, spi, k, tspi, r) => Math.max(1, Math.round((power + spi * k - tspi * 0.25) * (0.9 + r * 0.2)));
  HR.healAmt = (power, spi, k, r) => Math.round((power + spi * k) * (0.95 + r * 0.1));
  const elMult = (t, el) => (!el ? 1 : t.weak.includes(el) ? 1.5 : t.resist.includes(el) ? 0.5 : 1);
  const msgDmg = (t, n) => (t.side === 'e' ? `${t.name}に ${n} のダメージ！` : `${t.name}は ${n} のダメージを受けた！`);
  const stMsg = { poison: 'は毒におかされた！', sleep: 'は眠ってしまった！', para: 'はしびれて動けなくなった！', dark: 'は目の前が暗くなった！' };
  const stTurns = { poison: 99, sleep: 3, para: 2, dark: 3 };

  function damage(b, t, n, ev, extra) {
    if (t.guard) n = Math.max(1, Math.round(n * 0.5));
    n = Math.min(n, 9999);
    t.hp = Math.max(0, t.hp - n);
    ev.push(Object.assign({ type: 'dmg', target: t, amount: n, after: t.hp }, extra || {}));
    ev.push({ type: 'msg', text: msgDmg(t, n) });
    if (t.st.sleep && t.hp > 0 && b.rnd() < 0.5) { delete t.st.sleep; ev.push({ type: 'msg', text: `${t.name}は目を覚ました！` }); ev.push({ type: 'st', target: t }); }
    if (t.hp <= 0) die(t, ev);
  }
  function die(t, ev) {
    t.st = {}; t.buf = {};
    ev.push({ type: 'die', target: t });
    ev.push({ type: 'msg', text: t.side === 'e' ? (HR.ENEMIES[t.id].boss ? `${t.name}をしずめた！` : `${t.name}はおとなしくなって、去っていった！`) : `${t.name}は倒れてしまった……` });
  }
  function inflict(b, t, st, chance, ev) {
    if (!alive(t)) return;
    if (t.immune.includes(st) || (t.boss && st !== 'poison' && st !== 'dark') || b.rnd() >= chance) { ev.push({ type: 'msg', text: `${t.name}には効かなかった。` }); return; }
    if (t.st[st]) { ev.push({ type: 'msg', text: `${t.name}には効かなかった。` }); return; }
    t.st[st] = st === 'sleep' ? 1 + Math.floor(b.rnd() * 3) : stTurns[st];
    ev.push({ type: 'st', target: t, st });
    ev.push({ type: 'msg', text: t.name + stMsg[st] });
  }
  function healTo(t, n, ev) {
    const before = t.hp; t.hp = Math.min(t.mhp, t.hp + n);
    ev.push({ type: 'heal', target: t, amount: t.hp - before, after: t.hp });
    ev.push({ type: 'msg', text: `${t.name}の HP が ${t.hp - before} 回復した！` });
  }
  function cure(t, list, ev) {
    let any = false;
    for (const s of list) if (t.st[s]) { delete t.st[s]; any = true; }
    ev.push({ type: 'st', target: t });
    if (any) ev.push({ type: 'msg', text: `${t.name}の体が軽くなった！` });
    return any;
  }
  function buff(t, key, turns, ev) {
    if (key === 'defdown') { t.buf.defdown = turns; ev.push({ type: 'buff', target: t, key }); ev.push({ type: 'msg', text: `${t.name}の守りが下がった！` }); return; }
    t.buf[key] = turns;
    ev.push({ type: 'buff', target: t, key });
    ev.push({ type: 'msg', text: key === 'atk' ? `${t.name}の力がみなぎった！` : `${t.name}の守りが上がった！` });
  }
  /** a target still standing: the chosen one, or another of the same side */
  function retarget(b, t, side) {
    if (t && alive(t)) return t;
    const list = (side === 'e' ? b.foes : b.party).filter(alive);
    return list.length ? list[Math.floor(b.rnd() * list.length)] : null;
  }
  const foesOf = (b, a) => (a.side === 'p' ? b.foes : b.party);
  const friendsOf = (b, a) => (a.side === 'p' ? b.party : b.foes);
  /** cover: Genta's 仁王立ち takes single-target hits aimed at an ally */
  function coverFor(b, t) {
    if (t.side !== 'p') return t;
    const g = b.party.find((p) => p !== t && p.cover && alive(p) && !p.st.sleep && !p.st.para);
    return g || t;
  }

  /**
   * Resolves one action and returns the events (for animation). State changes happen here.
   * act = { kind: 'attack'|'skill'|'item'|'guard'|'eact', skill, item, act, target }
   */
  HR.resolve = function (b, a, act) {
    const ev = [];
    if (!alive(a)) return ev;
    if (a.st.sleep) { ev.push({ type: 'msg', text: `${a.name}は眠っている……` }); return ev; }
    if (a.st.para && b.rnd() < 0.7) { ev.push({ type: 'msg', text: `${a.name}はしびれて動けない！` }); return ev; }
    const r = b.rnd;
    if (act.kind === 'guard') { ev.push({ type: 'msg', text: `${a.name}は身を守っている。` }); return ev; }
    if (act.kind === 'attack' || (act.kind === 'eact' && HR.EACTS[act.act].type === 'phys' && HR.EACTS[act.act].target === 'one')) {
      const ea = act.kind === 'eact' ? HR.EACTS[act.act] : null;
      let t = retarget(b, act.target, a.side === 'p' ? 'e' : 'p');
      if (!t) return ev;
      ev.push({ type: 'msg', text: ea && ea.name ? `${a.name}の${ea.name}！` : `${a.name}のこうげき！` });
      t = coverFor(b, t);
      if (t !== act.target && act.target && act.target.side === 'p' && alive(act.target)) ev.push({ type: 'msg', text: `${t.name}が仁王立ちで受け止めた！` });
      ev.push({ type: 'fx', fx: ea ? ea.fx : (a.side === 'p' ? 'slash' : 'claw'), targets: [t], from: a });
      const hit = a.st.dark ? 0.5 : 0.96;
      if (r() > hit) { ev.push({ type: 'miss', target: t }); ev.push({ type: 'msg', text: `${t.name}はひらりとかわした！` }); return ev; }
      const crit = r() < (a.side === 'p' ? 0.05 : 0.02);
      let n = HR.physDmg(effAtk(a), effDef(t), (ea ? ea.mult : 1) * (crit ? 1.5 : 1), r());
      if (t.cover) n = Math.max(1, Math.round(n * 0.6));
      if (crit) ev.push({ type: 'msg', text: 'するどい一撃！' });
      damage(b, t, n, ev, { crit });
      return ev;
    }
    if (act.kind === 'skill') {
      const sk = HR.SKILLS[act.skill];
      if (a.mp < sk.mp) { ev.push({ type: 'msg', text: `${a.name}は${sk.name}を使おうとしたが、気が足りない！` }); return ev; }
      a.mp -= sk.mp;
      ev.push({ type: 'mp', target: a, after: a.mp });
      ev.push({ type: 'msg', text: `${a.name}の${sk.name}！` });
      return ev.concat(applyEffect(b, a, sk, act.target, 'skill'));
    }
    if (act.kind === 'item') {
      const it = HR.ITEMS[act.item];
      ev.push({ type: 'msg', text: `${a.name}は${it.name}を使った！` });
      ev.push({ type: 'useItem', item: act.item });
      if (it.flee) { ev.push({ type: 'flee', ok: !b.boss }); if (b.boss) ev.push({ type: 'msg', text: 'しかし、主の妖からは逃げられない！' }); return ev; }
      if (it.dmg) {
        const ts = b.foes.filter(alive);
        ev.push({ type: 'fx', fx: 'fireE', targets: ts, from: a, onEnemies: true });
        ts.forEach((t) => damage(b, t, Math.max(1, Math.round(it.dmg * elMult(t, it.el) * (0.9 + r() * 0.2))), ev, { weak: elMult(t, it.el) > 1 }));
        return ev;
      }
      let t = act.target;
      if (it.revive) {
        if (!t || alive(t)) { ev.push({ type: 'msg', text: 'しかし、何も起こらなかった。' }); return ev; }
        t.hp = Math.max(1, Math.round(t.mhp * it.revive));
        ev.push({ type: 'fx', fx: 'holy', targets: [t] }); ev.push({ type: 'revive', target: t, after: t.hp });
        ev.push({ type: 'msg', text: `${t.name}が起き上がった！` });
        return ev;
      }
      if (!t || !alive(t)) t = retarget(b, null, a.side);
      if (!t) return ev;
      ev.push({ type: 'fx', fx: 'heal', targets: [t] });
      if (it.heal) healTo(t, it.heal, ev);
      if (it.mpheal) { const before = t.mp; t.mp = Math.min(t.mmp, t.mp + it.mpheal); ev.push({ type: 'mp', target: t, after: t.mp }); ev.push({ type: 'msg', text: `${t.name}の気が ${t.mp - before} 回復した！` }); }
      if (it.cure && !cure(t, it.cure, ev)) ev.push({ type: 'msg', text: 'しかし、何も起こらなかった。' });
      return ev;
    }
    if (act.kind === 'eact') {
      const ea = HR.EACTS[act.act];
      ev.push({ type: 'msg', text: ea.name ? `${a.name}の${ea.name}！` : `${a.name}のこうげき！` });
      return ev.concat(applyEffect(b, a, ea, act.target, 'eact'));
    }
    return ev;
  };

  function applyEffect(b, a, sk, target, src) {
    const ev = [];
    const r = b.rnd;
    const foes = foesOf(b, a), friends = friendsOf(b, a);
    let ts;
    const tgt = sk.target;
    if (tgt === 'enemies' || tgt === 'all') ts = foes.filter(alive);
    else if (tgt === 'allies') ts = friends.filter(alive);
    else if (tgt === 'self') ts = [a];
    else if (tgt === 'dead') ts = target && !alive(target) ? [target] : [];
    else if (tgt === 'ally') ts = [retarget(b, target, a.side)].filter(Boolean);
    else { const t0 = retarget(b, target, a.side === 'p' ? 'e' : 'p'); ts = t0 ? [sk.type === 'phys' || sk.type === 'drain' ? coverFor(b, t0) : t0] : []; }
    if (!ts.length) { ev.push({ type: 'msg', text: 'しかし、何も起こらなかった。' }); return ev; }
    ev.push({ type: 'fx', fx: sk.fx, targets: ts, from: a });
    switch (sk.type) {
      case 'phys':
        ts.forEach((t) => {
          if (a.st.dark && r() > 0.5) { ev.push({ type: 'miss', target: t }); ev.push({ type: 'msg', text: `${t.name}はひらりとかわした！` }); return; }
          let n = HR.physDmg(effAtk(a), effDef(t), sk.mult, r());
          if (t.cover) n = Math.max(1, Math.round(n * 0.6));
          damage(b, t, n, ev);
          if (sk.debuff && alive(t)) buff(t, 'defdown', 3, ev);
        });
        break;
      case 'magic':
        ts.forEach((t) => {
          const m = elMult(t, sk.el);
          const n = Math.round(HR.magDmg(sk.power, a.spi, sk.k == null ? 0.5 : sk.k, t.spi, r()) * m);
          if (m > 1) ev.push({ type: 'msg', text: '弱点をついた！' });
          if (m < 1) ev.push({ type: 'msg', text: 'あまり効いていない……' });
          damage(b, t, Math.max(1, n), ev, { weak: m > 1 });
          if (sk.status && alive(t)) inflict(b, t, sk.status, sk.chance, ev);
        });
        break;
      case 'status':
        ts.forEach((t) => inflict(b, t, sk.status, sk.chance, ev));
        break;
      case 'heal':
        ts.forEach((t) => {
          healTo(t, src === 'eact' ? sk.power : HR.healAmt(sk.power, a.spi, sk.k, r()), ev);
          if (sk.cure) cure(t, ['poison', 'sleep', 'para', 'dark'], ev);
          if (sk.buff) buff(t, sk.buff, 3, ev);
        });
        break;
      case 'cure':
        ts.forEach((t) => { if (!cure(t, ['poison', 'sleep', 'para', 'dark'], ev)) ev.push({ type: 'msg', text: 'しかし、何も起こらなかった。' }); });
        break;
      case 'revive':
        ts.forEach((t) => { t.hp = Math.max(1, Math.round(t.mhp * 0.5)); ev.push({ type: 'revive', target: t, after: t.hp }); ev.push({ type: 'msg', text: `${t.name}が起き上がった！` }); });
        break;
      case 'buff':
        ts.forEach((t) => buff(t, sk.buff, sk.turns || 3, ev));
        break;
      case 'cover':
        a.cover = true; a.buf.def = Math.max(a.buf.def || 0, 1);
        ev.push({ type: 'buff', target: a, key: 'def' });
        ev.push({ type: 'msg', text: `${a.name}は仲間の前に立ちはだかった！` });
        break;
      case 'drain':
        ts.forEach((t) => {
          const n = HR.physDmg(effAtk(a), effDef(t), sk.mult, r());
          damage(b, t, n, ev);
          const before = a.hp; a.hp = Math.min(a.mhp, a.hp + n);
          ev.push({ type: 'heal', target: a, amount: a.hp - before, after: a.hp });
        });
        break;
      case 'drainmp':
        ts.forEach((t) => {
          const n = Math.min(t.mp, sk.power);
          t.mp -= n;
          ev.push({ type: 'mp', target: t, after: t.mp });
          ev.push({ type: 'msg', text: n ? `${t.name}の気を ${n} 吸い取られた！` : `${t.name}には吸い取る気がない。` });
        });
        break;
    }
    return ev;
  }

  /** enemy decision */
  HR.enemyChoose = function (b, e) {
    const d = HR.ENEMIES[e.id];
    const party = b.party.filter(alive);
    const pickTarget = () => {
      // prefer the front (koharu is the leader), a little random
      const w = party.map((p, i) => (i === 0 ? 1.3 : 1));
      let s = w.reduce((x, y) => x + y, 0) * b.rnd();
      for (let i = 0; i < party.length; i++) { s -= w[i]; if (s <= 0) return party[i]; }
      return party[party.length - 1];
    };
    let key;
    if (d.boss) {
      const lowP = d.low && e.hp <= e.mhp * d.low.at;
      const cyc = lowP ? d.low.cycle : d.cycle;
      key = cyc[e.turn % cyc.length];
      e.turn++;
      if (key === 'bathe' && e.hp > e.mhp * 0.75) key = 'slam';
    } else {
      const tot = d.acts.reduce((s, x) => s + x[1], 0);
      let r = b.rnd() * tot;
      for (const [k, w] of d.acts) { r -= w; if (r <= 0) { key = k; break; } }
      key = key || 'attack';
      if ((key === 'harden' || key === 'shell') && e.buf.def) key = 'attack';
    }
    return { kind: 'eact', act: key, target: pickTarget() };
  };
  /** the second action of a boss in its angry phase */
  HR.bossTwice = (e) => { const d = HR.ENEMIES[e.id]; return !!(d.boss && d.low && d.low.twice && e.hp <= e.mhp * d.low.at); };

  /** order of the round: agility with a little luck; 'first' skills go first */
  HR.order = function (b, list) {
    return list.map((x) => ({ x, k: (x.first ? 1000 : 0) + x.actor.agi * (0.75 + b.rnd() * 0.5) })).sort((p, q) => q.k - p.k).map((p) => p.x);
  };

  /** end of a round: poison, status timers, buffs */
  HR.endRound = function (b) {
    const ev = [];
    for (const a of b.party.concat(b.foes)) {
      a.guard = false; a.cover = false;
      if (!alive(a)) continue;
      if (a.st.poison) {
        const n = Math.max(2, Math.round(a.mhp * (a.boss ? 0.03 : 0.08)));
        a.hp = Math.max(a.side === 'p' ? 1 : 0, a.hp - n);
        ev.push({ type: 'dmg', target: a, amount: n, after: a.hp, poison: true });
        ev.push({ type: 'msg', text: `${a.name}は毒で ${n} のダメージ！` });
        if (a.hp <= 0) die(a, ev);
      }
      for (const s of ['sleep', 'para', 'dark']) if (a.st[s]) { a.st[s]--; if (a.st[s] <= 0) { delete a.st[s]; ev.push({ type: 'st', target: a }); ev.push({ type: 'msg', text: s === 'sleep' ? `${a.name}は目を覚ました！` : s === 'para' ? `${a.name}のしびれがとれた！` : `${a.name}の目が見えるようになった！` }); } }
      for (const k of Object.keys(a.buf)) { a.buf[k]--; if (a.buf[k] <= 0) { delete a.buf[k]; ev.push({ type: 'buff', target: a, key: null }); } }
    }
    return ev;
  };

  HR.fleeChance = function (b) {
    if (b.boss) return 0;
    const pa = b.party.filter(alive), fa = b.foes.filter(alive);
    const avg = (l) => l.reduce((s, x) => s + x.agi, 0) / Math.max(1, l.length);
    return Math.max(0.3, Math.min(0.95, 0.6 + (avg(pa) - avg(fa)) * 0.03 + (b.fleeTries || 0) * 0.15));
  };

  HR.rewards = function (b) {
    let exp = 0, gold = 0; const drops = [];
    for (const e of b.foes) {
      const d = HR.ENEMIES[e.id];
      exp += d.exp; gold += d.gold;
      if (d.drop && b.rnd() < d.drop[1]) drops.push(d.drop[0]);
    }
    return { exp, gold, drops };
  };

  /**
   * a simple player for auto-battle (used by the Node simulation and the self-test):
   * heal when someone is low, use strong skills on bosses, else attack.
   */
  HR.autoChoose = function (b, a, inv) {
    const party = b.party, foes = b.foes.filter(alive);
    const low = party.filter((p) => alive(p) && p.hp < p.mhp * 0.4).sort((p, q) => p.hp / p.mhp - q.hp / q.mhp)[0];
    const dead = party.find((p) => !alive(p));
    const has = (s) => a.skills.includes(s) && a.mp >= HR.SKILLS[s].mp;
    const weakest = foes.slice().sort((p, q) => p.hp - q.hp)[0];
    const strongest = foes.slice().sort((p, q) => q.hp - p.hp)[0];
    if (dead && has('tamayobi')) return { kind: 'skill', skill: 'tamayobi', target: dead };
    if (dead && inv && inv.yomigaeri > 0 && b.boss) return { kind: 'item', item: 'yomigaeri', target: dead };
    const lowCount = party.filter((p) => alive(p) && p.hp < p.mhp * 0.5).length;
    if (lowCount >= 2 && has('hinowa')) return { kind: 'skill', skill: 'hinowa' };
    if (low && has('tomoshibi')) return { kind: 'skill', skill: 'tomoshibi', target: low };
    if (lowCount >= 2 && has('sumine')) return { kind: 'skill', skill: 'sumine' };
    if (low && inv && inv.omusubi > 0 && low.hp < low.mhp * 0.3) return { kind: 'item', item: 'omusubi', target: low };
    if (low && inv && inv.dango > 0 && low.hp < low.mhp * 0.3) return { kind: 'item', item: 'dango', target: low };
    const ailing = party.find((p) => alive(p) && (p.st.poison || p.st.sleep || p.st.para) && p !== a);
    if (ailing && has('kiyome') && b.boss) return { kind: 'skill', skill: 'kiyome', target: ailing };
    const mpOk = (s, frac) => has(s) && (b.boss || a.mp > a.mmp * frac);
    if (a.id === 'genta') {
      if (b.boss && !a.buf.atk && has('funbari') && b.round < 2) return { kind: 'skill', skill: 'funbari' };
      if (b.boss && has('taiboku')) return { kind: 'skill', skill: 'taiboku', target: strongest };
      if (foes.length >= 3 && mpOk('nagi', 0.3)) return { kind: 'skill', skill: 'nagi' };
      if (b.boss && has('onata')) return { kind: 'skill', skill: 'onata', target: strongest };
      return { kind: 'attack', target: weakest };
    }
    if (a.id === 'suzu') {
      if (b.boss && b.round === 0 && has('mamorisuzu')) return { kind: 'skill', skill: 'mamorisuzu' };
      if (b.boss && has('narukami')) return { kind: 'skill', skill: 'narukami', target: strongest };
      if (foes.length >= 2 && mpOk('suzukaze', 0.4)) return { kind: 'skill', skill: 'suzukaze' };
      if (b.boss && has('suzukaze')) return { kind: 'skill', skill: 'suzukaze' };
      return { kind: 'attack', target: weakest };
    }
    // koharu
    const shadow = foes.some((f) => f.weak.includes('light'));
    if ((b.boss || (foes.length >= 2 && shadow)) && mpOk('yoibarai', 0.5)) return { kind: 'skill', skill: 'yoibarai' };
    const fireWeak = foes.find((f) => f.weak.includes('fire'));
    if (fireWeak && mpOk('hinoko', 0.6)) return { kind: 'skill', skill: 'hinoko', target: fireWeak };
    return { kind: 'attack', target: weakest };
  };

  /* ---------------- images used by the game (see images.json) ---------------- */
  HR.IMAGES = ['key', 'title-bg', 'cg-ending', 'bg-field', 'bg-forest', 'bg-cave', 'bg-shrine',
    'face-koharu', 'face-koharu-2', 'face-genta', 'face-genta-2', 'face-suzu', 'face-suzu-2',
    'm-nezumi', 'm-kakashi', 'm-hozuki', 'm-kokedaruma', 'm-kasamaru', 'm-iwagani', 'm-kazetsuzumi', 'm-yamikoma', 'm-kagedoro',
    'b-nejiregashi', 'b-hanzaki', 'b-yoigurai'];

  if (typeof module !== 'undefined' && module.exports) module.exports = HR; else root.HR = HR;
})(typeof window !== 'undefined' ? window : globalThis);
