/*
 * The project as it appears in the code editor, plus a small syntax highlighter (VS Code "Dark+" colours).
 *
 * The site's repository is not public, so the source files are rebuilt from what production ships:
 *  - public/robots.txt, public/llms.txt, public/admin/config.yml, public/admin/index.html: the real files
 *  - component <style> blocks: the real CSS rules of each Astro component (grouped by their data-astro-cid scope,
 *    scope attribute removed, pretty-printed)
 *  - component markup (Header, Footer, HomeSections): the real rendered markup, de-scoped and pretty-printed,
 *    <picture> blocks written as the <Picture> component that renders them
 *  - src/data/schema.ts: the real JSON-LD @graph
 *  - Hero.astro / Base.astro / [...slug].astro / scripts: hand-written to produce exactly that output
 */
(function () {
  'use strict';
  const S = window.SITE_SNAPSHOT;
  const unlocal = (s) => s.replace(/assets\/(photos|logos)\//g, '/$1/');

  /* ------------------------------------------------------------- CSS by component */
  const CID = { dmqpwcec: 'Header', r2b4e7hz: 'LangSwitch', bbe6dxrz: 'Hero', nf35xw4x: 'HomeSections', sz7xmlte: 'Footer', '23gpu5da': 'Picture', fzx4jmue: 'page' };
  const pageCss = [...S.html.matchAll(/<style>([\s\S]*?)<\/style>/g)].map((m) => m[1]).join('');
  const blocks = window.SiteFrame.parseBlocks(Object.values(S.css).join('') + pageCss);
  function ownerOf(sel) {
    const m = sel.match(/data-astro-cid-([a-z0-9]+)/);
    if (!m) return 'global';
    return CID[m[1]] || 'other';
  }
  const fmtSel = (sel) => sel.replace(/\[data-astro-cid-[a-z0-9]+\]/g, '').split(/,(?![^(]*\))/).map((s) => s.trim()).join(',\n');
  const fmtAt = (sel) => sel.replace(/^@(media|supports)\s*/, '@$1 ').replace(/\(([a-z-]+):/g, '($1: ');
  function fmtDecls(body, pad) {
    const out = [];
    let depth = 0, cur = '';
    for (const ch of body) {
      if (ch === '(') depth++; else if (ch === ')') depth--;
      if (ch === ';' && !depth) { if (cur.trim()) out.push(cur.trim()); cur = ''; } else cur += ch;
    }
    if (cur.trim()) out.push(cur.trim());
    return out.map((d) => {
      const i = d.indexOf(':');
      return `${pad}${d.slice(0, i).trim()}: ${d.slice(i + 1).trim()};`;
    }).join('\n');
  }
  function cssFor(owner, base = '') {
    const out = [];
    const walk = (list, pad) => {
      for (const b of list) {
        if (b.children) {
          const inner = [];
          const save = out.length;
          walk(b.children, pad + '  ');
          const got = out.splice(save);
          if (got.length) out.push(`${pad}${fmtAt(b.sel)} {\n${got.join('\n\n')}\n${pad}}`);
          void inner;
          continue;
        }
        if (b.sel.startsWith('@')) {
          if (owner === 'global' && /^@keyframes/.test(b.sel)) out.push(`${pad}${b.sel} {\n${pad}  ${b.body.replace(/\}/g, '}\n' + pad + '  ').trim()}\n${pad}}`);
          continue;
        }
        if (ownerOf(b.sel) !== owner) continue;
        out.push(`${pad}${fmtSel(b.sel).split('\n').join('\n' + pad)} {\n${fmtDecls(b.body, pad + '  ')}\n${pad}}`);
      }
    };
    walk(blocks, base);
    return out.join('\n\n');
  }

  /* --------------------------------------------------- markup "decompiler" for display */
  const doc = new DOMParser().parseFromString(S.html, 'text/html');
  const VOID = new Set(['img', 'br', 'source', 'input', 'meta', 'link']);
  const INLINE = new Set(['a', 'span', 'br', 'b', 'strong', 'em', 'small', 'img', 'code']);
  function attrs(el) {
    return [...el.attributes].filter((a) => !a.name.startsWith('data-astro-cid')).map((a) => {
      if (a.value === '' && a.name === 'class') return '';
      if (a.value === '') return ' ' + a.name;
      return ` ${a.name}="${unlocal(a.value).replace(/"/g, '&quot;')}"`;
    }).join('');
  }
  const allInline = (el) => [...el.childNodes].every((c) => c.nodeType === 3 || (c.nodeType === 1 && INLINE.has(c.tagName.toLowerCase()) && allInline(c)));
  function inlineHtml(el, top = true) {
    return [...el.childNodes].map((c) => {
      if (c.nodeType === 3) return c.textContent.replace(/\s+/g, ' ');
      const t = c.tagName.toLowerCase();
      if (t === 'br') return '<br />';
      if (t === 'span' && c.classList.contains('lang')) return '<LangSwitch />';
      if (VOID.has(t)) return `<${t}${attrs(c)} />`;
      return `<${t}${attrs(c)}>${inlineHtml(c, false)}</${t}>`;
    }).join('')[top ? 'trim' : 'toString']();
  }
  function fmtNode(node, depth, out) {
    const pad = '  '.repeat(depth);
    if (node.nodeType === 3) { const t = node.textContent.replace(/\s+/g, ' ').trim(); if (t) out.push(pad + t); return; }
    if (node.nodeType !== 1) return;
    const tag = node.tagName.toLowerCase();
    if (tag === 'script' || tag === 'style') return;
    if (tag === 'picture') {
      const img = node.querySelector('img');
      out.push(`${pad}<Picture src="${unlocal(img.getAttribute('src')).replace(/\.jpg$/, '')}" alt="${img.getAttribute('alt')}" />`);
      return;
    }
    if (tag === 'span' && node.classList.contains('lang')) { out.push(pad + '<LangSwitch />'); return; }
    const open = `<${tag}${attrs(node)}>`;
    if (VOID.has(tag)) { out.push(pad + open.replace(/>$/, ' />')); return; }
    if (allInline(node)) {
      const inner = inlineHtml(node);
      if (pad.length + open.length + inner.length + tag.length + 3 <= 104) out.push(pad + open + inner + `</${tag}>`);
      else { out.push(pad + open); inner.split(/(?<=<br \/>)/).forEach((p) => out.push(pad + '  ' + p.trim())); out.push(`${pad}</${tag}>`); }
      return;
    }
    out.push(pad + open);
    node.childNodes.forEach((c) => fmtNode(c, depth + 1, out));
    out.push(`${pad}</${tag}>`);
  }
  function markup(els, depth = 0) { const out = []; els.forEach((el) => el && fmtNode(el, depth, out)); return out.join('\n'); }

  /* --------------------------------------------------------- JSON-LD -> TypeScript */
  function toTs(v, pad = '') {
    const p2 = pad + '  ';
    if (Array.isArray(v)) {
      if (v.every((x) => typeof x !== 'object')) {
        const one = '[' + v.map((x) => toTs(x)).join(', ') + ']';
        if (one.length < 80) return one;
      }
      return '[\n' + v.map((x) => p2 + toTs(x, p2)).join(',\n') + ',\n' + pad + ']';
    }
    if (v && typeof v === 'object') {
      const ks = Object.keys(v);
      return '{\n' + ks.map((k) => `${p2}${/^[A-Za-z_$][\w$]*$/.test(k) ? k : `'${k}'`}: ${toTs(v[k], p2)}`).join(',\n') + ',\n' + pad + '}';
    }
    if (typeof v === 'string') return `'${v.replace(/'/g, "\\'")}'`;
    return String(v);
  }
  let schemaObj = {};
  try { schemaObj = JSON.parse(S.jsonld); } catch (e) { console.warn('[demo] JSON-LD parse', e); }

  /* ------------------------------------------------------------------- files */
  const header = doc.querySelector('header.nav');
  const mnav = doc.querySelector('#mobile-nav');
  const homeSecs = [...doc.querySelectorAll('main > section')].filter((s) => s.hasAttribute('data-astro-cid-nf35xw4x'));
  const footer = doc.querySelector('footer.footer');
  const style = (owner) => `<style>\n${cssFor(owner, '  ')}\n</style>`;

  const F = {};
  F['astro.config.mjs'] = `import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  site: 'https://ne-auberge.jp',
  i18n: {
    defaultLocale: 'ja',
    locales: ['ja', 'en'],
    routing: { prefixDefaultLocale: false },
  },
  integrations: [
    sitemap({
      i18n: { defaultLocale: 'ja', locales: { ja: 'ja', en: 'en' } },
    }),
  ],
});
`;
  F['package.json'] = `{
  "name": "ne-auberge",
  "type": "module",
  "private": true,
  "scripts": {
    "dev": "astro dev",
    "build": "astro build",
    "preview": "astro preview"
  },
  "dependencies": {
    "@astrojs/sitemap": "^3.2.1",
    "astro": "^5.1.0"
  }
}
`;
  F['src/content.config.ts'] = `import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// Sveltia CMS (public/admin/config.yml) と同じフィールド定義
const pages = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/pages' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    heroImage: z.string().optional(),
  }),
});

export const collections = { pages };
`;
  F['src/pages/[...slug].astro'] = `---
import { getCollection } from 'astro:content';
import Base from '../layouts/Base.astro';
import Hero from '../components/Hero.astro';

export async function getStaticPaths() {
  const pages = await getCollection('pages', (p) => p.id.startsWith('ja/'));
  return pages.map((page) => {
    const slug = page.id.replace('ja/', '');
    return { params: { slug: slug === 'home' ? undefined : slug }, props: { page } };
  });
}

const { page } = Astro.props;
const isHome = !Astro.params.slug;
---
<Base title={page.data.title} description={page.data.description} image={page.data.heroImage}>
  <main class:list={[{ 'hero-page': isHome }]}>
    {isHome && <Hero lead="味わうために、泊まる。" sub="新潟・新発田、一日一組のオーベルジュ。" />}
    <section class="cta-band" data-reveal>
      <p class="cta-line">一組だけに、開かれる。</p>
      <a class="cta-reserve" href="/reserve">Reserve<span class="cta-arr"> →</span></a>
    </section>
  </main>
</Base>

${style('page')}
`;
  F['src/layouts/Base.astro'] = `---
import '../styles/global.css';
import Header from '../components/Header.astro';
import Footer from '../components/Footer.astro';
import { schema } from '../data/schema';

interface Props {
  title: string;
  description: string;
  image?: string;
  lang?: 'ja' | 'en';
}
const { title, description, image = '/photos/Ne_226_PR.jpg', lang = 'ja' } = Astro.props;
const site = 'https://ne-auberge.jp';
const path = Astro.url.pathname.replace('/en/', '/');
const ja = new URL(path, site).href;
const en = new URL('/en' + path, site).href;
const canonical = lang === 'ja' ? ja : en;
---
<!DOCTYPE html>
<html lang={lang}>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>{title}</title>
    <meta name="description" content={description} />
    <link rel="canonical" href={canonical} />
    <link rel="alternate" hreflang="ja" href={ja} />
    <link rel="alternate" hreflang="en" href={en} />
    <link rel="alternate" hreflang="x-default" href={ja} />
    <meta property="og:type" content="website" />
    <meta property="og:title" content={title} />
    <meta property="og:description" content={description} />
    <meta property="og:url" content={canonical} />
    <meta property="og:locale" content={lang === 'ja' ? 'ja_JP' : 'en_US'} />
    <meta property="og:locale:alternate" content={lang === 'ja' ? 'en_US' : 'ja_JP'} />
    <meta property="og:image" content={new URL(image, site).href} />
    <meta property="og:image:width" content="1920" />
    <meta property="og:image:height" content="1080" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content={title} />
    <meta name="twitter:description" content={description} />
    <script is:inline>try{if(sessionStorage.getItem('ne_intro_seen')){document.documentElement.classList.add('intro-seen')}else{sessionStorage.setItem('ne_intro_seen','1')}}catch(e){}</script>
  </head>
  <body>
    <Header />
    <slot />
    <Footer />
    <script>
      import '../scripts/reveal';
    </script>
  </body>
</html>
`;
  F['src/components/Hero.astro'] = `---
interface Props {
  lead: string;
  sub: string;
}
const { lead, sub } = Astro.props;

// AVIF → WebP → JPEG（image-set で対応ブラウザが選ぶ）
const set = (p: string) =>
  \`image-set(url("\${p}.avif") type("image/avif"), url("\${p}.webp") type("image/webp"), url("\${p}.jpg") type("image/jpeg"))\`;
const pc = ['/photos/Ne_226_PR', '/photos/Ne_222_PR', '/photos/Ne_0156'];
const sp = ['/photos/Ne_233_PR_m', '/photos/Ne_0157', '/photos/Ne_0038', '/photos/Ne_0173'];
const awards = [
  { href: '/news/architizer-2026', src: '/logos/architizer-winner-2026.png', alt: 'Architizer A+Awards 2026 Winner', h: '3.6rem' },
  { href: 'https://www.theaficionados.com/', src: '/logos/aficionados-white.png', alt: 'The Aficionados', h: '1.15rem', ext: true },
  { href: 'https://www.g-mark.org/gallery/winners/38418', src: '/logos/good-design.png', alt: 'Good Design Award 2026', h: '3.0rem', ext: true, plate: true },
];
---
<section
  class="hero photo intro"
  style={\`--hero-img:url(\${pc[0]}.jpg);--hero-img-set:\${set(pc[0])};--hero-img-m:url(\${sp[0]}.jpg);--hero-img-m-set:\${set(sp[0])}\`}
>
  <div class="kv-black" aria-hidden="true"></div>
  <div class="kv-slides pc" aria-hidden="true">
    {pc.map((p, i) => <div class={i === 0 ? 'on' : undefined} style={\`--kv:url(\${p}.jpg);--kv-set:\${set(p)}\`} />)}
  </div>
  <div class="kv-slides sp" aria-hidden="true">
    {sp.map((p, i) => <div class={i === 0 ? 'on' : undefined} style={\`--kv:url(\${p}.jpg);--kv-set:\${set(p)}\`} />)}
  </div>
  <div class="inner">
    <h1 class="lead lead-type" data-text={lead}>{lead}</h1>
    <script is:inline>document.currentScript.previousElementSibling.textContent = '';</script>
    <p class="sr-only">{sub}</p>
    <p class="sub kv-late">{sub}</p>
  </div>
  <div class="kv-awards kv-late">
    {awards.map((a) => (
      <a href={a.href} aria-label={a.alt} target={a.ext ? '_blank' : undefined} rel={a.ext ? 'noopener' : undefined}>
        <img class:list={['kv-award', { plate: a.plate }]} src={a.src} alt={a.alt} style={\`height:\${a.h}\`} loading="lazy" />
      </a>
    ))}
  </div>
</section>

<script>
  // 見出しを 1 文字ずつ表示 → サブコピーと受賞ロゴをフェードイン
  const lead = document.querySelector<HTMLElement>('.lead-type');
  if (lead) {
    const text = lead.getAttribute('data-text') ?? '';
    const late = document.querySelectorAll('.kv-late');
    const showLate = () => late.forEach((el) => el.classList.add('shown'));
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const seen = document.documentElement.classList.contains('intro-seen');
    if (reduce) {
      lead.textContent = text;
      showLate();
    } else {
      const chars = Array.from(text);
      let i = 0;
      setTimeout(() => {
        const timer = setInterval(() => {
          lead.textContent = chars.slice(0, ++i).join('');
          if (i >= chars.length) {
            clearInterval(timer);
            setTimeout(showLate, 300);
          }
        }, 105);
      }, seen ? 350 : 1150);
    }
  }

  // スライドショー（3 秒ごと）
  if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    document.querySelectorAll('.kv-slides').forEach((wrap) => {
      const slides = [...wrap.children];
      if (slides.length < 2) return;
      let cur = 0;
      setInterval(() => {
        slides[cur].classList.remove('on');
        cur = (cur + 1) % slides.length;
        slides[cur].classList.add('on');
      }, 3000);
    });
  }
</script>

${style('Hero')}
`;
  F['src/components/home/HomeSections.astro'] = `---
import Picture from '../Picture.astro';
---
${markup(homeSecs)}

${style('HomeSections')}
`;
  F['src/components/Header.astro'] = `---
import LangSwitch from './LangSwitch.astro';
---
${markup([header, mnav])}

<script>
  const btn = document.querySelector('.menu-btn');
  const panel = document.getElementById('mobile-nav');
  if (btn && panel) {
    const close = () => {
      btn.setAttribute('aria-expanded', 'false');
      panel.hidden = true;
      document.documentElement.classList.remove('mnav-open');
    };
    btn.addEventListener('click', () => {
      if (btn.getAttribute('aria-expanded') === 'true') return close();
      btn.setAttribute('aria-expanded', 'true');
      panel.hidden = false;
      document.documentElement.classList.add('mnav-open');
    });
    panel.addEventListener('click', (e) => {
      if ((e.target as Element).closest('a')) close();
    });
    window.addEventListener('keydown', (e) => e.key === 'Escape' && close());
  }
</script>

${style('Header')}
`;
  F['src/components/Footer.astro'] = `---
import LangSwitch from './LangSwitch.astro';
---
${markup([footer])}

${style('Footer')}
`;
  F['src/components/LangSwitch.astro'] = `---
const isEn = Astro.url.pathname.startsWith('/en');
---
<span class="lang">
  <a href="/" class={isEn ? '' : 'active'} hreflang="ja">JP</a>
  <a href="/en" class={isEn ? 'active' : ''} hreflang="en">EN</a>
</span>

${style('LangSwitch')}
`;
  F['src/components/Picture.astro'] = `---
interface Props {
  src: string; // 拡張子なし（/photos/Ne_0040）
  alt: string;
  loading?: 'lazy' | 'eager';
}
const { src, alt, loading = 'lazy' } = Astro.props;
---
<picture>
  <source type="image/avif" srcset={\`\${src}.avif\`} />
  <source type="image/webp" srcset={\`\${src}.webp\`} />
  <img src={\`\${src}.jpg\`} alt={alt} loading={loading} />
</picture>

${style('Picture')}
`;
  F['src/scripts/reveal.ts'] = `// スクロールで [data-reveal] をフェードイン／FV を過ぎたらヘッダーを表示
if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
if (!location.hash) window.scrollTo(0, 0);
window.addEventListener('pageshow', (e) => {
  if (e.persisted && !location.hash) window.scrollTo(0, 0);
});

const io = new IntersectionObserver(
  (entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-in');
        io.unobserve(entry.target);
      }
    }
  },
  { rootMargin: '0px 0px -12% 0px' },
);
for (const el of document.querySelectorAll('[data-reveal]')) io.observe(el);

const nav = document.querySelector('.nav-reveal');
if (nav) {
  const fixed = document.querySelector('.fixed-reserve.fr-reveal');
  const update = () => {
    const past = window.scrollY > window.innerHeight * 0.85;
    nav.classList.toggle('shown', past);
    fixed?.classList.toggle('shown', past);
  };
  update();
  window.addEventListener('scroll', update, { passive: true });
}
`;
  F['src/styles/global.css'] = cssFor('global') + '\n';
  F['src/data/schema.ts'] = `// 構造化データ（JSON-LD）— Base.astro の <head> に出力
export const schema = ${toTs(schemaObj)};
`;
  const home = S.pages[0];
  F['src/content/settings/site.json'] = `{
  "brand": "Né",
  "reservation": {
    "stay": {
      "provider": "CHILLNN",
      "url": "https://ne.booking.chillnn.com/ja/"
    },
    "dining": {
      "provider": "TableCheck",
      "url": "https://www.tablecheck.com/ja/ne-auberge/reserve/message"
    }
  },
  "cta": {
    "global": "ご予約",
    "local": {
      "stay": "宿泊を予約する",
      "cuisine": "レストランを予約する"
    }
  },
  "concierge": "concierge@ne-auberge.jp",
  "trust": {
    "fvWhisper": ""
  }
}
`;
  const md = (p) => `---
title: ${p.title}
description: ${p.description}
heroImage: /photos/Ne_226_PR.jpg
---
`;
  F['src/content/pages/ja/home.md'] = md(home.ja);
  F['src/content/pages/en/home.md'] = md(home.en);
  F['public/robots.txt'] = S.robots;
  F['public/llms.txt'] = S.llms;
  F['public/admin/config.yml'] = S.cmsConfig;
  F['public/admin/index.html'] = S.cmsIndex;

  /** explorer tree (folders open/closed at start) */
  const TREE = [
    ['.astro', 'dir', 0], ['node_modules', 'dir', 0],
    ['public', 'dir', 1], ['public/admin', 'dir', 1], ['public/admin/config.yml'], ['public/admin/index.html'],
    ['public/logos', 'dir', 0], ['public/photos', 'dir', 0], ['public/llms.txt'], ['public/robots.txt'],
    ['src', 'dir', 1], ['src/components', 'dir', 1], ['src/components/home', 'dir', 1], ['src/components/home/HomeSections.astro'],
    ['src/components/Footer.astro'], ['src/components/Header.astro'], ['src/components/Hero.astro'], ['src/components/LangSwitch.astro'], ['src/components/Picture.astro'],
    ['src/content', 'dir', 1], ['src/content/pages', 'dir', 0], ['src/content/settings', 'dir', 1], ['src/content/settings/site.json'],
    ['src/data', 'dir', 1], ['src/data/schema.ts'],
    ['src/layouts', 'dir', 1], ['src/layouts/Base.astro'],
    ['src/pages', 'dir', 1], ['src/pages/[...slug].astro'],
    ['src/scripts', 'dir', 0], ['src/styles', 'dir', 0], ['src/content.config.ts'],
    ['astro.config.mjs'], ['package.json'],
  ];

  /* ------------------------------------------------------------- highlighter */
  const langOf = (path) => {
    const ext = path.split('.').pop();
    if (path.endsWith('llms.txt')) return 'md';
    if (path.endsWith('robots.txt')) return 'robots';
    return { astro: 'astro', ts: 'ts', mjs: 'ts', css: 'css', json: 'json', yml: 'yaml', md: 'md', html: 'html' }[ext] || 'txt';
  };
  const TS_RE = /(\/\/.*$)|('(?:[^'\\]|\\.)*'?|"(?:[^"\\]|\\.)*"?|`(?:[^`\\]|\\.)*`?)|\b(import|from|export|return|if|else|for|of|in|await|as|default)\b|\b(const|let|var|function|async|interface|type|new|typeof|true|false|null|undefined|this)\b|\b(\d+(?:\.\d+)?)\b|([A-Za-z_$][\w$]*)(?=\s*\()|\b([A-Z][\w$]*)\b|([A-Za-z_$][\w$]*)|(=>|[{}()[\];,.:?=<>!&|+*/-])/g;
  function tsTokens(s, out) {
    let last = 0, m;
    TS_RE.lastIndex = 0;
    while ((m = TS_RE.exec(s))) {
      if (m.index > last) out.push([s.slice(last, m.index), '']);
      const cls = m[1] ? 't-com' : m[2] ? 't-str' : m[3] ? 't-ctl' : m[4] ? 't-kw' : m[5] ? 't-num' : m[6] ? 't-fn' : m[7] ? 't-type' : m[8] ? 't-var' : '';
      out.push([m[0], cls]);
      last = TS_RE.lastIndex;
      if (m[0] === '') TS_RE.lastIndex++;
    }
    if (last < s.length) out.push([s.slice(last), '']);
  }
  function exprTokens(s, i, out) {
    // s[i] === '{' : until the matching '}'
    let d = 0, j = i;
    for (; j < s.length; j++) { if (s[j] === '{') d++; else if (s[j] === '}') { d--; if (!d) break; } }
    out.push(['{', 't-br']);
    tsTokens(s.slice(i + 1, j), out);
    if (j < s.length) out.push(['}', 't-br']);
    return Math.min(j + 1, s.length);
  }
  function htmlTokens(s, st, out) {
    let i = 0;
    while (i < s.length) {
      if (st.tag) {
        const ws = s.slice(i).match(/^\s+/);
        if (ws) { out.push([ws[0], '']); i += ws[0].length; continue; }
        if (s.startsWith('/>', i)) { out.push(['/>', 't-pun']); i += 2; st.tag = false; continue; }
        if (s[i] === '>') { out.push(['>', 't-pun']); i++; st.tag = false; continue; }
        if (s[i] === '{') { i = exprTokens(s, i, out); continue; }
        if (s[i] === '"' || s[i] === "'") { const q = s[i]; const e = s.indexOf(q, i + 1); const j = e < 0 ? s.length : e + 1; out.push([s.slice(i, j), 't-str']); i = j; continue; }
        if (s[i] === '=') { out.push(['=', '']); i++; continue; }
        const a = s.slice(i).match(/^[^\s=>/{"']+/);
        if (a) { out.push([a[0], 't-attr']); i += a[0].length; continue; }
        out.push([s[i], '']); i++; continue;
      }
      if (s.startsWith('<!--', i)) { const e = s.indexOf('-->', i); const j = e < 0 ? s.length : e + 3; out.push([s.slice(i, j), 't-com']); i = j; continue; }
      const t = s.slice(i).match(/^(<\/?)([A-Za-z][\w.:-]*|!DOCTYPE)/);
      if (t) { out.push([t[1], 't-pun']); out.push([t[2], /^[A-Z]/.test(t[2]) && t[2] !== 'DOCTYPE' ? 't-ctag' : 't-tag']); i += t[0].length; st.tag = true; continue; }
      if (s[i] === '{') { i = exprTokens(s, i, out); continue; }
      const txt = s.slice(i).match(/^[^<{]+/);
      if (txt) { out.push([txt[0], '']); i += txt[0].length; continue; }
      out.push([s[i], '']); i++;
    }
  }
  function cssTokens(s, out) {
    const tr = s.trim();
    if (!tr) { out.push([s, '']); return; }
    if (/^\/\*/.test(tr)) { out.push([s, 't-com']); return; }
    if (tr.startsWith('@')) {
      const m = s.match(/^(\s*)(@[\w-]+)(.*)$/);
      out.push([m[1], '']); out.push([m[2], 't-ctl']);
      m[3].split(/(\([\w-]+|:|\d+(?:\.\d+)?(?:px|rem|em|%)?)/).forEach((p, k) => p && out.push([p, /^\(/.test(p) ? 't-prop' : /^\d/.test(p) ? 't-num' : '']));
      return;
    }
    const prop = s.match(/^(\s*)([\w-]+)(\s*:\s*)(.*?)(;?)$/);
    if (prop && !/[{,]\s*$/.test(tr)) {
      out.push([prop[1], '']); out.push([prop[2], prop[2].startsWith('--') ? 't-var' : 't-prop']); out.push([prop[3], '']);
      prop[4].split(/("[^"]*"|var\(|[\w-]+\(|-?\d*\.?\d+(?:px|rem|em|vh|vw|svh|s|ms|%|fr|deg)?\b|#[0-9a-fA-F]{3,8}\b|--[\w-]+|[(),])/).forEach((p) => {
        if (!p) return;
        let c = 't-str';
        if (/^"/.test(p)) c = 't-str';
        else if (/^[\w-]+\($/.test(p)) c = 't-fn';
        else if (/^-?\d|^\.\d/.test(p)) c = 't-num';
        else if (/^#/.test(p)) c = 't-str';
        else if (/^--/.test(p)) c = 't-var';
        else if (/^[(),\s]+$/.test(p)) c = '';
        out.push([p, c]);
      });
      out.push([prop[5], '']);
      return;
    }
    if (/^\s*\}/.test(s)) { out.push([s, '']); return; }
    s.split(/(\{)/).forEach((p) => p && out.push([p, p === '{' ? '' : 't-sel']));
  }
  function jsonTokens(s, out) {
    const re = /("(?:[^"\\]|\\.)*")(\s*:)?|(\b-?\d+(?:\.\d+)?\b)|\b(true|false|null)\b/g;
    let last = 0, m;
    while ((m = re.exec(s))) {
      if (m.index > last) out.push([s.slice(last, m.index), '']);
      if (m[1]) { out.push([m[1], m[2] ? 't-key' : 't-str']); if (m[2]) out.push([m[2], '']); }
      else if (m[3]) out.push([m[3], 't-num']);
      else out.push([m[4], 't-kw']);
      last = re.lastIndex;
    }
    if (last < s.length) out.push([s.slice(last), '']);
  }
  function yamlTokens(s, out) {
    const c = s.match(/^(\s*)(#.*)$/);
    if (c) { out.push([c[1], '']); out.push([c[2], 't-com']); return; }
    const parts = s.split(/(#.*$)/);
    const body = parts[0];
    const re = /([\w-]+)(\s*:)|("[^"]*"|'[^']*')|(\b\d+\b|\btrue\b|\bfalse\b)|(-\s)/g;
    let last = 0, m;
    while ((m = re.exec(body))) {
      if (m.index > last) out.push([body.slice(last, m.index), 't-str']);
      if (m[1]) { out.push([m[1], 't-kw']); out.push([m[2], '']); }
      else if (m[3]) out.push([m[3], 't-str']);
      else if (m[4]) out.push([m[4], 't-num']);
      else out.push([m[5], 't-pun']);
      last = re.lastIndex;
    }
    if (last < body.length) out.push([body.slice(last), 't-str']);
    if (parts[1]) out.push([parts[1], 't-com']);
  }
  function mdTokens(s, out) {
    if (/^#{1,6}\s/.test(s)) { out.push([s, 't-head']); return; }
    if (/^>/.test(s)) { out.push([s, 't-com']); return; }
    const b = s.match(/^(\s*[-*]\s)(.*)$/);
    let rest = s;
    if (b) { out.push([b[1], 't-bul']); rest = b[2]; }
    rest.split(/(\[[^\]]*\]\([^)]*\)|https?:\/\/\S+)/).forEach((p) => {
      if (!p) return;
      const l = p.match(/^\[([^\]]*)\]\(([^)]*)\)$/);
      if (l) { out.push(['[', '']); out.push([l[1], 't-str']); out.push(['](', '']); out.push([l[2], 't-link']); out.push([')', '']); }
      else if (/^https?:/.test(p)) out.push([p, 't-link']);
      else out.push([p, '']);
    });
  }
  function robotsTokens(s, out) {
    if (/^#/.test(s)) { out.push([s, 't-com']); return; }
    const m = s.match(/^([\w-]+)(:)(.*)$/);
    if (!m) { out.push([s, '']); return; }
    out.push([m[1], 't-kw']); out.push([m[2], '']); out.push([m[3], /https?:/.test(m[3]) ? 't-link' : 't-str']);
  }

  /** tokens for every line of a file: [[text, cls], ...][] */
  function highlight(lang, lines) {
    const res = [];
    let mode = lang === 'astro' ? 'html' : lang;
    let fence = 0;
    const st = { tag: false };
    for (let n = 0; n < lines.length; n++) {
      const s = lines[n];
      const out = [];
      if (lang === 'astro') {
        if (s.trim() === '---' && fence < 2) { fence++; mode = fence === 1 ? 'ts' : 'html'; out.push([s, 't-pun']); res.push(out); continue; }
        if (mode === 'html' && /^\s*<style>/.test(s)) { htmlTokens(s, st, out); mode = 'css'; res.push(out); continue; }
        if (mode === 'html' && /^\s*<script>\s*$/.test(s)) { htmlTokens(s, st, out); mode = 'tsx'; res.push(out); continue; }
        if (mode === 'css' && /^\s*<\/style>/.test(s)) { htmlTokens(s, st, out); mode = 'html'; res.push(out); continue; }
        if (mode === 'tsx' && /^\s*<\/script>/.test(s)) { htmlTokens(s, st, out); mode = 'html'; res.push(out); continue; }
      }
      const m = mode === 'tsx' ? 'ts' : mode;
      if (m === 'ts') tsTokens(s, out);
      else if (m === 'html') htmlTokens(s, st, out);
      else if (m === 'css') cssTokens(s, out);
      else if (m === 'json') jsonTokens(s, out);
      else if (m === 'yaml') yamlTokens(s, out);
      else if (m === 'md') mdTokens(s, out);
      else if (m === 'robots') robotsTokens(s, out);
      else out.push([s, '']);
      res.push(out);
    }
    return res;
  }

  window.CodeFiles = { files: F, tree: TREE, langOf, highlight, schemaObj, cssFor, markup };
})();
