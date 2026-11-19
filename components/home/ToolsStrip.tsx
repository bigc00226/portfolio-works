/* TOOLS: every tool / stack name of the videos and sites in two rows that drift in opposite directions
   (each row is drawn twice for a seamless loop; hovering pauses it). */
export function ToolsStrip({ tools }: { tools: string[] }) {
  const half = Math.ceil(tools.length / 2);
  const rows = [tools.slice(0, half), tools.slice(half)];
  return (
    <section className="tools" aria-label="使用しているツール・技術">
      <div className="container tools-head">
        <p>TOOLS &amp; STACK</p>
        <span>制作動画とサイトで使っている {tools.length} のツール・技術</span>
      </div>
      {rows.map((row, r) => (
        <div key={r} className={`marquee${r ? ' rev' : ''}`}>
          <div className="mq-track" style={{ '--t': `${Math.max(40, row.length * 3.2)}s` } as React.CSSProperties}>
            <ul>{row.map((t) => <li key={t}>{t}</li>)}</ul>
            <ul aria-hidden="true">{row.map((t) => <li key={t}>{t}</li>)}</ul>
          </div>
        </div>
      ))}
    </section>
  );
}
