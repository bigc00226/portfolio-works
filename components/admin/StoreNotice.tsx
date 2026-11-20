/* A warning on the admin pages when the records are kept only in a temporary file (lib/server/db.ts: store()). */
import { store } from '@/lib/server/db';

export function StoreNotice() {
  const st = store();
  if (st.persistent) return null;
  return (
    <div className="ad-banner">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 3 2.5 20h19z" /><path d="M12 10v4M12 17h.01" /></svg>
      <span>
        {st.note}、アクセスの記録とパスワードの変更は一時ファイルに書いています。サーバーが入れ替わると消えます。
        記録を残すには、Turso（クラウドの SQLite）を接続して環境変数 TURSO_DATABASE_URL・TURSO_AUTH_TOKEN を設定してください（README の「管理画面とアクセス解析」）。
      </span>
    </div>
  );
}
