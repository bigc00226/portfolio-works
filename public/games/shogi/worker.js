/* 縁側将棋 — CPU の思考を別スレッドで（画面が固まらないように） */
importScripts('rules.js', 'ai.js');
self.onmessage = (e) => {
  const req = e.data;
  try {
    const pos = self.ShogiRules.Position.fromSFEN(req.sfen);
    for (const m of req.moves) pos.make(m);
    const r = self.ShogiAI.think(pos, req.opts || {});
    self.postMessage({ id: req.id, move: r.move, score: r.score, depth: r.depth, nodes: r.nodes, ms: r.ms });
  } catch (err) {
    self.postMessage({ id: req.id, move: 0, error: String(err && err.message || err) });
  }
};
