/* 宵宮ビート — the original songs (composed here as note data), the synthesized instruments, and the charts made from the notes. window.MB */
(() => {
  'use strict';
  const MB = (window.MB = {});

  /* ---------------- songs ----------------
   * Each bar is 16 steps (16th notes). mel: 8 tokens per bar (8th notes) — a scale degree, '-' hold, '.' rest.
   * shami: a pattern name per section (or per bar), played on the bar's root (roots). taiko: 16 chars (D 大太鼓, d 締太鼓, k 縁), kane: 16 chars (c 鉦).
   */
  const R8 = '. . . . . . . .';
  const SONGS = [
    {
      id: 'yuunagi', title: '夕凪わっしょい', mood: '盆踊り・陽音階', bpm: 120, root: 62, scale: [0, 2, 5, 7, 9], color: '#f0883c', jacket: 'jacket-1',
      desc: '夕暮れの浜辺の盆踊り。のびやかな篠笛と、輪になって踊る太鼓。',
      sections: {
        I: { mel: [R8, R8], shami: ['rest', 'intro'], roots: [0, 0], taiko: ['D.......D.......', 'D...D...D.d.D.dd'], kane: ['................', 'c...c...c...c...'] },
        A: { mel: ['3 - 3 5 4 - 3 -', '2 - 3 2 1 - - -', '3 - 3 5 6 - 5 -', '4 - 3 4 5 - - -', '6 - 5 4 3 - 2 3', '4 - 3 2 1 - 2 -', '3 - 2 1 0 - 1 2', '0 - - - . . . .'],
          shami: 'A', roots: [0, 2, 0, 3, 3, 2, 1, 0], taiko: 'D..dk.d.D..dk.d.', fill: 'D.d.k.d.D.d.DdDd', kane: '..c...c...c...c.' },
        B: { mel: ['5 - 5 - 6 5 4 -', '5 - - - 3 - . .', '5 - 5 - 6 5 7 -', '6 - - - . . . .', '7 - 6 5 6 - 5 4', '5 - 4 3 4 - - -', '3 4 5 - 4 3 2 -', '3 - - - . . . .'],
          shami: 'B', roots: [0, 0, 0, 1, 2, 0, 1, 1], taiko: 'D.d.k.d.D.d.k.d.', fill: 'D.D.d.d.D.dDdDdD', kane: 'c.c.c.c.c.c.c.c.' },
        O: { mel: ['3 - 2 - 1 - 2 -', '0 - - - - - - -'], shami: ['A', 'end'], roots: [1, 0], taiko: ['D...k...D...k...', 'D...............'], kane: ['c...c...c...c...', 'c...............'] },
      },
      form: ['I', 'A', 'B', 'A', 'B', 'O'],
      tune: { mirror: [[18, 26]], level: [2, 5, 8] },
    },
    {
      id: 'kitsunebi', title: '狐火の小径', mood: '夜祭・都節', bpm: 136, root: 64, scale: [0, 1, 5, 7, 8], color: '#38b3a4', jacket: 'jacket-2',
      desc: '竹やぶの小径に揺れる青い火。少し不思議な都節の調べ。',
      sections: {
        I: { mel: [R8, R8], shami: ['trem', 'intro'], roots: [0, 0], taiko: ['D.......k.......', 'D.....d.k...d.d.'], kane: ['c.......c.......', 'c.......c...c...'] },
        A: { mel: ['2 - - 3 4 - 3 2', '3 - - - 1 - - -', '2 - - 3 4 - 5 4', '3 - - - - - . .', '5 - 4 3 4 - 3 2', '1 - 2 1 0 - - -', '2 - 3 - 4 3 2 1', '0 - - - . . . .'],
          shami: 'A', roots: [0, 1, 0, 2, 2, 1, 0, 0], taiko: 'D...k..dD...k...', fill: 'D...k.d.D.d.k.kk', kane: '....c.......c...' },
        B: { mel: ['5 - 6 - 7 - 6 5', '6 - 5 4 5 - - -', '5 - 6 - 7 - 8 7', '6 - - - - - . .', '7 6 5 - 6 5 4 -', '5 4 3 - 4 3 2 -', '3 - 4 - 5 - 4 3', '2 - - - 3 - - -'],
          shami: 'B', roots: [0, 1, 0, 1, 2, 2, 1, 0], taiko: 'D.k.d.k.D.k.d.k.', fill: 'D.d.d.d.DdDdD.D.', kane: 'c...c.c.c...c.c.' },
        C: { mel: ['5 - 6 - 7 - 6 5', '6 - 5 4 5 - - -', '5 - 6 - 7 - 8 7', '6 - - - - - . .', '7 6 5 - 6 5 4 -', '5 4 3 - 4 3 2 -', '3 - 4 - 3 - 2 1', '0 - - - . . . .'],
          shami: 'C', roots: [0, 1, 0, 1, 2, 2, 1, 0], taiko: 'D.kdD.k.D.kdD.k.', fill: 'D.d.D.d.DdDdDdDd', kane: 'c.c.c.c.c.c.c.c.' },
        O: { mel: ['0 - - - . . . .', R8], shami: ['trem', 'end'], roots: [0, 0], taiko: ['D...k...D.d.k...', 'D...............'], kane: ['c.......c.......', 'c...............'] },
      },
      form: ['I', 'A', 'B', 'A', 'C', 'O'],
      tune: { mirror: [[18, 26]], level: [3, 6, 9] },
    },
    {
      id: 'tairin', title: '大輪の夜', mood: '花火・ヨナ抜き', bpm: 158, root: 67, scale: [0, 2, 4, 7, 9], color: '#e9467a', jacket: 'jacket-3',
      desc: '川面に咲く大輪の花火。はやいテンポで駆けぬける終盤の一曲。',
      sections: {
        I: { mel: [R8, R8], shami: ['B', 'intro'], roots: [0, 0], taiko: ['D.D.D.D.D.D.D.D.', 'D.d.D.d.DdDdDddd'], kane: ['c.c.c.c.c.c.c.c.', 'c.c.c.c.c.c.c.c.'] },
        A: { mel: ['0 . 2 3 4 - 3 2', '3 - 2 1 0 - - -', '0 . 2 3 4 - 5 4', '3 - - - - - . .', '4 . 4 5 6 - 5 4', '5 - 4 3 2 - 3 -', '4 . 3 2 1 - 2 1', '0 - - - . . . .'],
          shami: 'A', roots: [0, 1, 0, 3, 1, 2, 1, 0], taiko: 'D.k.D.kdD.k.D.kd', fill: 'D.d.D.d.DdDdDdDd', kane: 'c.c.c.c.c.c.c.c.' },
        B: { mel: ['5 - 5 - 6 5 4 5', '6 - - - 4 - - -', '5 - 5 - 6 5 7 6', '5 - - - - - . .', '7 - 6 5 6 - 5 4', '5 - 4 3 4 - 2 -', '3 4 5 - 6 5 4 3', '5 - - - - - - -'],
          shami: 'B', roots: [0, 1, 0, 3, 1, 2, 3, 0], taiko: 'D.kdD.kdD.kdD.kd', fill: 'DdDdDdDdD.D.DdDd', kane: 'c.cc.cc.c.cc.cc.' },
        O: { mel: ['5 - 4 - 3 - 2 -', '0 - - - - - - -'], shami: ['B', 'end'], roots: [0, 0], taiko: ['D.d.D.d.D.d.DdDd', 'D...............'], kane: ['c.c.c.c.c.c.c.c.', 'c...............'] },
      },
      form: ['I', 'A', 'B', 'A', 'B', 'O'],
      tune: { mirror: [[18, 26]], level: [4, 7, 11] },
    },
  ];
  MB.SONGS = SONGS;

  const SHAMI = {
    rest: () => ['.', '.', '.', '.', '.', '.', '.', '.'],
    intro: (r) => ['.', '.', '.', '.', r, r + 1, r + 2, r + 3],
    trem: (r) => [r, '.', r, '.', r + 1, '.', r, '.'],
    A: (r) => [r, '.', r + 2, r + 1, r, '.', r + 2, '.'],
    B: (r) => [r, r + 2, r + 3, r + 2, r, r + 2, r + 3, r + 2],
    C: (r) => [r, r, r + 2, r, r + 3, r, r + 2, r],
    end: (r) => [r, '.', '.', '.', '.', '.', '.', '.'],
  };
  const midiOf = (song, d) => { const s = song.scale, n = s.length, o = Math.floor(d / n), i = ((d % n) + n) % n; return song.root + s[i] + 12 * o; };
  const hz = (m) => 440 * Math.pow(2, (m - 69) / 12);

  /** expands a song into timed audio events and the note lists the charts are made from */
  function build(song) {
    const st = 60 / song.bpm / 4; // seconds per 16th step
    const mel = [], sham = [], drums = [], ev = [];
    let bar = 0, cur = null;
    for (const secName of song.form) {
      const sec = song.sections[secName], nb = sec.mel.length;
      for (let b = 0; b < nb; b++, bar++) {
        const s0 = bar * 16;
        sec.mel[b].trim().split(/\s+/).forEach((tk, i) => {
          const s = s0 + i * 2;
          if (tk === '-') { if (cur) cur.len += 2; return; }
          cur = null;
          if (tk === '.') return;
          cur = { s, deg: +tk, len: 2, bar };
          mel.push(cur);
        });
        const pat = Array.isArray(sec.shami) ? sec.shami[b] : sec.shami;
        SHAMI[pat](sec.roots[b]).forEach((d, i) => { if (d !== '.') sham.push({ s: s0 + i * 2, deg: d - 5, bar }); });
        const last = b === nb - 1;
        const tk = Array.isArray(sec.taiko) ? sec.taiko[b] : last && sec.fill ? sec.fill : sec.taiko;
        const kn = Array.isArray(sec.kane) ? sec.kane[b] : sec.kane;
        for (let i = 0; i < 16; i++) {
          if ('Ddk'.includes(tk[i])) drums.push({ s: s0 + i, k: tk[i], bar, fill: last && !Array.isArray(sec.taiko) });
          if (kn[i] === 'c') ev.push({ t: (s0 + i) * st, kind: 'kane', v: i % 4 === 0 ? 0.08 : 0.055 });
        }
      }
    }
    for (const m of mel) ev.push({ t: m.s * st, kind: 'fue', f: hz(midiOf(song, m.deg)), d: m.len * st, v: 0.17 });
    for (const m of sham) ev.push({ t: m.s * st, kind: 'shami', f: hz(midiOf(song, m.deg)), v: m.s % 4 === 0 ? 0.13 : 0.1 });
    for (const d of drums) ev.push({ t: d.s * st, kind: 'taiko', k: d.k, v: d.k === 'D' ? 0.55 : d.k === 'd' ? 0.32 : 0.18 });
    ev.sort((a, b) => a.t - b.t);
    song.st = st; song.bars = bar; song.mel = mel; song.sham = sham; song.drums = drums; song.events = ev;
    song.length = bar * 16 * st;
    song.charts = [0, 1, 2].map((d) => makeChart(song, d));
    return song;
  }

  /* ---------------- charts (deterministic: rules + the song's tuning table) ---------------- */
  function makeChart(song, diff) {
    const st = song.st, cand = [];
    let lo = Infinity, hi = -Infinity;
    for (const m of song.mel) { lo = Math.min(lo, m.deg); hi = Math.max(hi, m.deg); }
    const pitchLane = (d, a = lo, b = hi) => Math.max(0, Math.min(3, Math.floor(((d - a) / (b - a + 1)) * 4)));
    const melAt = new Set(song.mel.map((m) => m.s));
    const sounding = (s) => song.mel.some((m) => s >= m.s && s < m.s + m.len);
    const holdMin = [8, 6, 6][diff];
    if (diff === 0) {
      for (const m of song.mel) if (m.s % 4 === 0) cand.push({ s: m.s, lane: pitchLane(m.deg), len: m.len >= holdMin ? m.len - 2 : 0, src: 'm', deg: m.deg });
      for (const d of song.drums) if (d.k === 'D' && d.s % 16 === 0 && !melAt.has(d.s) && !sounding(d.s)) cand.push({ s: d.s, lane: null, len: 0, src: 'D' });
    } else if (diff === 1) {
      for (const m of song.mel) cand.push({ s: m.s, lane: pitchLane(m.deg), len: m.len >= holdMin ? m.len - 2 : 0, src: 'm', deg: m.deg });
      for (const d of song.drums) if (d.k === 'D' && d.s % 4 === 0 && !sounding(d.s) && !melAt.has(d.s)) cand.push({ s: d.s, lane: null, len: 0, src: 'D' });
    } else {
      let slo = Infinity, shi = -Infinity;
      for (const m of song.sham) { slo = Math.min(slo, m.deg); shi = Math.max(shi, m.deg); }
      for (const m of song.mel) cand.push({ s: m.s, lane: pitchLane(m.deg), len: m.len >= holdMin ? m.len - 2 : 0, src: 'm', deg: m.deg });
      for (const m of song.sham) if (!melAt.has(m.s) && !melAt.has(m.s - 1)) cand.push({ s: m.s, lane: pitchLane(m.deg, slo, shi), len: 0, src: 's', deg: m.deg });
      for (const d of song.drums) {
        if (d.fill && !melAt.has(d.s)) cand.push({ s: d.s, lane: null, len: 0, src: d.k });
        else if (d.k === 'D' && d.s % 16 === 0 && melAt.has(d.s)) cand.push({ s: d.s, lane: null, len: 0, src: 'chord' });
        else if (d.k === 'D' && d.s % 4 === 0 && !melAt.has(d.s) && !sounding(d.s) && !song.sham.some((m) => m.s === d.s)) cand.push({ s: d.s, lane: null, len: 0, src: 'D' });
      }
    }
    // the grid each difficulty keeps to: quarter / eighth / sixteenth notes
    const grid = [4, 2, 1][diff], minGap = [4, 2, 1][diff], jackGap = [4, 4, 2][diff];
    cand.sort((a, b) => a.s - b.s || (a.src === 'm' ? -1 : 1));
    const mirror = (song.tune.mirror || []).some(() => true);
    const notes = [], lastIn = [-99, -99, -99, -99], busy = [-1, -1, -1, -1];
    let lastS = -99, drumAlt = 0, prevLane = 1;
    for (const c of cand) {
      if (c.s % grid) continue;
      const chord = c.src === 'chord';
      if (!chord && c.s - lastS < minGap) continue;
      if (chord && !notes.length) continue;
      const free = (l) => busy[l] < c.s && c.s - lastIn[l] >= (chord ? 0 : jackGap) && !(chord && lastIn[l] === c.s);
      let lane = c.lane;
      if (chord) { const first = notes[notes.length - 1]; if (first.s !== c.s) continue; lane = first.lane < 2 ? 3 : 0; if (!free(lane)) lane = first.lane < 2 ? 2 : 1; }
      else if (lane == null) { const pick = c.src === 'D' ? [1, 2] : [0, 3]; lane = pick[drumAlt++ % 2]; }
      if (mirror && song.tune.mirror.some(([a, b]) => c.s >= a * 16 && c.s < b * 16)) lane = 3 - lane;
      // keep to free lanes: nearest free lane, away from the previous note when it repeats
      if (!free(lane)) {
        const order = [lane + 1, lane - 1, lane + 2, lane - 2, lane + 3, lane - 3].filter((l) => l >= 0 && l < 4);
        if (lane === prevLane) order.sort((a, b) => Math.abs(a - lane) - Math.abs(b - lane));
        lane = order.find(free);
        if (lane == null) continue;
      }
      // at most two lanes in use at once (fits two thumbs)
      const inUse = busy.filter((e) => e >= c.s).length + notes.filter((n) => n.s === c.s).length;
      if (inUse >= 2) continue;
      let len = c.len;
      if (len) { const next = cand.find((x) => x.s > c.s && x.s <= c.s + len && x.src === 'm'); if (next) len = Math.max(0, next.s - c.s - 2); if (len < 4) len = 0; if (len % grid) len -= len % grid; }
      notes.push({ s: c.s, lane, len, src: c.src });
      lastIn[lane] = c.s; if (len) busy[lane] = c.s + len;
      if (!chord) lastS = c.s;
      prevLane = lane;
    }
    for (const n of notes) { n.t = n.s * st; n.te = (n.s + n.len) * st; }
    const units = notes.length + notes.filter((n) => n.len).length;
    const span = notes.length ? notes[notes.length - 1].t - notes[0].t : 1;
    return { diff, notes, units, grid, level: song.tune.level[diff], nps: notes.length / span };
  }

  /* ---------------- instruments (WebAudio, synthesized) ---------------- */
  let noiseBuf = null;
  function noise(c) {
    if (!noiseBuf) { noiseBuf = c.createBuffer(1, c.sampleRate, c.sampleRate); const ch = noiseBuf.getChannelData(0); for (let i = 0; i < ch.length; i++) ch[i] = Math.random() * 2 - 1; }
    const s = c.createBufferSource(); s.buffer = noiseBuf; s.loop = true; return s;
  }
  function burst(c, out, t, d, v, f, type = 'bandpass', q = 1) {
    const s = noise(c), fl = c.createBiquadFilter(), g = c.createGain();
    fl.type = type; fl.frequency.value = f; fl.Q.value = q;
    g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    s.connect(fl); fl.connect(g); g.connect(out); s.start(t, Math.random() * 0.5); s.stop(t + d + 0.02);
  }
  const INST = {
    /** 篠笛: sine + a little of the octave, a breathy attack and a vibrato that grows in */
    fue(c, out, e, t) {
      const d = Math.max(0.12, e.d), v = e.v, f = e.f;
      const o = c.createOscillator(), o2 = c.createOscillator(), g = c.createGain(), g2 = c.createGain(), lfo = c.createOscillator(), lg = c.createGain();
      o.type = 'sine'; o2.type = 'triangle';
      o.frequency.setValueAtTime(f * 0.97, t); o.frequency.exponentialRampToValueAtTime(f, t + 0.05);
      o2.frequency.setValueAtTime(f * 2 * 0.97, t); o2.frequency.exponentialRampToValueAtTime(f * 2, t + 0.05);
      lfo.frequency.value = 5.4; lg.gain.setValueAtTime(0, t); lg.gain.linearRampToValueAtTime(f * 0.011, t + Math.min(0.4, d * 0.7));
      lfo.connect(lg); lg.connect(o.frequency);
      g2.gain.value = 0.16; o2.connect(g2); g2.connect(g); o.connect(g);
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + 0.035);
      g.gain.setValueAtTime(v, t + Math.max(0.04, d - 0.05)); g.gain.exponentialRampToValueAtTime(0.0001, t + d + 0.09);
      g.connect(out);
      [o, o2, lfo].forEach((x) => { x.start(t); x.stop(t + d + 0.12); });
      burst(c, out, t, 0.07, v * 0.22, 2400, 'bandpass', 0.8);
    },
    /** 三味線: a plucked sawtooth through a closing low-pass, fast decay, plus the bachi's click */
    shami(c, out, e, t) {
      const o = c.createOscillator(), o2 = c.createOscillator(), fl = c.createBiquadFilter(), g = c.createGain();
      o.type = 'sawtooth'; o2.type = 'sawtooth'; o.frequency.value = e.f; o2.frequency.value = e.f * 1.004;
      fl.type = 'lowpass'; fl.Q.value = 5; fl.frequency.setValueAtTime(Math.min(9000, e.f * 9), t); fl.frequency.exponentialRampToValueAtTime(e.f * 1.6, t + 0.22);
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(e.v, t + 0.003); g.gain.exponentialRampToValueAtTime(e.v * 0.22, t + 0.09); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.42);
      o.connect(fl); o2.connect(fl); fl.connect(g); g.connect(out);
      o.start(t); o2.start(t); o.stop(t + 0.45); o2.stop(t + 0.45);
      burst(c, out, t, 0.018, e.v * 0.7, 4200, 'highpass', 0.7);
    },
    /** 太鼓: D 大太鼓 (low, long), d 締太鼓 (higher, short), k 縁 (rim) */
    taiko(c, out, e, t) {
      if (e.k === 'k') { burst(c, out, t, 0.035, e.v, 2600, 'bandpass', 2); const o = c.createOscillator(), g = c.createGain(); o.type = 'square'; o.frequency.value = 1150; g.gain.setValueAtTime(e.v * 0.25, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.03); o.connect(g); g.connect(out); o.start(t); o.stop(t + 0.05); return; }
      const big = e.k === 'D', o = c.createOscillator(), g = c.createGain();
      o.type = 'sine'; o.frequency.setValueAtTime(big ? 118 : 210, t); o.frequency.exponentialRampToValueAtTime(big ? 46 : 120, t + (big ? 0.32 : 0.12));
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(e.v, t + 0.004); g.gain.exponentialRampToValueAtTime(0.0001, t + (big ? 0.55 : 0.2));
      o.connect(g); g.connect(out); o.start(t); o.stop(t + 0.6);
      burst(c, out, t, big ? 0.09 : 0.05, e.v * 0.45, big ? 260 : 900, 'lowpass', 0.7);
    },
    /** 鉦: inharmonic metallic partials with fast decay */
    kane(c, out, e, t) {
      [[1210, 0.22], [2780, 0.14], [3960, 0.09], [5530, 0.06]].forEach(([f, d], i) => {
        const o = c.createOscillator(), g = c.createGain();
        o.type = i ? 'sine' : 'triangle'; o.frequency.value = f;
        g.gain.setValueAtTime(e.v / (i + 1), t); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
        o.connect(g); g.connect(out); o.start(t); o.stop(t + d + 0.02);
      });
      burst(c, out, t, 0.03, e.v * 0.6, 7000, 'highpass', 0.5);
    },
  };
  MB.play = (c, out, e, t) => INST[e.kind](c, out, e, t);
  MB.taiko = (c, out, t, k, v) => INST.taiko(c, out, { k, v }, t);

  SONGS.forEach(build);
})();
