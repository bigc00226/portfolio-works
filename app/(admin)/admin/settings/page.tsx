/* /admin/settings — the password, the owner's own address, the data (export / delete). */
import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { requireAdmin, isInitialPassword, signedInSessions } from '@/lib/server/auth';
import { all, get, getMeta, store } from '@/lib/server/db';
import { clientIp } from '@/lib/server/client';
import { fmtN, fmtDateTime } from '@/lib/admin-format';
import { Shell, PageHead } from '@/components/admin/Shell';
import { StoreNotice } from '@/components/admin/StoreNotice';
import { PasswordForm, PurgeForm } from '@/components/admin/ui';
import { passwordAction, purgeAction, excludeMeAction, revokeAction, excludeAction } from '../actions';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: '設定' };

export default async function SettingsPage() {
  await requireAdmin();
  const ip = clientIp(await headers());
  const [me, excluded, n, changedAt, sessions, initial] = await Promise.all([
    get<{ id: number; excluded: number }>('SELECT id, excluded FROM visitors WHERE ip = ?', ip),
    all<{ id: number; ip: string; note: string; last_seen: number }>('SELECT id, ip, note, last_seen FROM visitors WHERE excluded = 1 ORDER BY last_seen DESC'),
    get<{ visitors: number; views: number; events: number; first: number | null }>(
      'SELECT (SELECT COUNT(*) FROM visitors) AS visitors, (SELECT COUNT(*) FROM views) AS views, (SELECT COUNT(*) FROM events) AS events, (SELECT MIN(ts) FROM views) AS first'),
    getMeta('password_changed'),
    signedInSessions(),
    isInitialPassword(),
  ]);
  const changed = Number(changedAt || 0);
  const st = store();
  return (
    <Shell active="settings">
      <PageHead title="設定" sub="パスワード、集計から除外する IP アドレス、記録の書き出しと削除" />
      <StoreNotice />
      <div className="ad-grid">
        <section className="ad-card">
          <header className="ad-card-h"><div><h3>パスワードの変更</h3><p>{initial ? '初期設定のパスワードのままです' : `最後の変更：${fmtDateTime(changed)}`}</p></div></header>
          <PasswordForm action={passwordAction} />
        </section>

        <section className="ad-card">
          <header className="ad-card-h"><div><h3>自分のアクセスを除外</h3><p>自分で確認したときのアクセスを、集計に含めないようにします</p></div></header>
          <dl className="kv" style={{ marginBottom: 14 }}>
            <dt>このブラウザーの IP</dt><dd className="mono">{ip}</dd>
            <dt>状態</dt><dd>{me?.excluded ? <span className="chip">除外中</span> : <span className="chip blue">集計に含まれています</span>}</dd>
          </dl>
          {!me?.excluded && <form action={excludeMeAction}><button className="ad-btn sm">この IP アドレスを除外</button></form>}
          <h4 className="mini-h" style={{ marginTop: 22 }}>除外中の IP アドレス（{excluded.length}）</h4>
          {excluded.length ? (
            <ul className="ex-list">
              {excluded.map((x) => (
                <li key={x.id}>
                  <a className="mono row-link" href={`/admin/visitors/${x.id}`}>{x.ip}</a>
                  {x.note && <span className="muted">{x.note}</span>}
                  <form action={excludeAction}><input type="hidden" name="id" value={x.id} /><input type="hidden" name="excluded" value="0" /><button className="ad-btn ghost sm">集計に戻す</button></form>
                </li>
              ))}
            </ul>
          ) : <p className="ad-hint">ありません。訪問者のページからも除外できます。</p>}
        </section>

        <section className="ad-card">
          <header className="ad-card-h"><div><h3>ログイン中のブラウザー</h3><p>この管理画面にログインしているブラウザーの数</p></div></header>
          <p style={{ margin: '0 0 14px', fontSize: 28, fontWeight: 700 }}>{sessions}<small style={{ fontSize: 13, color: 'var(--muted)', marginLeft: 4 }}>台</small></p>
          <p className="ad-hint" style={{ marginBottom: 14 }}>ログインは 7 日間有効です。パスワードを変更すると、ほかのブラウザーは自動でログアウトされます。</p>
          {sessions > 1 && <form action={revokeAction}><button className="ad-btn ghost sm">ほかのブラウザーをすべてログアウト</button></form>}
        </section>

        <section className="ad-card">
          <header className="ad-card-h"><div><h3>記録の書き出し</h3><p>Excel で開ける CSV（UTF-8・BOM 付き）。全期間</p></div></header>
          <dl className="kv" style={{ marginBottom: 16 }}>
            <dt>訪問者</dt><dd>{fmtN(n!.visitors)} 人</dd>
            <dt>ページビュー</dt><dd>{fmtN(n!.views)} 件</dd>
            <dt>操作</dt><dd>{fmtN(n!.events)} 件</dd>
            <dt>記録の開始</dt><dd>{n!.first ? fmtDateTime(n!.first) : '—'}</dd>
          </dl>
          <div className="ad-toolbar" style={{ marginBottom: 0 }}>
            <a className="ad-btn ghost sm" href="/admin/export?type=visitors&range=all&bots=1">訪問者</a>
            <a className="ad-btn ghost sm" href="/admin/export?type=views&range=all&bots=1">ページビュー</a>
            <a className="ad-btn ghost sm" href="/admin/export?type=events&range=all&bots=1">操作</a>
          </div>
        </section>

        <section className="ad-card">
          <header className="ad-card-h"><div><h3>記録の削除</h3><p>古い記録をまとめて削除します。元に戻せません</p></div></header>
          <PurgeForm action={purgeAction} />
        </section>

        <section className="ad-card">
          <header className="ad-card-h"><div><h3>データベース</h3><p>{st.kind === 'turso' ? 'SQLite（Turso・クラウド）' : 'SQLite（Node.js 組み込みの node:sqlite）'}</p></div></header>
          <dl className="kv">
            <dt>保存先</dt><dd>{st.kind === 'turso' ? 'Turso' : st.kind === 'file' ? 'サーバーのファイル' : <span className="chip warn">一時ファイル（記録は残りません）</span>}</dd>
            <dt>{st.kind === 'turso' ? 'ホスト' : 'ファイル'}</dt><dd className="mono">{st.where}</dd>
            <dt>記録する内容</dt><dd>IP アドレス、ブラウザー・OS・デバイス（User-Agent とクライアント ヒント）、言語、タイムゾーン、画面の大きさ、参照元、開いたページ、動画の再生位置と視聴時間</dd>
            <dt>記録しないもの</dt><dd>管理画面へのアクセス、「トラッキングしない」設定（Global Privacy Control）のブラウザー</dd>
          </dl>
        </section>
      </div>
    </Shell>
  );
}
