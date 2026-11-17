/*
 * The creator-mode source the demo builds, derived from what makeshop's server actually sends for the top page
 * (SITE_SNAPSHOT.serverHtml), so that rendering it gives exactly that page:
 *
 *   FINAL.header  モジュール「ヘッダー」 ($module.header)  = the header part of the page, as served
 *   FINAL.footer  モジュール「フッター」 ($module.footer)  = the footer part of the page, as served
 *   FINAL.top     ページ「トップ」HTML                     = the page with makeshop's outputs written as creator-mode
 *                                                         tags: page.title / page.description / page.css /
 *                                                         page.javascript / makeshop.head / body_top / body_bottom,
 *                                                         $module.*, $shop.mainvisual, and the 新着商品 / 人気ランキング
 *                                                         lists as <{section}> loops over $new_item / $ranking_item
 *   FINAL.commonCss / commonJs / topJs  = the shop's served page.css / page.javascript (全ページ共通 + トップ)
 *
 *   BASIC.*   the same design as it sits in the old (basic-mode) editor: no creator-mode tags — the text that is
 *             copied over and then converted on screen. Applying the scenario's edits to BASIC gives FINAL.
 *
 * The actual template source of the shop is not public; this is a reconstruction whose output matches the live page.
 */
(function () {
  const S = window.SITE_SNAPSHOT;
  const src = S.serverHtml.replace(/\r\n/g, '\n');
  const lines = (t) => t.split('\n');

  /** index of the </ul> closing the <ul> that starts at `at` */
  function closeUl(t, at) {
    const re = /<\/?ul\b/g;
    re.lastIndex = at;
    let depth = 0, m;
    while ((m = re.exec(t))) {
      if (m[0] === '<ul') depth++;
      else { depth--; if (depth === 0) return m.index; }
    }
    return -1;
  }
  function between(t, a, b) { const i = t.indexOf(a); const j = t.indexOf(b, i + a.length); return i >= 0 && j >= 0 ? [i, j] : null; }

  /* ------------------------------------------------------------------ split the served page */
  const P = {};
  P.headerStart = src.indexOf('<!-- ▼ヘッダー追加分のスタイル');
  if (P.headerStart < 0) P.headerStart = src.indexOf('<!--ヘッダー-->');
  P.main = src.indexOf('<main');
  P.footer = src.indexOf('<!--フッター-->');
  P.wrapEnd = src.indexOf('</div><!--/ l-wrapper -->');
  P.endGtm = src.indexOf('<!-- End Google Tag Manager -->');
  P.headEnd = src.indexOf('</head>');
  P.body = src.indexOf('<body');
  const ok = [P.headerStart, P.main, P.footer, P.wrapEnd, P.endGtm, P.headEnd, P.body].every((x) => x > 0);

  const header = ok ? src.slice(P.headerStart, P.main).replace(/\n+$/, '') : '';
  const footer = ok ? src.slice(P.footer, P.wrapEnd).replace(/\n+$/, '') : '';

  /* ------------------------------------------------------------------ the loops typed / pasted in the editor */
  const NEW_LI_RE = /\n[ \t]*<li class="p-product-list__item">[\s\S]*?<\/a>\s*<\/li>/;     // first item, as served
  const RANK_LI_RE = /\n[ \t]*<li class="p-product-list__item c-ranking-label-item">[\s\S]*?<\/a>\s*<\/li>/;

  const NEW = {
    open: '    <{section name=i loop=$new_item.list max=10}>',
    close: '    <{/section}>',
    url: '<{$new_item.list[i].url}>',
    img: '<{$new_item.list[i].image_L}>',
    name: '<{$new_item.list[i].name}>',
    maker: '<{$new_item.list[i].manufacturer}>',
    price: '<{$new_item.list[i].price|number_format}>',
    icons: '<{section name=j loop=$new_item.list[i].icon.list}><li><img src="<{$new_item.list[i].icon.list[j].image_url}>"></li><{/section}>',
    h2: '      <h2 class="c-heading--lev2"><span class="c-heading-en">new item</span><span class="c-heading-jp">新着商品</span></h2>',
  };
  const RANK_LOOP = [
    '    <{section name=i loop=$ranking_item.list max=10}>',
    '    <li class="p-product-list__item c-ranking-label-item">',
    '    <a href="<{$ranking_item.list[i].url}>" class="u-hover-opacity"',
    '   onclick="window.dataLayer = window.dataLayer || [];',
    '     window.dataLayer.push({',
    "       event: 'select_item',",
    '       ecommerce: {',
    '         items: [{',
    "           item_id: '',",
    "           item_name: '<{$ranking_item.list[i].name|escape:'javascript'}>',",
    '           price: <{$ranking_item.list[i].price}>,',
    "           item_brand: '<{$ranking_item.list[i].manufacturer}>',",
    "           item_category: 'ランキング',",
    '           index: <{$smarty.section.i.index}>',
    '         }]',
    '       }',
    '     });',
    '     setTimeout(() => { location.href = this.href; }, 300); return false;">',
    '      <figure class="p-product-list__img"><img src="<{$ranking_item.list[i].image_L}>" alt="<{$ranking_item.list[i].name}>" loading="lazy" decoding="async"></figure>',
    '      <span class="c-ranking-label"><{$smarty.section.i.iteration}></span>',
    '      <div class="p-product-list__info">',
    '        <p class="p-product-list__shop-name c-ellipsis">[<{$ranking_item.list[i].manufacturer}>]</p>        <p class="p-product-list__name c-ellipsis"><{$ranking_item.list[i].name}></p>',
    '        <{if !$ranking_item.list[i].is_soldout}>',
    '        <div class="p-product-list__price">',
    '          <span class="c-price"><{$ranking_item.list[i].price|number_format}><span class="c-tax">円（税込）</span></span>',
    '        </div>',
    '        <{/if}>',
    '        <ul class="p-product-list__pict c-pict">',
    '          <{section name=j loop=$ranking_item.list[i].icon.list}><li><img src="<{$ranking_item.list[i].icon.list[j].image_url}>"></li><{/section}>',
    '        </ul>',
    '        <div class="review-summary-container" data-gname="<{$ranking_item.list[i].system_code}>" data-pid="<{$ranking_item.list[i].system_code}>" data-group="true" data-popup="false" data-action="summary"></div>',
    '      </div>',
    '    </a>',
    '  </li>',
    '    <{/section}>',
  ].join('\n');

  /* ------------------------------------------------------------------ FINAL.top */
  let top = '', basicTop = '', basicNewLi = '';
  const T = {}; // anchors and values the scenario edits
  if (ok) {
    let head = src.slice(0, P.endGtm + '<!-- End Google Tag Manager -->'.length);
    T.title = (head.match(/<title>([^<]*)<\/title>/) || [])[1] || '';
    T.desc = (head.match(/<meta name="description" content="([^"]*)">/) || [])[1] || '';
    T.cssLine = (head.match(/<link rel="stylesheet" href="\/view\/asset\/user-[^"]+\.css">/) || [])[0] || '';
    T.jsLine = (head.match(/<script src="\/view\/asset\/user-[^"]+\.js" defer><\/script>/) || [])[0] || '';
    head = head.replace(`<title>${T.title}</title>`, '<title><{$page.title}></title>');
    head = head.replace(`<meta name="description" content="${T.desc}">`, '<meta name="description" content="<{$page.description}>">');
    head = head.replace(T.cssLine, '<link rel="stylesheet" href="<{$page.css}>">');
    head = head.replace(T.jsLine, '<script src="<{$page.javascript}>" defer></script>');
    head += '\n<{$makeshop.head}>\n</head>\n';

    let bodyStart = src.slice(P.body, P.headerStart);
    bodyStart = bodyStart.replace(/^(<body[^>]*>)\n\n/, '$1\n<{$makeshop.body_top}>\n');

    let main = src.slice(P.main, P.footer);
    // main visual (slides registered in the admin) -> $shop.mainvisual
    main = main.replace(/[ \t]*<ul id="M_slider">[\s\S]*?<\/ul>/, '            <{$shop.mainvisual}>');
    // 新着商品 / 人気ランキング -> loops
    const loopify = (t, marker, inner) => {
      const s = t.indexOf(marker);
      if (s < 0) return t;
      const u = t.indexOf('<ul class="p-product-list__list">', s);
      const e = closeUl(t, u);
      if (u < 0 || e < 0) return t;
      return t.slice(0, u) + '<ul class="p-product-list__list">\n' + inner + '\n' + t.slice(e);
    };
    const newServed = (() => { const s = main.indexOf('<!-- 新着アイテム -->'); const u = main.indexOf('<ul class="p-product-list__list">', s); return main.slice(u, closeUl(main, u)); })();
    const newLi = (newServed.match(NEW_LI_RE) || [''])[0].replace(/^\n/, '');
    const rankServed = (() => { const s = main.indexOf('<!-- 人気ランキング -->'); const u = main.indexOf('<ul class="p-product-list__list">', s); return main.slice(u, closeUl(main, u)); })();
    const rankLi = (rankServed.match(RANK_LI_RE) || [''])[0].replace(/^\n/, '');

    // the first new item, converted to tags (what the typing below produces)
    const val = {
      url: (newLi.match(/<a href="([^"]+)"/) || [])[1],
      img: (newLi.match(/<img src="([^"]+)"/) || [])[1],
      name: (newLi.match(/alt="([^"]*)"/) || [])[1],
      maker: (newLi.match(/shop-name c-ellipsis">\[([^\]]*)\]/) || [])[1],
      price: (newLi.match(/<span class="c-price">([^<]*)</) || [])[1],
      icons: (newLi.match(/<ul class="p-product-list__pict c-pict">\s*(<li>[\s\S]*?<\/li>)\s*<\/ul>/) || [])[1],
    };
    T.newVal = val;
    let li = newLi;
    li = li.replace(`<a href="${val.url}"`, `<a href="${NEW.url}"`);
    li = li.replace(`<img src="${val.img}" alt="${val.name}"`, `<img src="${NEW.img}" alt="${NEW.name}"`);
    li = li.replace(`">[${val.maker}]</p>`, `">[${NEW.maker}]</p>`);
    li = li.replace(`c-ellipsis">${val.name}</p>`, `c-ellipsis">${NEW.name}</p>`);
    li = li.replace(`<span class="c-price">${val.price}<`, `<span class="c-price">${NEW.price}<`);
    li = li.replace(val.icons, NEW.icons);
    T.newLiFinal = li;
    T.newLiBasic = newLi;
    T.rankLiBasic = rankLi;

    main = loopify(main, '<!-- 新着アイテム -->', NEW.open + '\n' + li + '\n' + NEW.close);
    main = loopify(main, '<!-- 人気ランキング -->', RANK_LOOP);

    top = head + bodyStart + '<{$module.header}>\n' + main + '<{$module.footer}>\n' + '</div><!--/ l-wrapper -->\n<{$makeshop.body_bottom}>\n</body>\n</html>';

    /* ---------------------------------------------------------------- BASIC.top (before conversion) */
    let b = top;
    b = b.replace('<link rel="stylesheet" href="<{$page.css}>">\n', '');
    b = b.replace('<script src="<{$page.javascript}>" defer></script>\n', '');
    b = b.replace('<title><{$page.title}></title>', `<title>${T.title}</title>`);
    b = b.replace('<meta name="description" content="<{$page.description}>">', `<meta name="description" content="${T.desc}">`);
    b = b.replace('\n<{$makeshop.head}>\n', '\n');
    b = b.replace('\n<{$makeshop.body_top}>\n', '\n\n');
    b = b.replace('\n<{$module.header}>\n', '\n');
    b = b.replace('\n<{$module.footer}>\n', '\n');
    b = b.replace('\n<{$makeshop.body_bottom}>\n', '\n');
    b = b.replace('            <{$shop.mainvisual}>\n', '');
    b = b.replace(NEW.h2 + '\n', '');
    b = b.replace(NEW.open + '\n' + li + '\n' + NEW.close, newLi);
    b = b.replace(RANK_LOOP, rankLi);
    basicTop = b;
    basicNewLi = newLi;
  }

  /* ------------------------------------------------------------------ header module: the 360px icon gap */
  const GAP = [
    '  /* スマホ：アイコンが1つ増えるため間隔を詰める（幅360pxでもロゴと重ならない） */',
    '  @media screen and (max-width: 767px) {',
    '    .p-header__menu-list { gap: 8px; }',
    '  }',
  ];
  const gapAt = lines(header).findIndex((l) => l.includes('スマホ：アイコンが1つ増える'));
  const basicHeader = gapAt >= 0 ? lines(header).filter((l, i) => i < gapAt || i >= gapAt + GAP.length).join('\n') : header;

  /* ------------------------------------------------------------------ CSS / JS (page.css / page.javascript) */
  const jsLines = lines(S.userJs || '');
  const split = Math.max(1, jsLines.findIndex((l) => /^document\.addEventListener\('DOMContentLoaded'/.test(l)));
  const commonJs = jsLines.slice(0, split).join('\n');
  const topJs = jsLines.slice(split).join('\n');
  const BASEURL = (topJs.match(/const baseUrl = '([^']+)';/) || [])[1] || 'https://www.tabisuruwagashi.com/blog/';

  /* ------------------------------------------------------------------ base template (Basics) defaults */
  const DEFAULT_TOP = [
    '<!doctype html>',
    '<html lang="ja" prefix="og: http://ogp.me/ns# fb: http://ogp.me/ns/fb#">',
    '<head>',
    '<meta charset="utf-8">',
    '<meta name="viewport" content="width=device-width,initial-scale=1">',
    '<title><{$page.title}></title>',
    '<meta name="description" content="<{$page.description}>">',
    '<link rel="canonical" href="<{$page.canonical_url}>">',
    '<meta property="og:type" content="website">',
    '<meta property="og:title" content="<{$page.title}>">',
    '<meta property="og:description" content="<{$page.description}>">',
    '<meta property="og:site_name" content="<{$shop.name}>">',
    '<link rel="stylesheet" href="<{$page.css}>">',
    '<script src="<{$page.javascript}>" defer></script>',
    '<{$makeshop.head}>',
    '</head>',
    '<body>',
    '<{$makeshop.body_top}>',
    '<div class="wrapper">',
    '  <header class="header">',
    '    <h1 class="header__logo"><a href="<{$url.top}>"><img src="<{$shop.logo_url}>" alt="<{$shop.name}>"></a></h1>',
    '  </header>',
    '  <main class="main">',
    '    <div class="mainvisual"><{$shop.mainvisual}></div>',
    '    <{if $new_item.has_item}>',
    '    <section class="top-section">',
    '      <h2 class="top-section__title">新着商品</h2>',
    '      <ul class="item-list">',
    '        <{section name=i loop=$new_item.list max=8}>',
    '        <li class="item-list__item">',
    '          <a href="<{$new_item.list[i].url}>">',
    '            <img src="<{$new_item.list[i].image_M}>" alt="<{$new_item.list[i].name}>">',
    '            <p class="item-list__name"><{$new_item.list[i].name}></p>',
    '          </a>',
    '          <p class="item-list__price"><{$new_item.list[i].price|number_format}>円(税込)</p>',
    '        </li>',
    '        <{/section}>',
    '      </ul>',
    '    </section>',
    '    <{/if}>',
    '  </main>',
    '  <footer class="footer">',
    '    <p class="footer__copyright"><{$shop.copyright}></p>',
    '  </footer>',
    '</div>',
    '<{$makeshop.body_bottom}>',
    '</body>',
    '</html>',
  ].join('\n');
  const DEFAULT_CSS = [
    '@charset "UTF-8";',
    '/* Basics */',
    ':root { --color-main: #333; --color-accent: #b5945b; }',
    'body { margin: 0; color: var(--color-main); font-family: "Noto Sans JP", sans-serif; }',
    '.wrapper { max-width: 1200px; margin: 0 auto; }',
    '.header { display: flex; align-items: center; justify-content: space-between; padding: 16px 20px; }',
    '.item-list { display: grid; grid-template-columns: repeat(4, 1fr); gap: 24px; list-style: none; padding: 0; }',
    '@media (max-width: 767px) { .item-list { grid-template-columns: repeat(2, 1fr); gap: 12px; } }',
  ].join('\n');

  window.Tpl = {
    ok,
    FINAL: { top, header, footer, commonCss: S.userCss || '', commonJs, topJs, topCss: '' },
    BASIC: {
      top: basicTop, header: basicHeader, footer, css: S.userCss || '',
      js: topJs.replace(`const baseUrl = '${BASEURL}';`, "const baseUrl = '/blog/';"),
    },
    DEFAULT: { top: DEFAULT_TOP, css: DEFAULT_CSS, js: '' },
    NEW, RANK_LOOP, GAP, T, BASEURL,
  };
})();
