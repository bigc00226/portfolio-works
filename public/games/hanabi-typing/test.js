/* node public/games/hanabi-typing/test.js — the romaji engine and the word list */
'use strict';
const assert = require('assert');
const R = require('./romaji.js');
const { WORDS } = require('./words.js');

/** types s into a fresh engine for kana; returns { ok, done, at } (at = index of the first rejected key) */
function type(kana, s) {
  const r = R.create(kana);
  for (let i = 0; i < s.length; i++) { const res = r.input(s[i]); if (!res.ok) return { ok: false, done: false, at: i, r }; }
  return { ok: true, done: r.done, r };
}
const accepts = (kana, s) => { const t = type(kana, s); assert.ok(t.ok && t.done, `${kana}: "${s}" should be accepted (stopped at ${t.at}, done ${t.done})`); };
const rejects = (kana, s) => { const t = type(kana, s); assert.ok(!(t.ok && t.done), `${kana}: "${s}" should be rejected`); };
let n = 0;
const ok = (kana, ...list) => list.forEach((s) => { accepts(kana, s); n++; });
const ng = (kana, ...list) => list.forEach((s) => { rejects(kana, s); n++; });

// basic spellings
ok('すし', 'sushi', 'susi', 'suci');
ok('ちず', 'chizu', 'tizu');
ok('つき', 'tsuki', 'tuki');
ok('ふじ', 'fuji', 'huzi', 'fuzi', 'huji');
ok('しゃしん', 'shashinn', 'syasinn', 'shasinn', 'shixyashinn', 'silyasixn', "shashin'");
ok('じゃんけん', 'jankenn', 'jyankenn', 'zyankenn', 'jixyankenn');
ok('ちゃわん', 'chawann', 'tyawann', 'cyawann', 'tilyawann');
ok('ふぁん', 'fann', 'fwann', 'fuxann', 'hulann');
ok('かき', 'kaki', 'caki');
ok('くつ', 'kutsu', 'cutu', 'qutu');
// ん
ok('かんじ', 'kanji', 'kannji', 'kanzi', 'kaxnji', "kan'ji");
ok('みかん', 'mikann', 'mikaxn', "mikan'");
ng('みかん', 'mikan');
ok('こんにちは', 'konnnichiha', 'konnnitiha', 'koxnnitiha');
ng('こんにちは', 'konnichiha');
ok('きんようび', 'kinnyoubi', "kin'youbi");
ng('きんようび', 'kinyoubi');
ok('せんえん', 'sennenn', "sen'enn");
ng('せんえん', 'senenn');
ok('おんな', 'onnna', "on'na");
ng('おんな', 'onna');
ok('しんぶん', 'shinbunn', 'sinbunn', 'shinbunn');
ok('かんぱい', 'kanpai', 'kannpai');
ok('ほんわか', 'honwaka', 'honnwaka');
// っ
ok('きっぷ', 'kippu', 'kiltupu', 'kixtupu', 'kixtsupu', 'kiltsupu');
ok('まっちゃ', 'maccha', 'mattya', 'matcha', 'maccya', 'maltucha', 'maxtsutya');
ok('がっしゅく', 'gasshuku', 'gassyuku', 'gaxtushuku');
ok('しゅっぱつ', 'shuppatsu', 'syuppatu');
ok('はっぴ', 'happi', 'haltupi');
ok('いっとうしょう', 'ittoushou', 'ittousyou');
ok('ざっし', 'zasshi', 'zassi', 'zacci');
ng('きっぷ', 'kipu');
// small kana and ー
ok('らーめん', 'ra-menn');
ok('すたーまいん', 'suta-mainn');
ok('よーよーつり', 'yo-yo-tsuri', 'yo-yo-turi');
ok('ぁ', 'la', 'xa');
ok('てぃー', 'thi-', 'telyi-', 'texi-');
// misc
ok('を', 'wo');
ok('いえ', 'ie', 'yie');
ok('うぉっか', 'whokka');

// the guide follows the spelling the player started
{
  const r = R.create('しゃしん');
  assert.strictEqual(r.guide(), 'shashinn');
  r.input('s'); r.input('y');
  assert.strictEqual(r.guide(), 'syashinn', 'guide after "sy"');
  r.input('a'); r.input('s'); r.input('i');
  assert.strictEqual(r.guide(), 'syasinn', 'guide after "syasi"');
}
{
  const r = R.create('かんじ');
  assert.strictEqual(r.guide(), 'kanji');
  'kann'.split('').forEach((c) => r.input(c));
  assert.strictEqual(r.guide(), 'kannji');
}
{
  const r = R.create('まっちゃ');
  assert.strictEqual(r.guide(), 'maccha');
  'mat'.split('').forEach((c) => r.input(c));
  assert.ok(/^mat(cha|tya|tcha)$/.test(r.guide()), 'guide after mat → ' + r.guide());
}
{
  const r = R.create('ちず');
  r.input('t');
  assert.strictEqual(r.guide(), 'tizu');
}
{
  const r = R.create('きっぷ');
  r.input('k'); r.input('i'); r.input('x');
  assert.ok(/^kix(tu|tsu)pu$/.test(r.guide()), 'guide after "kix" → ' + r.guide());
}
// a rejected key does not move the state
{
  const r = R.create('すいか');
  assert.ok(r.input('s').ok);
  assert.ok(!r.input('a').ok);
  assert.ok(r.input('u').ok);
  assert.strictEqual(r.kanaDone, 1);
}

// every word of the list: the guide spelling types it to the end, and so does a "kunrei" style variant
const variant = (s) => s.replace(/cch/g, 'tch').replace(/ffu/g, 'hhu').replace(/jj/g, 'zz').replace(/shi/g, 'si').replace(/chi/g, 'ti').replace(/tsu/g, 'tu').replace(/fu/g, 'hu').replace(/ji/g, 'zi').replace(/sh([aueo])/g, 'sy$1').replace(/ch([aueo])/g, 'ty$1').replace(/j([aueo])/g, 'zy$1');
const seen = new Set();
for (const w of WORDS) {
  assert.ok(w.d && w.k, 'word has display and kana');
  assert.ok(/^[ぁ-ゖー]+$/.test(w.k), `${w.d}: reading is hiragana (${w.k})`);
  assert.ok(!seen.has(w.k), `duplicate reading ${w.k}`);
  seen.add(w.k);
  const g = R.preferred(w.k);
  accepts(w.k, g); n++;
  const v = variant(g);
  if (v !== g) { const t = type(w.k, v); if (!(t.ok && t.done)) { /* the variant can be invalid only where "n" meets a vowel; check that */ assert.ok(/n[aiueoy]/.test(v), `${w.k}: variant ${v}`); } else n++; }
  // the guide shown at every step leads to the end
  const r = R.create(w.k);
  for (let i = 0; i < 80 && !r.done; i++) { const k = r.nextKey(); assert.ok(k, `${w.k}: no next key`); assert.ok(r.input(k).ok, `${w.k}: guide key ${k} rejected`); }
  assert.ok(r.done, `${w.k}: guide does not finish`);
}
const groups = { easy: 0, normal: 0, hard: 0 };
WORDS.forEach((w) => groups[w.lv]++);
assert.ok(WORDS.length >= 250, 'at least 250 words: ' + WORDS.length);
assert.ok(groups.easy >= 60 && groups.normal >= 60 && groups.hard >= 50, 'groups ' + JSON.stringify(groups));
console.log(`ok — ${n} spellings checked, ${WORDS.length} words`, JSON.stringify(groups));
