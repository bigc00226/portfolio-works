/*
 * The parts of this video on top of the shared kit (shared/kit/kit.js) and the real WordPress screens
 * (shared/wordpress/wp-frame.js, js/wp-snapshot.js):
 *   - the tab icons: the dev site (http://localhost:8888) answers /favicon.ico with WordPress' own icon (no site icon is
 *     set); info.cookpad.com serves its own /favicon.ico (with the snapshot)
 *   - Chrome's link status bubble (bottom left of the page) when the pointer is over a link
 *   - states of the captured live pages (js/site-snapshot.js) for the moments the dev site differs from them:
 *       before1111     the video's day is 2026-11-06: the おしらせ of 2026-11-11 (scheduled in the video) is not out yet
 *       internalLinks  the list before the fix: every item links to its own page (the_permalink), in the same tab
 *       emptyArticle   the article page of an item that only has a 外部リンク (『野菜を健康的に食べる。…』): no body
 *       fallback       the theme's index.php for /news/category/publish before the list template exists (no 404)
 */
(function () {
  'use strict';
  const K = window.Kit, D = window.Demo;
  const ST = window.StoreFrame.STATES;
  const S = window.SITE_SNAPSHOT;

  K.Browser.FAV.wp = '<img class="br-fav img" src="../../shared/favicons/wordpress.png" alt="">';
  if (S && S.favicon) K.Browser.FAV.store = `<img class="br-fav img" src="${S.favicon}" alt="">`;

  const NEXT_TITLE = (window.NEWS_NEXT || {}).title || '『クックパッド 大根・白菜極みレシピ』発売！';
  const MARINE = '『野菜を健康的に食べる。ひと皿のマリネ』発売！';
  const MARINE_SLUG = '%e3%80%8e%e9%87%8e%e8%8f%9c%e3%82%92%e5%81%a5%e5%ba%b7%e7%9a%84%e3%81%ab%e9%a3%9f%e3%81%b9%e3%82%8b%e3%80%82%e3%81%b2%e3%81%a8%e7%9a%bf%e3%81%ae%e3%83%9e%e3%83%aa%e3%83%8d%e3%80%8f%e7%99%ba%e5%a3%b2';

  ST.before1111 = {
    on(doc) {
      doc.querySelectorAll('li.n').forEach((li) => {
        const a = li.querySelector('a');
        if (a && a.getAttribute('title') === NEXT_TITLE) { li.dataset.demoHidden = '1'; li.style.display = 'none'; }
      });
      const num = doc.querySelector('.block_number .num');
      if (num && !num.dataset.demoOrig) { num.dataset.demoOrig = num.textContent; num.textContent = String(+num.textContent - 1); }
    },
    off(doc) {
      doc.querySelectorAll('li.n[data-demo-hidden]').forEach((li) => { li.style.display = ''; delete li.dataset.demoHidden; });
      const num = doc.querySelector('.block_number .num');
      if (num && num.dataset.demoOrig) { num.textContent = num.dataset.demoOrig; delete num.dataset.demoOrig; }
    },
  };

  /** the slug WordPress makes from a title (sanitize_title: punctuation such as ！ dropped, the rest URL-encoded, lower case) */
  const slugOf = (title) => encodeURIComponent(title.replace(/[！!？?]/g, '').trim()).toLowerCase();
  ST.internalLinks = {
    on(doc) {
      doc.querySelectorAll('.list_news li.n > a').forEach((a) => {
        if (!a.dataset.demoHref) { a.dataset.demoHref = a.getAttribute('href'); a.dataset.demoTarget = a.getAttribute('target') || ''; a.dataset.demoRel = a.getAttribute('rel') || ''; }
        if (/^https?:/.test(a.dataset.demoHref)) a.setAttribute('href', '/news/' + (a.getAttribute('title') === MARINE ? MARINE_SLUG : slugOf(a.getAttribute('title'))));
        a.setAttribute('target', '_self');
        a.setAttribute('rel', '');
      });
    },
    off(doc) {
      doc.querySelectorAll('.list_news li.n > a[data-demo-href]').forEach((a) => {
        a.setAttribute('href', a.dataset.demoHref); a.setAttribute('target', a.dataset.demoTarget); a.setAttribute('rel', a.dataset.demoRel);
        delete a.dataset.demoHref;
      });
    },
  };

  ST.emptyArticle = {
    on(doc) {
      const h = doc.querySelector('#article_header h2'), body = doc.querySelector('#article_body .body');
      if (!h || !body) return;
      h.dataset.demoOrig = h.innerHTML; h.textContent = MARINE;
      const tags = doc.querySelector('#article_header ul.tags');
      tags.dataset.demoOrig = tags.innerHTML;
      tags.innerHTML = '<li><a href="/news/category/publish" title="出版"><span>出版</span></a></li>';
      const date = doc.querySelector('#article_header .date');
      date.dataset.demoOrig = date.textContent; date.textContent = '2026.04.21';
      body.dataset.demoOrig = body.innerHTML; body.innerHTML = '';
    },
    off(doc) {
      for (const sel of ['#article_header h2', '#article_header ul.tags', '#article_body .body']) { const e = doc.querySelector(sel); if (e && e.dataset.demoOrig != null) { e.innerHTML = e.dataset.demoOrig; delete e.dataset.demoOrig; } }
      const date = doc.querySelector('#article_header .date');
      if (date && date.dataset.demoOrig) { date.textContent = date.dataset.demoOrig; delete date.dataset.demoOrig; }
    },
  };

  ST.fallback = {
    on(doc) { const h = doc.querySelector('#main_inner > h1'); if (h) h.style.display = 'none'; },
    off(doc) { const h = doc.querySelector('#main_inner > h1'); if (h) h.style.display = ''; },
  };

  /* Chrome's status bubble: the address of the link under the pointer, bottom left of the page */
  function status(text) {
    let b = document.getElementById('cpStatus');
    if (!b) {
      b = document.createElement('div');
      b.id = 'cpStatus';
      b.className = 'cp-status';
      document.getElementById('stPage').appendChild(b);
    }
    if (text) b.textContent = text;
    b.classList.toggle('show', !!text);
  }
  /** the address Chrome shows for a link of the page (relative links on the page's own origin) */
  const linkUrl = (a, origin) => { const h = a.getAttribute('href') || ''; return /^https?:/.test(h) ? h : origin + (h.startsWith('/') ? h : '/' + h); };

  window.Cookpad = { status, linkUrl, MARINE, MARINE_SLUG, NEXT_TITLE };
  void D;
})();
