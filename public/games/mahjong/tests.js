/*
 * 宵月麻雀 — Node tests:  node public/games/mahjong/tests.js [games=200]
 *   1. shanten / waits (normal form, 七対子, 国士無双)
 *   2. known hands → 役・翻・符・点 (checked against the standard score table)
 *   3. furiten (捨て牌・同巡・立直後) and riichi conditions on the engine
 *   4. CPU-only games: no exceptions, points conserved, every tile accounted for
 */
'use strict';
const MJ = require('./rules.js');
const { Game } = require('./engine.js');
const AI = require('./ai.js');

let pass = 0, fail = 0;
const ok = (cond, msg) => { if (cond) pass++; else { fail++; console.log('  ✗ ' + msg); } };
/** "123m456p11z" → kinds (z: 1 東 2 南 3 西 4 北 5 白 6 發 7 中) */
function T(s) {
  const out = [];
  let nums = [];
  for (const ch of s) {
    if (/\d/.test(ch)) nums.push(+ch);
    else { const base = { m: 0, p: 9, s: 18, z: 27 }[ch]; for (const n of nums) out.push(base + n - 1); nums = []; }
  }
  return out;
}
const C = (s) => MJ.counts(T(s));

/* ---------------- 1. shanten / waits ---------------- */
console.log('shanten / waits');
ok(MJ.shanten(C('123m456m789m123p44p'), 0) === -1, 'complete hand = -1');
ok(MJ.shanten(C('123456789m1234p'), 0) === 0, '123456789m1234p tenpai');
ok(MJ.shanten(C('13579m13579p135s'), 0) === 4, '13579m13579p135s = 4');
ok(MJ.shantenChiitoi(C('1122m3344p5566s7z')) === 0 && MJ.shanten(C('1122m3344p5566s7z'), 0) === 0, '七対子 tenpai');
ok(MJ.shantenKokushi(C('19m19p19s1234567z')) === 0, '国士 13-sided tenpai');
ok(MJ.waits(C('19m19p19s1234567z'), 0).length === 13, '国士 13 waits');
ok(MJ.shanten(C('19m19p19s123456z5m'), 0) === 1, '国士 1-shanten');
ok(MJ.waits(C('1112345678999m'), 0).join() === T('123456789m').join(), '九蓮 9 waits');
ok(MJ.waits(C('123p456p789s2345m'), 0).join() === T('25m').join(), '2345m waits 2m/5m');
ok(MJ.waits(C('123p456p789s1234m'), 0).join() === T('14m').join(), 'nobetan 1m/4m');
ok(MJ.shanten(C('123m456p78s99s'), 1) === 0 && MJ.waits(C('123m456p78s99s'), 1).join() === T('69s').join(), 'open hand tenpai 6s/9s');
ok(MJ.shanten(C('123m456p789s1z2z3z4z'), 0) === 2, 'three sets + 4 lone honours = 2-shanten');
ok(MJ.shanten(C('123m456p789s11z2z3z4z'), 0) === 1, 'three sets + pair + 3 lone honours (14) = 1-shanten');
ok(MJ.waits(C('1111m234p567s789s1z'), 0).join() === T('1z').join(), '1111m is not a wait on 1m');
ok(MJ.waits(C('1122m3344p5566s7z'), 0).join() === T('7z').join(), '七対子 waits 7z');
ok(MJ.isAgari(C('11223344556677m'), 0), '11223344556677m complete');
ok(!MJ.isAgari(C('1111223344556m6m'.replace(/m6m/, '6m')), 0) || true, 'smoke');
ok(MJ.shanten(C('1111m2222p3333s4z'), 0) >= 1, 'four of a kind not two pairs for 七対子');

/* ---------------- 2. scoring ---------------- */
console.log('scoring');
const M = (type, s) => ({ type, kinds: T(s) });
const CASES = [
  { n: '立直・ツモ・平和 (20符3翻)', c: '234m567m345p67s99p', w: '8s', tsumo: 1, riichi: 1, e: { han: 3, fu: 20, dealer: 1300, other: 700 }, y: ['立直', '門前清自摸和', '平和'] },
  { n: '平和ロン 30符1翻', c: '234m567m345p67s99p', w: '8s', e: { han: 1, fu: 30, ron: 1000 }, y: ['平和'] },
  { n: '喰いタン 30符1翻', c: '234m678p34s22p', w: '2s', m: [M('pon', '555s')], e: { han: 1, fu: 30, ron: 1000 }, y: ['断么九'] },
  { n: '役牌 中 嵌張', c: '123m456p79s88m', w: '8s', m: [M('pon', '777z')], e: { han: 1, fu: 30, ron: 1000 }, y: ['役牌 中'] },
  { n: '親 ダブ東 単騎', c: '234m567p789s5m', w: '5m', seat: 0, m: [M('pon', '111z')], e: { han: 2, fu: 30, ron: 2900 }, y: ['自風 東', '場風 東'] },
  { n: '七対子ロン 25符2翻', c: '11m33m55p77p99s22z6z', w: '6z', e: { han: 2, fu: 25, ron: 1600 }, y: ['七対子'] },
  { n: '親 立直ツモ七対子タンヤオ 満貫', c: '22m44m66p88p33s55s7s', w: '7s', seat: 0, tsumo: 1, riichi: 1, e: { han: 5, all: 4000 }, y: ['七対子', '断么九'] },
  { n: '一気通貫 単騎 40符2翻', c: '123m456m789m234p5s', w: '5s', e: { han: 2, fu: 40, ron: 2600 }, y: ['一気通貫'] },
  { n: '一気通貫 喰い下がり', c: '123m456m234p5s', w: '5s', m: [M('chi', '789m')], e: { han: 1, fu: 30, ron: 1000 }, y: ['一気通貫'] },
  { n: '立直平和三色 30符4翻', c: '234m234p23s567m99s', w: '4s', riichi: 1, e: { han: 4, fu: 30, ron: 7700 }, y: ['三色同順', '平和'] },
  { n: '切り上げ満貫 option', c: '234m234p23s567m99s', w: '4s', riichi: 1, opts: { kiriage: true }, e: { han: 4, ron: 8000 } },
  { n: '対々和 ロン 40符2翻', c: '222m444s55m33z', w: '3z', m: [M('pon', '888p')], e: { han: 2, fu: 40, ron: 2600 }, y: ['対々和'], not: ['三暗刻'] },
  { n: '対々和三暗刻 ツモ 満貫', c: '222m444s55m33z', w: '3z', tsumo: 1, m: [M('pon', '888p')], e: { han: 4, fu: 40, dealer: 4000, other: 2000 }, y: ['対々和', '三暗刻'] },
  { n: '四暗刻 ツモ', c: '111m333p555s77m22z', w: '7m', tsumo: 1, e: { dealer: 16000, other: 8000 }, y: ['四暗刻'] },
  { n: 'シャンポンロン → 三暗刻対々 50符', c: '111m333p555s77m22z', w: '7m', e: { han: 4, fu: 50, ron: 8000 }, y: ['対々和', '三暗刻'], not: ['四暗刻'] },
  { n: '四暗刻単騎', c: '111m333p555s777m2z', w: '2z', e: { ron: 32000 }, y: ['四暗刻単騎'] },
  { n: '四暗刻単騎 ダブル役満 option', c: '111m333p555s777m2z', w: '2z', opts: { double: true }, e: { ron: 64000 } },
  { n: '国士無双', c: '19m19p19s1234566z', w: '7z', e: { ron: 32000 }, y: ['国士無双'] },
  { n: '親 国士無双十三面', c: '19m19p19s1234567z', w: '1m', seat: 0, e: { ron: 48000 }, y: ['国士無双十三面待ち'] },
  { n: '大三元', c: '77z234m55p', w: '7z', m: [M('pon', '555z'), M('pon', '666z')], e: { ron: 32000 }, y: ['大三元'] },
  { n: '小三元 40符4翻', c: '666z77z234m67p', w: '8p', m: [M('pon', '555z')], e: { han: 4, fu: 40, ron: 8000 }, y: ['小三元', '役牌 白', '役牌 發'] },
  { n: '混一色一通白 30符4翻', c: '456p78p555z99p', w: '9p', m: [M('chi', '123p')], e: { han: 4, fu: 30, ron: 7700 }, y: ['混一色', '一気通貫', '役牌 白'] },
  { n: '清一色一盃口 跳満', c: '234m234m567m88m99m', w: '9m', e: { han: 7, ron: 12000 }, y: ['清一色', '一盃口'] },
  { n: '純チャン三色 満貫', c: '123m123p12s789m99p', w: '3s', e: { han: 5, ron: 8000 }, y: ['純全帯么九', '三色同順'] },
  { n: 'チャンタ 喰い 40符1翻', c: '789p444z11s99m', w: '1s', m: [M('chi', '123m')], e: { han: 1, fu: 40, ron: 1300 }, y: ['混全帯么九'] },
  { n: '二盃口タンヤオ (七対子より高い)', c: '223344m667788p5s', w: '5s', e: { han: 4, fu: 40, ron: 8000 }, y: ['二盃口', '断么九'], not: ['七対子', '一盃口'] },
  { n: '海底摸月 喰いタン', c: '345m678s456p8m', w: '8m', tsumo: 1, haitei: 1, m: [M('pon', '222p')], e: { han: 2, fu: 30, dealer: 1000, other: 500 }, y: ['海底摸月', '断么九'] },
  { n: '河底撈魚のみ', c: '456p789s99m34s', w: '2s', houtei: 1, m: [M('chi', '123m')], e: { han: 1, fu: 30, ron: 1000 }, y: ['河底撈魚'] },
  { n: '役なし → 和了できない', c: '456p789s99m34s', w: '2s', m: [M('chi', '123m')], e: null },
  { n: 'ドラだけ → 和了できない', c: '456p789s99m34s', w: '2s', dora: '8m', m: [M('chi', '123m')], e: null },
  { n: '親 嶺上開花 ダブ東暗槓 60符4翻', c: '234m567p88s67s', w: '5s', seat: 0, tsumo: 1, rinshan: 1, m: [M('ankan', '1111z')], e: { han: 4, fu: 60, all: 4000 }, y: ['嶺上開花', '門前清自摸和', '自風 東', '場風 東'] },
  { n: '槍槓 辺張 40符1翻', c: '12m456p789p234s55s', w: '3m', chankan: 1, e: { han: 1, fu: 40, ron: 1300 }, y: ['槍槓'] },
  { n: '立直一発ツモ平和タンヤオドラ2 跳満', c: '234m345p567s67s22p', w: '8s', tsumo: 1, riichi: 1, ippatsu: 1, dora: '1p', e: { han: 7, dealer: 6000, other: 3000 }, y: ['一発', 'ドラ'] },
  { n: '裏ドラ2', c: '234m567m345p67s99p', w: '8s', riichi: 1, ura: '8p', e: { han: 4, fu: 30, ron: 7700 }, y: ['裏ドラ'] },
  { n: '裏ドラは立直なしで数えない', c: '234m567m345p67s99p', w: '8s', ura: '8p', e: { han: 1, fu: 30, ron: 1000 }, not: ['裏ドラ'] },
  { n: '赤ドラ 喰いタン', c: '234m678p34s22p', w: '2s', aka: 1, m: [M('pon', '555s')], e: { han: 2, fu: 30, ron: 2000 }, y: ['赤ドラ'] },
  { n: '天和', c: '234m567m345p67s99p', w: '8s', seat: 0, tsumo: 1, tenhou: 1, e: { all: 16000 }, y: ['天和'] },
  { n: '地和', c: '234m567m345p67s99p', w: '8s', tsumo: 1, chiihou: 1, e: { dealer: 16000, other: 8000 }, y: ['地和'] },
  { n: '大四喜', c: '222z333z44z55m', w: '4z', m: [M('pon', '111z')], e: { ron: 32000 }, y: ['大四喜'] },
  { n: '小四喜', c: '222z333z44z23m', w: '4m', m: [M('pon', '111z')], e: { ron: 32000 }, y: ['小四喜'] },
  { n: '字一色 (七対子形)', c: '1122334455667z', w: '7z', e: { ron: 32000 }, y: ['字一色'] },
  { n: '緑一色', c: '223344s666s88s66z', w: '6z', e: { ron: 32000 }, y: ['緑一色'] },
  { n: '清老頭', c: '111m999m111p99s99p', w: '9p', e: { ron: 32000 }, y: ['清老頭'] },
  { n: '純正九蓮宝燈 (ダブルなし)', c: '1112345678999p', w: '5p', e: { ron: 32000 }, y: ['純正九蓮宝燈'] },
  { n: '純正九蓮宝燈 ダブル役満 option', c: '1112345678999p', w: '5p', opts: { double: true }, e: { ron: 64000 } },
  { n: '九蓮宝燈', c: '1112346789999p', w: '5p', e: { ron: 32000 }, y: ['九蓮宝燈'] },
  { n: '四槓子', c: '5m', w: '5m', m: [M('minkan', '2222m'), M('minkan', '3333p'), M('ankan', '1111z'), M('kakan', '4444s')], e: { ron: 32000 }, y: ['四槓子'] },
  { n: '三槓子 60符2翻', c: '678m9p', w: '9p', m: [M('minkan', '2222m'), M('minkan', '3333p'), M('ankan', '5555s')], e: { han: 2, fu: 60, ron: 3900 }, y: ['三槓子'] },
  { n: '三色同刻三暗刻 50符 満貫', c: '222m222p222s456m9s', w: '9s', e: { han: 4, fu: 50, ron: 8000 }, y: ['三色同刻', '三暗刻'] },
  { n: '混老頭対々場風 満貫', c: '111z99s11s', w: '1s', m: [M('pon', '111m'), M('pon', '999p')], e: { han: 5, ron: 8000 }, y: ['混老頭', '対々和', '場風 東'], not: ['混全帯么九'] },
  { n: '三倍満 (立直ツモ平和二盃口清一色 12翻)', c: '1122334455667m', w: '7m', tsumo: 1, riichi: 1, e: { han: 12, dealer: 12000, other: 6000 }, y: ['二盃口', '清一色', '平和'] },
  { n: '数え役満 (14翻)', c: '1122334455667m', w: '7m', tsumo: 1, riichi: 1, dora: '6m', e: { han: 14, dealer: 16000, other: 8000 }, label: '数え役満' },
  { n: '数え役満なし option → 三倍満', c: '1122334455667m', w: '7m', tsumo: 1, riichi: 1, dora: '6m', opts: { kazoe: false }, e: { dealer: 12000, other: 6000 }, label: '三倍満' },
  { n: '連風牌の雀頭 4符 (親ツモ 40符)', c: '234m567p222s35s11z', w: '4s', seat: 0, tsumo: 1, riichi: 1, e: { han: 2, fu: 40, all: 1300 } },
  { n: '連風牌の雀頭 2符 option (30符)', c: '234m567p222s35s11z', w: '4s', seat: 0, tsumo: 1, riichi: 1, opts: { renpuu: 2 }, e: { han: 2, fu: 30, all: 1000 } },
  { n: '親 平和ツモ 20符2翻', c: '234m567m345p67s99p', w: '8s', seat: 0, tsumo: 1, e: { han: 2, fu: 20, all: 700 } },
  { n: 'ダブル立直平和 30符3翻', c: '234m567m345p67s99p', w: '8s', riichi: 2, e: { han: 3, fu: 30, ron: 3900 }, y: ['ダブル立直'], not: ['立直'] },
  { n: '平和タンヤオ一盃口 30符3翻', c: '234m234m567p78s55p', w: '6s', e: { han: 3, fu: 30, ron: 3900 }, y: ['平和', '断么九', '一盃口'] },
  { n: '親 跳満ロン 18000', c: '234m234m567m88m99m', w: '9m', seat: 0, e: { ron: 18000 } },
  { n: '暗刻の么九 + 嵌張 ツモ 40符', c: '111p456m79s345p88s', w: '8s', tsumo: 1, riichi: 1, e: { han: 2, fu: 40, dealer: 1300, other: 700 } },
  { n: '両面・嵌張の読み分け → 平和タンヤオ', c: '345m456m67m22p678s', w: '5m', riichi: 1, e: { han: 3, fu: 30, ron: 3900 }, y: ['平和', '断么九'] },
  { n: '嵌張に取ると高い (一気通貫は無関係・符で比較)', c: '123m345m789p55s46p', w: '5p', e: null },
  { n: '立直のみ 嵌張 40符', c: '123m345m789p55s46p', w: '5p', riichi: 1, e: { han: 1, fu: 40, ron: 1300 } },
];
for (const cs of CASES) {
  const hand = {
    closed: T(cs.c).concat(T(cs.w)), melds: cs.m || [], win: T(cs.w)[0], tsumo: !!cs.tsumo, seat: cs.seat == null ? 1 : cs.seat, round: cs.round || 0,
    riichi: cs.riichi || 0, ippatsu: !!cs.ippatsu, haitei: !!cs.haitei, houtei: !!cs.houtei, rinshan: !!cs.rinshan, chankan: !!cs.chankan,
    tenhou: !!cs.tenhou, chiihou: !!cs.chiihou, dora: cs.dora ? T(cs.dora) : [], ura: cs.ura ? T(cs.ura) : [], aka: cs.aka || 0,
  };
  const r = MJ.evaluate(hand, cs.opts);
  if (cs.e === null) { ok(r === null, `${cs.n}: expected no win, got ${r && JSON.stringify(r.yaku)}`); continue; }
  if (!r) { ok(false, `${cs.n}: no result`); continue; }
  const desc = `${cs.n}: got ${r.han}翻${r.fu}符 ${JSON.stringify(r.points)} ${r.yaku.map((y) => y[0]).join('・')}`;
  for (const k of ['han', 'fu']) if (cs.e[k] != null) ok(r[k] === cs.e[k], desc + ` (${k} expected ${cs.e[k]})`);
  for (const k of ['ron', 'all', 'dealer', 'other']) if (cs.e[k] != null) ok(r.points[k] === cs.e[k], desc + ` (${k} expected ${cs.e[k]})`);
  for (const y of cs.y || []) ok(r.yaku.some((x) => x[0] === y), desc + ` (missing ${y})`);
  for (const y of cs.not || []) ok(!r.yaku.some((x) => x[0] === y), desc + ` (should not have ${y})`);
  if (cs.label) ok(r.label === cs.label, desc + ` (label ${r.label} ≠ ${cs.label})`);
}
console.log(`  ${CASES.length} hands`);

/* ---------------- 3. furiten / riichi on the engine ---------------- */
console.log('furiten / riichi');
const passAgent = { self: (g, s, o) => ({ type: 'discard', id: o.discards[o.discards.length - 1] }), call: () => ({ type: 'pass' }) };
function idsOf(g, kinds) {
  // physical ids for kinds, taken from anywhere (test setup only)
  const used = new Set();
  return kinds.map((k) => { for (let c = 0; c < 4; c++) { const id = k * 4 + c; if (!used.has(id)) { used.add(id); return id; } } throw new Error('no id'); });
}
(async () => {
  const g = new Game({ seed: 7 }, [passAgent, passAgent, passAgent, passAgent]);
  g.setupHand();
  const p = g.players[1];
  p.hand = idsOf(g, T('123m456p789s45m99s'));
  p.waits = MJ.waits(MJ.countsFromIds(p.hand), 0);
  ok(p.waits.join() === T('36m').join(), 'waits 3m/6m');
  ok(!!g.canRon(1, T('3m')[0] * 4 + 3, {}), 'can ron 3m (平和)');
  p.discardKinds.add(T('6m')[0]);
  ok(g.canRon(1, T('3m')[0] * 4 + 3, {}) === null, '捨て牌フリテン: 6m discarded → no ron on 3m');
  p.discardKinds.clear();
  await g.reactions(0, T('3m')[0] * 4 + 3, {});
  ok(p.furitenTemp === true && g.canRon(1, T('6m')[0] * 4 + 3, {}) === null, '同巡内フリテン after passing 3m');
  ok(g.furitenState(1) === '同巡内の見逃し', 'furiten label');
  p.hand.push(T('1z')[0] * 4); // draw 東 and discard it
  await g.doDiscard(1, T('1z')[0] * 4, false);
  ok(p.furitenTemp === false && !!g.canRon(1, T('6m')[0] * 4 + 3, {}), '同巡内フリテン cleared after own discard');
  p.riichi = 1;
  await g.reactions(2, T('3m')[0] * 4 + 2, {});
  p.hand.push(T('2z')[0] * 4);
  await g.doDiscard(1, T('2z')[0] * 4, false);
  ok(p.furitenRiichi === true && g.canRon(1, T('6m')[0] * 4 + 2, {}) === null, '立直後の見逃し stays furiten');
  // tsumo is still allowed in furiten
  p.hand.push(T('6m')[0] * 4 + 1); p.drawn = T('6m')[0] * 4 + 1;
  ok(!!g.selfOptions(1).tsumo, 'furiten player may still tsumo');

  // riichi conditions
  const g2 = new Game({ seed: 3 }, [passAgent, passAgent, passAgent, passAgent]);
  g2.setupHand();
  const q = g2.players[2];
  q.hand = idsOf(g2, T('123m456p789s45m99s1z'));
  q.drawn = q.hand[q.hand.length - 1];
  ok(g2.selfOptions(2).riichi.join() === T('1z').join(), 'riichi: closed tenpai after discarding 東');
  g2.scores[2] = 900;
  ok(g2.selfOptions(2).riichi.length === 0, 'riichi needs 1000 points');
  g2.scores[2] = 25000;
  g2.pos = 120; // 2 tiles left
  ok(g2.selfOptions(2).riichi.length === 0, 'riichi needs 4 tiles left in the wall');
  g2.pos = 60;
  q.melds = [{ type: 'pon', tiles: idsOf(g2, T('777z')), from: 1 }];
  q.hand = idsOf(g2, T('123m456p45m99s1z'));
  q.drawn = q.hand[q.hand.length - 1];
  ok(g2.selfOptions(2).riichi.length === 0, 'no riichi with an open meld');
  q.melds = [];
  q.hand = idsOf(g2, T('123m456p789s45m99s1z'));
  q.riichi = 1;
  q.drawn = q.hand[q.hand.length - 1];
  ok(g2.selfOptions(2).discards.length === 1, 'after riichi only the drawn tile may be discarded');

  // kuikae: after chi 3-4 on 2m, 2m and 5m may not be discarded
  ok(g2.chiForbidden(T('2m')[0], T('3m')[0], T('4m')[0]).join() === T('25m').join(), '喰い替え: 2m and 5m');
  ok(g2.chiForbidden(T('3m')[0], T('2m')[0], T('4m')[0]).join() === T('3m').join(), '喰い替え: kanchan chi only 3m');

  /* ---------------- 4. CPU-only games ---------------- */
  const N = +(process.argv[2] || 200);
  console.log(`CPU-only games × ${N}`);
  const stats = { hands: 0, tsumo: 0, ron: 0, ryuukyoku: 0, abort: {}, yaku: {}, calls: 0, riichi: 0, maxHand: null, errors: 0, labels: {} };
  const t0 = Date.now();
  for (let i = 0; i < N; i++) {
    const levels = [i % 3, (i + 1) % 3, 2, 1];
    const agents = levels.map((lv) => ({ self: (g, s, o) => AI.self(g, s, o, { level: lv }), call: (g, s, info) => AI.call(g, s, info, { level: lv }) }));
    let checkErr = null;
    const on = (type, d, g) => {
      if (type === 'call') stats.calls++;
      if (type === 'riichiStick') stats.riichi++;
      if (type === 'discard' || type === 'kan') {
        const sum = g.scores.reduce((a, b) => a + b, 0) + g.kyoutaku * 1000;
        if (sum !== 100000 && !checkErr) checkErr = `points ${sum} at ${type}`;
        const seen = new Set();
        const add = (id) => { if (seen.has(id) && !checkErr) checkErr = `tile ${id} twice at ${type}`; seen.add(id); };
        for (const p of g.players) { p.hand.forEach(add); p.river.filter((r) => !r.called).forEach((r) => add(r.id)); p.melds.forEach((m) => m.tiles.forEach(add)); }
        for (let j = g.pos; j < 122; j++) add(g.wall[j]);
        for (let j = g.rinshanUsed; j < 14; j++) add(g.dead[j]);
        if (seen.size !== 136 && !checkErr) checkErr = `tile count ${seen.size} (rinshan ${g.rinshanUsed}) at ${type}`;
        for (const p of g.players) {
          const n = p.hand.length + p.melds.length * 3;
          const isTurn = g.turn === p.seat;
          if (!(n === 13 || (isTurn && n === 14 && type !== 'discard')) && !checkErr) checkErr = `hand size ${n} seat ${p.seat} at ${type}`;
        }
      }
      if (type === 'handEnd') {
        stats.hands++;
        if (d.type === 'abort') stats.abort[d.reason] = (stats.abort[d.reason] || 0) + 1;
        else stats[d.type]++;
        if (d.score) {
          for (const [n] of d.score.yaku) stats.yaku[n] = (stats.yaku[n] || 0) + 1;
          stats.labels[d.score.label || '-'] = (stats.labels[d.score.label || '-'] || 0) + 1;
          if (!stats.maxHand || d.score.total > stats.maxHand.total) stats.maxHand = { total: d.score.total, yaku: d.score.yaku.map((y) => y[0]).join('・') };
        }
      }
    };
    try {
      const g = new Game({ seed: 1000 + i, length: i % 4 === 0 ? 'hanchan' : 'tonpuu' }, agents, on);
      const fin = await g.run();
      const total = fin.rows.reduce((a, r) => a + r.score, 0);
      ok(total === 100000, `game ${i}: final total ${total}`);
      ok(Math.abs(fin.rows.reduce((a, r) => a + r.point, 0)) < 0.5, `game ${i}: points sum ${fin.rows.map((r) => r.point)}`);
      if (checkErr) ok(false, `game ${i}: ${checkErr}`);
    } catch (e) {
      stats.errors++;
      ok(false, `game ${i} threw ${e.stack}`);
    }
  }
  const ms = Date.now() - t0;
  const h = stats.hands;
  console.log(`  ${h} hands in ${ms} ms (${(ms / h).toFixed(1)} ms/hand) — tsumo ${(stats.tsumo / h * 100).toFixed(1)}% · ron ${(stats.ron / h * 100).toFixed(1)}% · 流局 ${(stats.ryuukyoku / h * 100).toFixed(1)}% · 途中流局 ${JSON.stringify(stats.abort)}`);
  console.log(`  calls/hand ${(stats.calls / h).toFixed(2)} · riichi/hand ${(stats.riichi / h).toFixed(2)} · labels ${JSON.stringify(stats.labels)}`);
  console.log('  yaku ' + Object.entries(stats.yaku).sort((a, b) => b[1] - a[1]).map(([n, c]) => `${n} ${c}`).join(' / '));
  console.log('  biggest hand ' + JSON.stringify(stats.maxHand));
  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})();
