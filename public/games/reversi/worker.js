/* 喫茶しろくろ — CPU の思考を別スレッドで（画面が固まらないように） */
importScripts('rules.js', 'ai.js');
self.onmessage = (e) => {
  const req = e.data;
  try {
    const r = self.ReversiAI.think(Int8Array.from(req.board), req.side, req.opts || {});
    self.postMessage({ id: req.id, move: r.move, score: r.score, depth: r.depth, exact: r.exact, ms: r.ms });
  } catch (err) {
    self.postMessage({ id: req.id, move: -1, error: String(err && err.message || err) });
  }
};
