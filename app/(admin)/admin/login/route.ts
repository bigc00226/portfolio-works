/*
 * The sign-in page of /admin — plain HTML from the server, with no React on it.
 *
 * Why not a React page: the form was a client component, and in some browsers it was drawn for about half a second and
 * then removed when the page's JavaScript took over (a browser extension or security software that rewrites
 * password forms makes React's hydration fail and redraw the page). Without React, nothing in the browser
 * redraws this page, and the form works even with JavaScript turned off.
 *
 *   GET  /admin/login            the form (already signed in → /admin)
 *   POST /admin/login            checks the password (lib/server/auth.ts: lockout after 8 misses, 7-day cookie);
 *                                right → 303 to `next`, wrong → the form again with the reason
 * The styles are the admin pages' own (app/(admin)/admin.css: the colours of both themes, the login card),
 * copied in so the page needs no other file.
 */
import { login, session } from '@/lib/server/auth';

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

/** only pages of /admin (never the sign-in page itself, never another site) */
const safeNext = (v: unknown) => {
  const s = typeof v === 'string' ? v : '';
  return s.startsWith('/admin') && !s.startsWith('/admin/login') && !s.includes('//') && !s.includes('\\') ? s : '/admin';
};

const CSS = `
:root, [data-theme="light"] { color-scheme: light; --page: #f3f4f7; --surface: #ffffff; --surface-3: #eef0f4; --line: rgba(11, 18, 32, .08); --line-2: rgba(11, 18, 32, .14);
  --ink: #0b0f19; --ink-2: #4b5160; --ink-3: #8a909c; --muted: #6b7180; --accent: #2a5bd7; --accent-soft: rgba(42, 91, 215, .1);
  --bad: #b42323; --bad-bg: rgba(208, 59, 59, .1); --shadow-lg: 0 18px 50px -18px rgba(16, 24, 40, .28); }
[data-theme="dark"] { color-scheme: dark; --page: #0b0e14; --surface: #151a24; --surface-3: #212838; --line: rgba(255, 255, 255, .07); --line-2: rgba(255, 255, 255, .13);
  --ink: #f0f1f4; --ink-2: #c3c8d2; --ink-3: #7f8797; --muted: #969dab; --accent: #6d95ff; --accent-soft: rgba(109, 149, 255, .14);
  --bad: #ff7b7b; --bad-bg: rgba(230, 103, 103, .16); --shadow-lg: 0 24px 60px -20px rgba(0, 0, 0, .7); }
* { box-sizing: border-box; }
html { -webkit-text-size-adjust: 100%; }
body { margin: 0; background: var(--page); color: var(--ink); font: 14px/1.6 "Segoe UI", "Hiragino Sans", "Hiragino Kaku Gothic ProN", "Yu Gothic UI", "Meiryo", system-ui, -apple-system, sans-serif; -webkit-font-smoothing: antialiased; }
button, input { font: inherit; color: inherit; }
.login { min-height: 100vh; display: grid; place-items: center; padding: 24px; background:
  radial-gradient(60% 50% at 20% 10%, color-mix(in srgb, var(--accent) 16%, transparent), transparent 70%),
  radial-gradient(50% 50% at 90% 90%, color-mix(in srgb, #22c1dc 12%, transparent), transparent 70%), var(--page); }
.login-card { width: min(400px, 100%); padding: 34px 32px 30px; border-radius: 20px; background: var(--surface); border: 1px solid var(--line); box-shadow: var(--shadow-lg); }
.brand { display: flex; align-items: center; gap: 11px; padding: 0 0 22px; }
.mark { width: 34px; height: 34px; border-radius: 10px; display: grid; place-items: center; background: linear-gradient(140deg, #4f7dff, #22c1dc); color: #fff; box-shadow: 0 8px 20px -8px rgba(79, 125, 255, .8); }
.mark svg { width: 18px; height: 18px; }
.brand b { display: block; font-size: 15px; color: var(--ink); letter-spacing: .01em; }
.brand small { display: block; font-size: 11px; color: var(--muted); letter-spacing: .08em; }
h1 { margin: 0 0 6px; font-size: 20px; }
.lead { margin: 0 0 22px; color: var(--muted); font-size: 13px; }
form { display: flex; flex-direction: column; gap: 14px; }
.field { display: flex; flex-direction: column; gap: 6px; }
.field label { font-size: 12.5px; font-weight: 600; color: var(--ink-2); }
.pw { position: relative; }
.pw input { width: 100%; height: 42px; padding: 0 44px 0 12px; border-radius: 10px; border: 1px solid var(--line-2); background: var(--surface); color: var(--ink); outline: none; transition: border-color .15s, box-shadow .15s; }
.pw input:focus { border-color: var(--accent); box-shadow: 0 0 0 4px var(--accent-soft); }
.pw button { position: absolute; right: 4px; top: 50%; translate: 0 -50%; width: 36px; height: 36px; border: 0; border-radius: 8px; background: transparent; color: var(--ink-3); cursor: pointer; display: grid; place-items: center; }
.pw button:hover { color: var(--ink); background: var(--surface-3); }
.pw button svg { width: 18px; height: 18px; }
.pw button .off, .pw.show button .on { display: none; }
.pw.show button .off { display: block; }
.msg { margin: 0; padding: 10px 12px; border-radius: 10px; font-size: 13px; font-weight: 500; background: var(--bad-bg); color: var(--bad); }
.btn { height: 44px; padding: 0 18px; border-radius: 10px; border: 0; background: var(--accent); color: #fff; font-weight: 700; cursor: pointer; transition: filter .15s, transform .1s; }
.btn:hover { filter: brightness(1.08); }
.btn:active { transform: translateY(1px); }
.btn:disabled { opacity: .55; cursor: default; }
:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
`;

// before the first paint: the theme chosen in the admin pages (the switch in the sidebar), else the system's
const THEME = "var d=document.documentElement,t;try{t=localStorage.getItem('pp-admin-theme')}catch(e){}if(t!=='light'&&t!=='dark')t=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';d.dataset.theme=t;";

// only niceties, the form works without them: show / hide the password, and a busy button while it is checked
const ENHANCE = `
var box=document.querySelector('.pw'),inp=box.querySelector('input'),eye=box.querySelector('button');
eye.hidden=false;
eye.addEventListener('click',function(){var s=inp.type==='password';inp.type=s?'text':'password';box.classList.toggle('show',s);eye.setAttribute('aria-label',s?'パスワードを隠す':'パスワードを表示');inp.focus();});
document.querySelector('form').addEventListener('submit',function(){var b=document.querySelector('.btn');setTimeout(function(){b.disabled=true;b.textContent='確認しています…';},0);});
`;

function page(next: string, error?: string) {
  return `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<meta name="color-scheme" content="light dark">
<title>ログイン — 管理画面</title>
<link rel="icon" href="/icon.svg">
<script>${THEME}</script>
<style>${CSS}</style>
</head>
<body>
<div class="login">
  <div class="login-card">
    <div class="brand">
      <span class="mark"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 18 9.5 11l4 4L20 6"/><path d="M15 6h5v5"/></svg></span>
      <div><b>Trust Portfolio</b><small>ANALYTICS</small></div>
    </div>
    <h1>管理画面にログイン</h1>
    <p class="lead">アクセス状況のダッシュボードを見るには、パスワードを入力してください。</p>
    <form method="post" action="/admin/login">
      <input type="hidden" name="next" value="${esc(next)}">
      <input type="text" name="username" autocomplete="username" value="admin" readonly hidden>
      <div class="field">
        <label for="f-password">パスワード</label>
        <div class="pw">
          <input id="f-password" name="password" type="password" autocomplete="current-password" required autofocus spellcheck="false" autocapitalize="off"${error ? ' aria-invalid="true" aria-describedby="f-error"' : ''}>
          <button type="button" aria-label="パスワードを表示" hidden>
            <svg class="on" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M2.5 12C3.5 9.4 7 5 12 5s8.5 4.4 9.5 7c-1 2.6-4.5 7-9.5 7s-8.5-4.4-9.5-7z"/><circle cx="12" cy="12" r="3"/></svg>
            <svg class="off" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M3 3l18 18M10.6 5.1A10 10 0 0 1 12 5c5 0 8.5 4.4 9.5 7-.4 1-1.2 2.3-2.4 3.5M6.6 6.6C4.5 8 3.1 10 2.5 12c1 2.6 4.5 7 9.5 7 1.7 0 3.2-.5 4.5-1.2"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/></svg>
          </button>
        </div>
      </div>
      ${error ? `<p class="msg" id="f-error" role="alert">${esc(error)}</p>` : ''}
      <button class="btn" type="submit">ログイン</button>
    </form>
  </div>
</div>
<script>${ENHANCE}</script>
</body>
</html>`;
}

const html = (body: string, status = 200) =>
  new Response(body, { status, headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store', 'x-robots-tag': 'noindex, nofollow', 'referrer-policy': 'same-origin', 'x-frame-options': 'DENY' } });

const go = (to: string) => new Response(null, { status: 303, headers: { location: to, 'cache-control': 'no-store' } });

export async function GET(req: Request) {
  const next = safeNext(new URL(req.url).searchParams.get('next'));
  if (await session()) return go(next);
  return html(page(next));
}

export async function POST(req: Request) {
  // a sign-in only from this site's own page (a form on another site cannot post here)
  const origin = req.headers.get('origin');
  const host = req.headers.get('x-forwarded-host') || req.headers.get('host');
  if (origin && host && new URL(origin).host !== host) return html(page('/admin', 'このページからログインしてください。'), 403);

  const fd = await req.formData().catch(() => null);
  const next = safeNext(fd?.get('next'));
  const r = await login(String(fd?.get('password') ?? ''));
  if (!r.ok) return html(page(next, r.error), 401);
  return go(next);
}
