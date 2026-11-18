/* node public/games/jukugo-puzzle/test.js — validates the puzzle data (熟語クロス・四字熟語・難読漢字) */
'use strict';
const assert = require('assert');
const { CROSS, DICT, YOJI, NANDOKU, KNOWN2, KNOWN4 } = require('./data.js');

const HIRA = /^[ぁ-ゖー]+$/;
const KANJI = /^[㐀-鿿々]$/;
const known = new Set([...Object.keys(DICT), ...KNOWN2.split(/\s+/).filter(Boolean)]);
let worst = 0;

// ---- 熟語クロス
const centers = new Set();
CROSS.forEach(([lv, c, words, wrong], i) => {
  const id = `cross #${i + 1} 「${c}」`;
  assert.ok([1, 2, 3].includes(lv), id + ' level');
  assert.ok(KANJI.test(c), id + ' center is one kanji');
  assert.ok(!centers.has(c), id + ' center used twice');
  centers.add(c);
  assert.strictEqual(words.length, 4, id + ' has 4 words');
  const outer = [];
  words.forEach((w) => {
    assert.strictEqual([...w].length, 2, `${id}: ${w} is a 2-kanji word`);
    assert.ok(w[0] === c || w[1] === c, `${id}: ${w} contains the center`);
    assert.ok(!(w[0] === c && w[1] === c), `${id}: ${w}`);
    assert.ok(DICT[w], `${id}: ${w} has a reading and meaning in DICT`);
    assert.ok(HIRA.test(DICT[w][0]), `${id}: reading of ${w} is hiragana`);
    assert.ok(DICT[w][1] && DICT[w][1].length >= 4, `${id}: meaning of ${w}`);
    outer.push(w[0] === c ? w[1] : w[0]);
  });
  assert.strictEqual(new Set(outer).size, 4, id + ' four different outer kanji');
  const d = [...wrong];
  assert.strictEqual(d.length, 7, id + ' 7 distractors');
  assert.strictEqual(new Set(d).size, 7, id + ' distractors are unique');
  d.forEach((k) => {
    assert.ok(KANJI.test(k), `${id}: distractor ${k}`);
    assert.ok(k !== c && !outer.includes(k), `${id}: distractor ${k} is not the center or an outer kanji`);
    // the word each position would make with k instead of the center
    const made = words.map((w) => (w[0] === c ? k + w[1] : w[0] + k));
    const hits = made.filter((m) => known.has(m));
    worst = Math.max(worst, hits.length);
    assert.ok(hits.length < 4, `${id}: distractor ${k} completes all four (${made.join(' ')})`);
    assert.ok(hits.length <= 2, `${id}: distractor ${k} completes ${hits.length} words (${hits.join(' ')}) — too close`);
  });
});
for (const lv of [1, 2, 3]) assert.ok(CROSS.filter((x) => x[0] === lv).length >= 12, 'level ' + lv + ' has 12+ items');

// ---- 四字熟語
const known4 = new Set([...YOJI.map((y) => y[0]), ...KNOWN4.split(/\s+/)]);
const seenY = new Set();
YOJI.forEach(([w, r, m, pos, wrong]) => {
  const id = `yoji ${w}`;
  assert.strictEqual([...w].length, 4, id + ' 4 kanji');
  assert.ok(!seenY.has(w), id + ' twice');
  seenY.add(w);
  assert.ok(HIRA.test(r), id + ' reading');
  assert.ok(m.length >= 6, id + ' meaning');
  assert.ok(pos >= 0 && pos <= 3, id + ' blank position');
  const opts = [w[pos], ...wrong];
  assert.strictEqual(opts.length, 4, id + ' 4 options');
  assert.strictEqual(new Set(opts).size, 4, id + ' options unique');
  wrong.split('').forEach((k) => {
    const alt = w.slice(0, pos) + k + w.slice(pos + 1);
    assert.ok(!known4.has(alt), `${id}: option ${k} makes another idiom ${alt}`);
  });
});

// ---- 難読漢字
const seenN = new Set();
NANDOKU.forEach(([cat, k, r, wrong, note]) => {
  const id = `nandoku ${k}`;
  assert.ok(['魚', '野菜・植物', '動物', '地名', '食べ物'].includes(cat), id + ' category');
  assert.ok(!seenN.has(k), id + ' twice');
  seenN.add(k);
  assert.ok(HIRA.test(r), id + ' reading is hiragana');
  const opts = wrong.split('、');
  assert.strictEqual(opts.length, 3, id + ' 3 wrong options');
  opts.forEach((o) => assert.ok(HIRA.test(o), `${id}: option ${o}`));
  assert.strictEqual(new Set([r, ...opts]).size, 4, id + ' options unique');
  assert.ok(note.length >= 6, id + ' note');
});
const cats = {};
NANDOKU.forEach((n) => { cats[n[0]] = (cats[n[0]] || 0) + 1; });
Object.values(cats).forEach((v) => assert.ok(v >= 10, 'each category has 10+'));

const total = CROSS.length + YOJI.length + NANDOKU.length;
assert.ok(total >= 120, 'at least 120 items: ' + total);
console.log(`ok — 熟語クロス ${CROSS.length}（誤りの候補で作れる語は最大 ${worst} 語）・四字熟語 ${YOJI.length}・難読漢字 ${NANDOKU.length}（${JSON.stringify(cats)}）＝ ${total} 問`);
