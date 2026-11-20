'use client';
/* The last resort for every section (list page, player, admin): an error in a root layout itself. Instead of a blank
   page, it says what failed and offers a reload; on /admin it is also sent to the server log (lib/admin-report.ts). */
import { useEffect } from 'react';
import { reportAdminError } from '@/lib/admin-report';

export default function GlobalError({ error, retry }: { error: unknown; retry: () => void }) {
  const e = error instanceof Error ? error : new Error(typeof error === 'string' ? error : JSON.stringify(error));
  const digest = (e as Error & { digest?: string }).digest;
  useEffect(() => {
    const x = error instanceof Error ? error : new Error(String(error));
    const d = (x as Error & { digest?: string }).digest;
    reportAdminError('global', [`${x.name}: ${x.message}${d ? ` (digest ${d})` : ''}`, (x.stack || '').split('\n').slice(0, 6).join('\n')]);
  }, [error]);
  return (
    <html lang="ja">
      <body style={{ margin: 0, minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24, background: '#f3f4f7', color: '#0b0f19', font: '14px/1.7 "Segoe UI", "Yu Gothic UI", Meiryo, sans-serif' }}>
        <title>エラー</title>
        <div style={{ width: 'min(520px, 100%)', padding: 28, borderRadius: 18, background: '#fff', boxShadow: '0 18px 50px -18px rgba(16,24,40,.28)' }}>
          <h1 style={{ margin: '0 0 8px', fontSize: 20 }}>ページを表示できませんでした</h1>
          <p style={{ margin: '0 0 14px', color: '#6b7180' }}>もう一度読み込むと直ることがあります。</p>
          <pre style={{ margin: '0 0 16px', padding: 12, borderRadius: 10, background: '#fbeaea', color: '#b42323', whiteSpace: 'pre-wrap', wordBreak: 'break-all', font: '12px/1.6 Consolas, monospace' }}>
            {digest ? `digest: ${digest}\n` : ''}{e.message || String(error)}
          </pre>
          <button type="button" onClick={() => retry()} style={{ height: 40, padding: '0 18px', border: 0, borderRadius: 10, background: '#2a5bd7', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>もう一度読み込む</button>
        </div>
      </body>
    </html>
  );
}
