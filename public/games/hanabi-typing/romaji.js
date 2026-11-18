/*
 * ローマ字入力の判定（ひらがな → 打てるすべてのつづり）。ブラウザでは window.Romaji、Node では require。
 *   const r = Romaji.create('きっぷ');
 *   r.input('k') → { ok: true, done: false }   打った文字が受け付けられたか・語の最後まで打てたか
 *   r.typed  受け付けた文字列 · r.guide() 打った文字 + 残りのおすすめのつづり（打ち方に合わせて変わる）
 *   r.kanaDone  確定したひらがなの数 · r.rest() 残りのおすすめのつづり
 * 受け付けるつづり: shi/si/ci, chi/ti, tsu/tu, fu/hu, ji/zi, sha/sya, cha/tya/cya, ja/jya/zya, ふぁ fa, ん nn/xn/n'（子音の前は n だけでも可。
 * ただし母音・な行・や行の前と語末は不可）、っ は次の子音を重ねる / ltu・xtu・ltsu・xtsu、小さいかな la・xa・lya・xya …、ー は -、
 * 拗音を分けて打つ（ki + xya）なども可。
 */
(function (root) {
  'use strict';
  const T = {};
  const add = (kana, ...romas) => { T[kana] = romas; };
  // 清音・濁音・半濁音
  add('あ', 'a'); add('い', 'i', 'yi'); add('う', 'u', 'wu', 'whu'); add('え', 'e'); add('お', 'o');
  add('か', 'ka', 'ca'); add('き', 'ki'); add('く', 'ku', 'cu', 'qu'); add('け', 'ke'); add('こ', 'ko', 'co');
  add('さ', 'sa'); add('し', 'shi', 'si', 'ci'); add('す', 'su'); add('せ', 'se', 'ce'); add('そ', 'so');
  add('た', 'ta'); add('ち', 'chi', 'ti'); add('つ', 'tsu', 'tu'); add('て', 'te'); add('と', 'to');
  add('な', 'na'); add('に', 'ni'); add('ぬ', 'nu'); add('ね', 'ne'); add('の', 'no');
  add('は', 'ha'); add('ひ', 'hi'); add('ふ', 'fu', 'hu'); add('へ', 'he'); add('ほ', 'ho');
  add('ま', 'ma'); add('み', 'mi'); add('む', 'mu'); add('め', 'me'); add('も', 'mo');
  add('や', 'ya'); add('ゆ', 'yu'); add('よ', 'yo');
  add('ら', 'ra'); add('り', 'ri'); add('る', 'ru'); add('れ', 're'); add('ろ', 'ro');
  add('わ', 'wa'); add('ゐ', 'wyi'); add('ゑ', 'wye'); add('を', 'wo');
  add('が', 'ga'); add('ぎ', 'gi'); add('ぐ', 'gu'); add('げ', 'ge'); add('ご', 'go');
  add('ざ', 'za'); add('じ', 'ji', 'zi'); add('ず', 'zu'); add('ぜ', 'ze'); add('ぞ', 'zo');
  add('だ', 'da'); add('ぢ', 'di'); add('づ', 'du'); add('で', 'de'); add('ど', 'do');
  add('ば', 'ba'); add('び', 'bi'); add('ぶ', 'bu'); add('べ', 'be'); add('ぼ', 'bo');
  add('ぱ', 'pa'); add('ぴ', 'pi'); add('ぷ', 'pu'); add('ぺ', 'pe'); add('ぽ', 'po');
  add('ゔ', 'vu');
  // 小さいかな
  add('ぁ', 'la', 'xa'); add('ぃ', 'li', 'xi', 'lyi', 'xyi'); add('ぅ', 'lu', 'xu'); add('ぇ', 'le', 'xe', 'lye', 'xye'); add('ぉ', 'lo', 'xo');
  add('ゃ', 'lya', 'xya'); add('ゅ', 'lyu', 'xyu'); add('ょ', 'lyo', 'xyo'); add('ゎ', 'lwa', 'xwa');
  add('っ', 'ltu', 'xtu', 'ltsu', 'xtsu');
  add('ー', '-'); add('、', ','); add('。', '.'); add('！', '!'); add('？', '?'); add('・', '/'); add('〜', '~');
  // 拗音
  const yoon = (base, cons, extra) => {
    const v = { 'ゃ': 'a', 'ぃ': 'i', 'ゅ': 'u', 'ぇ': 'e', 'ょ': 'o' };
    for (const k in v) { const list = cons.map((c) => c + v[k]); if (extra && extra[k]) list.unshift(...extra[k]); T[base + k] = Array.from(new Set(list)); }
  };
  yoon('き', ['ky']); yoon('ぎ', ['gy']); yoon('に', ['ny']); yoon('ひ', ['hy']); yoon('び', ['by']); yoon('ぴ', ['py']); yoon('み', ['my']); yoon('り', ['ry']);
  yoon('し', ['sy'], { 'ゃ': ['sha'], 'ゅ': ['shu'], 'ぇ': ['she'], 'ょ': ['sho'] });
  yoon('ち', ['ty', 'cy'], { 'ゃ': ['cha'], 'ゅ': ['chu'], 'ぇ': ['che'], 'ょ': ['cho'] });
  yoon('じ', ['jy', 'zy'], { 'ゃ': ['ja'], 'ゅ': ['ju'], 'ぇ': ['je'], 'ょ': ['jo'] });
  yoon('ぢ', ['dy']);
  add('ふぁ', 'fa', 'fwa'); add('ふぃ', 'fi', 'fwi', 'fyi'); add('ふぇ', 'fe', 'fwe', 'fye'); add('ふぉ', 'fo', 'fwo'); add('ふゅ', 'fyu');
  add('てぃ', 'thi'); add('てゅ', 'thu'); add('でぃ', 'dhi'); add('でゅ', 'dhu'); add('とぅ', 'twu'); add('どぅ', 'dwu');
  add('うぃ', 'wi', 'whi'); add('うぇ', 'we', 'whe'); add('うぉ', 'who'); add('いぇ', 'ye');
  add('ゔぁ', 'va'); add('ゔぃ', 'vi'); add('ゔぇ', 've'); add('ゔぉ', 'vo');
  add('つぁ', 'tsa'); add('つぃ', 'tsi'); add('つぇ', 'tse'); add('つぉ', 'tso');
  add('くぁ', 'qa', 'kwa'); add('くぃ', 'qi'); add('くぇ', 'qe'); add('くぉ', 'qo'); add('ぐぁ', 'gwa');
  add('すぃ', 'swi'); add('ずぃ', 'zwi');

  const toHira = (s) => s.replace(/[ァ-ヶ]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0x60));
  const CONS = /^[bcdfghjkmpqrstvwxyz]/; // consonants that can be doubled for っ (not n, l, x)

  /** every (kana length, spelling) that can start at pos */
  function cands(K, pos) {
    const out = [];
    for (const L of [3, 2, 1]) {
      const s = K.substr(pos, L);
      if (s.length === L && T[s]) for (const r of T[s]) out.push({ len: L, roma: r });
    }
    const c = K[pos];
    if (c === 'ん') {
      out.push({ len: 1, roma: 'nn' }, { len: 1, roma: 'xn' }, { len: 1, roma: "n'" });
      if (singleN(K, pos)) out.push({ len: 1, roma: 'n' });
    } else if (c === 'っ' && pos + 1 < K.length) {
      for (const x of cands(K, pos + 1)) {
        if (!CONS.test(x.roma) || x.roma[0] === 'l' || x.roma[0] === 'x') continue;
        out.push({ len: 1 + x.len, roma: x.roma[0] + x.roma });
        if (x.roma.startsWith('ch')) out.push({ len: 1 + x.len, roma: 't' + x.roma });
      }
    } else if (!out.length && c != null) out.push({ len: 1, roma: c.toLowerCase() }); // anything else: the character itself
    return out;
  }
  /** a single "n" is enough for ん before a consonant (not before a vowel, な行, や行, or at the end) */
  function singleN(K, pos) {
    if (pos + 1 >= K.length) return false;
    const nx = cands(K, pos + 1);
    return nx.length > 0 && nx.every((x) => !/^[aiueony']/.test(x.roma));
  }
  /** the most common spelling from pos to the end */
  function preferred(K, pos) {
    let s = '';
    while (pos < K.length) {
      const c = K[pos];
      if (c === 'ん') { s += singleN(K, pos) ? 'n' : 'nn'; pos++; continue; }
      if (c === 'っ' && pos + 1 < K.length) {
        const nx = first(K, pos + 1);
        if (CONS.test(nx.roma)) { s += nx.roma[0]; pos++; continue; }
      }
      const f = first(K, pos);
      s += f.roma; pos += f.len;
    }
    return s;
  }
  function first(K, pos) {
    for (const L of [3, 2, 1]) { const s = K.substr(pos, L); if (s.length === L && T[s]) return { len: L, roma: T[s][0] }; }
    return cands(K, pos)[0];
  }

  function create(kana) {
    const K = toHira(kana);
    const st = { K, pos: 0, buf: '', typed: '', miss: 0 };
    /** commits a finished chunk */
    const commit = (c) => { st.pos += c.len; st.buf = ''; };
    function feed(ch) {
      const cs = cands(K, st.pos);
      const next = st.buf + ch;
      if (cs.some((c) => c.roma.startsWith(next))) {
        st.buf = next;
        const done = cs.filter((c) => c.roma === next);
        const longer = cs.some((c) => c.roma.length > next.length && c.roma.startsWith(next));
        if (done.length && !longer) commit(done.sort((a, b) => b.len - a.len)[0]);
        return true;
      }
      // the buffer already spells a whole chunk (e.g. a single n before a consonant): finish it, then ch starts the next chunk
      const whole = st.buf && cs.filter((c) => c.roma === st.buf).sort((a, b) => b.len - a.len)[0];
      if (whole && st.pos + whole.len < K.length) {
        const save = { pos: st.pos, buf: st.buf };
        commit(whole);
        if (feed(ch)) return true;
        st.pos = save.pos; st.buf = save.buf;
      }
      return false;
    }
    return {
      get kana() { return K; },
      get typed() { return st.typed; },
      get kanaDone() { return st.pos; },
      get done() { return st.pos >= K.length; },
      input(key) {
        const ch = String(key).toLowerCase();
        if (st.pos >= K.length || ch.length !== 1) return { ok: false, done: st.pos >= K.length };
        if (feed(ch)) { st.typed += ch; return { ok: true, done: st.pos >= K.length }; }
        st.miss++;
        return { ok: false, done: false };
      },
      /** what is left to type (most common spelling, following the spelling already started) */
      rest() {
        let s = '', pos = st.pos;
        if (st.buf) {
          const cs = cands(K, pos).filter((c) => c.roma.startsWith(st.buf));
          const pick = cs.find((c) => c.roma === st.buf && c.len === 1 && K[pos] === 'ん') || cs.sort((a, b) => b.len - a.len || cs.indexOf(a) - cs.indexOf(b))[0];
          if (pick) { s += pick.roma.slice(st.buf.length); pos += pick.len; }
        }
        return s + preferred(K, pos);
      },
      guide() { return st.typed + this.rest(); },
      /** the next key the guide expects (for the on-screen keyboard) */
      nextKey() { return this.rest()[0] || ''; },
    };
  }
  const api = { create, preferred: (k) => preferred(toHira(k), 0), toHira, table: T };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.Romaji = api;
})(typeof window !== 'undefined' ? window : globalThis);
