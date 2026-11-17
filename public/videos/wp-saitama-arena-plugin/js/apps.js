/*
 * The parts of this video on top of the shared kit (shared/kit/kit.js) and the real WordPress screens
 * (shared/wordpress/wp-frame.js, js/wp-snapshot.js):
 *   - the tab icons: wp-admin of a site without a site icon → WordPress' own icon; the site's pages → the favicon the
 *     live theme declares (/img/favicon.ico, with the snapshot)
 *   - the home page's 「本日開催のイベント」 on the video's day (2026-11-13, a Friday): the live page was captured on
 *     another day; of its events the ones running on 11/13 by the site's own schedule stay (MYSTERY GATE and ある料理人が
 *     遺した謎 to 2027-03-31, the winter illumination from 2026-11-07); the one-day flea market of the capture day goes
 *   - the same list with the time zone mistake: 2026さいたまるしぇ (11/14–15 on the live schedule) a day early, drawn
 *     with the live list's markup, its picture and link as the live /schedule/ page has them
 *   - the terminal on a server (ssh): the bash prompt instead of PowerShell's
 */
(function () {
  'use strict';
  const K = window.Kit, D = window.Demo;
  const { esc } = D;
  const S = window.SITE_SNAPSHOT;

  K.Browser.FAV.wp = '<img class="br-fav img" src="../../shared/favicons/wordpress.png" alt="">';
  const fav = S && (S.favicon || (S.pages && S.pages.home && S.pages.home.favicon));
  K.Browser.FAV.store = `<img class="br-fav img" src="${esc(fav || 'assets/favicon.ico')}" alt="">`;

  const ON_1113 = [/MYSTERY GATE/, /ある料理人が遺した謎/, /If Snow～\s*$/];
  const WEEK = ['日', '月', '火', '水', '木', '金', '土'];
  window.StoreFrame.STATES.today13 = {
    on(doc) {
      const d = doc.querySelector('.daily-event_calender .target-date');
      if (d) d.textContent = `2026年 11月13日 ${WEEK[5]}曜日`;
      doc.querySelectorAll('.event-list .event-list_item').forEach((li) => {
        const t = (li.querySelector('.event-data_title') || li).textContent.trim();
        if (!ON_1113.some((re) => re.test(t))) li.remove();
      });
    },
    off() {},
  };
  // the picture of 2026さいたまるしぇ on the live /schedule/ page (with the snapshot)
  const schedule = S && S.pages && S.pages.schedule && S.pages.schedule.pc || '';
  const marche = (schedule.match(/<img[^>]+src="([^"]*marche[^"]*)"/) || [])[1] || '';
  window.StoreFrame.STATES.tzBug = {
    on(doc) {
      const list = doc.querySelector('.event-list');
      const first = list && list.querySelector('.event-list_item');
      if (!first) return;
      const li = first.cloneNode(true);
      const a = li.querySelector('a');
      if (a) a.setAttribute('href', 'https://visitsaitamacity.jp/events/5');
      const img = li.querySelector('img');
      if (img) { img.setAttribute('src', marche); img.setAttribute('alt', '2026さいたまるしぇ in さいたまクリテリウム'); }
      const t = li.querySelector('.event-data_title');
      if (t) t.textContent = '2026さいたまるしぇ in さいたまクリテリウム';
      li.dataset.demo = 'tzbug';
      list.appendChild(li);
    },
    off(doc) { doc.querySelectorAll('[data-demo="tzbug"]').forEach((n) => n.remove()); },
  };

  /** the terminal on a remote server (ssh): the bash prompt instead of PowerShell's */
  const LOCAL_PROMPT = K.Term.prompt;
  const Shell = {
    remote(user, host, dir = '~') { K.Term.prompt = `[${user}@${host} ${dir}]$ `; },
    cd(dir) { K.Term.prompt = K.Term.prompt.replace(/ [^ \]]+\]\$ $/, ` ${dir}]$ `); },
    local() { K.Term.prompt = LOCAL_PROMPT; },
  };

  window.AP = { Shell };
})();
