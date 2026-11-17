/* Top bar. `data-go` links pick a tab of the library (handled in Library). */
export function Header() {
  return (
    <header className="top">
      <div className="container">
        <a className="brand" href="#top" aria-label="Process Portfolio トップ">
          <span className="brand-mark"><i /></span>
          <span><b>Process Portfolio</b><small>制作過程の動画ポートフォリオ</small></span>
        </a>
        <nav aria-label="ページ内">
          <a href="#why">動画で見せる理由</a>
          <a href="#special" data-go="special">制作動画</a>
          <a href="#general" data-go="general">制作実績</a>
          <a href="#demo" data-go="demo">デモ</a>
        </nav>
      </div>
    </header>
  );
}
