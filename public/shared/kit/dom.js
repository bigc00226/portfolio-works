/*
 * Builds the desktop of a Shopify production-process video from window.VIDEO (videos/<id>/js/config.js):
 * Chrome (Shopify admin look-alike, storefront, theme editor, DevTools), VS Code (explorer, editor, terminal),
 * the caption band, the Windows 11 taskbar, the HUD (pointer, key display, IME window, issue marker) and the title card.
 * Runs synchronously before shared/stage.js, shared/win11.js and shared/engine.js, which look these elements up.
 *
 * window.VIDEO = {
 *   id, title,                         document title
 *   start: '2026-06-09T10:12',         taskbar clock at 0:00
 *   steps: ['…', …],                   caption band steps (the chapters between the title card and the last scene)
 *   intro: { kicker, brand | logo, sub, url, steps: [...] },
 *   store: { name, handle, domain, initials, avatar },    the Shopify store (admin top bar, URLs)
 *   project: { name, path },           the VS Code workspace / terminal prompt
 *   pages: { key: '<html>' },          extra browser pages (video-specific apps)
 *   snapshot: { … }                    what tools/snapshot-store.js captures
 * }
 */
(function () {
  'use strict';
  const V = window.VIDEO || {};
  const esc = (s) => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const st = V.store || {};
  const pr = V.project || { name: 'project', path: 'C:\\dev\\project' };
  if (V.title) document.title = V.title;

  const NAV = [
    ['home', 'home', 'ホーム'],
    ['orders', 'inbox', '注文管理', [['drafts', '下書き'], ['abandoned', 'カゴ落ち']]],
    ['products', 'tag', '商品管理', [['collections', 'コレクション'], ['inventory', '在庫'], ['transfers', '在庫移動'], ['giftcards', 'ギフトカード']]],
    ['customers', 'user', '顧客管理', [['segments', 'セグメント'], ['companies', '会社']]],
    ['marketing', 'target', 'マーケティング'],
    ['discounts', 'percent', 'ディスカウント'],
    ['content', 'image', 'コンテンツ', [['metaobjects', 'メタオブジェクト'], ['files', 'ファイル'], ['menus', 'メニュー']]],
    ['markets', 'globe', 'マーケット', [['catalogs', 'カタログ']]],
    ['analytics', 'chart', 'ストア分析', [['reports', 'レポート'], ['live', 'ライブビュー']]],
  ];
  const navItem = ([k, ic, label, sub]) =>
    `<div class="sa-ni" data-nav="${k}"><i data-ic="${ic}"></i>${esc(label)}</div>` +
    (sub ? `<div class="sa-sub" data-sub="${k}">${sub.map(([sk, sl]) => `<div class="sa-si" data-nav="${k}/${sk}">${esc(sl)}</div>`).join('')}</div>` : '');
  const adminHtml = `
    <div class="sa" id="sa">
      <header class="sa-top">
        <span class="sa-mark"><img src="../../shared/logos/shopify.svg" alt="Shopify"></span>
        <div class="sa-search"><i data-icon="search"></i><span>検索</span><span class="k"><b>Ctrl</b><b>K</b></span></div>
        <span class="sp"></span>
        <span class="sa-bell"><i data-icon="bell"></i></span>
        <span class="sa-store"><span class="sa-av" style="${st.avatar ? `background:${esc(st.avatar)}` : ''}">${esc(st.initials || 'ST')}</span>${esc(st.name || 'ストア')}</span>
        <div class="sa-savebar" id="saSaveBar"><i data-icon="alert"></i><span id="saSaveText">保存されていない変更</span><span class="sp"></span><span class="sa-btn" id="saDiscard">破棄</span><span class="sa-btn pri" id="saSave">保存</span></div>
      </header>
      <div class="sa-frame">
        <nav class="sa-nav" id="saNav">
          ${NAV.map(navItem).join('')}
          <div class="sa-ng">販売チャネル<i data-icon="chevron-right"></i></div>
          <div class="sa-ni" data-nav="online"><i data-ic="store"></i>オンラインストア</div>
          <div class="sa-sub" data-sub="online"><div class="sa-si" data-nav="online/themes">テーマ</div><div class="sa-si" data-nav="online/blogs">ブログ記事</div><div class="sa-si" data-nav="online/pages">ページ</div><div class="sa-si" data-nav="online/navigation">ナビゲーション</div><div class="sa-si" data-nav="online/preferences">環境設定</div></div>
          <div class="sa-ni" data-nav="pos"><i data-ic="pos"></i>POS</div>
          <div class="sa-ng">アプリ<i data-icon="chevron-right"></i></div>
          <div class="sa-ni" data-nav="apps"><i data-ic="apps"></i>アプリ</div>
          <div class="sa-apps" id="saApps"></div>
          <div class="sa-ni sa-bottom" data-nav="settings"><i data-icon="settings"></i>設定</div>
        </nav>
        <main class="sa-main"><div class="sa-scroll" id="saScroll"><div id="saMain"></div></div>
          <div class="sa-ov" id="saOv"><div class="sa-md" id="saMd"></div></div>
          <div class="sa-toast" id="saToast"></div>
        </main>
      </div>
      <div class="sa-set" id="saSet">
        <div class="sa-set-top"><i data-icon="settings"></i>設定<span class="x" id="saSetX"><i data-icon="close"></i></span></div>
        <div class="sa-set-body"><nav class="sa-set-nav" id="saSetNav"></nav><div class="sa-set-main"><div class="sa-scroll" id="saSetScroll"><div id="saSetMain"></div></div></div></div>
      </div>
    </div>`;

  const editorHtml = `
    <div class="te" id="te">
      <header class="te-top">
        <span class="te-exit" id="teExit"><i data-ic="exit"></i></span>
        <span class="te-theme"><span id="teTheme">Theme</span><span class="sa-bd" id="teBadge">下書き</span><i data-icon="menu-dots"></i></span>
        <span class="te-pagesel" id="tePage"><i data-icon="home"></i><span id="tePageName">ホームページ</span><i data-icon="chevron-down"></i></span>
        <span class="te-dev" id="teDev"><span data-dev="pc" class="on"><i data-ic="desktop"></i></span><span data-dev="sp"><i data-icon="mobile"></i></span></span>
        <span class="sa-btn" id="teInspect"><i data-icon="inspect"></i></span>
        <span class="sa-btn pri" id="teSave">保存</span>
      </header>
      <div class="te-body">
        <aside class="te-side"><div class="te-side-h" id="teSideH">ホームページ</div><div class="te-tree" id="teTree"></div></aside>
        <div class="te-prev" id="tePrev"><div class="te-canvas" id="teCanvas"><div class="fit" id="teFit"><iframe id="teFrame" title="preview"></iframe></div></div><div class="te-hl" id="teHl"><b></b></div></div>
        <aside class="te-set" id="teSet"><div class="te-set-h" id="teSetH"></div><div class="te-set-b" id="teSetB"></div></aside>
      </div>
    </div>`;

  const storeHtml = `
    <div class="st-pc" id="stPc"><div class="st-fit" id="stFit"><iframe id="stFrame" title="${esc(st.domain || 'store')}"></iframe></div></div>
    <div class="st-dev"><div class="st-devbar">寸法: <b>iPhone 12 Pro</b><i data-icon="chevron-down"></i><span class="dv-num">390</span>×<span class="dv-num">844</span><span id="stZoom">100%</span><i data-icon="chevron-down"></i><span>スロットリングなし</span><i data-icon="chevron-down"></i></div>
      <div class="st-devscr" id="stDevScr"><iframe id="stSpFrame" title="${esc(st.domain || 'store')} (smartphone)"></iframe></div></div>`;

  const extra = Object.entries(V.pages || {}).map(([k, html]) => `<div class="br-page" data-page="${esc(k)}">${html}</div>`).join('');

  const browserHtml = `
    <section class="win max" id="win-browser" data-app="browser">
      <header class="br-tabsbar">
        <div class="br-tabs" id="brTabs"></div>
        <span class="br-newtab" id="brNewTab"><i data-icon="plus"></i></span>
        <span class="sp"></span>
        <span class="wc dark"><i data-icon="min"></i><i data-icon="max"></i><i data-icon="close"></i></span>
      </header>
      <div class="br-bar">
        <span class="br-nav" id="brBack"><i data-icon="arrow-left"></i></span><span class="br-nav off"><i data-icon="arrow-right"></i></span><span class="br-nav" id="brReload"><i data-icon="reload"></i></span>
        <div class="br-omni" id="brOmni"><i data-icon="info" id="brLock"></i><span class="br-url" id="brUrl"></span></div>
        <span class="br-nav"><i data-icon="star"></i></span><span class="br-nav"><i data-icon="puzzle"></i></span><span class="br-prof">K</span>
      </div>
      <div class="br-body" id="brBody">
        <div class="br-content" id="brContent">
          <div class="br-page" data-page="admin">${adminHtml}</div>
          <div class="br-page" data-page="store" id="stPage">${storeHtml}</div>
          <div class="br-page" data-page="editor">${editorHtml}</div>
          ${extra}
          <div class="br-page" data-page="blank"><div class="br-blank"><div class="br-blank-s"><i data-icon="search"></i>検索または URL を入力</div></div></div>
        </div>
        <div class="dt" id="devtools">
          <div class="dt-tabs"><span class="dt-ic" id="dtInspect"><i data-icon="inspect"></i></span><span class="dt-ic" id="dtDevice"><i data-icon="mobile"></i></span><span class="dt-sep"></span><span data-dt="elements">要素</span><span class="on" data-dt="console">コンソール</span><span data-dt="sources">ソース</span><span data-dt="network">ネットワーク</span><span data-dt="performance">パフォーマンス</span><span data-dt="lighthouse">Lighthouse</span><span class="sp"></span><span class="dt-errs" id="dtErrs"></span><span class="dt-ic"><i data-icon="settings"></i></span><span class="dt-ic"><i data-icon="menu-dots"></i></span><span class="dt-ic"><i data-icon="close"></i></span></div>
          <div class="dt-con" id="dtCon"></div>
        </div>
      </div>
    </section>`;

  const codeHtml = `
    <section class="win max hidden" id="win-code" data-app="code">
      <header class="vs-title">
        <span class="vs-logo"><img src="../../shared/icons/vscode.webp" alt="" width="16" height="16"></span>
        <nav class="vs-menu"><span>ファイル</span><span>編集</span><span>選択</span><span>表示</span><span>移動</span><span>実行</span><span>ターミナル</span><span>ヘルプ</span></nav>
        <div class="vs-cc"><span class="ci">&#xea9b;</span><span class="ci off">&#xea9c;</span><div class="vs-search"><span class="ci">&#xea6d;</span>${esc(pr.name)}</div><span class="ci vs-chat">&#xec1e;</span></div>
        <span class="vs-layout"><span class="ci">&#xebf3;</span><span class="ci">&#xec01;</span><span class="ci">&#xec00;</span><span class="ci">&#xebeb;</span></span>
        <span class="wc"><i data-icon="min"></i><i data-icon="max"></i><i data-icon="close"></i></span>
      </header>
      <div class="vs-body">
        <nav class="vs-activity">
          <span class="on"><i class="ci">&#xeaf0;</i></span><span><i class="ci">&#xea6d;</i></span>
          <span class="vs-git"><i class="ci">&#xea68;</i><b id="vsGitBadge"></b></span><span><i class="ci">&#xeb91;</i></span><span><i class="ci">&#xeae6;</i></span>
          <span class="sp"></span><span><i class="ci">&#xeb99;</i></span><span><i class="ci">&#xeb51;</i></span>
        </nav>
        <aside class="vs-side">
          <div class="vs-side-h">エクスプローラー<span class="ci">&#xea7c;</span></div>
          <div class="vs-root"><span class="ci">&#xeab4;</span><span class="vs-root-nm">${esc(pr.name.toUpperCase())}</span><span class="vs-root-acts" id="vsRootActs"><span class="ci" id="vsNewFile">&#xea7f;</span><span class="ci">&#xea80;</span><span class="ci">&#xeb37;</span><span class="ci">&#xeac5;</span></span></div>
          <div class="vs-tree" id="vsTree"></div>
          <div class="vs-secs"><div class="vs-sec"><span class="ci">&#xeab6;</span>アウトライン</div><div class="vs-sec"><span class="ci">&#xeab6;</span>タイムライン</div></div>
        </aside>
        <main class="vs-main">
          <div class="vs-tabs" id="vsTabs"></div>
          <div class="vs-crumbs" id="vsCrumbs"></div>
          <div class="vs-editor" id="vsEditor"><div class="vs-lines" id="vsLines"></div><canvas class="vs-mini" id="vsMini"></canvas><div class="vs-hbar" id="vsHbar"><i></i></div></div>
          <div class="vs-panel" id="vsPanel">
            <div class="vs-ptabs"><span>問題</span><span>出力</span><span>デバッグ コンソール</span><span class="on">ターミナル</span><span>ポート</span><span class="vs-pt-r"><span class="ci">&#xea60;</span><span class="ci">&#xeab4;</span><span class="vs-pt-sh">powershell</span><span class="ci">&#xea81;</span><span class="ci">&#xea7c;</span><span class="ci">&#xeab7;</span><span class="ci">&#xea76;</span></span></div>
            <div class="vs-term" id="vsTerm"></div>
          </div>
        </main>
      </div>
      <footer class="vs-status"><span class="vs-remote"><span class="ci">&#xeb3a;</span></span><span><span class="ci">&#xec6f;</span> <span id="vsBranch">main</span><span class="ci vs-sync">&#xea77;</span></span><span id="vsProblems"><span class="ci">&#xea87;</span> 0 <span class="ci">&#xea6c;</span> 0</span><span class="sp"></span><span id="vsPos">行 1、列 1</span><span id="vsIndent">スペース: 2</span><span id="vsEnc">UTF-8</span><span id="vsEol">LF</span><span class="vs-lang"><span class="ci">&#xeb0f;</span><span id="vsLang">Plain Text</span></span><span class="ci">&#xec1e;</span><span class="ci">&#xeaa2;</span></footer>
    </section>`;

  const steps = (V.steps || []).map((s, i) => `<span data-step="${i + 1}"><b>${i + 1}</b>${esc(s)}</span>`).join('');
  const intro = V.intro || {};
  const html = `
<div id="app">
  <div id="desk">
    ${browserHtml}
    ${codeHtml}
    <div class="notif" id="notif"><div class="notif-ic" id="notifIc"></div><div><b id="notifTitle"></b><p id="notifText"></p></div></div>
  </div>
  <div class="band" id="band">
    <div class="band-steps" id="bandSteps">${steps}</div>
    <div class="band-cap" id="caption"><span class="cap-chip" id="capChip"></span><span class="cap-text" id="capText"></span></div>
  </div>
  <footer id="taskbar" data-pins="${esc(V.pins || 'explorer edge chrome:browser vscode:code')}" data-open="${esc(V.open || 'browser')}" data-active="${esc(V.active || 'browser')}" data-start="${esc(V.start || '2026-06-01T10:00')}"></footer>
</div>
<div class="issue-box" id="issueBox"><span class="issue-lbl" id="issueLbl"></span></div>
<div class="keystrip" id="keystrip"><span class="ks-mode" id="ksMode">あ</span><span class="ks-keys" id="ksKeys"></span></div>
<div class="keycap" id="keycap"></div>
<div class="ime" id="ime"></div>
<div class="drag-ghost" id="ghost"></div>
<div class="cursor" id="cursor" data-kind="arrow"></div>
<div class="intro" id="intro">
  <div class="intro-in">
    ${intro.kicker ? `<div class="intro-kicker">${esc(intro.kicker)}</div>` : ''}
    <div class="intro-brand">${intro.logo ? `<img src="${esc(intro.logo)}" alt="${esc(intro.brand || '')}">` : esc(intro.brand || '')}</div>
    <div class="intro-sub">${esc(intro.sub || '')}</div>
    <div class="intro-url">${esc(intro.url || '')}</div>
    <ol class="intro-steps">${(intro.steps || V.steps || []).map((s, i) => `<li><b>${String(i + 1).padStart(2, '0')}</b>${esc(s)}</li>`).join('')}</ol>
  </div>
</div>
<div class="hint" id="hint"><b>Space</b> 再生 / 一時停止　<b>R</b> 最初から　<b>C</b> 字幕　<b>H</b> このヒントを隠す</div>
<div class="ff-cover" id="ffCover"><div><span class="spin"></span>準備中…（指定したシーンまで早送りしています）</div></div>`;
  document.body.insertAdjacentHTML('afterbegin', html);
})();
