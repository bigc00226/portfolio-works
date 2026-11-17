/* TOOLS: every tool / stack name of the videos and sites, scrolling (the list is drawn twice for a seamless loop). */
export function ToolsStrip({ tools }: { tools: string[] }) {
  return (
    <div className="tools" aria-label="使用しているツール・技術">
      <div className="container">
        <p>TOOLS</p>
        <div className="marquee">
          <div className="marquee-track">
            <ul>{tools.map((t) => <li key={t}>{t}</li>)}</ul>
            <ul aria-hidden="true">{tools.map((t) => <li key={t}>{t}</li>)}</ul>
          </div>
        </div>
      </div>
    </div>
  );
}
