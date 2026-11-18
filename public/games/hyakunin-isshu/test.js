/* node public/games/hyakunin-isshu/test.js — checks the data of the 100 poems and the 決まり字 */
'use strict';
const assert = require('assert');
const { POEMS, kimariji } = require('./poems.js');
assert.strictEqual(POEMS.length, 100, '100 poems');
POEMS.forEach((p, i) => {
  assert.strictEqual(p.n, i + 1, 'numbered 1..100');
  for (const k of ['p', 'k', 's', 'ky', 'sy', 't']) assert.ok(p[k] && p[k].length, `${p.n}: ${k}`);
  assert.ok(/^[ぁ-ゖ ]+$/.test(p.ky + p.sy), `${p.n}: readings are hiragana`);
  assert.strictEqual(p.ky.split(' ').length, 3, `${p.n}: 上の句 has 3 phrases`);
  assert.strictEqual(p.sy.split(' ').length, 2, `${p.n}: 下の句 has 2 phrases`);
  assert.strictEqual(p.k.split(' ').length, 3, `${p.n}: 上の句 text has 3 phrases`);
  assert.strictEqual(p.s.split(' ').length, 2, `${p.n}: 下の句 text has 2 phrases`);
  assert.strictEqual(p.t.split(' ').length, 5, `${p.n}: modern reading has 5 phrases`);
  assert.ok(p.fuda.length >= 12 && p.fuda.length <= 18, `${p.n}: 取り札 length ${p.fuda.length}`);
});
assert.strictEqual(new Set(POEMS.map((p) => p.ky)).size, 100, 'unique 上の句');
assert.strictEqual(new Set(POEMS.map((p) => p.fuda)).size, 100, 'unique 取り札');
// 決まり字: distribution 1字7・2字42・3字37・4字6・5字2・6字6
const km = kimariji(POEMS);
const dist = {};
km.forEach((k) => { dist[k.len] = (dist[k.len] || 0) + 1; });
assert.deepStrictEqual(dist, { 1: 7, 2: 42, 3: 37, 4: 6, 5: 2, 6: 6 }, 'kimariji distribution ' + JSON.stringify(dist));
// the seven 1字決まり are む・す・め・ふ・さ・ほ・せ
assert.deepStrictEqual(km.filter((k) => k.len === 1).map((k) => k.text).sort(), ['さ', 'す', 'せ', 'ふ', 'ほ', 'む', 'め'].sort());
// well-known examples
const K = Object.fromEntries(km.map((k) => [k.n, k.text]));
const known = { 87: 'む', 18: 'す', 57: 'め', 22: 'ふ', 70: 'さ', 81: 'ほ', 77: 'せ', 17: 'ちは', 42: 'ちぎりき', 75: 'ちぎりお', 31: 'あさぼらけあ', 64: 'あさぼらけう', 15: 'きみがためは', 50: 'きみがためを', 11: 'わたのはらや', 76: 'わたのはらこ', 83: 'よのなかよ', 93: 'よのなかは', 44: 'あふこ', 60: 'おほえ', 95: 'おほけ', 26: 'をぐ', 5: 'おく', 29: 'こころあ', 68: 'こころに', 19: 'なにはが', 88: 'なにはえ' };
for (const [n, t] of Object.entries(known)) assert.strictEqual(K[n], t, `${n}: 決まり字 ${K[n]} (expected ${t})`);
// every 決まり字 is unique among the 100 (no other 上の句 starts with the same sound)
const { sound } = require('./poems.js');
km.forEach((k) => { const s = sound(k.text); POEMS.forEach((q) => { if (q.n !== k.n) assert.ok(!sound(q.ky).startsWith(s), `${k.n} vs ${q.n}`); }); });
console.log('ok — 100 poems, 決まり字', JSON.stringify(dist));
