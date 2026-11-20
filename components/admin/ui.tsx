'use client';
/* The interactive bits of the admin pages: period / bot filters, auto refresh, theme switch and the forms. */
import { useActionState, useEffect, useRef, useState, useSyncExternalStore, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import type { FormState } from '@/app/(admin)/admin/actions';

/* ------------------------------------------------------------------ filters (kept in the URL) */

export function FilterBar({ path, ranges, range, bots, extra = {} }: { path: string; ranges: { key: string; label: string }[]; range: string; bots: boolean; extra?: Record<string, string> }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const href = (o: { range?: string; bots?: boolean }) => {
    const p = new URLSearchParams({ ...extra, range: o.range ?? range });
    if (o.bots ?? bots) p.set('bots', '1');
    return `${path}?${p}`;
  };
  return (
    <div className="ad-filters" aria-busy={pending}>
      <nav className="ad-seg" aria-label="期間">
        {ranges.map((r) => (
          <a key={r.key} href={href({ range: r.key })} aria-current={r.key === range ? 'true' : undefined}
            onClick={(e) => { e.preventDefault(); start(() => router.push(href({ range: r.key }), { scroll: false })); }}>{r.label}</a>
        ))}
      </nav>
      <label className="ad-check" title="クローラーや自動操作のブラウザー（ヘッドレス Chrome など）からのアクセスも数える">
        <input type="checkbox" checked={bots} onChange={(e) => start(() => router.push(href({ bots: e.target.checked }), { scroll: false }))} />
        ボットを含める
      </label>
    </div>
  );
}

/** reloads the figures every 30 s while the page is in view */
export function AutoRefresh({ every = 30_000 }: { every?: number }) {
  const router = useRouter();
  useEffect(() => {
    const t = setInterval(() => { if (document.visibilityState === 'visible') router.refresh(); }, every);
    return () => clearInterval(t);
  }, [router, every]);
  return null;
}

// the theme is html[data-theme] (set before the first paint by app/(admin)/layout.tsx)
const themeStore = {
  subscribe(cb: () => void) {
    const mo = new MutationObserver(cb);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => mo.disconnect();
  },
  get: () => document.documentElement.dataset.theme ?? 'light',
  server: () => null,
};

export function ThemeSwitch() {
  const theme = useSyncExternalStore(themeStore.subscribe, themeStore.get, themeStore.server);
  const flip = () => {
    const t = theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = t;
    try { localStorage.setItem('pp-admin-theme', t); } catch { /* private mode */ }
  };
  return (
    <button type="button" className="ad-side-btn" onClick={flip} aria-label="表示の明るさを切り替える">
      {theme === 'dark'
        ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="12" r="4.2" /><path d="M12 2.5v2M12 19.5v2M4.6 4.6l1.4 1.4M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4 6 18M18 6l1.4-1.4" /></svg>
        : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z" /></svg>}
      <span>{theme === 'dark' ? 'ライト表示' : 'ダーク表示'}</span>
    </button>
  );
}

/* ------------------------------------------------------------------ forms */

const Eye = ({ off }: { off: boolean }) => off
  ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M3 3l18 18M10.6 5.1A10 10 0 0 1 12 5c5 0 8.5 4.4 9.5 7-.4 1-1.2 2.3-2.4 3.5M6.6 6.6C4.5 8 3.1 10 2.5 12c1 2.6 4.5 7 9.5 7 1.7 0 3.2-.5 4.5-1.2" /><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" /></svg>
  : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M2.5 12C3.5 9.4 7 5 12 5s8.5 4.4 9.5 7c-1 2.6-4.5 7-9.5 7s-8.5-4.4-9.5-7z" /><circle cx="12" cy="12" r="3" /></svg>;

function Password({ name, label, autoComplete, autoFocus, onValue }: { name: string; label: string; autoComplete: string; autoFocus?: boolean; onValue?: (v: string) => void }) {
  const [show, setShow] = useState(false);
  return (
    <div className="ad-field">
      <label htmlFor={`f-${name}`}>{label}</label>
      <div className="pw">
        <input id={`f-${name}`} className="ad-input" name={name} type={show ? 'text' : 'password'} autoComplete={autoComplete} required autoFocus={autoFocus}
          spellCheck={false} autoCapitalize="off" onChange={(e) => onValue?.(e.target.value)} />
        <button type="button" onClick={() => setShow(!show)} aria-label={show ? 'パスワードを隠す' : 'パスワードを表示'}><Eye off={show} /></button>
      </div>
    </div>
  );
}

const strength = (s: string) => {
  if (!s) return 0;
  let n = 0;
  if (s.length >= 8) n++;
  if (s.length >= 12) n++;
  if (/[a-z]/.test(s) && /[A-Z]/.test(s)) n++;
  if (/\d/.test(s) && /[^A-Za-z0-9]/.test(s)) n++;
  return Math.max(1, Math.min(4, n));
};

export function PasswordForm({ action }: { action: (s: FormState, fd: FormData) => Promise<FormState> }) {
  const form = useRef<HTMLFormElement>(null);
  const [pw, setPw] = useState('');
  // a changed password empties the form
  const [state, run, pending] = useActionState(async (s: FormState, fd: FormData) => {
    const r = await action(s, fd);
    if (r?.ok) { form.current?.reset(); setPw(''); }
    return r;
  }, null);
  const lv = strength(pw);
  return (
    <form action={run} className="ad-form" ref={form}>
      <input type="text" name="username" autoComplete="username" value="admin" readOnly hidden />
      <Password name="current" label="現在のパスワード" autoComplete="current-password" />
      <div>
        <Password name="next" label="新しいパスワード（8 文字以上）" autoComplete="new-password" onValue={setPw} />
        <div className={`meter l${lv}`} aria-hidden="true"><i /><i /><i /><i /></div>
        <p className="ad-hint" style={{ marginTop: 6 }}>{pw ? ['', '弱い', 'ふつう', '強い', 'とても強い'][lv] + '：12 文字以上で、大文字・数字・記号を混ぜると強くなります。' : '12 文字以上で、大文字・数字・記号を混ぜると強くなります。'}</p>
      </div>
      <Password name="again" label="新しいパスワード（確認）" autoComplete="new-password" />
      {state?.error && <p className="ad-msg err" role="alert">{state.error}</p>}
      {state?.message && <p className="ad-msg ok" role="status">{state.message}</p>}
      <div><button className="ad-btn" disabled={pending}>{pending ? '変更しています…' : 'パスワードを変更'}</button></div>
    </form>
  );
}

export function PurgeForm({ action }: { action: (s: FormState, fd: FormData) => Promise<FormState> }) {
  const [state, run, pending] = useActionState(action, null);
  return (
    <form action={run} className="ad-form">
      <div className="ad-field">
        <label htmlFor="f-before">削除する範囲</label>
        <select id="f-before" name="before" className="ad-input" defaultValue="365">
          <option value="30">30 日より前の記録</option>
          <option value="90">90 日より前の記録</option>
          <option value="180">180 日より前の記録</option>
          <option value="365">1 年より前の記録</option>
          <option value="all">すべての記録</option>
        </select>
      </div>
      <div className="ad-field">
        <label htmlFor="f-confirm">確認のため「削除する」と入力</label>
        <input id="f-confirm" name="confirm" className="ad-input" autoComplete="off" placeholder="削除する" />
      </div>
      {state?.error && <p className="ad-msg err" role="alert">{state.error}</p>}
      {state?.message && <p className="ad-msg ok" role="status">{state.message}</p>}
      <div><button className="ad-btn danger" disabled={pending}>{pending ? '削除しています…' : '記録を削除'}</button></div>
    </form>
  );
}

/** a submit button that asks first (deleting a visitor) */
export function ConfirmButton({ children, message, className = 'ad-btn ghost sm' }: { children: React.ReactNode; message: string; className?: string }) {
  return <button className={className} onClick={(e) => { if (!confirm(message)) e.preventDefault(); }}>{children}</button>;
}
