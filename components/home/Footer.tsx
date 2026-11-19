import { Arrow } from './icons';

export function Footer({ note }: { note: string }) {
  return (
    <footer className="foot">
      <div className="container foot-in">
        <div>
          <a className="brand" href="#top" aria-label="Process Portfolio トップ">
            <span className="brand-mark"><i /></span>
            <span><b>Process Portfolio</b><small>制作過程の動画ポートフォリオ</small></span>
          </a>
          <nav className="foot-nav" aria-label="ページ内">
            <a href="#why">動画で見せる理由</a>
            <a href="#flow">収録している工程</a>
            <a href="#special" data-go="special">制作動画</a>
            <a href="#general" data-go="general">制作実績</a>
            <a href="#demo" data-go="demo">デモ</a>
            <a href="#game" data-go="game">ゲーム</a>
          </nav>
        </div>
        <div>
          <p>
            再生ページの操作：<kbd>Space</kbd> 再生 / 一時停止　<kbd>←</kbd><kbd>→</kbd> 5 秒移動　<kbd>F</kbd> 全画面　<kbd>C</kbd> 字幕の表示切替<br />
            マウスを止めると、操作バーとポインターは自動で隠れます。
          </p>
          {note && <p>{note}</p>}
        </div>
        <div className="foot-copy">
          <span>© {new Date().getFullYear()} Process Portfolio</span>
          <a className="to-top" href="#top">ページの先頭へ<Arrow /></a>
        </div>
      </div>
    </footer>
  );
}
