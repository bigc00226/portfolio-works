export function Footer({ note }: { note: string }) {
  return (
    <footer className="foot">
      <div className="container">
        <p>
          再生ページの操作：<kbd>Space</kbd> 再生 / 一時停止　<kbd>←</kbd><kbd>→</kbd> 5 秒移動　<kbd>F</kbd> 全画面　<kbd>C</kbd> 字幕の表示切替<br />
          マウスを止めると、操作バーとポインターは自動で隠れます。
        </p>
        <p>{note}</p>
      </div>
    </footer>
  );
}
