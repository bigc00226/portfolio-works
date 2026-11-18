/* ナンプレ帖 — puzzle generation off the main thread. { id, level, seed, timeLimit } → { id, result } */
importScripts('sudoku.js');
self.onmessage = function (e) {
  const m = e.data || {};
  let result = null;
  try { result = self.NP.generate(m.level, m.seed, { timeLimit: m.timeLimit || 8000 }); } catch (err) { result = null; }
  self.postMessage({ id: m.id, result });
};
