// Checks that the reconstructed creator-mode source, with makeshop's outputs filled back in, equals the served page.
const fs = require('fs'), path = require('path'), vm = require('vm');
const root = path.resolve(__dirname, '../../../../public/videos/tabisuruwagashi');
const ctx = { window: {} }; vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(root, 'js/site-snapshot.js'), 'utf8'), ctx);
vm.runInContext(fs.readFileSync(path.join(root, 'js/template.js'), 'utf8'), ctx);
const S = ctx.window.SITE_SNAPSHOT, Tpl = ctx.window.Tpl;
const src = S.serverHtml.replace(/\r\n/g, '\n');
console.log('ok', Tpl.ok, 'top lines', Tpl.FINAL.top.split('\n').length, 'basic lines', Tpl.BASIC.top.split('\n').length, 'header', Tpl.FINAL.header.split('\n').length, 'footer', Tpl.FINAL.footer.split('\n').length);
// fill back
let t = Tpl.FINAL.top;
const T = Tpl.T;
const after = (s, a) => s.slice(s.indexOf(a) + a.length);
t = t.replace('<{$page.title}>', T.title).replace('<{$page.description}>', T.desc);
t = t.replace('<link rel="stylesheet" href="<{$page.css}>">', T.cssLine).replace('<script src="<{$page.javascript}>" defer></script>', T.jsLine);
const headOut = src.slice(src.indexOf('<!-- End Google Tag Manager -->') + 31, src.indexOf('</head>'));
t = t.replace('\n<{$makeshop.head}>\n</head>', headOut + '</head>');
t = t.replace('\n<{$makeshop.body_top}>\n', '\n\n');
t = t.replace('<{$module.header}>\n', Tpl.FINAL.header + '\n\n'.slice(0, src.slice(src.indexOf('<!-- ▼ヘッダー'), src.indexOf('<main')).length - Tpl.FINAL.header.length));
t = t.replace('<{$module.footer}>\n', src.slice(src.indexOf('<!--フッター-->'), src.indexOf('</div><!--/ l-wrapper -->')));
t = t.replace('            <{$shop.mainvisual}>', (src.match(/[ \t]*<ul id="M_slider">[\s\S]*?<\/ul>/) || [''])[0]);
t = t.replace('\n<{$makeshop.body_bottom}>\n</body>\n</html>', src.slice(src.indexOf('</div><!--/ l-wrapper -->') + 25).replace(/<\/body>\s*<\/html>\s*$/, '') + '');
// loops: replace with served lists
const served = (marker) => { const s = src.indexOf(marker); const u = src.indexOf('<ul class="p-product-list__list">', s); let d = 0, re = /<\/?ul\b/g, m; re.lastIndex = u; while ((m = re.exec(src))) { if (m[0] === '<ul') d++; else if (--d === 0) return src.slice(u, m.index); } };
const loopRange = (s, marker) => { const i = s.indexOf(marker); const u = s.indexOf('<ul class="p-product-list__list">', i); let d = 0, re = /<\/?ul\b/g, m; re.lastIndex = u; while ((m = re.exec(s))) { if (m[0] === '<ul') d++; else if (--d === 0) return [u, m.index]; } };
for (const mk of ['<!-- 新着アイテム -->', '<!-- 人気ランキング -->']) { const [a, b] = loopRange(t, mk); t = t.slice(0, a) + served(mk) + t.slice(b); }
const norm = (s) => s.replace(/\s+/g, ' ').trim();
const A = norm(t), B = norm(src.replace(/<\/body>\s*<\/html>\s*$/, ''));
console.log('equal (whitespace-normalized):', A === B.replace(/\s*$/, '') || A === B);
if (A !== B) { let i = 0; while (A[i] === B[i]) i++; console.log('diff at', i, '\nA:', A.slice(i - 200, i + 200), '\nB:', B.slice(i - 200, i + 200)); }
fs.writeFileSync(path.join(__dirname, 'final-top.html'), Tpl.FINAL.top);
fs.writeFileSync(path.join(__dirname, 'basic-top.html'), Tpl.BASIC.top);
