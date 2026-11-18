/*
 * 宵灯りのほこら — turn-based command battles: commands (こうげき・わざ・どうぐ・まもる・にげる), targets, the round
 * (HR.resolve in data.js does the math), animations (effects, damage numbers, shakes), victory, level-ups, boss phases.
 */
(function () {
  'use strict';
  const HR = window.HR, GFX = window.GFX, AU = window.AUDIO, G = window.G;
  const S = G.S, R = G.R, V = G.V;
  const B = (G.B = { active: false });
  const CARD_H = 46;

  /* ---------------- layout ---------------- */
  function layout() {
    const W = V.W, H = V.H, b = B.b, n = b.foes.length;
    const top = 34, bottom = H - CARD_H - 10;
    const areaH = bottom - top;
    const k = Math.min(1.65, Math.max(1.1, H / 210));
    const base = H > 300 ? Math.min(top + areaH * 0.8, H - CARD_H - 10 - 92) : top + areaH * 0.9;
    let sizes = b.foes.map((e) => Math.min(HR.ENEMIES[e.id].size * k, areaH * 0.95, base - top + 8));
    const gap = 6;
    let total = sizes.reduce((s, x) => s + x * 0.9, 0) + gap * (n - 1);
    if (total > W - 12) { const f = (W - 12 - gap * (n - 1)) / (total - gap * (n - 1)); sizes = sizes.map((s) => s * f); total = W - 12; }
    let x = (W - total) / 2;
    b.foes.forEach((e, i) => { const s = sizes[i]; e.v.x = x + (s * 0.9) / 2; e.v.base = base; e.v.size = s; x += s * 0.9 + gap; });
    const cw = Math.min(150, (W - 8 - 8) / 3), total2 = cw * b.party.length + 4 * (b.party.length - 1);
    let cx = (W - total2) / 2;
    b.party.forEach((p) => { p.v.cx = cx; p.v.cy = H - CARD_H - 4; p.v.cw = cw; cx += cw + 4; });
  }
  const centerOf = (a) => (a.side === 'e' ? { x: a.v.x, y: a.v.base - a.v.size * 0.5 } : { x: a.v.cx + a.v.cw / 2, y: a.v.cy + CARD_H / 2 });

  /* ---------------- timing ---------------- */
  let skip = false;
  const fast = () => !!G.autoMsg;
  function wait(ms) {
    if (fast()) ms = Math.min(ms, 40);
    return new Promise((res) => { const t0 = performance.now(); const tick = () => { if (skip || performance.now() - t0 >= ms) { skip = false; res(); } else setTimeout(tick, 16); }; tick(); });
  }
  async function logMsg(text) {
    B.log.push({ text, t: R.t });
    if (B.log.length > 3) B.log.shift();
    await wait(Math.max(420, Math.min(950, 260 + text.length * 26)));
  }
  B.logMsg = logMsg;

  /* ---------------- visuals ---------------- */
  function pop(a, text, color, big) { const c = centerOf(a); const n = B.pops.filter((p) => p.who === a && p.t < 0.6).length; B.pops.push({ who: a, x: c.x + (Math.random() - 0.5) * 8, y: (a.side === 'e' ? c.y : a.v.cy - 2) - n * 13, text: String(text), color, t: 0, big }); }
  function fx(type, targets, from) {
    const dur = { slash: 0.32, slash2: 0.42, slash3: 0.6, sweep: 0.5, claw: 0.32, fire: 0.55, fireE: 0.6, wind: 0.6, windE: 0.6, thunder: 0.55, holy: 0.7, heal: 0.6, healE: 0.6, buff: 0.45, bell: 0.6, spore: 0.55, drain: 0.55, echo: 0.5, quake: 0.6, bubbles: 0.6, leaves: 0.6, sweepE: 0.45, dark: 0.6, darkwave: 0.7 }[type] || 0.4;
    B.fx.push({ type, pts: targets.map(centerOf), side: targets[0] ? targets[0].side : 'e', t: 0, dur });
    const snd = { slash: 'slash', slash2: 'heavy', slash3: 'heavy', sweep: 'slash', claw: 'claw', fire: 'fire', fireE: 'fire', wind: 'wind', windE: 'wind', thunder: 'thunder', holy: 'holy', heal: 'heal', healE: 'heal', buff: 'buff', bell: 'bell', spore: 'spore', drain: 'drain', echo: 'bell', quake: 'quake', bubbles: 'splash', leaves: 'wind', sweepE: 'claw', dark: 'debuff', darkwave: 'boom' }[type];
    if (snd) GK.sfx(snd);
    if (type === 'thunder' || type === 'darkwave' || type === 'quake') R.shake = 0.3;
    if (type === 'thunder') R.flash = { c: 'rgba(255,255,230,', t: 0.25 };
    return wait(dur * 1000 * 0.8);
  }
  async function play(evs) {
    for (const e of evs) {
      const a = e.target;
      switch (e.type) {
        case 'msg': await logMsg(e.text); break;
        case 'fx': await fx(e.fx, e.targets, e.from); break;
        case 'dmg':
          a.v.hp = e.after; a.v.shake = 0.35; a.v.flash = 0.35;
          pop(a, e.amount, a.side === 'e' ? (e.weak ? '#ffd27a' : '#ffffff') : '#ff8a7a', e.crit || e.weak);
          if (a.side === 'p') { GK.sfx('hurt'); if (e.amount > a.mhp * 0.25) R.shake = 0.25; } else if (!e.poison) GK.sfx('hit');
          await wait(220); break;
        case 'heal': a.v.hp = e.after; if (e.amount > 0) pop(a, '+' + e.amount, '#9cf08a'); await wait(120); break;
        case 'mp': a.v.mp = e.after; break;
        case 'die': GK.sfx(a.side === 'e' ? 'vanish' : 'hurt'); a.v.dying = 0.001; await wait(a.side === 'e' ? 420 : 300); break;
        case 'revive': a.v.hp = e.after; a.v.dying = 0; a.v.alpha = 1; GK.sfx('holy'); break;
        case 'miss': pop(a, 'ミス', '#c8c8d0'); GK.sfx('miss'); await wait(120); break;
        case 'st': if (e.st) GK.sfx('debuff'); break;
        case 'buff': if (e.key) GK.sfx(e.key === 'defdown' ? 'debuff' : 'buff'); break;
        case 'useItem': G.take(e.item); break;
        case 'flee': if (e.ok) B.fled = true; break;
      }
    }
  }

  /* ---------------- the battle ---------------- */
  G.battle = async function (ids, o = {}) {
    const boss = o.boss != null ? o.boss : ids.some((id) => HR.ENEMIES[id].boss);
    const b = { rnd: Math.random, boss, round: 0, fleeTries: 0 };
    b.party = S.party.map((id) => HR.partyActor(id, S.chars[id]));
    b.foes = HR.enemyActors(ids);
    b.party.concat(b.foes).forEach((a) => { a.v = { hp: a.hp, hpD: a.hp, mp: a.mp, shake: 0, flash: 0, alpha: a.side === 'e' ? 0 : 1, dying: a.hp <= 0 && a.side === 'p' ? 0 : 0 }; });
    Object.assign(B, { b, bg: o.bg || 'bg-field', log: [], fx: [], pops: [], cmdActor: null, targetSel: null, fled: false, t: 0, final: ids.includes('yoigurai') });
    // transition from the field
    GK.sfx('encounter');
    for (let i = 0; i < 2; i++) { R.flash = { c: 'rgba(255,255,255,', t: 0.12 }; await GK.wait(fast() ? 10 : 110); }
    await G.fadeTo(1, fast() ? 30 : 260);
    R.mode = 'battle'; B.active = true; G.updateTopbar();
    layout();
    AU.play(B.final ? 'final' : boss ? 'boss' : 'battle');
    const exec = G.push({ wants: () => B.executing, key: (a) => { if (a === 'ok' || a === 'cancel') skip = true; }, tap: () => { skip = true; }, draw: () => {} });
    await G.fadeTo(0, fast() ? 30 : 260);
    b.foes.forEach((e) => GK.tween(e.v, { alpha: 1 }, 380));
    B.executing = true;
    const names = [...new Set(b.foes.map((e) => e.baseName))];
    await logMsg(boss ? `${b.foes[0].name}が立ちはだかった！` : names.length === 1 && b.foes.length > 1 ? `${names[0]}が ${b.foes.length} 匹あらわれた！` : `${names.join('と')}があらわれた！`);
    let result = null;
    try {
      while (!result) {
        B.executing = false;
        const cmds = G.autoBattle ? autoCmds(b) : await chooseCommands(b);
        B.executing = true;
        B.log = [];
        if (cmds === 'flee') {
          b.fleeTries++;
          await logMsg('コハルたちは逃げ出した！');
          if (Math.random() < HR.fleeChance(b)) { GK.sfx('flee'); await logMsg('うまく逃げきれた！'); result = 'flee'; break; }
          await logMsg('しかし、回りこまれてしまった！');
        }
        const acts = [];
        if (cmds !== 'flee') for (const [a, c] of cmds) { if (c.kind === 'guard') a.guard = true; acts.push({ actor: a, act: c, first: c.kind === 'guard' || (c.kind === 'skill' && HR.SKILLS[c.skill].first) }); }
        for (const p of b.party) if (p.hp > 0 && p.st.sleep && !acts.some((x) => x.actor === p)) acts.push({ actor: p, act: { kind: 'guard' } });
        for (const e of b.foes) if (e.hp > 0) { acts.push({ actor: e, act: HR.enemyChoose(b, e) }); if (HR.bossTwice(e)) acts.push({ actor: e, act: HR.enemyChoose(b, e) }); }
        for (const x of HR.order(b, acts)) {
          if (x.actor.hp <= 0) continue;
          if (x.act.kind === 'item' && !(S.inv[x.act.item] > 0)) { await logMsg(`${x.actor.name}は道具を使おうとしたが、もう残っていなかった。`); continue; }
          if (x.actor.side === 'e') x.actor.v.lunge = 0.3;
          await play(HR.resolve(b, x.actor, x.act));
          await phaseCheck(b);
          if (B.fled) { await logMsg('うまく逃げきれた！'); result = 'flee'; break; }
          if (b.foes.every((e) => e.hp <= 0)) { result = 'win'; break; }
          if (b.party.every((p) => p.hp <= 0)) { result = 'lose'; break; }
        }
        if (result) break;
        await play(HR.endRound(b));
        await phaseCheck(b);
        if (b.foes.every((e) => e.hp <= 0)) result = 'win';
        b.round++;
      }
      // write HP / 気 back
      b.party.forEach((p) => { const c = S.chars[p.id]; c.hp = Math.max(0, p.hp); c.mp = p.mp; });
      if (result === 'lose') {
        await logMsg('コハルたちは、力つきてしまった……');
        await wait(600);
        G.pop(exec); B.active = false;
        await G.fadeTo(1, 600);
        await G.gameOver();
      }
      if (result === 'win') await victory(b);
    } finally {
      G.pop(exec); B.executing = false;
    }
    await G.fadeTo(1, fast() ? 30 : 300);
    B.active = false;
    R.mode = 'field'; G.updateTopbar();
    if (!o.keepMusic) AU.play(R.map.def.music, true);
    await G.fadeTo(0, fast() ? 30 : 300);
    return result;
  };

  async function phaseCheck(b) {
    for (const e of b.foes) {
      const d = HR.ENEMIES[e.id];
      if (!d.boss || !d.low || e.lowShown || e.hp <= 0 || e.hp > e.mhp * d.low.at) continue;
      e.lowShown = true; e.v.phase2 = true; e.turn = 0;
      R.flash = { c: 'rgba(160,90,255,', t: 0.4 }; R.shake = 0.5; GK.sfx('boom');
      if (d.low.name) e.name = d.low.name;
      await logMsg(d.low.msg);
    }
  }

  async function victory(b) {
    AU.play('win');
    const rw = HR.rewards(b);
    await logMsg(b.boss ? `${b.foes[0].name}との戦いに勝った！` : '妖たちをしずめた！');
    S.gold += rw.gold;
    if (rw.exp) await logMsg(`経験値 ${rw.exp} と ${rw.gold} 文を手に入れた！`);
    for (const d of rw.drops) { G.give(d); GK.sfx('chest'); await logMsg(`${HR.ITEMS[d].name}を手に入れた！`); }
    const ups = [];
    for (const p of b.party) if (p.hp > 0) ups.push(...G.gainExp(p.id, rw.exp));
    for (const u of ups) await levelUpPanel(u);
    await wait(250);
  }
  function levelUpPanel(u) {
    GK.sfx('levelup');
    return new Promise((resolve) => {
      const t0 = R.t;
      const L = G.push({
        wants: () => true,
        key: (a) => { if ((a === 'ok' || a === 'cancel') && R.t - t0 > 0.3) done(); },
        tap: () => { if (R.t - t0 > 0.3) done(); },
        update: () => { if (G.autoMsg && R.t - t0 > 0.15) done(); },
        draw: (g) => {
          const W = V.W, H = V.H, w = Math.min(260, W - 20), h = 44 + 3 * 13 + u.skills.length * 13 + 8;
          const x = (W - w) / 2, y = Math.max(28, (H - CARD_H - h) / 2 - 4);
          GFX.frame(g, x, y, w, h, { bg: 'rgba(40,24,12,.95)' });
          GFX.face(g, GK.images[HR.CHARS[u.id].face], x + 8, y + 8, 30);
          GFX.text(g, `${HR.CHARS[u.id].name}は レベル ${u.lv} に上がった！`, x + 46, y + 10, { size: 11, color: '#ffe2a0' });
          const keys = ['hp', 'mp', 'atk', 'def', 'agi', 'spi'];
          keys.forEach((k, i) => {
            const cx = x + 14 + (i % 2) * (w / 2), cy = y + 44 + Math.floor(i / 2) * 13;
            const d = u.after[k] - u.before[k];
            GFX.text(g, `${HR.STAT_NAMES[k]}　${u.before[k]} → ${u.after[k]}`, cx, cy, { size: 10 });
            if (d > 0) GFX.text(g, `+${d}`, cx + w / 2 - 22, cy, { size: 10, align: 'right', color: '#9cf08a' });
          });
          u.skills.forEach((s, i) => GFX.text(g, `新しいわざ「${HR.SKILLS[s].name}」を覚えた！`, x + 14, y + 44 + 3 * 13 + 4 + i * 13, { size: 10, color: '#ffd27a' }));
          GFX.cursor(g, x + w - 10, y + h - 9, R.t);
        },
      });
      function done() { G.pop(L); GK.sfx('cursor'); resolve(); }
    });
  }

  /* ---------------- commands ---------------- */
  function autoCmds(b) {
    const m = new Map();
    for (const p of b.party) if (p.hp > 0 && !p.st.sleep) { const c = HR.autoChoose(b, p, S.inv); if (c.kind === 'skill' && HR.SKILLS[c.skill].type === 'cover') p.cover = true; m.set(p, c); }
    return m;
  }
  async function chooseCommands(b) {
    const list = b.party.filter((a) => a.hp > 0 && !a.st.sleep);
    const cmds = new Map(), reserve = {};
    let i = 0;
    while (i < list.length) {
      const a = list[i];
      B.cmdActor = a;
      const c = await commandFor(b, a, reserve, i > 0);
      if (c === 'back') {
        i--; const prev = list[i], pc = cmds.get(prev);
        if (pc && pc.kind === 'item') reserve[pc.item]--;
        if (pc && pc.kind === 'skill' && HR.SKILLS[pc.skill].type === 'cover') prev.cover = false;
        cmds.delete(prev); continue;
      }
      if (c === 'flee') { B.cmdActor = null; return 'flee'; }
      if (c.kind === 'item') reserve[c.item] = (reserve[c.item] || 0) + 1;
      if (c.kind === 'skill' && HR.SKILLS[c.skill].type === 'cover') a.cover = true;
      cmds.set(a, c); i++;
    }
    B.cmdActor = null;
    return cmds;
  }
  async function commandFor(b, a, reserve, canBack) {
    const H = V.H;
    const items = [{ label: 'こうげき' }, { label: 'わざ', disabled: !a.skills.length }, { label: 'どうぐ' }, { label: 'まもる' }, { label: 'にげる', disabled: b.boss }];
    const m = new G.Menu({ items, x: 4, y: H - CARD_H - 10 - 86, w: 76, title: a.name, cancel: true });
    try {
      while (true) {
        const i = await m.choose();
        if (i < 0) { if (canBack) return 'back'; continue; }
        if (i === 0) { const t = await pickTarget(b, 'enemy'); if (t) return { kind: 'attack', target: t }; continue; }
        if (i === 1) {
          const sk = await listWindow(a.skills.map((k) => { const s = HR.SKILLS[k]; return { key: k, label: s.name, right: '気' + s.mp, disabled: a.mp < s.mp, desc: s.desc + (a.mp < s.mp ? '（気が足りない）' : '') }; }), `${a.name}のわざ　気 ${a.mp}/${a.mmp}`);
          if (!sk) continue;
          const s = HR.SKILLS[sk];
          if (s.target === 'enemy') { const t = await pickTarget(b, 'enemy'); if (!t) continue; return { kind: 'skill', skill: sk, target: t }; }
          if (s.target === 'ally') { const t = await pickTarget(b, 'ally'); if (!t) continue; return { kind: 'skill', skill: sk, target: t }; }
          if (s.target === 'dead') { if (!b.party.some((p) => p.hp <= 0)) { GK.sfx('ng'); GK.toast('倒れている仲間はいない'); continue; } const t = await pickTarget(b, 'dead'); if (!t) continue; return { kind: 'skill', skill: sk, target: t }; }
          return { kind: 'skill', skill: sk };
        }
        if (i === 2) {
          const keys = Object.keys(S.inv).filter((k) => S.inv[k] - (reserve[k] || 0) > 0 && ['use', 'battle'].includes(HR.ITEMS[k].kind));
          if (!keys.length) { GK.sfx('ng'); GK.toast('戦いで使える道具がない'); continue; }
          const k = await listWindow(keys.map((k2) => ({ key: k2, label: HR.ITEMS[k2].name, right: '×' + (S.inv[k2] - (reserve[k2] || 0)), desc: HR.ITEMS[k2].desc })), 'どうぐ');
          if (!k) continue;
          const it = HR.ITEMS[k];
          if (it.target === 'ally') { const t = await pickTarget(b, 'ally'); if (!t) continue; return { kind: 'item', item: k, target: t }; }
          if (it.target === 'dead') { if (!b.party.some((p) => p.hp <= 0)) { GK.sfx('ng'); GK.toast('倒れている仲間はいない'); continue; } const t = await pickTarget(b, 'dead'); if (!t) continue; return { kind: 'item', item: k, target: t }; }
          return { kind: 'item', item: k };
        }
        if (i === 3) return { kind: 'guard' };
        if (i === 4) return 'flee';
      }
    } finally { m.close(); }
  }
  async function listWindow(items, title) {
    const H = V.H, W = V.W;
    const rows = Math.max(3, Math.min(6, items.length, Math.floor((H - CARD_H - 10 - 40 - 30) / 14)));
    const m = new G.Menu({ items, x: 84, y: H - CARD_H - 10 - (rows * 14 + 8 + 15), w: W - 88, rows, title, desc: { x: 4, y: 4, w: W - 60, h: 30 } });
    const i = await m.choose();
    m.close();
    return i < 0 ? null : items[i].key;
  }
  function pickTarget(b, kind) {
    const list = kind === 'enemy' ? b.foes.filter((e) => e.hp > 0) : kind === 'dead' ? b.party.filter((p) => p.hp <= 0) : b.party.filter((p) => p.hp > 0);
    if (!list.length) return Promise.resolve(null);
    return new Promise((resolve) => {
      let i = 0;
      B.targetSel = list[0];
      const done = (t) => { G.pop(L); B.targetSel = null; resolve(t); };
      const L = G.push({
        wants: () => true,
        key(a) {
          if (a === 'left' || a === 'up') { i = (i - 1 + list.length) % list.length; B.targetSel = list[i]; GK.sfx('cursor'); }
          if (a === 'right' || a === 'down') { i = (i + 1) % list.length; B.targetSel = list[i]; GK.sfx('cursor'); }
          if (a === 'ok') { GK.sfx('decide'); done(list[i]); }
          if (a === 'cancel' || a === 'menu') { GK.sfx('cancel'); done(null); }
        },
        tap(p) {
          const hit = list.find((t) => (t.side === 'e' ? Math.abs(p.x - t.v.x) < t.v.size * 0.42 && p.y > t.v.base - t.v.size && p.y < t.v.base + 4 : p.x >= t.v.cx && p.x <= t.v.cx + t.v.cw && p.y >= t.v.cy));
          if (hit) { GK.sfx('decide'); done(hit); } else { GK.sfx('cancel'); done(null); }
        },
        draw(g) {
          const t = B.targetSel; if (!t) return;
          GFX.frame(g, 4, 4, V.W - 60, 20);
          GFX.text(g, (kind === 'enemy' ? '　ねらう相手：' : '　だれに：') + t.name, 10, 8, { size: 10 });
        },
      });
    });
  }

  /* ---------------- drawing ---------------- */
  B.update = function (dt) {
    if (!B.b) return;
    B.t = (B.t || 0) + dt;
    for (const a of B.b.party.concat(B.b.foes)) {
      const v = a.v;
      v.shake = Math.max(0, v.shake - dt); v.flash = Math.max(0, v.flash - dt);
      if (v.lunge) v.lunge = Math.max(0, v.lunge - dt);
      v.hpD += (v.hp - v.hpD) * Math.min(1, dt * 8);
      if (v.dying) { v.dying += dt; if (a.side === 'e') v.alpha = Math.max(0, 1 - v.dying / 0.45); }
    }
    for (const p of B.pops) p.t += dt;
    B.pops = B.pops.filter((p) => p.t < 1.0);
    for (const f of B.fx) f.t += dt;
    B.fx = B.fx.filter((f) => f.t < f.dur);
    if (V.W !== B.lw || V.H !== B.lh) { B.lw = V.W; B.lh = V.H; layout(); }
  };
  B.draw = function (g) {
    const W = V.W, H = V.H, b = B.b;
    const sx = R.shake > 0 ? (Math.random() - 0.5) * 5 : 0, sy = R.shake > 0 ? (Math.random() - 0.5) * 4 : 0;
    g.fillStyle = '#0a0916'; g.fillRect(0, 0, W, H);
    GFX.cover(g, GK.images[B.bg], sx - 4, sy - 4, W + 8, H + 8);
    const gr = g.createLinearGradient(0, H * 0.55, 0, H);
    gr.addColorStop(0, 'rgba(8,8,20,0)'); gr.addColorStop(1, 'rgba(8,8,20,.75)');
    g.fillStyle = gr; g.fillRect(0, 0, W, H);
    if (B.final) { g.fillStyle = 'rgba(20,10,40,.35)'; g.fillRect(0, 0, W, H); }
    // enemies
    b.foes.forEach((e, i) => {
      const v = e.v;
      if (v.alpha <= 0.01 || v.size == null) return;
      const img = GK.images[HR.ENEMIES[e.id].img];
      const bob = Math.sin(B.t * 2.2 + i * 1.7) * (HR.ENEMIES[e.id].boss ? 2.5 : 1.5);
      const shx = v.shake > 0 ? Math.sin(v.shake * 80) * 3 : 0;
      const lunge = v.lunge ? Math.sin((0.3 - v.lunge) / 0.3 * Math.PI) * 6 : 0;
      const s = v.size * (v.phase2 ? 1.06 + Math.sin(B.t * 3) * 0.02 : 1);
      const x = v.x - s / 2 + shx + sx, y = v.base - s + bob + lunge + sy;
      g.save();
      g.globalAlpha = v.alpha;
      g.fillStyle = 'rgba(0,0,0,.3)'; g.beginPath(); g.ellipse(v.x + sx, v.base + 2 + sy, s * 0.32, s * 0.06, 0, 0, 7); g.fill();
      if (v.phase2) { const ag = g.createRadialGradient(v.x, v.base - s / 2, s * 0.1, v.x, v.base - s / 2, s * 0.7); ag.addColorStop(0, 'rgba(150,80,255,.45)'); ag.addColorStop(1, 'rgba(150,80,255,0)'); g.fillStyle = ag; g.fillRect(v.x - s, v.base - s * 1.3, s * 2, s * 1.5); }
      if (!(v.flash > 0 && Math.floor(v.flash * 30) % 2)) { g.imageSmoothingEnabled = true; if (img) g.drawImage(img, x, y, s, s); }
      if (v.dying) { g.globalCompositeOperation = 'lighter'; g.globalAlpha = Math.max(0, 0.5 - v.dying); if (img) g.drawImage(img, x, y - v.dying * 20, s, s); }
      g.restore();
      if (e.hp > 0 && Object.keys(e.st).length) { let k = 0; for (const st of Object.keys(e.st)) { const tag = HR.STATUS[st]; g.fillStyle = tag.color; g.fillRect(v.x - 14 + k * 15, v.base + 4, 14, 9); GFX.text(g, tag.name.slice(0, 2), v.x - 7 + k * 15, v.base + 4.5, { size: 7, align: 'center', shadow: false }); k++; } }
      if (HR.ENEMIES[e.id].boss && e.hp > 0) { const bw = Math.min(140, W * 0.4); GFX.gauge(g, v.x - bw / 2, Math.max(28, v.base - s - 6), bw, 3, v.hpD / e.mhp, '#e8604a'); }
      if (B.targetSel === e) GFX.cursor(g, v.x, v.base - s - 2 + Math.sin(R.t * 6) * 2, R.t);
    });
    // effects
    for (const f of B.fx) drawFx(g, f);
    // party cards
    b.party.forEach((p) => drawCard(g, p));
    // damage numbers
    for (const p of B.pops) {
      const k = p.t, y = p.y - 10 - Math.min(1, k * 4) * 10 + (k > 0.25 ? 0 : 0);
      g.save(); g.globalAlpha = Math.min(1, (1 - k) * 3);
      const size = p.big ? 17 : 14, sc = k < 0.12 ? 1 + (0.12 - k) * 4 : 1;
      g.translate(p.x, y); g.scale(sc, sc);
      g.font = GFX.font(size, 900); g.textAlign = 'center'; g.textBaseline = 'middle';
      g.lineWidth = 3; g.strokeStyle = 'rgba(20,10,10,.9)'; g.strokeText(p.text, 0, 0);
      g.fillStyle = p.color; g.fillText(p.text, 0, 0);
      g.restore();
    }
    // log
    if (B.log.length && !(G.topInput() && G.topInput().desc) && !B.targetSel) {
      const lines = B.log.slice(-2);
      GFX.frame(g, 4, 4, W - 60, 12 + lines.length * 14);
      lines.forEach((l, i) => GFX.text(g, l.text, 11, 9 + i * 14, { size: 10.5, color: i === lines.length - 1 ? '#fff8e8' : 'rgba(244,239,226,.7)' }));
    }
  };
  function drawCard(g, p) {
    const v = p.v, x = v.cx + (v.shake > 0 ? Math.sin(v.shake * 90) * 2 : 0), active = B.cmdActor === p || B.targetSel === p;
    const y = v.cy - (active ? 3 : 0), w = v.cw, h = CARD_H;
    GFX.frame(g, x, y, w, h, { bg: v.flash > 0 ? 'rgba(120,30,30,.95)' : p.hp <= 0 ? 'rgba(30,24,30,.92)' : 'rgba(17,19,40,.93)', line: active ? '#ffd27a' : undefined });
    const fs = 26;
    GFX.face(g, GK.images[HR.CHARS[p.id].face], x + 5, y + 5, fs, { dim: p.hp <= 0 });
    const tx = x + fs + 9, bw = w - fs - 15;
    GFX.text(g, p.name, tx, y + 4, { size: 10, color: p.hp <= 0 ? '#c88a80' : '#fff8e8' });
    GFX.text(g, `${Math.round(v.hpD)}/${p.mhp}`, x + w - 6, y + 5, { size: 9, align: 'right', color: p.hp < p.mhp * 0.3 ? '#ff9a8a' : '#fff8e8' });
    const hpc = p.hp <= 0 ? '#555' : v.hpD < p.mhp * 0.3 ? '#e8604a' : '#7cc46a';
    GFX.gauge(g, tx, y + 18, bw, 4, v.hpD / p.mhp, hpc);
    GFX.text(g, '気', tx, y + 24, { size: 8, color: '#8ab8e8' });
    GFX.text(g, String(v.mp), x + w - 6, y + 24, { size: 8, align: 'right', color: '#bcd4f0' });
    GFX.gauge(g, tx + 11, y + 27, bw - 26, 3, p.mmp ? v.mp / p.mmp : 0, '#6aa0e0');
    const tags = Object.keys(p.st).map((s) => [HR.STATUS[s].name, HR.STATUS[s].color]);
    if (p.buf.atk) tags.push(['力↑', '#b8662a']);
    if (p.buf.def) tags.push(['守↑', '#2a72b0']);
    if (p.buf.defdown) tags.push(['守↓', '#7a4a4a']);
    if (p.guard) tags.push(['まもり', '#4a6a4a']);
    if (p.hp <= 0) { tags.length = 0; GFX.text(g, '倒れている', x + 6, y + 34, { size: 8, color: '#e8806a' }); }
    tags.slice(0, 4).forEach(([t, c], k) => { const tw = 25; g.fillStyle = c; g.fillRect(x + 5 + k * (tw + 2), y + 35, tw, 8); GFX.text(g, t, x + 5 + k * (tw + 2) + tw / 2, y + 35.3, { size: 6.5, align: 'center', shadow: false }); });
    if (B.targetSel === p) GFX.cursor(g, x + w / 2, y - 6 + Math.sin(R.t * 6) * 2, R.t);
  }
  function drawFx(g, f) {
    const p = f.t / f.dur;
    g.save();
    for (const pt of f.pts) {
      const { x, y } = pt;
      switch (f.type) {
        case 'slash': case 'slash2': case 'slash3': {
          const n = f.type === 'slash' ? 1 : f.type === 'slash2' ? 2 : 3;
          for (let i = 0; i < n; i++) {
            const q = Math.min(1, Math.max(0, p * (n + 0.5) - i * 0.6));
            if (q <= 0) continue;
            g.strokeStyle = `rgba(255,255,255,${1 - q * 0.8})`; g.lineWidth = 3 - q * 2;
            const off = (i - (n - 1) / 2) * 8;
            g.beginPath(); g.moveTo(x - 22 + off, y - 22 + off * 0.2); g.lineTo(x - 22 + off + 44 * q, y - 22 + off * 0.2 + 44 * q); g.stroke();
          }
          break;
        }
        case 'sweep': case 'sweepE': {
          g.strokeStyle = `rgba(255,${f.type === 'sweepE' ? 160 : 255},${f.type === 'sweepE' ? 160 : 255},${1 - p})`; g.lineWidth = 3;
          g.beginPath(); g.arc(x, y + 6, 26, Math.PI * (1.1 + p * 0.3), Math.PI * (1.1 + p * 1.1)); g.stroke();
          break;
        }
        case 'claw': {
          g.strokeStyle = `rgba(255,120,110,${1 - p})`; g.lineWidth = 2;
          for (let i = 0; i < 3; i++) { g.beginPath(); g.moveTo(x - 14 + i * 7, y - 16); g.lineTo(x - 18 + i * 7 + 14 * Math.min(1, p * 2), y - 16 + 30 * Math.min(1, p * 2)); g.stroke(); }
          break;
        }
        case 'fire': case 'fireE': {
          for (let i = 0; i < 12; i++) {
            const a = i * 0.52 + p * 3, r = 4 + p * 20 * ((i % 3) + 1) / 3;
            const fx2 = x + Math.cos(a) * r * 0.6, fy = y + 10 - p * 34 * ((i % 4) + 1) / 4;
            g.fillStyle = `rgba(255,${120 + (i % 3) * 50},40,${(1 - p) * 0.9})`; g.beginPath(); g.arc(fx2, fy, 4 + (1 - p) * 4, 0, 7); g.fill();
          }
          break;
        }
        case 'wind': case 'windE': case 'leaves': {
          g.strokeStyle = `rgba(200,255,230,${1 - p})`; g.lineWidth = 1.6;
          for (let i = 0; i < 3; i++) { g.beginPath(); g.arc(x, y, 8 + i * 8 + p * 8, p * 9 + i, p * 9 + i + 2.4); g.stroke(); }
          if (f.type === 'leaves') for (let i = 0; i < 8; i++) { g.fillStyle = `rgba(110,170,70,${1 - p})`; g.fillRect(x + Math.cos(i + p * 8) * (10 + p * 24), y + Math.sin(i * 1.7 + p * 8) * (10 + p * 18), 3, 2); }
          break;
        }
        case 'thunder': {
          if (p < 0.6) { g.strokeStyle = '#fff6b0'; g.lineWidth = 2.5; g.beginPath(); let yy = Math.max(0, y - 120); g.moveTo(x, yy); while (yy < y) { yy += 10; g.lineTo(x + (Math.random() - 0.5) * 14, yy); } g.stroke(); }
          g.fillStyle = `rgba(255,250,200,${(1 - p) * 0.5})`; g.beginPath(); g.arc(x, y, 18 * (1 - p) + 6, 0, 7); g.fill();
          break;
        }
        case 'holy': case 'heal': case 'healE': case 'bell': case 'buff': {
          const col = f.type === 'holy' ? '255,220,140' : f.type === 'bell' ? '220,230,255' : f.type === 'buff' ? '255,200,120' : '160,255,170';
          g.strokeStyle = `rgba(${col},${1 - p})`; g.lineWidth = 1.5;
          g.beginPath(); g.arc(x, y, 6 + p * 26, 0, 7); g.stroke();
          for (let i = 0; i < 8; i++) { const yy = y + 14 - ((p * 40 + i * 9) % 40); g.fillStyle = `rgba(${col},${(1 - p) * 0.9})`; g.fillRect(x - 16 + i * 4.5, yy, 1.6, 1.6); }
          break;
        }
        case 'spore': case 'bubbles': {
          for (let i = 0; i < 10; i++) { const a = i * 0.63; g.fillStyle = f.type === 'spore' ? `rgba(200,170,255,${1 - p})` : `rgba(160,220,255,${1 - p})`; g.beginPath(); g.arc(x + Math.cos(a) * p * 26, y + Math.sin(a) * p * 18 - p * 8, 2.5, 0, 7); g.fill(); }
          break;
        }
        case 'drain': case 'dark': case 'darkwave': case 'echo': {
          const col = f.type === 'echo' ? '255,240,180' : '150,80,255';
          g.strokeStyle = `rgba(${col},${1 - p})`; g.lineWidth = 2;
          for (let i = 0; i < 3; i++) { g.beginPath(); g.arc(x, y, Math.max(1, (f.type === 'drain' ? (1 - p) : p) * 30 - i * 7), 0, 7); g.stroke(); }
          if (f.type === 'darkwave') { g.fillStyle = `rgba(40,10,70,${(1 - p) * 0.35})`; g.fillRect(0, 0, V.W, V.H); }
          break;
        }
        case 'quake': {
          g.fillStyle = `rgba(120,90,60,${(1 - p) * 0.6})`;
          for (let i = 0; i < 6; i++) g.fillRect(x - 24 + i * 9, y + 12 - p * 18 * ((i % 3) + 1) / 3, 5, 5);
          break;
        }
      }
    }
    g.restore();
  }
})();
