'use client';
/* When an admin page fails (on the server, or while drawing in the browser), this shows what failed instead of a
   blank page, and sends it to the server log (app/(admin)/admin/client-error/route.ts → the hosting's logs). */
import { useEffect } from 'react';
import { reportAdminError } from '@/lib/admin-report';

export default function AdminError({ error, retry }: { error: unknown; retry: () => void }) {
  const e = error instanceof Error ? error : new Error(typeof error === 'string' ? error : JSON.stringify(error));
  const digest = (e as Error & { digest?: string }).digest;
  useEffect(() => {
    const x = error instanceof Error ? error : new Error(String(error));
    const d = (x as Error & { digest?: string }).digest;
    reportAdminError('boundary', [`${x.name}: ${x.message}${d ? ` (digest ${d})` : ''}`, (x.stack || '').split('\n').slice(0, 6).join('\n')]);
  }, [error]);
  return (
    <div className="login">
      <div className="login-card">
        <h1>このページを表示できませんでした</h1>
        <p>もう一度読み込むと直ることがあります。続く場合は、下の内容をお知らせください（サーバーの記録にも残しています）。</p>
        <pre className="ad-msg err" style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all', margin: '0 0 16px', fontFamily: 'var(--mono)', fontSize: 12 }}>
          {digest ? `サーバーのエラー（digest: ${digest}）\n` : ''}{e.message || String(error)}
        </pre>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button className="ad-btn" type="button" onClick={() => retry()}>もう一度読み込む</button>
          <a className="ad-btn ghost" href="/admin">ダッシュボードを開き直す</a>
        </div>
      </div>
    </div>
  );
}
