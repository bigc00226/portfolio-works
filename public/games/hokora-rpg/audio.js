/*
 * 宵灯りのほこら — original music and sound effects (GK.music / GK.tone, Japanese scales). All tunes are new.
 * Melodies are written as scale degrees (0 = root) and turned into note names.
 */
(function () {
  'use strict';
  const NN = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const nm = (m) => NN[((m % 12) + 12) % 12] + (Math.floor(m / 12) - 1);
  const M = { C3: 48, D3: 50, E3: 52, F3: 53, G3: 55, A3: 57, C4: 60, D4: 62, E4: 64, F4: 65, G4: 67, A4: 69, B3: 59, C2: 36, D2: 38, E2: 40, F2: 41, G2: 43, A2: 45 };
  /** degrees → note names in a scale ('.' rest, '-' hold, '|' bar line) */
  function deg(root, scale, str) {
    const s = GK.scales[scale] || scale, n = s.length;
    return str.trim().split(/\s+/).map((t) => {
      if (t === '.' || t === '-' || t === '|') return t;
      const d = parseInt(t, 10), o = Math.floor(d / n), i = ((d % n) + n) % n;
      return nm(M[root] + s[i] + o * 12);
    }).join(' ');
  }

  const SONGS = {
    title: {
      bpm: 70, steps: 2,
      tracks: [
        { type: 'sine', v: 0.15, a: 0.04, notes: deg('D4', 'yo', '4 - 5 - 7 - 6 5 | 4 - - - 2 - 3 - | 4 - 3 2 1 - 2 - | 0 - - - - - . . | 2 - 3 - 4 - 7 - | 6 - 5 4 5 - - - | 4 - 3 - 2 - 1 2 | 0 - - - - - . .') },
        { type: 'triangle', v: 0.07, notes: deg('D3', 'yo', '0 4 7 4 | 9 7 4 2 | -1 3 6 3 | 8 6 3 1 | 0 4 7 4 | 9 7 4 2 | 1 4 6 4 | 0 2 4 7') },
        { type: 'sine', v: 0.06, a: 0.2, notes: deg('D2', 'yo', '0 - - - - - - - | 3 - - - - - - - | 2 - - - - - - - | 0 - - - - - - -') },
      ],
    },
    home: {
      bpm: 84, steps: 2,
      tracks: [
        { type: 'triangle', v: 0.12, notes: deg('C4', 'yo', '2 - 3 - 4 3 2 - | 1 - 2 - 0 - - - | 2 3 4 - 5 - 4 3 | 2 - - - - - . . | 4 - 3 2 1 - 2 - | 3 - 2 1 0 - - - | 1 - 2 - 3 - 4 - | 2 - - - 0 - . .') },
        { type: 'sine', v: 0.09, notes: deg('C3', 'yo', '0 . 4 . 2 . 4 . | -2 . 2 . 0 . 2 . | -1 . 3 . 1 . 3 . | 0 . 4 . 2 . 4 .') },
      ],
    },
    village: {
      bpm: 104, steps: 2,
      tracks: [
        { type: 'triangle', v: 0.13, notes: deg('G4', 'yo', '2 3 4 - 3 2 1 - | 2 - 0 - 1 - - - | 2 3 4 5 4 - 3 - | 2 - - - - - . . | 4 5 6 - 5 4 3 - | 4 - 2 - 3 - - - | 2 1 0 1 2 - 3 - | 1 - - - 0 - . .') },
        { type: 'square', v: 0.035, notes: deg('G3', 'yo', '. 4 . 4 . 3 . 3 | . 2 . 2 . 3 . 3 | . 4 . 4 . 5 . 5 | . 4 . 4 . 2 . 2') },
        { type: 'triangle', v: 0.12, notes: deg('G2', 'yo', '0 . 4 . 0 . 4 . | 3 . 0 . 3 . 0 . | 1 . 3 . 1 . 3 . | 0 . 4 . 0 . 4 .') },
      ],
      drums: { k: 'x . . . x . . .', h: '. . x . . . x .' },
    },
    field: {
      bpm: 126, steps: 2,
      tracks: [
        { type: 'square', v: 0.07, notes: deg('D4', 'yo', '0 - 2 - 4 - 5 - | 4 - 3 2 3 - - - | 0 - 2 - 4 - 7 - | 6 - 5 - 4 - - - | 5 - 4 3 2 - 4 - | 3 - 2 1 2 - - - | 0 1 2 3 4 - 3 2 | 1 - - - 0 - . .') },
        { type: 'triangle', v: 0.09, notes: deg('D4', 'yo', '. . 0 . . . 2 . | . . 1 . . . 0 . | . . 2 . . . 4 . | . . 3 . . . 2 .') },
        { type: 'triangle', v: 0.13, notes: deg('D2', 'yo', '0 . 0 4 0 . 0 4 | 3 . 3 2 3 . 3 2 | 2 . 2 1 2 . 2 1 | 0 . 0 4 3 . 2 1') },
      ],
      drums: { k: 'x . . . x . x .', s: '. . x . . . x .', h: 'x . x . x . x .' },
    },
    forest: {
      bpm: 84, steps: 2,
      tracks: [
        { type: 'sine', v: 0.14, a: 0.03, notes: deg('E4', 'in', '2 - - 1 2 - 3 - | 4 - - - 3 - - - | 2 - 1 - 0 - -1 - | 0 - - - - - . . | 3 - 4 - 5 - 4 3 | 2 - - - 1 - - - | 0 - 1 - 2 - 1 - | 0 - - - - - . .') },
        { type: 'triangle', v: 0.06, notes: deg('E3', 'in', '. 4 . 2 . 4 . 2 | . 3 . 1 . 3 . 1') },
        { type: 'sine', v: 0.1, a: 0.1, notes: deg('E2', 'in', '0 - - - - - - - | -2 - - - - - - - | -1 - - - - - - - | 0 - - - -2 - - -') },
      ],
      drums: { t: 'x . . . . . . . . . . . x . . .' },
    },
    cave: {
      bpm: 72, steps: 2,
      tracks: [
        { type: 'triangle', v: 0.11, notes: deg('C4', 'in', '0 - . 1 0 - . -1 | 0 - - - . . . . | 2 - . 3 2 - . 1 | 2 - - - . . . . | 4 - 3 - 2 - 1 - | 2 - - - 1 - - - | 0 - -1 - -2 - -1 - | 0 - - - . . . .') },
        { type: 'sine', v: 0.11, a: 0.15, notes: deg('C2', 'in', '0 - - - - - - - | 1 - - - - - - - | -1 - - - - - - - | 0 - - - - - - -') },
        { type: 'sine', v: 0.04, notes: deg('C4', 'in', '. . . . . . 7 . | . . . . 6 . . . | . . . . . . 8 . | . . . . 7 . . .') },
      ],
      drums: { t: 'x . . . . . . . x . . . . . . .' },
    },
    shrine: {
      bpm: 64, steps: 2,
      tracks: [
        { type: 'sine', v: 0.14, a: 0.06, notes: deg('A3', 'in', '5 - - - 4 - 3 - | 2 - - - - - . . | 3 - 4 - 5 - 7 - | 6 - - - - - . . | 5 - 4 - 3 - 2 - | 1 - 2 - 3 - - - | 2 - 1 - 0 - 1 - | 0 - - - - - . .') },
        { type: 'triangle', v: 0.05, notes: deg('A3', 'in', '0 2 4 2 | 0 2 4 2 | -1 1 3 1 | -1 1 3 1') },
        { type: 'sine', v: 0.1, a: 0.2, notes: deg('A2', 'in', '0 - - - - - - - | 0 - - - - - - - | -2 - - - - - - - | -1 - - - - - - -') },
      ],
      drums: { t: 'x . . . . . . . x . . . x . . .' },
    },
    battle: {
      bpm: 152, steps: 2,
      tracks: [
        { type: 'square', v: 0.07, notes: deg('A4', 'in', '0 - 0 1 2 - 1 0 | 3 - 2 - 1 - - - | 0 - 0 1 2 - 4 - | 3 - - - 2 - - - | 5 - 4 3 4 - 3 2 | 3 - 2 1 2 - - - | 0 1 2 3 4 3 2 1 | 0 - - - -1 - - -') },
        { type: 'sawtooth', v: 0.045, notes: deg('A2', 'in', '0 0 . 0 0 0 . 0 | 2 2 . 2 1 1 . 1 | 0 0 . 0 0 0 . 0 | -2 -2 . -2 -1 -1 . -1') },
        { type: 'triangle', v: 0.06, notes: deg('A3', 'in', '. 2 . 2 . 3 . 3 | . 4 . 4 . 3 . 3') },
      ],
      drums: { k: 'x . . x x . . .', s: '. . x . . . x .', h: 'x x x x x x x x' },
    },
    boss: {
      bpm: 160, steps: 2,
      tracks: [
        { type: 'square', v: 0.07, notes: deg('D4', 'in', '0 - 1 - 0 - -1 - | 0 - 3 - 2 - - - | 0 - 1 - 2 - 3 - | 4 - - - 3 - - - | 5 - 4 - 5 - 6 - | 7 - 6 5 4 - - - | 3 - 2 - 1 - 2 - | 0 - - - - - . .') },
        { type: 'sawtooth', v: 0.05, notes: deg('D2', 'in', '0 0 0 . 0 0 1 . | 0 0 0 . -1 -1 -2 . | 0 0 0 . 0 0 1 . | 2 2 2 . 1 1 0 .') },
      ],
      drums: { k: 'x . x . x . x .', s: '. . x . . . x x', t: 'x . . . . . . . x . . . . x . .', h: '. x . x . x . x' },
    },
    final: {
      bpm: 168, steps: 2,
      tracks: [
        { type: 'square', v: 0.07, notes: deg('C4', 'in', '4 - 3 - 4 - 5 - | 4 - - - 2 - - - | 3 - 2 - 3 - 4 - | 3 - - - 1 - - - | 2 - 3 - 4 - 7 - | 6 - 5 - 4 - 3 - | 2 - 1 - 0 - 1 - | 2 - - - - - . .') },
        { type: 'sawtooth', v: 0.05, notes: deg('C2', 'in', '0 . 0 0 . 0 0 . | 1 . 1 1 . 1 1 . | -1 . -1 -1 . -1 -1 . | 0 . 0 0 1 . 2 .') },
        { type: 'triangle', v: 0.05, notes: deg('C4', 'in', '. 7 . 6 . 7 . 5 | . 6 . 5 . 6 . 4') },
      ],
      drums: { k: 'x . . x x . x .', s: '. . x . . . x .', t: 'x . . . x . . . x . . . x . x .', h: 'x x x x x x x x' },
    },
    ending: {
      bpm: 86, steps: 2,
      tracks: [
        { type: 'triangle', v: 0.13, notes: deg('F4', 'yo', '2 - 3 - 4 - - - | 3 - 2 - 1 - - - | 2 - 4 - 5 - 7 - | 6 - - - 5 - - - | 4 - 5 - 6 - 7 - | 6 - 5 - 4 - 2 - | 3 - 4 - 3 - 2 - | 1 - - - - - . . | 2 - 3 - 4 - - - | 5 - 4 - 3 - - - | 2 - 4 - 5 - 7 - | 8 - - - 7 - - - | 6 - 5 - 4 - 3 - | 2 - 4 - 3 - 1 - | 2 - 1 - 0 - - - | 0 - - - - - . .') },
        { type: 'sine', v: 0.07, notes: deg('F3', 'yo', '0 2 4 2 0 2 4 2 | -2 0 2 0 -2 0 2 0 | -1 1 3 1 -1 1 3 1 | 0 2 4 2 -3 -1 1 -1') },
        { type: 'sine', v: 0.09, a: 0.1, notes: deg('F2', 'yo', '0 - - - - - - - | -2 - - - - - - - | -1 - - - - - - - | 0 - - - -3 - - -') },
      ],
      drums: { t: 'x . . . . . . . x . . . . . . .' },
    },
    win: { bpm: 150, steps: 2, loop: false, tracks: [{ type: 'square', v: 0.08, notes: deg('C4', 'yo', '0 2 4 5 - 4 5 7 - - - - . .') }, { type: 'triangle', v: 0.1, notes: deg('C3', 'yo', '0 . 2 . 4 . 5 - - - - - . .') }] },
    gameover: { bpm: 80, steps: 2, loop: false, tracks: [{ type: 'sine', v: 0.14, notes: deg('A3', 'in', '4 - 3 - 2 - 1 - 0 - - - - - . .') }, { type: 'triangle', v: 0.07, notes: deg('A2', 'in', '0 - - - -1 - - - -2 - - - - - . .') }] },
  };

  const A = (window.AUDIO = {});
  let current = null;
  A.songs = SONGS;
  A.play = function (name, force) {
    if (!name) { GK.music.stop(); current = null; return; }
    if (current === name && GK.music.playing && !force) return;
    current = name;
    const s = SONGS[name];
    if (s) GK.music.play(s);
  };
  A.current = () => current;
  A.stop = () => { GK.music.stop(); current = null; };
  A.setVolume = function (v) { const bus = GK.audioOut && GK.audioOut('music'); if (bus) bus.gain.value = 0.3 * v; };

  // sound effects
  const T = GK.tone, Nz = GK.noise;
  const D = (n, f) => GK.sfx.define(n, f);
  D('cursor', () => T({ f: 1180, d: 0.03, type: 'triangle', v: 0.1 }));
  D('decide', () => { T({ f: 784, d: 0.05, type: 'triangle', v: 0.16 }); T({ f: 1175, d: 0.08, type: 'triangle', v: 0.14, at: 0.04 }); });
  D('cancel', () => T({ f: 520, f2: 330, d: 0.09, type: 'triangle', v: 0.14 }));
  D('talk', () => T({ f: 900 + Math.random() * 120, d: 0.018, type: 'square', v: 0.025 }));
  D('door', () => { Nz({ d: 0.18, v: 0.18, f: 700, q: 0.8 }); T({ f: 220, f2: 160, d: 0.12, type: 'sine', v: 0.2 }); });
  D('chest', () => { [660, 880, 1175, 1568].forEach((f, i) => T({ f, d: 0.12, type: 'triangle', v: 0.16, at: i * 0.06 })); });
  D('encounter', () => { Nz({ d: 0.5, v: 0.25, f: 1200, q: 0.6 }); [220, 233, 330, 349].forEach((f, i) => T({ f, d: 0.35, type: 'sawtooth', v: 0.05, at: i * 0.05 })); });
  D('slash', () => { Nz({ d: 0.12, v: 0.35, f: 3200, q: 1.2 }); T({ f: 900, f2: 200, d: 0.1, type: 'square', v: 0.05 }); });
  D('heavy', () => { Nz({ d: 0.2, v: 0.45, f: 1400, q: 0.7 }); T({ f: 180, f2: 50, d: 0.25, type: 'sine', v: 0.45 }); });
  D('claw', () => { Nz({ d: 0.1, v: 0.35, f: 2200, q: 2 }); Nz({ d: 0.1, v: 0.25, f: 1600, q: 2, at: 0.06 }); });
  D('fire', () => { Nz({ d: 0.45, v: 0.3, f: 900, filter: 'lowpass' }); T({ f: 300, f2: 700, d: 0.3, type: 'sawtooth', v: 0.05 }); });
  D('wind', () => { Nz({ d: 0.55, v: 0.25, f: 2500, q: 3 }); Nz({ d: 0.4, v: 0.18, f: 1500, q: 3, at: 0.12 }); });
  D('thunder', () => { Nz({ d: 0.7, v: 0.6, f: 600, filter: 'lowpass' }); T({ f: 1800, f2: 80, d: 0.25, type: 'square', v: 0.12 }); });
  D('holy', () => { [1047, 1319, 1568, 2093].forEach((f, i) => T({ f, d: 0.3, type: 'sine', v: 0.1, at: i * 0.05 })); });
  D('heal', () => { [784, 988, 1175, 1568].forEach((f, i) => T({ f, d: 0.2, type: 'triangle', v: 0.1, at: i * 0.06 })); });
  D('bell', () => { T({ f: 1760, d: 0.9, type: 'sine', v: 0.16 }); T({ f: 2637, d: 0.6, type: 'sine', v: 0.06 }); T({ f: 1764, d: 0.9, type: 'sine', v: 0.08, at: 0.02 }); });
  D('buff', () => T({ f: 400, f2: 1200, d: 0.3, type: 'triangle', v: 0.12 }));
  D('debuff', () => T({ f: 900, f2: 250, d: 0.3, type: 'triangle', v: 0.12 }));
  D('hurt', () => { Nz({ d: 0.16, v: 0.4, f: 700, q: 0.6 }); T({ f: 140, f2: 60, d: 0.18, type: 'square', v: 0.12 }); });
  D('miss', () => T({ f: 600, f2: 900, d: 0.08, type: 'sine', v: 0.1 }));
  D('vanish', () => { T({ f: 800, f2: 120, d: 0.4, type: 'sine', v: 0.14 }); Nz({ d: 0.35, v: 0.12, f: 3000, filter: 'highpass' }); });
  D('flee', () => { Nz({ d: 0.3, v: 0.2, f: 2000, q: 0.5 }); [880, 660, 440].forEach((f, i) => T({ f, d: 0.08, type: 'triangle', v: 0.1, at: i * 0.06 })); });
  D('levelup', () => { [523, 659, 784, 1047, 1319].forEach((f, i) => T({ f, d: i === 4 ? 0.5 : 0.12, type: 'square', v: 0.07, at: i * 0.08 })); });
  D('save', () => { [880, 1109, 1319].forEach((f, i) => T({ f, d: 0.4, type: 'sine', v: 0.12, at: i * 0.1 })); });
  D('spore', () => { Nz({ d: 0.4, v: 0.2, f: 4000, filter: 'highpass' }); });
  D('drain', () => T({ f: 900, f2: 200, d: 0.4, type: 'sine', v: 0.14 }));
  D('quake', () => { Nz({ d: 0.6, v: 0.5, f: 300, filter: 'lowpass' }); T({ f: 70, f2: 40, d: 0.5, type: 'sine', v: 0.5 }); });
  D('push', () => { Nz({ d: 0.15, v: 0.3, f: 400, filter: 'lowpass' }); });
  D('step', () => Nz({ d: 0.03, v: 0.05, f: 1800, q: 1 }));
  D('bump', () => T({ f: 120, f2: 90, d: 0.06, type: 'square', v: 0.05 }));
})();
