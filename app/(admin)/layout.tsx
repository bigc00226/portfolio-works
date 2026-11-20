import type { Metadata, Viewport } from 'next';
import './admin.css';

// The admin pages have their own root layout (route group), like the list page and the player.
export const metadata: Metadata = {
  title: { default: '管理画面 — Trust Portfolio', template: '%s — 管理画面' },
  robots: { index: false, follow: false, nocache: true },
  icons: { icon: '/icon.svg' },
};
export const viewport: Viewport = { colorScheme: 'light dark' };

// the theme before the first paint: the saved choice (the switch in the sidebar), else the system's
const HEAD = "var d=document.documentElement,t;try{t=localStorage.getItem('pp-admin-theme')}catch(e){}if(t!=='light'&&t!=='dark')t=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';d.dataset.theme=t;";

// A watchdog outside React (plain ES5, before anything else): it keeps the page's JavaScript errors, and if the page is
// still blank 4 s after loading — React failed in this browser, e.g. an extension rewrote the page — it draws a panel
// with what went wrong (in plain DOM, so React cannot take it away) and sends it to the server log
// (app/(admin)/admin/client-error/route.ts). Errors on a page that did draw are sent too.
const WATCHDOG = `(function(){var errs=[],sent=0;
function add(m){if(errs.length<10)errs.push(String(m).slice(0,600))}
addEventListener('error',function(e){add((e.message||'error')+(e.filename?' @ '+e.filename.split('/').pop()+':'+e.lineno+':'+e.colno:''))});
addEventListener('unhandledrejection',function(e){var r=e.reason;add('Unhandled rejection: '+(r&&(r.stack||r.message)||r))});
function send(kind,n){if(sent)return;sent=1;try{var b=JSON.stringify({kind:kind,url:location.pathname+location.search,errors:errs,text:n,ua:navigator.userAgent});if(!(navigator.sendBeacon&&navigator.sendBeacon('/admin/client-error',new Blob([b],{type:'text/plain'}))))fetch('/admin/client-error',{method:'POST',body:b,keepalive:true})}catch(x){}}
function ext(){var o=[],a=document.documentElement.attributes,i;for(i=0;i<a.length;i++)if(!/^(lang|class|style|data-theme)$/.test(a[i].name))o.push('html['+a[i].name+']');var k=document.body?document.body.children:[];for(i=0;i<k.length;i++){var t=k[i].tagName.toLowerCase();if(t!=='script'&&t!=='div'&&t!=='next-route-announcer'&&t!=='template')o.push(t)}return o.join(', ')}
function check(){var b=document.body,n=b?(b.innerText||'').replace(/\\s/g,'').length:0;
if(n>=20){if(errs.length)send('error',n);return}
var x=ext();if(x)add('拡張機能などがページに追加した要素: '+x);
send('blank',n);
var p=document.createElement('div');p.setAttribute('role','alert');
p.style.cssText='position:fixed;inset:24px;z-index:2147483647;overflow:auto;padding:28px;border-radius:16px;background:#fff;color:#0b0f19;border:2px solid #d03b3b;font:14px/1.7 "Segoe UI","Yu Gothic UI",Meiryo,sans-serif;box-shadow:0 20px 60px rgba(0,0,0,.25)';
var h='<b style="font-size:18px">管理画面を表示できませんでした</b><p>このブラウザーで画面を描く処理が失敗しました。<b>拡張機能をオフにしたウィンドウ（シークレットウィンドウ：Ctrl + Shift + N）</b>で開くと表示できることがあります。下の内容はサーバーの記録にも送りました。</p><pre style="white-space:pre-wrap;word-break:break-all;background:#fbeaea;color:#b42323;padding:12px;border-radius:10px;font:12px/1.6 Consolas,monospace">';
for(var i=0;i<errs.length;i++)h+=errs[i].replace(/[&<>]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;'}[c]})+'\\n';
if(!errs.length)h+='（エラーの記録なし：ページの中身が空のまま）\\n';
h+=navigator.userAgent.replace(/[&<>]/g,'')+'</pre><button type="button" style="height:40px;padding:0 18px;border:0;border-radius:10px;background:#2a5bd7;color:#fff;font-weight:700;cursor:pointer" onclick="location.reload()">もう一度読み込む</button>';
p.innerHTML=h;document.documentElement.appendChild(p)}
addEventListener('load',function(){setTimeout(check,4000)})})();`;

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja" suppressHydrationWarning>
      <head><script dangerouslySetInnerHTML={{ __html: HEAD }} /><script dangerouslySetInnerHTML={{ __html: WATCHDOG }} /></head>
      <body>{children}</body>
    </html>
  );
}
